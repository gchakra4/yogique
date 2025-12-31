/**
 * ============================================================================
 * PHASE 7: INSTRUCTOR VISIBILITY FILTER SERVICE
 * ============================================================================
 * Purpose: Provide role-based data access for instructors
 * - Instructors see assignments WITHOUT pricing information
 * - Admins see all data including payment amounts
 * 
 * Business Rules:
 * - Instructors cannot see: payment_amount, payment_status, package prices
 * - Instructors CAN see: schedule, students, attendance, class details
 * - Uses instructor_classes_safe_v view from Phase 1
 * - Role detection via user profile or explicit parameter
 * ============================================================================
 */

import { supabase } from '../../../../../../shared/lib/supabase'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Instructor-safe assignment data (NO pricing information)
 */
export interface InstructorSafeAssignment {
  id: string
  scheduled_class_id?: string
  instructor_id: string
  class_type_id: string
  date: string
  start_time: string
  end_time: string
  schedule_type: string
  class_status: string
  notes?: string
  assigned_at: string
  created_at: string
  updated_at: string
  instructor_status: string
  instructor_response_at?: string
  instructor_remarks?: string
  rejection_reason?: string
  booking_type?: string
  timezone?: string
  created_in_timezone?: string
  assignment_method?: string
  recurrence_days?: number[]
  parent_assignment_id?: string
  attendance_locked: boolean
  actual_start_time?: string
  actual_end_time?: string
  rescheduled_to_id?: string
  rescheduled_from_id?: string
  class_package_id?: string
  assignment_code?: string
  zoom_meeting?: any
  whatsapp_notified?: boolean
  email_notified?: boolean
  
  // Phase 1 columns
  is_adjustment?: boolean
  adjustment_reason?: string
  calendar_month?: string
  
  // Aggregated data (NO pricing)
  students?: Array<{
    booking_id: string
    student_name: string
    email: string
    booking_type: string
  }>
  present_count?: number
  absent_count?: number
}

/**
 * Full assignment data for admins (includes pricing)
 */
export interface AdminAssignment extends InstructorSafeAssignment {
  payment_amount: number
  payment_status: string
  payment_date?: string
  payment_type?: string
  override_payment_amount?: number
  final_payment_amount?: number
}

/**
 * User role type
 */
export type UserRole = 'admin' | 'super_admin' | 'yoga_acharya' | 'instructor' | 'user'

// ============================================================================
// ROLE DETECTION
// ============================================================================

/**
 * Get current user's role from profiles and user_roles tables
 */
export async function getUserRole(userId?: string): Promise<UserRole> {
  try {
    let targetUserId = userId

    // If no userId provided, get current user
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn('No authenticated user found, defaulting to user role')
        return 'user'
      }
      targetUserId = user.id
    }

    // Get user roles from user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', targetUserId)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return 'user'
    }

    if (!userRoles || userRoles.length === 0) {
      return 'user'
    }

    // Extract role names
    const roleNames = userRoles
      .map(ur => (ur.roles as any)?.name)
      .filter(Boolean)
      .map(name => name.toLowerCase())

    // Priority order: super_admin > admin > yoga_acharya > instructor > user
    if (roleNames.includes('super_admin')) return 'super_admin'
    if (roleNames.includes('admin')) return 'admin'
    if (roleNames.includes('yoga_acharya')) return 'yoga_acharya'
    if (roleNames.includes('instructor')) return 'instructor'
    
    return 'user'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return 'user'
  }
}

/**
 * Check if user has admin-level access (can see pricing)
 */
export function isAdminRole(role: UserRole): boolean {
  return ['admin', 'super_admin', 'yoga_acharya'].includes(role)
}

/**
 * Check if user is instructor (cannot see pricing)
 */
export function isInstructorRole(role: UserRole): boolean {
  return role === 'instructor'
}

// ============================================================================
// DATA FETCHING WITH ROLE-BASED FILTERING
// ============================================================================

/**
 * Fetch assignments with role-based filtering
 * - Instructors: Use instructor_classes_safe_v (NO pricing)
 * - Admins: Use class_assignments table (full data)
 */
