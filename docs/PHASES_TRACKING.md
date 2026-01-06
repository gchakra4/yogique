# Phase Tracking — Enterprise Migration

This document tracks phases, user stories, acceptance criteria, owners, statuses, and rollback steps for the enterprise migration described in `ENTERPRISE_ARCHITECTURE_PLAN.md`.

Last updated: 2026-01-06
Owner: GitHub Copilot (implementation)

---

## Overview
- Purpose: Track the work items I will implement to migrate the platform to the multi-schema enterprise-ready architecture.
- How I'll use this file: update statuses and `Done` dates as I complete items; record short notes for each change.

---

## Legend
- Status: not-started / in-progress / blocked / completed

---

## Phase 1 — Schema Foundation — Completed on 2026-01-06
- ID: P1
- Goal: Create schemas and move existing `notifications_queue` to `shared`.
- Stories:
  - P1.1 Create schemas: `corporate`, `billing`, `audit`, `compliance`, `integrations`, `shared`.
    - Owner: Copilot
    - Status: completed
    - Acceptance: `001_create_schemas.sql` created at `supabase/migrations/001_create_schemas.sql`; dry-run inspection script added at `scripts/migration/dry_run_notifications_queue.ts`
    - Done: Schemas `corporate`, `billing`, `audit`, `compliance`, `integrations`, and `shared` created by running `supabase/migrations/001_create_schemas.sql` in the Supabase SQL editor; snapshot saved as `supabase_snapshot.sql`.
  - P1.2 ALTER TABLE public.notifications_queue to shared.notifications_queue (safe move)
    - Owner: Copilot
    - Status: completed
    - Acceptance: Table present in `shared`, existing producers/consumers unchanged
    - Done: Instructed user to run `supabase/migrations/001_create_schemas.sql` directly in the Supabase SQL editor; user executed the SQL and verified `shared.notifications_queue` exists with 4 rows.
- Rollback steps:
  1. If migration causes issues, run `ALTER TABLE shared.notifications_queue SET SCHEMA public;`.
  2. Restore schema creation by dropping created schemas (if empty) with `DROP SCHEMA IF EXISTS <schema> CASCADE;` only after verifying no data loss.
  3. If data loss suspected, restore DB from pre-migration snapshot.

### Visible changes
- **Schemas created:** `corporate`, `billing`, `audit`, `compliance`, `integrations`, `shared`.
- **Table moved:** `public.notifications_queue` → `shared.notifications_queue` (verified, 4 rows).
- **Migration file added:** `supabase/migrations/001_create_schemas.sql`.
- **Dry-run script added:** `scripts/migration/dry_run_notifications_queue.ts` and `scripts/migration/dry_run_notifications_queue.cjs`.
- **DB snapshot:** `supabase_snapshot.sql` saved prior to changes.
- **Applied:** Phase 1 SQL executed manually in Supabase SQL editor.

---

## Phase 2 — Corporate Backend — Completed on 2026-01-06
- ID: P2
- Goal: Add `corporate` schema and supporting tables; backfill corporate bookings into new tables.
- Stories:
  - P2.1 Create `corporate.companies`, `corporate.company_contacts`, `corporate.corporate_bookings`, `corporate.booking_participants`, `corporate.approvals`.
    - Owner: Copilot
    - Status: completed
    - Acceptance: `002_create_corporate_tables.sql` created at `supabase/migrations/002_create_corporate_tables.sql`; applied in Supabase SQL editor (no errors)
  - P2.2 Backfill script `backfill_corporate_data.ts` (dry-run then live)
    - Owner: Copilot
    - Status: completed
    - Acceptance: dry-run and idempotent backfill SQL created at `scripts/migration/backfill_corporate_data.ts` and `supabase/migrations/003_backfill_corporate_data.sql`; user executed `002_create_corporate_tables.sql` then applied `003_backfill_corporate_data.sql` in Supabase SQL editor (advisory lock acquired, no errors). Scan confirms 0 corporate-like bookings present in `public.bookings` (sample limit 1000), so no rows were added by the backfill.
  - P2.3 Add FK constraints and indexes for `corporate` schema (Phase 2b)
    - Owner: Copilot
    - Status: completed
    - Acceptance: `004_add_corporate_fk_constraints.sql` created at `supabase/migrations/004_add_corporate_fk_constraints.sql` and applied in Supabase SQL editor; constraints added:
      - FK: `corporate.company_contacts.company_id` → `corporate.companies(id)` (ON DELETE CASCADE)
      - FK: `corporate.company_contacts.user_id` → `auth.users(id)` (ON DELETE SET NULL)
      - FK: `corporate.corporate_bookings.company_id` → `corporate.companies(id)` (ON DELETE CASCADE)
      - FK: `corporate.corporate_bookings.coordinator_id,user_id,approved_by` → `auth.users(id)` (ON DELETE SET NULL)
      - FK: `corporate.booking_participants.corporate_booking_id` → `corporate.corporate_bookings(id)` (ON DELETE CASCADE)
      - FK: `corporate.booking_participants.company_contact_id` → `corporate.company_contacts(id)` (ON DELETE SET NULL)
      - FK: `corporate.approvals.corporate_booking_id` → `corporate.corporate_bookings(id)` (ON DELETE CASCADE)
      - Indexes and unique constraint on `corporate.companies.name` created for performance and data integrity.
    - Done: Applied in the dev Supabase project via Supabase SQL editor; no constraint violations observed. Will be applied to staging/production by the user when ready.
