const fs = require('fs');
const path = process.argv[2];
if (!path) {
    console.error('Usage: node delete_file.cjs <path>');
    process.exit(1);
}
try {
    fs.unlinkSync(path);
    console.log('Deleted', path);
} catch (err) {
    console.error('Error deleting', path, err.message);
    process.exit(1);
}
