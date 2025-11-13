/* eslint-disable */
/* @ts-nocheck */
/*
  send-guide edge function
  - Upserts into newsletter_subscribers (adds timezone)
  - Simple per-email rate-limiting: rejects if same email subscribed within last 60 minutes
  - Creates a signed URL for the guide in storage and emails it (Resend)
  Env vars required in Supabase:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - RESEND_API_KEY
  - SEND_GUIDE_FROM_EMAIL (optional)
  - GUIDE_BUCKET (default: lead-magnets)
  - GUIDE_PATH   (default: 7-day-wellness-guide.pdf)
  - FRONTEND_URL (optional; used for unsubscribe links)
*/

import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const { email, timezone, source } = body || {};

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limit window (seconds)
    const RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1 hour

    const { data: lastRows, error: lastErr } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('subscribed_at')
      .eq('email', email)
      .order('subscribed_at', { ascending: false })
      .limit(1);

    if (lastErr) {
      console.error('DB lookup error', lastErr);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (Array.isArray(lastRows) && lastRows.length > 0 && lastRows[0].subscribed_at) {
      const last = new Date(lastRows[0].subscribed_at).getTime();
      const now = Date.now();
      if ((now - last) / 1000 < RATE_LIMIT_WINDOW_SECONDS) {
        return new Response(JSON.stringify({ error: 'Too many requests for this email; try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Build an upsert payload with only safe/expected columns.
    // Avoid unknown columns like `tags` or arbitrary `source` which may not exist in all schemas.
    const subscribePayload: any = {
      email,
      status: 'active',
      subscribed_at: new Date().toISOString()
    };
    if (timezone) subscribePayload.timezone = timezone;

    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert(subscribePayload, { onConflict: 'email', returning: 'representation' });

    if (upsertError) {
      console.error('Upsert error', upsertError);
      // Return DB error details to help debugging (safe in dev; consider removing in production)
      return new Response(JSON.stringify({ error: 'Failed to record subscription', details: upsertError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GUIDE_BUCKET = Deno.env.get('GUIDE_BUCKET') ?? 'lead-magnets';
    const GUIDE_PATH = Deno.env.get('GUIDE_PATH') ?? '7-day-wellness-guide.pdf';
    const EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

    const { data: signed, error: signedErr } = await supabaseAdmin
      .storage
      .from(GUIDE_BUCKET)
      .createSignedUrl(GUIDE_PATH, EXPIRY_SECONDS);

    if (signedErr || !signed?.signedUrl) {
      console.error('Signed URL error', signedErr);
      return new Response(JSON.stringify({ error: 'Failed to create download link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const signedUrl = signed.signedUrl;

    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? '';
    const unsubscribeUrl = FRONTEND_URL ? `${FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}` : '#';

    const renderMinimalTemplate = (title: string, content: string, ctaText: string, ctaUrl: string) => {
      return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
    <style>body{font-family: Arial, Helvetica, sans-serif;}</style>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f4">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:30px 10px;">
        <table width="600" style="max-width:600px;background:white;padding:24px;border-radius:8px;">
          <tr><td>
            <h1 style="color:#333;margin:0 0 16px 0;">${title}</h1>
            <div style="color:#555;font-size:16px;line-height:1.5;margin-bottom:24px;">${content}</div>
            <div style="text-align:left">
              <a href="${ctaUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600;">${ctaText}</a>
            </div>
            <p style="color:#888;font-size:13px;margin-top:20px;">If you want to unsubscribe, <a href="${unsubscribeUrl}">click here</a>.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
    };

    const subject = 'Your 7‑Day Wellness Guide — Download Link';
    const title = 'Your 7‑Day Wellness Guide';
    const content = 'Thanks for signing up — click the button below to download your guide. The link will expire in 24 hours.';
    const ctaText = 'Download the guide';
    const html = renderMinimalTemplate(title, content, ctaText, signedUrl);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
    const FROM_EMAIL = Deno.env.get('SEND_GUIDE_FROM_EMAIL') ?? Deno.env.get('INVOICE_FROM_EMAIL') ?? 'no-reply@example.com';
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'Subscription recorded but email service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const sendResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html
    });

    if ((sendResult as any)?.error) {
      console.error('Resend send error', (sendResult as any).error);
      return new Response(JSON.stringify({ ok: true, email_sent: false, error: 'Failed to send email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, email_sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unhandled error in send-guide', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
