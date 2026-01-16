import { serve } from "https://deno.land/std@0.211.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.28.0?bundle";

// Environment variables required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Only allow GET
    if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    // Roles we consider as instructors
    const desiredRoleNames = ['instructor', 'yoga_acharya'];

    // 1) Resolve role IDs
    const { data: roles, error: rolesErr } = await sb.from('roles').select('id, name').in('name', desiredRoleNames);
    if (rolesErr) {
      console.error('roles query failed', rolesErr);
      return new Response(JSON.stringify({ error: 'roles_query_failed' }), { status: 500 });
    }
    const roleIds = (roles || []).map((r: any) => r.id);
    if (roleIds.length === 0) return new Response(JSON.stringify({ users: [] }), { status: 200 });

    // 2) user_roles -> user_ids
    const { data: ur, error: urErr } = await sb.from('user_roles').select('user_id').in('role_id', roleIds);
    if (urErr) {
      console.error('user_roles query failed', urErr);
      return new Response(JSON.stringify({ error: 'user_roles_query_failed' }), { status: 500 });
    }
    const userIds = (ur || []).map((r: any) => r.user_id);
    if (userIds.length === 0) return new Response(JSON.stringify({ users: [] }), { status: 200 });

    // 3) Fetch users from auth.users (contains raw_user_meta_data for names)
    const { data: usersData, error: usersErr } = await sb.from('auth.users').select('id, email, raw_user_meta_data').in('id', userIds);
    if (usersErr) {
      console.error('auth.users query failed', usersErr);
      return new Response(JSON.stringify({ error: 'users_query_failed' }), { status: 500 });
    }

    const users = (usersData || []).map((u: any) => {
      let fullName: string | null = null;
      try {
        const raw = u.raw_user_meta_data;
        if (raw) {
          if (typeof raw === 'string') {
            const parsed = JSON.parse(raw);
            fullName = parsed?.name || parsed?.full_name || null;
          } else if (typeof raw === 'object') {
            fullName = raw?.name || raw?.full_name || null;
          }
        }
      } catch (e) {
        fullName = null;
      }
      return { user_id: u.id, email: u.email, full_name: fullName };
    });

    return new Response(JSON.stringify({ users }), { status: 200 });
  } catch (err) {
    console.error('public-instructors error', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});
