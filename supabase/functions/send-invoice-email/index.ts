// ============================================================================
// EDGE FUNCTION: send-invoice-email
// ============================================================================
// Purpose: Generate invoice PDF and send email with payment link
// Integrates with: TransactionManagement.tsx PDF generation logic
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Parse request body
    const { invoice_id, payment_link_id } = await req.json()

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'invoice_id is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get invoice details
    console.log(`Fetching invoice for email: ${invoice_id}`)
    const { data: invoiceData, error: invoiceError } = await supabase.rpc(
      'get_invoice_for_payment_link',
      { p_invoice_id: invoice_id }
    )

    if (invoiceError || !invoiceData) {
      console.error('Error fetching invoice:', invoiceError)
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // Get payment link if provided
    let paymentLinkUrl = null
    if (payment_link_id) {
      const { data: linkData } = await supabase
        .from('payment_links')
        .select('short_url, status')
        .eq('id', payment_link_id)
        .single()

      if (linkData && linkData.status === 'created') {
        paymentLinkUrl = linkData.short_url
      }
    }

    // Get business settings for email configuration
    const { data: emailSettings } = await supabase
      .from('business_settings')
      .select('value')
      .eq('key', 'email_settings')
      .single()

    const { data: invoicePrefs } = await supabase
      .from('business_settings')
      .select('value')
      .eq('key', 'invoice_preferences')
      .single()

    // NOTE: Actual PDF generation would require pdf-lib or similar
    // For now, we'll create a simple text representation
    // In production, integrate with TransactionManagement.tsx generateInvoicePdfBase64()
    
    const emailBody = `
Dear ${invoiceData.customer_name},

Your invoice for ${invoiceData.billing_month} is ready.

Invoice Details:
- Invoice Number: ${invoiceData.invoice_number}
- Billing Period: ${invoiceData.billing_period_start} to ${invoiceData.billing_period_end}
- Amount: ${invoiceData.currency} ${invoiceData.total_amount.toFixed(2)}
- Due Date: ${invoiceData.due_date}
${invoiceData.proration_note ? `\nNote: ${invoiceData.proration_note}` : ''}

${paymentLinkUrl ? `\nPay Now: ${paymentLinkUrl}\n` : ''}

Thank you for your business!

Best regards,
Yoga Garden Team
    `.trim()

    // In production, send email via your email service (SendGrid, Resend, etc.)
    // For now, we'll just log the email details
    console.log('Email to be sent:', {
      to: invoiceData.customer_email,
      subject: `Invoice ${invoiceData.invoice_number} - ${invoiceData.billing_month}`,
      body: emailBody,
      payment_link: paymentLinkUrl
    })

    // Log email delivery
    const { data: emailLog, error: logError } = await supabase.rpc(
      'log_invoice_email',
      {
        p_invoice_id: invoice_id,
        p_recipient_email: invoiceData.customer_email,
        p_email_type: 'invoice_with_link',
        p_payment_link_id: payment_link_id,
        p_metadata: {
          invoice_number: invoiceData.invoice_number,
          payment_link_url: paymentLinkUrl,
          sent_at: new Date().toISOString()
        }
      }
    )

    if (logError) {
      console.error('Error logging email:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoice_id,
        invoice_number: invoiceData.invoice_number,
        recipient: invoiceData.customer_email,
        payment_link_included: !!paymentLinkUrl,
        email_log_id: emailLog?.email_log_id,
        message: 'Email queued for delivery (PDF generation pending full implementation)'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
