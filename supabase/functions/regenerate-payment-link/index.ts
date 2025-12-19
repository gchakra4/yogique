// ============================================================================
// EDGE FUNCTION: regenerate-payment-link
// ============================================================================
// Purpose: Create a new Razorpay payment link for an invoice (by invoice_id or booking_id)
// and redirect the browser to the Razorpay short_url.
// Security: Public (no JWT) so that customers can be redirected here after failed payments.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const invoice_id = url.searchParams.get('invoice_id')
    const booking_id = url.searchParams.get('booking_id')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Resolve invoice: prefer invoice_id, otherwise find latest pending invoice for booking_id
    let invoice: any = null

    if (invoice_id) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice_id)
        .single()
      if (error) throw new Error('Invoice not found')
      invoice = data
    } else if (booking_id) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('booking_id', booking_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error) throw new Error('Invoice not found for booking')
      invoice = data
    } else {
      return new Response(JSON.stringify({ error: 'invoice_id or booking_id required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    if (invoice.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Invoice status is ${invoice.status}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeyId || !razorpayKeySecret) throw new Error('Razorpay not configured')

    const amountInPaise = Math.round(invoice.total_amount * 100)

    const paymentLinkData: any = {
      amount: amountInPaise,
      currency: invoice.currency || 'INR',
      description: `Invoice ${invoice.invoice_number}`,
      customer: {
        name: invoice.customer_name || '',
        email: invoice.customer_email || '',
        contact: invoice.customer_phone || ''
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      callback_method: 'get',
      reference_id: invoice.id,
      notes: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number || ''
      }
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${razorpayAuth}` },
      body: JSON.stringify(paymentLinkData)
    })

    if (!razorpayResponse.ok) {
      const txt = await razorpayResponse.text()
      console.error('Razorpay error:', txt)
      return new Response(JSON.stringify({ error: 'Failed to create link', details: txt }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    const razorpayData = await razorpayResponse.json()
    const computedExpiresAt = razorpayData.expire_by ? new Date(razorpayData.expire_by * 1000).toISOString() : null

    const { data: stored, error: storeError } = await supabase.rpc('store_payment_link', {
      p_invoice_id: invoice.id,
      p_razorpay_link_id: razorpayData.id,
      p_short_url: razorpayData.short_url,
      p_expires_at: computedExpiresAt,
      p_razorpay_response: razorpayData
    })

    if (storeError) {
      console.error('Store error:', storeError)
      // continue — still redirect user to payment page
    }

    // Redirect browser to Razorpay short URL
    return Response.redirect(razorpayData.short_url, 302)

  } catch (err) {
    console.error('Regenerate error:', err)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    // Redirect to an app failure page with reason
    const failUrl = `${supabaseUrl.replace('//', '//app.')}/payment-failed?reason=regenerate_error`
    return Response.redirect(failUrl, 302)
  }
})
