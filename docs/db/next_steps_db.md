# Next steps — apply migration (what to do in the database)

Follow these exact steps to apply the migration that adds transaction snapshot columns.

1) Backup (recommended)
- Use Supabase UI → Backups or run pg_dump to export schema + data.

2) Apply migration (recommended: Supabase SQL editor)
- Open Supabase project → SQL Editor → New query
- Paste the SQL from `supabase/migrations/20250829000001_add_transactions_snapshot.sql`
- Run the query

Alternative: psql
```bash
PGPASSWORD='DB_PASSWORD' psql "postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME" -f supabase/migrations/20250829000001_add_transactions_snapshot.sql
```

3) Verify migration succeeded
Run these queries in Supabase SQL editor:

```sql
-- confirm columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='transactions' AND column_name IN ('user_email','user_full_name');

-- sample rows from view that show snapshot fallback
SELECT id, payer_email, payer_full_name FROM public.transactions_with_user LIMIT 10;

-- index check
SELECT indexname FROM pg_indexes WHERE tablename='transactions' AND indexname='idx_transactions_user_id';
```

4) If something goes wrong / rollback
```sql
ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_email;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_full_name;
```
Also restore schema from backup if needed.

5) After you run the migration
- Reply with: "I ran migration" (or "I will run migration later")
- Then toggle to Act mode; I will:
  - Update `supabase/functions/record-transaction/index.ts` to accept and persist `user_email` and `user_full_name`, and resolve `user_id` if an auth user exists.
  - Add `search-users` and (optionally) `create-user` edge functions.
  - Update frontend combobox in `src/features/dashboard/components/Modules/TransactionManagement.tsx`.

Notes
- The migration only adds snapshot columns and updates the view; it does not change foreign key constraints.
- No immediate rollback required unless you need to revert the schema; keep a backup.
