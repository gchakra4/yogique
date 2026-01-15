-- Migration: 2026-01-15 00:02:00
-- Add `start_date`, `end_date`, `timezone`, and `status` columns to `class_containers`.
-- Run this migration against the target database (dev/staging/production) using your usual migration tooling.
-- After applying, refresh PostgREST / schema cache if required by your API gateway.

BEGIN;

ALTER TABLE IF EXISTS class_containers
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Optional: ensure non-null/default values where you need them
-- UPDATE class_containers SET status = 'draft' WHERE status IS NULL;

COMMIT;

-- NOTE: After running, refresh PostgREST schema cache so the new columns are visible to the API.
