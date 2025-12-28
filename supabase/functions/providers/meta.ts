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
};
