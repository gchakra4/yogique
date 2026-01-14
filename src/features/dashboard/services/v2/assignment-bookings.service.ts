import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResult } from './base.service';

export interface AssignResult {
  assignedCount: number;
  assigned: any[];
  skipped: { bookingId: string; reason: string }[];
}

export interface AvailableBookingsFilters {
  status?: string[];
  search?: string;
  recurringOnly?: boolean;
}

/**
 * AssignmentBookingsService
 * Responsibilities:
 * - Link bookings to containers (programs)
 * - Query assigned bookings and available bookings
 * - Unassign bookings
 *
 * Notes:
 * - Uses optimistic capacity checks. Caller may set `overrideCapacity` to bypass capacity block.
 */
export class AssignmentBookingsService extends BaseService {
  constructor(client?: SupabaseClient) {
    super(client);
  }

  async assignBookingsToContainer(
    containerId: string,
    bookingIds: string[],
    options?: { overrideCapacity?: boolean; performedBy?: string }
  ): Promise<ServiceResult<AssignResult>> {
    try {
      if (!containerId || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return { success: false, error: { code: 'INVALID_INPUT', message: 'Container and booking IDs required' } };
      }

      // Fetch container and capacity info
      const { data: container, error: cErr } = await this.client
        .from('class_containers')
        .select('id, capacity_total, capacity_booked, package_id')
        .eq('id', containerId)
        .maybeSingle();

      if (cErr) return this.handleError(cErr, 'assignBookingsToContainer: fetch container');
      if (!container) return { success: false, error: { code: 'CONTAINER_NOT_FOUND', message: 'Program not found' } };

      const capacityTotal: number | null = container.capacity_total ?? null;
      const capacityBooked: number = container.capacity_booked ?? 0;

      // Remove bookingIds already assigned to this container
      const { data: existing, error: exErr } = await this.client
        .from('assignment_bookings')
        .select('booking_id')
        .eq('container_id', containerId)
        .in('booking_id', bookingIds);

      if (exErr) return this.handleError(exErr, 'assignBookingsToContainer: fetch existing links');

      const alreadyAssigned = new Set((existing || []).map((r: any) => r.booking_id));
      const toAssign = bookingIds.filter(id => !alreadyAssigned.has(id));
      const skipped = bookingIds
        .filter(id => alreadyAssigned.has(id))
        .map(id => ({ bookingId: id, reason: 'ALREADY_ASSIGNED' }));

      if (toAssign.length === 0) {
        return this.success({ assignedCount: 0, assigned: [], skipped });
      }

      // Capacity check
      if (capacityTotal !== null && capacityTotal !== undefined && !options?.overrideCapacity) {
        const available = Math.max(0, capacityTotal - capacityBooked);
        if (toAssign.length > available) {
          return { success: false, error: { code: 'CAPACITY_EXCEEDED', message: `Would exceed capacity by ${toAssign.length - available} bookings` } };
        }
      }

      // Insert links
      const insertRows = toAssign.map(bookingId => ({ container_id: containerId, booking_id: bookingId, created_by: options?.performedBy || null }));

      const { data: inserted, error: insErr } = await this.client
        .from('assignment_bookings')
        .insert(insertRows)
        .select();

      if (insErr) return this.handleError(insErr, 'assignBookingsToContainer: insert links');

      // Update container booked count (best-effort increment)
      try {
        const increment = (inserted || []).length;
        if (increment > 0) {
          await this.client
            .from('class_containers')
            .update({ capacity_booked: (container.capacity_booked ?? 0) + increment })
            .eq('id', containerId);
        }
      } catch (updErr) {
        // non-fatal - log and continue
        console.warn('[AssignmentBookingsService] failed to update capacity_booked', updErr);
      }

      // Audit override if applicable
      if (options?.overrideCapacity) {
        try {
          await this.client.from('audit_logs').insert({
            action: 'booking_assignment_capacity_override',
            user_id: options.performedBy || null,
            resource_type: 'container',
            resource_id: containerId,
            metadata: { bookingIds: toAssign, containerCapacity: capacityTotal, capacityBooked },
          });
        } catch (auditErr) {
          console.warn('[AssignmentBookingsService] audit log failed', auditErr);
        }
      }

      return this.success({ assignedCount: (inserted || []).length, assigned: inserted || [], skipped });
    } catch (error) {
      return this.handleError(error, 'assignBookingsToContainer');
    }
  }

