import { restGet } from './db.ts';

async function fetchTemplateDefaultVars(templateKey: string, language: string) {
  const tryLangs: string[] = [];
  tryLangs.push(language);
  const base = String(language).split(/[-_]/)[0];
  if (base && base !== language) tryLangs.push(base);

  for (const lang of tryLangs) {
    try {
      const q = `/rest/v1/wa_templates?select=key,language,default_vars&key=eq.${encodeURIComponent(templateKey)}&language=eq.${encodeURIComponent(lang)}&limit=1`;
      const rows = await restGet(q).catch(() => null);
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (row) return row.default_vars ?? null;
    } catch (e) {
      // ignore and continue
    }
  }
  return null;
}

// Map a named-vars object to an ordered array using wa_templates.default_vars when present.
export async function mapNamedVars(templateKey: string, language: string, v: Record<string, any>) {
  if (!v || typeof v !== 'object') return [];
  const def = await fetchTemplateDefaultVars(templateKey, language).catch(() => null);
  const keys = def && typeof def === 'object' ? Object.keys(def) : [];
  if (keys.length) return keys.map((k) => String(v[k] ?? def[k] ?? ''));
  // Fallback: stable ordering using Object.keys of provided object
  return Object.keys(v).map((k) => String(v[k] ?? ''));
}

export default { mapNamedVars };
