import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../shared/lib/supabase'

type QueueRow = {
  channel: 'email' | 'sms' | 'whatsapp' | string
  recipient: string
  subject?: string | null
  text?: string | null
  html?: string | null
  attachments?: any | null
  metadata?: Record<string, any> | null
  status?: string
  attempts?: number
  run_after?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export async function enqueueNotification(row: QueueRow) {
  // Prefer calling a server-side wrapper to avoid exposing direct DB writes from the client.
  // Fall back to direct supabase insert if the wrapper is not available.
  try {
    // POST directly to the Supabase Functions REST endpoint with explicit JSON body and auth headers.
    const fnUrl = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/enqueue-booking-confirmation-email`
    const resp = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify(row)
    })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      throw new Error(`function_call_failed:${resp.status} ${txt}`)
    }
    const parsed = await resp.json().catch(() => null)
    return parsed || { ok: true }
  } catch (e) {
    // wrapper failed — write directly as a fallback
    const now = new Date().toISOString()
    const payload = {
      channel: row.channel || 'email',
      recipient: row.recipient,
      subject: row.subject || null,
      text: row.text || null,
      html: row.html || null,
      attachments: row.attachments || null,
      metadata: row.metadata || null,
      status: row.status || 'pending',
      attempts: typeof row.attempts === 'number' ? row.attempts : 0,
      run_after: row.run_after || now,
      created_at: row.created_at || now,
      updated_at: row.updated_at || now
    }

    const { data, error } = await supabase.from('notifications_queue').insert(payload)
    if (error) throw error
    return data
  }
}

export async function enqueueBookingConfirmationEmail(opts: {
  recipient: string
  bookingId: string
  subject?: string
  html?: string
  attachments?: any[] | null
  metadata?: Record<string, any>
  runAfter?: string
}) {
  const subject = opts.subject || `Your Yogique Booking (${opts.bookingId})`
  const metadata = { booking_id: opts.bookingId, notification_type: 'class_confirmation', ...(opts.metadata || {}) }

  return enqueueNotification({
    channel: 'email',
    recipient: opts.recipient,
    subject,
    html: opts.html || null,
    attachments: opts.attachments || null,
    metadata,
    run_after: opts.runAfter || new Date().toISOString()
  })
}

export default { enqueueNotification, enqueueBookingConfirmationEmail }