  async getBookingsForProgram(containerId: string): Promise<ServiceResult<any[]>> {
    try {
      const { data, error } = await this.client
        .from('assignment_bookings')
        .select(`booking_id, bookings(id, created_at, status, package_id, student_id), profiles:bookings!inner.student_id(id, full_name, email)`, )
        .eq('container_id', containerId)
        .order('created_at', { ascending: false });

      if (error) return this.handleError(error, 'getBookingsForProgram');
      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'getBookingsForProgram');
    }
  }

  async getProgramsForBooking(bookingId: string): Promise<ServiceResult<any[]>> {
    try {
      const { data, error } = await this.client
        .from('assignment_bookings')
        .select('container_id, class_containers(id, display_name, capacity_total, capacity_booked)')
        .eq('booking_id', bookingId);

      if (error) return this.handleError(error, 'getProgramsForBooking');
      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'getProgramsForBooking');
    }
  }

  async unassignBookingFromProgram(containerId: string, bookingId: string): Promise<ServiceResult<boolean>> {
    try {
      const { data: removed, error: remErr } = await this.client
        .from('assignment_bookings')
        .delete()
        .match({ container_id: containerId, booking_id: bookingId })
        .select();

      if (remErr) return this.handleError(remErr, 'unassignBookingFromProgram');

      // Decrement container booked count (best-effort)
      try {
        const decrement = (removed || []).length;
        if (decrement > 0) {
            await this.client
            .from('class_containers')
            .update({ capacity_booked: (this.client as any).raw ? (this.client as any).raw('GREATEST(coalesce(capacity_booked,0) - ?, 0)', [decrement]) : (undefined as any) })
            .eq('id', containerId);
        }
      } catch (updErr) {
        console.warn('[AssignmentBookingsService] failed to decrement capacity_booked', updErr);
      }

      return this.success(true);
    } catch (error) {
      return this.handleError(error, 'unassignBookingFromProgram');
    }
  }

  async getAvailableBookings(containerId: string, filters?: AvailableBookingsFilters): Promise<ServiceResult<any[]>> {
    try {
      // Fetch container to determine package match
      const { data: container, error: cErr } = await this.client
        .from('class_containers')
        .select('id, package_id')
        .eq('id', containerId)
        .maybeSingle();

      if (cErr) return this.handleError(cErr, 'getAvailableBookings: fetch container');
      if (!container) return { success: false, error: { code: 'CONTAINER_NOT_FOUND', message: 'Program not found' } };

      const packageId = container.package_id;

      // Base query: bookings matching package and not already assigned to this container
      let query = this.client
        .from('bookings')
        .select('id, created_at, status, package_id, student_id, recurring, starts_at')
        .eq('package_id', packageId)
        .neq('status', 'cancelled');

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.recurringOnly) {
        query = (query as any).eq('recurring', true);
      }

      if (filters?.search) {
        // simple ilike on id as fallback; improve later with joined profile search
        query = (query as any).ilike('id', `%${filters.search}%`);
      }

      const { data: bookings, error: bErr } = await query;
      if (bErr) return this.handleError(bErr, 'getAvailableBookings: fetch bookings');

      // Exclude those already linked to this container
      const bookingIds = (bookings || []).map((b: any) => b.id);
      if (bookingIds.length === 0) return this.success([]);

      const { data: linked, error: lErr } = await this.client
        .from('assignment_bookings')
        .select('booking_id')
        .eq('container_id', containerId)
        .in('booking_id', bookingIds);

      if (lErr) return this.handleError(lErr, 'getAvailableBookings: fetch linked');

      const linkedSet = new Set((linked || []).map((r: any) => r.booking_id));
      const available = (bookings || []).filter((b: any) => !linkedSet.has(b.id));

      return this.success(available);
    } catch (error) {
      return this.handleError(error, 'getAvailableBookings');
    }
  }
}

export default AssignmentBookingsService;
