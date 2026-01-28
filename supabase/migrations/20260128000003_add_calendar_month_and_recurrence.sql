-- Migration: add calendar_month and optional recurrence metadata to class_assignments
-- Safe: add columns as nullable, backfill calendar_month from existing date, no NOT NULL enforced.

ALTER TABLE IF EXISTS public.class_assignments
  ADD COLUMN IF NOT EXISTS calendar_month TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

-- Backfill calendar_month for rows that have a date
UPDATE public.class_assignments
SET calendar_month = to_char(date::date, 'YYYY-MM')
WHERE calendar_month IS NULL AND date IS NOT NULL;

-- Note: we intentionally do NOT set NOT NULL constraints here to avoid blocking
-- migrations on databases with legacy rows or dependent views. If you want to
-- enforce NOT NULL later, run an additional migration after verifying backfill.
