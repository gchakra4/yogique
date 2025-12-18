-- Add user_cancelled and cancelled_at to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS user_cancelled boolean DEFAULT false;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz DEFAULT NULL;

-- Optional: add index for cancelled_at to speed queries
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON public.bookings(cancelled_at);
