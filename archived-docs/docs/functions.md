# Functions & Edge functions

Contents
- `docs/functions.csv` — DB function names and definitions.
- `docs/edge-functions.txt` — list of local Supabase edge functions from `supabase/functions`.

Generate DB functions
- psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\copy (SELECT n.nspname as schema, p.proname as name, pg_get_functiondef(p.oid) as definition FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY n.nspname, p.proname) TO 'docs/functions.csv' CSV HEADER"

Edge functions
- List local: `Get-ChildItem .\supabase\functions -Directory | ForEach-Object { $_.Name } > docs/edge-functions.txt`
