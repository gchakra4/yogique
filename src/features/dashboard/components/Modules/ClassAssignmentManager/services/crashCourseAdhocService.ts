/**
 * ============================================================================
 * PHASE 6: CRASH COURSE & ADHOC VALIDATION SERVICE
 * ============================================================================
 * 
 * Implements validation and enforcement for crash courses and adhoc classes.
 * 
 * Business Rules:
 * 
 * CRASH COURSES:
 * - Fixed duration based on package validity_days (e.g., 30 days)
 * - All classes MUST be within validity period (start_date to start_date + validity_days)
 * - Package specifies class_count (fixed number of classes)
 * - Can span multiple calendar months IF within validity window
 * - Cannot schedule beyond validity end date
 * 
 * ADHOC CLASSES:
 * - Single session only
 * - Must have booking_id
 * - Must have class_type_id
 * - Date cannot be in past
 * - No cross-month or duration constraints (one-time event)
 */

import { supabase } from '../../../../../../shared/lib/supabase'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CrashCourseValidationRequest {
    packageId: string
    startDate: string // YYYY-MM-DD
    dates: string[] // Array of class dates
    classCount?: number // Expected from package
    validityDays?: number // Expected from package
}

export interface CrashCourseValidation {
    valid: boolean
    validityStartDate: string
    validityEndDate: string
    validDates: string[]
    invalidDates: string[]
    errors: string[]
    warnings: string[]
}

export interface AdhocValidationRequest {
    date: string
    classTypeId: string
    bookingIds: string[]
    instructorId: string
}

