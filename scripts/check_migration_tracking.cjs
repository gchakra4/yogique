const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.PGHOST || 'aws-0-ap-south-1.pooler.supabase.com',
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        user: process.env.PGUSER || 'postgres.iddvvefpwgwmgpyelzcv',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
    });

    if (!client.password) {
        console.error('PGPASSWORD environment variable is required');
        process.exit(1);
    }

    await client.connect();

    const findTablesSql = `
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name ILIKE '%migration%'
       OR table_name ILIKE '%migrations%'
       OR table_name ILIKE '%schema_migrations%'
    ORDER BY table_schema, table_name;
  `;

    const tablesRes = await client.query(findTablesSql);
    const tables = tablesRes.rows;
    const out = { found_tables: tables };

    for (const t of tables) {
        const q = `SELECT * FROM ${t.table_schema}.${t.table_name} LIMIT 200`;
        try {
            const r = await client.query(q);
            out[`${t.table_schema}.${t.table_name}`] = r.rows;
        } catch (err) {
            out[`${t.table_schema}.${t.table_name}`] = { error: err.message };
        }
    }

    console.log(JSON.stringify(out, null, 2));

    await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
