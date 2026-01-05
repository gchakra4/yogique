import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    const body = await req.json()
    // expected body: { channel, recipient, subject?, text?, html?, attachments?, metadata?, run_after? }
    if (!body || !body.channel || !body.recipient) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 })
    }

    const now = new Date().toISOString()
    const payload = {
      channel: body.channel,
      recipient: body.recipient,
      subject: body.subject || null,
      text: body.text || null,
      html: body.html || null,
      attachments: body.attachments || null,
      metadata: body.metadata || null,
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
