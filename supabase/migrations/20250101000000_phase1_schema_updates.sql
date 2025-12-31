-- ============================================================================
-- PHASE 1: DATABASE SCHEMA UPDATES
-- Date: 2025-01-01
-- Description: Add columns for adjustment classes, calendar month tracking,
--              and create instructor-safe views that strip pricing info
-- ============================================================================

-- ============================================================================
-- PART 1: Add columns to class_assignments table
-- ============================================================================

-- Add is_adjustment column to track adjustment classes
-- (classes added to fill calendar month shortfalls)
ALTER TABLE public.class_assignments
ADD COLUMN IF NOT EXISTS is_adjustment boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.class_assignments.is_adjustment IS 
'TRUE if this class was auto-generated to fill calendar month shortfall. FALSE for normal scheduled classes.';

-- Add adjustment_reason column to explain why adjustment was needed
ALTER TABLE public.class_assignments
ADD COLUMN IF NOT EXISTS adjustment_reason text;

COMMENT ON COLUMN public.class_assignments.adjustment_reason IS 
'Explanation for why this adjustment class was created (e.g., "calendar shortage - only 4 Mondays this month, need 5 classes")';

-- Add calendar_month column to track which billing month this belongs to
-- Format: YYYY-MM (e.g., "2025-01", "2025-02")
ALTER TABLE public.class_assignments
ADD COLUMN IF NOT EXISTS calendar_month text;

COMMENT ON COLUMN public.class_assignments.calendar_month IS 
'Calendar month this class belongs to in YYYY-MM format. Used for monthly subscription billing and scheduling boundaries.';

-- Create index for calendar_month queries (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_class_assignments_calendar_month 
ON public.class_assignments(calendar_month);

-- Create index for adjustment classes (for reporting)
CREATE INDEX IF NOT EXISTS idx_class_assignments_is_adjustment 
ON public.class_assignments(is_adjustment) 
WHERE is_adjustment = true;

-- ============================================================================
-- PART 2: Fix existing validation function to align with new business logic
-- ============================================================================

-- Update validate_class_assignment_access to check access_status instead of booking status
-- This aligns with Phase 2 business rule: access_status controls scheduling, not booking status
CREATE OR REPLACE FUNCTION public.validate_class_assignment_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_access_status text;
    v_booking_status text;
BEGIN
    -- Only validate for scheduled or rescheduled classes
    IF NEW.class_status NOT IN ('scheduled', 'rescheduled') THEN
        RETURN NEW;
    END IF;

    -- Get the access_status from linked bookings
    SELECT b.access_status, b.status INTO v_access_status, v_booking_status
    FROM public.assignment_bookings ab
    JOIN public.bookings b ON b.booking_id = ab.booking_id
    WHERE ab.assignment_id = NEW.id
    LIMIT 1;

    -- If no booking found, allow (will be caught by Phase 2 validation)
    IF v_access_status IS NULL THEN
        RETURN NEW;
    END IF;

    -- PHASE 2 BUSINESS RULE: Only block if access_status is 'overdue_locked'
    -- Allow 'active' and 'overdue_grace'
    -- Booking status no longer matters - access_status controls scheduling
    IF v_access_status = 'overdue_locked' THEN
        RAISE EXCEPTION 'Cannot schedule class: Payment is overdue. Please clear outstanding dues first.';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_class_assignment_access() IS 
'Validate booking access_status before scheduling classes. Blocks only when overdue_locked. Aligns with Phase 2 business rules.';

-- ============================================================================
-- PART 3: Verify bookings table has required columns
-- ============================================================================
-- NOTE: These columns already exist, this is just documentation

-- Verify access_status exists (enum type)
-- Values: 'active', 'overdue_grace', 'overdue_locked'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'access_status'
    ) THEN
        RAISE EXCEPTION 'ERROR: bookings.access_status column is missing!';
    END IF;
END $$;

-- Verify billing_cycle_anchor exists (date)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'billing_cycle_anchor'
    ) THEN
        RAISE EXCEPTION 'ERROR: bookings.billing_cycle_anchor column is missing!';
    END IF;
END $$;

-- ============================================================================
-- PART 4: Create instructor-safe view (strips all pricing information)
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.instructor_classes_safe_v CASCADE;

