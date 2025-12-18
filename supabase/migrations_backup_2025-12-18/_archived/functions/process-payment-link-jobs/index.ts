/*
  Worker function: process pending payment_link_jobs
  - Fetches pending jobs, marks processing, calls Razorpay with timeout+retry,
    updates invoices with link info, updates job status, and inserts audit_logs.
  - Intended to be run on a scheduler (e.g., every minute) or invoked manually.
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE') ?? '';
    const RZ_KEY = Deno.env.get('RAZORPAY_KEY_ID') ?? Deno.env.get('RAZORPAY_key_id') ?? '';
    const RZ_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? Deno.env.get('RAZORPAY_key_secret') ?? '';
    if (!SUPABASE_URL || !SERVICE_ROLE) return new Response(JSON.stringify({ error: 'missing env' }), { status: 500 });

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch a single pending job that's due to run
    const nowIso = new Date().toISOString();
    const { data: jobs, error: jobErr } = await supabaseAdmin
      .from('payment_link_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('next_run_at', nowIso)
      .order('created_at', { ascending: true })
      .limit(1);
    if (jobErr) {
      console.log('fetch jobs error', jobErr);
      return new Response(JSON.stringify({ error: jobErr }), { status: 500 });
    }
    if (!jobs || !jobs.length) return new Response(JSON.stringify({ processed: 0 }), { status: 200 });

    const j: any = jobs[0];

    // Try to atomically claim this job by moving it to 'processing' only if still pending
    const claimRes = await supabaseAdmin
      .from('payment_link_jobs')
      .update({ status: 'processing', attempts: (j.attempts || 0) + 1, updated_at: nowIso, processing_started_at: nowIso })
      .eq('id', j.id)
      .eq('status', 'pending')
      .select('id');
    if (claimRes.error) {
      console.log('claim error', claimRes.error);
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }
    if (!claimRes.data || !claimRes.data.length) {
      // someone else claimed it
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    const payload = j.payload || {};
    const amount = payload.amount;
    const currency = payload.currency || 'INR';
    const invoice_id = j.invoice_id;

    const auth = btoa(`${RZ_KEY}:${RZ_SECRET}`);

    async function callRazorpayWithTimeout(timeoutMs = 10000, maxAttempts = 3) {
      const amount_paise = Math.round(Number(amount) * 100);
      const rzPayload: any = {
        amount: amount_paise,
        currency,
        reference_id: invoice_id,
        description: `Invoice ${invoice_id}`,
        notes: payload,
      };

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch('https://api.razorpay.com/v1/payment_links', {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(rzPayload),
            signal: controller.signal,
          });
          clearTimeout(to);
          const json = await res.json().catch(() => null);
          if (res.ok) return { ok: true, data: json };
          if (res.status >= 500) {
            // transient server error, backoff and retry
            await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
            continue;
          }
          return { ok: false, err: json };
        } catch (e) {
          clearTimeout(to);
          console.log('rz attempt err', String(e));
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
        }
      }
      return { ok: false, err: 'timeout_or_network' };
    }

    let procResult: any = null;
    if (!RZ_KEY || !RZ_SECRET) {
      procResult = { ok: false, err: 'missing_keys' };
    } else {
      procResult = await callRazorpayWithTimeout(12000, 3);
    }

    const MAX_ATTEMPTS = 5;
    const BASE_BACKOFF = 60; // seconds

    if (procResult.ok) {
      const rz = procResult.data;
      // update invoice with link info
      await supabaseAdmin.from('invoices').update({ razorpay_link_id: rz.id, razorpay_link_url: rz.short_url ?? rz.long_url, updated_at: new Date().toISOString() }).eq('id', invoice_id);
      // mark job done
      await supabaseAdmin.from('payment_link_jobs').update({ status: 'done', updated_at: new Date().toISOString(), processing_finished_at: new Date().toISOString() }).eq('id', j.id);
      // insert audit log row
      const { error: auditErr } = await supabaseAdmin.from('audit_logs').insert([{
        event_type: 'invoice_send',
        audit_type: 'invoice_send',
        invoice_id: invoice_id,
        channel: 'razorpay_link',
        recipient: payload.recipient || null,
        attempt: (j.attempts || 0) + 1,
        provider_response: JSON.stringify({ id: rz.id, url: rz.short_url ?? rz.long_url }),
        reminder_status: 'sent',
        sent_at: new Date().toISOString(),
      }]);
      if (auditErr) console.log('audit insert err', auditErr);

      return new Response(JSON.stringify({ processed: 1, result: { job: j.id, status: 'done', link: rz.short_url ?? rz.long_url } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      // failure: schedule retry or mark failed
      const attempts = (j.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await supabaseAdmin.from('payment_link_jobs').update({ status: 'failed', last_error: String(procResult.err), attempts, updated_at: new Date().toISOString(), processing_finished_at: new Date().toISOString() }).eq('id', j.id);
        return new Response(JSON.stringify({ processed: 1, result: { job: j.id, status: 'failed', error: procResult.err } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // exponential backoff
      const delaySec = Math.min(3600, BASE_BACKOFF * Math.pow(2, attempts - 1));
      const nextRun = new Date(Date.now() + delaySec * 1000).toISOString();
      await supabaseAdmin.from('payment_link_jobs').update({ status: 'pending', last_error: String(procResult.err), attempts, next_run_at: nextRun, updated_at: new Date().toISOString() }).eq('id', j.id);
      return new Response(JSON.stringify({ processed: 1, result: { job: j.id, status: 'requeued', next_run_at: nextRun, error: procResult.err } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
