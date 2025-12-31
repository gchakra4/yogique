# Potential Writers Scan (INSERT/UPDATE/DELETE)

This report lists locations in the repo that include SQL write statements targeting `public.*`. Treat these as potential writers to tables; deprecate only after confirming they are disabled or updated.

## Sources scanned
- `supabase/migrations/**`
- `supabase/functions/**`
- `src/**`
- `docs/**`, backups (`backup.sql`, `supabase_backup_2025-12-06.dump`, `diff.txt`)

## Representative matches
- Migrations: `supabase/migrations/20251206_migrate_audits_to_audit_logs.sql`
  - `INSERT INTO public.audit_logs (...)`
- Tests: `__tests__/generateCancelToken.test.ts`
  - `INSERT INTO public.audit_logs (...)`
- Backups/docs (indicative of triggers/functions writing):
  - `supabase_backup_2025-12-06.dump`: inserts/updates/deletes on `public.admin_users`, `public.user_roles`, `public.profiles`, `public.class_assignments`, `public.class_attendance`, `public.class_ratings`
  - `docs/functions.csv`: functions that `INSERT` into `public.profiles`, `public.user_roles`, `public.admin_users`; `UPDATE` `public.class_assignments`; `DELETE` from `public.admin_users`
  - `docs/schema-ddl.sql`: same writer patterns as `functions.csv`

## Notes
- Serverless functions may write via Supabase client without embedding raw SQL; grep may miss those. Review `supabase/functions/*` for any `.from('<table>').insert/update/delete` usage.
- Rename-first deprecation should include validating no function, trigger, or RLS policy still allows writes to the deprecated names.

## Next actions
- Confirm whether currently deployed edge functions target any of the public tables slated for deprecation.
- If deprecating a table, search for its exact name across the repo and deployed functions to ensure no writers.
