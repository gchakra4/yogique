/**
 * ============================================================================
 * PHASE 5: ADJUSTMENT CLASS SERVICE
 * ============================================================================
 * 
 * Implements adjustment class creation to fill calendar month shortfalls.
 * 
 * Business Rules:
 * - Adjustment classes ONLY used when preferred pattern has insufficient occurrences
 * - MUST be within same calendar month as original classes
 * - Clearly marked with is_adjustment: true
 * - adjustment_reason documents why adjustment was needed
 * - Uses same package, instructor, time as regular classes
 * - Does NOT count against preferred weekday pattern
 */

import { supabase } from '../../../../../../shared/lib/supabase'
import {
    detectSchedulingShortfall,
    findWeekdayOccurrences,
    generateAdjustmentRecommendations,
    getCalendarMonthBoundaries,
    validateDateWithinMonth,
    type AdjustmentRecommendation
} from './monthlySchedulingService'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AdjustmentClassRequest {
    instructorId: string
    packageId: string
    calendarMonth: string // YYYY-MM
    date: string // YYYY-MM-DD
    startTime: string // HH:MM
    endTime: string // HH:MM
    adjustmentReason: string
    bookingIds: string[] // External booking codes
    bookingType?: string // individual | corporate | private_group | public_group
    paymentAmount: number
    notes?: string
}

export interface MonthlyShortfallAnalysis {
    instructorId: string
    calendarMonth: string
    requiredClasses: number
    scheduledClasses: number
    adjustmentClasses: number
    shortfall: number // Negative = shortage, Positive = excess, 0 = exact
    hasShortfall: boolean
    recommendations: AdjustmentRecommendation[]
    preferredDays: number[]
}

