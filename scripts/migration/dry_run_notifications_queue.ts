/**
 * dry_run_notifications_queue.ts
 *
 * Simple dry-run script to inspect `public.notifications_queue` before migrating.
 * Usage:
 *   - Ensure SUPABASE_PROJECT_REF or SUPABASE_URL and SUPABASE_SERVICE_ROLE are set in env
 *   - `node ./scripts/migration/dry_run_notifications_queue.ts` (use ts-node or compile first)
 *
 * This script only reads and reports counts/sample rows. It does NOT alter the DB.
 */

import { createClient } from '@supabase/supabase-js';

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
    // Check existence and sample rows
    const sample = await supabase.from('notifications_queue').select('*').limit(5);
    console.log('Sample rows (up to 5):', sample.data || sample);

    // Try to get a count (note: some client versions return count via head/select options)
    const { data, error, count } = await supabase.from('notifications_queue').select('id', { count: 'exact', head: false }).limit(1);
    if (error) {
      console.warn('Count query returned error (non-fatal):', error.message || error);
    }
    console.log('Count (may be null if driver unsupported):', count ?? 'unknown');

    console.log('\nDry-run complete. To apply the migration, run the SQL file:',
      'supabase/migrations/001_create_schemas.sql');
    console.log('Apply using psql or your migration tooling (ensure you have a DB snapshot first).');
  } catch (err) {
    console.error('Error inspecting notifications_queue:', err);
    process.exit(1);
  }
}

main();
