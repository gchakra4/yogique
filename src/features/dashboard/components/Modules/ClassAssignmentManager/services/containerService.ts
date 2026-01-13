/**
 * Container Service - CRUD operations for class containers
 */

import { supabase } from '../../../../../../shared/lib/supabase';
import type {
    ClassContainer,
    ContainerCapacityInfo,
    ContainerValidationResult,
    CreateContainerRequest,
    UpdateContainerCapacityRequest
} from '../types/container.types';

/**
 * Fetch all containers with optional filters
 */
export async function fetchContainers(filters?: {
  instructor_id?: string;
  container_type?: string;
  is_active?: boolean;
}): Promise<{ data: ClassContainer[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('class_containers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.instructor_id) {
      query = query.eq('instructor_id', filters.instructor_id);
    }
    if (filters?.container_type) {
      query = query.eq('container_type', filters.container_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching containers:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ClassContainer[], error: null };
  } catch (err) {
    console.error('Exception fetching containers:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Fetch a single container by ID
 */
export async function fetchContainerById(
  containerId: string
): Promise<{ data: ClassContainer | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('class_containers')
      .select('*')
      .eq('id', containerId)
      .single();

    if (error) {
      console.error('Error fetching container:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ClassContainer, error: null };
  } catch (err) {
    console.error('Exception fetching container:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Create a new container
 */
export async function createContainer(
  request: CreateContainerRequest,
  currentUserId: string
): Promise<{ data: ClassContainer | null; error: Error | null }> {
  try {
    const payload = {
      display_name: request.display_name,
      container_type: request.container_type,
      instructor_id: request.instructor_id,
      class_type_id: request.class_type_id || null,
      package_id: request.package_id || null,
      max_booking_count: request.max_booking_count,
      current_booking_count: 0,
      created_by: currentUserId,
      notes: request.notes || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('class_containers')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating container:', error);
      return { data: null, error: new Error(error.message) };
    }

    console.log('✅ Container created:', data.id);
    return { data: data as ClassContainer, error: null };
  } catch (err) {
    console.error('Exception creating container:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Update container capacity (with validation)
 */
export async function updateContainerCapacity(
  request: UpdateContainerCapacityRequest
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // First fetch current state
    const { data: container, error: fetchError } = await fetchContainerById(request.container_id);
    
    if (fetchError || !container) {
      return { success: false, error: new Error('Container not found') };
    }

    // Validate capacity change
    const validation = validateCapacityChange(
      container.container_type,
      container.current_booking_count,
      request.new_max_booking_count
    );

    if (!validation.isValid) {
      return { success: false, error: new Error(validation.message) };
    }

    // Update capacity
    const { error: updateError } = await supabase
      .from('class_containers')
      .update({
        max_booking_count: request.new_max_booking_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.container_id);

    if (updateError) {
      console.error('Error updating container capacity:', updateError);
      return { success: false, error: new Error(updateError.message) };
    }

    console.log('✅ Container capacity updated:', request.container_id);
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception updating container capacity:', err);
    return { success: false, error: err as Error };
  }
}

/**
 * Get capacity info for a container
 */
export async function getContainerCapacityInfo(
  containerId: string
): Promise<{ data: ContainerCapacityInfo | null; error: Error | null }> {
  try {
    const { data: container, error } = await fetchContainerById(containerId);

    if (error || !container) {
      return { data: null, error: error || new Error('Container not found') };
    }

    const capacityInfo: ContainerCapacityInfo = {
      container_id: container.id,
      display_name: container.display_name,
      container_type: container.container_type,
      max_booking_count: container.max_booking_count,
      current_booking_count: container.current_booking_count,
      available_capacity: container.max_booking_count - container.current_booking_count,
      is_full: container.current_booking_count >= container.max_booking_count,
      can_edit_capacity: container.container_type !== 'individual'
    };

    return { data: capacityInfo, error: null };
  } catch (err) {
    console.error('Exception getting container capacity info:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Validate capacity change
 */
export function validateCapacityChange(
  containerType: string,
  currentBookingCount: number,
  newMaxBookingCount: number
): ContainerValidationResult {
  // Individual containers cannot be edited
  if (containerType === 'individual') {
    return {
      isValid: false,
      message: 'Individual containers must have capacity = 1 (cannot be edited)'
    };
  }

  // Cannot reduce capacity below current booking count
  if (newMaxBookingCount < currentBookingCount) {
    return {
      isValid: false,
      message: `Cannot reduce capacity below current booking count (${currentBookingCount})`
    };
  }

  // Check type-specific limits
  const limits: Record<string, number> = {
    public_group: 50,
    private_group: 30,
    crash_course: 50
  };

  const maxLimit = limits[containerType] || 50;

  if (newMaxBookingCount > maxLimit) {
    return {
      isValid: false,
      message: `Capacity cannot exceed ${maxLimit} for ${containerType} containers`
    };
  }

  if (newMaxBookingCount < 1) {
    return {
      isValid: false,
      message: 'Capacity must be at least 1'
    };
  }

  // Validation passed
  return {
    isValid: true,
    message: `Capacity can be updated to ${newMaxBookingCount}`
  };
}

/**
 * Deactivate a container
 */
export async function deactivateContainer(
  containerId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('class_containers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', containerId);

    if (error) {
      console.error('Error deactivating container:', error);
      return { success: false, error: new Error(error.message) };
    }

    console.log('✅ Container deactivated:', containerId);
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception deactivating container:', err);
    return { success: false, error: err as Error };
  }
}
