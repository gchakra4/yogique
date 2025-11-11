/* eslint-disable */
/* @ts-nocheck */
/*
  Record Transaction Edge Function

  Purpose:
  - Inserts a row into public.transactions using service role.
  - Verifies the requester has an allowed role.

  Env Vars required:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_ANON_KEY
*/
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        // Explicit 200 OK for preflight
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        // Verify user and role
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select(`roles(name)`)
            .eq('user_id', user.id);

        if (roleError) {
            console.error('Error checking user roles:', roleError);
            return new Response(JSON.stringify({ error: 'Error verifying permissions' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const allowedRoles = ['super_admin', 'super_user', 'energy_exchange_lead'];
        const hasAccess = userRoles?.some((ur: any) => allowedRoles.includes(ur.roles?.name));
        if (!hasAccess) {
            return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Parse payload
        const body = await req.json().catch(() => ({}));
        const {
            user_id = null,
            user_email = null,
            user_full_name = null,
            subscription_id = null,
            amount,
            currency = 'USD',
            status = 'pending',
            payment_method = null,
            stripe_payment_intent_id = null,
            description = null,
            billing_plan_type = null,
            billing_period_month = null,
        } = body || {};

        // Normalize billing_period_month (frontend sends "YYYY-MM" from <input type='month'>)
        // Postgres `date` expects YYYY-MM-DD, so convert "YYYY-MM" -> "YYYY-MM-01".
        let billing_period_date: string | null = null;
        if (billing_period_month) {
            if (/^\d{4}-\d{2}$/.test(billing_period_month)) {
                billing_period_date = `${billing_period_month}-01`;
            } else {
                const parsed = new Date(billing_period_month);
                if (!isNaN(parsed.getTime())) {
                    billing_period_date = parsed.toISOString().slice(0, 10);
                }
            }
        }

        // If user_id not provided but an email is, try to resolve an existing auth user
        // Use service-role client to query auth.users
        let resolvedUserId = user_id;
        try {
            if (!resolvedUserId && user_email) {
                const { data: foundUsers, error: findError } = await supabaseAdmin
                    .from('auth.users')
                    .select('id, email, raw_user_meta_data')
                    .eq('email', user_email)
                    .limit(1);
                if (!findError && foundUsers && foundUsers.length > 0) {
                    resolvedUserId = foundUsers[0].id;
                }
            }
        } catch (e) {
            console.error('Error resolving user by email:', e);
            // proceed without resolvedUserId; we'll still insert snapshot fields
        }

        if (typeof amount !== 'number') {
            return new Response(JSON.stringify({ error: 'Invalid amount' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Insert into transactions via service role (bypasses RLS)
        const insertPayload = {
            user_id: resolvedUserId,
            subscription_id,
            amount,
            currency,
            status,
            payment_method,
            stripe_payment_intent_id,
            description,
            billing_plan_type: billing_plan_type ?? null,
            // Use normalized date (YYYY-MM-DD) or null
            billing_period_month: billing_period_date ?? null,
            user_email: user_email ?? null,
            user_full_name: user_full_name ?? null,
        };

        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert(insertPayload)
            .select('*')
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return new Response(JSON.stringify({ error: 'Insert failed' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(inserted), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Unexpected error:', e);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
