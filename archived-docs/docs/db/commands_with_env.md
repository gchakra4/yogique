Commands generated from .env (values filled)

Connection info (from .env)
- DB user: postgres
- DB password: postgres
- Host: 127.0.0.1
- Port: 54322
- Database: postgres

Backup (pg_dump) — Linux / macOS / WSL / Git Bash
```bash
# create a compressed custom-format dump in the current directory
PGPASSWORD='postgres' pg_dump -U postgres -h 127.0.0.1 -p 54322 -F c postgres > backup_before_tx_snapshot.dump
```

Backup (Windows PowerShell)
```powershell
$env:PGPASSWORD = "postgres"
pg_dump -U postgres -h 127.0.0.1 -p 54322 -F c postgres > backup_before_tx_snapshot.dump
Remove-Item Env:\PGPASSWORD
```

Apply migration SQL file (psql) — using connection string from .env
```bash
# Run from project root so the migration path resolves
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/migrations/20250829000001_add_transactions_snapshot.sql
```

Alternative: run via Supabase SQL editor (recommended)
- Open Supabase project UI → SQL Editor → New query
- Paste contents of supabase/migrations/20250829000001_add_transactions_snapshot.sql
- Run

Quick verification queries (psql or SQL editor)
```sql
-- confirm columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='transactions'
  AND column_name IN ('user_email','user_full_name');

-- sample view output
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
- These commands use the credentials present in your .env. If your production DB differs, do not run these against production.
- Run the backup first, then apply the migration.
- After running the migration reply in this chat with exactly: I ran migration
