import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { getProvider } from "../providers/index.ts";
import { restPost } from '../shared/db.ts';
import { mapNamedVars } from '../shared/namedVars.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SCHED_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHED_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;

function mask(s: string | null | undefined) {
  if (!s) return '';
  return s.length > 8 ? s.slice(0,4) + '...' + s.slice(-4) : '****';
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    if (!SUPABASE_URL || !SUPABASE_KEY) return new Response(JSON.stringify({ ok: false, error: 'missing_env' }), { status: 500 });

    // Optional scheduler secret header
    if (SCHED_TOKEN) {
      const incomingHeader = SCHED_HEADER ? req.headers.get(SCHED_HEADER) : null;
      const authBearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const incomingApikey = req.headers.get('apikey') || null;

      // Accept scheduler token via configured header or bearer.
      const schedulerOk = (incomingHeader && incomingHeader === SCHED_TOKEN) || (authBearer && authBearer === SCHED_TOKEN);

      // Also accept service role style auth (cron + internal calls):
      // - exact match to env service role key, OR
      // - heuristic "looks like a JWT" (matches send-email behavior)
      const serviceRoleExact = !!SUPABASE_KEY && (incomingApikey === SUPABASE_KEY || authBearer === SUPABASE_KEY);
      const serviceRoleHeuristic = !!incomingApikey && incomingApikey.length > 100;
      const serviceRoleOk = serviceRoleExact || serviceRoleHeuristic;

      if (!schedulerOk && !serviceRoleOk) return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const to = payload?.to;
    const templateKey = payload?.templateKey;
    let vars: any[] = Array.isArray(payload?.vars) ? payload.vars : [];
    const dryRun = Boolean(payload?.dry_run);

    if (!to || !templateKey) return new Response(JSON.stringify({ ok: false, error: 'missing_to_or_templateKey' }), { status: 400 });

    // Optional: allow named vars object to avoid positional mistakes.
    // Preferred: configure wa_templates.default_vars to define the key order.
    // Example body:
    // vars: { name, amount, period, invoiceId, urlToken }
    if (!Array.isArray(payload?.vars) && payload?.vars && typeof payload.vars === 'object') {
      const v: Record<string, any> = payload.vars;
      try {
        vars = await mapNamedVars(templateKey, payload.language || 'en', v as Record<string, any>);
      } catch (e) {
        vars = Object.keys(v).map((k) => String(v[k] ?? ''));
      }
    }

    const provider = getProvider();

    if (dryRun) {
      // Render payload but do not send
      try {
        const resp = await provider.sendTemplate({
          to,
          templateName: templateKey,
          templateLanguage: payload.language || 'en',
          templateParameters: vars,
          metadata: { dry_run: true, debug: true },
        });
        return new Response(
          JSON.stringify({ ok: resp.ok, dry_run: true, result: resp.rawResponse || null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
      }
    }

    const res = await provider.sendTemplate({ to, templateName: templateKey, templateLanguage: payload.language || 'en', templateParameters: vars, metadata: payload.metadata || null });

    // Best-effort: insert message_audit row so delivery callbacks can update status
    try {
      const providerMessageId = res && res.provider_message_id ? res.provider_message_id : null;
      const recipient = String(to || '').replace(/^whatsapp:/, '');
      const auditRow = [
        {
          class_id: null,
          user_id: null,
          channel: 'whatsapp',
          recipient,
          provider: res && res.provider ? res.provider : 'meta',
          provider_message_id: providerMessageId,
          status: res && res.ok ? 'sent' : 'failed',
          attempts: res && (res as any).attempts ? (res as any).attempts : 1,
          metadata: { template_key: templateKey, template_language: payload.language || 'en', raw: res && res.rawResponse ? res.rawResponse : null },
        },
      ];
      await restPost('/rest/v1/message_audit', auditRow).catch((e) => { console.error('failed to insert message_audit', e); });
    } catch (e) { console.error('send-template audit insert failed', e); }

    return new Response(JSON.stringify(res), { status: res.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-template error', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500 });
  }
});
