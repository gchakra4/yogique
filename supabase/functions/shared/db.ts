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
  return await callFunctionWithOptions(functionName, body);
}

export async function callFunctionWithOptions(
  functionName: string,
  body: any,
  options?: {
    serviceRoleKey?: string | null;
    headers?: Record<string, string>;
    timeoutMs?: number;
  },
) {
  const key = options?.serviceRoleKey ?? SUPABASE_KEY;
  if (!SUPABASE_URL || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + '/functions/v1/' + functionName;

  const SCHED_HEADER = Deno.env.get('SCHEDULER_SECRET_HEADER') || '';
  const SCHED_TOKEN = Deno.env.get('SCHEDULER_SECRET_TOKEN') || '';

  const extraHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  if (SCHED_HEADER && SCHED_TOKEN) extraHeaders[SCHED_HEADER] = SCHED_TOKEN;

  const timeoutMs = options?.timeoutMs;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = timeoutMs ? setTimeout(() => controller?.abort(), timeoutMs) : null;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, ...extraHeaders },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
    const txt = await resp.text().catch(() => '');
    try {
      return { ok: resp.ok, status: resp.status, body: JSON.parse(txt) };
    } catch {
      return { ok: resp.ok, status: resp.status, body: txt };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, body: { error: 'fetch_failed', details: msg } };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function restDelete(pathAndQuery: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const url = baseUrl() + pathAndQuery;
  const resp = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  const txt = await resp.text().catch(() => '');
  try { return JSON.parse(txt); } catch { return txt; }
}

export default { restGet, restPatch, restPost, restDelete, callFunction };
