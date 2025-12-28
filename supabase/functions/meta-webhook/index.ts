import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_WEBHOOK_VERIFY_TOKEN = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") || null;
const META_WEBHOOK_APP_SECRET = Deno.env.get("META_WEBHOOK_APP_SECRET") || null; // app secret for X-Hub-Signature-256

function bufToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(raw: Uint8Array, headerSig: string | null) {
  if (!META_WEBHOOK_APP_SECRET) return true; // no secret configured
  if (!headerSig) return false;
  try {
    const match = headerSig.match(/^sha256=(.+)$/);
    if (!match) return false;
    const sigHex = match[1];
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(META_WEBHOOK_APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, raw);
    const computed = bufToHex(signature);
    return computed === sigHex;
  } catch (e) {
    try { console.warn('signature verify failed', e); } catch (_) {}
    return false;
  }
}

serve(async (req) => {
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const challenge = url.searchParams.get('hub.challenge');
      const token = url.searchParams.get('hub.verify_token');

      if (
        mode === 'subscribe' &&
        token &&
        META_WEBHOOK_VERIFY_TOKEN &&
        token === META_WEBHOOK_VERIFY_TOKEN
      ) {
        return new Response(challenge || '', { status: 200 });
      }

      return new Response('Not Found', { status: 404 });
    }

    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const raw = new Uint8Array(await req.arrayBuffer());
    const sig = req.headers.get('x-hub-signature-256') || req.headers.get('X-Hub-Signature-256');
    const verified = await verifySignature(raw, sig);
    if (!verified) {
      console.warn('Webhook signature verification failed');
      return new Response('Forbidden', { status: 403 });
    }

    const bodyText = new TextDecoder().decode(raw);
    let payload: any = {};
    try { payload = JSON.parse(bodyText); } catch (e) { payload = {}; }

    // Process statuses and messages from entries/changes
    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    const updates: Array<{ id: string; status: string; timestamp?: string; raw?: any }> = [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value || {};
        // statuses (message status updates)
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const s of statuses) {
          updates.push({ id: s.id, status: s.status, timestamp: s.timestamp, raw: s });
        }
        // incoming messages (optional): mark as received in audit logs
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const m of messages) {
          // treat incoming message as event; include in audit_logs
          try {
            const auditPayload = {
              event_type: 'incoming_message',
              entity_type: 'whatsapp',
              entity_id: m.id || null,
              action: 'receive_message',
              actor_id: null,
              actor_role: null,
              metadata: { provider: 'meta', raw: m },
              created_at: new Date().toISOString(),
            };
            fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs`, {
              method: 'POST',
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify([auditPayload]),
            }).catch((e) => console.warn('failed audit_logs write', e));
          } catch (e) { /* ignore */ }
        }
      }
    }

    // Map meta statuses to our message_audit status values
    function mapStatus(s: string) {
      if (!s) return 'unknown';
      const normalized = s.toLowerCase();
      if (normalized === 'sent') return 'sent';
      if (normalized === 'delivered') return 'delivered';
      if (normalized === 'read') return 'read';
      if (normalized === 'failed' || normalized === 'error') return 'failed';
      return normalized;
    }

    for (const u of updates) {
      const mapped = mapStatus(u.status);
      // Update message_audit rows matching provider_message_id
      try {
        const patchBody: any = { status: mapped, metadata: { last_status: u.status, last_status_ts: u.timestamp || null, provider: 'meta', provider_payload: u.raw || null } };
        await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit?provider_message_id=eq.${encodeURIComponent(u.id)}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody),
        });

        // Create audit_logs entry for status update
        const auditPayload = {
          event_type: 'notification_status_update',
          entity_type: 'class',
          entity_id: null,
          action: 'provider_status',
          actor_id: null,
          actor_role: null,
          metadata: { provider: 'meta', provider_message_id: u.id, status: mapped, raw: u.raw },
          created_at: new Date().toISOString(),
        };
        await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs`, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates' },
          body: JSON.stringify([auditPayload]),
        });
      } catch (e) {
        try { console.warn('failed to process status update', e); } catch (_) {}
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('webhook error', err);
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
