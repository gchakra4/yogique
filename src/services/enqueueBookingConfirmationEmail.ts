import { supabase } from '../shared/lib/supabase'

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
    // Use Supabase Functions invoke to call the Edge Function server-side wrapper.
    const res = await supabase.functions.invoke('enqueue-booking-confirmation-email', { body: row })
    // `res` follows Supabase client format: it may contain `error` or `data`.
    // If there's an error, throw to fallback to direct DB insert.
    // @ts-ignore
    if ((res as any).error) throw (res as any).error
    return (res as any).data || res
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
