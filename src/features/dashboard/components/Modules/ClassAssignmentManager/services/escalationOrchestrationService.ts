/**
 * ============================================================================
 * PHASE 8: ESCALATION & NOTIFICATION ORCHESTRATION SERVICE
 * ============================================================================
 * Purpose: Coordinate access status updates, email notifications, and escalation
 * 
 * Orchestrates:
 * 1. Access status transitions (active → overdue_grace → overdue_locked)
 * 2. Email notifications at key milestones
 * 3. Payment reminders
 * 4. Restoration to active when paid
 * ============================================================================
 */

import { supabase } from '../../../../../../shared/lib/supabase'

// ============================================================================
// Types
// ============================================================================

export interface EscalationEvent {
    booking_id: string
    booking_code: string
    customer_name: string
    customer_email: string
    old_status: 'active' | 'overdue_grace' | 'overdue_locked'
    new_status: 'active' | 'overdue_grace' | 'overdue_locked'
    days_overdue: number
    invoice_id?: string
    invoice_number?: string
    total_amount?: number
    due_date?: string
}

export interface NotificationSchedule {
    timing: string // e.g., "T-3", "T+0", "T+7"
    days_relative: number // Relative to due_date
    notification_type: 'reminder' | 'warning' | 'final' | 'locked'
    channels: ('email' | 'whatsapp')[]
    template_key?: string
}

export interface EscalationResult {
    success: boolean
    events: EscalationEvent[]
    notifications_scheduled: number
    errors: string[]
}

// ============================================================================
// Notification Schedule Configuration
// ============================================================================

/**
 * Define when notifications should be sent relative to invoice due date
 */
const NOTIFICATION_SCHEDULE: NotificationSchedule[] = [
    {
        timing: 'T-3',
        days_relative: -3,
        notification_type: 'reminder',
        channels: ['email', 'whatsapp'],
        template_key: 'payment_reminder_t_minus_3'
    },
    {
        timing: 'T-1',
        days_relative: -1,
        notification_type: 'warning',
        channels: ['email', 'whatsapp'],
        template_key: 'payment_reminder_t_minus_1'
    },
    {
        timing: 'T+0 (Due Date)',
        days_relative: 0,
        notification_type: 'final',
        channels: ['email'],
        template_key: 'payment_overdue'
    },
    {
        timing: 'T+8 (Grace Period)',
        days_relative: 8,
        notification_type: 'warning',
        channels: ['email', 'whatsapp'],
        template_key: 'grace_period_warning'
    },
    {
        timing: 'T+11 (Locked)',
        days_relative: 11,
        notification_type: 'locked',
        channels: ['email', 'whatsapp'],
        template_key: 'access_locked'
    }
]

// ============================================================================
// Escalation Logic
// ============================================================================

/**
 * Check all bookings and trigger escalation/de-escalation
 */
export async function runEscalationCycle(): Promise<EscalationResult> {
    console.log('Starting escalation cycle...')
    
    try {
        // Call the database escalation function
        const { data, error } = await supabase.rpc('escalate_overdue_bookings')

        if (error) {
            console.error('Escalation RPC failed:', error)
            return {
                success: false,
                events: [],
                notifications_scheduled: 0,
                errors: [error.message]
            }
        }

        console.log('Escalation cycle complete:', data)

        // Fetch details of escalated bookings for notifications
        const events = await fetchEscalationEvents(data)

        // Schedule notifications for escalated bookings
        const notificationCount = await scheduleNotifications(events)

        return {
            success: true,
            events,
            notifications_scheduled: notificationCount,
            errors: []
        }

    } catch (error) {
        console.error('Unexpected error in escalation cycle:', error)
        return {
            success: false,
            events: [],
            notifications_scheduled: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        }
    }
}

/**
 * Fetch details of bookings that were escalated
 */
async function fetchEscalationEvents(escalationData: any): Promise<EscalationEvent[]> {
    // This would need to track which bookings changed status
    // For now, return empty array - implementation depends on escalation function returning details
    console.log('Escalation summary:', escalationData)
    return []
}

// ============================================================================
// Notification Scheduling
// ============================================================================

/**
 * Schedule notifications for escalation events
 */
