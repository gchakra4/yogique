-- Migration: add snapshot columns to transactions and recreate transactions_with_user view
-- Purpose: store payer snapshot (email + full name) on each transaction so history is preserved
-- Safe / idempotent: uses IF NOT EXISTS and DROP VIEW IF EXISTS so you can run from Supabase SQL editor.

BEGIN;

-- Drop view first to avoid type/column conflicts
DROP VIEW IF EXISTS public.transactions_with_user CASCADE;

-- Add snapshot columns (safe with IF NOT EXISTS)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_full_name text;

-- Ensure index on user_id for lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- Optional: index on user_email for search/filtering
CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON public.transactions(user_email);

-- Recreate transactions_with_user view to prefer the snapshot fields if present,
-- otherwise fall back to joined auth.users / profiles
CREATE OR REPLACE VIEW public.transactions_with_user AS
SELECT
  t.*,
  COALESCE(t.user_email, u.email) AS payer_email,
  COALESCE(t.user_full_name,
           p.full_name,
           NULLIF(u.raw_user_meta_data->>'full_name','')) AS payer_full_name
FROM public.transactions t
LEFT JOIN auth.users u ON t.user_id = u.id
LEFT JOIN public.profiles p ON p.id = t.user_id;

COMMIT;
