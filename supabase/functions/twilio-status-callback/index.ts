import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || Deno.env.get("TWILIO_TOKEN") || null;

async function hmacSha1Base64(key: string, message: string) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  // base64
  const bytes = new Uint8Array(sig as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const text = await req.text().catch(() => '');
    const params = new URLSearchParams(text);
    const messageSid = params.get('MessageSid') || params.get('messagesid') || params.get('MessageSid'.toLowerCase()) || null;

    // Verify Twilio signature if auth token present
    try {
      const twilioSig = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
      if (TWILIO_AUTH_TOKEN && twilioSig) {
        // Build base string: full URL + concatenated sorted params
        const url = req.url;
        const entries: string[] = [];
        for (const key of Array.from(params.keys()).sort()) {
          entries.push(key + params.get(key));
        }
        const base = url + entries.join('');
        const expected = await hmacSha1Base64(TWILIO_AUTH_TOKEN, base);
        // const-time compare
        if (!(expected === twilioSig)) {
          console.warn('Twilio signature mismatch');
          return new Response('unauthorized', { status: 401 });
        }
      }
    } catch (e) {
      console.warn('Twilio signature verification error', e);
      return new Response('unauthorized', { status: 401 });
    }
    const status = (params.get('MessageStatus') || params.get('MessageStatus'.toLowerCase()) || '').toLowerCase();

    if (!messageSid) {
      return new Response('missing MessageSid', { status: 400 });
    }

    // Update audit row
    try {
      const payload = { status: status, last_updated_at: new Date().toISOString() } as any;
      if (status === 'delivered') payload.delivered_at = new Date().toISOString();

      await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit?provider_message_id=eq.${encodeURIComponent(messageSid)}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      // Fetch the updated audit row to get class_id
      const rowsRes = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit?select=class_id,channel&provider_message_id=eq.${encodeURIComponent(messageSid)}` , {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (rowsRes.ok) {
        const rows = await rowsRes.json();
        const row = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (row && row.class_id && row.channel) {
          // If any audit for the class/channel has status=delivered -> set class_assignments.<channel>_notified = true
          const channel = String(row.channel);
          const deliveredRes = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit?select=id&class_id=eq.${encodeURIComponent(row.class_id)}&channel=eq.${encodeURIComponent(channel)}&status=eq.delivered`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          });
          let hasDelivered = false;
          if (deliveredRes.ok) {
            const dr = await deliveredRes.json();
            hasDelivered = Array.isArray(dr) && dr.length > 0;
          }

          const flagField = channel === 'email' ? 'email_notified' : 'whatsapp_notified';
          const flagBody = {} as any;
          flagBody[flagField] = hasDelivered;

          await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/class_assignments?id=eq.${encodeURIComponent(row.class_id)}`, {
            method: 'PATCH',
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(flagBody),
          });
        }
      }
    } catch (e) {
      console.error('twilio callback processing failed', e);
      return new Response('internal', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('unexpected', err);
    return new Response('internal', { status: 500 });
  }
});
