import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || null;
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || null;
const TWILIO_SMS_FROM = Deno.env.get("TWILIO_SMS_FROM") || null; // e.g. "+123456789"

// simple helper: SHA-256 hex digest
async function sha256Hex(message: string) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function nowIso() {
  return new Date().toISOString();
}

function isoMinusMinutes(minutes: number) {
  const d = new Date(Date.now() - minutes * 60 * 1000);
  return d.toISOString();
}

async function sendSmsViaTwilio(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', TWILIO_SMS_FROM || '');
  params.append('Body', body);
  const auth = globalThis.btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  const text = await resp.text().catch(() => '');
  return { ok: resp.ok, status: resp.status, body: text };
}

serve(async (req) => {
  // CORS headers for browser requests
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

    // Basic env validation
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!TWILIO_SID) missing.push('TWILIO_ACCOUNT_SID');
    if (!TWILIO_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
    if (!TWILIO_SMS_FROM) missing.push('TWILIO_SMS_FROM');
    if (missing.length > 0) {
      console.error('Missing env vars:', missing.join(', '));
      return new Response(JSON.stringify({ ok: false, missing }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({}));
    const user_id = payload?.user_id || null;
    let phone = payload?.phone || '';
    if (!phone) return new Response(JSON.stringify({ ok: false, error: 'missing phone' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

    // minimal phone normalization: remove spaces/paren/dashes
    phone = phone.replace(/[\s()\-]/g, '');

    // enforce E.164 format: +countrycode followed by 8-15 digits
    if (!/^\+\d{8,15}$/.test(phone)) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_phone_format' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Rate limit: max 3 codes in last 15 minutes for this phone
    const window15 = isoMinusMinutes(15);
    const checkUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/phone_otps?select=id&phone=eq.${encodeURIComponent(phone)}&created_at=gt.${encodeURIComponent(window15)}`;
    const checkRes = await fetch(checkUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (checkRes.ok) {
      const arr = await checkRes.json();
      if (Array.isArray(arr) && arr.length >= 3) {
        return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256Hex(code);

    // expiry: 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Insert OTP record
    const insertUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/phone_otps`;
    const insertBody = JSON.stringify([{ user_id, phone, code_hash: codeHash, attempts: 0, verified: false, created_at: nowIso(), expires_at: expiresAt }]);
    const insertRes = await fetch(insertUrl, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: insertBody,
    });

    if (!insertRes.ok) {
      const text = await insertRes.text().catch(() => '');
      console.error('Failed to insert OTP row', insertRes.status, text);
      return new Response(JSON.stringify({ ok: false, error: 'otp_insert_failed' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Send SMS via Twilio
    const twResp = await sendSmsViaTwilio(phone, `Your verification code is ${code}. It expires in 10 minutes.`);
    if (!twResp.ok) {
      console.error('Twilio send failed', twResp.status, twResp.body);
      // don't return the code; but indicate failed to send
      return new Response(JSON.stringify({ ok: false, error: 'sms_send_failed', details: twResp.body }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Success — do not include the code in response
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('unexpected error in send-phone-otp', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
});
