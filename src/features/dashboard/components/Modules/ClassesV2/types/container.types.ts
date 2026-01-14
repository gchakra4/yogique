/**
 * Container (Program) - canonical representation of a program/series
 */
export type ContainerStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'rescheduled';

export interface Container {
  /** Primary key (uuid) */
  id: string;
  /** Human-friendly short code (generated) */
  code: string;
  /** Reference to originating package/template */
  package_id: string;
  /** Display name shown to business users (e.g. "Power Yoga - Sarah") */
  display_name: string;
  /** Optional instructor assigned at program level */
  instructor_id?: string | null;
  /** Optional timezone for the program (IANA name) */
  timezone?: string | null;
  /** Optional programme start date (ISO date) */
  start_date?: string | null;
  /** Optional programme end date (ISO date) */
  end_date?: string | null;
  /** Total capacity for the program (if applicable) */
  capacity_total?: number | null;
  /** Cached count of booked seats (convenience, not authoritative) */
  capacity_booked?: number | null;
  /** Current lifecycle status */
  status: ContainerStatus;
  /** Audit fields (ISO datetimes) - readonly from DB */
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}
