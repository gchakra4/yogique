import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { getProvider } from "../providers/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SCHED_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHED_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    if (!SUPABASE_URL || !SUPABASE_KEY) return new Response(JSON.stringify({ ok: false, error: 'missing_env' }), { status: 500 });

    // Optional scheduler secret header
    if (SCHED_HEADER && SCHED_TOKEN) {
      const incoming = req.headers.get(SCHED_HEADER);
      if (!incoming || incoming !== SCHED_TOKEN) return new Response('Unauthorized', { status: 401 });
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

      // Back-compat explicit mapping for a known template.
      if (templateKey === 'yogique_payment_due_reminder') {
        const name = v.name ?? v.customerName ?? v.userName ?? '';
        const period = v.period ?? v.month ?? v.billingPeriod ?? v.billing_period ?? '';
        const invoiceId = v.invoiceId ?? v.invoiceNo ?? v.invoice_no ?? v.invoice_number ?? '';
        const amount = v.amount ?? v.amt ?? v.total ?? '';
        const urlToken = v.urlToken ?? v.token ?? v.url_param ?? '';
        vars = [
          String(name),
          String(period),
          String(invoiceId),
          String(amount),
          String(urlToken),
        ];
      } else {
        // Generic mapping: look up default_vars ordering from wa_templates.
        try {
          const requestedLang = payload.language || 'en';
          const tryLangs: string[] = [requestedLang];
          const base = String(requestedLang).split(/[-_]/)[0];
          if (base && base !== requestedLang) tryLangs.push(base);

          let row: any = null;
          for (const lang of tryLangs) {
            const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/wa_templates?select=key,language,default_vars&key=eq.${encodeURIComponent(templateKey)}&language=eq.${encodeURIComponent(lang)}&limit=1`;
            const resp = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
            if (!resp.ok) continue;
            const rows = await resp.json().catch(() => null);
            row = Array.isArray(rows) && rows.length ? rows[0] : null;
            if (row) break;
          }

          const def = row && typeof row.default_vars === 'object' ? row.default_vars : null;
          const keys = def ? Object.keys(def) : [];
          if (keys.length) {
            vars = keys.map((k) => String((v[k] ?? def[k] ?? '') || ''));
          } else {
            // Fallback: take object values (stable only for caller-defined ordering).
            vars = Object.values(v).map((val) => String(val ?? ''));
          }
        } catch (e) {
          vars = Object.values(v).map((val) => String(val ?? ''));
        }
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
    return new Response(JSON.stringify(res), { status: res.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-template error', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { status: 500 });
  }
});
