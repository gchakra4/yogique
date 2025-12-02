import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256Hex(message: string) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// constant-time compare
function safeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}

function nowIso() { return new Date().toISOString(); }

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing SUPABASE env')
      return new Response(JSON.stringify({ ok: false, error: 'server_misconfigured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({}));
    const user_id = payload?.user_id || null;
    let phone: string = (payload?.phone || '').trim();
    const code = String(payload?.code || '').trim();

    if (!phone || !code) return new Response(JSON.stringify({ ok: false, error: 'missing phone or code' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // basic normalization
    phone = phone.replace(/[\s()\-]/g, '');

    // look up most recent non-expired, not-verified OTP for this phone
    const now = new Date().toISOString();
    const otpUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/phone_otps?select=id,code_hash,attempts,verified,expires_at,user_id&phone=eq.${encodeURIComponent(phone)}&verified=eq.false&expires_at=gt.${encodeURIComponent(now)}&order=created_at.desc&limit=1`;
    const otpRes = await fetch(otpUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!otpRes.ok) {
      console.error('Failed fetching OTP row', otpRes.status);
      return new Response(JSON.stringify({ ok: false, error: 'otp_lookup_failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const otpRows = await otpRes.json();
    const otpRow = Array.isArray(otpRows) && otpRows.length ? otpRows[0] : null;
    if (!otpRow) {
      return new Response(JSON.stringify({ ok: false, verified: false, reason: 'no_valid_otp' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const otpId = otpRow.id as string;
    const attempts = Number(otpRow.attempts || 0);
    const MAX_ATTEMPTS = 5;
    if (attempts >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ ok: false, verified: false, reason: 'max_attempts_exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const providedHash = await sha256Hex(code);
    const storedHash = String(otpRow.code_hash || '');

    // increment attempts regardless
    try {
      await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/phone_otps?id=eq.${encodeURIComponent(otpId)}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts: attempts + 1 }),
      });
    } catch (e) {
      console.warn('failed to increment attempts', e);
    }

    // compare hash
    if (!safeEquals(providedHash, storedHash)) {
      return new Response(JSON.stringify({ ok: false, verified: false, reason: 'invalid_code' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Before marking verified, ensure no other profile owns this phone
    try {
      const profilesUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/profiles?select=id,user_id,email&phone=eq.${encodeURIComponent(phone)}`;
      const pRes = await fetch(profilesUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      if (!pRes.ok) {
        console.error('profiles lookup failed', pRes.status);
        return new Response(JSON.stringify({ ok: false, error: 'profiles_lookup_failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const profiles = await pRes.json();
      // if any profile exists with this phone and user_id different from requester -> reject
      if (Array.isArray(profiles) && profiles.length) {
        const conflict = profiles.find((pr: any) => String(pr.user_id) !== String(user_id));
        if (conflict) {
          return new Response(JSON.stringify({ ok: false, verified: false, reason: 'phone_in_use_by_other_account' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
      }
    } catch (e) {
      console.error('profiles uniqueness check failed', e);
      return new Response(JSON.stringify({ ok: false, error: 'profiles_check_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Mark OTP row verified
    try {
      await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/phone_otps?id=eq.${encodeURIComponent(otpId)}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true, verified_at: nowIso() }),
      });
    } catch (e) {
      console.error('failed to mark otp verified', e);
    }

    // If user_id provided, update that user's profile.phone server-side (safe because we checked no other profile owns it)
    if (user_id) {
      try {
        const upsertBody = JSON.stringify({ user_id, phone });
        // Use upsert to insert or update
        await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/profiles`, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify([{ user_id, phone }]),
        });
      } catch (e) {
        console.error('failed to update profile phone', e);
        return new Response(JSON.stringify({ ok: false, verified: true, warning: 'profile_update_failed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ ok: true, verified: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('unexpected in verify-phone-otp', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
