const fs = require('fs');
const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.PGHOST || 'db.iddvvefpwgwmgpyelzcv.supabase.co',
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
    });

    if (!client.password) {
        console.error('PGPASSWORD environment variable is required');
        process.exit(1);
    }

    await client.connect();

    const sql = fs.readFileSync('supabase/validate_migration_checks.sql', 'utf8');

    const statements = sql
        .split(/;/)
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    const results = [];
    for (const stmt of statements) {
        try {
            const res = await client.query(stmt + ';');
            const rec = {
                query: stmt.split('\n')[0].slice(0, 400),
                command: res.command,
                rowCount: res.rowCount,
                rows: []
            };
            if (res.command === 'SELECT') {
                rec.rows = res.rows.map(r => {
                    const copy = { ...r };
                    Object.keys(copy).forEach(k => {
                        if (/token|key|secret|password/i.test(k)) copy[k] = '[REDACTED]';
                    });
                    return copy;
                });
            }
            results.push(rec);
        } catch (err) {
            results.push({ query: stmt.split('\n')[0].slice(0, 200), error: err.message });
        }
    }

    console.log(JSON.stringify(results, null, 2));

    await client.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
