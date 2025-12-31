/**
 * ============================================================================
 * PHASE 3: MONTHLY SCHEDULING SERVICE
 * ============================================================================
 * 
 * Implements calendar month-based scheduling logic for monthly subscriptions.
 * 
 * Business Rules:
 * - Monthly plans are tied to calendar month boundaries ONLY (Jan 1-31, Feb 1-28, etc.)
 * - No rolling 30 days, no sliding window
 * - Fixed monthly class count is GUARANTEED
 * - Preferred weekday pattern is best-effort, not absolute
 * - Adjustments are added INSIDE same month to meet guaranteed count
 * - No cross-month spillover ever
 * - First month is prorated (only remaining eligible days)
 */

import { supabase } from '../../../../../../shared/lib/supabase'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CalendarMonthBoundaries {
    year: number
    month: number // 1-12
    startDate: Date // First day of month (00:00:00)
    endDate: Date // Last day of month (23:59:59)
    monthKey: string // YYYY-MM format
    daysInMonth: number
}

export interface WeekdayOccurrence {
    date: Date
    dateString: string // YYYY-MM-DD
    dayOfWeek: number // 0=Sun, 6=Sat
    weekNumber: number // 1-5 (which occurrence in month)
}

export interface SchedulingPlan {
    calendarMonth: string // YYYY-MM
    requiredClassCount: number
    preferredDays: number[] // e.g., [1,3,5] for Mon/Wed/Fri
    availableOccurrences: WeekdayOccurrence[]
    scheduledClasses: WeekdayOccurrence[]
    adjustmentClasses: AdjustmentRecommendation[] // Changed from WeekdayOccurrence[]
    shortfall: number // Negative if shortage, positive if excess
    isFirstMonth: boolean
    proratedCount?: number // Only for first month
}

export interface AdjustmentRecommendation {
    date: Date
    dateString: string
    dayOfWeek: number
    reason: string
    isAdjustment: true
    originalPreferredDay?: number
}

// ============================================================================
// Calendar Month Calculations
// ============================================================================

/**
 * Get calendar month boundaries for a given date
 */
export function getCalendarMonthBoundaries(date: Date): CalendarMonthBoundaries {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-12

    // First day of month at 00:00:00
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    
    // Last day of month at 23:59:59
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)
    
    const daysInMonth = endDate.getDate()
    const monthKey = `${year}-${String(month).padStart(2, '0')}`

    return {
        year,
        month,
        startDate,
        endDate,
        monthKey,
        daysInMonth
    }
}

/**
 * Get calendar month boundaries for a month string (YYYY-MM)
 */
export function getCalendarMonthBoundariesFromString(monthKey: string): CalendarMonthBoundaries {
    const [yearStr, monthStr] = monthKey.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    
    const date = new Date(year, month - 1, 15) // Use mid-month to avoid timezone issues
    return getCalendarMonthBoundaries(date)
}

/**
 * Check if a date falls within calendar month boundaries
 */
export function isDateInMonth(date: Date, monthBoundaries: CalendarMonthBoundaries): boolean {
    return date >= monthBoundaries.startDate && date <= monthBoundaries.endDate
}

/**
 * Get the next calendar month
 */
export function getNextMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

/**
 * Calculate remaining days in first month (proration)
 * Returns the number of eligible days from start_date to end of month
 */
