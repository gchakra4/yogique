-- Fix: change transactions.user_id foreign key to reference auth.users(id)
-- Reason:
--   The profiles table uses user_id as its PK; previous attempt to reference profiles(id) failed.
--   The edge function inserts auth.users.id into transactions.user_id, so referencing auth.users(id)
--   matches the inserted value and avoids FK violations.
--
-- NOTE: Run in Supabase SQL editor. Idempotent: drops existing constraint first.

BEGIN;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;

-- Verification:
-- 1) Confirm constraint now references auth.users:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conname = 'transactions_user_id_fkey';
--
-- 2) Retry the insert that previously failed (replace values accordingly):
--    SELECT * FROM public.transactions WHERE user_email = 'example+smoke@yoursite.example' ORDER BY created_at DESC LIMIT 5;
--
-- Notes / Alternatives:
-- - If you prefer to keep FK to profiles, reference profiles(user_id) instead of profiles(id):
--     ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
--   (profiles.user_id is the PK according to schema you pasted.)
-- - If you have other dependencies, apply during a maintenance window.
