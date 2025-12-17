const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    const out = execSync('git ls-files -- src', { encoding: 'utf8' });
    const files = out.split(/\r?\n/).filter(Boolean);
    const matches = files.filter(f => f.endsWith('.js') && fs.existsSync(path.join(process.cwd(), f.replace(/\.js$/, '.tsx'))));
    if (matches.length === 0) {
        console.log('No tracked .js files with .tsx counterparts found.');
        process.exit(0);
    }
    matches.forEach(m => console.log(m));
} catch (err) {
    console.error('Error listing files:', err.message);
    process.exit(2);
}
