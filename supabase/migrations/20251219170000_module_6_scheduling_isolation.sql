-- ============================================================================
-- MODULE 6: SCHEDULING ISOLATION
-- ============================================================================
-- Purpose: Remove payment visibility from instructor views and enforce access control
-- Dependencies: Module 5 (access_status), Module 1 (booking lifecycle)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE FUNCTION: Check if instructor can view assignment
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_view_assignment(p_assignment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_booking_access_status text;
    v_class_status text;
BEGIN
    -- Get booking access status and class status
    SELECT 
        b.access_status,
        ca.class_status
    INTO 
        v_booking_access_status,
        v_class_status
    FROM public.class_assignments ca
    JOIN public.assignment_bookings ab ON ab.assignment_id = ca.id
    JOIN public.bookings b ON b.booking_id = ab.booking_id::text
    WHERE ca.id = p_assignment_id
    LIMIT 1;

    -- Allow viewing if:
    -- 1. Class is already completed/cancelled (historical record)
    -- 2. Access status is active or overdue_grace (not locked)
    IF v_class_status IN ('completed', 'not_conducted', 'cancelled', 'rescheduled') THEN
        RETURN true;
    END IF;

    IF v_booking_access_status IN ('active', 'overdue_grace') THEN
        RETURN true;
    END IF;

    -- Block if overdue_locked
    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_view_assignment IS 'Check if instructor can view assignment based on booking payment status';

-- ----------------------------------------------------------------------------
-- 2. CREATE VIEW: Instructor classes (no payment data)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.instructor_classes_v AS
SELECT 
    ca.id AS assignment_id,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.class_status,
    ca.attendance_locked,
    ca.created_at,
    ca.updated_at,
    ca.instructor_id,
    ct.id AS class_type_id,
    ct.name AS class_type_name,
    ct.duration_minutes,
    b.id AS booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS student_name,
    b.access_status,
    b.status AS booking_status,
    -- NO payment_amount, NO earnings, NO financial data
    CASE 
        WHEN b.access_status = 'overdue_locked' AND ca.class_status NOT IN ('completed', 'not_conducted', 'cancelled', 'rescheduled') THEN true
        ELSE false
    END AS is_blocked
FROM public.class_assignments ca
LEFT JOIN public.class_types ct ON ct.id = ca.class_type_id
LEFT JOIN public.assignment_bookings ab ON ab.assignment_id = ca.id
LEFT JOIN public.bookings b ON b.booking_id = ab.booking_id::text
WHERE 
    -- Only show if can_view_assignment passes
    public.can_view_assignment(ca.id) = true;

COMMENT ON VIEW public.instructor_classes_v IS 'Instructor-facing view without payment data';

-- ----------------------------------------------------------------------------
-- 3. CREATE VIEW: Instructor upcoming classes (next 60 days)
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.instructor_upcoming_classes_v CASCADE;

CREATE OR REPLACE VIEW public.instructor_upcoming_classes_v AS
SELECT *
FROM public.instructor_classes_v
WHERE date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '60 days'
  AND class_status IN ('scheduled', 'rescheduled')
ORDER BY date ASC, start_time ASC;

COMMENT ON VIEW public.instructor_upcoming_classes_v IS 'Instructor upcoming classes (next 60 days, no payment data)';

-- ----------------------------------------------------------------------------
-- 4. CREATE VIEW: Instructor completed classes (no payment data)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.instructor_completed_classes_v AS
SELECT 
    assignment_id,
    date,
    start_time,
    end_time,
    class_status,
    instructor_id,
    class_type_name,
    student_name,
    booking_ref,
    booking_status
FROM public.instructor_classes_v
WHERE class_status = 'completed'
ORDER BY date DESC;

COMMENT ON VIEW public.instructor_completed_classes_v IS 'Instructor completed classes (no payment data)';

-- ----------------------------------------------------------------------------
-- 5. CREATE FUNCTION: Get assignment roster (no booking payment status)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_assignment_roster_instructor(p_assignment_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    -- Check if instructor can view this assignment
    IF NOT public.can_view_assignment(p_assignment_id) THEN
        RETURN json_build_object(
            'error', 'Access denied: Booking payment overdue',
            'attendees', '[]'::json
        );
    END IF;

    SELECT json_agg(
        json_build_object(
            'booking_id', b.id,
            'booking_ref', b.booking_id,
            'student_name', b.first_name || ' ' || b.last_name,
            'attendance_status', aa.attendance_status,
            'access_status', b.access_status,
            'is_blocked', CASE WHEN b.access_status = 'overdue_locked' THEN true ELSE false END
            -- NO payment_amount, NO earnings
        )
        ORDER BY b.first_name, b.last_name
    )
    INTO v_result
    FROM public.assignment_bookings ab
    JOIN public.bookings b ON b.booking_id = ab.booking_id::text
    LEFT JOIN public.assignment_attendance aa ON aa.assignment_id = ab.assignment_id AND aa.booking_id = b.id
    WHERE ab.assignment_id = p_assignment_id;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$;

COMMENT ON FUNCTION public.get_assignment_roster_instructor IS 'Get assignment roster for instructors (no payment data)';

-- ----------------------------------------------------------------------------
-- 6. UPDATE RLS POLICIES: Block instructor access to financial tables
-- ----------------------------------------------------------------------------

-- Drop existing policies if they exist (from Module 0)
DROP POLICY IF EXISTS instructors_read_invoices ON public.invoices;
DROP POLICY IF EXISTS instructors_read_payment_links ON public.payment_links;
DROP POLICY IF EXISTS instructors_read_transactions ON public.transactions;

-- Invoices: Instructors CANNOT read invoices at all
CREATE POLICY instructors_block_invoices
    ON public.invoices
    FOR SELECT
    TO authenticated
    USING (
        -- Only allow if user is an admin/staff (exclude instructor role check since no instructors table)
        -- For now, block all non-service reads by default
        false
    );

-- Payment Links: Instructors CANNOT read payment links
CREATE POLICY instructors_block_payment_links
    ON public.payment_links
    FOR SELECT
    TO authenticated
    USING (
        -- Block by default for instructors
        false
    );

-- Transactions: Instructors CANNOT read transactions
CREATE POLICY instructors_block_transactions
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        -- Block by default for instructors
        false
    );

COMMENT ON POLICY instructors_block_invoices ON public.invoices IS 'Block instructors from viewing invoices';
COMMENT ON POLICY instructors_block_payment_links ON public.payment_links IS 'Block instructors from viewing payment links';
COMMENT ON POLICY instructors_block_transactions ON public.transactions IS 'Block instructors from viewing transactions';

-- ----------------------------------------------------------------------------
-- 7. UPDATE CLASS_ASSIGNMENTS: Add validation trigger
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_class_assignment_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_id uuid;
    v_can_schedule json;
BEGIN
    -- Get booking_id from assignment_bookings
    SELECT b.id INTO v_booking_id
    FROM public.assignment_bookings ab
    JOIN public.bookings b ON b.booking_id = ab.booking_id::text
    WHERE ab.assignment_id = NEW.id
    LIMIT 1;

    -- Skip validation if no booking found (single classes, etc.)
    IF v_booking_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if scheduling is allowed
    v_can_schedule := public.can_schedule_class(v_booking_id);

    IF (v_can_schedule->>'can_schedule')::boolean = false THEN
        RAISE EXCEPTION 'Cannot schedule class: %', v_can_schedule->>'reason';
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_class_assignment_access_trigger ON public.class_assignments;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER validate_class_assignment_access_trigger
    BEFORE INSERT OR UPDATE
    ON public.class_assignments
    FOR EACH ROW
    WHEN (NEW.class_status = 'scheduled' OR NEW.class_status = 'rescheduled')
    EXECUTE FUNCTION public.validate_class_assignment_access();

COMMENT ON FUNCTION public.validate_class_assignment_access IS 'Validate booking access before scheduling classes';
COMMENT ON TRIGGER validate_class_assignment_access_trigger ON public.class_assignments IS 'Enforce access control on class scheduling';

-- ----------------------------------------------------------------------------
-- 8. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Instructors can read instructor-specific views
GRANT SELECT ON public.instructor_classes_v TO authenticated;
GRANT SELECT ON public.instructor_upcoming_classes_v TO authenticated;
GRANT SELECT ON public.instructor_completed_classes_v TO authenticated;

-- Instructors can execute roster function
GRANT EXECUTE ON FUNCTION public.get_assignment_roster_instructor TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_assignment TO authenticated;

-- ============================================================================
-- END MODULE 6
-- ============================================================================
