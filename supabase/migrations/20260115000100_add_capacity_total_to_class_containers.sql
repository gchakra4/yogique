-- Migration: 2026-01-15 00:01:00
-- Add `capacity_total` column to `class_containers` to match application code expectations.
-- Backfill from existing `max_booking_count` where appropriate.
-- Run this migration against the target database (dev/staging/production) using your usual migration tooling.
-- After applying, refresh PostgREST / schema cache if required by your API gateway.

BEGIN;

ALTER TABLE IF EXISTS class_containers
  ADD COLUMN IF NOT EXISTS capacity_total INTEGER;

-- Backfill: if `max_booking_count` exists, copy its value into `capacity_total` for existing rows
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'class_containers' AND column_name = 'max_booking_count') > 0 THEN
    UPDATE class_containers
    SET capacity_total = max_booking_count
    WHERE capacity_total IS NULL AND max_booking_count IS NOT NULL;
  END IF;
END$$;

COMMIT;

-- NOTE: After running, refresh PostgREST schema cache so the new column is visible to the API.