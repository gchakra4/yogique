const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    const out = execSync('node tools/list-js-with-tsx.cjs', { encoding: 'utf8' });
    const files = out.split(/\r?\n/).filter(Boolean);
    if (files.length === 0) {
        console.log('No files to untrack.');
        process.exit(0);
    }

    console.log('Untracking files:');
    files.forEach(f => console.log('  ' + f));

    // Run git rm --cached for each
    files.forEach(f => {
        console.log(`git rm --cached -- ${f}`);
        const res = spawnSync('git', ['rm', '--cached', '--', f], { stdio: 'inherit' });
        if (res.status !== 0) {
            console.error('Failed to untrack', f);
        }
    });

    // Update .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let gi = '';
    if (fs.existsSync(gitignorePath)) gi = fs.readFileSync(gitignorePath, 'utf8');
    const pattern = 'src/**/*.js';
    if (!gi.includes(pattern)) {
        fs.appendFileSync(gitignorePath, '\n' + pattern + '\n');
        console.log('Appended', pattern, 'to .gitignore');
        // Commit .gitignore
        spawnSync('git', ['add', '.gitignore'], { stdio: 'inherit' });
        spawnSync('git', ['commit', '-m', 'chore: stop tracking generated .js files alongside TSX sources'], { stdio: 'inherit' });
        spawnSync('git', ['push', 'origin', 'dev'], { stdio: 'inherit' });
    } else {
        console.log('.gitignore already contains pattern, skipping append.');
        // Still commit the removal of files
        spawnSync('git', ['commit', '-am', 'chore: stop tracking generated .js files alongside TSX sources'], { stdio: 'inherit' });
        spawnSync('git', ['push', 'origin', 'dev'], { stdio: 'inherit' });
    }

    console.log('Done.');
} catch (err) {
    console.error('Error during untrack:', err.message);
    process.exit(2);
}
