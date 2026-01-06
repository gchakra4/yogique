-- 005_create_billing_tables.sql
-- Create billing schema and core billing tables (idempotent)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE IF NOT EXISTS billing.billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES corporate.companies(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_profile_id uuid REFERENCES billing.billing_profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft',
  external_id text,
  due_date date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES billing.invoices(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  provider text,
  provider_reference text,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_profile_id uuid REFERENCES billing.billing_profiles(id) ON DELETE SET NULL,
  po_number text UNIQUE,
  amount numeric(12,2) DEFAULT 0,
  status text DEFAULT 'open',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  effective_from date DEFAULT now(),
  effective_to date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_invoices_billing_profile_id ON billing.invoices(billing_profile_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_invoice_id ON billing.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_user_id ON billing.billing_profiles(user_id);

-- Notes:
-- - This migration is intentionally idempotent; tables are created IF NOT EXISTS.
-- - Backfill and FK integrity checks should run after this migration is applied in the dev project.
-- Rollback: DROP TABLE billing.<table> CASCADE; or DROP SCHEMA IF EXISTS billing CASCADE (only after validating no needed data).
