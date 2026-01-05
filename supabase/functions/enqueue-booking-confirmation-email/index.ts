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

serve(async (req) => {
  try {
    // Parse JSON body safely: handle empty body and malformed JSON gracefully
    let body: any = null
    try {
      const txt = await req.text()
      if (!txt) {
        console.error('Empty request body')
        return new Response(JSON.stringify({ error: 'invalid_payload', detail: 'empty_body' }), { status: 400 })
      }
      try {
        body = JSON.parse(txt)
      } catch (jsonErr) {
        console.error('Failed to parse JSON body:', jsonErr, 'rawBody:', txt)
        return new Response(JSON.stringify({ error: 'invalid_json', detail: String(jsonErr) }), { status: 400 })
      }
    } catch (readErr) {
      console.error('Failed to read request body:', readErr)
      return new Response(JSON.stringify({ error: 'read_body_failed', detail: String(readErr) }), { status: 400 })
    }

    // expected body: { channel, recipient, subject?, text?, html?, attachments?, metadata?, run_after? }
    if (!body || !body.channel || !body.recipient) {
      console.error('Invalid payload shape', body)
      return new Response(JSON.stringify({ error: 'invalid_payload', detail: 'missing channel or recipient' }), { status: 400 })
    }

    const now = new Date().toISOString()
    // merge provided metadata and attach server-side sender if configured
    const mergedMetadata = Object.assign({}, body.metadata || {})
    if (isValidEmail(SEND_GUIDE_FROM_EMAIL)) {
      mergedMetadata.from_email = SEND_GUIDE_FROM_EMAIL
    }

    const payload = {
      channel: body.channel,
      recipient: body.recipient,
      subject: body.subject || null,
      text: body.text || null,
      html: body.html || null,
      attachments: body.attachments || null,
      metadata: Object.keys(mergedMetadata).length ? mergedMetadata : null,
      status: body.status || 'pending',
      attempts: typeof body.attempts === 'number' ? body.attempts : 0,
      run_after: body.run_after || now,
      created_at: body.created_at || now,
      updated_at: body.updated_at || now
    }

    const { data, error } = await supabase.from('notifications_queue').insert(payload)
    if (error) {
      console.error('enqueue error', error)
      return new Response(JSON.stringify({ error: 'enqueue_failed', detail: String(error) }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, data }), { status: 200 })
  } catch (err) {
    console.error('handler error', err)
    return new Response(JSON.stringify({ error: 'server_error', detail: String(err) }), { status: 500 })
  }
})
