/*
  Generate Monthly Invoices - Edge Function (scaffold)

  Usage: POST JSON array of invoice targets:
  [ { booking_id?, user_id?, subscription_id?, amount, currency, billing_period_month } ]

  Behavior:
  - Inserts invoices idempotently (unique constraint on booking_id + billing_period_month)
  - Returns inserted or existing invoice rows
  - Intended to be invoked by a scheduler (or manually for testing)
*/
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
    try {
    // read raw text first so we can debug parse failures
    const rawText = await req.text().catch(() => '');
    let body: any = [];
    try {
      body = rawText ? JSON.parse(rawText) : [];
    } catch (e) {
      body = [];
    }
    if (!Array.isArray(body)) return new Response(JSON.stringify({ error: 'expected array', rawText: rawText.slice(0, 1000) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // accept multiple possible secret names so function works with dashboard/cli naming
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPABASE_PROJECT_URL') ?? '';
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE') ?? Deno.env.get('SERVICE_ROLE') ?? '';
    // debug: log whether envs are present (do NOT print secrets)
    const envs = { has_url: !!SUPABASE_URL, has_service_role: !!SERVICE_ROLE };
    console.log('envs:', envs);
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: 'missing env', envs }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // if body is empty, return debug info so callers can see what arrived
    if (!body.length) {
      return new Response(JSON.stringify({ results: [], debug: { envs, rawText: rawText.slice(0, 1000), rawLength: rawText.length } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: any[] = [];
    for (const t of body) {
      // compute proration if billing_cycle_anchor is provided and within the billing month
      const billingPeriod = t.billing_period_month || null;
      const billingCycleAnchor = t.billing_cycle_anchor ?? t.billing_cycle_anchor_date ?? null;

      let prorated_amount = 0;
      let proration_detail = null;
      let due_date = billingPeriod;

      const amountNum = Number(t.amount ?? 0);

      // Prefer class-count proration when caller provides counts: scheduled vs total
      const scheduledClasses = t.scheduled_classes ?? t.scheduledClasses ?? null;
      const totalClasses = t.total_classes_in_month ?? t.totalClassesInMonth ?? t.total_classes ?? null;
      if (scheduledClasses != null && totalClasses != null && Number(totalClasses) > 0) {
        const sc = Number(scheduledClasses);
        const tc = Number(totalClasses);
        const ratio = Math.max(0, Math.min(1, sc / tc));
        const prorate = Math.round((amountNum * ratio) * 100) / 100;
        prorated_amount = prorate;
        proration_detail = { method: 'pro-rata-classes', scheduled_classes: sc, total_classes_in_month: tc, ratio, prorated_amount: prorate };
      } else if (billingPeriod && billingCycleAnchor) {
        // fallback: prorate by remaining days in month (existing logic)
        try {
          const bp = new Date(billingPeriod);
          const anchor = new Date(billingCycleAnchor);
          // only prorate if anchor is within the billing period month and after the start
          if (bp.getUTCFullYear() === anchor.getUTCFullYear() && bp.getUTCMonth() === anchor.getUTCMonth() && anchor.getUTCDate() > 1) {
            const year = bp.getUTCFullYear();
            const month = bp.getUTCMonth();
            const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
            const remainingDays = daysInMonth - (anchor.getUTCDate() - 1);
            const prorate = Math.round((amountNum * (remainingDays / daysInMonth)) * 100) / 100;
            prorated_amount = prorate;
            proration_detail = { billing_cycle_anchor: anchor.toISOString(), days_in_month: daysInMonth, remaining_days: remainingDays, prorated_amount: prorate, method: 'pro-rata-days' };
          }
        } catch (e) {
          console.log('proration compute error', String(e));
        }
      }

      const payload: any = {
        booking_id: t.booking_id ?? null,
        billing_period_month: billingPeriod,
        billing_cycle_anchor: billingCycleAnchor ?? null,
        amount: amountNum,
        currency: t.currency ?? 'INR',
        prorated_amount,
        proration_detail,
        due_date: due_date,
        generated_at: new Date().toISOString(),
        invoice_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: t.metadata ?? (t.subscription_id || t.user_id ? { subscription_id: t.subscription_id ?? null, user_id: t.user_id ?? null } : null),
      };

      // Try inserting; if unique conflict happens, fetch the existing row
      // attempt insert and capture debug info
      let insertError = null;
      let inserted = null;
      let found = null;
      try {
        const r = await supabaseAdmin.from('invoices').insert([payload]).select('*').limit(1);
        // debug: log insert response
        console.log('insert response', { error: r.error ? String(r.error) : null, rows: (r.data || []).length });
        inserted = r.data && r.data.length ? r.data[0] : null;
        insertError = r.error ?? null;
      } catch (e) {
        console.log('insert exception', String(e));
        insertError = String(e);
      }

      // If insert reported success (no error) but returned no rows, attempt to fetch the created row.
      if (!inserted && !insertError) {
        try {
          const where: any = { billing_period_month: payload.billing_period_month };
          if (payload.booking_id) where.booking_id = payload.booking_id;
          const f2 = await supabaseAdmin.from('invoices').select('*').match(where).limit(1);
          console.log('post-insert fetch', { error: f2.error ? String(f2.error) : null, rows: (f2.data || []).length, where });
          if (f2.data && f2.data.length) inserted = f2.data[0];
        } catch (e) {
          console.log('post-insert fetch exception', String(e));
        }
      }

      if (insertError) {
        // conflict or other error: try to find existing invoice for same booking + period
        const where: any = { billing_period_month: payload.billing_period_month };
        if (payload.booking_id) where.booking_id = payload.booking_id;
        try {
          const f = await supabaseAdmin.from('invoices').select('*').match(where).limit(1);
          console.log('find response', { error: f.error ? String(f.error) : null, rows: (f.data || []).length, where });
          found = f.data && f.data.length ? f.data[0] : null;
        } catch (e) {
          console.log('find exception', String(e));
          found = null;
        }
      }

      // produce a concise status for callers
      const invoiceRecord = inserted ?? found ?? null;
      const status = inserted ? 'created' : (found ? 'exists' : (insertError ? 'error' : 'unknown'));
      const invoice = invoiceRecord
        ? {
            id: invoiceRecord.id,
            booking_id: invoiceRecord.booking_id,
            billing_period_month: invoiceRecord.billing_period_month,
            amount: invoiceRecord.amount,
            currency: invoiceRecord.currency,
            invoice_status: invoiceRecord.invoice_status,
            generated_at: invoiceRecord.generated_at,
            created_at: invoiceRecord.created_at,
          }
        : null;

      results.push({ input: t, status, invoice, error: insertError ? (typeof insertError === 'string' ? insertError : (insertError.message ?? String(insertError))) : null });
    }

    return new Response(JSON.stringify({ results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
