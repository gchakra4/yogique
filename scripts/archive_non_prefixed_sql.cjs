#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const archiveDir = path.join(migrationsDir, '_archived');

function ensureArchive() {
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
}

function listSql() {
    if (!fs.existsSync(migrationsDir)) return [];
    return fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
}

function isPrefixed(f) {
    // match prefix like 20251206_name.sql (digits then underscore)
    return /^[0-9]+_.+\.sql$/.test(f);
}

function main() {
    ensureArchive();
    const files = listSql();
    const toArchive = files.filter(f => !isPrefixed(f));
    if (toArchive.length === 0) {
        console.log('No non-prefixed SQL files to archive.');
        return;
    }
    for (const f of toArchive) {
        const src = path.join(migrationsDir, f);
        const dst = path.join(archiveDir, f);
        fs.renameSync(src, dst);
        console.log('Archived non-prefixed file', f);
    }
}

main();
