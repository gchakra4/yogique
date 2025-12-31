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
import { getNextMonth } from './monthlySchedulingService'

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

        return {
            success: true,
            booking_id: booking.id,
            booking_code: booking.booking_id,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            calendar_month: targetMonth
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
