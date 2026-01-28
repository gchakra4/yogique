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
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(JSON.stringify({ ok: false, error: 'server_not_configured' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({}));
    const booking_id = payload?.booking_id || payload?.id || null;
    const note = payload?.note || null;
    const token = payload?.token || null;

    if (!booking_id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_booking_id' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_token' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Validate token by selecting booking that matches booking_id + token and token not expired
    const nowIso = new Date().toISOString();
    const selectUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/bookings?select=*&booking_id=eq.${encodeURIComponent(booking_id)}&cancel_token=eq.${encodeURIComponent(token)}&cancel_token_expires_at=gt.${encodeURIComponent(nowIso)}`;
    const selRes = await fetch(selectUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!selRes.ok) {
      const t = await selRes.text().catch(() => '')
      console.error('Failed to validate token selection', selRes.status, t)
      return new Response(JSON.stringify({ ok: false, error: 'validation_failed', details: t }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const rows = await selRes.json().catch(() => [])
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_or_expired_token' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Token validated; perform the update
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/bookings?booking_id=eq.${encodeURIComponent(booking_id)}&cancel_token=eq.${encodeURIComponent(token)}`;

    const body: Record<string, any> = {
      // Mark booking as cancelled and record who cancelled it
      status: 'user_cancelled',  // Updated to use new enum status
      user_cancelled: true,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'user',
      cancelled_reason: note || 'Cancelled by user via cancellation link',
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
      body: JSON.stringify(body)
    })

    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      console.error('Failed to update booking', resp.status, text)
      return new Response(JSON.stringify({ ok: false, error: 'update_failed', details: text }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    let updated = []
    try { updated = JSON.parse(text) } catch (e) { updated = [] }

    return new Response(JSON.stringify({ ok: true, updated }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('unexpected error in cancel-booking', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
