import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { restGet, restPost } from '../shared/db.ts';

function looksLikeE164(phone: string) {
  return /^\+\d{6,15}$/.test(phone);
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    // Fetch invoices that are pending and due now or earlier
    const nowIso = new Date().toISOString();
    const q = '/rest/v1/invoices?select=id,invoice_number,user_id,total_amount,due_date,booking_id&status=eq.pending&due_date=lte.' + encodeURIComponent(nowIso);
    const invoices = await restGet(q).catch((e) => { console.error('invoices fetch failed', e); return []; });

    const inserted: any[] = [];
    const skipped: any[] = [];

    for (const inv of Array.isArray(invoices) ? invoices : []) {
      const userId = inv.user_id;
      if (!userId) { skipped.push({ invoice: inv.id, reason: 'no_user' }); continue; }

      // Fetch profile for phone & consent
      const pQ = '/rest/v1/profiles?select=phone,whatsapp_opt_in,full_name,user_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1';
      const prow = await restGet(pQ).catch((e) => { console.error('profile fetch failed', e); return []; });
      const profile = Array.isArray(prow) && prow.length ? prow[0] : null;
      if (!profile) { skipped.push({ invoice: inv.id, reason: 'no_profile' }); continue; }
      if (!profile.whatsapp_opt_in) { skipped.push({ invoice: inv.id, reason: 'opt_out' }); continue; }
      const rawPhone = String(profile.phone || '').trim();
      const phone = rawPhone.replace(/[\s()\-]/g, '');
      if (!looksLikeE164(phone)) { skipped.push({ invoice: inv.id, reason: 'invalid_phone', phone }); continue; }

      // Build vars object — send-template will map via default_vars when present
      const vars = {
        name: profile.full_name || '',
        invoice_number: inv.invoice_number || '',
        invoice_id: inv.id || '',
        amount: inv.total_amount || '',
        booking_id: inv.booking_id || null,
      };

      const row = {
        channel: 'whatsapp',
        recipient: 'whatsapp:' + phone,
        template_key: 'yogique_payment_due_reminder',
        template_language: 'en',
        vars: vars,
        metadata: { invoice_id: inv.id, scheduled_by: 'schedule-payment-reminders' },
        status: 'pending',
        attempts: 0,
        run_after: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      };

      try {
        const res = await restPost('/rest/v1/notifications_queue', [row]).catch((e) => { throw e; });
        inserted.push({ invoice: inv.id, result: res });
      } catch (e) {
        console.error('failed to enqueue for invoice', inv.id, e);
        skipped.push({ invoice: inv.id, reason: 'enqueue_failed', error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, now: nowIso, inserted: inserted.length, skipped, details: { inserted, skipped } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('schedule-payment-reminders error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
