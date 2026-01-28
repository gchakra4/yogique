-- Migration: add adjustment tracking fields to class_assignments
-- These fields allow marking classes as adjustment/makeup classes with reasons

ALTER TABLE IF EXISTS public.class_assignments
  ADD COLUMN IF NOT EXISTS is_adjustment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- Add helpful comments
COMMENT ON COLUMN public.class_assignments.is_adjustment IS 
  'Marks this class as an adjustment/makeup class (e.g., to fill shortfalls)';
  
COMMENT ON COLUMN public.class_assignments.adjustment_reason IS 
  'Explanation for why this adjustment class was created';

-- Create index for querying adjustment classes
CREATE INDEX IF NOT EXISTS idx_class_assignments_is_adjustment 
  ON public.class_assignments(is_adjustment) 
  WHERE is_adjustment = true;