async function scheduleNotifications(events: EscalationEvent[]): Promise<number> {
    let count = 0
    
    for (const event of events) {
        // Determine which notification to send based on new status
        let notificationConfig: NotificationSchedule | undefined

        if (event.new_status === 'overdue_grace' && event.old_status === 'active') {
            // Entered grace period
            notificationConfig = NOTIFICATION_SCHEDULE.find(n => n.timing === 'T+8 (Grace Period)')
        } else if (event.new_status === 'overdue_locked') {
            // Access locked
            notificationConfig = NOTIFICATION_SCHEDULE.find(n => n.timing === 'T+11 (Locked)')
        } else if (event.new_status === 'active' && event.old_status !== 'active') {
            // Restored to active - send thank you notification
            notificationConfig = {
                timing: 'Restored',
                days_relative: 0,
                notification_type: 'reminder',
                channels: ['email'],
                template_key: 'payment_received_thank_you'
            }
        }

        if (notificationConfig) {
            await queueNotification(event, notificationConfig)
            count++
        }
    }

    return count
}

/**
 * Queue a notification in notifications_queue table
 */
async function queueNotification(
    event: EscalationEvent,
    config: NotificationSchedule
): Promise<void> {
    try {
        const now = new Date().toISOString()

        // Fetch customer details
        const { data: profile } = await supabase
            .from('profiles')
            .select('phone, email, full_name, whatsapp_opt_in')
            .eq('user_id', event.booking_id)
            .single()

        if (!profile) {
            console.warn(`No profile found for booking ${event.booking_code}`)
            return
        }

        // Queue email notification
        if (config.channels.includes('email') && profile.email) {
            await supabase
                .from('notifications_queue')
                .insert({
                    channel: 'email',
                    recipient: profile.email,
                    subject: getEmailSubject(config.notification_type, event),
                    html: generateEmailHtml(config.notification_type, event, profile),
                    metadata: {
                        booking_id: event.booking_id,
                        notification_type: config.notification_type,
                        escalation_event: true
                    },
                    status: 'pending',
                    attempts: 0,
                    run_after: now,
                    created_at: now,
                    updated_at: now
                })
        }

        // Queue WhatsApp notification
        if (config.channels.includes('whatsapp') && profile.whatsapp_opt_in && profile.phone) {
            await supabase
                .from('notifications_queue')
                .insert({
                    channel: 'whatsapp',
                    recipient: 'whatsapp:' + profile.phone,
                    template_key: config.template_key,
                    template_language: 'en',
                    vars: buildWhatsAppVars(event, profile),
                    metadata: {
                        booking_id: event.booking_id,
                        notification_type: config.notification_type,
                        escalation_event: true
                    },
                    status: 'pending',
                    attempts: 0,
                    run_after: now,
                    created_at: now,
                    updated_at: now
                })
        }

        console.log(`✅ Queued ${config.notification_type} notification for ${event.booking_code}`)

    } catch (error) {
        console.error('Failed to queue notification:', error)
    }
}

// ============================================================================
// Email Content Generation
// ============================================================================

function getEmailSubject(type: string, event: EscalationEvent): string {
    switch (type) {
        case 'warning':
            return `⚠️ Payment Reminder - Invoice ${event.invoice_number || 'Due'}`
        case 'final':
            return `🔔 Payment Overdue - Action Required`
        case 'locked':
            return `🔒 Access Suspended - Payment Required`
        default:
            return `Payment Notification - ${event.booking_code}`
    }
}

