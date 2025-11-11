/* eslint-disable */
/* @ts-nocheck */
/*
  Create User Edge Function

  Purpose:
  - Admin-only endpoint to create a new auth user and corresponding profiles row.
  - Uses service-role key to create auth user and insert profile.
  - Caller must present a valid Authorization header (Bearer JWT) and be in an allowed admin role.

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

        // Verify caller and role (same allowedRoles as other admin endpoints)
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

        const body = await req.json().catch(() => ({}));
        const email = (body.email || '').trim().toLowerCase();
        const full_name = body.full_name || null;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(JSON.stringify({ error: 'Invalid email' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        try {
            // Check if user already exists in auth.users
            const { data: existing, error: existingErr } = await supabaseAdmin
                .from('auth.users')
                .select('id,email,raw_user_meta_data')
                .eq('email', email)
                .limit(1);

            if (!existingErr && existing && existing.length > 0) {
                const found = existing[0];
                // Ensure profile exists (best-effort)
                try {
                    const { data: prof, error: profErr } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .eq('id', found.id)
                        .limit(1);
                    if (!profErr && (!prof || prof.length === 0)) {
                        // create profile
                        await supabaseAdmin.from('profiles').insert({
                            id: found.id,
                            email: found.email,
                            full_name: full_name || (found.raw_user_meta_data && (found.raw_user_meta_data.full_name || found.raw_user_meta_data?.fullName)) || null
                        });
                    }
                } catch (e) {
                    console.warn('profile ensure failed', e);
                }
                return new Response(JSON.stringify({
                    id: found.id,
                    email: found.email,
                    full_name: (found.raw_user_meta_data && (found.raw_user_meta_data.full_name || found.raw_user_meta_data?.fullName)) || full_name || null
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Create user via admin API. Provide a random temporary password and mark email_confirmed if supported.
            const tempPassword = Math.random().toString(36).slice(2, 12) + 'A1!'; // simple random password
            // Use admin.createUser. Supabase JS exposes admin methods under auth.admin
            const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: full_name ? { full_name } : undefined
            } as any);

            if (createErr || !createdUser) {
                console.error('create-user error', createErr);
                return new Response(JSON.stringify({ error: 'Failed to create user' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Insert profile row
            try {
                await supabaseAdmin.from('profiles').insert({
                    id: createdUser.id,
                    email: createdUser.email,
                    full_name: full_name || (createdUser.user_metadata && (createdUser.user_metadata.full_name || createdUser.user_metadata?.fullName)) || null
                });
            } catch (e) {
                console.warn('profile insert failed', e);
            }

            return new Response(JSON.stringify({
                id: createdUser.id,
                email: createdUser.email,
                full_name: full_name || (createdUser.user_metadata && (createdUser.user_metadata.full_name || createdUser.user_metadata?.fullName)) || null
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } catch (e) {
            console.error('Unexpected create-user error:', e);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    } catch (e) {
        console.error('Unexpected error in create-user:', e);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
