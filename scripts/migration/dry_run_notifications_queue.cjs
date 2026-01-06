// CommonJS dry-run script for inspecting public.notifications_queue
// Usage: node scripts/migration/dry_run_notifications_queue.cjs

const { createClient } = require('@supabase/supabase-js');

async function main() {
    const projectRef = process.env.SUPABASE_PROJECT_REF;
    const url = process.env.SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : undefined);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

    if (!url || !serviceKey) {
        console.error('Please set SUPABASE_URL or SUPABASE_PROJECT_REF and SUPABASE_SERVICE_ROLE in your environment.');
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey);

    console.log('Connected to', url);

    try {
        const { data: sample, error: sampleErr } = await supabase.from('notifications_queue').select('*').limit(5);
        if (sampleErr) {
            console.warn('Sample query error:', sampleErr.message || sampleErr);
        } else {
            console.log('Sample rows (up to 5):', sample);
        }

        const { data, error, count } = await supabase.from('notifications_queue').select('id', { count: 'exact' }).limit(1);
        if (error) {
            console.warn('Count query returned error (non-fatal):', error.message || error);
        } else {
            console.log('Count (may be null if driver unsupported):', count ?? 'unknown');
        }

        console.log('\nDry-run complete. To apply the migration, run the SQL file:',
            'supabase/migrations/001_create_schemas.sql');
    } catch (err) {
        console.error('Error inspecting notifications_queue:', err);
        process.exit(1);
    }
}

main();
