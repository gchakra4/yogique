#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const archiveDir = path.join(migrationsDir, '_archived');

function listSqlFiles() {
    if (!fs.existsSync(migrationsDir)) return [];
    return fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
}

function prefixOf(filename) {
    const base = path.basename(filename, '.sql');
    const idx = base.indexOf('_');
    return idx === -1 ? base : base.substring(0, idx);
}

function ensureArchive() {
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
}

function archive(files) {
    ensureArchive();
    for (const f of files) {
        const src = path.join(migrationsDir, f);
        const dst = path.join(archiveDir, f);
        fs.renameSync(src, dst);
        console.log('Archived', f);
    }
}

function main() {
    const files = listSqlFiles().sort();
    const byPrefix = new Map();
    for (const f of files) {
        const p = prefixOf(f);
        if (!byPrefix.has(p)) byPrefix.set(p, []);
        byPrefix.get(p).push(f);
    }

    const toArchive = [];
    for (const [p, arr] of byPrefix.entries()) {
        if (arr.length > 1) {
            // keep the first, archive the rest
            const keep = arr[0];
            const extra = arr.slice(1);
            console.log(`Prefix ${p} has ${arr.length} files. Keeping ${keep}, archiving ${extra.length}`);
            toArchive.push(...extra);
        }
    }

    if (toArchive.length === 0) {
        console.log('No duplicate prefixes found.');
        return;
    }

    archive(toArchive);
}

main();
