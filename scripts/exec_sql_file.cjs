const fs = require('fs');
const { Client } = require('pg');

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.error('Usage: node exec_sql_file.cjs <path-to-sql-file>');
        process.exit(1);
    }

    const sql = fs.readFileSync(file, 'utf8');
    const client = new Client({
        host: process.env.PGHOST || 'aws-0-ap-south-1.pooler.supabase.com',
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        user: process.env.PGUSER || 'postgres.iddvvefpwgwmgpyelzcv',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
    });
    await client.connect();
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Executed', file);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error executing', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
