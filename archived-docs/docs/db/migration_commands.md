Migration — how to run the SQL (pick one)

1) Supabase UI (recommended)
- Open your Supabase project → SQL Editor → New query
- Paste contents of `supabase/migrations/20250829000001_add_transactions_snapshot.sql`
- Run

2) psql (CLI)
- Unix/macOS:
```bash
PGPASSWORD='DB_PASSWORD' psql "postgresql://DB_USER@DB_HOST:DB_PORT/DB_NAME" -f supabase/migrations/20250829000001_add_transactions_snapshot.sql
```
- Windows (PowerShell):
```powershell
$env:PGPASSWORD = "DB_PASSWORD"
psql "postgresql://DB_USER@DB_HOST:DB_PORT/DB_NAME" -f supabase/migrations/20250829000001_add_transactions_snapshot.sql
```
Replace DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME with your connection values (from Supabase project settings → Database → Connection info).

3) Supabase CLI (if you use migrations workflow)
- Example (adjust to your workflow / remote):
```bash
supabase db remote set my-remote "postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME"
psql "postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME" -f supabase/migrations/20250829000001_add_transactions_snapshot.sql
```

4) Quick verification (run after migration)
```sql
-- confirm columns
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='transactions' AND column_name IN ('user_email','user_full_name');

-- sample rows from view
SELECT id, payer_email, payer_full_name FROM public.transactions_with_user LIMIT 10;

-- index check
SELECT indexname FROM pg_indexes WHERE tablename='transactions' AND indexname='idx_transactions_user_id';
```

Rollback (if needed)
```sql
ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_email;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS user_full_name;
```

Notes
- Backup before running migration (pg_dump or Supabase backup).
- After you run the migration reply "I ran migration" and toggle to Act mode; I will update the edge function and frontend.
