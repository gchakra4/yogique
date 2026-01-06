// CommonJS backfill dry-run runner
const { createClient } = require('@supabase/supabase-js');

const projectRef = process.env.SUPABASE_PROJECT_REF;
const url = process.env.SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : undefined);
const key = process.env.SUPABASE_SERVICE_ROLE;

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');

if (!url || !key) {
    console.error('Set SUPABASE_PROJECT_REF or SUPABASE_URL and SUPABASE_SERVICE_ROLE in env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    console.log('Running backfill dry-run: scanning for corporate bookings...');

    const { data, error } = await supabase.from('bookings').select('id,booking_id,booking_type,company_name,first_name,last_name,email,participants_count,created_at').limit(1000);
    if (error) {
        console.error('Error querying bookings:', error.message || error);
        process.exit(1);
    }

    const corporateRows = (data || []).filter((r) =>
        r.booking_type === 'corporate' || (r.company_name && String(r.company_name).trim().length > 0) || (r.booking_id && String(r.booking_id).startsWith('YOG-C'))
    );

    console.log('Found corporate-like bookings count (sample limit 1000):', corporateRows.length);
    console.log('Sample rows:', corporateRows.slice(0, 10));

    const companiesMap = new Map();
    for (const r of corporateRows) {
        const companyName = (r.metadata && (r.metadata.company_name || r.metadata.company)) || 'unknown';
        if (!companiesMap.has(companyName)) companiesMap.set(companyName, { name: companyName, example_booking: r.booking_id || r.id });
    }

    console.log('Unique candidate companies to create:', companiesMap.size);
    console.log(Array.from(companiesMap.values()).slice(0, 20));

    console.log('\nDry-run complete. No writes performed. To perform backfill, implement creation logic with idempotency and mapping to corporate schema.');
}

main().catch(err => { console.error(err); process.exit(1); });
