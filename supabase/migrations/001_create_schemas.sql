-- 001_create_schemas.sql
-- Phase 1: create new schemas for enterprise migration
-- Safe: non-destructive; moves `notifications_queue` only if it exists in `public`.

BEGIN;

CREATE SCHEMA IF NOT EXISTS corporate;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS shared;

-- Move notifications_queue from public to shared if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications_queue'
  ) THEN
    ALTER TABLE public.notifications_queue SET SCHEMA shared;
  END IF;
END$$;

COMMIT;

-- NOTE: To apply this migration run it against the target Postgres instance
-- using your preferred migration tooling (psql, supabase CLI or db client).