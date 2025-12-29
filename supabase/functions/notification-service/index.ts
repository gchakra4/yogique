import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { callFunction } from '../shared/db.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = await req.json().catch(() => ({}));
    const {
      to = null,
      channel = 'whatsapp',
      templateKey = null,
      templateLanguage = 'en',
      vars = null,
      classId = null,
      activity = null,
      metadata = null,
      dry_run = false,
    } = body || {};

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If caller provided a classId (bulk reminder), proxy to send-whatsapp-reminder
    if (classId && channel === 'whatsapp' && !templateKey) {
      const result = await callFunction('send-whatsapp-reminder', { classId, templateKey, activity, data: vars, templateLanguage, metadata });
      return new Response(JSON.stringify({ ok: result.ok, status: result.status, result: result.body }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // For template-based single sends, forward to send-template Edge Function
    if (!templateKey) {
      return new Response(JSON.stringify({ error: 'templateKey is required for single sends' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload: any = { to, templateKey, vars: Array.isArray(vars) ? vars : vars || null, language: templateLanguage, metadata: metadata || null, dry_run: !!dry_run };
    const result = await callFunction('send-template', payload);
    return new Response(JSON.stringify({ ok: result.ok, status: result.status, result: result.body }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('notification-service error', err);
    return new Response(JSON.stringify({ error: 'internal', details: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
