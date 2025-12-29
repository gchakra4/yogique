import { supabase } from '../shared/lib/supabase';

function functionsBase() {
  const base = (
    import.meta.env.VITE_SUPABASE_URL
    || import.meta.env.VITE_SUPABASE_URL_DEV
    || import.meta.env.VITE_SUPABASE_URL_PROD
    || ''
  );
  return base.replace(/\/$/, '') + '/functions/v1';
}

async function parseResponse(res: Response) {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const txt = await res.text().catch(() => '');
  if (ct.includes('application/json')) {
    try { return JSON.parse(txt); } catch (e) { throw new Error('Invalid JSON response'); }
  }
  if (ct.includes('text/html')) {
    // include a helpful diagnostic (functions base) when HTML is returned
    const fb = functionsBase();
    const sample = txt.slice(0, 300).replace(/\n/g, ' ');
    throw new Error(
      `Unexpected HTML response from functions endpoint (status ${res.status}).\n` +
      `Functions base: ${fb}\n` +
      `Response snippet: ${sample}\n` +
      `Likely causes: VITE_SUPABASE_URL is not set in your Vite env, or the dev server is proxying the request to index.html.\n` +
      `Fix: set VITE_SUPABASE_URL in a .env.local (e.g. VITE_SUPABASE_URL=https://<project>.supabase.co) or configure your dev proxy.`
    );
  }
  return txt;
}

async function authHeader() {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (token) return { Authorization: `Bearer ${token}` }
  } catch (e) {
    // ignore
  }
  // Make unauthenticated failures explicit so the client doesn't surface vague "Failed to fetch"
  throw new Error('No active Supabase session found. Please sign in and retry the admin action.');
}

export async function getMappings() {
  const headers = await authHeader()
  const res = await fetch(functionsBase() + '/admin-proxy', { headers });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`getMappings failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export async function createMapping(payload: any) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, await authHeader())
  const res = await fetch(functionsBase() + '/admin-proxy', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`createMapping failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export async function updateMapping(id: string, payload: any) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, await authHeader())
  const res = await fetch(functionsBase() + `/admin-proxy?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload)
  });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`updateMapping failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export async function deleteMapping(id: string) {
  const headers = await authHeader()
  const res = await fetch(functionsBase() + `/admin-proxy?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers
  });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`deleteMapping failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export default { getMappings, createMapping, updateMapping, deleteMapping };
