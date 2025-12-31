/**
 * ============================================================================
 * PHASE 8: AUTOMATED INVOICE GENERATION SERVICE (T-5 Days)
 * ============================================================================
 * Purpose: Automatically generate invoices 5 days before billing cycle
 * Schedule: Daily cron job checks which bookings need invoice generation
 * 
 * Business Rules:
 * - Generate invoice T-5 days before billing_cycle_anchor
 * - Only for is_recurring = true bookings
 * - Only if status = 'confirmed' or 'active'
 * - Only if access_status != 'overdue_locked'
 * - Skip if invoice already exists for target month
 * ============================================================================
 */

import { supabase } from '../../../../../../shared/lib/supabase'
import {
    calculateMonthlyInvoice,
    type MonthlyInvoiceRequest
} from './monthlyInvoiceService'
import { getCalendarMonthBoundaries, getNextMonth } from './monthlySchedulingService'

// ============================================================================
// Configuration
// ============================================================================

const T_MINUS_DAYS = 5 // Generate invoice 5 days before billing cycle
const BATCH_SIZE = 50 // Process bookings in batches

// ============================================================================
// Types
// ============================================================================

export interface BookingForInvoice {
    id: string
    booking_id: string // External code like "YG-202501-0042"
    user_id: string
    first_name: string
    last_name: string
    email: string
    billing_cycle_anchor: string // YYYY-MM-DD
    is_recurring: boolean
    access_status: 'active' | 'overdue_grace' | 'overdue_locked'
    status: string
    class_package_id?: string
    package_total_amount?: number
}

export interface InvoiceGenerationResult {
    success: boolean
    booking_id: string
    booking_code: string
    invoice_id?: string
    invoice_number?: string
    calendar_month?: string
    classes_generated?: number
    classes_error?: string
    error?: string
    skipped_reason?: string
}

export interface BatchGenerationSummary {
    total_checked: number
    total_generated: number
    total_skipped: number
    total_errors: number
    results: InvoiceGenerationResult[]
}

export interface ClassAssignment {
    package_id: string
    class_package_id: string
    date: string
    start_time: string
    end_time: string
    instructor_id: string
    payment_amount: number
    schedule_type: string
    assigned_by: string
    booking_type: string
    class_status: string
    payment_status: string
    instructor_status: string
    calendar_month: string
    is_adjustment: boolean
}

export interface ClassGenerationResult {
    success: boolean
    booking_id: string
    booking_code: string
    classes_generated?: number
    calendar_month?: string
    error?: string
    skipped_reason?: string
}

// ============================================================================
// T-5 Day Invoice Check
// ============================================================================

/**
 * Calculate which date is T-5 days before a given billing_cycle_anchor
 */
export function calculateT5Date(billingCycleAnchor: string): string {
    const anchorDate = new Date(billingCycleAnchor + 'T00:00:00.000Z')
    const t5Date = new Date(anchorDate)
    t5Date.setUTCDate(t5Date.getUTCDate() - T_MINUS_DAYS)
    return t5Date.toISOString().split('T')[0]
}

/**
 * Check if today is T-5 days before next billing cycle
 */
