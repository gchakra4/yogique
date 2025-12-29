import renderer from '../supabase/functions/shared/waTemplateRenderer.ts';

describe('waTemplateRenderer', () => {
  test('renders body params and url button parameter in order', () => {
    const tpl: any = {
      key: 't1',
      meta_name: 'meta_name_1',
      language: 'en',
      components: [
        { type: 'body', text: 'Hello {{1}} and {{2}}' },
        { type: 'buttons', buttons: [ { type: 'URL' } ] },
      ],
    };

    const vars = ['Alice', 'Bob', 'https://example.com/pay?inv=123'];
    const p = renderer.renderTemplatePayload(tpl, vars as string[]);

    expect(p.name).toBe('meta_name_1');
    expect(p.language.code).toBe('en');
    // body parameters should be two texts
    const body = p.components.find((c: any) => c.type === 'body');
    expect(body).toBeDefined();
    expect(Array.isArray(body.parameters)).toBe(true);
    expect(body.parameters.length).toBe(2);
    expect(body.parameters[0].text).toBe('Alice');
    expect(body.parameters[1].text).toBe('Bob');

    const btn = p.components.find((c: any) => c.type === 'button' && c.sub_type === 'url');
    expect(btn).toBeDefined();
    expect(btn.parameters[0].text).toBe('https://example.com/pay?inv=123');
  });
});