- Acceptance:
  - Backfill dry-run matches expected row counts; no broken FK relations.

- Done: Completed on 2026-01-06. Migrations and backfill were applied in the dev Supabase project via the Supabase SQL editor (user will apply to staging/production when ready).

### Visible changes
- **Tables created:** `corporate.companies`, `corporate.company_contacts`, `corporate.corporate_bookings`, `corporate.booking_participants`, `corporate.approvals`.
- **Migrations added:** `supabase/migrations/002_create_corporate_tables.sql`, `supabase/migrations/003_backfill_corporate_data.sql`, `supabase/migrations/004_add_corporate_fk_constraints.sql`.
- **Backfill:** idempotent backfill applied; advisory lock acquired; 0 rows inserted (no corporate-like rows found in sampled `public.bookings`).
- **FKs & indexes:** Foreign keys and indexes applied as listed in P2.3; no constraint violations observed in dev.
- **Scripts:** `scripts/migration/backfill_corporate_data.ts` (+ `.cjs` runner) and `scripts/migration/scan_corporate_bookings.cjs` added for dry-run and validation.
- **Applied:** All SQL was executed manually in the dev Supabase SQL editor; user retains responsibility for staging/production application.
- Rollback steps:
  1. Stop any new writes to corporate tables (feature-flag the UI/functions).
  2. If backfill incorrect, run corrective backfill from pre-run export or restore affected tables from snapshot.
  3. If structural issues, revert by dropping corporate tables and re-applying corrected migrations.

---

## Phase 3 — Billing — Completed on 2026-01-06
- ID: P3
- Goal: Add `billing` schema, invoices/payments tables, and backfill existing invoices.
- Stories:
  - P3.1 Create `billing.billing_profiles`, `billing.invoices`, `billing.payments`, `billing.purchase_orders`, `billing.pricing_rules`.
    - Owner: Copilot
    - Status: completed
    - Acceptance: `005_create_billing_tables.sql` created at `supabase/migrations/005_create_billing_tables.sql` (idempotent scaffold); applied in the dev Supabase SQL editor by the user.
  - P3.2 Backfill invoices and create billing profiles (`backfill_billing_data.sql`)
    - Owner: Copilot
    - Status: completed
    - Acceptance: idempotent backfill SQL created at `supabase/migrations/006_backfill_billing_data.sql`; dry-run executed and then the backfill was applied in dev by the user (no errors reported).
  - P3.3 Read-only scan and validation
    - Owner: Copilot
    - Status: completed
    - Acceptance: `scripts/migration/scan_billing_invoices.cjs` available to count and sample `billing.invoices` rows for post-backfill validation. Scan executed in dev (sampled invoices present; placeholder profile created and linked). User can run locally with `DATABASE_URL` set to the service_role Postgres URI.
  - P3.4 Add FK constraints and indexes for `billing` (Phase 3b)
    - Owner: Copilot
    - Status: completed
    - Acceptance: `007_add_billing_fk_constraints.sql` created at `supabase/migrations/007_add_billing_fk_constraints.sql` and applied in the dev Supabase SQL editor (no errors). Constraints and indexes added for `billing` tables as listed in the migration.
  - Acceptance:
  - Financial data validation: reconciliation with finance ledger pending (P3.5). Backfill and FK/index migrations applied in dev and validated with read-only scans; totals not yet reconciled against an official ledger export.
  - Done: Backfill (`006_backfill_billing_data.sql`), FK/index migration (`007_add_billing_fk_constraints.sql`) and scaffold (`005_create_billing_tables.sql`) applied in dev on 2026-01-06; read-only scan run; placeholder `billing_profiles` created and invoices linked; reconciliation awaiting finance ledger export.
