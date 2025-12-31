-- Fix: change transactions.user_id foreign key to reference public.profiles(id)
-- Reason:
--   The edge function resolves a user id from auth.users and inserts it into public.transactions.
--   The current foreign-key constraint on transactions.user_id references a different table
--   (the error shows: "is not present in table \"users\""). That causes a FK violation when the
--   resolved auth.users.id does not exist in that referenced table.
--
-- Recommended fix:
--   Replace the existing constraint with one that references public.profiles(id) (the app's
--   canonical profile table), and use ON DELETE SET NULL so historical transactions remain
--   even if the profile is removed.
--
-- NOTE: Run this in Supabase SQL editor or via psql. This is idempotent (uses DROP CONSTRAINT IF EXISTS).
BEGIN;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMIT;

-- Verification queries after applying:
-- 1) Ensure constraint exists and references profiles:
--    SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'transactions_user_id_fkey';
--
-- 2) Re-run the failing insert (or create a test transaction) to confirm no FK violation when user_id is an auth.users id that has a matching profile row.
--
-- If you prefer to reference auth.users directly instead of public.profiles, replace the ADD CONSTRAINT line with:
--   ADD CONSTRAINT transactions_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
--
-- Choose the target that matches your app's canonical user/profile model. If your app requires
-- keeping a separate public.users table in sync with auth.users, alternatively make sure that
-- create-user flow inserts the corresponding public row for each new auth user.
