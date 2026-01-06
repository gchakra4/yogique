-- 007_add_billing_fk_constraints.sql
-- Add foreign keys, indexes and constraints for billing schema

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS billing;

-- Foreign keys (add only if constraint name not present; Postgres ALTER TABLE doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_billing_profiles_user') THEN
    ALTER TABLE IF EXISTS billing.billing_profiles
      ADD CONSTRAINT fk_billing_profiles_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_billing_profile') THEN
    ALTER TABLE IF EXISTS billing.invoices
      ADD CONSTRAINT fk_invoices_billing_profile
      FOREIGN KEY (billing_profile_id) REFERENCES billing.billing_profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_invoice') THEN
    ALTER TABLE IF EXISTS billing.payments
      ADD CONSTRAINT fk_payments_invoice
      FOREIGN KEY (invoice_id) REFERENCES billing.invoices(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchase_orders_billing_profile') THEN
    ALTER TABLE IF EXISTS billing.purchase_orders
      ADD CONSTRAINT fk_purchase_orders_billing_profile
      FOREIGN KEY (billing_profile_id) REFERENCES billing.billing_profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Indexes and unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_purchase_orders_po_number ON billing.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_billing_profile_id ON billing.invoices(billing_profile_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_invoice_id ON billing.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_user_id ON billing.billing_profiles(user_id);

-- Notes:
-- - These constraints assume the tables were created by 005_create_billing_tables.sql.
-- - Apply in dev first; if any FK fails due to missing referenced rows, run corrective backfill or reconcile source data before applying in staging/production.
-- Rollback: DROP CONSTRAINT IF EXISTS <constraint> ON <table>; or DROP SCHEMA IF EXISTS billing CASCADE (use with caution).
