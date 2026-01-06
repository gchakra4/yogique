-- 008_enable_rls_policies.sql
-- Conservative RLS enablement and policy templates for Phase 4
-- Created by Copilot on 2026-01-06 (scaffold)

-- Enable RLS on target schemas/tables and add a safe service_role allow policy.
-- These are conservative stubs: they allow the `service_role` role full access
-- and add deny-by-default placeholders for user policies. Apply in dev first.

BEGIN;

-- Enable RLS where appropriate
ALTER TABLE IF EXISTS billing.billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing.payments ENABLE ROW LEVEL SECURITY;

-- service_role allow: full access for service-role operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'invoices' AND p.policyname = 'service_role_allow'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY service_role_allow
      ON billing.invoices
      USING ( current_setting('jwt.claims.role', true) = 'service_role' )
      WITH CHECK ( current_setting('jwt.claims.role', true) = 'service_role' );
    $sql$;
  END IF;
END$$;

-- Repeat for payments and billing_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'payments' AND p.policyname = 'service_role_allow'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY service_role_allow
      ON billing.payments
      USING ( current_setting('jwt.claims.role', true) = 'service_role' )
      WITH CHECK ( current_setting('jwt.claims.role', true) = 'service_role' );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'billing_profiles' AND p.policyname = 'service_role_allow'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY service_role_allow
      ON billing.billing_profiles
      USING ( current_setting('jwt.claims.role', true) = 'service_role' )
      WITH CHECK ( current_setting('jwt.claims.role', true) = 'service_role' );
    $sql$;
  END IF;
END$$;

-- Placeholder for user-level policies (deny by default). Replace TODOs with real checks.
-- Example: allow finance role to select invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'invoices' AND p.policyname = 'finance_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY finance_select
      ON billing.invoices
      FOR SELECT
      USING ( current_setting('jwt.claims.role', true) = 'finance' );
    $sql$;
  END IF;
END$$;

COMMIT;

-- Notes:
-- 1) Review and replace `current_setting('jwt.claims.role', true)` checks with your auth mapping.
-- 2) Test policies in dev with a copy of production data and run the validation script in `scripts/policies/`.
-- 3) Apply policies incrementally (schema-by-schema), and keep `service_role_allow` until user policies are proven safe.