- Rollback steps:
  1. Immediately pause billing workflows (feature flag / disable functions).
  2. Restore billing tables from snapshot if reconciliation fails.
  3. Re-run corrected backfill after validation.
  4. Notify finance team and keep manual reconciliation until resolved.
  5. If FK constraints cause issues, run corrective backfill or reconcile source data before re-applying.

### Visible changes (Phase 3 additions)
- **Migrations:** `supabase/migrations/005_create_billing_tables.sql`, `supabase/migrations/006_backfill_billing_data.sql`, `supabase/migrations/007_add_billing_fk_constraints.sql` (scaffold, idempotent backfill, FK/indexes).
- **Backfill runner:** `scripts/migration/backfill_billing_data.cjs` (dry-run / --apply runner used for dev runs).
- **Read-only scan:** `scripts/migration/scan_billing_invoices.cjs` (counts and samples invoices for validation).
- **Placeholder backfill audit table:** `billing._backfill_profiles` and placeholder `billing_profiles` row created during backfill to preserve mapping and idempotence.
- **Reconciliation docs:** `docs/RECONCILIATION_DETAILS.md` — operational reconciliation instructions and queries.
- **Runbook:** `docs/PHASE3_RUNBOOK.md` — one-page runbook for reconciliation, backfill, rollback and promotion checklist.
- **Sample ledger template:** `docs/sample_ledger_template.csv` — example CSV to test reconciliation import/compare flows.
- **Status note:** Phase 3 applied in dev (2026-01-06). P3.5 reconciliation remains pending until finance provides an official ledger export; marked N/A in tracker for now if finance confirms no ledger available.

---

## Phase 4 — RLS & RBAC
- ID: P4
- Goal: Enable RLS and implement policies for `public`, `corporate`, `billing`, `audit`.
- Stories:
  - P4.1 Implement RLS enablement and conservative stubs (`supabase/migrations/008_enable_rls_policies.sql`)
    - Owner: Copilot
    - Status: completed (dev)
  - P4.2 Add policy validation tooling (`scripts/policies/validate_rls.cjs`) and extend it to cover `corporate` + `shared`
    - Owner: Copilot
    - Status: completed
  - P4.3 Apply RLS policies in dev, iterate, and validate with the validator script
    - Owner: Copilot + User (applies SQL in Supabase SQL editor)
    - Status: completed (policies applied in dev and validated)
  - P4.4 Add detailed RLS policies for corporate and billing plus conservative fallbacks
    - Owner: Copilot
    - Status: completed (migrations added)

Acceptance:
  - Tests and the validator confirm policies exist and conservative `service_role` allow entries remain until smoke tests pass.

Rollback steps:
  1. Disable RLS per-table with `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;` if policies block needed access.
  2. Fix policies in staging and reapply.
  3. Use service role functions with explicit bypass (for urgent admin ops) while fixing policies, logging all bypass actions.

### P4 (RLS) — Required policies, recent changes, and deployment checklist

- Deployment order (apply in dev project first, then reproduce in production project):
  1. `shared` policies: `shared.users`, `shared.notifications_queue` — identity mapping + temporary `service_role_allow`.
  2. `corporate` policies: `corporate.companies`, `corporate.company_contacts`, `corporate.corporate_bookings`, `corporate.booking_participants`, `corporate.approvals`.
  3. `billing` policies: `billing.billing_profiles`, `billing.invoices`, `billing.payments`.
  4. `audit` / `compliance` policies: append-only writes; read access to auditors only.
  5. Edge/Functions allowlist: service-role bypass for scheduled jobs and Edge Functions.

- Policy templates to implement per-table (replace TODO expressions with real checks):
  - `service_role_allow`: conservative temporary allow used during validation; to be removed/hardened after smoke tests.
  - `company_admin_select/modify`: allow `auth.uid()` mapped company admins to SELECT/UPDATE/DELETE rows for their `company_id`.
  - `participant_self_select`: allow users to SELECT participant rows where `company_contact_id` or `email` matches.
  - `billing_finance_select`: allow finance role to view invoices/payments; restrict regular users to their own invoices.
  - `audit_readonly`: allow auditors to SELECT from audit/compliance tables; prevent non-auditor writes.

