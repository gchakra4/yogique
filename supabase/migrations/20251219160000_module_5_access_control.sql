-- ============================================================================
-- MODULE 5: Access Control & Escalation
-- ============================================================================
-- Purpose: Manage booking access based on payment status and overdue invoices
-- Owns: access_status transitions, grace period enforcement, scheduling blocks
-- Does NOT: Send reminder emails (future enhancement)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE FUNCTION: Calculate Days Overdue for Invoice
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_days_overdue(p_invoice_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_due_date date;
    v_status text;
    v_days_overdue integer;
BEGIN
    SELECT due_date, status
    INTO v_due_date, v_status
    FROM public.invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND OR v_status != 'pending' THEN
        RETURN 0;
    END IF;

    v_days_overdue := CURRENT_DATE - v_due_date;
    
    RETURN GREATEST(0, v_days_overdue);
END;
$$;

COMMENT ON FUNCTION public.calculate_days_overdue IS 'Calculate days overdue for a pending invoice (0 if paid/not overdue)';

-- ----------------------------------------------------------------------------
-- 2. CREATE FUNCTION: Check Booking Payment Status
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_booking_payment_status(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result json;
    v_has_overdue boolean;
    v_max_days_overdue integer;
    v_pending_invoices integer;
BEGIN
    -- Check for overdue invoices
    SELECT 
        COUNT(*) > 0,
        COALESCE(MAX(CURRENT_DATE - i.due_date), 0),
        COUNT(*)
    INTO 
        v_has_overdue,
        v_max_days_overdue,
        v_pending_invoices
    FROM public.invoices i
    WHERE i.booking_id = p_booking_id
      AND i.status = 'pending'
      AND i.due_date < CURRENT_DATE;

    v_result := json_build_object(
        'booking_id', p_booking_id,
        'has_overdue_invoices', v_has_overdue,
        'max_days_overdue', v_max_days_overdue,
        'pending_invoices_count', v_pending_invoices,
        'recommended_status', 
            CASE 
                WHEN NOT v_has_overdue THEN 'active'
                WHEN v_max_days_overdue >= 11 THEN 'overdue_locked'
                WHEN v_max_days_overdue >= 8 THEN 'overdue_grace'
                ELSE 'active'
            END
    );

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_booking_payment_status IS 'Check payment status and recommend access_status based on overdue days';

-- ----------------------------------------------------------------------------
-- 3. CREATE FUNCTION: Escalate Overdue Bookings (Daily Cron)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.escalate_overdue_bookings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking record;
    v_payment_status json;
    v_current_status text;
    v_recommended_status text;
    v_escalated_to_grace integer := 0;
    v_escalated_to_locked integer := 0;
    v_restored_to_active integer := 0;
    v_no_change integer := 0;
BEGIN
    -- Loop through all recurring bookings
    FOR v_booking IN
        SELECT 
            b.id,
            b.access_status,
            b.booking_id AS booking_ref
        FROM public.bookings b
        WHERE b.is_recurring = true
          AND b.status NOT IN ('cancelled', 'completed')
    LOOP
        v_current_status := v_booking.access_status;
        
        -- Check payment status
        v_payment_status := public.check_booking_payment_status(v_booking.id);
        v_recommended_status := v_payment_status->>'recommended_status';

        -- Only transition if status should change
        IF v_current_status != v_recommended_status THEN
            -- Update booking access_status
            UPDATE public.bookings
            SET 
                access_status = v_recommended_status::access_status,
                updated_at = NOW()
            WHERE id = v_booking.id;

            -- Count transitions
            IF v_recommended_status = 'overdue_grace' THEN
                v_escalated_to_grace := v_escalated_to_grace + 1;
            ELSIF v_recommended_status = 'overdue_locked' THEN
                v_escalated_to_locked := v_escalated_to_locked + 1;
            ELSIF v_recommended_status = 'active' AND v_current_status IN ('overdue_grace', 'overdue_locked') THEN
                v_restored_to_active := v_restored_to_active + 1;
            END IF;

            -- Log transition using Module 1 function
            PERFORM public.transition_booking_access_status(
                v_booking.id,
                v_recommended_status::access_status,
                format('Automatic escalation: %s days overdue', v_payment_status->>'max_days_overdue')
            );
        ELSE
            v_no_change := v_no_change + 1;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'timestamp', NOW(),
        'escalated_to_grace', v_escalated_to_grace,
        'escalated_to_locked', v_escalated_to_locked,
        'restored_to_active', v_restored_to_active,
        'no_change', v_no_change,
        'total_processed', v_escalated_to_grace + v_escalated_to_locked + v_restored_to_active + v_no_change
    );
END;
$$;

COMMENT ON FUNCTION public.escalate_overdue_bookings IS 'Daily cron: Escalate/restore booking access_status based on payment status';

-- ----------------------------------------------------------------------------
-- 4. CREATE FUNCTION: Validate Scheduling Access
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_schedule_class(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_booking record;
    v_payment_status json;
BEGIN
    -- Get booking details
    SELECT 
        id,
        booking_id,
        access_status,
        status,
        is_recurring
    INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'can_schedule', false,
            'reason', 'Booking not found'
        );
    END IF;

    -- Check booking status
    IF v_booking.status IN ('cancelled', 'completed') THEN
        RETURN json_build_object(
            'can_schedule', false,
            'reason', format('Booking status is %s', v_booking.status)
        );
    END IF;

    -- Check access status
    IF v_booking.access_status = 'overdue_locked' THEN
        v_payment_status := public.check_booking_payment_status(p_booking_id);
        
        RETURN json_build_object(
            'can_schedule', false,
            'reason', 'Access locked due to overdue payment',
            'access_status', v_booking.access_status,
            'days_overdue', v_payment_status->>'max_days_overdue',
            'pending_invoices', v_payment_status->>'pending_invoices_count'
        );
    END IF;

    -- Grace period warning
    IF v_booking.access_status = 'overdue_grace' THEN
        v_payment_status := public.check_booking_payment_status(p_booking_id);
        
        RETURN json_build_object(
            'can_schedule', true,
            'warning', 'Payment overdue - access will be locked soon',
            'access_status', v_booking.access_status,
            'days_overdue', v_payment_status->>'max_days_overdue',
            'days_until_lock', 11 - (v_payment_status->>'max_days_overdue')::integer
        );
    END IF;

    -- All clear
    RETURN json_build_object(
        'can_schedule', true,
        'access_status', v_booking.access_status
    );
END;
$$;

COMMENT ON FUNCTION public.can_schedule_class IS 'Validate if a booking can schedule new classes based on access_status';

-- ----------------------------------------------------------------------------
-- 5. CREATE VIEW: Bookings at Risk of Lock
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.bookings_at_risk_v AS
SELECT 
    b.id AS booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.phone AS customer_phone,
    b.access_status,
    i.id AS invoice_id,
    i.invoice_number,
    i.total_amount,
    i.due_date,
    CURRENT_DATE - i.due_date AS days_overdue,
    CASE 
        WHEN (CURRENT_DATE - i.due_date) >= 11 THEN 'CRITICAL: Will lock today'
        WHEN (CURRENT_DATE - i.due_date) >= 8 THEN 'WARNING: Grace period'
        WHEN (CURRENT_DATE - i.due_date) >= 5 THEN 'NOTICE: Payment overdue'
        ELSE 'OK'
    END AS risk_level,
    pl.short_url AS payment_link_url
FROM public.bookings b
JOIN public.invoices i ON i.booking_id = b.id
LEFT JOIN public.payment_links pl ON pl.invoice_id = i.id AND pl.status = 'created'
WHERE b.is_recurring = true
  AND b.status NOT IN ('cancelled', 'completed')
  AND i.status = 'pending'
  AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

COMMENT ON VIEW public.bookings_at_risk_v IS 'Bookings with overdue invoices at risk of access lock';

-- ----------------------------------------------------------------------------
-- 6. CREATE VIEW: Locked Bookings Dashboard
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.locked_bookings_dashboard_v AS
SELECT 
    b.id AS booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.phone AS customer_phone,
    b.access_status,
    b.updated_at AS status_changed_at,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending') AS pending_invoices_count,
    SUM(i.total_amount) FILTER (WHERE i.status = 'pending') AS total_amount_due,
    MAX(CURRENT_DATE - i.due_date) FILTER (WHERE i.status = 'pending') AS max_days_overdue,
    COUNT(DISTINCT ca.id) AS scheduled_classes_count,
    MIN(ca.date) FILTER (WHERE ca.date >= CURRENT_DATE AND ca.class_status NOT IN ('cancelled', 'rescheduled')) AS next_class_date
FROM public.bookings b
LEFT JOIN public.invoices i ON i.booking_id = b.id
LEFT JOIN public.assignment_bookings ab ON ab.booking_id::text = b.booking_id
LEFT JOIN public.class_assignments ca ON ca.id = ab.assignment_id
WHERE b.access_status IN ('overdue_grace', 'overdue_locked')
  AND b.status NOT IN ('cancelled', 'completed')
GROUP BY b.id, b.booking_id, b.first_name, b.last_name, b.email, b.phone, b.access_status, b.updated_at
ORDER BY b.access_status DESC, max_days_overdue DESC;

COMMENT ON VIEW public.locked_bookings_dashboard_v IS 'Dashboard of bookings in grace period or locked status';

-- ----------------------------------------------------------------------------
-- 7. CREATE FUNCTION: Get Escalation Timeline for Booking
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_escalation_timeline(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_payment_status json;
    v_days_overdue integer;
    v_timeline json;
BEGIN
    v_payment_status := public.check_booking_payment_status(p_booking_id);
    v_days_overdue := (v_payment_status->>'max_days_overdue')::integer;

    v_timeline := json_build_object(
        'booking_id', p_booking_id,
        'current_status', v_payment_status->>'recommended_status',
        'days_overdue', v_days_overdue,
        'timeline', json_build_array(
            json_build_object(
                'day', 0,
                'status', 'active',
                'description', 'Invoice due date',
                'reached', v_days_overdue >= 0
            ),
            json_build_object(
                'day', 8,
                'status', 'overdue_grace',
                'description', 'Grace period begins - scheduling still allowed',
                'reached', v_days_overdue >= 8
            ),
            json_build_object(
                'day', 11,
                'status', 'overdue_locked',
                'description', 'Access locked - scheduling blocked',
                'reached', v_days_overdue >= 11
            )
        ),
        'next_escalation', 
            CASE 
                WHEN v_days_overdue < 8 THEN json_build_object('in_days', 8 - v_days_overdue, 'to_status', 'overdue_grace')
                WHEN v_days_overdue < 11 THEN json_build_object('in_days', 11 - v_days_overdue, 'to_status', 'overdue_locked')
                ELSE NULL
            END
    );

    RETURN v_timeline;
END;
$$;

COMMENT ON FUNCTION public.get_escalation_timeline IS 'Get escalation timeline and current position for a booking';

-- ----------------------------------------------------------------------------
-- 8. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Public functions (read-only)
GRANT EXECUTE ON FUNCTION public.calculate_days_overdue TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_booking_payment_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_schedule_class TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_escalation_timeline TO authenticated;

-- Service-role functions (cron/admin only)
GRANT EXECUTE ON FUNCTION public.escalate_overdue_bookings TO service_role;

-- Views
GRANT SELECT ON public.bookings_at_risk_v TO authenticated;
GRANT SELECT ON public.locked_bookings_dashboard_v TO authenticated;

-- ----------------------------------------------------------------------------
-- END OF MODULE 5 MIGRATION
-- ----------------------------------------------------------------------------
