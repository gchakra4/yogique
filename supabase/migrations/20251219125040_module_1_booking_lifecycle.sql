-- ============================================================================
-- MODULE 1: Booking Lifecycle Management
-- ============================================================================
-- Purpose: Manage booking lifecycle and access control state
-- Owns: booking creation, access_status transitions, booking metadata
-- Does NOT: generate invoices, handle payments, schedule classes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD BILLING_CYCLE_ANCHOR COLUMN
-- ----------------------------------------------------------------------------

-- Add billing cycle anchor (when monthly billing started)
ALTER TABLE public.bookings 
ADD COLUMN billing_cycle_anchor date;

-- Add index for billing queries
CREATE INDEX idx_bookings_billing_cycle_anchor ON public.bookings(billing_cycle_anchor);

-- Comment
COMMENT ON COLUMN public.bookings.billing_cycle_anchor IS 'Date when monthly billing started for this booking. NULL for one-time bookings. Used to calculate billing periods.';

-- ----------------------------------------------------------------------------
-- 2. ADD BOOKING_TYPE ENUM (if not already categorized)
-- ----------------------------------------------------------------------------

-- Add is_recurring flag to distinguish monthly vs one-time
ALTER TABLE public.bookings 
ADD COLUMN is_recurring boolean DEFAULT false;

-- Comment
COMMENT ON COLUMN public.bookings.is_recurring IS 'TRUE for monthly recurring bookings, FALSE for one-time/crash courses';

-- ----------------------------------------------------------------------------
-- 3. CREATE ACCESS STATUS TRANSITION FUNCTION
-- ----------------------------------------------------------------------------

-- Function to transition booking access status
CREATE OR REPLACE FUNCTION public.transition_booking_access_status(
    p_booking_id uuid,
    p_new_status public.access_status,
    p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_status public.access_status;
    v_booking_record record;
    v_result json;
BEGIN
    -- Get current booking status
    SELECT access_status, booking_id, user_id, first_name, last_name, email
    INTO v_booking_record
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking not found',
            'booking_id', p_booking_id
        );
    END IF;

    v_current_status := v_booking_record.access_status;

    -- Validate state transition
    -- Valid transitions:
    -- active -> overdue_grace
    -- active -> overdue_locked (skip grace if needed)
    -- overdue_grace -> overdue_locked
    -- overdue_grace -> active (payment received)
    -- overdue_locked -> active (payment received)
    
    IF v_current_status = p_new_status THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Status unchanged',
            'booking_id', p_booking_id,
            'status', v_current_status
        );
    END IF;

    -- Perform the update
    UPDATE public.bookings
    SET 
        access_status = p_new_status,
        updated_at = now()
    WHERE id = p_booking_id;

    -- Log the transition (for audit trail)
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        reason
    ) VALUES (
        'bookings',
        p_booking_id,
        'access_status_transition',
        json_build_object('access_status', v_current_status),
        json_build_object('access_status', p_new_status),
        p_reason
    );

    -- Return success
    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'booking_ref', v_booking_record.booking_id,
        'user_id', v_booking_record.user_id,
        'customer_name', v_booking_record.first_name || ' ' || v_booking_record.last_name,
        'customer_email', v_booking_record.email,
        'old_status', v_current_status,
        'new_status', p_new_status,
        'transitioned_at', now(),
        'reason', p_reason
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'booking_id', p_booking_id
        );
END;
$$;

-- Comment
COMMENT ON FUNCTION public.transition_booking_access_status IS 'Transition booking access_status with validation and audit logging. Does NOT calculate timing - that is Module 5 responsibility.';

-- ----------------------------------------------------------------------------
-- 4. CREATE FUNCTION TO CHECK IF BOOKING IS RECURRING
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_recurring_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_is_recurring boolean;
    v_has_package boolean;
    v_package_type text;
