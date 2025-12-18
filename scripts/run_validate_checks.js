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

    // Split into statements by semicolon followed by newline. Keep simple.
    const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    for (const stmt of statements) {
        try {
            const res = await client.query(stmt + ';');
            // Print a concise summary
            if (res.command === 'SELECT') {
                console.log('---');
                console.log('Query:', stmt.split('\n')[0].slice(0, 200));
                console.log('Rows:', res.rows.length);
                // Print rows but redact any obvious sensitive fields
                const out = res.rows.map(r => {
                    const copy = { ...r };
                    // redact any field containing 'token' or 'key' or 'secret' in name
                    Object.keys(copy).forEach(k => {
                        if (/token|key|secret|password/i.test(k)) copy[k] = '[REDACTED]';
                    });
                    return copy;
                });
                console.log(JSON.stringify(out, null, 2));
            } else {
                console.log('Executed:', res.command);
            }
        } catch (err) {
            console.error('Error running statement:', stmt.split('\n')[0].slice(0, 200));
            console.error(err.message);
        }
    }

    await client.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
