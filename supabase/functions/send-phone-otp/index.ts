import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createOtp } from "../../../src/services/otpService.ts";
import { getProvider } from "../providers/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    // Basic env validation: only require Supabase envs here
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missing.length > 0) {
      console.error('Missing env vars:', missing.join(', '));
      return new Response(JSON.stringify({ ok: false, missing }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({}));
    const userId = payload?.user_id || null;
    let phone = payload?.phone || '';
    if (!phone) {
      try {
        const urlObj = new URL(req.url);
        phone = urlObj.searchParams.get('phone') || '';
      } catch (_) {}
    }
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

    // Create OTP via otpService (stores hashed code and returns plain code)
    const { ok: createOk, code, row } = await createOtp({ userId, phone, channel: 'whatsapp', ttlSeconds: 600, provider: (Deno.env.get('OTP_PROVIDER') || 'meta') });
    if (!createOk) {
      return new Response(JSON.stringify({ ok: false, error: 'otp_create_failed' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Send via configured provider (uses adapter; supports otp field)
    const provider = getProvider();
    try {
      const sendResult = await provider.sendMessage({ to: `whatsapp:${phone}`, type: 'text', otp: code, textBody: `Your verification code is ${code}. It expires in 10 minutes.` });
      if (!sendResult.ok) {
        // best-effort: delete the OTP row we created to avoid unused codes lingering
        try {
          await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/otp_codes?id=eq.${encodeURIComponent(row?.id)}`, {
            method: 'DELETE',
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          });
        } catch (e) { console.warn('failed to delete otp row after send failure', e); }
        return new Response(JSON.stringify({ ok: false, error: 'send_failed', details: sendResult.rawResponse }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      // Insert message_audit row linking provider_message_id to this OTP (best-effort)
      try {
        const sid = sendResult.provider_message_id ?? null;
        const auditBody = [
          {
            class_id: null,
            user_id: userId || null,
            channel: 'whatsapp',
            recipient: phone,
            provider: (sendResult && sendResult.provider) ? sendResult.provider : 'meta',
            provider_message_id: sid,
            status: (sendResult && sendResult.ok) ? 'sent' : 'failed',
            attempts: sendResult.attempts ?? 1,
            metadata: { provider_payload: sendResult.rawResponse || null },
          },
        ];
        await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit`, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(auditBody),
        });

        // Also write an audit_logs entry
        try {
          const auditPayload = {
            event_type: 'notification_sent',
            entity_type: 'otp',
            entity_id: null,
            action: 'send_otp',
            actor_id: userId || null,
            actor_role: null,
            metadata: {
              channel: 'whatsapp',
              recipient: phone,
              provider: (sendResult && sendResult.provider) ? sendResult.provider : 'meta',
              provider_message_id: sid,
              attempts: sendResult.attempts ?? 1,
              response: sendResult.rawResponse || null,
            },
            created_at: new Date().toISOString(),
          };
          await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs?on_conflict=constraint:uniq_audit_logs_provider_message_id`, {
            method: 'POST',
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates' },
            body: JSON.stringify([auditPayload]),
          });
        } catch (e) { console.warn('failed to insert audit_logs for otp send', e); }
      } catch (e) {
        console.warn('failed to insert message_audit for otp send', e);
      }
    } catch (e) {
      try {
        await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/otp_codes?id=eq.${encodeURIComponent(row?.id)}`, {
          method: 'DELETE',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
      } catch (_) {}
      console.error('provider send exception', e);
      return new Response(JSON.stringify({ ok: false, error: 'send_exception', details: String(e) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('unexpected error in send-phone-otp', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
});
