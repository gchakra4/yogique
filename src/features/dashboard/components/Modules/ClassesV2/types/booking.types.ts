/**
 * Booking = student's booking record which may be assigned to a Container/Assignment
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  /** Primary key (uuid) */
  id: string;
  /** Student / user id who made the booking */
  student_id: string;
  /** Package selected at booking time */
  package_id?: string | null;
  /** Optional assignment/container assignment references */
  assigned_container_id?: string | null;
  assigned_assignment_id?: string | null;
  /** Booking lifecycle status */
  status: BookingStatus;
  /** Optional notes */
  notes?: string | null;
  /** Audit fields */
  created_at?: string;
  updated_at?: string;
}
