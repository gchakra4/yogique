import { mapNamedVars } from '../supabase/functions/shared/namedVars.ts';

describe('namedVars mapper', () => {
  test('falls back to object key ordering when no defaults exist', async () => {
    const v = { foo: 'one', bar: 'two', baz: 'three' };
    const arr = await mapNamedVars('nonexistent_template', 'en', v as Record<string, any>);
    expect(Array.isArray(arr)).toBe(true);
    // ordering should match Object.keys order
    expect(arr).toEqual(['one', 'two', 'three']);
  });
});
