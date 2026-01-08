/**
 * ============================================================================
 * PHASE 4: MONTHLY INVOICE SERVICE
 * ============================================================================
 * 
 * Implements automatic invoice generation for monthly subscriptions with
 * first month proration and calendar month-based billing.
 * 
 * Business Rules:
 * - First month is ALWAYS prorated (based on eligible days from start_date)
 * - Subsequent months are ALWAYS full monthly rate
 * - Invoices generated at billing_cycle_anchor date (default: start_date)
 * - Invoice due date: billing_cycle_anchor + grace period (configurable)
 * - One invoice per booking per calendar month
 * - Proration based on calendar month days, not 30-day average
 */

import { supabase } from '../../../../../../shared/lib/supabase'
import {
    calculateRemainingDaysInMonth,
    getCalendarMonthBoundaries,
    getNextMonth
} from './monthlySchedulingService'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProrationDetails {
    isProrated: boolean
    eligibleDays: number
    totalDaysInMonth: number
    proratedAmount: number
    fullMonthAmount: number
    prorationPercentage: number
    prorationNote: string
}

export interface InvoiceCalculation {
    bookingId: string
    userId: string
    calendarMonth: string // YYYY-MM
    billingPeriodStart: string // YYYY-MM-DD
    billingPeriodEnd: string // YYYY-MM-DD
    billingMonth: string // "Jan 2025"
    baseAmount: number
    taxRate: number
    taxAmount: number
    totalAmount: number
    dueDate: string // YYYY-MM-DD
    isFirstMonth: boolean
    proration: ProrationDetails | null
    invoiceNumber?: string // Generated during insert
}