export function shouldGenerateInvoiceToday(billingCycleAnchor: string): {
    should: boolean
    targetMonth: string | null
    daysUntilBilling: number
} {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    
    const anchorDate = new Date(billingCycleAnchor + 'T00:00:00.000Z')
    const nextMonthKey = getNextMonth(anchorDate.toISOString().substring(0, 7))
    const nextBillingDate = new Date(nextMonthKey + '-' + anchorDate.getUTCDate().toString().padStart(2, '0') + 'T00:00:00.000Z')
    
    const daysUntilBilling = Math.floor((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const shouldGenerate = daysUntilBilling === T_MINUS_DAYS
    
    return {
        should: shouldGenerate,
        targetMonth: shouldGenerate ? nextMonthKey : null,
        daysUntilBilling
    }
}

// ============================================================================
// Fetch Bookings Due for Invoice
// ============================================================================

/**
 * Get all bookings that need invoice generation today (T-5 days)
 */
export async function getBookingsDueForInvoice(): Promise<{
    bookings: BookingForInvoice[]
    error?: string
}> {
    try {
        // Fetch all active recurring bookings
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                id,
                booking_id,
                user_id,
                first_name,
                last_name,
                email,
                billing_cycle_anchor,
                is_recurring,
                access_status,
                status,
                class_package_id,
                class_packages!inner (
                    total_amount
                )
            `)
            .eq('is_recurring', true)
            .in('status', ['confirmed', 'active'])
            .not('billing_cycle_anchor', 'is', null)

        if (error) {
            console.error('Error fetching bookings:', error)
            return { bookings: [], error: error.message }
        }

        if (!bookings || bookings.length === 0) {
            return { bookings: [] }
        }

        // Filter bookings where today is T-5 days
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        
        const dueBookings = bookings.filter(b => {
            // Skip if locked
            if (b.access_status === 'overdue_locked') {
                return false
            }

            const check = shouldGenerateInvoiceToday(b.billing_cycle_anchor!)
            return check.should
        })

        // Transform data
        const transformedBookings: BookingForInvoice[] = dueBookings.map(b => ({
            id: b.id,
            booking_id: b.booking_id,
            user_id: b.user_id,
            first_name: b.first_name,
            last_name: b.last_name,
            email: b.email,
            billing_cycle_anchor: b.billing_cycle_anchor!,
            is_recurring: b.is_recurring,
            access_status: b.access_status as any,
            status: b.status,
            class_package_id: b.class_package_id,
            package_total_amount: (b.class_packages as any)?.total_amount
        }))

        return { bookings: transformedBookings }

    } catch (error) {
        console.error('Unexpected error in getBookingsDueForInvoice:', error)
        return {
            bookings: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ============================================================================
// Generate Monthly Classes
// ============================================================================

/**
 * Generate class assignments for next calendar month
 */
export async function generateMonthlyClassesForBooking(
    booking: BookingForInvoice,
    targetMonth: string
): Promise<ClassGenerationResult> {
    try {
        console.log(`Generating classes for ${booking.booking_id} - Month: ${targetMonth}`)

        // Get booking details with weekly schedule preferences
        const { data: bookingDetails, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                id,
                booking_id,
                user_id,
                class_package_id,
                instructor_id,
                start_time,
                end_time,
                weekly_days,
                booking_type,
                class_packages!inner(
                    id,
                    class_count,
                    total_amount
                )
            `)
            .eq('id', booking.id)
            .single()

        if (bookingError || !bookingDetails) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: `Failed to fetch booking details: ${bookingError?.message || 'Not found'}`
            }
        }

        const packageData = (bookingDetails.class_packages as any)
        if (!packageData || !packageData.class_count) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: 'Package has no class_count'
            }
        }

        const weeklyDays = bookingDetails.weekly_days as number[] || []
        if (weeklyDays.length === 0) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: 'No weekly_days preference found'
            }
        }

        // Parse target month (YYYY-MM)
        const [year, month] = targetMonth.split('-').map(Number)
        const monthStart = new Date(Date.UTC(year, month - 1, 1))
        const monthBoundaries = getCalendarMonthBoundaries(monthStart)

        // Generate classes for all selected days in the month
        const assignments: ClassAssignment[] = []
        const sortedWeeklyDays = [...weeklyDays].sort((a, b) => a - b)
        const requiredClasses = packageData.class_count
        const perClassAmount = packageData.total_amount / requiredClasses

        let currentDate = new Date(monthBoundaries.startDate)
        let classesGenerated = 0

        while (currentDate <= monthBoundaries.endDate && classesGenerated < requiredClasses) {
            const dayOfWeek = currentDate.getUTCDay()

            if (sortedWeeklyDays.includes(dayOfWeek)) {
                const dateStr = currentDate.toISOString().split('T')[0]

                assignments.push({
                    package_id: bookingDetails.class_package_id,
                    class_package_id: bookingDetails.class_package_id,
                    date: dateStr,
                    start_time: bookingDetails.start_time,
                    end_time: bookingDetails.end_time,
                    instructor_id: bookingDetails.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'monthly',
                    assigned_by: 'system_automated', // System-generated
                    booking_type: bookingDetails.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending',
                    calendar_month: targetMonth,
                    is_adjustment: false
                })

                classesGenerated++
            }

            // Move to next day
            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
        }

        if (assignments.length === 0) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: 'No classes could be generated for the month'
            }
        }

        // Insert class assignments
        const { data: insertedAssignments, error: insertError } = await supabase
            .from('class_assignments')
            .insert(assignments)
            .select('id')

        if (insertError) {
            console.error('Failed to insert class assignments:', insertError)
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: `Database insert failed: ${insertError.message}`
            }
        }

        // Link assignments to booking
        if (insertedAssignments && insertedAssignments.length > 0) {
            const bookingLinks = insertedAssignments.map(assignment => ({
                assignment_id: assignment.id,
                booking_id: bookingDetails.id
            }))

            const { error: linkError } = await supabase
                .from('assignment_bookings')
                .insert(bookingLinks)

            if (linkError) {
                console.warn('Failed to link assignments to booking:', linkError)
                // Don't fail completely - assignments were created
            }
        }

        console.log(`✅ Generated ${assignments.length} classes for ${booking.booking_id} (Month: ${targetMonth})`)

        return {
            success: true,
            booking_id: booking.id,
            booking_code: booking.booking_id,
            classes_generated: assignments.length,
            calendar_month: targetMonth
        }

    } catch (error) {
        console.error('Error generating classes for booking:', error)
        return {
            success: false,
            booking_id: booking.id,
            booking_code: booking.booking_id,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ============================================================================
// Check Existing Invoice
// ============================================================================

/**
 * Check if invoice already exists for booking + calendar month
 */
export async function invoiceExistsForMonth(
    bookingId: string,
    calendarMonth: string
): Promise<{ exists: boolean; invoiceId?: string; error?: string }> {
    try {
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('id, invoice_number')
            .eq('booking_id', bookingId)
            .eq('billing_month', calendarMonth)
            .limit(1)

        if (error) {
            return { exists: false, error: error.message }
        }

        if (invoices && invoices.length > 0) {
            return { exists: true, invoiceId: invoices[0].id }
        }

        return { exists: false }

    } catch (error) {
        return {
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ============================================================================
// Generate Single Invoice
// ============================================================================

/**
 * Generate invoice for a single booking
 */
export async function generateInvoiceForBooking(
    booking: BookingForInvoice
): Promise<InvoiceGenerationResult> {
    try {
        // Determine target month
        const check = shouldGenerateInvoiceToday(booking.billing_cycle_anchor)
        if (!check.should || !check.targetMonth) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                skipped_reason: `Not T-5 day (${check.daysUntilBilling} days until billing)`
            }
        }

        const targetMonth = check.targetMonth

        // Check if invoice already exists
        const existingCheck = await invoiceExistsForMonth(booking.id, targetMonth)
        if (existingCheck.error) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: `Failed to check existing invoice: ${existingCheck.error}`
            }
        }

        if (existingCheck.exists) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                skipped_reason: `Invoice already exists for ${targetMonth}`
            }
        }

        // Get package price
        if (!booking.package_total_amount) {
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: 'No package amount found'
            }
        }

        // Calculate invoice
        const request: MonthlyInvoiceRequest = {
            bookingId: booking.booking_id,
            userId: booking.user_id,
            startDate: booking.billing_cycle_anchor,
            fullMonthlyPrice: booking.package_total_amount,
            packageId: booking.class_package_id
        }

        const invoiceCalc = calculateMonthlyInvoice(request, targetMonth)

        // Insert invoice into database
        const { data: invoice, error: insertError } = await supabase
            .from('invoices')
            .insert({
                booking_id: booking.id,
                user_id: booking.user_id,
                status: 'pending',
                billing_month: targetMonth,
                billing_period_start: invoiceCalc.billingPeriodStart,
                billing_period_end: invoiceCalc.billingPeriodEnd,
                base_amount: invoiceCalc.baseAmount,
                tax_rate: invoiceCalc.taxRate,
                tax_amount: invoiceCalc.taxAmount,
                total_amount: invoiceCalc.totalAmount,
                due_date: invoiceCalc.dueDate,
                proration_note: invoiceCalc.proration?.prorationNote,
                currency: 'INR',
                created_at: new Date().toISOString()
            })
            .select('id, invoice_number')
            .single()

        if (insertError) {
            console.error('Failed to insert invoice:', insertError)
            return {
                success: false,
                booking_id: booking.id,
                booking_code: booking.booking_id,
                error: `Database insert failed: ${insertError.message}`
            }
        }

        console.log(`✅ Invoice generated: ${invoice.invoice_number} for ${booking.booking_id}`)

        // Generate monthly classes for this booking
        const classResult = await generateMonthlyClassesForBooking(booking, targetMonth)

        if (!classResult.success) {
            console.warn(`⚠️ Classes generation failed for ${booking.booking_id}:`, classResult.error)
            // Invoice created but classes failed - log warning but don't fail completely
        }

        return {
            success: true,
            booking_id: booking.id,
            booking_code: booking.booking_id,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            calendar_month: targetMonth,
            classes_generated: classResult.classes_generated,
            classes_error: classResult.error
        }

    } catch (error) {
        console.error('Error generating invoice for booking:', error)
        return {
            success: false,
            booking_id: booking.id,
            booking_code: booking.booking_id,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ============================================================================
// Batch Generation
// ============================================================================

/**
 * Generate invoices for all bookings due today
 */
export async function generateInvoicesBatch(): Promise<BatchGenerationSummary> {
    console.log('Starting T-5 day invoice generation...')
    
    // Fetch bookings
    const { bookings, error: fetchError } = await getBookingsDueForInvoice()
    
    if (fetchError) {
        console.error('Failed to fetch bookings:', fetchError)
        return {
            total_checked: 0,
            total_generated: 0,
            total_skipped: 0,
            total_errors: 1,
            results: [{
                success: false,
                booking_id: 'N/A',
                booking_code: 'N/A',
                error: fetchError
            }]
        }
    }

    if (bookings.length === 0) {
        console.log('No bookings due for invoice generation today')
        return {
            total_checked: 0,
            total_generated: 0,
            total_skipped: 0,
            total_errors: 0,
            results: []
        }
    }

    console.log(`Found ${bookings.length} bookings to check`)

    // Process in batches
    const results: InvoiceGenerationResult[] = []
    
    for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
        const batch = bookings.slice(i, i + BATCH_SIZE)
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(bookings.length / BATCH_SIZE)}`)
        
        const batchResults = await Promise.all(
            batch.map(booking => generateInvoiceForBooking(booking))
        )
        
        results.push(...batchResults)
    }

    // Calculate summary
    const summary: BatchGenerationSummary = {
        total_checked: bookings.length,
        total_generated: results.filter(r => r.success).length,
        total_skipped: results.filter(r => r.skipped_reason).length,
        total_errors: results.filter(r => r.error).length,
        results
    }

    console.log('Invoice generation complete:')
    console.log(`  - Total checked: ${summary.total_checked}`)
    console.log(`  - Generated: ${summary.total_generated}`)
    console.log(`  - Skipped: ${summary.total_skipped}`)
    console.log(`  - Errors: ${summary.total_errors}`)

    return summary
}

// ============================================================================
// Export
// ============================================================================

export default {
    calculateT5Date,
    shouldGenerateInvoiceToday,
    getBookingsDueForInvoice,
    invoiceExistsForMonth,
    generateInvoiceForBooking,
    generateInvoicesBatch
}
