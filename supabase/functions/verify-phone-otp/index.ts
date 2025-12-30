import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { verifyOtp } from "../../../src/services/otpService.ts";

serve(async (req) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as Record<string,string>;

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });

  try {
    const payload = await req.json().catch(() => ({}));
    let phone = (payload?.phone || '').replace(/[\s()\-]/g, '');
    let code = String(payload?.code || '').trim();
    if (!phone || !code) {
      try {
        const urlObj = new URL(req.url);
        phone = phone || (urlObj.searchParams.get('phone') || '').replace(/[\s()\-]/g, '');
        code = code || String(urlObj.searchParams.get('code') || '').trim();
      } catch (_) {}
    }

    if (!phone || !code) return new Response(JSON.stringify({ ok: false, error: 'missing_phone_or_code' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

    const res = await verifyOtp({ phone, code });
    if (res.ok) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const reason = res.reason || 'invalid';
    const status = (reason === 'expired') ? 410 : (reason === 'max_attempts') ? 429 : 400;
    return new Response(JSON.stringify({ ok: false, reason }), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('verify-phone-otp error', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
});
