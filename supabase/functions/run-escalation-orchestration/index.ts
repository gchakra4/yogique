import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    
    // Verify CRON_SECRET
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')
    
    if (!authHeader || !authHeader.includes(cronSecret || '')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid CRON_SECRET' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Running escalation cycle...')

    // Call the escalation database function
    const { data: escalationData, error: escalationError } = await supabase
      .rpc('escalate_overdue_bookings')

    if (escalationError) {
      throw new Error(`Escalation failed: ${escalationError.message}`)
    }

    console.log('✅ Escalation complete:', escalationData)

    // Send proactive reminders (T-3, T-1)
    console.log('📧 Checking proactive reminders...')
    
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // T-3 reminders (3 days before due date)
    const t3Date = new Date(today)
    t3Date.setUTCDate(t3Date.getUTCDate() + 3)
    const t3DateStr = t3Date.toISOString().split('T')[0]

    // T-1 reminders (1 day before due date)
    const t1Date = new Date(today)
    t1Date.setUTCDate(t1Date.getUTCDate() + 1)
    const t1DateStr = t1Date.toISOString().split('T')[0]

    let remindersSent = 0

    // Process T-3 reminders
    const { data: t3Invoices } = await supabase
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
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .eq('due_date', t3DateStr)

    if (t3Invoices && t3Invoices.length > 0) {
      console.log(`Found ${t3Invoices.length} invoices for T-3 reminders`)
      
      for (const invoice of t3Invoices) {
        const booking = invoice.bookings as any
        
        // Queue email notification
        await supabase.from('notifications_queue').insert({
          channel: 'email',
          recipient: booking.email,
          subject: `⚠️ Payment Reminder - Invoice ${invoice.invoice_number}`,
          html: generateReminderEmail(booking, invoice, 3),
          metadata: { 
            booking_id: invoice.booking_id, 
            invoice_id: invoice.id,
            reminder_type: 't_minus_3'
          },
          status: 'pending',
          attempts: 0,
          run_after: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        remindersSent++
      }
    }

    // Process T-1 reminders
    const { data: t1Invoices } = await supabase
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
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .eq('due_date', t1DateStr)

    if (t1Invoices && t1Invoices.length > 0) {
      console.log(`Found ${t1Invoices.length} invoices for T-1 reminders`)
      
      for (const invoice of t1Invoices) {
        const booking = invoice.bookings as any
        
        // Queue email notification
        await supabase.from('notifications_queue').insert({
          channel: 'email',
          recipient: booking.email,
          subject: `🔔 Final Reminder - Payment Due Tomorrow`,
          html: generateReminderEmail(booking, invoice, 1),
          metadata: { 
            booking_id: invoice.booking_id, 
            invoice_id: invoice.id,
            reminder_type: 't_minus_1'
          },
          status: 'pending',
          attempts: 0,
          run_after: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        remindersSent++
      }
    }

    const executionTime = Date.now() - startTime

    const response = {
      success: true,
      execution_time: `${executionTime}ms`,
      escalation: escalationData,
      reminders_sent: remindersSent,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Orchestration complete:', response)

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in orchestration:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateReminderEmail(booking: any, invoice: any, daysUntilDue: number): string {
  const urgency = daysUntilDue === 1 ? 'critical' : 'warning'
  const emoji = daysUntilDue === 1 ? '🔔' : '⚠️'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { background: ${urgency === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .alert { background: ${urgency === 'critical' ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${urgency === 'critical' ? '#dc2626' : '#f59e0b'}; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .detail { margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${emoji} Payment Reminder</h2>
    </div>
    <div class="content">
      <div class="alert">
        <h3>${daysUntilDue === 1 ? 'Payment Due Tomorrow' : 'Payment Due in ' + daysUntilDue + ' Days'}</h3>
        <p>Dear ${booking.first_name} ${booking.last_name},</p>
        <p>This is a friendly reminder that your payment is due ${daysUntilDue === 1 ? 'tomorrow' : 'soon'}.</p>
      </div>
      
      <div class="detail">
        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p><strong>Amount Due:</strong> ₹${invoice.total_amount}</p>
        <p><strong>Due Date:</strong> ${invoice.due_date}</p>
      </div>
      
      <p>Please complete your payment to avoid any service interruption.</p>
      
      ${daysUntilDue === 1 ? `
        <p style="color: #dc2626; font-weight: bold;">
          ⚠️ If payment is not received by the due date, your access may be restricted.
        </p>
      ` : ''}
      
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
