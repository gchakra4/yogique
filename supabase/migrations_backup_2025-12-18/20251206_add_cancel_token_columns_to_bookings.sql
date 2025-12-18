-- Add cancel_token and cancel_token_expires_at to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancel_token text;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancel_token_expires_at timestamptz DEFAULT NULL;

-- Optional index to help lookups by token
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token ON public.bookings(cancel_token);
