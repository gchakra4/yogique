// Scans workspace for references to public tables and reports match counts and files
// Usage: node tools/scan-table-references.js > docs/zero-reference-report.json

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INCLUDE_DIRS = [
    'src',
    'supabase/functions',
    'supabase/migrations',
    'docs',
    '__tests__'
];
const FILE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.md', '.csv', '.dump'];

function listFiles(dir) {
    const out = [];
    const stack = [dir];
    while (stack.length) {
        const d = stack.pop();
        let entries;
        try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
        for (const e of entries) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) { stack.push(p); }
            else {
                if (FILE_EXTS.includes(path.extname(p)) || e.name.includes('.sql') || e.name.includes('.md') || e.name.includes('.csv')) {
                    out.push(p);
                }
            }
        }
    }
    return out;
}

function readTablesFromDataDictionary(dictPath) {
    const csv = fs.readFileSync(dictPath, 'utf8');
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const tables = new Set();
    for (const line of lines.slice(1)) {
        const parts = line.split(',');
        if (parts.length < 2) continue;
        const schema = parts[0];
        const table = parts[1];
        if (schema === 'public') tables.add(table);
    }
    return Array.from(tables).sort();
}

function scan(files, tables) {
    const results = {};
    for (const t of tables) {
        const pattern = new RegExp(`\\b${t}\\b`, 'i');
        const hits = [];
        for (const f of files) {
            let txt;
            try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
            if (pattern.test(txt)) {
                hits.push(f.replace(ROOT + path.sep, ''));
            }
        }
        results[t] = { matches: hits.length, files: hits.slice(0, 10) };
    }
    return results;
}

(function main() {
    const dictPath = path.join(ROOT, 'docs', 'data-dictionary.csv');
    if (!fs.existsSync(dictPath)) {
        console.error('data-dictionary.csv not found at docs/data-dictionary.csv');
        process.exit(1);
    }
    const tables = readTablesFromDataDictionary(dictPath);
    const files = INCLUDE_DIRS.flatMap(d => listFiles(path.join(ROOT, d)));
    const results = scan(files, tables);
    const zeroRefs = Object.entries(results)
        .filter(([, v]) => v.matches === 0)
        .map(([k]) => k)
        .sort();
    const report = {
        tablesTotal: tables.length,
        zeroReferenceTables: zeroRefs,
        results
    };
    console.log(JSON.stringify(report, null, 2));
})();
