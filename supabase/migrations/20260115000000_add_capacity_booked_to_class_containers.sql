-- Migration: 2026-01-15 00:00:00
-- Add `capacity_booked` column to `class_containers` to match application code expectations.
-- Run this migration against the target database (dev/staging/production) using your usual migration tooling.
-- After applying, refresh PostgREST / schema cache if required by your API gateway.

BEGIN;

-- Add column if not exists, default 0 for backward compatibility
ALTER TABLE IF EXISTS class_containers
  ADD COLUMN IF NOT EXISTS capacity_booked INTEGER DEFAULT 0;

-- Optional: ensure no NULL values (set to 0 where NULL)
UPDATE class_containers
SET capacity_booked = 0
WHERE capacity_booked IS NULL;

COMMIT;

-- NOTE: If your code uses other column names (e.g., current_booking_count/max_booking_count),
-- consider harmonizing naming or adding views/compatibility layers. Also restart/refresh PostgREST
-- schema cache so the new column is visible to the API.
