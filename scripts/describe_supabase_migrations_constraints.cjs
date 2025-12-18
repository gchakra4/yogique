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
    const q = `
    SELECT conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    WHERE conrelid = 'supabase_migrations.schema_migrations'::regclass;
  `;
    try {
        const res = await client.query(q);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err.message);
    }
    await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
