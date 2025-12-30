import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { restPost } from '../shared/db.ts';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("CLASSES_FROM_EMAIL") || Deno.env.get("INVOICE_FROM_EMAIL")!;
const SCHED_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHED_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;
// Configurable retry/backoff for Resend
const EMAIL_MAX_ATTEMPTS = parseInt(Deno.env.get("NOTIFICATION_EMAIL_MAX_ATTEMPTS") || "5", 10);
const EMAIL_BASE_BACKOFF_MS = parseInt(Deno.env.get("NOTIFICATION_EMAIL_BASE_BACKOFF_MS") || "400", 10);

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    if (!RESEND_API_KEY || !FROM_EMAIL) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_env' }), { status: 500 });
    }

    // Optional scheduler secret header
    if (SCHED_HEADER && SCHED_TOKEN) {
      const incoming = req.headers.get(SCHED_HEADER);
      if (!incoming || incoming !== SCHED_TOKEN) return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { to, subject, html, bcc, from, dry_run } = payload;

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_to_subject_or_html' }), { status: 400 });
    }

    if (dry_run) {
      return new Response(JSON.stringify({ 
        ok: true, 
        dry_run: true, 
        result: { from: from || FROM_EMAIL, to, subject, html_length: html.length } 
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Prepare email payload
    const textFallback = (html || "").replace(/<[^>]*>/g, '').trim();
    const toList = Array.isArray(to) ? to : [to];
    const emailPayload: any = { 
      from: from || FROM_EMAIL, 
      to: toList, 
      subject, 
      html 
    };
    if (bcc && Array.isArray(bcc) && bcc.length) emailPayload.bcc = bcc;
    if (textFallback) emailPayload.text = textFallback;

    // Send via Resend API
    const maxAttempts = Number.isNaN(EMAIL_MAX_ATTEMPTS) ? 5 : Math.max(1, EMAIL_MAX_ATTEMPTS);
    let lastErr: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${RESEND_API_KEY}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(emailPayload)
        });

        const txt = await res.text().catch(() => null);
        
        if (res.ok) {
          // Extract Resend message ID
          let providerId: string | null = null;
          try {
            const parsed = txt ? JSON.parse(txt) : {};
            providerId = parsed?.id || null;
          } catch (e) { }

          // Best-effort: insert message_audit row for email sends
          try {
            const recipient = (Array.isArray(toList) ? toList.join(',') : String(toList));
            const auditRow = [
              {
                class_id: null,
                user_id: null,
                channel: 'email',
                recipient: recipient,
                provider: 'resend',
                provider_message_id: providerId,
                status: 'sent',
                attempts: attempt,
                metadata: { raw: txt }
              }
            ];
            await restPost('/rest/v1/message_audit', auditRow).catch(() => {});
          } catch (e) { /* ignore audit insert failures */ }

          return new Response(JSON.stringify({ 
            ok: true, 
            provider: 'resend',
            provider_message_id: providerId,
            status: res.status,
            rawResponse: txt 
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Rate limit handling
        if (res.status === 429) {
          let retryAfter = 1000;
          try {
            const ra = res.headers.get('retry-after');
            if (ra) retryAfter = Math.max(500, parseInt(ra, 10) * 1000 || 1000);
          } catch (e) { }
          console.error(`Resend rate-limited, retry-after=${retryAfter}ms`);
          await new Promise((r) => setTimeout(r, retryAfter));
          continue;
        }

        console.error(`Resend error (attempt ${attempt}):`, res.status, txt);
        lastErr = { ok: false, status: res.status, error: txt };
        
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, EMAIL_BASE_BACKOFF_MS * attempt));
      } catch (err) {
        console.error(`Resend fetch exception (attempt ${attempt}):`, String(err));
        lastErr = { ok: false, error: String(err) };
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, EMAIL_BASE_BACKOFF_MS * attempt));
      }
    }

    return new Response(JSON.stringify(lastErr || { ok: false, error: 'unknown' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    console.error('send-email error', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', details: String(err) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});
