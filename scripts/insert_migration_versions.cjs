#!/usr/bin/env node
const { Client } = require('pg');

const versions = process.argv.slice(2);
if (versions.length === 0) {
    console.error('Usage: node scripts/insert_migration_versions.cjs <version> [version ...]');
    process.exit(1);
}

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DB_CONNECTION;
if (!connectionString) {
    console.error('Please set DATABASE_URL (postgres connection string) in environment.');
    process.exit(1);
}

(async () => {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `INSERT INTO supabase_migrations.schema_migrations(version, statements, name)
       SELECT v, ARRAY[]::text[], NULL
       FROM unnest($1::text[]) AS v
       ON CONFLICT (version) DO NOTHING`,
            [versions]
        );
        await client.query('COMMIT');
        console.log('Inserted (idempotent) versions:', versions.join(', '));
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (e) { }
        console.error('Error inserting versions:', err.message || err);
        process.exit(2);
    } finally {
        await client.end();
    }
})();
