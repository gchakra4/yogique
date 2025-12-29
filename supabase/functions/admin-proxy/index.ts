import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPERUSER_API_TOKEN = Deno.env.get('SUPERUSER_API_TOKEN') || '';

function baseUrl() { return SUPABASE_URL.replace(/\/$/, '') }

function corsHeaders() {
  const h = new Headers()
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  h.set('Access-Control-Allow-Headers', 'authorization, content-type, x-superuser-token, apikey')
  return h
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }
    const auth = req.headers.get('authorization')
    if (!auth) return new Response(JSON.stringify({ error: 'missing auth' }), { status: 401, headers: corsHeaders() })

    // Validate token and fetch user info
    const userResp = await fetch(baseUrl() + '/auth/v1/user', { headers: { Authorization: auth } })
    if (!userResp.ok) return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: corsHeaders() })
    const user = await userResp.json()
    const userId = user?.id
    if (!userId) return new Response(JSON.stringify({ error: 'no user id' }), { status: 401, headers: corsHeaders() })

    // Fetch roles for this user using service role key
    const rolesResp = await fetch(baseUrl() + `/rest/v1/user_roles?user_id=eq.${userId}&select=roles(name)`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
    })
    if (!rolesResp.ok) return new Response(JSON.stringify({ error: 'failed to fetch roles' }), { status: 403, headers: corsHeaders() })
    const rolesData = await rolesResp.json()
    const roles = (rolesData || []).map((r: any) => r.roles?.name).flat().filter(Boolean)

    const allowed = roles.includes('super_admin') || roles.includes('admin')
    if (!allowed) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders() })

    // Proxy the request to the internal admin function with server-side SUPERUSER token
    const url = new URL(req.url)
    const proxiedUrl = baseUrl() + '/functions/v1/admin-template-mappings' + (url.search || '')

    // Read incoming body
    const buf = await req.arrayBuffer().catch(() => null)

    const proxiedResp = await fetch(proxiedUrl, {
      method: req.method,
      headers: {
        'x-superuser-token': SUPERUSER_API_TOKEN,
        'Content-Type': req.headers.get('content-type') || 'application/json'
      },
      body: buf ? new Uint8Array(buf) : undefined
    })

    const text = await proxiedResp.text().catch(() => '')
    const headers = corsHeaders()
    const ct = proxiedResp.headers.get('content-type')
    if (ct) headers.set('content-type', ct)
    return new Response(text, { status: proxiedResp.status, headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders() })
  }
})
