# Data dictionary

Purpose
- Column-level metadata: data types, nullability, defaults.

Generated artifact
- `docs/data-dictionary.csv` — produced with information_schema query.

Example command
- PowerShell:
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\copy (SELECT table_schema, table_name, column_name, ordinal_position, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position) TO 'docs/data-dictionary.csv' CSV HEADER"
