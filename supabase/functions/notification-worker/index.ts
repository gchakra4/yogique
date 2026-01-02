import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { callFunctionWithOptions, restGet, restPatch } from '../shared/db.ts';

// Keep each invocation short to avoid Edge runtime EarlyDrop (~15s)
const DEFAULT_LIMIT = Number(Deno.env.get('NOTIFICATION_WORKER_LIMIT') || '1');
const DEFAULT_BUDGET_MS = Number(Deno.env.get('NOTIFICATION_WORKER_BUDGET_MS') || '9000');
const DEFAULT_DOWNSTREAM_TIMEOUT_MS = Number(Deno.env.get('NOTIFICATION_WORKER_DOWNSTREAM_TIMEOUT_MS') || '8000');

function nowMs() {
  return Date.now();
}

// Retry/backoff configuration
const MAX_ATTEMPTS = Number(Deno.env.get('NOTIFICATION_MAX_ATTEMPTS') || '5');
const BASE_BACKOFF_MS = Number(Deno.env.get('NOTIFICATION_BASE_BACKOFF_MS') || '1000');
const MAX_BACKOFF_MS = Number(Deno.env.get('NOTIFICATION_MAX_BACKOFF_MS') || '600000');
const ALERT_AFTER = Number(Deno.env.get('NOTIFICATION_ALERT_AFTER') || '3');
const MONITORING_WEBHOOK = Deno.env.get('MONITORING_WEBHOOK_URL') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function fetchPending(limit: number) {
  const q = '/rest/v1/notifications_queue?select=*&status=eq.pending&run_after=lte.' + encodeURIComponent(new Date().toISOString()) + '&order=run_after.asc&limit=' + String(limit);
  return await restGet(q);
}

async function markProcessing(id: string) {
  const q = '/rest/v1/notifications_queue?id=eq.' + encodeURIComponent(id);
  try {
    await restPatch(q, { status: 'processing', updated_at: new Date().toISOString() }, true);
    return true;
  } catch (e) {
    return false;
  }
}

async function finalizeRow(id: string, ok: boolean, attempts: number, errorText: string | null) {
  const q = '/rest/v1/notifications_queue?id=eq.' + encodeURIComponent(id);
  const now = new Date();
  const body: any = { attempts, updated_at: now.toISOString() };

  if (ok) {
    body.status = 'sent';
    body.last_error = null;
    await restPatch(q, body).catch((e) => { console.error('failed finalizeRow patch sent', e); });
    return;
  }

  // Failed attempt: schedule retry if attempts < MAX_ATTEMPTS
  if (attempts < MAX_ATTEMPTS) {
    const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempts - 1)));
    const runAfter = new Date(now.getTime() + backoff).toISOString();
    body.status = 'pending';
    body.last_error = errorText ? String(errorText).slice(0, 2000) : null;
    body.run_after = runAfter;
    await restPatch(q, body).catch((e) => { console.error('failed finalizeRow patch retry', e); });

    // Monitoring: alert when attempts pass threshold
    try {
      if (MONITORING_WEBHOOK && attempts >= ALERT_AFTER) {
        await fetch(MONITORING_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'notification_retry_alert', id, attempts, last_error: body.last_error }) }).catch(() => {});
      }
    } catch (_) {}

    return;
  }

  // Exhausted attempts — mark failed
  body.status = 'failed';
  body.last_error = errorText ? String(errorText).slice(0, 2000) : null;
  await restPatch(q, body).catch((e) => { console.error('failed finalizeRow patch failed', e); });

  // Final alert for exhausted failures
  try {
    if (MONITORING_WEBHOOK) {
      await fetch(MONITORING_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'notification_failed', id, attempts, last_error: body.last_error }) }).catch(() => {});
    }
  } catch (_) {}
}

async function processRow(row: any, serviceRoleKey: string | null) {
  const id = row.id;
  if (!id) return { ok: false, error: 'missing id' };

  const locked = await markProcessing(id);
  if (!locked) return { ok: false, error: 'failed to claim row' };

  const channel = row.channel || 'whatsapp';
  const payload: any = {
    to: row.recipient || null,
    channel,
    metadata: row.metadata || null,
    dry_run: false,
  };

  // Add channel-specific fields
  if (channel === 'email') {
    // Use direct columns (preferred) or fallback to metadata.email (backward compatibility)
    payload.subject = row.subject || row.metadata?.email?.subject || null;
    payload.html = row.html || row.metadata?.email?.html || null;
    payload.bcc = row.bcc || row.metadata?.email?.bcc || null;
    payload.from = row.from || row.metadata?.email?.from || null;
  } else {
    // WhatsApp/SMS
    payload.templateKey = row.template_key || null;
    payload.templateLanguage = row.template_language || 'en';
    payload.vars = row.vars || null;
  }

  try {
    const result = await callFunctionWithOptions('notification-service', payload, {
      serviceRoleKey,
      timeoutMs: DEFAULT_DOWNSTREAM_TIMEOUT_MS,
    });
    const downstreamOk = Boolean(result && result.ok && (result as any).body && (result as any).body.ok === true);
    if (downstreamOk) {
      await finalizeRow(id, true, (row.attempts || 0) + 1, null);
      return { ok: true, id };
    } else {
      const status = result?.status;
      const body = (result as any)?.body;
      await finalizeRow(id, false, (row.attempts || 0) + 1, `func_status=${status} body=${JSON.stringify(body)}`);
      return { ok: false, id, error: JSON.stringify(body) };
    }
  } catch (err) {
    await finalizeRow(id, false, (row.attempts || 0) + 1, String(err));
    return { ok: false, id, error: String(err) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const incomingApikey = req.headers.get('apikey') || null;
    const incomingBearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || null;
    const runtimeKey = incomingApikey || incomingBearer || null;

    try {
      console.log('notification-worker auth', {
        apikey_len: incomingApikey ? incomingApikey.length : 0,
        bearer_len: incomingBearer ? incomingBearer.length : 0,
        runtime_key_len: runtimeKey ? runtimeKey.length : 0,
      });
    } catch (_) {}

    const body = await req.json().catch(() => ({}));
    const limit = Number(body.limit || DEFAULT_LIMIT);
    const budgetMs = Number(body.budget_ms || DEFAULT_BUDGET_MS);

    const start = nowMs();
    let processed = 0;

    const rows = await fetchPending(limit);
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (nowMs() - start > budgetMs) break;
        await processRow(r, runtimeKey);
        processed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notification-worker error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

// Additionally: when making any fetch to another edge function from this worker, set headers like:
// Runtime key is taken from request headers (or env) via shared helpers.
// const headers = { 'Content-Type': 'application/json', 'Authorization': key ? `Bearer ${key}` : '', 'apikey': key || '' };
// await fetch(`${SUPABASE_URL}/functions/v1/notification-service`, { method:'POST', headers, body: JSON.stringify(payload) });
