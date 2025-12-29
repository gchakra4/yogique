import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { restDelete, restGet, restPatch, restPost } from '../shared/db.ts';

const SUPERUSER_HEADER = 'x-superuser-token';
const SUPERUSER_TOKEN = Deno.env.get('SUPERUSER_API_TOKEN') || '';

serve(async (req) => {
  try {
    const token = req.headers.get(SUPERUSER_HEADER) || '';
    if (!SUPERUSER_TOKEN || token !== SUPERUSER_TOKEN) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const q = url.searchParams.toString() ? `?/` : '';
      const resp = await restGet('/rest/v1/activity_template_mappings?select=*');
      return new Response(JSON.stringify(resp), { status: 200 });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if (!body.activity || !body.template_key) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
      const created = await restPost('/rest/v1/activity_template_mappings', body);
      return new Response(JSON.stringify(created), { status: 201 });
    }

    if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
      const body = await req.json();
      const patched = await restPatch(`/rest/v1/activity_template_mappings?id=eq.${id}`, body, true);
      return new Response(JSON.stringify(patched), { status: 200 });
    }

    if (req.method === 'DELETE' && id) {
      const deleted = await restDelete(`/rest/v1/activity_template_mappings?id=eq.${id}`);
      return new Response(JSON.stringify(deleted), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
