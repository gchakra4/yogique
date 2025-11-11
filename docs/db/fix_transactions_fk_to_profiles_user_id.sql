-- Fix: change transactions.user_id foreign key to reference public.profiles(user_id)
-- Reason:
--   Your `profiles` table uses `user_id` as its primary key. If you want the
--   transactions FK to point at profiles, it must reference profiles(user_id).
--   This script is idempotent (drops existing constraint first).
--
-- NOTE: Run this in Supabase SQL editor or via psql against your cloud DB.

BEGIN;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

COMMIT;

-- Verification queries:
-- 1) Confirm constraint:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conname = 'transactions_user_id_fkey';
--
-- 2) Confirm the referenced table/column exists and is the PK:
--    SELECT
--      tc.table_schema, tc.table_name, kcu.column_name, ccu.table_schema AS foreign_table_schema,
--      ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
--    FROM information_schema.table_constraints AS tc
--    JOIN information_schema.key_column_usage AS kcu
--      ON tc.constraint_name = kcu.constraint_name
--    JOIN information_schema.constraint_column_usage AS ccu
--      ON ccu.constraint_name = tc.constraint_name
--    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='transactions'
--      AND kcu.column_name = 'user_id';
--
-- 3) Retry a sample insert via your record-transaction function and then:
--    SELECT id, user_id, user_email, user_full_name, created_at
--    FROM public.transactions
--    WHERE user_email = 'example+smoke@yoursite.example'
--    ORDER BY created_at DESC
--    LIMIT 5;
--
-- Notes:
-- - You already applied a constraint referencing auth.users earlier; if that remains
--   active the DROP CONSTRAINT above will remove it and replace with this one.
-- - Choose the FK that best matches your ownership model:
--     * Reference auth.users(id) if transactions should point at auth.users.
--     * Reference public.profiles(user_id) if your app uses profiles.user_id as canonical user PK.
-- - After applying, re-run the failing request and paste any remaining logs if errors persist.