export async function fetchAssignmentsForUser(
  filters?: {
    instructorId?: string
    startDate?: string
    endDate?: string
    status?: string
  }
): Promise<{
  assignments: InstructorSafeAssignment[] | AdminAssignment[]
  role: UserRole
  error?: string
}> {
  try {
    // Get user role
    const role = await getUserRole()
    
    if (isInstructorRole(role)) {
      // Instructors: Use safe view (automatic filtering via RLS)
      return await fetchInstructorSafeAssignments(filters)
    } else {
      // Admins: Use full table
      return await fetchAdminAssignments(filters, role)
    }
  } catch (error) {
    console.error('Error in fetchAssignmentsForUser:', error)
    return {
      assignments: [],
      role: 'user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Fetch assignments for instructors (NO pricing data)
 * Uses instructor_classes_safe_v view
 */
async function fetchInstructorSafeAssignments(
  filters?: {
    instructorId?: string
    startDate?: string
    endDate?: string
    status?: string
  }
): Promise<{
  assignments: InstructorSafeAssignment[]
  role: UserRole
  error?: string
}> {
  try {
    // Build query on instructor_classes_safe_v
    let query = supabase
      .from('instructor_classes_safe_v')
      .select('*')
    
    // Apply filters
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }
    if (filters?.status) {
      query = query.eq('class_status', filters.status)
    }

    // Sort by date descending
    query = query.order('date', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching instructor safe assignments:', error)
      return {
        assignments: [],
        role: 'instructor',
        error: error.message
      }
    }

    return {
      assignments: data || [],
      role: 'instructor'
    }
  } catch (error) {
    console.error('Error in fetchInstructorSafeAssignments:', error)
    return {
      assignments: [],
      role: 'instructor',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Fetch assignments for admins (FULL data including pricing)
 * Uses class_assignments table directly
 */
async function fetchAdminAssignments(
  filters?: {
    instructorId?: string
    startDate?: string
    endDate?: string
    status?: string
  },
  role: UserRole = 'admin'
): Promise<{
  assignments: AdminAssignment[]
  role: UserRole
  error?: string
}> {
  try {
    // Build query on class_assignments table
    let query = supabase
      .from('class_assignments')
      .select(`
        *,
        class_types (
          id,
          name,
          description,
          difficulty_level,
          duration_minutes
        ),
        class_packages (
          id,
          name,
          package_type,
          total_classes,
          validity_days,
          total_amount,
          price_per_class
        )
      `)
    
    // Apply filters
    if (filters?.instructorId) {
      query = query.eq('instructor_id', filters.instructorId)
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }
    if (filters?.status) {
      query = query.eq('class_status', filters.status)
    }

    // Sort by date descending
    query = query.order('date', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching admin assignments:', error)
      return {
        assignments: [],
        role,
        error: error.message
      }
    }

    return {
      assignments: data as AdminAssignment[] || [],
      role
    }
  } catch (error) {
    console.error('Error in fetchAdminAssignments:', error)
    return {
      assignments: [],
      role,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user can see pricing information
 */
export async function canSeePricing(userId?: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return isAdminRole(role)
}

/**
 * Strip pricing information from assignment data
 * Use this as a fallback if data was fetched from wrong source
 */
export function stripPricingData(assignment: AdminAssignment): InstructorSafeAssignment {
  const {
    payment_amount,
    payment_status,
    payment_date,
    payment_type,
    override_payment_amount,
    final_payment_amount,
    ...safeData
  } = assignment

  return safeData
}

/**
 * Conditionally show pricing based on role
 */
export function formatAssignmentForDisplay(
  assignment: AdminAssignment | InstructorSafeAssignment,
  role: UserRole
): InstructorSafeAssignment | AdminAssignment {
  if (isInstructorRole(role)) {
    return stripPricingData(assignment as AdminAssignment)
  }
  return assignment
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  getUserRole,
  isAdminRole,
  isInstructorRole,
  fetchAssignmentsForUser,
  canSeePricing,
  stripPricingData,
  formatAssignmentForDisplay
}
