-- Drop compatibility view so the real `admin_users` table can be restored
BEGIN;

DROP VIEW IF EXISTS public.admin_users CASCADE;

COMMIT;
