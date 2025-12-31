-- Migration: enable RLS and restrict access to message_audit and otp_codes
-- Only users with 'super_admin' role (via user_roles->roles) or service_role may SELECT

-- Enable extension checks (no-op if present)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable Row Level Security on message_audit
ALTER TABLE IF EXISTS public.message_audit ENABLE ROW LEVEL SECURITY;

-- Restrict SELECT on message_audit to service_role or users who have 'super_admin' role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'message_audit' AND p.policyname = 'allow_super_admin_select_message_audit'
  ) THEN
    CREATE POLICY allow_super_admin_select_message_audit ON public.message_audit
      FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND lower(r.name) = 'super_admin'
        )
      );
  END IF;
END$$;

-- Enable Row Level Security on otp_codes
ALTER TABLE IF EXISTS public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Restrict SELECT on otp_codes to service_role or users who have 'super_admin' role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'otp_codes' AND p.policyname = 'allow_super_admin_select_otp_codes'
  ) THEN
    CREATE POLICY allow_super_admin_select_otp_codes ON public.otp_codes
      FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND lower(r.name) = 'super_admin'
        )
      );
  END IF;
END$$;

-- Note: Inserts/updates to these tables are generally performed by server-side functions using
-- the service_role key (which bypasses RLS). If you need to allow specific authenticated
-- users to INSERT/UPDATE, add appropriate policies that restrict by role similarly.
