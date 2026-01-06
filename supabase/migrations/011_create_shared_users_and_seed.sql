-- 011_create_shared_users_and_seed.sql
-- Create `shared.users` (if missing) and seed/sync from `auth.users`.
-- Idempotent: safe to run multiple times in dev.

BEGIN;

-- ensure schema exists
CREATE SCHEMA IF NOT EXISTS shared;

-- create table if missing
CREATE TABLE IF NOT EXISTS shared.users (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  first_name text,
  last_name text,
  role text,
  company_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_shared_users_email ON shared.users (email);

-- Insert missing users from auth.users
INSERT INTO shared.users (id, email, phone, first_name, last_name, role, company_id, created_at, metadata)
SELECT
  u.id,
  u.email,
  (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'phone')::text,
  (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'first_name')::text,
  (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'last_name')::text,
  COALESCE((COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'role'), (COALESCE(u.raw_app_meta_data, '{}'::jsonb)->>'role'), u.role, 'consumer'),
  (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'company_id')::uuid,
  u.created_at,
  COALESCE(u.raw_user_meta_data, u.raw_app_meta_data, '{}'::jsonb)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM shared.users s WHERE s.id = u.id);

-- Update existing rows where key fields differ
UPDATE shared.users s
SET
  email = u.email,
  phone = (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'phone')::text,
  first_name = (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'first_name')::text,
  last_name = (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'last_name')::text,
  role = COALESCE((COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'role'), (COALESCE(u.raw_app_meta_data, '{}'::jsonb)->>'role'), u.role, s.role),
  company_id = (COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'company_id')::uuid,
  metadata = COALESCE(u.raw_user_meta_data, u.raw_app_meta_data, '{}'::jsonb),
  updated_at = now()
FROM auth.users u
WHERE s.id = u.id
  AND (
    s.email IS DISTINCT FROM u.email
    OR s.metadata IS DISTINCT FROM COALESCE(u.raw_user_meta_data, u.raw_app_meta_data, '{}'::jsonb)
    OR s.role IS DISTINCT FROM COALESCE((COALESCE(u.raw_user_meta_data, '{}'::jsonb)->>'role'), (COALESCE(u.raw_app_meta_data, '{}'::jsonb)->>'role'), u.role, s.role)
  );

COMMIT;

-- Notes:
-- - This creates a simple `shared.users` table and populates it from `auth.users` user_metadata/app_metadata.
-- - Fields are conservative; extend as needed. Run in dev Supabase SQL editor with service_role privileges.
