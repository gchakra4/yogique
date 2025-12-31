# Transactions snapshot — DB instructions

Summary
- Add snapshot columns to `public.transactions` so each transaction stores payer details even if `auth.users` changes or is deleted.
- Migration file: `supabase/migrations/20250829000001_add_transactions_snapshot.sql` (already created).

Recommended steps

1) Backup
- Take a schema/data backup (Supabase UI export or `pg_dump`) before applying migration.

2) Apply migration (pick one)
- Supabase SQL editor:
  - Open your Supabase project → SQL Editor → New query
  - Paste the contents of `supabase/migrations/20250829000001_add_transactions_snapshot.sql`
  - Run

- psql:
  - psql "postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME" -f supabase/migrations/20250829000001_add_transactions_snapshot.sql

- Supabase CLI (if you use migrations workflow):
  - Configure remote and push the migration per your CI/CLI process.

3) Quick verification queries (run after migration)
- Confirm columns:
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='transactions' AND column_name IN ('user_email','user_full_name');

- Sample view rows:
  SELECT id, payer_email, payer_full_name FROM public.transactions_with_user LIMIT 10;

- Check index:
  SELECT indexname FROM pg_indexes WHERE tablename='transactions' AND indexname='idx_transactions_user_id';

4) Rollback (if needed)
- Remove snapshot columns:
  ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_email;
  ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_full_name;
- Restore previous view definition (keep a backup of old view DDL).

Notes for next implementation steps (after DB migration applied)
- Update edge function `supabase/functions/record-transaction/index.ts`:
  - Accept `user_email` and `user_full_name` and always write them into transactions.
  - If `user_id` is null and `user_email` present: try to resolve an existing `auth.users` record (service-role). If found, set `user_id`.
  - Do not auto-create users here unless an explicit admin-create flow is implemented.
- Add a small edge function `search-users` to serve the combobox autocomplete securely (service-role).
- Frontend: replace free-text email input with combobox/autocomplete calling `search-users`. Provide "Create user" flow that triggers explicit admin confirmation before calling a `create-user` edge function.

If you want, run the migration now and reply "I ran migration", or say "I will run migration later". After you run it I will:
- Update the edge function code and frontend combobox (requires Act mode).
