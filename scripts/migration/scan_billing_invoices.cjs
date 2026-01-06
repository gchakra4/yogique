const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.PG_CONNECTION || null,
    });

    try {
        await client.connect();

        const exists = await client.query("SELECT to_regclass('billing.invoices') IS NOT NULL AS exists");
        if (!exists.rows[0].exists) {
            console.log('No billing.invoices table found in the target database.');
            return;
        }

        const countRes = await client.query('SELECT count(*)::int AS total FROM billing.invoices');
        console.log('billing.invoices total rows:', countRes.rows[0].total);

        const sample = await client.query('SELECT id, billing_profile_id, amount, currency, status, created_at FROM billing.invoices ORDER BY created_at DESC LIMIT 10');
        console.table(sample.rows);
    } catch (err) {
        console.error('scan error:', err.message || err);
        process.exitCode = 2;
    } finally {
        await client.end();
    }
}

if (require.main === module) main();
