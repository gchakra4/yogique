# Relationships & Foreign Keys

Contents
- `docs/foreign-keys.csv` — foreign key list (source_table, column, target_table, target_column, constraint).

Command to generate
- psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\copy (SELECT tc.table_name AS table, kcu.column_name AS column, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' ORDER BY tc.table_name) TO 'docs/foreign-keys.csv' CSV HEADER"
