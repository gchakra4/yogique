#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const archiveDir = path.join(migrationsDir, '_archived');

const connectionString = process.env.DATABASE_URL || process.argv[2];
if (!connectionString) {
    console.error('Usage: DATABASE_URL=... node scripts/create_placeholders_from_remote.cjs [DATABASE_URL]');
    process.exit(1);
}

async function getRemoteRows() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        const res = await client.query('SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version');
        return res.rows;
    } finally {
        await client.end();
    }
}

function ensureDir() {
    if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });
}

function writePlaceholder(version) {
    const fileName = `${version}.sql`;
    const filePath = path.join(migrationsDir, fileName);
    if (fs.existsSync(filePath)) return false;
    const content = `-- placeholder for remote migration ${version}\n-- created ${new Date().toISOString()}\n`;
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return true;
}

(async () => {
    ensureDir();
    const rows = await getRemoteRows();
    const created = [];
    for (const r of rows) {
        const v = r.version;
        // Construct a filename that starts with the version prefix (required by CLI)
        let fname;
        if (v && v.includes('_')) {
            fname = `${v}.sql`;
        } else if (r.name && String(r.name).trim() !== '') {
            const rawName = String(r.name).endsWith('.sql') ? String(r.name).slice(0, -4) : String(r.name);
            fname = `${v}_${rawName}.sql`;
        } else if (v) {
            fname = `${v}_placeholder.sql`;
        } else {
            continue;
        }

        const filePath = require('path').join(migrationsDir, fname);
        if (!fs.existsSync(filePath)) {
            const content = `-- placeholder for remote migration ${v}\n-- created ${new Date().toISOString()}\n`;
            fs.writeFileSync(filePath, content, { encoding: 'utf8' });
            created.push(fname);
        }
    }
    if (created.length) console.log('Created placeholders for versions:', created.join(', '));
    else console.log('All remote versions already have local files.');
})();
