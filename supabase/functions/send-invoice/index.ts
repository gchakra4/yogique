/* eslint-disable */
/* @ts-nocheck */
/*
  Send Invoice Email Edge Function

  Purpose:
  - Sends transactional invoice emails from server-side using Resend.
  - Verifies the requester has an admin-like role.

  Setup required in your Supabase project (Environment Variables):
  - RESEND_API_KEY = <your_resend_api_key>
  - INVOICE_FROM_EMAIL = invoices@yourdomain.com
*/
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Auth header from client session
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Supabase clients
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        // Verify user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check roles
        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select(`roles(name)`)
            .eq('user_id', user.id);

        if (roleError) {
            console.error('Error checking user roles:', roleError);
            return new Response(JSON.stringify({ error: 'Error verifying permissions' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const allowedRoles = ['super_admin', 'super_user', 'energy_exchange_lead'];
        const hasAccess = userRoles?.some((ur: any) => allowedRoles.includes(ur.roles?.name));
        if (!hasAccess) {
            return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse payload
        const body = await req.json().catch(() => ({}));
        const { to, subject, html, from, attachments } = body || {};

        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set');
            return new Response(JSON.stringify({ error: 'Email service not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const resend = new Resend(RESEND_API_KEY);
        const fromEmail = from || Deno.env.get('INVOICE_FROM_EMAIL') || 'no-reply@example.com';

        const sendResult = await resend.emails.send({
            from: fromEmail,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            attachments: Array.isArray(attachments)
                ? attachments.map((a: any) => {
                    let content: any = a.content;
                    if (typeof content === 'string') {
                        // Handle data URLs and raw base64 strings
                        const base64 = content.includes('base64,') ? content.split('base64,')[1] : content;
                        const bin = atob(base64);
                        const bytes = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                        content = bytes;
                    }
                    // Support inline/CID attachments when caller provides `cid` property
                    const attachment: any = {
                        filename: a.filename,
                        content,
                        contentType: a.contentType || 'application/octet-stream'
                    };
                    // Resend expects `content_id` for CID and `disposition: 'inline'` for inline images
                    const cid = a.cid || a.contentId || a.content_id;
                    if (cid) {
                        attachment.content_id = cid;
                        attachment.disposition = 'inline';
                    }
                    return attachment;
                })
                : undefined
        });

        if ((sendResult as any)?.error) {
            console.error('Resend error:', (sendResult as any).error);
            return new Response(JSON.stringify({ error: 'Failed to send email' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
