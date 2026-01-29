import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResult } from './base.service';

export interface AssignResult {
  assignedCount: number;
  assigned: any[];
  skipped: { bookingId: string; reason: string }[];
  packageMismatches?: any[];
  assignmentsLinked?: number;
  totalLinksCreated?: number;
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
        .eq('class_container_id', containerId)
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

      // Validate bookings match container package
      const { data: bookingsToValidate, error: bookingErr } = await this.client
        .from('bookings')
        .select('booking_id, id, class_package_id')
        .in('booking_id', toAssign);

      if (bookingErr) return this.handleError(bookingErr, 'assignBookingsToContainer: validate bookings');

      const packageMismatches: any[] = [];
      const validToAssign: string[] = [];

      (bookingsToValidate || []).forEach((booking: any) => {
        if (booking.class_package_id !== container.package_id) {
          packageMismatches.push({
            bookingId: booking.booking_id,
            reason: `PACKAGE_MISMATCH: Booking package ${booking.class_package_id} does not match container package ${container.package_id}`
          });
          skipped.push({
            bookingId: booking.booking_id,
            reason: 'PACKAGE_MISMATCH'
          });
        } else {
          validToAssign.push(booking.booking_id);
        }
      });

      if (validToAssign.length === 0) {
        return {
          success: false,
          error: {
            code: 'PACKAGE_MISMATCH',
            message: 'No bookings match the container package',
            details: packageMismatches
          }
        };
      }

      // Capacity check
      if (capacityTotal !== null && capacityTotal !== undefined && !options?.overrideCapacity) {
        const available = Math.max(0, capacityTotal - capacityBooked);
        if (toAssign.length > available) {
          return { success: false, error: { code: 'CAPACITY_EXCEEDED', message: `Would exceed capacity by ${toAssign.length - available} bookings` } };
        }
      }

      // Insert links - Link booking to ALL assignments in the container
      // Get ALL class_assignments for this container (not just one)
      const { data: assignmentRows, error: asErr } = await this.client
        .from('class_assignments')
        .select('id')
        .eq('class_container_id', containerId)
        .order('date', { ascending: true });

      if (asErr) return this.handleError(asErr, 'assignBookingsToContainer: fetch assignments for container');
      if (!assignmentRows || assignmentRows.length === 0) {
        return { success: false, error: { code: 'NO_ASSIGNMENT', message: 'No class assignments found for this container. Create scheduled classes first.' } };
      }

      // Create assignment_bookings entries for EVERY validated booking × EVERY assignment combination
      const insertRows: any[] = [];
      for (const bookingId of validToAssign) {
        for (const assignment of assignmentRows) {
          insertRows.push({
            assignment_id: assignment.id,
            booking_id: bookingId,
            class_container_id: containerId
          });
        }
      }

      const { data: inserted, error: insErr } = await this.client
        .from('assignment_bookings')
        .insert(insertRows)
        .select();

      if (insErr) return this.handleError(insErr, 'assignBookingsToContainer: insert links');

      // Mark bookings as classes_assigned using bulk RPC so booking lifecycle is consistent
      // Use UUID 'id' field instead of text 'booking_id' field for RPC
      try {
        const bookingUUIDs = (bookingsToValidate || [])
          .filter((b: any) => validToAssign.includes(b.booking_id))
          .map((b: any) => b.id)
          .filter(Boolean);

        if (bookingUUIDs.length > 0) {
          console.log('[AssignmentBookingsService] Calling mark_bookings_classes_assigned with UUIDs:', bookingUUIDs);
          const { data: rpcResult, error: rpcErr } = await this.client.rpc('mark_bookings_classes_assigned', { p_booking_ids: bookingUUIDs });
          if (rpcErr) {
            console.error('[AssignmentBookingsService] mark_bookings_classes_assigned RPC error:', rpcErr);
          } else {
            console.log('[AssignmentBookingsService] Booking status update result:', rpcResult);
            try {
              // If RPC returned detailed results, log them for debugging
              if (rpcResult && rpcResult.results) console.log('[AssignmentBookingsService] RPC results detail:', rpcResult.results);
            } catch (e) {
              console.warn('[AssignmentBookingsService] Failed to parse rpcResult.results', e);
            }
          }
        }
      } catch (rpcErr) {
        console.error('[AssignmentBookingsService] mark_bookings_classes_assigned exception:', rpcErr);
      }

