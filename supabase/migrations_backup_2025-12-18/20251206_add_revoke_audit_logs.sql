-- Migration: create generic audit_logs table used across admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  action text,
  actor_id uuid,
  actor_role text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes for filtering and time-ordered queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs (entity_id);

-- Optional GIN index on metadata for containment queries (not full-text)
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON public.audit_logs USING GIN (metadata);

-- Enable Row Level Security and add read policy for admins only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'Admins can read audit logs'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can read audit logs" ON public.audit_logs';
  END IF;
END $$;

-- Allow only admins to select from audit_logs
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name IN ('admin','super_admin')
  )
);

-- No INSERT/UPDATE/DELETE policies are defined; service role keys bypass RLS for edge functions.
