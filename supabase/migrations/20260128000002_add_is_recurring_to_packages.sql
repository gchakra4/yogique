-- Add is_recurring column to class_packages table
-- Migration: 2026-01-28 00:00:02

BEGIN;

-- Add is_recurring column without NOT NULL constraint first
ALTER TABLE class_packages 
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Update all existing rows to set is_recurring based on course_type
-- Regular packages = recurring (monthly billing), Crash courses = one-time
UPDATE class_packages 
SET is_recurring = COALESCE(is_recurring, (course_type = 'regular'), false);

-- Now add NOT NULL constraint after all values are set
ALTER TABLE class_packages 
    ALTER COLUMN is_recurring SET NOT NULL;

-- Add comment
COMMENT ON COLUMN class_packages.is_recurring IS 'TRUE for monthly recurring packages (automated billing), FALSE for one-time/crash courses';

-- Add index for filtering recurring packages
CREATE INDEX IF NOT EXISTS idx_class_packages_is_recurring 
    ON class_packages (is_recurring) 
    WHERE is_active = true;

COMMIT;

-- Validation query:
-- SELECT id, name, course_type, is_recurring FROM class_packages ORDER BY created_at DESC LIMIT 10;
