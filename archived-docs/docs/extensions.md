# Extensions

Purpose
- Record installed Postgres extensions required by the project.

Command
- psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "COPY (SELECT extname, extversion FROM pg_extension) TO STDOUT WITH CSV HEADER" > docs/extensions.csv

Notes
- Ensure local Postgres has the same extensions enabled before restore (pgcrypto, citext, pg_trgm, etc.).
