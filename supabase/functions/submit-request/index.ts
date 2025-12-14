// Supabase Edge Function: submit-request
// Accepts an authenticated user's request to join DevTools and writes to `devtools_requests`
// using the service role key so it bypasses client-side RLS.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function corsHeaders(origin: string) {
  const allow = origin === ALLOWED_ORIGIN ? origin : "";
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  } as Record<string, string>;
}

type SubmitBody = {
  user_id?: string;
  message?: string;
};

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
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

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const jwt = authHeader.split(" ")[1];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // Resolve the user from the JWT
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const body = (await req.json()) as SubmitBody;
    const userId = body.user_id || userData.user.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Idempotent insert: if row exists, do nothing (onConflict user_id, do nothing)
    const { error: insertError } = await supabase
      .from("devtools_requests")
      .upsert({ user_id: userId, status: "pending", requested_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Insert failed", details: insertError.message }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Optional: write an audit entry
    await supabase.from("approvals_log").insert({
      admin_id: null,
      user_id: userId,
      action: "requested",
      created_at: new Date().toISOString(),
      metadata: { origin, message: body.message || null },
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