export function calculateRemainingDaysInMonth(startDate: Date): number {
    const boundaries = getCalendarMonthBoundaries(startDate)
    const remainingDays = Math.floor((boundaries.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(0, remainingDays)
}

// ============================================================================
// Weekday Occurrence Finder
// ============================================================================

/**
 * Find all occurrences of specific weekdays in a calendar month
 * @param monthBoundaries - The calendar month to search
 * @param weekdays - Array of weekdays to find (0=Sun, 6=Sat). e.g., [1,3,5] for Mon/Wed/Fri
 * @param startFrom - Optional start date (for first month proration)
 */
export function findWeekdayOccurrences(
    monthBoundaries: CalendarMonthBoundaries,
    weekdays: number[],
    startFrom?: Date
): WeekdayOccurrence[] {
    const occurrences: WeekdayOccurrence[] = []
    const effectiveStart = startFrom && startFrom > monthBoundaries.startDate ? startFrom : monthBoundaries.startDate
    
    // Iterate through each day in the month (or from startFrom)
    const currentDate = new Date(effectiveStart)
    
    // Track week number per weekday
    const weekCounters: Record<number, number> = {}
    weekdays.forEach(day => weekCounters[day] = 0)
    
    while (currentDate <= monthBoundaries.endDate) {
        const dayOfWeek = currentDate.getDay()
        
        if (weekdays.includes(dayOfWeek)) {
            weekCounters[dayOfWeek]++
            
            occurrences.push({
                date: new Date(currentDate),
                dateString: formatDateYYYYMMDD(currentDate),
                dayOfWeek,
                weekNumber: weekCounters[dayOfWeek]
            })
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Count occurrences of specific weekdays in a month
 */
export function countWeekdayOccurrences(
    monthBoundaries: CalendarMonthBoundaries,
    weekdays: number[],
    startFrom?: Date
): number {
    return findWeekdayOccurrences(monthBoundaries, weekdays, startFrom).length
}

// ============================================================================
// Shortfall Detection & Adjustment Planning
// ============================================================================

/**
 * Detect if there's a scheduling shortfall and plan adjustments
 * Returns negative if shortage, positive if excess, 0 if exact match
 */
export function detectSchedulingShortfall(
    requiredClasses: number,
    availableOccurrences: WeekdayOccurrence[]
): number {
    return availableOccurrences.length - requiredClasses
}

/**
 * Generate adjustment class recommendations to fill shortfalls
 * Uses intelligent logic to find best alternative days within the same month
 */
export function generateAdjustmentRecommendations(
    monthBoundaries: CalendarMonthBoundaries,
    preferredDays: number[],
    availableOccurrences: WeekdayOccurrence[],
    shortfall: number,
    startFrom?: Date
): AdjustmentRecommendation[] {
    if (shortfall >= 0) {
        return [] // No shortage, no adjustments needed
    }
    
    const adjustmentsNeeded = Math.abs(shortfall)
    const adjustments: AdjustmentRecommendation[] = []
    
    // Get all days already scheduled
    const scheduledDates = new Set(availableOccurrences.map(occ => occ.dateString))
    
    // Strategy: Find nearest alternative weekdays
    // Priority order: adjacent weekdays, then any available weekday
    const alternativeDays = [0, 1, 2, 3, 4, 5, 6].filter(day => !preferredDays.includes(day))
    
    // Find alternative day occurrences
    const alternativeOccurrences = findWeekdayOccurrences(monthBoundaries, alternativeDays, startFrom)
        .filter(occ => !scheduledDates.has(occ.dateString))
        .sort((a, b) => {
            // Prefer days close to preferred days
            const aCloseness = Math.min(...preferredDays.map(pDay => Math.abs(a.dayOfWeek - pDay)))
            const bCloseness = Math.min(...preferredDays.map(pDay => Math.abs(b.dayOfWeek - pDay)))
            return aCloseness - bCloseness
        })
    
    // Select the needed number of adjustments
    for (let i = 0; i < Math.min(adjustmentsNeeded, alternativeOccurrences.length); i++) {
        const alt = alternativeOccurrences[i]
        const closestPreferredDay = preferredDays.reduce((closest, pDay) => {
            const currentDist = Math.abs(alt.dayOfWeek - pDay)
            const closestDist = Math.abs(alt.dayOfWeek - closest)
            return currentDist < closestDist ? pDay : closest
        }, preferredDays[0])
        
        adjustments.push({
            date: alt.date,
            dateString: alt.dateString,
            dayOfWeek: alt.dayOfWeek,
            reason: `Calendar shortage: Only ${availableOccurrences.length} ${getDayNames(preferredDays)} available, need ${availableOccurrences.length + adjustmentsNeeded} classes`,
            isAdjustment: true,
            originalPreferredDay: closestPreferredDay
        })
    }
    
    return adjustments
}

/**
 * Create a complete scheduling plan for a calendar month
 */
export function createMonthlySchedulingPlan(
    startDate: Date,
    requiredClassCount: number,
    preferredDays: number[], // e.g., [1,3,5] for Mon/Wed/Fri
    isFirstMonth: boolean = false
): SchedulingPlan {
    const boundaries = getCalendarMonthBoundaries(startDate)
    const effectiveStart = isFirstMonth ? startDate : boundaries.startDate
    
    // Find available occurrences of preferred days
    const availableOccurrences = findWeekdayOccurrences(boundaries, preferredDays, effectiveStart)
    
    // Calculate if we have shortage or excess
    const shortfall = detectSchedulingShortfall(requiredClassCount, availableOccurrences)
    
    let scheduledClasses: WeekdayOccurrence[]
    let adjustmentClasses: AdjustmentRecommendation[] = []
    
    if (shortfall < 0) {
        // SHORTAGE: Need more classes than preferred days available
        // Schedule all available preferred days
        scheduledClasses = [...availableOccurrences]
        
        // Generate adjustment recommendations
        adjustmentClasses = generateAdjustmentRecommendations(
            boundaries,
            preferredDays,
            availableOccurrences,
            shortfall,
            effectiveStart
        )
    } else if (shortfall > 0) {
        // EXCESS: More preferred days available than needed
        // Schedule only required count (take first N occurrences)
        scheduledClasses = availableOccurrences.slice(0, requiredClassCount)
    } else {
        // EXACT MATCH: Perfect fit
        scheduledClasses = [...availableOccurrences]
    }
    
    return {
        calendarMonth: boundaries.monthKey,
        requiredClassCount,
        preferredDays,
        availableOccurrences,
        scheduledClasses,
        adjustmentClasses,
        shortfall,
        isFirstMonth,
        proratedCount: isFirstMonth ? scheduledClasses.length + adjustmentClasses.length : undefined
    }
}

// ============================================================================
// Validation & Blocking
// ============================================================================

/**
 * Validate that a date is within the same calendar month
 * Throws error if date crosses month boundary
 */
export function validateDateWithinMonth(date: Date, monthKey: string): void {
    const boundaries = getCalendarMonthBoundariesFromString(monthKey)
    if (!isDateInMonth(date, boundaries)) {
        throw new Error(
            `❌ CROSS-MONTH SCHEDULING BLOCKED: Date ${formatDateYYYYMMDD(date)} is not in calendar month ${monthKey}. ` +
            `Monthly classes must be scheduled within calendar month boundaries (${formatDateYYYYMMDD(boundaries.startDate)} to ${formatDateYYYYMMDD(boundaries.endDate)}).`
        )
    }
}

/**
 * Validate that all dates in an array are within the same calendar month
 */
export function validateAllDatesWithinMonth(dates: Date[], monthKey: string): void {
    dates.forEach(date => validateDateWithinMonth(date, monthKey))
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateYYYYMMDD(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getDayNames(weekdays: number[]): string {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return weekdays.map(day => dayNames[day]).join('/')
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

/**
 * Get the current calendar month key
 */
export function getCurrentMonthKey(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ============================================================================
// Database Integration
// ============================================================================

/**
 * Get existing classes for a calendar month
 */
export async function getExistingClassesForMonth(
    instructorId: string,
    monthKey: string
): Promise<any[]> {
    const { data, error } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('calendar_month', monthKey)
        .eq('schedule_type', 'monthly')
        .order('date', { ascending: true })
    
    if (error) {
        console.error('Error fetching existing classes:', error)
        return []
    }
    
    return data || []
}

/**
 * Check if any adjustments already exist for a month
 */
export async function hasExistingAdjustments(
    instructorId: string,
    monthKey: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('class_assignments')
        .select('id')
        .eq('instructor_id', instructorId)
        .eq('calendar_month', monthKey)
        .eq('is_adjustment', true)
        .limit(1)
    
    if (error) {
        console.error('Error checking adjustments:', error)
        return false
    }
    
    return (data?.length || 0) > 0
}