- Recent changes (dev):
  - `supabase/migrations/008_enable_rls_policies.sql` created and applied in dev to enable RLS and add conservative stubs.
  - `supabase/migrations/009_add_rls_policies_details.sql` added detailed corporate/billing policies.
  - `supabase/migrations/010_add_missing_rls_policies.sql` created to add conservative per-table policies where missing (idempotent, uses DO $$ checks).
  - `supabase/migrations/011_create_shared_users_and_seed.sql` created to add `shared.users` and seed/sync from `auth.users` (idempotent). The user ran this in dev and `shared.users` is present and seeded.
  - `scripts/policies/validate_rls.cjs` created and extended to cover `billing`, `corporate` and `shared` tables; the user ran the validator locally and confirmed the expected policies are present in dev (including `service_role_allow` entries).

- Validation and next steps:
  - User-run integration smoke tests are required in dev to verify app flows with current conservative policies.
  - After smoke tests pass, remove or tighten `service_role_allow` policies per-table to enforce least privilege.
  - Optionally add a CI workflow to run `scripts/policies/validate_rls.cjs` on PRs before merge (not implemented yet).

- Validation steps (staging/dev):
  - Add conservative stubs with `service_role_allow` and deny-by-default placeholders for user policies as done in dev.
  - Run integration and service-role jobs to confirm functionality.
  - Harden policies to real auth expressions using `auth.uid()` and `shared.users` mapping once app flows validated.
  - Repeat the process in production Supabase project (user-run).

---

## Phase 5 — Edge Functions
- ID: P5
- Goal: Scaffold and deploy key Edge Functions (corporate/create-company, billing/generate-invoice-pdf, corporate/generate-participant-invites).
- Stories:
  - P5.1 Create TypeScript templates for functions in `supabase/functions/`.
    - Owner: Copilot
    - Status: not-started
  - P5.2 Deploy to staging and test idempotency & auth
    - Owner: Copilot
    - Status: not-started
- Acceptance:
  - Functions pass unit/integration tests and run under service role.
- Rollback steps:
  1. Disable specific function routes (remove from deployment or set feature flag) if misbehaving.
  2. Re-deploy previous function version from Git tag.

---

## Phase 6 — UI Rollout
- ID: P6
- Goal: Add corporate admin dashboard and billing portal behind feature flags.
- Stories:
  - P6.1 Implement UI pages and feature flags in `src/features/corporate` and `src/features/billing`.
    - Owner: Copilot
    - Status: not-started
  - P6.2 Beta pilot with 5 companies
    - Owner: Copilot + Product
    - Status: not-started
- Acceptance:
  - Pilot companies can create bookings and receive invites; invoices viewable.
- Rollback steps:
  1. Disable feature flags to revert UI exposure.
  2. Re-enable old UI routes if needed.

---

## Cross-Phase Items
- Migration validation tests — automated scripts to validate counts and foreign-key integrity across schemas.
  - Owner: Copilot
  - Status: not-started
- Notification templates & batch worker
  - Owner: Copilot
  - Status: not-started

---

## Completed Work (so far)
- Reviewed `ENTERPRISE_ARCHITECTURE_PLAN.md` and captured gaps/risks.
- Created this tracking document `docs/PHASES_TRACKING.md` and populated initial phase stories.
 - Created Phase 1 migration file `supabase/migrations/001_create_schemas.sql` and dry-run script `scripts/migration/dry_run_notifications_queue.ts`.
 - Applied Phase 1 migration in Supabase SQL editor; verified `shared.notifications_queue` has 4 rows and created `supabase_snapshot.sql`.

---

## How I'll update this file
- I will update the `Status` and `Done` fields as I complete each story.
- Completed items will include a short note with link to migrations, scripts, or PRs.

---

