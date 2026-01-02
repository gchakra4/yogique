import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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
