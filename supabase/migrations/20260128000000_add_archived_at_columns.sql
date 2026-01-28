-- Add archived_at column to class_containers and class_assignments for soft delete/archive functionality
-- Migration: 2026-01-28 00:00:00

BEGIN;

-- Add archived_at column to class_containers
ALTER TABLE IF EXISTS class_containers
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add archived_at column to class_assignments
ALTER TABLE IF EXISTS class_assignments
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add is_active column to class_assignments if it doesn't exist
ALTER TABLE IF EXISTS class_assignments
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add index for filtering archived records
CREATE INDEX IF NOT EXISTS idx_class_containers_archived 
    ON class_containers (archived_at) WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_class_assignments_archived 
    ON class_assignments (archived_at) WHERE archived_at IS NOT NULL;

-- Add index for active records (common query)
CREATE INDEX IF NOT EXISTS idx_class_containers_active 
    ON class_containers (is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_class_assignments_active 
    ON class_assignments (is_active) WHERE is_active = TRUE;

COMMIT;

-- Validation queries:
-- Check columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'class_containers' AND column_name = 'archived_at';
-- 
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'class_assignments' AND column_name = 'archived_at';
--
-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('class_containers', 'class_assignments');
