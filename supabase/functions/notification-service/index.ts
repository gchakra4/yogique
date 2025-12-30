import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { callFunction } from '../shared/db.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      // Email-specific fields
      subject = null,
      html = null,
      bcc = null,
      from = null,
    } = body || {};

    // Route based on channel
    if (channel === 'email') {
      // Email notifications go through send-email
      if (!to || !subject || !html) {
        return new Response(JSON.stringify({ error: 'Email requires: to, subject, html' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const emailPayload: any = { to, subject, html, bcc, from, dry_run: !!dry_run };
      const result = await callFunction('send-email', emailPayload);
      return new Response(JSON.stringify({ ok: result.ok, status: result.status, result: result.body }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // WhatsApp/SMS notifications go through send-template with templateKey
    if (!templateKey) {
      return new Response(JSON.stringify({ error: 'templateKey is required for WhatsApp/SMS SUPABASE_SERVICE_ROLE_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // All notifications go through send-template with templateKey
    if (!templateKey) {
      return new Response(JSON.stringify({ error: 'templateKey is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload: any = { to, templateKey, vars: Array.isArray(vars) ? vars : vars || null, language: templateLanguage, metadata: metadata || null, dry_run: !!dry_run };
    const result = await callFunction('send-template', payload);
    return new Response(JSON.stringify({ ok: result.ok, status: result.status, result: result.body }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('notification-service error', err);
    return new Response(JSON.stringify({ error: 'internal', details: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
