const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'features', 'scheduling', 'pages', 'BookOneOnOne.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const marker = 'const emailHtmlTemplate = `';
const start = content.indexOf(marker);
if (start === -1) {
    console.error('Template marker not found');
    process.exit(1);
}
const rest = content.slice(start + marker.length);
const endSearch = '\n                                const emailHtml';
const endIndex = rest.indexOf(endSearch);
let template;
if (endIndex === -1) {
    console.error('End marker not found; trying fallback');
    const fallbackIndex = rest.indexOf('\n                                const emailHtml = emailHtmlTemplate');
    if (fallbackIndex === -1) {
        console.error('Unable to locate end of template');
        process.exit(1);
    }
    const slice = rest.slice(0, fallbackIndex);
    const lastBacktick = slice.lastIndexOf('`');
    if (lastBacktick === -1) {
        console.error('No closing backtick found');
        process.exit(1);
    }
    template = slice.slice(0, lastBacktick + 0);
} else {
    template = rest.slice(0, endIndex);
}

if (template.startsWith('`')) template = template.slice(1);
if (template.endsWith('`')) template = template.slice(0, -1);

const vars = {
    user_name: 'Test User',
    booking_id: 'YOG-20251206-1234',
    preferred_start_date: '2025-12-15',
    class_package_details: 'Individual - Pravaha Plan — ₹1999',
    class_time: '07:00 AM',
    support_contact: 'support@yogique.example.com',
    booking_notes: 'No heavy meals 2 hours before session',
    timezone: 'Asia/Kolkata',
    policy_url: 'https://yogique.example.com/terms',
    cancel_url: 'https://yogique.example.com/bookings/YOG-20251206-1234/cancel',
    action_url: 'https://yogique.example.com/bookings/YOG-20251206-1234',
    year: new Date().getFullYear().toString()
};

let rendered = template;
for (const k of Object.keys(vars)) {
    const re = new RegExp('{{' + k + '}}', 'g');
    rendered = rendered.replace(re, vars[k]);
}

const outDir = path.join(__dirname, '..', 'tmp');
const outPath = path.join(outDir, 'rendered_test_email.html');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, rendered, 'utf8');
console.log('Rendered HTML written to', outPath);
console.log('----- START RENDERED HTML -----');
console.log(rendered);
console.log('----- END RENDERED HTML -----');
