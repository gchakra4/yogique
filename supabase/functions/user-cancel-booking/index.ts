import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as Record<string, string>;

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing SUPABASE env vars')
      return new Response(JSON.stringify({ ok: false, error: 'server_not_configured' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Expect caller to include a bearer token for the currently-authenticated user
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    // Masked token for safe debugging (first 6 chars + length)
    const masked = token ? `${token.slice(0,6)}...len=${token.length}` : null
    console.debug('Received Authorization header (masked):', masked)
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_auth_token', received_auth: masked }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Validate the token and fetch user info. Auth endpoint requires an API key header.
    const userRes = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY }
    })

    if (!userRes.ok) {
      const txt = await userRes.text().catch(() => '')
      console.error('Failed to validate auth token', userRes.status, txt)
      return new Response(JSON.stringify({ ok: false, error: 'invalid_auth_token', received_auth: masked, auth_validate_status: userRes.status, auth_validate_body: txt }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const userInfo = await userRes.json().catch(() => null)
    const userId = userInfo?.id
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'unable_to_identify_user' }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}))
    const bookingId = body?.booking_id || body?.id || null
    if (!bookingId) return new Response(JSON.stringify({ ok: false, error: 'missing_booking_id' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

    console.debug('user-cancel-booking payload:', { bookingId, receivedBodyKeys: Object.keys(body) })

    // Try fetching booking by booking_id first, then fallback to id
    const base = SUPABASE_URL.replace(/\/+$/, '')
    const byBookingIdUrl = `${base}/rest/v1/bookings?select=id,booking_id,user_id&booking_id=eq.${encodeURIComponent(bookingId)}`
    const byIdUrl = `${base}/rest/v1/bookings?select=id,booking_id,user_id&id=eq.${encodeURIComponent(bookingId)}`

    let bookingRes = await fetch(byBookingIdUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
    if (!bookingRes.ok) {
      const t = await bookingRes.text().catch(() => '')
      console.error('Failed to query booking by booking_id', bookingRes.status, t)
      return new Response(JSON.stringify({ ok: false, error: 'booking_query_failed', details: t }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    let bookings = await bookingRes.json().catch(() => [])
    if (!Array.isArray(bookings) || bookings.length === 0) {
      // Try fallback to id
      console.debug('No booking found by booking_id, trying id lookup', { byIdUrl })
      bookingRes = await fetch(byIdUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
      if (!bookingRes.ok) {
        const t = await bookingRes.text().catch(() => '')
        console.error('Failed to query booking by id', bookingRes.status, t)
        return new Response(JSON.stringify({ ok: false, error: 'booking_query_failed', details: t }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }
      bookings = await bookingRes.json().catch(() => [])
    }

    if (!Array.isArray(bookings) || bookings.length === 0) {
      console.warn('Booking not found for provided identifier', { bookingId })
      return new Response(JSON.stringify({ ok: false, error: 'booking_not_found' }), { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    const booking = bookings[0]
    if (String(booking.user_id) !== String(userId)) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    // Perform update using service role key. Use a single OR filter so we match by booking_id OR id.
    const encoded = encodeURIComponent(bookingId)
    const url = `${base}/rest/v1/bookings?or=(booking_id.eq.${encoded},id.eq.${encoded})`

    const payload: Record<string, any> = {
      status: 'cancelled',
      user_cancelled: true,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'user',
      cancel_token: null,
      cancel_token_expires_at: null
    }

    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    })

    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      console.error('Failed to update booking', resp.status, text)
      return new Response(JSON.stringify({ ok: false, error: 'update_failed', details: text }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    let updated = []
    try { updated = JSON.parse(text) } catch (e) { updated = [] }

    // Record audit log entry
    try {
      const auditUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs`
      const metadata = { via: 'profile_cancel' }
      const auditResp = await fetch(auditUrl, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          event_type: 'cancel_booking',
          entity_type: 'booking',
          entity_id: bookingId,
          action: 'cancelled',
          actor_id: userId,
          actor_role: 'user',
          metadata
        })
      })
      if (!auditResp.ok) {
        const atxt = await auditResp.text().catch(() => '')
        console.warn('Failed to insert audit log into audit_logs', auditResp.status, atxt)
      }
    } catch (auditErr) {
      console.warn('Error while writing audit log to audit_logs', auditErr)
    }

    return new Response(JSON.stringify({ ok: true, updated }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('unexpected error in user-cancel-booking', err)
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
