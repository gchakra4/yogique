/*
  Razorpay webhook handler (minimal scaffold)
  - Verifies HMAC signature using RAZORPAY_WEBHOOK_SECRET
  - Parses event JSON and routes to handlers
  - Uses SUPABASE_SERVICE_ROLE_KEY for DB updates

  Set these secrets for deployment:
  - RAZORPAY_WEBHOOK_SECRET
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_URL
*/
import { createClient } from 'npm:@supabase/supabase-js@2';

function bufToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bufToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function verifySignature(body: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = bufToHex(sig);
  const b64 = bufToBase64(sig);
  return signature === hex || signature === b64;
}

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';

    const ok = await verifySignature(bodyText, signature, secret);
    if (!ok) return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });

    const payload = JSON.parse(bodyText);
    const event = payload.event || payload.event_type || (payload.payload && payload.payload.event);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Minimal routing: extend these handlers with project-specific logic
    if (event === 'payment_link.paid' || event === 'payment_link.refunded') {
      // Example: find invoice by razorpay link id and mark paid/refunded
      const linkId = payload?.payload?.payment_link?.entity?.id || payload?.payload?.payment?.entity?.payment_link_id || null;
      if (linkId) {
        // Try update invoice by razorpay_link_id or metadata
        await supabaseAdmin.from('invoices').update({ invoice_status: event === 'payment_link.paid' ? 'paid' : 'refunded', updated_at: new Date().toISOString() }).eq('razorpay_link_id', linkId);
      }
    }

    if (event === 'payment.captured' || event === 'payment.failed') {
      // Example: map payment -> transaction updates
      const payment = payload?.payload?.payment?.entity || null;
      if (payment) {
        const rpid = payment.id;
        // Idempotent: update transaction status if it references this payment id
        await supabaseAdmin.from('transactions').update({ status: event === 'payment.captured' ? 'completed' : 'failed', updated_at: new Date().toISOString() }).eq('stripe_payment_intent_id', rpid).or(`stripe_payment_intent_id.eq.${rpid}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('webhook error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
