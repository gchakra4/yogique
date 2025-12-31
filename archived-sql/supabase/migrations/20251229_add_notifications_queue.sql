-- Migration: Add notifications_queue table for centralized notification queue

-- Ensure pgcrypto is available for `gen_random_uuid()` on hosted Postgres
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'whatsapp',
  recipient text,
  template_key text,
  template_language text DEFAULT 'en',
  vars jsonb,
  metadata jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, sent, failed
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  run_after timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_queue_status_run_after ON public.notifications_queue (status, run_after);

COMMENT ON TABLE public.notifications_queue IS 'Queue table for outgoing notifications to be processed by notification-worker';
