-- Add unique constraint to support INSERT ... ON CONFLICT (user_id, role_id)
BEGIN;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_class t ON c.conrelid = t.oid
		JOIN pg_namespace n ON t.relnamespace = n.oid
		WHERE c.conname = 'user_roles_user_id_role_id_key'
			AND t.relname = 'user_roles'
			AND n.nspname = 'public'
	) THEN
		ALTER TABLE public.user_roles
		ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);
	END IF;
END$$;

COMMIT;