      // Note: Container capacity (current_booking_count, capacity_booked) is automatically updated
      // by the database trigger update_container_booking_count() when assignment_bookings rows are inserted.
      // No manual increment needed here to avoid double-counting.

      // Audit override if applicable
      if (options?.overrideCapacity) {
        try {
          await this.client.from('audit_logs').insert({
            action: 'booking_assignment_capacity_override',
            user_id: options.performedBy || null,
            resource_type: 'container',
            resource_id: containerId,
            metadata: { 
              bookingIds: toAssign, 
              containerCapacity: capacityTotal, 
              capacityBooked,
              assignmentsCount: assignmentRows.length,
              totalLinksCreated: insertRows.length
            },
          });
        } catch (auditErr) {
          console.warn('[AssignmentBookingsService] audit log failed', auditErr);
        }
      }

      return this.success({ 
        assignedCount: validToAssign.length,  // Number of unique students successfully assigned
        assigned: inserted || [], 
        skipped,
        packageMismatches,  // List of bookings that didn't match package
        assignmentsLinked: assignmentRows.length,  // How many classes they were linked to
        totalLinksCreated: insertRows.length  // Total assignment_bookings entries
      });
    } catch (error) {
      return this.handleError(error, 'assignBookingsToContainer');
    }
  }

  async getBookingsForProgram(containerId: string): Promise<ServiceResult<any[]>> {
    try {
      // The schema links bookings to assignments (assignment_bookings.assignment_id),
      // and assignments reference containers via class_assignments.container_id.
      // Steps: 1) fetch assignment ids for the container, 2) fetch assignment_bookings for those assignments,
      // 3) fetch bookings by booking_id and return combined results.

      const { data: assignments, error: aErr } = await this.client
        .from('class_assignments')
        .select('id, created_at')
        .eq('class_container_id', containerId);

      if (aErr) return this.handleError(aErr, 'getBookingsForProgram: fetch assignments');

      const assignmentIds = (assignments || []).map((r: any) => r.id);
      if (assignmentIds.length === 0) return this.success([]);

      const { data: links, error: lErr } = await this.client
        .from('assignment_bookings')
        .select('assignment_id, booking_id, created_at')
        .in('assignment_id', assignmentIds)
        .order('created_at', { ascending: false });

      if (lErr) return this.handleError(lErr, 'getBookingsForProgram: fetch links');

      const bookingIds = Array.from(new Set((links || []).map((r: any) => r.booking_id)));
      if (bookingIds.length === 0) return this.success([]);

      const { data: bookings, error: bErr } = await this.client
        .from('bookings')
        .select('booking_id, created_at, status, class_package_id, first_name, last_name, email')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (bErr) return this.handleError(bErr, 'getBookingsForProgram: fetch bookings');

      const bookingsMap = new Map((bookings || []).map((b: any) => [b.booking_id, b]));
      const result = (links || []).map((ln: any) => ({ assignment_id: ln.assignment_id, booking_id: ln.booking_id, created_at: ln.created_at, booking: bookingsMap.get(ln.booking_id) || null }));

      return this.success(result);
    } catch (error) {
      return this.handleError(error, 'getBookingsForProgram');
    }
  }

  async getProgramsForBooking(bookingId: string): Promise<ServiceResult<any[]>> {
    try {
      const { data, error } = await this.client
        .from('assignment_bookings')
        .select('class_container_id, class_containers(id, display_name, capacity_total, capacity_booked)')
        .eq('booking_id', bookingId);

      if (error) return this.handleError(error, 'getProgramsForBooking');
      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'getProgramsForBooking');
    }
  }
  
  /**
   * Attach bookings to specific assignment ids (not whole container).
   * Inserts rows into assignment_bookings for each assignment × booking combination,
   * then marks the booking status via RPC so bookings are no longer available for other programs.
   */
  async attachBookingsToAssignments(
    assignmentIds: string[],
    bookingIds: string[],
    containerId?: string | null
  ): Promise<ServiceResult<any>> {
    try {
      if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) return this.success([]);
      if (!Array.isArray(bookingIds) || bookingIds.length === 0) return this.success([]);

      const rows: any[] = [];
      for (const aId of assignmentIds) {
        for (const b of bookingIds) {
          if (!b) continue;
          rows.push({ assignment_id: aId, booking_id: b, class_container_id: containerId || null });
        }
      }

      if (rows.length === 0) return this.success([]);

      const { data, error } = await this.client.from('assignment_bookings').insert(rows).select();
      if (error) return this.handleError(error, 'attachBookingsToAssignments: insert');

      // Mark bookings as classes_assigned via bulk RPC (best-effort)
      try {
        const uniqueBookingIds = Array.from(new Set(bookingIds.filter(Boolean)));
        if (uniqueBookingIds.length > 0) {
          await this.client.rpc('mark_bookings_classes_assigned', { p_booking_ids: uniqueBookingIds });
        }
      } catch (rpcErr) {
        console.warn('[AssignmentBookingsService] mark_bookings_classes_assigned failed', rpcErr);
      }

      return this.success(data || []);
    } catch (error) {
      return this.handleError(error, 'attachBookingsToAssignments');
    }
  }

  async unassignBookingFromProgram(containerId: string, bookingId: string): Promise<ServiceResult<boolean>> {
    try {
      const { data: removed, error: remErr } = await this.client
        .from('assignment_bookings')
        .delete()
        .match({ class_container_id: containerId, booking_id: bookingId })
        .select();

      if (remErr) return this.handleError(remErr, 'unassignBookingFromProgram');

      // Note: Container capacity is automatically decremented by the database trigger
      // update_container_booking_count() when assignment_bookings rows are deleted.
      // No manual decrement needed here to avoid double-counting.

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
      // Exclude cancelled and already-assigned (`classes_assigned`) bookings by default
      // bookings table uses `class_package_id` for the package foreign key and `booking_id` as the PK
      let query = this.client
        .from('bookings')
        .select('booking_id, created_at, status, class_package_id, first_name, last_name, email, is_recurring')
        .eq('class_package_id', packageId)
        .neq('status', 'cancelled')
        .neq('status', 'classes_assigned');

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.recurringOnly) {
        query = (query as any).eq('is_recurring', true);
      }

      if (filters?.search) {
        // search by booking_id
        query = (query as any).ilike('booking_id', `%${filters.search}%`);
      }

      const { data: bookings, error: bErr } = await query;
      if (bErr) return this.handleError(bErr, 'getAvailableBookings: fetch bookings');

      // Exclude those already linked to this container
      const bookingIds = (bookings || []).map((b: any) => b.booking_id);
      if (bookingIds.length === 0) return this.success([]);

      const { data: linked, error: lErr } = await this.client
        .from('assignment_bookings')
        .select('booking_id')
        .eq('class_container_id', containerId)
        .in('booking_id', bookingIds);

      if (lErr) return this.handleError(lErr, 'getAvailableBookings: fetch linked');

      const linkedSet = new Set((linked || []).map((r: any) => r.booking_id));
      const available = (bookings || []).filter((b: any) => !linkedSet.has(b.booking_id));

      return this.success(available);
    } catch (error) {
      return this.handleError(error, 'getAvailableBookings');
    }
  }
}

export default AssignmentBookingsService;
