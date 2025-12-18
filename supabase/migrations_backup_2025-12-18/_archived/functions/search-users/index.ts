/* eslint-disable */
/* @ts-nocheck */
/*
  Search Users Edge Function

  Purpose:
  - Provide a safe server-side search endpoint for the combobox/autocomplete.
  - Uses the service-role key to query profiles and auth.users and returns
    a small list of matching users (id, email, full_name).

  Query parameters:
  - q (required): search term (matched against profiles.full_name and email)
  - limit (optional): number of results (default 10)

  Env Vars required:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
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
        if (req.method !== 'GET') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const url = new URL(req.url);
        const q = (url.searchParams.get('q') || '').trim();
        const limitParam = Number(url.searchParams.get('limit') || '10');
        const limit = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);

        if (!q) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Search profiles by full_name or email
        const qLike = `%${q}%`;
        const users: Record<string, any> = {};

        try {
            const { data: profileMatches, error: profileErr } = await supabaseAdmin
                .from('profiles')
                .select('user_id, full_name, email')
                .or(`full_name.ilike.${qLike},email.ilike.${qLike}`)
                .limit(limit);

            if (!profileErr && Array.isArray(profileMatches)) {
                for (const p of profileMatches) {
                    const uid = p.user_id || p.id || null;
                    users[uid] = {
                        id: uid,
                        email: p.email || null,
                        full_name: p.full_name || null,
                        source: 'profile'
                    };
                }
            }
        } catch (e) {
            console.error('profiles search error', e);
        }

        // Search auth.users by email and raw_user_meta_data->>'full_name'
        try {
            // Try email match first
            const { data: authByEmail, error: authEmailErr } = await supabaseAdmin
                .from('auth.users')
                .select('id,email,raw_user_meta_data')
                .or(`email.ilike.${qLike},raw_user_meta_data->>full_name.ilike.${qLike}`)
                .limit(limit);

            if (!authEmailErr && Array.isArray(authByEmail)) {
                for (const u of authByEmail) {
                    const fullName = (u.raw_user_meta_data && (u.raw_user_meta_data.full_name || u.raw_user_meta_data?.fullName)) || null;
                    users[u.id] = {
                        id: u.id,
                        email: u.email || null,
                        full_name: fullName,
                        source: 'auth'
                    };
                }
            }
        } catch (e) {
            console.error('auth.users search error', e);
        }

        // Convert map to array and sort by best match heuristic (email or full_name contains q at start)
        const results = Object.values(users)
            .map((u: any) => ({
                id: u.id,
                email: u.email,
                full_name: u.full_name,
                source: u.source,
            }))
            .filter(Boolean)
            .slice(0, limit);

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Unexpected error in search-users:', e);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