function generateEmailHtml(
    type: string,
    event: EscalationEvent,
    _profile: any
): string {
    const baseStyle = `
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .critical { background: #fee2e2; border-left: 4px solid #dc2626; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
    `

    let content = ''

    switch (type) {
        case 'warning':
            content = `
                <div class="alert">
                    <h3>⚠️ Payment Reminder</h3>
                    <p>Dear ${event.customer_name},</p>
                    <p>Your payment of <strong>₹${event.total_amount}</strong> is due soon.</p>
                    <p><strong>Due Date:</strong> ${event.due_date}</p>
                    <p><strong>Days Overdue:</strong> ${event.days_overdue}</p>
                    <p>Please complete your payment to avoid service interruption.</p>
                </div>
            `
            break

        case 'locked':
            content = `
                <div class="alert critical">
                    <h3>🔒 Access Suspended</h3>
                    <p>Dear ${event.customer_name},</p>
                    <p>Your account access has been suspended due to overdue payment.</p>
                    <p><strong>Amount Due:</strong> ₹${event.total_amount}</p>
                    <p><strong>Days Overdue:</strong> ${event.days_overdue}</p>
                    <p><strong>Status:</strong> Cannot schedule new classes until payment is received</p>
                    <p>Please settle your outstanding balance to restore access immediately.</p>
                </div>
            `
            break

        case 'reminder':
            content = `
                <div class="alert success">
                    <h3>✅ Payment Received</h3>
                    <p>Dear ${event.customer_name},</p>
                    <p>Thank you for your payment! Your account has been restored to active status.</p>
                    <p>You can now schedule classes as usual.</p>
                </div>
            `
            break

        default:
            content = `
                <p>Dear ${event.customer_name},</p>
                <p>This is a notification regarding your booking ${event.booking_code}.</p>
            `
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${baseStyle}
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Yogique - Payment Notification</h2>
                </div>
                <div class="content">
                    ${content}
                    <p>If you have already made the payment, please disregard this message.</p>
                    <p>For assistance, contact us at support@yogique.life</p>
                </div>
                <div class="footer">
                    <p>Yogique - Yoga for Life</p>
                    <p>This is an automated notification.</p>
                </div>
            </div>
        </body>
        </html>
    `
}

function buildWhatsAppVars(event: EscalationEvent, profile: { full_name?: string }): string[] {
    return [
        profile.full_name || event.customer_name,
        event.invoice_number || '',
        String(event.total_amount || ''),
        event.due_date || '',
        String(event.days_overdue || 0)
    ]
}

// ============================================================================
// Proactive Reminders
// ============================================================================

/**
 * Send proactive reminders for invoices due soon (T-3, T-1)
 */
export async function sendProactiveReminders(): Promise<{
    success: boolean
    reminders_sent: number
    errors: string[]
}> {
    console.log('Checking for proactive reminders...')
    
    try {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        // Check T-3 and T-1 reminders
        const remindersToSend: { days: number; type: NotificationSchedule }[] = [
            { days: 3, type: NOTIFICATION_SCHEDULE[0] }, // T-3
            { days: 1, type: NOTIFICATION_SCHEDULE[1] }  // T-1
        ]

        let totalSent = 0

        for (const reminder of remindersToSend) {
            const targetDate = new Date(today)
            targetDate.setUTCDate(targetDate.getUTCDate() + reminder.days)
            const targetDateStr = targetDate.toISOString().split('T')[0]

            // Find invoices due on target date
            const { data: invoices, error } = await supabase
                .from('invoices')
                .select(`
                    id,
                    invoice_number,
                    booking_id,
                    user_id,
                    total_amount,
                    due_date,
                    bookings!inner (
                        booking_id,
                        first_name,
                        last_name,
                        email
                    )
                `)
                .eq('status', 'pending')
                .eq('due_date', targetDateStr)

            if (error) {
                console.error('Failed to fetch invoices for reminders:', error)
                continue
            }

            if (!invoices || invoices.length === 0) {
                console.log(`No invoices due in ${reminder.days} days`)
                continue
            }

            console.log(`Found ${invoices.length} invoices due in ${reminder.days} days`)

            // Queue notifications for each invoice
            for (const invoice of invoices) {
                const booking = (invoice.bookings as any)
                const event: EscalationEvent = {
                    booking_id: invoice.booking_id,
                    booking_code: booking.booking_id,
                    customer_name: `${booking.first_name} ${booking.last_name}`,
                    customer_email: booking.email,
                    old_status: 'active',
                    new_status: 'active',
                    days_overdue: -reminder.days, // Negative = days until due
                    invoice_id: invoice.id,
                    invoice_number: invoice.invoice_number,
                    total_amount: invoice.total_amount,
                    due_date: invoice.due_date
                }

                await queueNotification(event, reminder.type)
                totalSent++
            }
        }

        console.log(`✅ Sent ${totalSent} proactive reminders`)

        return {
            success: true,
            reminders_sent: totalSent,
            errors: []
        }

    } catch (error) {
        console.error('Error in sendProactiveReminders:', error)
        return {
            success: false,
            reminders_sent: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        }
    }
}

// ============================================================================
// Export
// ============================================================================

export default {
    runEscalationCycle,
    sendProactiveReminders,
    NOTIFICATION_SCHEDULE
}