BEGIN
    -- Check if booking has is_recurring flag set
    SELECT 
        COALESCE(b.is_recurring, false),
        b.class_package_id IS NOT NULL,
        cp.type
    INTO 
        v_is_recurring,
        v_has_package,
        v_package_type
    FROM public.bookings b
    LEFT JOIN public.class_packages cp ON cp.id = b.class_package_id
    WHERE b.id = p_booking_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- If explicitly marked as recurring, trust that
    IF v_is_recurring THEN
        RETURN true;
    END IF;

    -- Otherwise infer from package type
    IF v_has_package AND v_package_type IN ('monthly', 'subscription') THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_recurring_booking IS 'Determine if a booking is monthly recurring (vs one-time/crash course)';

-- ----------------------------------------------------------------------------
-- 5. CREATE FUNCTION TO INITIALIZE BILLING CYCLE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.initialize_billing_cycle(
    p_booking_id uuid,
    p_start_date date DEFAULT CURRENT_DATE
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_record record;
    v_result json;
BEGIN
    -- Get booking details
    SELECT id, booking_id, is_recurring, billing_cycle_anchor, class_package_id
    INTO v_booking_record
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking not found'
        );
    END IF;

    -- Only initialize for recurring bookings
    IF NOT COALESCE(v_booking_record.is_recurring, false) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot initialize billing cycle for non-recurring booking'
        );
    END IF;

    -- Check if already initialized
    IF v_booking_record.billing_cycle_anchor IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Billing cycle already initialized',
            'existing_anchor', v_booking_record.billing_cycle_anchor
        );
    END IF;

    -- Set the billing cycle anchor
    UPDATE public.bookings
    SET 
        billing_cycle_anchor = p_start_date,
        updated_at = now()
    WHERE id = p_booking_id;

    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'booking_ref', v_booking_record.booking_id,
        'billing_cycle_anchor', p_start_date,
        'message', 'Billing cycle initialized successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION public.initialize_billing_cycle IS 'Set billing_cycle_anchor for a recurring booking. Should be called once when booking is confirmed.';

