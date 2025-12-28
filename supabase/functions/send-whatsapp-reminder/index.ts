import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { getProvider } from "../providers/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SCHED_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHED_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;

// Diagnostic env presence log (no secrets printed)
try {
  console.log('Env presence:',
    'SUPABASE_URL=' + (!!SUPABASE_URL),
    'SUPABASE_KEY=' + (!!SUPABASE_KEY),
    'SCHED_HEADER=' + (!!SCHED_HEADER),
    'SCHED_TOKEN=' + (!!SCHED_TOKEN)
  );
} catch (e) { /* ignore logging errors */ }

// Log which provider will be used by default (env-driven)
try {
  console.log('WhatsApp Provider:', (Deno.env.get('MESSAGE_PROVIDER') || 'meta'));
} catch (e) {}

// Sends are performed by the provider adapter selected in `getProvider()`

function looksLikeE164(phone: string) {
  // Basic E.164 check: leading + and 6-15 digits
  return /^\+\d{6,15}$/.test(phone);
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Wrapper that retries transient failures (5xx and 429) with exponential backoff.
async function sendWithRetries(provider: any, message: any, maxAttempts = 3) {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await provider.sendMessage(message);
      const ok = Boolean(res?.ok);
      const status = res?.status ?? (ok ? 200 : 500);
      // Light-weight logging: provider, recipient, attempt, and status only
      try { console.log(`send attempt=${attempt} provider=${res?.provider||'unknown'} to=${message?.to} ok=${ok} status=${status}`); } catch (_) {}

      if (ok) {
        res.attempts = attempt;
        return res;
      }

      // Retry on server errors and rate limits
      if (status >= 500 || status === 429) {
        lastErr = res;
        const backoff = Math.min(2000, 500 * Math.pow(2, attempt - 1));
        await delay(backoff);
        continue;
      }

      // Non-retryable (4xx other than 429) — return immediately
      res.attempts = attempt;
      return res;
    } catch (err) {
      lastErr = err;
      try { console.warn(`send attempt=${attempt} provider=${provider?.name||'provider'} to=${message?.to} error=${String(err)}`); } catch (_) {}
      const backoff = Math.min(2000, 500 * Math.pow(2, attempt - 1));
      await delay(backoff);
    }
  }

  return { ok: false, status: 500, rawResponse: String(lastErr ?? 'unknown'), provider_message_id: null, provider: (provider && provider.name) ? provider.name : 'unknown', attempts: maxAttempts };
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    // Quickly validate required environment variables and return a structured
    // 400 response listing any missing keys (do not leak secret values).
    const missing: string[] = []
    if (!SUPABASE_URL) missing.push('SUPABASE_URL')
    if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    // Meta provider required envs will be checked by provider; warn if missing

    if (missing.length > 0) {
      console.error('Missing required env vars:', missing.join(', '))
      return new Response(JSON.stringify({ ok: false, missing }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Optional scheduler secret verification
    if (SCHED_HEADER && SCHED_TOKEN) {
      const incoming = req.headers.get(SCHED_HEADER);
      if (!incoming || incoming !== SCHED_TOKEN) {
        console.warn("Unauthorized scheduler request");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const payload = await req.json().catch(() => ({}));
    const classId = payload?.classId;
    if (!classId) return new Response("missing classId", { status: 400 });

    // No Twilio-specific preflight; provider adapter will validate/runtime fail if misconfigured

    // Fetch class details via Supabase REST (include notification flags)
    let cls: any = null;
    try {
      const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/class_assignments?select=id,assignment_code,date,start_time,timezone,zoom_meeting,whatsapp_notified,email_notified&id=eq.${encodeURIComponent(classId)}`;
      const resp = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!resp.ok) {
        console.error("class fetch failed", resp.status);
        return new Response(JSON.stringify({ error: "class fetch failed", status: resp.status }), { status: 502 });
      }
      const arr = await resp.json();
      cls = Array.isArray(arr) && arr.length ? arr[0] : null;
    } catch (errCls) {
      console.error("class fetch error", errCls);
      return new Response(JSON.stringify({ error: "class not found", details: String(errCls) }), { status: 500 });
    }

    if (!cls) {
      return new Response(JSON.stringify({ error: "class not found" }), { status: 404 });
    }

    // If WhatsApp notification already sent for this class, skip sending
    if (cls.whatsapp_notified) {
      console.log(`Skipping class ${classId}: whatsapp_notified=true`);
      return new Response(JSON.stringify({ ok: true, classId, sent: [], skipped: 'whatsapp_already_sent' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch attendees similar to create-zoom-and-email: assignment_bookings -> bookings -> profiles
    let participants: any[] = [];
    try {
      // 1) booking_ids for this assignment
      const abUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/assignment_bookings?select=booking_id&assignment_id=eq.${classId}`;
      const abResp = await fetch(abUrl, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (!abResp.ok) {
        console.error('assignment_bookings fetch failed', abResp.status);
      } else {
        const abRows = await abResp.json();
        const bookingIds: string[] = Array.isArray(abRows)
          ? abRows.map((b: any) => b.booking_id).filter(Boolean)
          : [];

        if (bookingIds.length) {
          // 2) bookings -> user_id
          const bq = bookingIds.map((id) => `"${id}"`).join(',');
          const bUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/bookings?select=booking_id,user_id&booking_id=in.(${bq})`;
          const bResp = await fetch(bUrl, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          });
          if (!bResp.ok) {
            console.error('bookings fetch failed', bResp.status);
          } else {
            const bRows = await bResp.json();
            const userIds: string[] = Array.isArray(bRows)
              ? bRows.map((r: any) => r.user_id).filter(Boolean)
              : [];

            if (userIds.length) {
              const uq = userIds.map((id) => `"${id}"`).join(',');
              // 3) profiles -> phone, whatsapp_opt_in
              const pUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/profiles?select=id,user_id,email,full_name,phone,whatsapp_opt_in&user_id=in.(${uq})`;
              const pResp = await fetch(pUrl, {
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
              });
              if (!pResp.ok) {
                console.error('profiles fetch failed', pResp.status);
              } else {
                const pRows = await pResp.json();
                participants = Array.isArray(pRows) ? pRows : [];
              }
            }
          }
        }
      }
    } catch (errParts) {
      console.error('participants fetch error', errParts);
    }

    const zoomLink = cls.zoom_meeting?.join_url || "";
    const classTime = `${cls.date} ${cls.start_time} (${cls.timezone || "UTC"})`;
    const title = cls.assignment_code || cls.id;
    const message = `Reminder: your class "${title}" starts at ${classTime}. Join: ${zoomLink}`;

    const results: any[] = [];
    for (const p of participants) {
      // Enforce explicit WhatsApp consent
      if (!p.whatsapp_opt_in) {
        results.push({ user_id: p.user_id || p.id || null, skipped: 'whatsapp_opt_in=false' });
        continue;
      }
      const rawPhone = (p.phone || "").trim();
      if (!rawPhone) {
        results.push({ user_id: p.user_id || p.id || null, phone: null, error: "missing phone" });
        continue;
      }
      // Ensure E.164 formatting (caller should supply E.164; we do minimal cleanup)
      const phone = rawPhone.replace(/[\s()-]/g, "");
      if (!looksLikeE164(phone)) {
        results.push({ user_id: p.user_id || p.id || null, phone, error: 'invalid_phone_format; expected E.164 like +123456789' });
        continue;
      }
      try {
        // Use provider adapter for sends
        const provider = getProvider();
        const sendResult = await sendWithRetries(provider, {
          to: `whatsapp:${phone}`,
          type: 'text',
          textBody: message,
        }, Number(Deno.env.get('WHATSAPP_SEND_MAX_ATTEMPTS') || '3'));

        // Map adapter response to legacy shape expected by downstream code
        const r: any = {
          ok: Boolean(sendResult.ok),
          status: sendResult.status ?? (sendResult.ok ? 200 : 400),
          body: null,
        };
        try {
          r.body = (typeof sendResult.rawResponse === 'string') ? sendResult.rawResponse : JSON.stringify(sendResult.rawResponse || {});
        } catch (e) {
          r.body = String(sendResult.rawResponse ?? '');
        }
        // Map some common provider error codes to user-friendly message
        if (!r.ok && r.status === 400) {
          try {
            const parsed = JSON.parse(r.body || '{}');
            if (parsed && parsed.code === 21910) {
              results.push({ phone, ok: false, status: r.status, body: r.body, error: 'invalid_from_to_pair' });
              continue;
            }
          } catch (e) {
            // fallback to raw body
          }
        }

        results.push({ phone, ok: r.ok, status: r.status, body: r.body, attempts: sendResult.attempts ?? 1 });
        // Insert audit row for this WhatsApp send (best-effort)
          try {
          let sid: string | null = null;
          // Prefer provider-specific message id returned by the adapter
          try { sid = sendResult.provider_message_id ?? null; } catch (e) { sid = null; }
          if (!sid) {
            try { const parsed = JSON.parse(r.body || '{}'); sid = parsed?.sid || parsed?.message?.sid || parsed?.messages?.[0]?.id || null; } catch (e) { sid = null; }
          }
          const auditBody = [
            {
              class_id: classId,
              user_id: p.user_id || p.id || null,
              channel: 'whatsapp',
              recipient: phone,
              provider: (sendResult && sendResult.provider) ? sendResult.provider : 'meta',
              provider_message_id: sid,
              status: (r && r.ok) ? 'sent' : 'failed',
              attempts: sendResult.attempts ?? 1,
              metadata: { status: r?.status, body: r?.body },
            },
          ];
          await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/message_audit`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(auditBody),
          });

          // Dual-write: also create a canonical audit_logs entry (best-effort)
          try {
            const auditPayload = {
              event_type: (r && r.ok) ? 'notification_sent' : 'notification_failed',
              entity_type: 'class',
              entity_id: String(classId),
              action: 'send_notification',
              actor_id: p.user_id || p.id || null,
              actor_role: null,
              metadata: {
                channel: 'whatsapp',
                recipient: phone,
                provider: (sendResult && sendResult.provider) ? sendResult.provider : 'meta',
                provider_message_id: sid,
                status: (r && r.ok) ? 'sent' : 'failed',
                attempts: sendResult.attempts ?? 1,
                response_status: r?.status,
                response_body: r?.body,
                original_message_metadata: auditBody[0].metadata || null,
              },
              created_at: new Date().toISOString(),
            };
            await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/audit_logs?on_conflict=constraint:uniq_audit_logs_provider_message_id`, {
              method: 'POST',
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates'
              },
              body: JSON.stringify([auditPayload]),
            });
          } catch (e) {
            try { console.error('Failed to insert audit_logs row (whatsapp)', e); } catch (_) {}
          }
        } catch (e) {
          try { console.error('Failed to insert whatsapp audit row', e); } catch (_) {}
        }
      } catch (err) {
        console.error("send error", phone, err);
        results.push({ phone, error: String(err) });
      }
    }

    // If at least one WhatsApp send succeeded, mark the class as whatsapp_notified
    const anyOk = results.some((r) => r && r.ok === true);
    if (anyOk) {
      try {
        const patchUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/class_assignments?id=eq.${encodeURIComponent(classId)}`;
        const patchResp = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ whatsapp_notified: true }),
        });
        if (!patchResp.ok) {
          console.error('Failed to patch class_assignments whatsapp_notified', patchResp.status);
        } else {
          console.log('Marked class_assignments.whatsapp_notified = true for', classId);
        }
      } catch (e) {
        console.error('Error patching whatsapp_notified flag', e);
      }
    }

    // Note: email_notified is handled by the email-sending function (create-zoom-and-email)

    return new Response(JSON.stringify({ ok: true, classId, sent: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("unexpected error", err);
    return new Response(JSON.stringify({ error: "internal", details: String(err) }), { status: 500 });
  }
});
