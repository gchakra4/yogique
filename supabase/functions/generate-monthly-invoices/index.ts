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
      const payload: any = {
        booking_id: t.booking_id ?? null,
        billing_period_month: t.billing_period_month ?? null,
        amount: t.amount,
        currency: t.currency ?? 'INR',
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
