# Reconciliation Details

Purpose
- Operational reference for reconciling `billing` data with finance records (invoices, payments).
- Read-only checks first; corrective SQL only after approval.

When to run
- Before promoting billing to staging/production.
- After any backfill or migration affecting `billing` tables.
- Periodically once payments begin (daily/weekly depending on volume).

Prerequisites
- DB snapshot taken (`supabase_snapshot.sql`).
- `DATABASE_URL` set to a dev/staging service-role connection, or use Supabase SQL editor.
- (Optional) Finance ledger CSV matching `docs/sample_ledger_template.csv`.

Quick read-only checks (psql examples)
- Invoice totals:
  psql $env:DATABASE_URL -c "SELECT COUNT(*) AS invoice_count, SUM(amount::numeric) AS invoice_sum FROM billing.invoices;"
- Payment totals:
  psql $env:DATABASE_URL -c "SELECT COUNT(*) AS payment_count, SUM(amount::numeric) AS payment_sum FROM billing.payments;"
- Linked payments sum:
  psql $env:DATABASE_URL -c "SELECT SUM(p.amount::numeric) AS linked_payments_sum FROM billing.payments p JOIN billing.invoices i ON p.invoice_id = i.id;"
- Sample problem-rows:
  psql $env:DATABASE_URL -c "SELECT id, amount, currency, status, created_at FROM billing.invoices WHERE billing_profile_id IS NULL LIMIT 50;"

Compare against ledger CSV (recommended flow)
1. Create temp import table:
   CREATE SCHEMA IF NOT EXISTS tmp;
   CREATE TABLE IF NOT EXISTS tmp.ledger_import (
     ledger_id text, date timestamptz, description text, reference_id text, invoice_number text, invoice_id uuid, amount numeric, currency text, status text, payment_method text, paid_at timestamptz, notes text
   );
2. Import CSV locally using `psql`:
   \copy tmp.ledger_import FROM 'path/to/ledger.csv' CSV HEADER;
3. Totals compare:
   SELECT (SELECT SUM(amount) FROM tmp.ledger_import) AS ledger_sum, (SELECT SUM(amount::numeric) FROM billing.invoices) AS invoice_sum;
4. Find unmatched ledger rows:
   SELECT l.* FROM tmp.ledger_import l LEFT JOIN billing.invoices i ON l.invoice_id = i.id WHERE i.id IS NULL;

Idempotent corrective actions (patterns)
- Use helper mapping tables to record automated changes (example: `billing._backfill_profiles`).
- Example pattern (dry-run then COMMIT):
  BEGIN; -- run SELECT checks
  -- create helper mappings, INSERT ... WHERE NOT EXISTS
  -- INSERT placeholder profiles only when absent
  -- UPDATE invoices to attach profiles where NULL
  ROLLBACK; -- dry-run

Recording and rollback
- Keep mapping/audit tables for every automated backfill so you can reverse changes.
- Document decisions in `docs/PHASE3_RUNBOOK.md` and `docs/PHASES_TRACKING.md`.

Scheduling and monitoring
- Start with manual runs; when stable, schedule a daily or weekly reconcile job that emails a report.
- Alert threshold: e.g., ledger_sum vs invoice_sum > 1% or > fixed amount.

Editing this process later
- This file is editable: change queries, add provider-specific logic, or add scheduled runners in `scripts/migration/`.
- For code changes, open a PR or edit directly in the repo and record changes in `docs/PHASES_TRACKING.md`.

Contact
- Include finance and the engineer who runs the migration when applying fixes.
