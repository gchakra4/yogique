-- Add whatsapp opt-in flag and timestamp to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at timestamptz DEFAULT NULL;

-- Add an index to efficiently query opted-in users (useful for sending notifications)
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_opt_in ON public.profiles (whatsapp_opt_in);
