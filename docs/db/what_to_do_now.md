# What to do in the database — immediate steps

1) Backup (mandatory)
- Export a backup via Supabase UI or run:
  pg_dump --format=custom -U DB_USER -h DB_HOST -p DB_PORT DB_NAME > backup_before_tx_snapshot.dump

2) Apply migration (recommended: Supabase SQL editor)
- Open Supabase → SQL Editor → New query
- Paste the contents of `supabase/migrations/20250829000001_add_transactions_snapshot.sql`
- Run the query

3) Quick verification (run in SQL editor)
- Confirm columns:
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='transactions'
    AND column_name IN ('user_email','user_full_name');

- Check sample view output:
  SELECT id, payer_email, payer_full_name FROM public.transactions_with_user LIMIT 10;

- Confirm index:
  SELECT indexname FROM pg_indexes WHERE tablename='transactions' AND indexname='idx_transactions_user_id';

4) Rollback (if required)
- DROP the columns:
  ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_email;
  ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_full_name;

5) After you run the migration
- Reply in this chat: "I ran migration"
- Then toggle to Act mode so I can:
  - Update `supabase/functions/record-transaction/index.ts`
  - Add `search-users` (and optional `create-user`) edge functions
  - Replace the email input with combobox in `src/features/dashboard/components/Modules/TransactionManagement.tsx`

Notes
- Migration is additive and safe; backup before applying.
