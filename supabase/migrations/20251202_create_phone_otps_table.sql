-- Create phone_otps table for storing OTPs (hashed)
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz NULL
);

-- Index for quick lookup by phone and by user
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON public.phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_user_id ON public.phone_otps(user_id);
