-- Add a cancelled_by column to bookings and backfill from existing flags
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancelled_by text;

-- Backfill: if user_cancelled is true, mark cancelled_by = 'user'
UPDATE public.bookings
SET cancelled_by = 'user'
WHERE coalesce(user_cancelled, false) = true
  AND (cancelled_by IS NULL OR cancelled_by = '');

-- Backfill: if status is cancelled and not already marked as user, mark as admin
UPDATE public.bookings
SET cancelled_by = 'admin'
WHERE (status = 'cancelled' OR status = 'canceled')
  AND coalesce(user_cancelled, false) = false
  AND (cancelled_by IS NULL OR cancelled_by = '');

-- Optionally, create an index for quick filtering by cancelled_by
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by ON public.bookings(cancelled_by);
