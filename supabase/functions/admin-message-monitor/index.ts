import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

function baseUrl() { return SUPABASE_URL.replace(/\/$/, '') }

function corsHeaders() {
  const h = new Headers()
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  h.set('Access-Control-Allow-Headers', 'authorization, content-type, apikey')
  return h
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })

    const auth = req.headers.get('authorization')
    if (!auth) return new Response(JSON.stringify({ error: 'missing auth' }), { status: 401, headers: corsHeaders() })

    // Validate token and fetch user info
    const userResp = await fetch(baseUrl() + '/auth/v1/user', { headers: { Authorization: auth, apikey: SUPABASE_KEY } })
    if (!userResp.ok) return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: corsHeaders() })
    const user = await userResp.json()
    const userId = user?.id
    if (!userId) return new Response(JSON.stringify({ error: 'no user id' }), { status: 401, headers: corsHeaders() })

    // Fetch roles for this user using service role key
    const rolesResp = await fetch(baseUrl() + `/rest/v1/user_roles?user_id=eq.${userId}&select=roles(name)`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    })
    if (!rolesResp.ok) return new Response(JSON.stringify({ error: 'failed to fetch roles' }), { status: 403, headers: corsHeaders() })
    const rolesData = await rolesResp.json()
    const roles = (rolesData || []).map((r: any) => r.roles?.name).flat().filter(Boolean)

    const allowed = roles.includes('super_admin') || roles.includes('admin')
    if (!allowed) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders() })

    // Parse query params for filters
    const url = new URL(req.url)
    const q = url.searchParams
    const search = q.get('search') || ''
    const channel = q.get('channel') || ''
    const status = q.get('status') || ''
    const dateFrom = q.get('dateFrom') || ''
    const dateTo = q.get('dateTo') || ''
    const limit = Number(q.get('limit') || '200')

    // Build REST queries
    let mq = `${baseUrl()}/rest/v1/message_audit?select=*&order=created_at.desc&limit=${encodeURIComponent(String(limit))}`
    if (search) {
      const s = encodeURIComponent(`recipient.ilike.%25${search}%25,provider_message_id.ilike.%25${search}%25`)
      mq += `&or=${s}`
    }
    if (channel) mq += `&channel=eq.${encodeURIComponent(channel)}`
    if (status) mq += `&status=eq.${encodeURIComponent(status)}`
    if (dateFrom) mq += `&created_at=gte.${encodeURIComponent(new Date(dateFrom).toISOString())}`
    if (dateTo) mq += `&created_at=lte.${encodeURIComponent(new Date(new Date(dateTo).setHours(23,59,59,999)).toISOString())}`

    const msgRes = await fetch(mq, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
    if (!msgRes.ok) return new Response(JSON.stringify({ error: 'failed to fetch messages' }), { status: 500, headers: corsHeaders() })
    const messages = await msgRes.json()

    // collect phones and fetch OTPs
    const phones = Array.from(new Set((messages || []).map((r: any) => r.recipient).filter(Boolean)))
    let otps: any[] = []
    if (phones.length) {
      const phoneList = phones.map(p => encodeURIComponent(p)).join(',')
      // Use in= filter
      const otpUrl = `${baseUrl()}/rest/v1/otp_codes?select=id,phone,created_at,expires_at,used&phone=in.(${phones.map(p => encodeURIComponent(p)).join(',')})&order=created_at.desc&limit=500`
      const otpRes = await fetch(otpUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
      if (otpRes.ok) otps = await otpRes.json()
    }

    const respBody = { ok: true, rows: messages, otps }
    return new Response(JSON.stringify(respBody), { status: 200, headers: { ...Object.fromEntries(corsHeaders()), 'Content-Type': 'application/json' } })
  } catch (err) {
    const headers = corsHeaders()
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers })
  }
})
