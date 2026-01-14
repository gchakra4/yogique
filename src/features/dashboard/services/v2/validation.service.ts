import {
    convertToTimezoneWithDate,
    getInstructorTimezone,
    normalizeTimeForComparison,
} from '@/features/dashboard/utils/v2/timezoneHelpers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResult } from './base.service';

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export interface CreateContainerInput {
  package_id: string;
  instructor_id?: string | null;
  display_name?: string | null;
  timezone?: string | null;
  start_date?: string | null; // ISO
  end_date?: string | null; // ISO
  capacity_total?: number | null;
  status?: string;
}

export interface CreateAssignmentInput {
  container_id: string;
  instructor_id?: string | null;
  class_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM or HH:MM:SS
  end_time: string; // HH:MM or HH:MM:SS
  timezone?: string | null;
  meeting_link?: string | null;
  notes?: string | null;
}

export class ValidationService extends BaseService {
  constructor(client?: SupabaseClient) {
    super(client);
  }

  public validateContainerCreation(input: CreateContainerInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.package_id || String(input.package_id).trim() === '') {
      errors.push('Package selection is required');
      return { isValid: false, errors, warnings };
    }

    if (input.display_name && input.display_name.length > 200) {
      errors.push('Display name must be 200 characters or less');
    }

    if (input.capacity_total !== undefined && input.capacity_total !== null) {
      if (!Number.isInteger(input.capacity_total) || input.capacity_total <= 0) {
        errors.push('Capacity must be a positive integer');
      }
    }

