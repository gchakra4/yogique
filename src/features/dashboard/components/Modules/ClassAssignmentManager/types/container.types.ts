/**
 * Container Types - Single source of truth for class grouping
 */

export type ContainerType = 'individual' | 'public_group' | 'private_group' | 'crash_course';

export interface ClassContainer {
  id: string;
  container_code: string;
  display_name: string;
  container_type: ContainerType;
  instructor_id: string;
  class_type_id: string | null;
  package_id: string | null;
  max_booking_count: number;
  current_booking_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  notes: string | null;
}

export interface ContainerCapacityInfo {
  container_id: string;
  display_name: string;
  container_type: ContainerType;
  max_booking_count: number;
  current_booking_count: number;
  available_capacity: number;
  is_full: boolean;
  can_edit_capacity: boolean;
}

export interface CreateContainerRequest {
  container_code: string;
  display_name?: string;
  container_type: ContainerType;
  instructor_id: string;
  class_type_id?: string | null;
  package_id?: string | null;
  max_booking_count: number;
  notes?: string | null;
}

export interface UpdateContainerCapacityRequest {
  container_id: string;
  new_max_booking_count: number;
}

export interface ContainerValidationResult {
  isValid: boolean;
  message: string;
  errors?: string[];
}

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  individual: 'Individual (1:1)',
  public_group: 'Public Group',
  private_group: 'Private Group',
  crash_course: 'Crash Course'
};

export const CONTAINER_TYPE_DESCRIPTIONS: Record<ContainerType, string> = {
  individual: 'One student per container. Capacity locked at 1.',
  public_group: 'Open enrollment group class. Configurable capacity (1-50).',
  private_group: 'Closed group class. Configurable capacity (1-30).',
  crash_course: 'Fixed duration program. Configurable capacity (1-50).'
};

export const CONTAINER_CAPACITY_LIMITS: Record<ContainerType, { min: number; max: number; editable: boolean }> = {
  individual: { min: 1, max: 1, editable: false },
  public_group: { min: 1, max: 50, editable: true },
  private_group: { min: 1, max: 30, editable: true },
  crash_course: { min: 1, max: 50, editable: true }
};
