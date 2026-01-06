import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { serve } from 'https://deno.land/std@0.201.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Optional from-address for booking confirmation emails (set in Supabase function env)
const SEND_GUIDE_FROM_EMAIL = Deno.env.get('SEND_GUIDE_FROM_EMAIL') || null

function isValidEmail(email: string | null) {
  if (!email) return false
  // basic RFC-like email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Central booking confirmation email template (shared across clients)
const BOOKING_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking Confirmation</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #0f1012; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #181818; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
      .header { background: linear-gradient(135deg, #222222, #000000); color: white; text-align: center; padding: 30px 20px; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 25px 30px; color: #f5f5f5; }
      .content p { line-height: 1.6; font-size: 16px; }
      .booking-box { background: #242018; border-left: 5px solid #d9a441; padding: 15px 20px; margin: 20px 0; border-radius: 8px; }
      .booking-box strong { font-size: 18px; color: #ffd470; }
      .button { display: inline-block; margin-top: 25px; padding: 14px 24px; background: #d9a441; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
      .footer { text-align: center; padding: 20px; font-size: 14px; color: #aaaaaa; }
      @media only screen and (max-width: 480px) { .container { margin: 20px 12px; border-radius: 10px; } .header { padding: 20px 14px; } .header h1 { font-size: 22px; } .content { padding: 18px 16px; } .content p, .booking-box p, ul { font-size: 14px; } .button { display: block; width: 100%; text-align: center; padding: 14px 0; box-sizing: border-box; } }
    </style>
  </head>
  <body>
    <div class="container">
        <div class="header">
        <img src="{{logo_src}}" alt="Yogique Logo" style="width:80px; margin-bottom:10px;" />
        <h1>Yogique – Booking Confirmed</h1>
      </div>
      <div class="content">
        <p>Hi {{user_name}},</p>
        <p>Thank you for booking with us! We’re excited to have you. Below are your booking details for quick reference.</p>
                <div class="booking-box">
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p><strong>Preferred Start Date:</strong> {{preferred_start_date}}</p>
          <p><strong>Preferred Time:</strong> {{class_time}}</p>
          <p><strong>Class/Package Details:</strong> {{class_package_details}}</p>
          <p><strong>Timezone:</strong> {{timezone}}</p>
          <p><strong>Notes / Requests:</strong> {{booking_notes}}</p>
        </div>
        <ul style="margin: 20px 0; padding-left: 20px; font-size:16px; line-height:1.6;">
          <li>You'll receive a confirmation email within 24 hours</li>
          <li>We'll send you the video call link before your session</li>
          <li>Our team may call to discuss your specific needs</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:{{support_contact}}" style="color:#ffd470;">{{support_contact}}</a>.</p>
        <a href="{{action_url}}" class="button">View Your Booking</a>
        <p style="margin-top:8px; font-size:13px; color:#dddddd;">If you've changed your mind, you can <a href="{{cancel_url}}" style="color:#ffd470;">cancel your booking</a>. Please include a short note when cancelling so our team can follow up.</p>
        <p style="margin-top:6px; font-size:12px; color:#bbbbbb;">Policy: <a href="{{policy_url}}" style="color:#ffd470;">Terms &amp; Cancellation Policy</a></p>
      </div>
      <div class="footer">© {{year}} Sampurnayogam LLP. All rights reserved.<br /><span style="font-size:12px; color:#999; line-height:1.4;">Yogique is a brand operating under the umbrella of Sampurnayogam LLP (a registered company). All services, including online B2C classes and programs, are offered by Sampurnayogam LLP.</span></div>
    </div>
  </body>
</html>`

function renderTemplate(tpl: string, vars: Record<string, any>) {
  return tpl.replace(/{{\s*([^}]+)\s*}}/g, (_m, key) => {
  const val = vars[key] ?? ''
  return String(val)
  })
}
serve(async (req) => {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
  }

  // Handle CORS preflight quickly without attempting to read a body
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  // Log basic request info to help debug missing POST bodies
  try {
    const cl = req.headers.get('content-length')
    console.info('incoming request', { method: req.method, url: req.url, content_length: cl, content_type: req.headers.get('content-type'), has_auth: Boolean(req.headers.get('authorization') || req.headers.get('apikey')) })

    // Parse JSON body safely: handle empty body and malformed JSON gracefully
    let body: any = null
    try {
      const txt = await req.text()
      if (!txt) {
        console.error('Empty request body')
        return new Response(JSON.stringify({ error: 'invalid_payload', detail: 'empty_body' }), { status: 400, headers: CORS_HEADERS })
      }
      try {
        body = JSON.parse(txt)
      } catch (jsonErr) {
        console.error('Failed to parse JSON body:', jsonErr, 'rawBody:', txt)
        return new Response(JSON.stringify({ error: 'invalid_json', detail: String(jsonErr) }), { status: 400, headers: CORS_HEADERS })
      }
    } catch (readErr) {
      console.error('Failed to read request body:', readErr)
      return new Response(JSON.stringify({ error: 'read_body_failed', detail: String(readErr) }), { status: 400, headers: CORS_HEADERS })
    }

    // expected body: { channel, recipient, subject?, text?, html?, attachments?, metadata?, run_after? }
    if (!body || !body.channel || !body.recipient) {
      console.error('Invalid payload shape', body)
      return new Response(JSON.stringify({ error: 'invalid_payload', detail: 'missing channel or recipient' }), { status: 400, headers: CORS_HEADERS })
    }

    const now = new Date().toISOString()
    // Accept `metadata` as object or a JSON string (some producers store it stringified).
    let parsedMetadata: any = body.metadata
    if (typeof parsedMetadata === 'string') {
      try {
        parsedMetadata = JSON.parse(parsedMetadata)
      } catch (e) {
        console.warn('enqueue: metadata was a string but failed to parse, falling back to empty object', e)
        parsedMetadata = {}
      }
    }
    // merge provided metadata and attach server-side sender if configured
    const mergedMetadata = Object.assign({}, parsedMetadata || {})
    if (isValidEmail(SEND_GUIDE_FROM_EMAIL)) {
      mergedMetadata.from_email = SEND_GUIDE_FROM_EMAIL
    }

    // If client didn't provide HTML, render the central booking template server-side
    try {
      const renderVars: Record<string, any> = Object.assign({}, mergedMetadata)
      renderVars.logo_src = renderVars.logo_src || `${SUPABASE_URL.replace(/\/$/, '')}/images/Brand.png`
      renderVars.base_url = renderVars.base_url || SUPABASE_URL.replace(/\/$/, '')
      renderVars.year = renderVars.year || new Date().getFullYear()
      renderVars.support_contact = renderVars.support_contact || 'support@yogique.life'
      renderVars.action_url = renderVars.action_url || ''
      renderVars.cancel_url = renderVars.cancel_url || ''
      renderVars.user_name = renderVars.user_name || renderVars.user || ''
      renderVars.booking_id = renderVars.booking_id || body.bookingId || body.booking_id || ''
      renderVars.preferred_start_date = renderVars.preferred_start_date || body.preferred_start_date || ''
      renderVars.class_package_details = renderVars.class_package_details || ''
      renderVars.class_time = renderVars.class_time || ''
      renderVars.booking_notes = renderVars.booking_notes || ''

      if (!body.html) {
        try {
          body.html = renderTemplate(BOOKING_EMAIL_TEMPLATE, renderVars)
        } catch (e) {
          console.warn('Failed to render booking template:', e)
        }
      }
    } catch (e) {
      // non-fatal
      console.warn('template render preflight failed', e)
    }

    let payload: Record<string, any> = {
      channel: body.channel,
      recipient: body.recipient,
      subject: body.subject || null,
      text: body.text || null,
      html: body.html || null,
      attachments: body.attachments || null,
      // ensure `from` column is set so downstream senders use the desired address
      from: isValidEmail(SEND_GUIDE_FROM_EMAIL) ? SEND_GUIDE_FROM_EMAIL : null,
      metadata: Object.keys(mergedMetadata).length ? mergedMetadata : null,
      status: body.status || 'pending',
      attempts: typeof body.attempts === 'number' ? body.attempts : 0,
      run_after: body.run_after || now,
      created_at: body.created_at || now,
      updated_at: body.updated_at || now
    }

    // Remove keys whose value is explicitly null to avoid sending columns that may not exist
    payload = Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== null))

    // Attempt insert, retry once if error indicates a missing column (schema cache mismatch)
    let insertResult: any = null
    let lastError: any = null
    // Allow a few retries in case multiple missing columns are reported sequentially
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase.from('notifications_queue').insert(payload).select()
      if (!error) {
        insertResult = data
        break
      }

      lastError = error
      // Detect PostgREST schema-cache missing column error and remove the offending key then retry
      const msg = (error && (error.message || error.detail || '')) as string
      const missingColMatch = msg.match(/Could find the '(.+?)' column|Could not find the '(.+?)' column/) || []
      const col = missingColMatch[1] || missingColMatch[2]
      if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
        console.warn('Detected missing column in notifications_queue, removing and retrying:', col)
        delete payload[col]
        continue
      }

      // Not a recoverable missing-column error — stop retrying
      break
    }

    if (lastError && !insertResult) {
      let errDetail = null
      try {
        errDetail = JSON.stringify(lastError, Object.getOwnPropertyNames(lastError))
      } catch (serialErr) {
        errDetail = String(lastError)
      }
      console.error('enqueue error', errDetail)
      return new Response(JSON.stringify({ error: 'enqueue_failed', detail: errDetail }), { status: 500, headers: CORS_HEADERS })
    }

    try {
      console.info('enqueue success', JSON.stringify({ rows: (insertResult || []).length }))
    } catch (_) {}

    return new Response(JSON.stringify({ ok: true, data: insertResult }), { status: 200, headers: CORS_HEADERS })
  } catch (err) {
    console.error('handler error', err)
    return new Response(JSON.stringify({ error: 'server_error', detail: String(err) }), { status: 500, headers: CORS_HEADERS })
  }
})
