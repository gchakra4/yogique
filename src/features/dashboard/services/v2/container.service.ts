import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResult } from './base.service';

/**
 * Service responsible for CRUD operations on class_containers (Programs)
 * TODO: Wire actual types for CreateContainerInput, UpdateContainerInput, Container, ContainerDetail
 */
export class ContainerService extends BaseService {
  constructor(client?: SupabaseClient) {
    super(client);
  }

  async listContainers(params?: any): Promise<ServiceResult<{ containers: any[]; total: number }>> {
    try {
      const q = this.client.from('class_containers').select(
        `id, container_code, display_name, container_type, package_id, instructor_id, max_booking_count, current_booking_count, capacity_total, capacity_booked, status, is_active, start_date, end_date, created_at`
      );

      // Apply basic filters
      if (params) {
        if (params.isActive !== undefined) q.eq('is_active', params.isActive);
        if (params.packageId) q.eq('package_id', params.packageId);
        if (params.instructorId) q.eq('instructor_id', params.instructorId);
        if (params.containerType) q.eq('container_type', params.containerType);
        if (params.status) q.eq('status', params.status);
      }

      // Ordering and limit defaults
      q.order('created_at', { ascending: false }).limit(100);

      const { data, error } = await q;
      if (error) return this.handleError(error, 'listContainers');

      const containers = (data || []).map((row: any) => ({
        ...row,
        // normalize capacity fields for consumers
        capacity_total: row.capacity_total ?? row.max_booking_count ?? null,
        capacity_booked: row.capacity_booked ?? row.current_booking_count ?? 0,
      }));

      return this.success({ containers, total: containers.length });
    } catch (error) {
      return this.handleError(error, 'listContainers');
    }
  }

  async getContainer(id: string): Promise<ServiceResult<any>> {
    try {
      // TODO: Fetch container with related package, instructor and assignments
      return this.success(null as any);
    } catch (error) {
      return this.handleError(error, 'getContainer');
    }
  }

