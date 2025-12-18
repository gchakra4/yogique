-- Migration: Add whatsapp_notified and email_notified flags to class_assignments
-- Run this against your Supabase/Postgres database (e.g., via psql or Supabase SQL editor)

ALTER TABLE IF EXISTS class_assignments
  ADD COLUMN IF NOT EXISTS whatsapp_notified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notified boolean DEFAULT false;

-- Optional: set existing rows to false explicitly (not strictly necessary)
UPDATE class_assignments SET whatsapp_notified = false WHERE whatsapp_notified IS NULL;
UPDATE class_assignments SET email_notified = false WHERE email_notified IS NULL;
