const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run({ apply = false } = {}) {
    const sqlPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '006_backfill_billing_data.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('Backfill SQL not found at', sqlPath);
        process.exit(2);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const conn = process.env.DATABASE_URL || process.env.PG_CONNECTION;
    if (!conn) {
        console.error('Please set DATABASE_URL or PG_CONNECTION environment variable to connect to the database.');
        process.exit(2);
    }

    const client = new Client({ connectionString: conn });
    await client.connect();

    try {
        // Ensure billing schema exists for count queries (safe if not present)
        await client.query('BEGIN');

        const beforeInvoices = await client.query("SELECT count(*)::int AS c FROM billing.invoices").catch(() => ({ rows: [{ c: 0 }] }));
        const beforePayments = await client.query("SELECT count(*)::int AS c FROM billing.payments").catch(() => ({ rows: [{ c: 0 }] }));

        // Execute backfill SQL (the SQL uses advisory locks internally)
        await client.query(sql);

        const afterInvoices = await client.query("SELECT count(*)::int AS c FROM billing.invoices").catch(() => ({ rows: [{ c: 0 }] }));
        const afterPayments = await client.query("SELECT count(*)::int AS c FROM billing.payments").catch(() => ({ rows: [{ c: 0 }] }));

        const invoiceDelta = (afterInvoices.rows[0].c || 0) - (beforeInvoices.rows[0].c || 0);
        const paymentDelta = (afterPayments.rows[0].c || 0) - (beforePayments.rows[0].c || 0);

        if (apply) {
            await client.query('COMMIT');
            console.log('Backfill applied.');
        } else {
            await client.query('ROLLBACK');
            console.log('Dry-run complete (rolled back). To apply, re-run with --apply.');
        }

        console.log('Invoices: before=%d after=%d delta=%d', beforeInvoices.rows[0].c || 0, afterInvoices.rows[0].c || 0, invoiceDelta);
        console.log('Payments: before=%d after=%d delta=%d', beforePayments.rows[0].c || 0, afterPayments.rows[0].c || 0, paymentDelta);
        process.exit(0);
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) { }
        console.error('Backfill runner error:', err.message || err);
        process.exit(3);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const apply = args.includes('--apply');
    run({ apply }).catch(err => { console.error(err); process.exit(2); });
}
