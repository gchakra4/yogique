#!/usr/bin/env node
// validate_rls.cjs
// Lightweight validation script to check presence of RLS policies on target tables.
// Usage: node scripts/policies/validate_rls.cjs

const { Client } = require('pg');

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Set DATABASE_URL (service_role) to run validation');
        process.exit(2);
    }
    const client = new Client({ connectionString: url });
    await client.connect();

    const tables = [
        // billing
        { schema: 'billing', table: 'invoices' },
        { schema: 'billing', table: 'payments' },
        { schema: 'billing', table: 'billing_profiles' },
        // corporate
        { schema: 'corporate', table: 'companies' },
        { schema: 'corporate', table: 'company_contacts' },
        { schema: 'corporate', table: 'corporate_bookings' },
        { schema: 'corporate', table: 'booking_participants' },
        { schema: 'corporate', table: 'approvals' },
        // shared
        { schema: 'shared', table: 'users' },
        { schema: 'shared', table: 'notifications_queue' }
    ];

    for (const { schema, table } of tables) {
        const res = await client.query(
            `SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE schemaname=$1 AND tablename=$2`,
            [schema, table]
        );
        console.log(`\nPolicies for ${schema}.${table}:`);
        if (res.rows.length === 0) {
            console.log('  (none)');
        } else {
            for (const r of res.rows) {
                console.log(`  - ${r.policyname} | roles=${r.roles} | qual=${r.qual} | with_check=${r.with_check}`);
            }
        }
    }

    await client.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
