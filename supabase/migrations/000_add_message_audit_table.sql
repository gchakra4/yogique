-- Migration: Add message_audit table to record per-user notifications
-- Run this against your Supabase/Postgres database (e.g., via psql or Supabase SQL editor)

CREATE TABLE IF NOT EXISTS message_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES class_assignments(id) ON DELETE CASCADE,
  user_id uuid,
  channel text NOT NULL,
  recipient text,
  provider text,
  provider_message_id text,
  status text,
  attempts int DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  last_updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_audit_provider_message_id ON message_audit(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_class_channel ON message_audit(class_id, channel);
