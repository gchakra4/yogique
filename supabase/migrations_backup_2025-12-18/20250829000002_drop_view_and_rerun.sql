-- WARNING: Run a backup before executing these commands.
-- This file drops the conflicting view, applies the column changes, recreates the view.
-- Run in Supabase SQL editor or via psql.

BEGIN;

-- 1) Drop the view that caused the type conflict
DROP VIEW IF EXISTS public.transactions_with_user;

-- 2) Add snapshot columns (safe with IF NOT EXISTS)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_full_name text;

-- 3) Ensure index on user_id
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- 4) Recreate the view (same definition as migration)
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

-- Verification queries (run after the above):
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='transactions' AND column_name IN ('user_email','user_full_name');
--
-- SELECT id, payer_email, payer_full_name FROM public.transactions_with_user LIMIT 10;
--
-- SELECT indexname FROM pg_indexes WHERE tablename='transactions' AND indexname='idx_transactions_user_id';
