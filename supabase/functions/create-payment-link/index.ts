// ============================================================================
// EDGE FUNCTION: create-payment-link
// ============================================================================
// Purpose: Create Razorpay payment link for an invoice
// Triggered by: Manual call or automatic after invoice creation
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvoiceData {
  invoice_id: string
  invoice_number: string
  booking_ref: string
  customer_name: string
  customer_email: string
  customer_phone: string
  amount: number
  tax_amount: number
  total_amount: number
  currency: string
  billing_period_start: string
  billing_period_end: string
  billing_month: string
  due_date: string
  proration_note?: string
  package_name: string
  status: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { invoice_id } = await req.json()

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

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Get invoice details
    console.log(`Fetching invoice details for: ${invoice_id}`)
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

    const invoice = invoiceData as InvoiceData

    // Check if invoice is pending
    if (invoice.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Invoice status is ${invoice.status}, not pending` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Check if payment link already exists
    const { data: existingLinkData } = await supabase.rpc(
      'get_payment_link_status',
      { p_invoice_id: invoice_id }
    )

    if (existingLinkData?.has_payment_link && existingLinkData?.is_active) {
      console.log('Payment link already exists and is active')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment link already exists',
          payment_link_id: existingLinkData.payment_link_id,
          short_url: existingLinkData.short_url,
          razorpay_link_id: existingLinkData.razorpay_link_id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Convert amount to smallest currency unit (paise for INR)
    const amountInPaise = Math.round(invoice.total_amount * 100)

    // Prepare Razorpay Payment Link request
    const paymentLinkData = {
      amount: amountInPaise,
      currency: invoice.currency,
      description: `Invoice ${invoice.invoice_number} - ${invoice.billing_month}`,
      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        contact: invoice.customer_phone || ''
      },
      notify: {
        sms: false, // We'll send our own email
        email: false
      },
      reminder_enable: false, // We'll handle reminders
      callback_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      callback_method: 'get',
      reference_id: invoice_id,
      notes: {
        invoice_id: invoice_id,
        invoice_number: invoice.invoice_number,
        booking_ref: invoice.booking_ref,
        billing_month: invoice.billing_month
      }
    }

    console.log('Creating Razorpay payment link:', paymentLinkData)

    // Call Razorpay API
    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${razorpayAuth}`
      },
      body: JSON.stringify(paymentLinkData)
    })

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      console.error('Razorpay API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment link',
          details: errorText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: razorpayResponse.status
        }
      )
    }

    const razorpayData = await razorpayResponse.json()
    console.log('Razorpay payment link created:', razorpayData.id)

    // Store payment link in database
    const { data: storedLink, error: storeError } = await supabase.rpc(
      'store_payment_link',
      {
        p_invoice_id: invoice_id,
        p_razorpay_link_id: razorpayData.id,
        p_short_url: razorpayData.short_url,
        p_expires_at: new Date(razorpayData.expire_by * 1000).toISOString(),
        p_razorpay_response: razorpayData
      }
    )

    if (storeError) {
      console.error('Error storing payment link:', storeError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store payment link',
          details: storeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log('Payment link stored successfully')

    return new Response(
      JSON.stringify({
        success: true,
        payment_link_id: storedLink.payment_link_id,
        invoice_id: invoice_id,
        invoice_number: invoice.invoice_number,
        razorpay_link_id: razorpayData.id,
        short_url: razorpayData.short_url,
        expires_at: new Date(razorpayData.expire_by * 1000).toISOString(),
        amount: invoice.total_amount,
        currency: invoice.currency
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
