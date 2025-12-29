function functionsBase() {
  return (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1';
}

async function parseResponse(res: Response) {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const txt = await res.text().catch(() => '');
  if (ct.includes('application/json')) {
    try { return JSON.parse(txt); } catch (e) { throw new Error('Invalid JSON response'); }
  }
  if (ct.includes('text/html')) {
    throw new Error(`Unexpected HTML response from functions endpoint (status ${res.status}) - check VITE_SUPABASE_URL or dev proxy`);
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
