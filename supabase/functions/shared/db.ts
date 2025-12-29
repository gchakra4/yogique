const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

function baseUrl() {
  return SUPABASE_URL.replace(/\/+$|\s+/g, '');
}

function authHeaders(extra: Record<string,string> = {}) {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...extra };
}

export async function restGet(pathAndQuery: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + pathAndQuery;
  const resp = await fetch(url, { headers: authHeaders() });
  if (!resp.ok) throw new Error(`restGet failed ${resp.status}`);
  return await resp.json();
}

export async function restPatch(pathAndQuery: string, body: any, preferReturn = false) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + pathAndQuery;
  const headers = authHeaders({ 'Content-Type': 'application/json' });
  if (preferReturn) (headers as any).Prefer = 'return=representation';
  const resp = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const txt = await resp.text().catch(() => '');
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function restPost(pathAndQuery: string, body: any) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + pathAndQuery;
  const resp = await fetch(url, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
  const txt = await resp.text().catch(() => '');
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function callFunction(functionName: string, body: any) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + '/functions/v1/' + functionName;
  const resp = await fetch(url, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
  const txt = await resp.text().catch(() => '');
  try { return { ok: resp.ok, status: resp.status, body: JSON.parse(txt) }; } catch { return { ok: resp.ok, status: resp.status, body: txt }; }
}

export async function restDelete(pathAndQuery: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + pathAndQuery;
  const resp = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  const txt = await resp.text().catch(() => '');
  try { return JSON.parse(txt); } catch { return txt; }
}

export default { restGet, restPatch, restPost, restDelete, callFunction };
