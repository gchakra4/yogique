-- Migration: create otp_codes table
-- Adds table to store OTP codes for verification across channels

-- Ensure extension for gen_random_uuid is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  phone text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  provider text NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes (phone);
CREATE INDEX IF NOT EXISTS otp_codes_user_id_idx ON otp_codes (user_id);
CREATE INDEX IF NOT EXISTS otp_codes_expires_at_idx ON otp_codes (expires_at);
