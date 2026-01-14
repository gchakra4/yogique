/**
 * Container (Program) types for dashboard-level shared types
 */
export type ContainerStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'rescheduled';

export interface Container {
  id: string;
  code?: string;
  package_id: string;
  display_name: string;
  instructor_id?: string | null;
  timezone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  capacity_total?: number | null;
  capacity_booked?: number | null;
  status: ContainerStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}