export interface BulkAdjustmentRequest {
    instructorId: string
    packageId: string
    calendarMonth: string
    recommendations: AdjustmentRecommendation[]
    bookingIds: string[]
    bookingType?: string
    paymentAmount: number
    startTime: string
    endTime: string
    notes?: string
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate adjustment class can be created
 */
export async function validateAdjustmentClass(
    request: AdjustmentClassRequest
): Promise<{ valid: boolean; error?: string }> {
    // 1. Validate date is within calendar month
    try {
        validateDateWithinMonth(new Date(request.date + 'T00:00:00.000Z'), request.calendarMonth)
    } catch (error) {
        return {
            valid: false,
            error: `Adjustment class date must be within calendar month ${request.calendarMonth}: ${error instanceof Error ? error.message : String(error)}`
        }
    }

    // 2. Validate adjustment reason is provided
    if (!request.adjustmentReason || request.adjustmentReason.trim() === '') {
        return {
            valid: false,
            error: 'Adjustment reason is required'
        }
    }

    // 3. Validate instructor exists
    const { data: instructor, error: instructorError } = await supabase
        .from('instructors')
        .select('id')
        .eq('id', request.instructorId)
        .single()

    if (instructorError || !instructor) {
        return {
            valid: false,
            error: 'Invalid instructor ID'
        }
    }

    // 4. Validate package exists
    const { data: pkg, error: pkgError } = await supabase
        .from('class_packages')
        .select('id')
        .eq('id', request.packageId)
        .single()

    if (pkgError || !pkg) {
        return {
            valid: false,
            error: 'Invalid package ID'
        }
    }

    // 5. Validate no duplicate adjustment on same date for same instructor
    const { data: existing, error: existingError } = await supabase
        .from('class_assignments')
        .select('id')
        .eq('instructor_id', request.instructorId)
        .eq('date', request.date)
        .eq('start_time', request.startTime)
        .eq('is_adjustment', true)
        .limit(1)

    if (existingError) {
        console.error('Error checking existing adjustments:', existingError)
    }

    if (existing && existing.length > 0) {
        return {
            valid: false,
            error: `Adjustment class already exists for ${request.date} at ${request.startTime}`
        }
    }

    return { valid: true }
}

/**
 * Validate that adjustment is actually needed (there's a shortfall)
 */
export async function validateShortfallExists(
    instructorId: string,
    calendarMonth: string,
    requiredClasses: number
): Promise<{ valid: boolean; error?: string; shortfall?: number }> {
    const analysis = await analyzeMonthlyShortfall(instructorId, calendarMonth, requiredClasses)

    if (analysis.shortfall >= 0) {
        return {
            valid: false,
            error: `No shortfall exists. Scheduled: ${analysis.scheduledClasses}, Required: ${requiredClasses}, Adjustments: ${analysis.adjustmentClasses}`,
            shortfall: analysis.shortfall
        }
    }

    return {
        valid: true,
        shortfall: analysis.shortfall
    }
}

// ============================================================================
// Analysis
// ============================================================================

/**
 * Analyze monthly scheduling to detect shortfalls
 */
export async function analyzeMonthlyShortfall(
    instructorId: string,
    calendarMonth: string,
    requiredClasses: number
): Promise<MonthlyShortfallAnalysis> {
    // Get all classes for this month
    const { data: classes, error } = await supabase
        .from('class_assignments')
        .select('id, date, schedule_type')
        .eq('instructor_id', instructorId)
        .eq('schedule_type', 'monthly')

    if (error) {
        console.error('Error fetching classes:', error)
        throw new Error(`Failed to analyze shortfall: ${error.message}`)
    }

    const scheduledClasses = (classes || []).length
    const adjustmentClasses = 0
    const totalClasses = scheduledClasses + adjustmentClasses
    const shortfall = totalClasses - requiredClasses

    return {
        instructorId,
        calendarMonth,
        requiredClasses,
        scheduledClasses,
        adjustmentClasses,
        shortfall,
        hasShortfall: shortfall < 0,
        recommendations: [], // Populated separately if needed
        preferredDays: [] // Would need to fetch from booking/package config
    }
}

/**
 * Get shortfall analysis with recommendations
 */
export async function getShortfallWithRecommendations(
    instructorId: string,
    calendarMonth: string,
    requiredClasses: number,
    preferredDays: number[] // e.g., [1,3,5] for Mon/Wed/Fri
): Promise<MonthlyShortfallAnalysis> {
    const analysis = await analyzeMonthlyShortfall(instructorId, calendarMonth, requiredClasses)

    if (analysis.hasShortfall) {
        const boundaries = getCalendarMonthBoundaries(new Date(calendarMonth + '-15T00:00:00.000Z'))
        
        // Find available occurrences of preferred days
        const availableOccurrences = findWeekdayOccurrences(boundaries, preferredDays)
        
        // Detect shortfall
        const shortfallAmount = detectSchedulingShortfall(requiredClasses - analysis.adjustmentClasses, availableOccurrences)
        
        // Generate recommendations if shortfall exists
        if (shortfallAmount < 0) {
            const recommendations = generateAdjustmentRecommendations(
                boundaries,
                preferredDays,
                availableOccurrences,
                shortfallAmount
            )
            
            analysis.recommendations = recommendations
        }
    }

    analysis.preferredDays = preferredDays

    return analysis
}

// ============================================================================
// Creation
// ============================================================================

/**
 * Create a single adjustment class
 */
export async function createAdjustmentClass(
    request: AdjustmentClassRequest
): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
    try {
        // 1. Validate
        const validation = await validateAdjustmentClass(request)
        if (!validation.valid) {
            return { success: false, error: validation.error }
        }

        // 2. Get current user ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'User not authenticated' }
        }

        // 3. Prepare assignment data
        const assignmentData = {
            instructor_id: request.instructorId,
            package_id: request.packageId,
            class_package_id: request.packageId,
            date: request.date,
            start_time: request.startTime,
            end_time: request.endTime,
            payment_amount: request.paymentAmount,
            schedule_type: 'monthly' as const,
            booking_type: request.bookingType || 'individual' as const,
            assigned_by: user.id,
            class_status: 'scheduled' as const,
            payment_status: 'pending' as const,
            instructor_status: 'pending' as const,
            calendar_month: request.calendarMonth,
            is_adjustment: true, // 🔴 KEY: Mark as adjustment
            adjustment_reason: request.adjustmentReason, // 🔴 KEY: Document reason
            notes: request.notes || null
        }

