import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Minimal booking confirmation HTML template and simple renderer so this function
// can accept metadata-only requests for booking confirmations.
const BOOKING_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking Confirmation</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;background:#0f1012;margin:0;padding:0}.container{max-width:600px;margin:40px auto;background:#181818;border-radius:12px;overflow:hidden} .header{background:linear-gradient(135deg,#222,#000);color:#fff;text-align:center;padding:30px 20px}.content{padding:25px 30px;color:#f5f5f5}.booking-box{background:#242018;border-left:5px solid #d9a441;padding:15px 20px;margin:20px 0;border-radius:8px}.button{display:inline-block;margin-top:25px;padding:14px 24px;background:#d9a441;color:#fff;text-decoration:none;border-radius:8px;font-weight:700}.footer{text-align:center;padding:20px;font-size:14px;color:#aaa}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="{{logo_src}}" alt="Yogique Logo" style="width:80px;margin-bottom:10px;" />
        <h1>Yogique – Booking Confirmed</h1>
      </div>
      <div class="content">
        <p>Hi {{user_name}},</p>
        <p>Thank you for booking with us! Below are your booking details.</p>
        <div class="booking-box">
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p><strong>Preferred Start Date:</strong> {{preferred_start_date}}</p>
          <p><strong>Preferred Time:</strong> {{class_time}}</p>
          <p><strong>Class/Package Details:</strong> {{class_package_details}}</p>
          <p><strong>Timezone:</strong> {{timezone}}</p>
          <p><strong>Notes / Requests:</strong> {{booking_notes}}</p>
        </div>
        <a href="{{action_url}}" class="button">View Your Booking</a>
        <p style="margin-top:8px;font-size:13px;color:#ddd">If you've changed your mind, you can <a href="{{cancel_url}}" style="color:#ffd470">cancel your booking</a>.</p>
      </div>
      <div class="footer">© {{year}} Sampurnayogam LLP. All rights reserved.</div>
    </div>
  </body>
</html>`

function renderTemplate(tpl: string, vars: Record<string, any>) {
  return tpl.replace(/{{\s*([^}]+)\s*}}/g, (_m, key) => {
    const val = vars[key] ?? ''
    return String(val)
  })
}

function getRuntimeKey(req: Request): string {
  const apikey = req.headers.get("apikey") || "";
  if (apikey) return apikey;

  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (bearer) return bearer;

  return SUPABASE_KEY;
}

async function invokeSupabaseFunction(fnName: string, payload: any, key: string) {
  const url = `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/${fnName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: key ? `Bearer ${key}` : "",
      apikey: key || "",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep as text
  }
  return { ok: res.ok, status: res.status, body };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ ok: false, error: "missing_SUPABASE_URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const runtimeKey = getRuntimeKey(req);
    const body = await req.json().catch(() => ({}));
    const {
      to = null,
      channel = "whatsapp",
      templateKey = null,
      templateLanguage = "en",
      vars = null,
      metadata = null,
      dry_run = false,
      // Email-specific
      subject = null,
      html = null,
      bcc = null,
      from = null,
    } = body || {};

    if (channel === "email") {
      // If html is missing but this is a booking confirmation with metadata,
      // attempt to render a booking template server-side so callers can send
      // metadata-only payloads.
      if (!html && metadata && metadata.notification_type === 'class_confirmation') {
        try {
          const renderVars: Record<string, any> = Object.assign({}, metadata || {})
          renderVars.logo_src = renderVars.logo_src || `${SUPABASE_URL.replace(/\/+$/, "")}/images/Brand.png`
          renderVars.base_url = renderVars.base_url || SUPABASE_URL.replace(/\/+$/, "")
          renderVars.year = renderVars.year || new Date().getFullYear()
          renderVars.support_contact = renderVars.support_contact || 'support@yogique.life'
          renderVars.action_url = renderVars.action_url || ''
          renderVars.cancel_url = renderVars.cancel_url || ''
          renderVars.user_name = renderVars.user_name || renderVars.user || ''
          renderVars.booking_id = renderVars.booking_id || body.bookingId || body.booking_id || ''
          renderVars.preferred_start_date = renderVars.preferred_start_date || body.preferred_start_date || ''
          renderVars.class_package_details = renderVars.class_package_details || ''
          renderVars.class_time = renderVars.class_time || ''
          renderVars.booking_notes = renderVars.booking_notes || ''

          html = renderTemplate(BOOKING_EMAIL_TEMPLATE, renderVars)
        } catch (e) {
          console.warn('failed to render booking template in notification-service', e)
        }
      }

      if (!to || !subject || !html) {
        return new Response(JSON.stringify({ ok: false, error: "Email requires: to, subject, html" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const emailPayload = { to, subject, html, bcc, from, dry_run: !!dry_run };
      const result = await invokeSupabaseFunction("send-email", emailPayload, runtimeKey);
      return new Response(JSON.stringify({ ok: result.ok, status: result.status, result: result.body }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!templateKey) {
      return new Response(JSON.stringify({ ok: false, error: "templateKey is required for WhatsApp/SMS" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templatePayload = {
      to,
      templateKey,
      vars: vars ?? null,
      language: templateLanguage,
      metadata: metadata || null,
      dry_run: !!dry_run,
    };
    const result = await invokeSupabaseFunction("send-template", templatePayload, runtimeKey);
    return new Response(JSON.stringify({ ok: result.ok, status: result.status, result: result.body }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notification-service error", err);
    return new Response(JSON.stringify({ ok: false, error: "internal", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
