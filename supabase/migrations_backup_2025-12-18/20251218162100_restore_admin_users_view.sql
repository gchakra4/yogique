-- Restore compatibility for code expecting `public.admin_users`
-- Creates a view that exposes both `id` and `user_id` columns and
-- INSTEAD OF triggers to forward writes to the deprecated table.

BEGIN;

CREATE OR REPLACE VIEW public.admin_users AS
SELECT
  id,
  id AS user_id,
  email,
  role,
  created_at,
  updated_at
FROM public.__deprecated_admin_users_20251206;

-- Insert forwarding
CREATE OR REPLACE FUNCTION public.admin_users_view_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.__deprecated_admin_users_20251206(id,email,role,created_at,updated_at)
  VALUES (
    COALESCE(NEW.id, NEW.user_id, gen_random_uuid()),
    NEW.email,
    COALESCE(NEW.role,'admin'),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER admin_users_view_insert
INSTEAD OF INSERT ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.admin_users_view_insert();

-- Update forwarding
CREATE OR REPLACE FUNCTION public.admin_users_view_update() RETURNS trigger AS $$
BEGIN
  UPDATE public.__deprecated_admin_users_20251206
  SET
    email = COALESCE(NEW.email, OLD.email),
    role = COALESCE(NEW.role, OLD.role),
    updated_at = COALESCE(NEW.updated_at, now())
  WHERE id = COALESCE(OLD.id, OLD.user_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER admin_users_view_update
INSTEAD OF UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.admin_users_view_update();

-- Delete forwarding
CREATE OR REPLACE FUNCTION public.admin_users_view_delete() RETURNS trigger AS $$
BEGIN
  DELETE FROM public.__deprecated_admin_users_20251206
  WHERE id = COALESCE(OLD.id, OLD.user_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER admin_users_view_delete
INSTEAD OF DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.admin_users_view_delete();

COMMIT;