    if (input.start_date && !this.isValidISODate(input.start_date)) {
      errors.push('Invalid start date format');
    }
    if (input.end_date && !this.isValidISODate(input.end_date)) {
      errors.push('Invalid end date format');
    }
    if (input.start_date && input.end_date) {
      const start = new Date(input.start_date);
      const end = new Date(input.end_date);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        errors.push('Invalid start or end date');
      } else if (start >= end) {
        errors.push('End date must be after start date');
      }
    }

    if (input.timezone && !this.isValidIANATimezone(input.timezone)) {
      warnings.push('Invalid timezone format. Use IANA timezone (e.g., Asia/Kolkata)');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  public validateAssignmentCreation(input: CreateAssignmentInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.container_id || String(input.container_id).trim() === '') {
      errors.push('Program selection is required');
      return { isValid: false, errors, warnings };
    }

    if (!input.class_date || !this.isValidISODate(input.class_date)) {
      errors.push('Invalid or missing class date (YYYY-MM-DD)');
    }

    if (!input.start_time || !this.isValidTimeFormat(input.start_time)) {
      errors.push('Invalid or missing start time (HH:MM)');
    }
    if (!input.end_time || !this.isValidTimeFormat(input.end_time)) {
      errors.push('Invalid or missing end time (HH:MM)');
    }

    // If times parsed, check logical rules
    if (this.isValidTimeFormat(input.start_time) && this.isValidTimeFormat(input.end_time)) {
      const startMinutes = this.parseTime(input.start_time);
      const endMinutes = this.parseTime(input.end_time);
      if (startMinutes === null || endMinutes === null) {
        errors.push('Invalid time values');
      } else {
        if (endMinutes <= startMinutes) {
          errors.push('End time must be after start time');
        }
        const duration = endMinutes - startMinutes;
        if (duration < 15) errors.push('Class duration must be at least 15 minutes');
        if (duration > 240) errors.push('Class duration cannot exceed 4 hours');
      }
    }

    // Date not in the past
    try {
      const classDate = new Date(input.class_date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (classDate < today) {
        errors.push('Cannot create assignment in the past');
      }
    } catch (e) {
      // ignore, already handled by date format check
    }

    // Meeting link format (if provided)
    if (input.meeting_link && !this.isValidURL(input.meeting_link)) {
      errors.push('Invalid meeting link URL');
    }

    // Instructor note: assignment requires an instructor either here or at container level
    if (!input.instructor_id) {
      warnings.push('No instructor provided. Ensure the program has an instructor assigned');
    }

    // Timezone format basic check
    if (input.timezone && !this.isValidIANATimezone(input.timezone)) {
      warnings.push('Invalid timezone format. Use IANA timezone (e.g., Asia/Kolkata)');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private isValidISODate(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    const simplePattern = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
    return simplePattern.test(value);
  }

  private isValidIANATimezone(tz: string): boolean {
    if (!tz || typeof tz !== 'string') return false;
    const pattern = /^[A-Za-z_\-]+\/[A-Za-z0-9_\-\/]+$/;
    return pattern.test(tz);
  }

  private isValidTimeFormat(time: string): boolean {
    if (!time || typeof time !== 'string') return false;
    const m = time.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
    if (!m) return false;
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (hh < 0 || hh > 23) return false;
    if (mm < 0 || mm > 59) return false;
    return true;
  }

  private parseTime(time: string): number | null {
    if (!this.isValidTimeFormat(time)) return null;
    const parts = time.split(':').map(p => parseInt(p, 10));
    const hh = parts[0] || 0;
    const mm = parts[1] || 0;
    return hh * 60 + mm;
  }

  private isValidURL(url: string): boolean {
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Placeholders for async, service-side validation and conflict checks
  public async validateContainerCreationAsync(input: CreateContainerInput): Promise<ValidationResult> {
    // Implement service-side checks (package exists, instructor exists, capacity rules)
    return { isValid: true, errors: [], warnings: [] };
  }

  public async checkInstructorConflict(
    instructorId: string,
    date: string,
    startTime: string,
    endTime: string,
    timezone?: string
  ): Promise<ServiceResult<{ hasConflict: boolean; conflictingAssignments: any[] }>> {
    try {
      const DEFAULT_TZ = process.env.SYSTEM_DEFAULT_TIMEZONE || 'Asia/Kolkata';

      const instructorTz = (await getInstructorTimezone(instructorId)) || DEFAULT_TZ;
      const inputTz = timezone || instructorTz || DEFAULT_TZ;

      const normalizedInputStart = convertToTimezoneWithDate(startTime, date, inputTz, instructorTz);
      const normalizedInputEnd = convertToTimezoneWithDate(endTime, date, inputTz, instructorTz);

      const inputStartMs = normalizeTimeForComparison(normalizedInputStart.time, normalizedInputStart.date, instructorTz);
      const inputEndMs = normalizeTimeForComparison(normalizedInputEnd.time, normalizedInputEnd.date, instructorTz);

      // Prepare date window to fetch nearby assignments (prev, same, next) to handle boundary crossing
      const d = new Date(date + 'T00:00:00');
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const prevDate = prev.toISOString().slice(0, 10);
      const nextDate = next.toISOString().slice(0, 10);

      const { data: existingAssignments, error } = await this.client
        .from('class_assignments')
        .select('*')
        .eq('instructor_id', instructorId)
        .in('class_status', ['scheduled', 'confirmed', 'ongoing'])
        .in('class_date', [prevDate, date, nextDate]);

      if (error) return this.handleError(error, 'checkInstructorConflict: fetching assignments');

      const conflicts: any[] = [];

      for (const a of (existingAssignments || [])) {
        try {
          const existingTz = a.timezone || instructorTz || DEFAULT_TZ;
          const normExistingStart = convertToTimezoneWithDate(a.start_time, a.class_date, existingTz, instructorTz);
          const normExistingEnd = convertToTimezoneWithDate(a.end_time, a.class_date, existingTz, instructorTz);

          const existingStartMs = normalizeTimeForComparison(normExistingStart.time, normExistingStart.date, instructorTz);
          const existingEndMs = normalizeTimeForComparison(normExistingEnd.time, normExistingEnd.date, instructorTz);

          if (inputStartMs < existingEndMs && inputEndMs > existingStartMs) {
            conflicts.push(a);
          }
        } catch (inner) {
          // ignore per-assignment errors but continue
          console.warn('checkInstructorConflict: skip assignment due to error', inner);
        }
      }

      return this.success({ hasConflict: conflicts.length > 0, conflictingAssignments: conflicts });
    } catch (err) {
      return this.handleError(err, 'checkInstructorConflict');
    }
  }
}

export default ValidationService;