export interface MonthlyInvoiceRequest {
    bookingId: string // External booking code (e.g., "YG-202501-0042")
    userId: string
    startDate: string // YYYY-MM-DD (billing_cycle_anchor)
    fullMonthlyPrice: number
    taxRate?: number // Default: 18%
    gracePeriodDays?: number // Default: 7 days
    packageId?: string
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_TAX_RATE = 18 // 18% GST for India
const DEFAULT_GRACE_PERIOD_DAYS = 7
const DEFAULT_CURRENCY = 'INR'
const INVOICE_PREFIX = 'YG' // YogiQue invoice prefix

// ============================================================================
// Proration Calculations
// ============================================================================

/**
 * Calculate first month proration details
 */
export function calculateFirstMonthProration(
    startDate: Date,
    fullMonthlyPrice: number
): ProrationDetails {
    const boundaries = getCalendarMonthBoundaries(startDate)
    const eligibleDays = calculateRemainingDaysInMonth(startDate)
    const totalDaysInMonth = boundaries.daysInMonth
    
    // Calculate proration percentage
    const prorationPercentage = eligibleDays / totalDaysInMonth
    const proratedAmount = Math.round(fullMonthlyPrice * prorationPercentage * 100) / 100
    
    // Generate human-readable note
    const prorationNote = `Prorated: ${eligibleDays}/${totalDaysInMonth} days of ${boundaries.monthKey}`
    
    return {
        isProrated: true,
        eligibleDays,
        totalDaysInMonth,
        proratedAmount,
        fullMonthAmount: fullMonthlyPrice,
        prorationPercentage: Math.round(prorationPercentage * 10000) / 100, // Percentage with 2 decimals
        prorationNote
    }
}

/**
 * Check if a given calendar month is the first billing month
 */
export function isFirstBillingMonth(startDate: Date, calendarMonth: string): boolean {
    const boundaries = getCalendarMonthBoundaries(startDate)
    return boundaries.monthKey === calendarMonth
}

/**
 * Calculate invoice amount with tax
 */
export function calculateInvoiceWithTax(
    baseAmount: number,
    taxRate: number = DEFAULT_TAX_RATE
): { baseAmount: number; taxAmount: number; totalAmount: number } {
    const taxAmount = Math.round(baseAmount * (taxRate / 100) * 100) / 100
    const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100
    
    return {
        baseAmount: Math.round(baseAmount * 100) / 100,
        taxAmount,
        totalAmount
    }
}

// ============================================================================
// Invoice Calculation
// ============================================================================

/**
 * Calculate invoice for a specific calendar month
 */
export function calculateMonthlyInvoice(
    request: MonthlyInvoiceRequest,
    calendarMonth: string
): InvoiceCalculation {
    const startDate = new Date(request.startDate + 'T00:00:00.000Z')
    const boundaries = getCalendarMonthBoundaries(new Date(calendarMonth + '-15T00:00:00.000Z'))
    const taxRate = request.taxRate ?? DEFAULT_TAX_RATE
    const gracePeriodDays = request.gracePeriodDays ?? DEFAULT_GRACE_PERIOD_DAYS
    
    // Determine if this is the first month
    const isFirst = isFirstBillingMonth(startDate, calendarMonth)
    
    // Calculate base amount (prorated or full)
    let baseAmount: number
    let proration: ProrationDetails | null = null
    
    if (isFirst) {
        proration = calculateFirstMonthProration(startDate, request.fullMonthlyPrice)
        baseAmount = proration.proratedAmount
    } else {
        baseAmount = request.fullMonthlyPrice
    }
    
    // Calculate tax and total
    const amounts = calculateInvoiceWithTax(baseAmount, taxRate)
    
    // Calculate due date (first day of month + grace period)
    const dueDate = new Date(boundaries.startDate)
    dueDate.setDate(dueDate.getDate() + gracePeriodDays)
    
    // Format human-readable billing month
    const billingMonth = formatBillingMonth(boundaries.startDate)
    
    return {
        bookingId: request.bookingId,
        userId: request.userId,
        calendarMonth,
        billingPeriodStart: formatDateYYYYMMDD(boundaries.startDate),
        billingPeriodEnd: formatDateYYYYMMDD(boundaries.endDate),
        billingMonth,
        baseAmount: amounts.baseAmount,
        taxRate,
        taxAmount: amounts.taxAmount,
        totalAmount: amounts.totalAmount,
        dueDate: formatDateYYYYMMDD(dueDate),
        isFirstMonth: isFirst,
        proration
    }
}

/**
 * Calculate invoices for multiple months
 */
export function calculateMonthlyInvoicesRange(
    request: MonthlyInvoiceRequest,
    monthCount: number = 1
): InvoiceCalculation[] {
    const startDate = new Date(request.startDate + 'T00:00:00.000Z')
    const firstMonthBoundaries = getCalendarMonthBoundaries(startDate)
    const invoices: InvoiceCalculation[] = []
    
    let currentMonth = firstMonthBoundaries.monthKey
    
    for (let i = 0; i < monthCount; i++) {
        const invoice = calculateMonthlyInvoice(request, currentMonth)
        invoices.push(invoice)
        currentMonth = getNextMonth(currentMonth)
    }
    
    return invoices
}

// ============================================================================
// Invoice Number Generation
// ============================================================================

/**
 * Generate unique invoice number: YG-YYYYMM-XXXX
 */
export async function generateInvoiceNumber(calendarMonth: string): Promise<string> {
    const [year, month] = calendarMonth.split('-')
    const prefix = `${INVOICE_PREFIX}-${year}${month}`
    
    // Find the highest invoice number for this month
    const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `${prefix}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1)
    
    if (error) {
        console.error('Error fetching invoice numbers:', error)
        // Fallback: use timestamp-based number
        return `${prefix}-${String(Date.now()).slice(-4)}`
    }
    
    let sequence = 1
    if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number
        const lastSequence = parseInt(lastNumber.split('-')[2], 10)
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1
        }
    }
    
    return `${prefix}-${String(sequence).padStart(4, '0')}`
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get booking details including internal UUID
 */
async function getBookingDetails(bookingCode: string): Promise<any> {
    const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_id, user_id, billing_cycle_anchor, is_recurring, class_package_id')
        .eq('booking_id', bookingCode)
        .single()
    
    if (error) {
        throw new Error(`Booking not found: ${bookingCode}`)
    }
    
    return data
}

/**
 * Check if invoice already exists for booking + month
 */
async function invoiceExists(bookingId: string, calendarMonth: string): Promise<boolean> {
    // Get booking UUID
    const booking = await getBookingDetails(bookingId)
    
    const [year, month] = calendarMonth.split('-')
    const monthStart = `${year}-${month}-01`
    const monthEnd = new Date(parseInt(year), parseInt(month), 0) // Last day of month
    const monthEndStr = `${year}-${month}-${String(monthEnd.getDate()).padStart(2, '0')}`
    
    const { data, error } = await supabase
        .from('invoices')
        .select('id')
        .eq('booking_id', booking.id)
        .gte('billing_period_start', monthStart)
        .lte('billing_period_start', monthEndStr)
        .limit(1)
    
    if (error) {
        console.error('Error checking invoice existence:', error)
        return false
    }
    
    return (data?.length || 0) > 0
}

/**
 * Create invoice in database
 */
export async function createMonthlyInvoice(
    calculation: InvoiceCalculation
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
        // Get booking details (need internal UUID)
        const booking = await getBookingDetails(calculation.bookingId)
        
        // Check if invoice already exists
        const exists = await invoiceExists(calculation.bookingId, calculation.calendarMonth)
        if (exists) {
            console.warn(`Invoice already exists for booking ${calculation.bookingId} month ${calculation.calendarMonth}`)
            return { success: false, error: 'Invoice already exists for this period' }
        }
        
        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(calculation.calendarMonth)
        
        // Prepare invoice data
        const invoiceData = {
            invoice_number: invoiceNumber,
            booking_id: booking.id, // Internal UUID
            user_id: calculation.userId,
            amount: calculation.baseAmount,
            currency: DEFAULT_CURRENCY,
            tax_rate: calculation.taxRate,
            tax_amount: calculation.taxAmount,
            total_amount: calculation.totalAmount,
            billing_period_start: calculation.billingPeriodStart,
            billing_period_end: calculation.billingPeriodEnd,
            billing_month: calculation.billingMonth,
            due_date: calculation.dueDate,
            status: 'pending' as const,
            proration_note: calculation.proration?.prorationNote || null
        }
        
        // Insert invoice
        const { data, error } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select('id')
            .single()
        
        if (error) {
            console.error('Error creating invoice:', error)
            return { success: false, error: error.message }
        }
        
        console.log('✅ Invoice created:', invoiceNumber, '- Amount:', calculation.totalAmount, DEFAULT_CURRENCY)
        
        return { success: true, invoiceId: data.id }
    } catch (error) {
        console.error('Exception creating invoice:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Create first month invoice automatically (called during booking creation)
 */
export async function createFirstMonthInvoice(
    bookingCode: string,
    userId: string,
    startDate: string,
    fullMonthlyPrice: number,
    packageId?: string
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    const request: MonthlyInvoiceRequest = {
        bookingId: bookingCode,
        userId,
        startDate,
        fullMonthlyPrice,
        packageId
    }
    
    const startDateObj = new Date(startDate + 'T00:00:00.000Z')
    const boundaries = getCalendarMonthBoundaries(startDateObj)
    
    const calculation = calculateMonthlyInvoice(request, boundaries.monthKey)
    
    return await createMonthlyInvoice(calculation)
}

/**
 * Batch create multiple month invoices (for advance billing or catch-up)
 */
export async function batchCreateMonthlyInvoices(
    request: MonthlyInvoiceRequest,
    monthCount: number = 1
): Promise<{ success: boolean; created: number; failed: number; errors: string[] }> {
    const calculations = calculateMonthlyInvoicesRange(request, monthCount)
    
    let created = 0
    let failed = 0
    const errors: string[] = []
    
    for (const calc of calculations) {
        const result = await createMonthlyInvoice(calc)
        if (result.success) {
            created++
        } else {
            failed++
            errors.push(`${calc.calendarMonth}: ${result.error}`)
        }
    }
    
    return {
        success: created > 0,
        created,
        failed,
        errors
    }
}

// ============================================================================
// Booking Integration
// ============================================================================

/**
 * Update booking billing_cycle_anchor (set once during first assignment)
 */
export async function setBillingCycleAnchor(
    bookingCode: string,
    anchorDate: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('bookings')
            .update({ billing_cycle_anchor: anchorDate })
            .eq('booking_id', bookingCode)
        
        if (error) {
            console.error('Error setting billing_cycle_anchor:', error)
            return false
        }
        
        console.log('✅ Billing cycle anchor set:', bookingCode, '→', anchorDate)
        return true
    } catch (error) {
        console.error('Exception setting billing_cycle_anchor:', error)
        return false
    }
}

/**
 * Get package monthly price from database
 */
export async function getPackageMonthlyPrice(packageId: string): Promise<number> {
    const { data, error } = await supabase
        .from('class_packages')
        .select('total_price')
        .eq('id', packageId)
        .single()
    
    if (error || !data) {
        console.warn(`Package query failed for ${packageId}:`, error)
        return 0
    }
    
    return data.total_price || 0
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

function formatBillingMonth(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
}

// ============================================================================
// Scheduling (Future: Cron Job Integration)
// ============================================================================

/**
 * Generate next month's invoice for a booking (T-5 days before month start)
 * This should be called by a scheduled job
 */
export async function generateNextMonthInvoice(
    bookingCode: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get booking details
        const booking = await getBookingDetails(bookingCode)
        
        if (!booking.is_recurring) {
            return { success: false, error: 'Booking is not recurring' }
        }
        
        if (!booking.billing_cycle_anchor) {
            return { success: false, error: 'Billing cycle anchor not set' }
        }
        
        if (!booking.class_package_id) {
            return { success: false, error: 'No package linked to booking' }
        }
        
        // Get package price
        const monthlyPrice = await getPackageMonthlyPrice(booking.class_package_id)
        
        // Calculate next month
        const today = new Date()
        const nextMonthBoundaries = getCalendarMonthBoundaries(
            new Date(today.getFullYear(), today.getMonth() + 1, 1)
        )
        
        const request: MonthlyInvoiceRequest = {
            bookingId: booking.booking_id,
            userId: booking.user_id,
            startDate: booking.billing_cycle_anchor,
            fullMonthlyPrice: monthlyPrice,
            packageId: booking.class_package_id
        }
        
        const calculation = calculateMonthlyInvoice(request, nextMonthBoundaries.monthKey)
        
        return await createMonthlyInvoice(calculation)
    } catch (error) {
        console.error('Error generating next month invoice:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Get all bookings due for invoice generation (T-5 days check)
 */
export async function getBookingsDueForInvoice(daysAhead: number = 5): Promise<string[]> {
    // Calculate target month (next month if within T-5 days)
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const daysUntilNextMonth = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilNextMonth > daysAhead) {
        return [] // Not yet T-5 days
    }
    
    // Get all recurring bookings
    const { data, error } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('is_recurring', true)
        .not('billing_cycle_anchor', 'is', null)
        .not('class_package_id', 'is', null)
    
    if (error) {
        console.error('Error fetching recurring bookings:', error)
        return []
    }
    
    return data.map(b => b.booking_id)
}
