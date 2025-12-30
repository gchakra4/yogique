-- Migration: Add email-specific fields to notifications_queue

ALTER TABLE public.notifications_queue 
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS html text,
  ADD COLUMN IF NOT EXISTS bcc text,
  ADD COLUMN IF NOT EXISTS "from" text;

COMMENT ON COLUMN public.notifications_queue.subject IS 'Email subject (required for channel=email)';
COMMENT ON COLUMN public.notifications_queue.html IS 'Email HTML body (required for channel=email)';
COMMENT ON COLUMN public.notifications_queue.bcc IS 'Email BCC recipients (comma-separated)';
COMMENT ON COLUMN public.notifications_queue."from" IS 'Email from address (optional, uses default if not provided)';
