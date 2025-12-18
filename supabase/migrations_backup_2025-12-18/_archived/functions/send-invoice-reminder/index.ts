/*
  Send Invoice Reminder - Edge Function (scaffold)

  Usage: POST { invoice_id: uuid, channel: 'whatsapp'|'email'|'sms', recipient: text }
  - Inserts an audit_logs row with audit_type='invoice_reminder'
  - Returns the audit_logs row
*/
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { invoice_id, channel, recipient } = body || {};
    if (!invoice_id || !channel || !recipient) return new Response(JSON.stringify({ error: 'missing params' }), { status: 400 });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!SUPABASE_URL || !SERVICE_ROLE) return new Response(JSON.stringify({ error: 'missing env' }), { status: 500 });

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const audit = {
      audit_type: 'invoice_reminder',
      invoice_id: invoice_id,
      channel: channel,
      recipient: recipient,
      attempt: 1,
      provider_response: null,
      reminder_status: 'sent',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from('audit_logs').insert([audit]).select('*').limit(1);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    return new Response(JSON.stringify({ audit: data[0] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
