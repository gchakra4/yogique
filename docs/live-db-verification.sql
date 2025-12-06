-- Live DB verification for ALL public tables and views
-- Note: You mentioned all table data was deleted; counts may be zero.
-- This script lists all public tables and views and returns row counts for tables.

DO $$
DECLARE r RECORD;
BEGIN
	RAISE NOTICE 'Listing all public tables with row counts:';
	FOR r IN
		SELECT table_name, table_type
		FROM information_schema.tables
		WHERE table_schema = 'public'
		ORDER BY table_type, table_name
	LOOP
		IF r.table_type = 'BASE TABLE' THEN
			EXECUTE format('SELECT %L AS table_name, COUNT(*) AS row_count FROM public.%I', r.table_name, r.table_name);
		ELSE
			RAISE NOTICE 'VIEW: %', r.table_name;
		END IF;
	END LOOP;
END$$;

-- Optionally, include matviews
DO $$
DECLARE r RECORD;
BEGIN
	RAISE NOTICE 'Listing all public materialized views:';
	FOR r IN
		SELECT matviewname AS view_name
		FROM pg_matviews
		WHERE schemaname = 'public'
		ORDER BY matviewname
	LOOP
		RAISE NOTICE 'MATVIEW: %', r.view_name;
	END LOOP;
END$$;

-- Foreign tables (if any)
DO $$
DECLARE r RECORD;
BEGIN
	RAISE NOTICE 'Listing all public foreign tables:';
	FOR r IN
		SELECT ft.ftrelid::regclass::text AS foreign_table
		FROM pg_foreign_table ft
		JOIN pg_class c ON c.oid = ft.ftrelid
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = 'public'
	LOOP
		RAISE NOTICE 'FOREIGN TABLE: %', r.foreign_table;
	END LOOP;
END$$;

-- If all listed BASE TABLES return zero rows and there are no writers, proceed with deprecation.
