import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (_req) => {
  // Twilio callbacks are no longer supported — return Gone
  return new Response('Twilio integration removed', { status: 410 });
});
