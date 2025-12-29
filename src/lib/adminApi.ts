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

export async function getMappings() {
  const res = await fetch(functionsBase() + '/admin-proxy', { credentials: 'include' });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`getMappings failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export async function createMapping(payload: any) {
  const res = await fetch(functionsBase() + '/admin-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`createMapping failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export async function updateMapping(id: string, payload: any) {
  const res = await fetch(functionsBase() + `/admin-proxy?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`updateMapping failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export async function deleteMapping(id: string) {
  const res = await fetch(functionsBase() + `/admin-proxy?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const body = await parseResponse(res);
  if (!res.ok) throw new Error(`deleteMapping failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

export default { getMappings, createMapping, updateMapping, deleteMapping };