## Runbook / High-level rollback steps (summary)
- Always take DB snapshot before running migrations.
- Apply migrations to staging copy and run backfill dry-run.
- If an outage or data corruption occurs:
  1. Rollback application-level exposure (feature flags, disable functions).
  2. If the schema change is reversible (e.g., moving table schema), run inverse `ALTER TABLE SET SCHEMA` where safe.
  3. Restore affected tables from DB snapshot backups if data loss detected.
   4. Communicate to stakeholders, pause billing and notification flows as needed.

  ---

  - Migration execution note: All SQL migration files under `supabase/migrations/` will be applied manually by the user using the Supabase SQL Editor. Copilot will generate idempotent SQL, provide read-only validation scripts, and supply explicit run and rollback instructions; the user is responsible for executing SQL in staging and production and reporting results.

  *File created by Copilot on 2026-01-06 — I will update progress here as tasks are completed.*

  ---

  ## CI Workflow (draft)

  - File: `.github/workflows/rls-validate.yml` (draft) — runs lightweight static checks on migration SQL and, optionally, the RLS validator when a CI DB secret is available. Key points:
    - Static checks run by default on PRs touching `supabase/migrations/**` and `scripts/policies/**`.
    - RLS validator job runs only when `DEV_DATABASE_URL` secret is present in the repository (safer default).
    - Avoid placing long-lived service-role keys in CI; prefer a CI-only rotated key or read-only replica for validation.

  ## Reflection: Phase 1–4 (what was done)

  - Phase 1: Schemas created (`corporate`, `billing`, `audit`, `compliance`, `integrations`, `shared`), `public.notifications_queue` moved to `shared.notifications_queue`, and `supabase_snapshot.sql` saved.
  - Phase 2: `corporate` tables created and backfilled; FK constraints and indexes applied; read-only scans executed for validation.
  - Phase 3: `billing` scaffold and backfills applied; FK/index migrations applied; read-only invoice scans prepared; reconciliation with finance ledger pending.
  - Phase 4: RLS enablement and conservative policy stubs added (`008`, `009`, `010`); `shared.users` created and seeded via `011`; `scripts/policies/validate_rls.cjs` added and extended; user ran validator in dev and confirmed policies are present (conservative `service_role_allow` entries remain until further testing).

  ## Production checklist — items to complete before or immediately after promoting to production

  Runbook and approvals
  - Schedule a maintenance window and stakeholder approvals for schema/RLS changes.
  - Confirm backups and snapshot retention: take a full DB snapshot before any production migration.

  Data & reconciliation
  - Complete P3.5: reconcile `billing.invoices` totals with finance ledger export; retain reconciliation artifacts in `docs/RECONCILIATION_DETAILS.md`.

  Policy hardening & validation
  - Run integration smoke tests in dev against current conservative policies (user-run). Verify all critical user workflows: auth sign-in, company creation, bookings, invoice generation, payments.
  - After smoke tests succeed, remove or tighten `service_role_allow` policies per-table and re-run smoke tests.
  - Ensure `scripts/policies/validate_rls.cjs` runs in CI or pre-merge checks (see `.github/workflows/rls-validate.yml`).

  Migration safety
  - Reconcile migration history with remote DB migration state; ensure no duplicate/overlapping migration prefixes.
  - Validate each migration by running in a staging copy of production and performing backfill dry-runs.
  - Confirm `supabase/migrations/011_create_shared_users_and_seed.sql` correctly seeds `shared.users` and is idempotent for production data volumes.

  Secrets & access
  - Provision CI secrets carefully: create a CI-only rotated DB URL (`DEV_DATABASE_URL`) with minimal privileges required for validation, or run validation against a read-only replica.
  - Audit service-role key usage and restrict its exposure. Rotate keys after migration if they were used for testing.

  Operational checks
  - Add monitoring & logs: ensure audit/compliance tables have correct append-only controls and logging in place.
  - Run performance/cost assessments for new indexes and schemas under production-like load.
  - Ensure rollback playbook is available and tested (ALTER TABLE ... DISABLE ROW LEVEL SECURITY; restore from snapshot; re-run backfills).

  Post-deployment
  - Run canary verification on a small subset of users/companies before full rollout.
  - Monitor errors, auth failures, and key business metrics (invoices created/paid, bookings created) for at least one production-day after rollout.
  - Re-run migration and policy validation scripts as part of post-deploy checks and record results in `docs/PHASES_TRACKING.md`.

  Notes:
  - CI draft is intentionally conservative: static checks run by default; RLS validator runs only when a CI secret is provided to avoid exposing service-role keys. Consider running the validator in a protected pipeline with restricted secrets access.
  - I can (A) commit these changes and the workflow, (B) also add a README with CI setup steps and recommended secret rotation, or (C) generate a staging runbook for you. Which would you like next?
