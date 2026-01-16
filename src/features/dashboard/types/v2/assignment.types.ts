/**
 * Assignment types for dashboard-level shared types
 */
export type AssignmentStatus = 'scheduled' | 'cancelled' | 'rescheduled' | 'completed' | 'draft';

export interface Assignment {
  id: string;
  container_id: string;
  package_id?: string | null;
  start_at: string;
  end_at?: string | null;
  instructor_id?: string | null;
  meeting_link?: string | null;
  zoom_meeting?: { url?: string } | null;
  capacity_total?: number | null;
  capacity_booked?: number | null;
  status: AssignmentStatus;
  created_at?: string;
  updated_at?: string;
}
