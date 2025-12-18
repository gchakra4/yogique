const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.PGHOST || 'aws-0-ap-south-1.pooler.supabase.com',
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        user: process.env.PGUSER || 'postgres.iddvvefpwgwmgpyelzcv',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
    });
    await client.connect();

    const tblsRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '__deprecated_%_20251206' ORDER BY table_name");
    const out = [];
    for (const r of tblsRes.rows) {
        const t = r.table_name;
        try {
            const cntRes = await client.query(`SELECT count(*)::int AS cnt FROM public."${t}"`);
            out.push({ table: t, count: cntRes.rows[0].cnt });
        } catch (err) {
            out.push({ table: t, error: err.message });
        }
    }

    console.log(JSON.stringify(out, null, 2));
    await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
