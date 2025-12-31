-- Dynamic rename plan (preview only)
-- Generates ALTER TABLE statements to rename all public base tables
-- to __deprecated_<table>_20251206. Review before executing.

WITH tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT format(
  'ALTER TABLE public.%I RENAME TO __deprecated_%I_20251206;'
  , table_name, table_name
) AS rename_sql
FROM tables
ORDER BY table_name;

-- To generate revert statements:
WITH d AS (
  SELECT c.relname AS deprecated_name,
         replace(c.relname, '__deprecated_', '') AS original_with_date
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE '__deprecated_%'
)
SELECT format(
  'ALTER TABLE public.%I RENAME TO %I;'
  , deprecated_name, regexp_replace(original_with_date, '_\d{8}$', '')
) AS revert_sql
FROM d
ORDER BY deprecated_name;