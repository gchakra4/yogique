type TemplateComponent = {
  type: string;
  text?: string;
  format?: string;
  buttons?: any[];
};

type WaTemplate = {
  key: string;
  meta_name: string;
  language: string;
  components: TemplateComponent[];
};

function escapeParam(s: string) {
  // Minimal escaping: trim and replace CRLF
  return String(s).replace(/\r\n|\r/g, '\n');
}

export function renderTemplatePayload(template: WaTemplate, vars: string[]) {
  // Validate variable count against placeholders in body (positional {{1}}...)
  // Collect body parameters in order
  const bodyComponent = template.components.find((c) => c.type === 'BODY' || c.type === 'body');
  const headerComponent = template.components.find((c) => c.type === 'HEADER' || c.type === 'header');
  const buttonsComponent = template.components.find((c) => c.type === 'BUTTONS' || c.type === 'buttons');

  // Find highest placeholder index in body text
  let maxIndex = 0;
  if (bodyComponent && bodyComponent.text) {
    const re = /\{\{(\d+)\}\}/g;
    let m;
    while ((m = re.exec(bodyComponent.text)) !== null) {
      const idx = parseInt(m[1], 10);
      if (idx > maxIndex) maxIndex = idx;
    }
  }

  if (maxIndex > vars.length) {
    throw new Error(`missing_vars: body requires ${maxIndex} vars, got ${vars.length}`);
  }

  const components: any[] = [];

  if (headerComponent) {
    if (headerComponent.format && headerComponent.format.toLowerCase() === 'text') {
      components.push({ type: 'header', parameters: [{ type: 'text', text: escapeParam(vars[0] || '') }] });
    }
  }

  if (bodyComponent) {
    const parameters = [] as any[];
    for (let i = 1; i <= maxIndex; i++) {
      const val = vars[i - 1] ?? '';
      parameters.push({ type: 'text', text: escapeParam(val) });
    }
    components.push({ type: 'body', parameters });
  }

  if (buttonsComponent && Array.isArray(buttonsComponent.buttons) && buttonsComponent.buttons.length) {
    // Map buttons: for Meta templates, buttons are sent as separate components with
    // sub_type and index and include a parameters array (e.g., for URL buttons).
    let buttonVarCursor = maxIndex;
    buttonsComponent.buttons.forEach((b, idx) => {
      const t = String(b.type || '').toUpperCase();

      if (t === 'URL') {
        const paramText = String(vars[buttonVarCursor] ?? '');
        if (!paramText) {
          throw new Error(`missing_vars: url_button[${idx}] requires 1 var after body vars`);
        }
        buttonVarCursor += 1;
        components.push({
          type: 'button',
          sub_type: 'url',
          index: String(idx),
          parameters: [{ type: 'text', text: escapeParam(paramText) }],
        });
        return;
      }

      if (t === 'PHONE_NUMBER') {
        // Phone-number buttons do not take parameters in the send payload.
        components.push({ type: 'button', sub_type: 'phone_number', index: String(idx) });
        return;
      }

      // Other button types (e.g., QUICK_REPLY) typically don't take parameters.
      components.push({ type: 'button', sub_type: String(b.type || 'unknown').toLowerCase(), index: String(idx) });
    });
  }

  const payload = {
    name: template.meta_name,
    language: { code: template.language || 'en' },
    components,
  };

  return payload;
}

export default { renderTemplatePayload };
