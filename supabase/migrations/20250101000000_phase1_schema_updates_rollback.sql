-- ============================================================================
-- PHASE 1 ROLLBACK: Undo Schema Updates
-- Date: 2025-01-01
-- Description: Rollback script to undo Phase 1 changes if needed
-- ============================================================================

-- ============================================================================
-- PART 1: Drop triggers and functions
-- ============================================================================

DROP TRIGGER IF EXISTS trg_set_calendar_month ON public.class_assignments;
DROP FUNCTION IF EXISTS public.set_calendar_month_on_insert() CASCADE;

-- ============================================================================
-- PART 2: Drop views
-- ============================================================================

DROP VIEW IF EXISTS public.adjustment_classes_report_v CASCADE;
DROP VIEW IF EXISTS public.instructor_classes_safe_v CASCADE;

-- ============================================================================
-- PART 3: Drop indexes
-- ============================================================================

DROP INDEX IF EXISTS public.idx_class_assignments_calendar_month;
DROP INDEX IF EXISTS public.idx_class_assignments_is_adjustment;

-- ============================================================================
-- PART 4: Remove columns from class_assignments
-- ============================================================================

ALTER TABLE public.class_assignments
DROP COLUMN IF EXISTS calendar_month CASCADE;

ALTER TABLE public.class_assignments
DROP COLUMN IF EXISTS adjustment_reason CASCADE;

ALTER TABLE public.class_assignments
DROP COLUMN IF EXISTS is_adjustment CASCADE;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

-- Note: bookings.access_status and bookings.billing_cycle_anchor are NOT
-- removed as they existed before Phase 1 and may be in use by other systems.