  async createContainer(data: any): Promise<ServiceResult<any>> {
    try {
      // Validate package
      const pkgResult = await this.validatePackage(data.package_id);
      if (!pkgResult.success) return pkgResult as ServiceResult<any>;
      const pkg = pkgResult.data;

      // Validate instructor (optional)
      if (data.instructor_id) {
        const instrResult = await this.validateInstructor(data.instructor_id);
        if (!instrResult.success) return instrResult as ServiceResult<any>;
      }

      // Capacity validation based on package.type
      const capacityCheck = this.validateCapacity(pkg.type, data.capacity_total);
      if (!capacityCheck.success) return capacityCheck as ServiceResult<any>;

      // Date validation
      if (data.start_date && data.end_date) {
        if (new Date(data.start_date) >= new Date(data.end_date)) {
          return { success: false, error: { code: 'INVALID_DATES', message: 'Start date must be before end date' } };
        }
      }

      // Generate unique container code
      const code = await this.generateContainerCode();

      // Display name: user-provided wins, otherwise generate
      const displayName = data.display_name?.trim() || await this.generateDisplayName(data.package_id, data.instructor_id || null);

      // Determine timezone: provided -> instructor -> default
      let timezone = data.timezone || null;
      if (!timezone && data.instructor_id) {
        timezone = await this.getInstructorTimezone(data.instructor_id);
      }
      timezone = timezone || 'Asia/Kolkata';

      // Map package type to container_type and booking capacity fields
      const pkgType = (pkg && pkg.type) ? pkg.type : null;
      let container_type = 'public_group';
      let max_booking_count: number | null = null;

      if (pkgType === 'Individual') {
        container_type = 'individual';
        max_booking_count = 1;
      } else if (pkgType === 'Public Group') {
        container_type = 'public_group';
        max_booking_count = data.capacity_total ?? null;
      } else if (pkgType === 'Private Group') {
        container_type = 'private_group';
        max_booking_count = data.capacity_total ?? null;
      } else {
        // Fallback
        container_type = 'public_group';
        max_booking_count = data.capacity_total ?? null;
      }

      const insertPayload: any = {
        container_code: code,
        package_id: data.package_id,
        display_name: displayName,
        instructor_id: data.instructor_id || null,
        timezone,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        // DB schema uses container_type / max_booking_count / current_booking_count
        container_type,
        max_booking_count: max_booking_count,
        current_booking_count: 0,
        // Keep capacity_* fields for compatibility with other code paths
        capacity_total: data.capacity_total ?? max_booking_count ?? null,
        capacity_booked: 0,
        status: data.status || 'draft',
        is_active: true,
        created_by: data.created_by || null,
      };

      const { data: created, error } = await this.client
        .from('class_containers')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('[ContainerService] createContainer error:', error);
        return {
          success: false,
          error: { code: 'CREATE_FAILED', message: 'Failed to create program', details: error },
        };
      }

      return { success: true, data: created };
    } catch (error) {
      return this.handleError(error, 'createContainer');
    }
  }

  async updateContainer(id: string, data: any): Promise<ServiceResult<any>> {
    try {
      // TODO: Validate update rules, optimistic locking
      return this.success(null as any);
    } catch (error) {
      return this.handleError(error, 'updateContainer');
    }
  }

  async deleteContainer(id: string): Promise<ServiceResult<void>> {
    try {
      // TODO: Soft delete logic, check active bookings
      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'deleteContainer');
    }
  }

  private async generateContainerCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `PROG-${datePart}-${suffix}`;

      const { data: existing, error } = await this.client
        .from('class_containers')
        .select('id')
          .eq('container_code', code)
        .maybeSingle();

      if (error) {
        // Log and try again
        console.warn('[ContainerService] code uniqueness check failed, retrying', error);
        continue;
      }

      if (!existing) return code;
      // else collision, retry
    }

    throw new Error('Failed to generate unique container code');
  }

  private async generateDisplayName(packageId: string, instructorId: string | null): Promise<string> {
    // Fetch package name
    const { data: pkg, error: pkgErr } = await this.client
      .from('class_packages')
      .select('name')
      .eq('id', packageId)
      .single();

    if (pkgErr || !pkg) {
      throw new Error('Package not found');
    }

    let instructorName = 'Unassigned';
    if (instructorId) {
      const { data: instr } = await this.client
        .from('profiles')
        .select('full_name, first_name, last_name')
        .eq('id', instructorId)
        .maybeSingle();

      if (instr) {
        instructorName = instr.full_name || `${instr.first_name || ''} ${instr.last_name || ''}`.trim() || 'Unknown Instructor';
      }
    }

    return `${pkg.name} - ${instructorName}`;
  }

  private async validatePackage(packageId: string): Promise<ServiceResult<any>> {
    const { data, error } = await this.client
      .from('class_packages')
      .select('id, name, type, is_active')
      .eq('id', packageId)
      .single();

    if (error || !data) {
      return { success: false, error: { code: 'PACKAGE_NOT_FOUND', message: 'Package not found' } };
    }

    if (!data.is_active) {
      return { success: false, error: { code: 'PACKAGE_INACTIVE', message: 'Package is not active' } };
    }

    return { success: true, data };
  }

  private async validateInstructor(instructorId: string): Promise<ServiceResult<any>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', instructorId)
      .single();

    if (error || !data) {
      return { success: false, error: { code: 'INSTRUCTOR_NOT_FOUND', message: 'Instructor not found' } };
    }

    if (!['instructor', 'admin', 'super_admin'].includes(data.role)) {
      return { success: false, error: { code: 'INVALID_INSTRUCTOR', message: 'User is not an instructor' } };
    }

    return { success: true, data };
  }

  private async getInstructorTimezone(instructorId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('instructor_availability')
      .select('timezone')
      .eq('instructor_id', instructorId)
      .maybeSingle();

    if (error || !data) return null;
    return data.timezone || null;
  }

  private validateCapacity(packageType: string, capacityTotal?: number | null): ServiceResult<void> {
    if (packageType === 'Individual') {
      if (capacityTotal !== null && capacityTotal !== undefined) {
        return { success: false, error: { code: 'INVALID_CAPACITY', message: 'Individual programs cannot have capacity' } };
      }
    } else if (packageType === 'Public Group' || packageType === 'Private Group') {
      if (!capacityTotal || capacityTotal <= 0) {
        return { success: false, error: { code: 'CAPACITY_REQUIRED', message: 'Group programs must have a capacity greater than 0' } };
      }
    }
    return { success: true };
  }
}
