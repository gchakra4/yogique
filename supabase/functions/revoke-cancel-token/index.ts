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
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_auth_token' }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Validate the token and fetch user info. Auth endpoint requires an API key header.
    const userRes = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY }
    })

    if (!userRes.ok) {
      const txt = await userRes.text().catch(() => '')
      console.error('Failed to validate auth token', userRes.status, txt)
      return new Response(JSON.stringify({ ok: false, error: 'invalid_auth_token' }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const userInfo = await userRes.json().catch(() => null)
    const userId = userInfo?.id
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'unable_to_identify_user' }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Check admin flag on profiles table using service role key
    const profileUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=is_admin`
    const profileRes = await fetch(profileUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
    if (!profileRes.ok) {
      const txt = await profileRes.text().catch(() => '')
      console.error('Failed to query profiles', profileRes.status, txt)
      return new Response(JSON.stringify({ ok: false, error: 'profile_check_failed' }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const profiles = await profileRes.json().catch(() => [])
    if (!Array.isArray(profiles) || profiles.length === 0 || !profiles[0].is_admin) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}))
    const bookingId = body?.booking_id || body?.id || null
    if (!bookingId) return new Response(JSON.stringify({ ok: false, error: 'missing_booking_id' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

    // Perform update using service role key
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/bookings?${body?.booking_id ? `booking_id=eq.${encodeURIComponent(body.booking_id)}` : `id=eq.${encodeURIComponent(body.id)}`}`

    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ cancel_token: null, cancel_token_expires_at: null })
    })

    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      console.error('Failed to revoke token', resp.status, text)
      return new Response(JSON.stringify({ ok: false, error: 'revoke_failed', details: text }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    let updated = []
    try { updated = JSON.parse(text) } catch (e) { updated = [] }

    // Record audit log of this revoke action in the generic `audit_logs` table
    try {
      const reason = body?.reason || null
      const auditUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs`
      const payload = {
        event_type: 'revoke_cancel_token',
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'revoke_token',
        actor_id: userId,
        actor_role: 'admin',
        metadata: { reason }
      }

      const auditResp = await fetch(auditUrl, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      })

      if (!auditResp.ok) {
        const atxt = await auditResp.text().catch(() => '')
        console.warn('Failed to insert revoke audit log into audit_logs', auditResp.status, atxt)
      }
    } catch (auditErr) {
      console.warn('Error while writing audit log to audit_logs', auditErr)
    }

    return new Response(JSON.stringify({ ok: true, updated }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('unexpected error in revoke-cancel-token', err)
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
})
