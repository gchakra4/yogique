import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const payload = await req.json().catch(() => ({}));
    const templateName = payload?.templateName || payload?.name || null;
    const wabaIdFromBody = payload?.wabaId || payload?.waba_id || null;

    const META_PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID') || '';
    const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || '';
    const META_WABA_ID = Deno.env.get('META_WABA_ID') || '';

    if (!META_PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_meta_env' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    async function fetchJson(url: string) {
      const r = await fetch(url, { method: 'GET' });
      const j = await r.json().catch(() => null);
      return { ok: r.ok, status: r.status, body: j };
    }

    // If caller provides WABA id, use it (no discovery permissions required)
    if (wabaIdFromBody) {
      const waba = String(wabaIdFromBody);
      let url = `https://graph.facebook.com/v20.0/${encodeURIComponent(waba)}/message_templates?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`;
      if (templateName) url += `&name=${encodeURIComponent(templateName)}`;
      const out = await fetchJson(url);
      return new Response(JSON.stringify({ ok: out.ok, status: out.status, body: out.body, waba, source: 'request' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Prefer explicit WABA id if configured
    if (META_WABA_ID) {
      let url = `https://graph.facebook.com/v20.0/${META_WABA_ID}/message_templates?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`;
      if (templateName) url += `&name=${encodeURIComponent(templateName)}`;
      const out = await fetchJson(url);
      return new Response(JSON.stringify({ ok: out.ok, status: out.status, body: out.body, waba: META_WABA_ID, source: 'env' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Otherwise, discover WABA(s) via /me/businesses -> owned_whatsapp_business_accounts
    const businesses = await fetchJson(`https://graph.facebook.com/v20.0/me/businesses?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}&limit=100`);
    if (!businesses.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'failed_to_list_businesses',
          hint: 'Provide wabaId in request body or set META_WABA_ID secret for this Edge Function.',
          example_body: { templateName: templateName || '<template_name>', wabaId: '<WABA_ID>' },
          businesses,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const bizList = (businesses.body && Array.isArray(businesses.body.data)) ? businesses.body.data : [];
    const discovered: Array<{ business_id: string; waba_ids: string[]; raw: any }> = [];
    const wabaIds: string[] = [];

    for (const b of bizList) {
      const bid = String(b?.id || '');
      if (!bid) continue;
      const w = await fetchJson(`https://graph.facebook.com/v20.0/${encodeURIComponent(bid)}?fields=owned_whatsapp_business_accounts.limit(100){id,name}&access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`);
      const owned = (w.body && w.body.owned_whatsapp_business_accounts && Array.isArray(w.body.owned_whatsapp_business_accounts.data)) ? w.body.owned_whatsapp_business_accounts.data : [];
      const ids = owned.map((x: any) => String(x?.id || '')).filter(Boolean);
      discovered.push({ business_id: bid, waba_ids: ids, raw: w });
      for (const id of ids) if (!wabaIds.includes(id)) wabaIds.push(id);
    }

    if (!wabaIds.length) {
      return new Response(JSON.stringify({ ok: false, error: 'no_waba_found', businesses, discovered }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Query templates for each WABA until we find the named template (or return first WABA templates if no name).
    for (const waba of wabaIds) {
      let url = `https://graph.facebook.com/v20.0/${waba}/message_templates?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`;
      if (templateName) url += `&name=${encodeURIComponent(templateName)}`;
      const out = await fetchJson(url);
      if (!templateName) {
        return new Response(JSON.stringify({ ok: out.ok, status: out.status, body: out.body, waba, source: 'discovery', discovered }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const data = out.body && Array.isArray(out.body.data) ? out.body.data : [];
      if (out.ok && data.length) {
        return new Response(JSON.stringify({ ok: true, status: out.status, body: out.body, waba, source: 'discovery', discovered }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ ok: false, error: 'template_not_found_across_wabas', templateName, wabas: wabaIds, discovered }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
