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

      // Fetch profile for phone, email & consent
      const pQ = '/rest/v1/profiles?select=phone,email,whatsapp_opt_in,full_name,user_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1';
      const prow = await restGet(pQ).catch((e) => { console.error('profile fetch failed', e); return []; });
      const profile = Array.isArray(prow) && prow.length ? prow[0] : null;
      if (!profile) { skipped.push({ invoice: inv.id, reason: 'no_profile' }); continue; }

      const userEmail = String(profile.email || '').trim();
      const hasValidEmail = userEmail && userEmail.includes('@');
      
      // WhatsApp reminder
      let whatsappQueued = false;
      if (profile.whatsapp_opt_in) {
        const rawPhone = String(profile.phone || '').trim();
        const phone = rawPhone.replace(/[\s()\-]/g, '');
        if (looksLikeE164(phone)) {
          // Build vars object — send-template will map via default_vars when present
          // Build positional vars array matching the template's expected order:
          // [name, period, invoice_number, amount, url_token]
          const periodStr = inv.billing_period_month
            ? new Date(inv.billing_period_month).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
            : (inv.due_date ? new Date(inv.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '');
          const amountStr = inv.total_amount ?? '';
          const urlToken = String(inv.id || '');

          const varsArr = [String(profile.full_name || ''), String(periodStr || ''), String(inv.invoice_number || ''), String(amountStr), urlToken];

          const row = {
            channel: 'whatsapp',
            recipient: 'whatsapp:' + phone,
            template_key: 'yogique_payment_due_reminder',
            template_language: 'en',
            vars: varsArr,
            metadata: { invoice_id: inv.id, scheduled_by: 'schedule-payment-reminders' },
            status: 'pending',
            attempts: 0,
            run_after: nowIso,
            created_at: nowIso,
            updated_at: nowIso,
          };

          try {
            const res = await restPost('/rest/v1/notifications_queue', [row]).catch((e) => { throw e; });
            whatsappQueued = true;
            inserted.push({ invoice: inv.id, channel: 'whatsapp', result: res });
          } catch (e) {
            console.error('failed to enqueue WhatsApp for invoice', inv.id, e);
            skipped.push({ invoice: inv.id, channel: 'whatsapp', reason: 'enqueue_failed', error: String(e) });
          }
        } else {
          skipped.push({ invoice: inv.id, channel: 'whatsapp', reason: 'invalid_phone', phone });
        }
      }

      // Email reminder
      let emailQueued = false;
      if (hasValidEmail) {
        const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A';
        const invoiceAmount = inv.total_amount ? `₹${inv.total_amount}` : 'N/A';
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .invoice-details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Payment Due Reminder</h1>
    </div>
    <div class="content">
      <p>Namaste ${profile.full_name || 'Valued Customer'},</p>
      <p>This is a friendly reminder that your payment is due.</p>
      
      <div class="invoice-details">
        <div class="detail-row">
          <span class="label">Invoice Number:</span>
          <span class="value">${inv.invoice_number || inv.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount Due:</span>
          <span class="value">${invoiceAmount}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due Date:</span>
          <span class="value">${dueDate}</span>
        </div>
      </div>
      
      <p>Please complete your payment at your earliest convenience to continue enjoying our services.</p>
      <p>If you have already made the payment, please disregard this message.</p>
      <p>Thank you for choosing Yogique! 🙏</p>
    </div>
    <div class="footer">
      <p>Yogique - Yoga for Life</p>
      <p>This is an automated reminder. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

        const emailRow = {
          channel: 'email',
          recipient: userEmail,
          subject: `Payment Due - Invoice #${inv.invoice_number || inv.id}`,
          html: emailHtml,
          from: Deno.env.get('INVOICE_FROM_EMAIL') || Deno.env.get('CLASSES_FROM_EMAIL') || 'noreply@yogique.life',
          metadata: { invoice_id: inv.id, scheduled_by: 'schedule-payment-reminders' },
          status: 'pending',
          attempts: 0,
          run_after: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        };

        try {
          const res = await restPost('/rest/v1/notifications_queue', [emailRow]).catch((e) => { throw e; });
          emailQueued = true;
          inserted.push({ invoice: inv.id, channel: 'email', result: res });
        } catch (e) {
          console.error('failed to enqueue email for invoice', inv.id, e);
          skipped.push({ invoice: inv.id, channel: 'email', reason: 'enqueue_failed', error: String(e) });
        }
      }

      // If neither channel was queued, mark as skipped
      if (!whatsappQueued && !emailQueued) {
        skipped.push({ invoice: inv.id, reason: 'no_valid_channel', details: { whatsapp_opt_in: profile.whatsapp_opt_in, has_email: hasValidEmail } });
      }
    }

    return new Response(JSON.stringify({ ok: true, now: nowIso, inserted: inserted.length, skipped, details: { inserted, skipped } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('schedule-payment-reminders error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
