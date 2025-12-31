Usage
-----

This folder contains a PowerShell script to backup a production Postgres DB and apply all SQL files from `supabase/migrations` in name-sorted order.

Prerequisites
- `psql` and `pg_dump` on PATH (Postgres client tools).
- A production connection string in the `PROD_DATABASE_URL` environment variable or pass `-ProdDatabaseUrl` to the script.

Run (PowerShell):

```powershell
# use env var
$env:PROD_DATABASE_URL = "postgres://user:pass@host:5432/dbname"
.
\supabase\deploy\apply_migrations.ps1

# or pass explicitly
.\supabase\deploy\apply_migrations.ps1 -ProdDatabaseUrl "postgres://user:pass@host:5432/dbname"
```

Notes
- The script orders files by filename (so timestamped filenames run in chronological order).
- It performs a `pg_dump` custom-format backup if `pg_dump` is available; otherwise it warns and stops.
- Review migration files before running. Test on a staging environment first.
