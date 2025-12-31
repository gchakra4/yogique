# Row-Level Security (RLS) policies

Purpose
- Document policies protecting rows, and guidance for reviews.

Generated artifact
- `docs/rls-policies.csv` (from `pg_policies`) and a short human-readable summary below.

Generate CSV
- psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\copy (SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check FROM pg_policies ORDER BY schemaname, tablename) TO 'docs/rls-policies.csv' CSV HEADER"

Security note
- Verify RLS is enabled for every table with sensitive data and that anon role is limited.
