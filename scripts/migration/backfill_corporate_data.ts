/**
 * backfill_corporate_data.ts
 * Dry-run script to identify corporate bookings in existing data and plan backfill.
 * Usage (dry-run):
 *   SUPABASE_PROJECT_REF=... SUPABASE_SERVICE_ROLE=... npx ts-node scripts/migration/backfill_corporate_data.ts --dry
 */

import { createClient } from '@supabase/supabase-js';
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2)).option('dry', { type: 'boolean', default: true }).argv;

const projectRef = process.env.SUPABASE_PROJECT_REF;
const url = process.env.SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : undefined);
const key = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  console.error('Set SUPABASE_PROJECT_REF or SUPABASE_URL and SUPABASE_SERVICE_ROLE in env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('Running backfill dry-run: scanning for corporate bookings...');

  // Example heuristic: bookings table may include a metadata field or booking_type
  const { data, error } = await supabase.from('bookings').select('id,booking_id,metadata,booking_type').limit(1000);
  if (error) {
    console.error('Error querying bookings:', error.message || error);
    process.exit(1);
  }

  const corporateRows = (data || []).filter((r: any) =>
    r.booking_type === 'corporate' || (r.metadata && r.metadata.company_name) || (r.booking_id && r.booking_id.startsWith('YOG-C'))
  );

  console.log('Found corporate-like bookings count (sample limit 1000):', corporateRows.length);
  console.log('Sample rows:', corporateRows.slice(0, 10));

  // Build plan: extract unique company names/domains
  const companiesMap = new Map<string, any>();
  for (const r of corporateRows) {
    const companyName = r.metadata?.company_name || (r.metadata?.company || null) || 'unknown';
    if (!companiesMap.has(companyName)) companiesMap.set(companyName, { name: companyName, example_booking: r.booking_id || r.id });
  }

  console.log('Unique candidate companies to create:', companiesMap.size);
  console.log(Array.from(companiesMap.values()).slice(0, 20));

  console.log('\nDry-run complete. No writes performed. To perform backfill, implement creation logic with idempotency and mapping to corporate schema.');
}

main().catch(err => { console.error(err); process.exit(1); });
