import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || null;

async function hmacSha256Hex(key: string, message: string) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const bytes = new Uint8Array(sig as ArrayBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const raw = await req.text().catch(() => null);
    if (!raw) return new Response('bad request', { status: 400 });
    let body: any = null;
    try { body = JSON.parse(raw); } catch (e) { body = null; }

    // If webhook secret configured, verify signature header. Support common header names.
    try {
      if (RESEND_WEBHOOK_SECRET) {
        const sigHeader = req.headers.get('Resend-Signature') || req.headers.get('resend-signature') || req.headers.get('Webhook-Signature') || req.headers.get('webhook-signature') || req.headers.get('X-Webhook-Signature') || req.headers.get('x-webhook-signature');
        if (!sigHeader) return new Response('missing signature', { status: 401 });
        const expectedHex = await hmacSha256Hex(RESEND_WEBHOOK_SECRET, raw);
        const normalized = sigHeader.replace(/^v1=/, '').trim().toLowerCase();
        if (normalized !== expectedHex) {
          console.warn('Resend webhook signature mismatch', { got: sigHeader, expectedHex });
          return new Response('unauthorized', { status: 401 });
        }
      }
    } catch (e) {
      console.warn('Resend signature verification error', e);
      return new Response('unauthorized', { status: 401 });
    }

    // Attempt to find provider id and status from known shapes
    let providerId = body?.id || body?.message?.id || body?.data?.id || null;
    let status = (body?.status || body?.event || body?.type || '') as string;
    status = String(status).toLowerCase();

    if (!providerId) {
      // try nested events array
      if (Array.isArray(body?.events) && body.events.length) {
        providerId = body.events[0]?.id || body.events[0]?.message?.id || null;
        status = String(body.events[0]?.status || body.events[0]?.event || '').toLowerCase();
      }
    }

    if (!providerId) return new Response('missing id', { status: 400 });

    try {
      const payload: any = { status: status, last_updated_at: new Date().toISOString() };
      if (status === 'delivered') payload.delivered_at = new Date().toISOString();

      await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit?provider_message_id=eq.${encodeURIComponent(providerId)}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      });

      // Fetch the updated audit row to get class_id
      const rowsRes = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit?select=class_id,channel&provider_message_id=eq.${encodeURIComponent(providerId)}` , {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (rowsRes.ok) {
        const rows = await rowsRes.json();
        const row = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (row && row.class_id && row.channel) {
          // Dual-write: record status update in canonical audit_logs (best-effort)
          try {
            const auditPayload = {
              event_type: 'notification_status_updated',
              entity_type: 'class',
              entity_id: String(row.class_id),
              action: 'status_update',
              actor_id: null,
              actor_role: null,
              metadata: {
                provider_message_id: providerId || null,
                channel: row.channel || null,
                status: status || null,
                last_updated_at: new Date().toISOString(),
              },
              created_at: new Date().toISOString(),
            };
            await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs?on_conflict=constraint:uniq_audit_logs_provider_message_id`, {
              method: 'POST',
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates' },
              body: JSON.stringify([auditPayload]),
            });
          } catch (e) {
            try { console.error('Failed to insert audit_logs row (resend webhook)', e); } catch (_) {}
          }

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
          const flagBody: any = {};
          flagBody[flagField] = hasDelivered;

          await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/class_assignments?id=eq.${encodeURIComponent(row.class_id)}`, {
            method: 'PATCH',
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(flagBody),
          });
        }
      }
    } catch (e) {
      console.error('resend webhook processing failed', e);
      return new Response('internal', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('unexpected', err);
    return new Response('internal', { status: 500 });
  }
});