-- Create instructor-safe view that excludes all payment/pricing data
CREATE OR REPLACE VIEW public.instructor_classes_safe_v AS
SELECT 
    ca.id,
    ca.scheduled_class_id,
    ca.instructor_id,
    ca.class_type_id,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.schedule_type,
    ca.class_status,
    ca.notes,
    ca.assigned_at,
    ca.created_at,
    ca.updated_at,
    ca.instructor_status,
    ca.instructor_response_at,
    ca.instructor_remarks,
    ca.rejection_reason,
    ca.booking_type,
    ca.timezone,
    ca.created_in_timezone,
    ca.assignment_method,
    ca.recurrence_days,
    ca.parent_assignment_id,
    ca.attendance_locked,
    ca.actual_start_time,
    ca.actual_end_time,
    ca.rescheduled_to_id,
    ca.rescheduled_from_id,
    ca.class_package_id,
    ca.assignment_code,
    ca.zoom_meeting,
    ca.whatsapp_notified,
    ca.email_notified,
    -- NEW Phase 1 columns (visible to instructors)
    ca.is_adjustment,
    ca.adjustment_reason,
    ca.calendar_month,
    -- Join to get student roster via assignment_bookings
    (
        SELECT json_agg(
            json_build_object(
                'booking_id', ab.booking_id,
                'student_name', (b.first_name || ' ' || b.last_name),
                'email', b.email,
                'booking_type', b.booking_type
            )
        )
        FROM public.assignment_bookings ab
        JOIN public.bookings b ON b.booking_id = ab.booking_id
        WHERE ab.assignment_id = ca.id
    ) AS students,
    -- Attendance count (instructors can see this)
    (
        SELECT COUNT(*) 
        FROM public.class_attendance att 
        WHERE att.assignment_id = ca.id 
        AND att.status = 'present'
    ) AS present_count,
    (
        SELECT COUNT(*) 
        FROM public.class_attendance att 
        WHERE att.assignment_id = ca.id 
        AND att.status IN ('absent_excused', 'absent_unexcused')
    ) AS absent_count
FROM public.class_assignments ca
WHERE 
    -- Only show classes for the current instructor
    ca.instructor_id = auth.uid()
    -- Apply access control based on booking payment status
    AND public.can_view_assignment(ca.id) = true;

-- Add comment
COMMENT ON VIEW public.instructor_classes_safe_v IS 
'Instructor-safe view of class assignments. EXCLUDES all payment/pricing data (payment_amount, payment_status, package prices, etc). Instructors see schedule, students, attendance only.';

-- Grant permissions
GRANT SELECT ON public.instructor_classes_safe_v TO authenticated;

-- ============================================================================
-- PART 5: Create helper function to auto-populate calendar_month
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_calendar_month_on_insert()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-populate calendar_month from date if not provided
    -- Only for monthly schedule types
    IF NEW.calendar_month IS NULL AND NEW.schedule_type = 'monthly' AND NEW.date IS NOT NULL THEN
        NEW.calendar_month := TO_CHAR(NEW.date, 'YYYY-MM');
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_calendar_month_on_insert() IS 
'Auto-populate calendar_month field from date for monthly assignments';

-- Create trigger to auto-set calendar_month
DROP TRIGGER IF EXISTS trg_set_calendar_month ON public.class_assignments;

CREATE TRIGGER trg_set_calendar_month
    BEFORE INSERT OR UPDATE OF date, schedule_type
    ON public.class_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_calendar_month_on_insert();

-- ============================================================================
-- PART 6: Update existing monthly assignments with calendar_month
-- ============================================================================

-- Backfill calendar_month for existing monthly assignments
UPDATE public.class_assignments
SET calendar_month = TO_CHAR(date, 'YYYY-MM')
WHERE schedule_type = 'monthly' 
  AND date IS NOT NULL
  AND calendar_month IS NULL;

-- ============================================================================
-- PART 7: Create view for adjustment classes report
-- ============================================================================

CREATE OR REPLACE VIEW public.adjustment_classes_report_v AS
SELECT 
    ca.id,
    ca.calendar_month,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.instructor_id,
    p.full_name as instructor_name,
    ca.class_type_id,
    ct.name as class_type_name,
    ca.is_adjustment,
    ca.adjustment_reason,
    ca.class_status,
    ca.payment_amount,
    ca.assigned_at
FROM public.class_assignments ca
LEFT JOIN public.profiles p ON p.user_id = ca.instructor_id
LEFT JOIN public.class_types ct ON ct.id = ca.class_type_id
WHERE ca.is_adjustment = true
ORDER BY ca.calendar_month DESC, ca.date DESC;

COMMENT ON VIEW public.adjustment_classes_report_v IS 
'Report view showing all adjustment classes for admin monitoring and audit';

GRANT SELECT ON public.adjustment_classes_report_v TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
