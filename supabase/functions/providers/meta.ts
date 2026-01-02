import renderer from '../shared/waTemplateRenderer.ts';
import { WhatsAppProvider } from './adapter.ts';

export const metaProvider: WhatsAppProvider = {
  async sendMessage(params) {
    const META_PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID') || '';
    const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || '';

    // Normalize `to`: accept either 'whatsapp:+123..' or '+123..'
    let to = params.to || '';
    if (to.startsWith('whatsapp:')) to = to.replace(/^whatsapp:/, '');

    const url = `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`;

    let body: any = {
      messaging_product: 'whatsapp',
      to: to,
    };

    if (params.type === 'text') {
      body.type = 'text';
      const textBody = params.textBody ?? (params.otp ? `Your verification code is ${params.otp}` : '');
      body.text = { body: textBody };
    } else {
      body.type = 'template';
      body.template = {
        name: params.templateName || '',
        language: { code: params.templateLanguage || 'en' },
        components: [
          {
            type: 'body',
            parameters: params.templateParameters || [],
          },
        ],
      };
    }

    try {
      // Avoid logging sensitive OTP values — mask when present
      try {
        const safe = params.otp ? { ...body, text: { body: params.otp ? '***' : '' } } : body;
        console.log('Meta request payload:', JSON.stringify(safe));
      } catch (e) {}
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await resp.json().catch(() => null);
      try { console.log('Meta response:', JSON.stringify(json)); } catch (e) {}

      // Graph API returns messages array with id on success
      const providerMessageId = json && json.messages && Array.isArray(json.messages) && json.messages.length ? json.messages[0].id : null;

      // Consider presence of `error` as failure
      const ok = resp.ok && !(json && json.error);

      return {
        ok: Boolean(ok),
        provider: 'meta',
        provider_message_id: providerMessageId,
        rawResponse: json ?? null,
      };
    } catch (err) {
      return { ok: false, provider: 'meta', provider_message_id: null, rawResponse: String(err) };
    }
  },
  async sendTemplate({ to, templateName, templateLanguage, templateParameters, metadata }: { to: string; templateName: string; templateLanguage?: string; templateParameters?: any[]; metadata?: any }) {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const META_PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID') || '';
    const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || '';

    // Fetch template row from wa_templates by key + language
    try {
      const requestedLang = String(templateLanguage || 'en');
      const tryLangs: string[] = [];
      const seen = new Set<string>();
      const addLang = (l: string | null | undefined) => {
        const v = String(l || '').trim();
        if (!v) return;
        if (seen.has(v)) return;
        seen.add(v);
        tryLangs.push(v);
      };

      // Try exact, then a normalized variant (en-in -> en_IN), then base language.
      addLang(requestedLang);
      const normalized = requestedLang.replace(/-/g, '_');
      const parts = normalized.split('_').filter(Boolean);
      if (parts.length >= 2) {
        addLang(`${parts[0].toLowerCase()}_${parts.slice(1).join('_').toUpperCase()}`);
      }
      addLang(requestedLang.toLowerCase());
      const base = requestedLang.split(/[-_]/)[0];
      addLang(base);
      addLang(String(base || '').toLowerCase());

      let row: any = null;
      for (const lang of tryLangs) {
        const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/wa_templates?select=*&key=eq.${encodeURIComponent(templateName)}&language=eq.${encodeURIComponent(lang)}&limit=1`;
        const resp = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          return { ok: false, provider: 'meta', provider_message_id: null, rawResponse: `failed_to_fetch_template: ${resp.status} ${txt}` };
        }
        const rows = await resp.json();
        row = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (row) break;
      }
      if (!row) {
        // If language mismatch is the only problem, show what languages exist.
        const langsUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/wa_templates?select=key,language,meta_name&key=eq.${encodeURIComponent(templateName)}&order=language.asc&limit=50`;
        const langsResp = await fetch(langsUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
        const langsTxt = await langsResp.text().catch(() => '');
        let langsRows: any[] = [];
        try {
          langsRows = langsTxt ? JSON.parse(langsTxt) : [];
        } catch {
          langsRows = [];
        }

        // Case-insensitive match (fixes en_in vs en_IN).
        if (langsResp.ok && Array.isArray(langsRows) && langsRows.length) {
          const want = requestedLang.toLowerCase();
          const match = langsRows.find((r) => String(r?.language || '').toLowerCase() === want);
          if (match?.language) {
            const matchUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/wa_templates?select=*&key=eq.${encodeURIComponent(templateName)}&language=eq.${encodeURIComponent(String(match.language))}&limit=1`;
            const matchResp = await fetch(matchUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
            if (matchResp.ok) {
              const matchRows = await matchResp.json().catch(() => []);
              const matchRow = Array.isArray(matchRows) && matchRows.length ? matchRows[0] : null;
              if (matchRow) row = matchRow;
            }
          }
        }

        // Auto-fallback only if there is exactly one available language row for this key.
        if (!row && langsResp.ok && Array.isArray(langsRows) && langsRows.length === 1) {
          const onlyLang = langsRows[0]?.language;
          const onlyRowUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/wa_templates?select=*&key=eq.${encodeURIComponent(templateName)}&language=eq.${encodeURIComponent(String(onlyLang || ''))}&limit=1`;
          const onlyRowResp = await fetch(onlyRowUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
          if (onlyRowResp.ok) {
            const onlyRows = await onlyRowResp.json().catch(() => []);
            const onlyRow = Array.isArray(onlyRows) && onlyRows.length ? onlyRows[0] : null;
            if (onlyRow) row = onlyRow;
          }
        }

        if (!row) {
          return {
            ok: false,
            provider: 'meta',
            provider_message_id: null,
            rawResponse: {
              error: 'template_not_found',
              hint: 'No matching row in public.wa_templates for (key, language). Fix by setting notifications_queue.template_language to one of available_languages (or sync the missing language).',
              template_key: templateName,
              requested_language: requestedLang,
              tried_languages: tryLangs,
              available_languages: Array.isArray(langsRows) ? langsRows.map((r) => r?.language).filter(Boolean) : [],
            },
          };
        }
      }

      // render payload
      const tpl = { key: row.key, meta_name: row.meta_name, language: row.language, components: row.components };
      const payload = renderer.renderTemplatePayload(tpl, templateParameters || []);

      const graphUrl = `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`;
      const body = { messaging_product: 'whatsapp', to: to.replace(/^whatsapp:/, ''), type: 'template', template: payload };

      if (metadata && metadata.dry_run) {
        const debug = metadata && metadata.debug;
        return {
          ok: true,
          provider: 'meta',
          provider_message_id: null,
          rawResponse: {
            dry_run: true,
            rendered_template: payload,
            request: body,
            template_row: debug ? { key: row.key, meta_name: row.meta_name, language: row.language, components: row.components } : undefined,
          },
        };
      }

      const gresp = await fetch(graphUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const gjson = await gresp.json().catch(() => null);
      const providerMessageId = gjson && gjson.messages && Array.isArray(gjson.messages) && gjson.messages.length ? gjson.messages[0].id : null;
      const ok = gresp.ok && !(gjson && gjson.error);
      return { ok: Boolean(ok), provider: 'meta', provider_message_id: providerMessageId, rawResponse: gjson ?? null };
    } catch (err) {
      return { ok: false, provider: 'meta', provider_message_id: null, rawResponse: String(err) };
    }
  },
};
