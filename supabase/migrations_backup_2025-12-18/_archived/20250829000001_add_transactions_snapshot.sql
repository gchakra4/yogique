-- Migration: add snapshot columns to transactions and update view
-- Purpose: store payer snapshot (email + full name) on each transaction so history is preserved
-- Run this in your supabase SQL editor or via psql / supabase CLI

BEGIN;

-- 1) Add snapshot columns (safe with IF NOT EXISTS)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_full_name text;

-- 2) Ensure index on user_id for lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- 3) Recreate transactions_with_user view to prefer the snapshot fields if present,
--    otherwise fall back to joined auth.users / profiles
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