export interface AdhocValidation {
    valid: boolean
    errors: string[]
    warnings: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseDateToUTC(dateString: string): Date {
    const parts = dateString.split('-').map(Number)
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
}

function formatDateYYYYMMDD(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

function isDateInPast(dateString: string): boolean {
    const date = parseDateToUTC(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

// ============================================================================
// Crash Course Validation
// ============================================================================

/**
 * Get package details for crash course validation
 */
async function getCrashCoursePackageDetails(packageId: string): Promise<{
    classCount: number
    validityDays: number | null
    name: string
} | null> {
    const { data, error } = await supabase
        .from('class_packages')
        .select('class_count, validity_days, duration, name')
        .eq('id', packageId)
        .single()

    if (error || !data) {
        console.error('Error fetching package:', error)
        return null
    }

    let validityDays: number | null = data.validity_days || null
    
    // If validity_days is null, try to parse from duration field
    if (!validityDays && data.duration) {
        const durationMatch = data.duration.match(/^(\d+)\s+(day|days|week|weeks|month|months)$/i)
        if (durationMatch) {
            const number = parseInt(durationMatch[1])
            const unit = durationMatch[2].toLowerCase()
            if (unit.startsWith('day')) {
                validityDays = number
            } else if (unit.startsWith('week')) {
                validityDays = number * 7
            } else if (unit.startsWith('month')) {
                validityDays = number * 30 // Approximate
            }
        }
    }

    return {
        classCount: data.class_count || 0,
        validityDays: validityDays,
        name: data.name || 'Unknown'
    }
}

/**
 * Calculate crash course validity window
 */
export function calculateCrashCourseValidity(
    startDate: string,
    validityDays: number
): { startDate: string; endDate: string } {
    const start = parseDateToUTC(startDate)
    const end = addDays(start, validityDays - 1) // Inclusive of start day

    return {
        startDate: formatDateYYYYMMDD(start),
        endDate: formatDateYYYYMMDD(end)
    }
}

/**
 * Validate crash course dates are within validity period
 */
export async function validateCrashCourseDates(
    request: CrashCourseValidationRequest
): Promise<CrashCourseValidation> {
    const errors: string[] = []
    const warnings: string[] = []
    const validDates: string[] = []
    const invalidDates: string[] = []

    // 1. Get package details
    const packageDetails = await getCrashCoursePackageDetails(request.packageId)
    if (!packageDetails) {
        return {
            valid: false,
            validityStartDate: request.startDate,
            validityEndDate: request.startDate,
            validDates: [],
            invalidDates: request.dates,
            errors: ['Invalid package ID or package not found'],
            warnings: []
        }
    }

    const validityDays = request.validityDays || packageDetails.validityDays
    const classCount = request.classCount || packageDetails.classCount

    // 2. Calculate validity window (only if validity_days is specified)
    let validity: { startDate: string; endDate: string } | null = null
    if (validityDays && validityDays > 0) {
        validity = calculateCrashCourseValidity(request.startDate, validityDays)
        console.log(`📅 Crash Course Validation - Package: ${packageDetails.name}`)
        console.log(`📅 Validity Window: ${validity.startDate} to ${validity.endDate} (${validityDays} days)`)
    } else {
        console.log(`📅 Crash Course Validation - Package: ${packageDetails.name}`)
        console.log(`📅 No validity_days constraint - validating class count only`)
    }
    console.log(`📅 Expected Classes: ${classCount}`)
    console.log(`📅 Dates to Validate: ${request.dates.length}`)

    // 3. Parse validity boundaries (if applicable)
    let validityStart: Date | null = null
    let validityEnd: Date | null = null
    if (validity) {
        validityStart = parseDateToUTC(validity.startDate)
        validityEnd = parseDateToUTC(validity.endDate)
    }

    // 4. Validate each date
    for (const dateString of request.dates) {
        const classDate = parseDateToUTC(dateString)

        // Only check validity window if one is defined
        if (validityStart && validityEnd) {
            // Check if date is within validity window
            if (classDate < validityStart) {
                invalidDates.push(dateString)
                errors.push(`Date ${dateString} is before crash course start date ${validity!.startDate}`)
            } else if (classDate > validityEnd) {
                invalidDates.push(dateString)
                errors.push(`Date ${dateString} is beyond validity end date ${validity!.endDate} (${validityDays} days from start)`)
            } else {
                validDates.push(dateString)
            }
        } else {
            // No validity window - all dates are valid
            validDates.push(dateString)
        }

        // Check if date is in past
        if (isDateInPast(dateString)) {
            warnings.push(`Date ${dateString} is in the past`)
        }
    }

    // 5. Check class count
    if (validDates.length < classCount) {
        warnings.push(`Only ${validDates.length} valid classes scheduled, but package requires ${classCount} classes`)
    } else if (validDates.length > classCount) {
        warnings.push(`${validDates.length} classes scheduled, but package only includes ${classCount} classes`)
    }

    // 6. Check if dates span multiple months (informational only - allowed for crash courses)
    if (validDates.length > 0) {
        const months = new Set(validDates.map(d => d.substring(0, 7))) // YYYY-MM
        if (months.size > 1) {
            const monthList = Array.from(months).sort().join(', ')
            console.log(`ℹ️ Crash course spans multiple calendar months: ${monthList} (This is allowed${validity ? ' within validity period' : ''})`)
        }
    }

    return {
        valid: errors.length === 0,
        validityStartDate: validity?.startDate || request.startDate,
        validityEndDate: validity?.endDate || 'unlimited',
        validDates,
        invalidDates,
        errors,
        warnings
    }
}

/**
 * Validate crash course assignment creation
 */
export async function validateCrashCourseAssignment(
    packageId: string,
    startDate: string,
    dates: string[]
): Promise<{ valid: boolean; error?: string; details?: CrashCourseValidation }> {
    try {
        const validation = await validateCrashCourseDates({
            packageId,
            startDate,
            dates
        })

        if (!validation.valid) {
            return {
                valid: false,
                error: `Crash course validation failed:\n${validation.errors.join('\n')}`,
                details: validation
            }
        }

        if (validation.warnings.length > 0) {
            console.warn('⚠️ Crash Course Warnings:', validation.warnings)
        }

        console.log(`✅ Crash course validation passed: ${validation.validDates.length} classes within validity window`)

        return {
            valid: true,
            details: validation
        }
    } catch (error) {
        console.error('Error validating crash course:', error)
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ============================================================================
// Adhoc Class Validation
// ============================================================================

/**
 * Validate adhoc class requirements
 */
export function validateAdhocClass(request: AdhocValidationRequest): AdhocValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // 1. Validate date
    if (!request.date || request.date.trim() === '') {
        errors.push('Date is required for adhoc class')
    } else {
        // Check date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(request.date)) {
            errors.push('Date must be in YYYY-MM-DD format')
        } else {
            // Check if date is valid
            const date = new Date(request.date + 'T00:00:00.000Z')
            if (isNaN(date.getTime())) {
                errors.push('Invalid date')
            } else {
                // Check if date is in past
                if (isDateInPast(request.date)) {
                    errors.push('Adhoc class date cannot be in the past')
                }
            }
        }
    }

    // 2. Validate class type
    if (!request.classTypeId || request.classTypeId.trim() === '') {
        errors.push('Class type is required for adhoc class')
    } else {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(request.classTypeId)) {
            errors.push('Invalid class type ID format')
        }
    }

    // 3. Validate booking (Phase 2 requirement)
    if (!request.bookingIds || request.bookingIds.length === 0) {
        errors.push('⚠️ Adhoc class requires a booking. Please select a booking or create a Quick Booking.')
    } else {
        const validBookings = request.bookingIds.filter(id => id && id.trim() !== '')
        if (validBookings.length === 0) {
            errors.push('⚠️ Adhoc class requires a valid booking ID')
        }
    }

    // 4. Validate instructor
    if (!request.instructorId || request.instructorId.trim() === '') {
        errors.push('Instructor is required for adhoc class')
    } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(request.instructorId)) {
            errors.push('Invalid instructor ID format')
        }
    }

    // Log results
    if (errors.length > 0) {
        console.error('❌ Adhoc class validation failed:', errors)
    } else {
        console.log('✅ Adhoc class validation passed')
    }

    if (warnings.length > 0) {
        console.warn('⚠️ Adhoc class warnings:', warnings)
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Validate adhoc class doesn't conflict with existing assignments
 */
export async function checkAdhocConflicts(
    instructorId: string,
    date: string,
    startTime: string,
    endTime: string
): Promise<{ hasConflict: boolean; conflictDetails?: any }> {
    try {
        const { data: existingAssignments, error } = await supabase
            .from('class_assignments')
            .select('id, date, start_time, end_time, class_status')
            .eq('instructor_id', instructorId)
            .eq('date', date)
            .neq('class_status', 'cancelled')

        if (error) {
            console.error('Error checking conflicts:', error)
            return { hasConflict: false }
        }

        if (!existingAssignments || existingAssignments.length === 0) {
            return { hasConflict: false }
        }

        // Check time overlap
        for (const existing of existingAssignments) {
            const existingStart = existing.start_time
            const existingEnd = existing.end_time

            // Check if times overlap
            // New class: [startTime, endTime]
            // Existing: [existingStart, existingEnd]
            // Overlap if: startTime < existingEnd AND endTime > existingStart
            if (startTime < existingEnd && endTime > existingStart) {
                console.warn(`⚠️ Time conflict detected with existing assignment on ${date}`)
                return {
                    hasConflict: true,
                    conflictDetails: {
                        existingAssignmentId: existing.id,
                        existingTime: `${existingStart} - ${existingEnd}`,
                        requestedTime: `${startTime} - ${endTime}`
                    }
                }
            }
        }

        return { hasConflict: false }
    } catch (error) {
        console.error('Exception checking adhoc conflicts:', error)
        return { hasConflict: false }
    }
}

// ============================================================================
// Enforcement Helpers
// ============================================================================

/**
 * Get all dates from crash course assignments for validation
 */
export function extractDatesFromAssignments(assignments: any[]): string[] {
    return assignments.map(a => a.date).filter(d => d && typeof d === 'string')
}

/**
 * Filter crash course dates to only valid ones within validity window
 */
export function filterValidCrashCourseDates(
    dates: string[],
    validityStart: string,
    validityEnd: string
): string[] {
    const start = parseDateToUTC(validityStart)
    const end = parseDateToUTC(validityEnd)

    return dates.filter(dateString => {
        const date = parseDateToUTC(dateString)
        return date >= start && date <= end
    })
}

/**
 * Check if crash course validity window allows all required classes
 */
export function canFitClassesInValidityWindow(
    startDate: string,
    validityDays: number,
    classCount: number,
    weeklyDays: number[]
): { canFit: boolean; maxPossible: number; reason?: string } {
    const validity = calculateCrashCourseValidity(startDate, validityDays)
    const start = parseDateToUTC(validity.startDate)
    const end = parseDateToUTC(validity.endDate)

    // Count how many days of the week fall within the validity window
    let count = 0
    const current = new Date(start)

    while (current <= end) {
        const dayOfWeek = current.getDay()
        if (weeklyDays.includes(dayOfWeek)) {
            count++
        }
        current.setDate(current.getDate() + 1)
    }

    if (count >= classCount) {
        return { canFit: true, maxPossible: count }
    } else {
        return {
            canFit: false,
            maxPossible: count,
            reason: `Only ${count} occurrences of selected days within ${validityDays}-day window, need ${classCount} classes`
        }
    }
}
