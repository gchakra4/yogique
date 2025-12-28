const fs = require('fs');

const file = process.argv[2] || 'wa_templates_parsed.json';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

async function getFetch() {
    if (typeof global.fetch === 'function') return global.fetch;
    // dynamic import to avoid CJS<->ESM interop issues
    try {
        const mod = await import('node-fetch');
        return mod.default || mod;
    } catch (e) {
        throw new Error('No fetch available: install node-fetch or use Node 18+');
    }
}

async function main() {
    const fetchFn = await getFetch();
    const raw = fs.readFileSync(file, 'utf8');
    const templates = JSON.parse(raw);
    for (const t of templates) {
        const body = {
            key: t.key,
            meta_name: t.meta_name,
            language: t.language,
            category: t.category || null,
            status: t.status || null,
            components: t.components || [],
            variables: t.variables || [],
            example: t.example_values || [],
            has_buttons: t.has_buttons || false,
            button_types: t.button_types || [],
            approved: true,
        };

        const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/wa_templates`;
        const resp = await fetchFn(url, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([body]),
        });
        const txt = await resp.text();
        if (!resp.ok) {
            console.error('Failed to insert template', t.key, resp.status, txt);
        } else {
            console.log('Inserted', t.key);
        }
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