        // 4. Insert assignment
        const { data: assignment, error: insertError } = await supabase
            .from('class_assignments')
            .insert(assignmentData)
            .select('id')
            .single()

        if (insertError) {
            console.error('Error creating adjustment class:', insertError)
            return { success: false, error: insertError.message }
        }

        console.log('✅ Adjustment class created:', assignment.id, '-', request.date)

        // 5. Link bookings if provided
        if (request.bookingIds && request.bookingIds.length > 0) {
            const bookingLinks = request.bookingIds
                .filter(bid => bid && bid.trim() !== '')
                .map(bookingId => ({
                    assignment_id: assignment.id,
                    booking_id: bookingId.trim()
                }))

            if (bookingLinks.length > 0) {
                const { error: linkError } = await supabase
                    .from('assignment_bookings')
                    .insert(bookingLinks)

                if (linkError) {
                    console.error('Error linking bookings to adjustment class:', linkError)
                    // Don't fail - adjustment created successfully
                }
            }
        }

        return { success: true, assignmentId: assignment.id }
    } catch (error) {
        console.error('Exception creating adjustment class:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Create multiple adjustment classes from recommendations
 */
export async function createBulkAdjustmentClasses(
    request: BulkAdjustmentRequest
): Promise<{ success: boolean; created: number; failed: number; errors: string[] }> {
    let created = 0
    let failed = 0
    const errors: string[] = []

    for (const recommendation of request.recommendations) {
        const adjustmentRequest: AdjustmentClassRequest = {
            instructorId: request.instructorId,
            packageId: request.packageId,
            calendarMonth: request.calendarMonth,
            date: recommendation.dateString,
            startTime: request.startTime,
            endTime: request.endTime,
            adjustmentReason: recommendation.reason,
            bookingIds: request.bookingIds,
            bookingType: request.bookingType,
            paymentAmount: request.paymentAmount,
            notes: request.notes
        }

        const result = await createAdjustmentClass(adjustmentRequest)

        if (result.success) {
            created++
            console.log(`✅ Adjustment class ${created}/${request.recommendations.length} created:`, recommendation.dateString)
        } else {
            failed++
            errors.push(`${recommendation.dateString}: ${result.error}`)
            console.error(`❌ Failed to create adjustment for ${recommendation.dateString}:`, result.error)
        }
    }

    return {
        success: created > 0,
        created,
        failed,
        errors
    }
}

/**
 * Auto-fill shortfall with recommended adjustments
 */
export async function autoFillMonthlyShortfall(
    instructorId: string,
    packageId: string,
    calendarMonth: string,
    requiredClasses: number,
    preferredDays: number[],
    bookingIds: string[],
    bookingType: string,
    paymentAmount: number,
    startTime: string,
    endTime: string,
    notes?: string
): Promise<{ success: boolean; created: number; message: string; errors?: string[] }> {
    try {
        // 1. Analyze shortfall
        const analysis = await getShortfallWithRecommendations(
            instructorId,
            calendarMonth,
            requiredClasses,
            preferredDays
        )

        if (!analysis.hasShortfall) {
            return {
                success: true,
                created: 0,
                message: `No shortfall detected. Scheduled: ${analysis.scheduledClasses}, Adjustments: ${analysis.adjustmentClasses}, Required: ${requiredClasses}`
            }
        }

        if (analysis.recommendations.length === 0) {
            return {
                success: false,
                created: 0,
                message: `Shortfall exists (${Math.abs(analysis.shortfall)} classes) but no alternative dates available in ${calendarMonth}`
            }
        }

        console.log(`📊 Shortfall detected: Need ${Math.abs(analysis.shortfall)} adjustment(s)`)
        console.log(`💡 ${analysis.recommendations.length} recommendation(s) available`)

        // 2. Create bulk adjustments
        const bulkRequest: BulkAdjustmentRequest = {
            instructorId,
            packageId,
            calendarMonth,
            recommendations: analysis.recommendations,
            bookingIds,
            bookingType,
            paymentAmount,
            startTime,
            endTime,
            notes
        }

        const result = await createBulkAdjustmentClasses(bulkRequest)

        return {
            success: result.success,
            created: result.created,
            message: `Auto-filled ${result.created} adjustment class(es). Failed: ${result.failed}`,
            errors: result.errors
        }
    } catch (error) {
        console.error('Error in autoFillMonthlyShortfall:', error)
        return {
            success: false,
            created: 0,
            message: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ============================================================================
// Querying
// ============================================================================

/**
 * Get all adjustment classes for a calendar month
 */
export async function getAdjustmentClasses(
    instructorId: string,
    calendarMonth: string
): Promise<any[]> {
    const { data, error } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('calendar_month', calendarMonth)
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching adjustment classes:', error)
        return []
    }

    return data || []
}

/**
 * Check if instructor has any adjustments for a month
 */
export async function hasAdjustments(
    instructorId: string,
    calendarMonth: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('class_assignments')
        .select('id')
        .eq('instructor_id', instructorId)
        .eq('calendar_month', calendarMonth)
        .limit(1)

    if (error) {
        console.error('Error checking adjustments:', error)
        return false
    }

    return (data?.length || 0) > 0
}

/**
 * Get adjustment classes grouped by reason
 */
export async function getAdjustmentsByReason(
    instructorId: string,
    calendarMonth: string
): Promise<Record<string, any[]>> {
    const adjustments = await getAdjustmentClasses(instructorId, calendarMonth)
    
    const grouped: Record<string, any[]> = {}
    
    for (const adjustment of adjustments) {
        const reason = adjustment.adjustment_reason || 'Unknown'
        if (!grouped[reason]) {
            grouped[reason] = []
        }
        grouped[reason].push(adjustment)
    }
    
    return grouped
}

// ============================================================================
// Deletion (Rollback)
// ============================================================================

/**
 * Delete an adjustment class
 */
export async function deleteAdjustmentClass(
    assignmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Verify it's an adjustment class
        const { data: assignment, error: fetchError } = await supabase
            .from('class_assignments')
            .select('is_adjustment, date')
            .eq('id', assignmentId)
            .single()

        if (fetchError || !assignment) {
            return { success: false, error: 'Assignment not found' }
        }

        if (!assignment.is_adjustment) {
            return { success: false, error: 'Cannot delete non-adjustment class with this function' }
        }

        // 2. Delete assignment (cascade will delete assignment_bookings)
        const { error: deleteError } = await supabase
            .from('class_assignments')
            .delete()
            .eq('id', assignmentId)

        if (deleteError) {
            console.error('Error deleting adjustment class:', deleteError)
            return { success: false, error: deleteError.message }
        }

        console.log('✅ Adjustment class deleted:', assignmentId)
        return { success: true }
    } catch (error) {
        console.error('Exception deleting adjustment class:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Delete all adjustments for a calendar month
 */
export async function deleteAllAdjustments(
    instructorId: string,
    calendarMonth: string
): Promise<{ success: boolean; deleted: number; error?: string }> {
    try {
        const { data: adjustments, error: fetchError } = await supabase
            .from('class_assignments')
            .select('id')
            .eq('instructor_id', instructorId)
            .eq('calendar_month', calendarMonth)
            .eq('is_adjustment', true)

        if (fetchError) {
            return { success: false, deleted: 0, error: fetchError.message }
        }

        if (!adjustments || adjustments.length === 0) {
            return { success: true, deleted: 0 }
        }

        const { error: deleteError } = await supabase
            .from('class_assignments')
            .delete()
            .eq('instructor_id', instructorId)
            .eq('calendar_month', calendarMonth)
            .eq('is_adjustment', true)

        if (deleteError) {
            console.error('Error deleting adjustments:', deleteError)
            return { success: false, deleted: 0, error: deleteError.message }
        }

        console.log(`✅ Deleted ${adjustments.length} adjustment class(es) for ${calendarMonth}`)
        return { success: true, deleted: adjustments.length }
    } catch (error) {
        console.error('Exception deleting adjustments:', error)
        return {
            success: false,
            deleted: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
