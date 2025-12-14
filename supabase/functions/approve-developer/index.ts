// Supabase Edge Function: approve-developer
// Secure, simple 1-click admin approval to add a user to devtools_developers.
// Verifies admin via Supabase JWT, restricts CORS, writes audit logs.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Configure allowed origin (DevTools domain)
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "";

// Service role key (never expose in browser)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type ApproveBody = {
  user_id: string;
};

function corsHeaders(origin: string) {
  const allow = origin === ALLOWED_ORIGIN ? origin : "";
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  } as Record<string, string>;
}

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    });
  }

  try {
    if (!ALLOWED_ORIGIN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Verify admin via Supabase JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const jwt = authHeader.split(" ")[1];

    // Create an admin client using the service role key. Do NOT attach the user's
    // JWT as a global Authorization header — that would make subsequent DB writes
    // run under the user's identity and trigger RLS. Use the admin client to
    // validate the token and perform privileged writes.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the user and claims from JWT using admin client
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const adminId = userData.user.id;
    const isAdmin = Boolean(userData.user.app_metadata?.role === "admin" || userData.user.user_metadata?.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const body = (await req.json()) as ApproveBody;
    if (!body?.user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Insert membership (idempotent upsert)
    const { error: upsertError } = await supabase
      .from("devtools_developers")
      .upsert({ user_id: body.user_id, approved_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: "Upsert failed", details: upsertError.message }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Update request status if exists
    await supabase
      .from("devtools_requests")
      .update({ status: "approved" })
      .eq("user_id", body.user_id)
      .eq("status", "pending");

    // Audit log
    await supabase.from("approvals_log").insert({
      admin_id: adminId,
      user_id: body.user_id,
      action: "approved",
      created_at: new Date().toISOString(),
      metadata: { origin },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unhandled error", details: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders(req.headers.get("origin") ?? "") },
    });
  }
});
