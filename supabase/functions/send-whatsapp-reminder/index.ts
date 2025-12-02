import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM")!; // e.g. "whatsapp:+14155238886"
const SCHED_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHED_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;

// Diagnostic env presence log (no secrets printed)
try {
  console.log('Env presence:',
    'SUPABASE_URL=' + (!!SUPABASE_URL),
    'SUPABASE_KEY=' + (!!SUPABASE_KEY),
    'TWILIO_SID=' + (!!TWILIO_SID),
    'TWILIO_TOKEN=' + (!!TWILIO_TOKEN),
    'TWILIO_FROM=' + (!!TWILIO_FROM),
    'SCHED_HEADER=' + (!!SCHED_HEADER),
    'SCHED_TOKEN=' + (!!SCHED_TOKEN)
  );
} catch (e) { /* ignore logging errors */ }

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase env vars");
}
if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
  console.error("Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)");
}

const supabaseFetch = async (urlPath: string) => {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${urlPath}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase REST fetch failed: ${res.status}`);
  return res.json();
};

function looksLikeE164(phone: string) {
  // Basic E.164 check: leading + and 6-15 digits (loose but practical)
  return /^\+\d{6,15}$/.test(phone);
}


async function sendWhatsApp(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const params = new URLSearchParams();
  // Twilio expects the To value to be "whatsapp:+{E.164 number}"
  // `to` should already include the WhatsApp prefix (e.g. "whatsapp:+123...")
  params.append("To", to);
  params.append("From", TWILIO_FROM);
  params.append("Body", body);

  const auth = globalThis.btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const text = await resp.text().catch(() => "");
  return { ok: resp.ok, status: resp.status, body: text };
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    // Quickly validate required environment variables and return a structured
    // 400 response listing any missing keys (do not leak secret values).
    const missing: string[] = []
    if (!SUPABASE_URL) missing.push('SUPABASE_URL')
    if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!TWILIO_SID) missing.push('TWILIO_ACCOUNT_SID')
    if (!TWILIO_TOKEN) missing.push('TWILIO_AUTH_TOKEN')
    if (!TWILIO_FROM) missing.push('TWILIO_WHATSAPP_FROM')

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

    // Preflight validation for Twilio WhatsApp sender
    if (!TWILIO_FROM || !TWILIO_FROM.startsWith("whatsapp:")) {
      console.error('TWILIO_WHATSAPP_FROM invalid or not a WhatsApp sender');
      return new Response(JSON.stringify({ ok: false, error: 'TWILIO_WHATSAPP_FROM must be a WhatsApp-enabled sender string (e.g. "whatsapp:+1415...")' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
        // Pass the fully-prefixed WhatsApp recipient to the helper
        const r = await sendWhatsApp(`whatsapp:${phone}`, message);
        // Map common Twilio WhatsApp error 21910 to user-friendly message
        if (!r.ok && r.status === 400) {
          try {
            const parsed = JSON.parse(r.body || '{}');
            if (parsed && parsed.code === 21910) {
              results.push({ phone, ok: false, status: r.status, body: r.body, error: 'twilio_21910_invalid_from_to_pair' });
              continue;
            }
          } catch (e) {
            // fallback to raw body
          }
        }

        results.push({ phone, ok: r.ok, status: r.status, body: r.body });
        // Insert audit row for this WhatsApp send (best-effort)
        try {
          let sid: string | null = null;
          try { const parsed = JSON.parse(r.body || '{}'); sid = parsed?.sid || parsed?.message?.sid || parsed?.sid || null; } catch (e) { sid = null; }
          const auditBody = [
            {
              class_id: classId,
              user_id: p.user_id || p.id || null,
              channel: 'whatsapp',
              recipient: phone,
              provider: 'twilio',
              provider_message_id: sid,
              status: (r && r.ok) ? 'sent' : 'failed',
              attempts: 1,
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
