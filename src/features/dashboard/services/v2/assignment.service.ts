import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResult } from './base.service';

/**
 * AssignmentService - manage class_assignments
 */
export class AssignmentService extends BaseService {
  constructor(client?: SupabaseClient) {
    super(client);
  }

  async listAssignments(params: { containerId: string; startDate?: string; endDate?: string; status?: string; limit?: number }): Promise<ServiceResult<any[]>> {
    try {
      // TODO: Implement query with instructor join
      return this.success([]);
    } catch (error) {
      return this.handleError(error, 'listAssignments');
    }
  }

  async createAssignment(data: any): Promise<ServiceResult<any>> {
    try {
      // Basic validation
      if (!data.container_id) throw new Error('container_id is required');
      if (!data.class_date) throw new Error('class_date is required');
      if (!data.start_time) throw new Error('start_time is required');
      if (!data.end_time) throw new Error('end_time is required');

      // Ensure either scheduled_class_id OR class_package_id exists per DB constraint
      let class_package_id = data.class_package_id || data.package_id || null;
      const scheduled_class_id = data.scheduled_class_id || null;
      if (!class_package_id && !scheduled_class_id) {
        // try to derive package from container
        try {
          const { data: container, error: cErr } = await this.client
            .from('class_containers')
            .select('id, package_id')
            .eq('id', data.container_id)
            .maybeSingle();
          if (!cErr && container && container.package_id) {
            class_package_id = container.package_id;
          }
        } catch (e) {
          // ignore and validate below
        }
      }
      if (!class_package_id && !scheduled_class_id) {
        return { success: false, error: { code: 'MISSING_PACKAGE_OR_SCHEDULE', message: 'Either class_package_id (package) or scheduled_class_id must be provided' } };
      }

      const payload: any = {
        class_container_id: data.container_id,
        date: data.class_date,
        start_time: data.start_time,
        end_time: data.end_time,
        timezone: data.timezone || null,
        instructor_id: data.instructor_id || null,
        class_status: data.status || 'scheduled',
        // map meeting_link -> zoom_meeting JSONB if provided; notes column exists in schema
        ...(data.meeting_link ? { zoom_meeting: { url: data.meeting_link } } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        ...(class_package_id ? { class_package_id, package_id: class_package_id } : {}),
        ...(scheduled_class_id ? { scheduled_class_id } : {}),
      };

      try {
        const { data: inserted, error } = await this.client
          .from('class_assignments')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        return this.success(inserted);
      } catch (err: any) {
        // If PostgREST complains a column is missing (PGRST204), retry without optional keys
        const code = err?.code || err?.status;
        const msg: string = err?.message || '';
        if (String(code) === 'PGRST204' || msg.includes("Could not find the 'meeting_link'")) {
          const slimPayload: any = {
            class_container_id: payload.class_container_id,
            date: payload.date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            timezone: payload.timezone,
            instructor_id: payload.instructor_id,
            class_status: payload.class_status,
          };
          const { data: inserted2, error: err2 } = await this.client
            .from('class_assignments')
            .insert(slimPayload)
            .select('*')
            .single();
          if (err2) throw err2;
          return this.success(inserted2);
        }
        throw err;
      }
    } catch (error) {
      return this.handleError(error, 'createAssignment');
    }
  }

  async bulkCreateAssignments(assignments: any[]): Promise<ServiceResult<{ created: any[]; failed: { input: any; error: string }[] }>> {
    try {
      // TODO: Batch insert with transaction
      return this.success({ created: [], failed: [] });
    } catch (error) {
      return this.handleError(error, 'bulkCreateAssignments');
    }
  }

  async updateAssignment(id: string, data: any): Promise<ServiceResult<any>> {
    try {
      if (!id) throw new Error('Assignment ID is required');

      const updatePayload: any = {};

      // Only update fields that are provided
      if (data.class_date) updatePayload.date = data.class_date;
      if (data.start_time) updatePayload.start_time = data.start_time;
      if (data.end_time) updatePayload.end_time = data.end_time;
      if (data.timezone) updatePayload.timezone = data.timezone;
      if (data.instructor_id !== undefined) updatePayload.instructor_id = data.instructor_id;
      if (data.status) updatePayload.class_status = data.status;
      if (data.notes !== undefined) updatePayload.notes = data.notes;
      if (data.meeting_link !== undefined) {
        updatePayload.zoom_meeting = data.meeting_link ? { url: data.meeting_link } : null;
      }

      if (Object.keys(updatePayload).length === 0) {
        return { success: false, error: { code: 'NO_UPDATES', message: 'No fields to update' } };
      }

      const { data: updated, error } = await this.client
        .from('class_assignments')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return this.success(updated);
    } catch (error) {
      return this.handleError(error, 'updateAssignment');
    }
  }

  async deleteAssignment(id: string): Promise<ServiceResult<void>> {
    try {
      // TODO: Soft delete handling
      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'deleteAssignment');
    }
  }

  private async generateAssignmentCode(): Promise<string> {
    // TODO: Implement YOG-YYYYMMDD-XXXX generation
    return `YOG-${Date.now()}`;
  }
}

// Default instance for convenience when dynamically importing
const assignmentService = new AssignmentService();
export default assignmentService;
