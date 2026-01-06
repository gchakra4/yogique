# Phase 3 Runbook — Billing Reconciliation & Promotion

Purpose
- Provide concise operational steps to reconcile `billing` data, perform safe corrective backfills, and promote Phase 3 to staging/production.

Prerequisites
- DB snapshot taken (supabase_snapshot.sql).
- `DATABASE_URL` set to dev service role (or use Supabase SQL editor).
- Developer access to the repo and ability to run `psql` or Supabase SQL editor.
- (Optional) Finance ledger CSV exported with columns matching `docs/sample_ledger_template.csv`.

Files created
- docs/sample_ledger_template.csv — sample ledger CSV for testing.

Read-only reconciliation (safe)
1. Invoice totals:
   psql $env:DATABASE_URL -c "SELECT COUNT(*) AS invoice_count, SUM(amount::numeric) AS invoice_sum FROM billing.invoices;"
2. Payment totals:
   psql $env:DATABASE_URL -c "SELECT COUNT(*) AS payment_count, SUM(amount::numeric) AS payment_sum FROM billing.payments;"
3. Linked payments:
   psql $env:DATABASE_URL -c "SELECT SUM(p.amount::numeric) AS linked_payments_sum FROM billing.payments p JOIN billing.invoices i ON p.invoice_id = i.id;"
4. Sample rows for manual inspection:
   psql $env:DATABASE_URL -c "SELECT id, amount, currency, status, created_at FROM billing.invoices LIMIT 50;"

If you have a ledger CSV (one-time import & compare)
1. Create a temporary table:
   CREATE TABLE IF NOT EXISTS tmp.ledger_import (ledger_id text, date timestamp, description text, reference_id text, invoice_number text, invoice_id uuid, amount numeric, currency text, status text, payment_method text, paid_at timestamptz, notes text);
2. Import CSV using `psql` (or Supabase GUI):
   \copy tmp.ledger_import FROM 'path/to/sample_ledger.csv' CSV HEADER;
3. Compare totals:
   SELECT (SELECT SUM(amount) FROM tmp.ledger_import) AS ledger_sum, (SELECT SUM(amount::numeric) FROM billing.invoices) AS invoice_sum;
4. Find unmatched rows (example):
   SELECT l.* FROM tmp.ledger_import l LEFT JOIN billing.invoices i ON l.invoice_id = i.id WHERE i.id IS NULL;

Corrective backfills (safe, idempotent)
- Prefer targeted SQL that only updates rows where `billing_profile_id` is NULL or payments are unlinked.
- Keep a helper mapping table (billing._backfill_profiles) to record automated assignments for audit and reversal.
- Always `BEGIN; ... ROLLBACK;` first as a dry-run in Supabase SQL editor.

Rollback and audit
- Any automated backfill should record changed rows in an audit/backfill table so it can be reversed.
- Rollback pattern: run `SELECT * FROM billing._backfill_profiles;` then reverse `UPDATE billing.invoices SET billing_profile_id = NULL WHERE id IN (...)` if needed.

Promotion checklist (pre-staging)
- All reconciliation checks pass or have documented actions.
- Backfill and FK migrations applied in dev and validated (logs + scan scripts run).
- RLS policies prepared but disabled for migration steps where necessary.
- Run smoke tests that exercise billing flows in a staging environment.

Notes
- Reconciliation itself does not modify data if you only run the read-only queries above.
- Keep Finance in the loop when applying fixes that change ledger-aligned data.
