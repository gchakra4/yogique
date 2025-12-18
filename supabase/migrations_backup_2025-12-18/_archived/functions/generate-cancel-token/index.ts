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

    const payload = await req.json().catch(() => ({}));
    const booking_id = payload?.booking_id;
    const expires_in_seconds = payload?.expires_in_seconds || 60 * 60 * 24 * 7; // default 7 days

    if (!booking_id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_booking_id' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Generate a 32-byte hex token
    const rnd = crypto.getRandomValues(new Uint8Array(32))
    const token = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('')
    const expiresAt = new Date(Date.now() + expires_in_seconds * 1000).toISOString()

    // Persist token on bookings row using Supabase REST API and service role key
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/bookings?booking_id=eq.${encodeURIComponent(booking_id)}`
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ cancel_token: token, cancel_token_expires_at: expiresAt })
    })

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      console.error('Failed to persist cancel token', resp.status, txt)
      return new Response(JSON.stringify({ ok: false, error: 'persist_failed', details: txt }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, token, expires_at: expiresAt }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('generate-cancel-token error', err)
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  }
})
