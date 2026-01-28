-- Migration: make instructor_id optional in class_assignments
-- This allows creating class schedules first and assigning instructors later

-- Drop NOT NULL constraint on instructor_id
ALTER TABLE IF EXISTS public.class_assignments
  ALTER COLUMN instructor_id DROP NOT NULL;

-- Add a helpful comment
COMMENT ON COLUMN public.class_assignments.instructor_id IS 
  'Instructor assigned to this class. Can be NULL initially and assigned later.';
