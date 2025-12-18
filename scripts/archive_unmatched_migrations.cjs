#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const archiveDir = path.join(migrationsDir, '_archived');

async function getRemoteVersions(connectionString) {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        const res = await client.query("SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;");
        return res.rows.map(r => r.version);
    } finally {
        await client.end();
    }
}

function listLocalMigrationFiles() {
    if (!fs.existsSync(migrationsDir)) return [];
    return fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .filter(f => f !== undefined);
}

function ensureArchiveDir() {
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
}

async function main() {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.argv[2];
    if (!connectionString) {
        console.error('Usage: DATABASE_URL=... node scripts/archive_unmatched_migrations.cjs [DATABASE_URL]');
        process.exit(1);
    }

    const remote = await getRemoteVersions(connectionString);
    const localFiles = listLocalMigrationFiles();

    const remoteSet = new Set(remote.map(String));

    const unmatched = localFiles.filter(f => {
        const base = path.basename(f, '.sql');
        return !remoteSet.has(base);
    });

    if (unmatched.length === 0) {
        console.log('No unmatched local migration files found.');
        return;
    }

    ensureArchiveDir();

    const moved = [];
    for (const f of unmatched) {
        const src = path.join(migrationsDir, f);
        const dst = path.join(archiveDir, f);
        fs.renameSync(src, dst);
        moved.push(f);
    }

    console.log('Archived files:', moved.join(', '));
    console.log('Archive directory:', archiveDir);
}

main().catch(err => { console.error(err && err.stack ? err.stack : err); process.exit(2); });
