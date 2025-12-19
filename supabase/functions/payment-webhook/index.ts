// ============================================================================
// EDGE FUNCTION: payment-webhook
// ============================================================================
// Purpose: Receive and process Razorpay webhook events
// Security: HMAC-SHA256 signature verification
// Idempotency: Uses event_id for duplicate detection
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get webhook secret
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Get signature from header
    const signature = req.headers.get('x-razorpay-signature')
    if (!signature) {
      console.error('Missing x-razorpay-signature header')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Verify signature
    const computedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    const signatureVerified = computedSignature === signature

    if (!signatureVerified) {
      console.error('Signature verification failed')
      console.error('Expected:', computedSignature)
      console.error('Received:', signature)
      
      // Log failed verification attempt but don't process
      return new Response(
        JSON.stringify({ 
          error: 'Invalid signature',
          verified: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody)
    console.log('Webhook received:', payload.event)

    // Extract event details
    const eventId = payload.event || `${payload.payload?.payment_link?.entity?.id}_${Date.now()}`
    const eventType = payload.event
    
    // Extract payment details based on event type
    let paymentLinkId: string | null = null
    let paymentId: string | null = null
    let amount: number = 0
    let currency: string = 'INR'

    if (payload.payload?.payment_link) {
      paymentLinkId = payload.payload.payment_link.entity?.id
      amount = payload.payload.payment_link.entity?.amount_paid / 100 || 0 // Convert paise to rupees
      currency = payload.payload.payment_link.entity?.currency || 'INR'
    }

    if (payload.payload?.payment) {
      paymentId = payload.payload.payment.entity?.id
      if (!amount) {
        amount = payload.payload.payment.entity?.amount / 100 || 0
      }
      if (!currency || currency === 'INR') {
        currency = payload.payload.payment.entity?.currency || 'INR'
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Process payment event
    console.log('Processing event:', {
      eventId,
      eventType,
      paymentLinkId,
      paymentId,
      amount,
      signatureVerified
    })

    const { data: result, error } = await supabase.rpc('process_payment_event', {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payment_link_id: paymentLinkId,
      p_razorpay_payment_id: paymentId,
      p_amount: amount,
      p_currency: currency,
      p_signature_verified: signatureVerified,
      p_payload: payload
    })

    if (error) {
      console.error('Error processing payment event:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process event',
          details: error.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log('Event processed:', result)

    // Always return 200 to Razorpay to acknowledge receipt
    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventId,
        event_type: eventType,
        result: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    
    // Still return 200 to avoid webhook retries for parsing errors
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        logged: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})
