/**
 * Assignment = individual class session within a Container (Program)
 */
export type AssignmentStatus = 'scheduled' | 'cancelled' | 'rescheduled' | 'completed' | 'draft';

export interface Assignment {
  /** Primary key (uuid) */
  id: string;
  /** FK to Container (program/series) */
  container_id: string;
  /** Optional package snapshot id (if useful) */
  package_id?: string | null;
  /** ISO datetime for session start */
  start_at: string;
  /** ISO datetime for session end (optional) */
  end_at?: string | null;
  /** Instructor for this session (overrides container if present) */
  instructor_id?: string | null;
  /** Optional meeting/join link (generated or manual) */
  meeting_link?: string | null;
  /** Capacity snapshot for this assignment (if assignments manage capacity) */
  capacity_total?: number | null;
  /** Number of seats booked for this assignment (cached) */
  capacity_booked?: number | null;
  /** Status */
  status: AssignmentStatus;
  /** Audit fields */
  created_at?: string;
  updated_at?: string;
}
