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

    const colsRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='supabase_migrations' AND table_name='schema_migrations' ORDER BY ordinal_position");
    const rowsRes = await client.query('SELECT * FROM supabase_migrations.schema_migrations LIMIT 200');

    console.log(JSON.stringify({ columns: colsRes.rows, rows: rowsRes.rows }, null, 2));

    await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
