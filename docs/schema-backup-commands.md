# Schema Backup and Restore

## Backup schema only (no data)

Use `pg_dump` with `-s` to dump only the schema.

```powershell
# Replace the connection details with yours
$env:PGPASSWORD = "<DB_PASSWORD>"
pg_dump -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -n public -s -f "D:\New folder\tryfix - Copy\supabase\backups\schema_backup_20251206.sql"
```

## Restore schema

```powershell
$env:PGPASSWORD = "<DB_PASSWORD>"
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -f "D:\New folder\tryfix - Copy\supabase\backups\schema_backup_20251206.sql"
```

## Supabase CLI alternative (if configured)

Supabase provides `db dump` and `db restore` targeting the linked project.

```powershell
# Dump schema
supabase db dump --schema public --data false --file "D:\New folder\tryfix - Copy\supabase\backups\schema_backup_20251206.sql"

# Restore schema
supabase db restore --file "D:\New folder\tryfix - Copy\supabase\backups\schema_backup_20251206.sql"
```

## Notes
- Backup before any rename or drop.
- Keep RLS policies, triggers, and functions in mind — schema dumps include them.
- For full rollback, keep both the pre-rename and post-rename dumps.
