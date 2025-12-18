// Minimal Supabase Edge Function scaffold: create-invoice-or-link
// - Inserts an invoice via Supabase REST using the service role key (idempotent by unique index)
// - Does NOT call Razorpay yet; extend where noted

export default async function handler(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { booking_id, amount, currency = 'INR', billing_period_month, metadata } = body || {};
    if (!booking_id || !amount) return new Response(JSON.stringify({ error: 'booking_id and amount required' }), { status: 400 });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPABASE_PROJECT_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE') ?? Deno.env.get('SERVICE_ROLE');
    if (!SUPABASE_URL || !SERVICE_ROLE) return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE' }), { status: 500 });

    // Accept multiple possible secret names for Razorpay
    const RZ_KEY = Deno.env.get('RAZORPAY_KEY_ID') ?? Deno.env.get('RAZORPAY_key_id') ?? Deno.env.get('RAZORPAY_key');
    const RZ_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? Deno.env.get('RAZORPAY_key_secret') ?? Deno.env.get('RAZORPAY_key_secret');

    // Helper: query existing invoice by booking_id + billing_period_month
    const qs = new URLSearchParams();
    qs.append('booking_id', `eq.${booking_id}`);
    if (billing_period_month) qs.append('billing_period_month', `eq.${billing_period_month}`);
    // ask for full representation
    qs.append('select', '*');

    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices?${qs.toString()}`, {
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
    });
    const existing = (await checkRes.json().catch(() => [])) || [];

    let invoice: any = existing.length ? existing[0] : null;

    // If invoice exists and already has a razorpay_link_url, return exists
    if (invoice && invoice.razorpay_link_url) {
      return new Response(JSON.stringify({ status: 'exists', invoice }), { status: 200 });
    }

    // If invoice doesn't exist, create it first
    if (!invoice) {
      const payload = [{ booking_id, amount, currency, billing_period_month: billing_period_month || null, metadata: metadata || null }];
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return new Response(JSON.stringify({ error: data }), { status: res.status });
      invoice = data && data.length ? data[0] : null;
    }

    // Enqueue a payment_link job so a worker can call Razorpay asynchronously
    try {
      const jobPayload = {
        invoice_id: invoice.id,
        booking_id: booking_id,
        amount,
        currency,
        billing_period_month,
        recipient: (body && (body.recipient_email || body.recipient || body.email)) || null,
      };
      await fetch(`${SUPABASE_URL}/rest/v1/payment_link_jobs`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify([{ invoice_id: invoice.id, payload: jobPayload, status: 'pending' }]),
      }).catch(() => null);
    } catch (e) {
      console.log('enqueue job failed', String(e));
    }

    // Update invoice with link info
    const updateBody: any = {};
    if (rzData && rzData.id) updateBody.razorpay_link_id = rzData.id;
    if (rzData && rzData.short_url) updateBody.razorpay_link_url = rzData.short_url;
    if (rzData && rzData.long_url) updateBody.razorpay_link_url = rzData.long_url;

    if (Object.keys(updateBody).length) {
      await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoice.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updateBody),
      }).catch(() => null);
      // refresh invoice record
      const ref = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoice.id}&select=*`, {
        method: 'GET',
        headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
      });
      const refJson = await ref.json().catch(() => null);
      if (refJson && refJson.length) invoice = refJson[0];
    }

    // If caller provided a recipient (email or phone), call send-invoice-reminder to log the send
    const recipientEmail = (body && (body.recipient_email || body.recipient || body.email)) || null;
    if (recipientEmail) {
      try {
        const reminderPayload = {
          invoice_id: invoice.id,
          channel: 'email',
          recipient: recipientEmail,
        };
        // call our Edge Function to insert audit_logs (it uses service role internally)
        await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-reminder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify(reminderPayload),
        }).catch(() => null);
      } catch (e) {
        console.log('reminder call failed', String(e));
      }
    }

    return new Response(JSON.stringify({ status: 'created', invoice }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', error: String(err) }), { status: 500 });
  }
}
