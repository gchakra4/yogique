// Read-only paginated scan for corporate-like bookings
const { createClient } = require('@supabase/supabase-js');

const projectRef = process.env.SUPABASE_PROJECT_REF;
const url = process.env.SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : undefined);
const key = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
    console.error('Set SUPABASE_PROJECT_REF or SUPABASE_URL and SUPABASE_SERVICE_ROLE in env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function scan() {
    console.log('Starting paginated scan of public.bookings (read-only)...');
    const batchSize = 1000;
    let from = 0;
    let totalScanned = 0;
    let corporateCount = 0;
    const companies = new Map();
    const samples = [];

    while (true) {
        const to = from + batchSize - 1;
        const { data, error } = await supabase.from('bookings').select('id,booking_id,booking_type,company_name,first_name,last_name,email,participants_count,created_at').range(from, to);
        if (error) {
            console.error('Error fetching bookings batch:', error.message || error);
            process.exit(1);
        }
        if (!data || data.length === 0) break;

        for (const r of data) {
            totalScanned++;
            const isCorporate = (r.booking_type === 'corporate') || (r.company_name && String(r.company_name).trim() !== '') || (r.booking_id && String(r.booking_id).startsWith('YOG-C'));
            if (isCorporate) {
                corporateCount++;
                const name = (r.company_name && String(r.company_name).trim()) || 'unknown';
                if (!companies.has(name)) companies.set(name, { name, example: r.booking_id || r.id });
                if (samples.length < 20) samples.push(r);
            }
        }

        // progress
        process.stdout.write(`Scanned ${totalScanned} rows...\r`);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    console.log('\nScan complete.');
    console.log('Total rows scanned:', totalScanned);
    console.log('Corporate-like bookings found:', corporateCount);
    console.log('Unique candidate companies:', companies.size);
    console.log('Sample rows (up to 20):', samples);
    console.log('Sample companies (up to 20):', Array.from(companies.values()).slice(0, 20));
}

scan().catch(err => { console.error(err); process.exit(1); });