-- ----------------------------------------------------------------------------
-- 6. CREATE FUNCTION TO GET BOOKING LIFECYCLE INFO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_booking_lifecycle_info(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_booking record;
    v_is_recurring boolean;
    v_active_invoice_count int;
    v_pending_invoice_count int;
    v_last_paid_invoice record;
    v_result json;
BEGIN
    -- Get booking details
    SELECT 
        id,
        booking_id,
        user_id,
        first_name,
        last_name,
        email,
        status,
        access_status,
        is_recurring,
        billing_cycle_anchor,
        class_package_id,
        created_at
    INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found');
    END IF;

    v_is_recurring := public.is_recurring_booking(p_booking_id);

    -- Count invoices if recurring
    IF v_is_recurring THEN
        SELECT COUNT(*) INTO v_active_invoice_count
        FROM public.invoices
        WHERE booking_id = p_booking_id AND status IN ('pending', 'overdue');

        SELECT COUNT(*) INTO v_pending_invoice_count
        FROM public.invoices
        WHERE booking_id = p_booking_id AND status = 'pending';

        SELECT invoice_number, paid_at, total_amount
        INTO v_last_paid_invoice
        FROM public.invoices
        WHERE booking_id = p_booking_id AND status = 'paid'
        ORDER BY paid_at DESC
        LIMIT 1;
    END IF;

    -- Build result
    RETURN json_build_object(
        'success', true,
        'booking_id', v_booking.id,
        'booking_ref', v_booking.booking_id,
        'user_id', v_booking.user_id,
        'customer_name', v_booking.first_name || ' ' || v_booking.last_name,
        'customer_email', v_booking.email,
        'booking_status', v_booking.status,
        'access_status', v_booking.access_status,
        'is_recurring', v_is_recurring,
        'billing_cycle_anchor', v_booking.billing_cycle_anchor,
        'created_at', v_booking.created_at,
        'invoice_summary', CASE 
            WHEN v_is_recurring THEN json_build_object(
                'active_unpaid_count', v_active_invoice_count,
                'pending_count', v_pending_invoice_count,
                'last_paid_invoice', CASE 
                    WHEN v_last_paid_invoice IS NOT NULL THEN json_build_object(
                        'invoice_number', v_last_paid_invoice.invoice_number,
                        'paid_at', v_last_paid_invoice.paid_at,
                        'amount', v_last_paid_invoice.total_amount
                    )
                    ELSE NULL
                END
            )
            ELSE NULL
        END
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.get_booking_lifecycle_info IS 'Get comprehensive lifecycle information for a booking including access status, billing status, and invoice summary';

-- ----------------------------------------------------------------------------
-- 7. CREATE VIEW FOR ACTIVE RECURRING BOOKINGS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.active_recurring_bookings_v AS
SELECT 
    b.id,
    b.booking_id,
    b.user_id,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.phone,
    b.access_status,
    b.status AS booking_status,
    b.billing_cycle_anchor,
    b.class_package_id,
    cp.name AS package_name,
    cp.price AS package_price,
    b.created_at,
    b.updated_at,
    COUNT(i.id) FILTER (WHERE i.status = 'pending') AS pending_invoice_count,
    COUNT(i.id) FILTER (WHERE i.status = 'overdue') AS overdue_invoice_count,
    MAX(i.due_date) FILTER (WHERE i.status IN ('pending', 'overdue')) AS next_due_date
FROM public.bookings b
LEFT JOIN public.class_packages cp ON cp.id = b.class_package_id
LEFT JOIN public.invoices i ON i.booking_id = b.id
WHERE b.is_recurring = true
  AND b.status NOT IN ('cancelled', 'completed')
GROUP BY b.id, cp.name, cp.price
ORDER BY b.created_at DESC;

COMMENT ON VIEW public.active_recurring_bookings_v IS 'All active monthly recurring bookings with invoice summary';

-- ----------------------------------------------------------------------------
-- 8. CREATE VIEW FOR LOCKED BOOKINGS (Access Control)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.locked_bookings_v AS
SELECT 
    b.id,
    b.booking_id,
    b.user_id,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.access_status,
    b.billing_cycle_anchor,
    COUNT(i.id) FILTER (WHERE i.status = 'overdue') AS overdue_invoice_count,
    SUM(i.total_amount) FILTER (WHERE i.status = 'overdue') AS total_overdue_amount,
    MIN(i.due_date) FILTER (WHERE i.status = 'overdue') AS oldest_due_date,
    CURRENT_DATE - MIN(i.due_date) FILTER (WHERE i.status = 'overdue') AS days_overdue
FROM public.bookings b
LEFT JOIN public.invoices i ON i.booking_id = b.id
WHERE b.access_status IN ('overdue_grace', 'overdue_locked')
GROUP BY b.id
ORDER BY days_overdue DESC NULLS LAST;

COMMENT ON VIEW public.locked_bookings_v IS 'Bookings in grace period or locked state with overdue details';

-- ----------------------------------------------------------------------------
-- 9. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_recurring_booking TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_lifecycle_info TO authenticated;

-- Grant execute on admin functions to service role only
GRANT EXECUTE ON FUNCTION public.transition_booking_access_status TO service_role;
GRANT EXECUTE ON FUNCTION public.initialize_billing_cycle TO service_role;

-- Grant select on views
GRANT SELECT ON public.active_recurring_bookings_v TO authenticated;
GRANT SELECT ON public.locked_bookings_v TO authenticated;

-- Note: Views inherit RLS from underlying tables (bookings table in this case)
-- No need to create policies on views themselves

-- ----------------------------------------------------------------------------
-- 10. BACKFILL EXISTING BOOKINGS (Optional - safe default values)
-- ----------------------------------------------------------------------------

-- Mark existing bookings with packages as recurring (if not already set)
UPDATE public.bookings
SET is_recurring = true
WHERE class_package_id IS NOT NULL
  AND is_recurring IS NULL OR is_recurring = false;

-- Set billing_cycle_anchor for existing recurring bookings (use created_at as fallback)
UPDATE public.bookings
SET billing_cycle_anchor = DATE(created_at)
WHERE is_recurring = true
  AND billing_cycle_anchor IS NULL;

-- ----------------------------------------------------------------------------
-- END OF MODULE 1 MIGRATION
-- ----------------------------------------------------------------------------

-- Verification queries (commented out):
-- SELECT * FROM public.active_recurring_bookings_v LIMIT 10;
-- SELECT * FROM public.locked_bookings_v;
-- SELECT public.get_booking_lifecycle_info('some-uuid-here');
-- SELECT public.is_recurring_booking('some-uuid-here');
