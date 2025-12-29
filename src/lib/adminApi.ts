export async function getMappings() {
  const res = await fetch('/functions/v1/admin-proxy');
  if (!res.ok) throw new Error(`getMappings failed ${res.status}`);
  return res.json();
}

export async function createMapping(payload: any) {
  const res = await fetch('/functions/v1/admin-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`createMapping failed ${res.status}`);
  return res.json();
}

export async function updateMapping(id: string, payload: any) {
  const res = await fetch(`/functions/v1/admin-proxy?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`updateMapping failed ${res.status}`);
  return res.json();
}

export async function deleteMapping(id: string) {
  const res = await fetch(`/functions/v1/admin-proxy?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`deleteMapping failed ${res.status}`);
  return res.json();
}

export default { getMappings, createMapping, updateMapping, deleteMapping };
