# Indexes

Contents
- `docs/indexes.csv` — list of indexes and definitions.

Command to generate
- psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\copy (SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename) TO 'docs/indexes.csv' CSV HEADER"
