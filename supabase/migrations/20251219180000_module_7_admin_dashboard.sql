-- ============================================================================
-- MODULE 7: ADMIN DASHBOARD ENHANCEMENTS
-- ============================================================================
-- Purpose: Admin views for invoice management, payment monitoring, and access control
-- Dependencies: All previous modules (0-6)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE VIEW: Admin Invoice Dashboard
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.admin_invoices_dashboard_v AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    i.status AS invoice_status,
    i.total_amount,
    i.due_date,
    i.created_at,
    i.updated_at,
    b.id AS booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.phone AS customer_phone,
    b.access_status,
    b.status AS booking_status,
    pl.id AS payment_link_id,
    pl.razorpay_link_id,
    pl.short_url AS payment_link_url,
    pl.status AS payment_link_status,
    pl.expires_at AS payment_link_expires,
    CASE 
        WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
        ELSE 0
    END AS days_overdue,
    CASE 
        WHEN i.status = 'paid' THEN 'success'
        WHEN i.status = 'pending' AND i.due_date >= CURRENT_DATE THEN 'warning'
        WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN 'danger'
        WHEN i.status = 'cancelled' THEN 'neutral'
        ELSE 'neutral'
    END AS status_severity,
    COUNT(DISTINCT pe.id) AS payment_event_count,
    MAX(pe.created_at) AS last_payment_event
FROM public.invoices i
JOIN public.bookings b ON b.id = i.booking_id
LEFT JOIN public.payment_links pl ON pl.invoice_id = i.id
LEFT JOIN public.payment_events pe ON pe.payment_link_id = pl.id
GROUP BY 
    i.id, i.invoice_number, i.status, i.total_amount, i.due_date, i.created_at, i.updated_at,
    b.id, b.booking_id, b.first_name, b.last_name, b.email, b.phone, b.access_status, b.status,
    pl.id, pl.razorpay_link_id, pl.short_url, pl.status, pl.expires_at
ORDER BY i.created_at DESC;

COMMENT ON VIEW public.admin_invoices_dashboard_v IS 'Admin dashboard view for invoice management';

-- ----------------------------------------------------------------------------
-- 2. CREATE VIEW: Admin Payment Links Monitor
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.admin_payment_links_monitor_v AS
SELECT 
    pl.id AS payment_link_id,
    pl.razorpay_link_id,
    pl.short_url,
    pl.status AS link_status,
    pl.created_at,
    pl.expires_at,
    pl.razorpay_response,
    i.id AS invoice_id,
    i.invoice_number,
    i.status AS invoice_status,
    i.total_amount,
    i.due_date,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.access_status,
    COUNT(DISTINCT pe.id) AS event_count,
    MAX(pe.created_at) AS last_event_time,
    CASE 
        WHEN pl.status = 'paid' THEN 'success'
        WHEN pl.status = 'created' AND pl.expires_at > NOW() THEN 'active'
        WHEN pl.status = 'expired' THEN 'expired'
        WHEN pl.status = 'cancelled' THEN 'cancelled'
        ELSE 'unknown'
    END AS link_state
FROM public.payment_links pl
JOIN public.invoices i ON i.id = pl.invoice_id
JOIN public.bookings b ON b.id = i.booking_id
LEFT JOIN public.payment_events pe ON pe.payment_link_id = pl.id
GROUP BY 
    pl.id, pl.razorpay_link_id, pl.short_url, pl.status, pl.created_at, pl.expires_at, pl.razorpay_response,
    i.id, i.invoice_number, i.status, i.total_amount, i.due_date,
    b.booking_id, b.first_name, b.last_name, b.email, b.access_status
ORDER BY pl.created_at DESC;

COMMENT ON VIEW public.admin_payment_links_monitor_v IS 'Admin monitor for payment link status and events';

-- ----------------------------------------------------------------------------
-- 3. CREATE VIEW: Admin Bookings Access Status
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.admin_bookings_access_v AS
SELECT 
    b.id AS booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email,
    b.phone,
    b.status AS booking_status,
    b.access_status,
    b.is_recurring,
    b.billing_cycle_anchor,
    b.created_at,
    b.updated_at,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending') AS pending_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'paid') AS paid_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue') AS overdue_invoices,
    SUM(i.total_amount) FILTER (WHERE i.status = 'pending') AS total_pending_amount,
    MAX(i.due_date) FILTER (WHERE i.status = 'pending') AS next_due_date,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.class_status = 'scheduled' AND ca.date >= CURRENT_DATE) AS upcoming_classes,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.class_status = 'completed') AS completed_classes,
    CASE 
        WHEN b.access_status = 'active' THEN 'success'
        WHEN b.access_status = 'overdue_grace' THEN 'warning'
        WHEN b.access_status = 'overdue_locked' THEN 'danger'
        ELSE 'neutral'
    END AS access_severity
FROM public.bookings b
LEFT JOIN public.invoices i ON i.booking_id = b.id
LEFT JOIN public.assignment_bookings ab ON ab.booking_id::text = b.booking_id
LEFT JOIN public.class_assignments ca ON ca.id = ab.assignment_id
GROUP BY 
    b.id, b.booking_id, b.first_name, b.last_name, b.email, b.phone, 
    b.status, b.access_status, b.is_recurring, b.billing_cycle_anchor, b.created_at, b.updated_at
ORDER BY 
    CASE b.access_status
        WHEN 'overdue_locked' THEN 1
        WHEN 'overdue_grace' THEN 2
        WHEN 'active' THEN 3
        ELSE 4
    END,
    b.updated_at DESC;

COMMENT ON VIEW public.admin_bookings_access_v IS 'Admin view of bookings with access status and payment summary';

-- ----------------------------------------------------------------------------
-- 4. CREATE VIEW: Admin Payment Events Log
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.admin_payment_events_log_v AS
SELECT 
    pe.id AS event_id,
    pe.event_id AS razorpay_event_id,
    pe.event_type,
    pe.signature_verified,
    pe.processed_at,
    pe.processing_error,
    pe.created_at,
    pl.razorpay_link_id,
    pl.short_url AS payment_link_url,
    pl.status AS link_status,
    i.invoice_number,
    i.total_amount,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    CASE 
        WHEN pe.processing_error IS NOT NULL THEN 'error'
        WHEN pe.processed_at IS NOT NULL THEN 'processed'
        ELSE 'pending'
    END AS processing_status
FROM public.payment_events pe
JOIN public.payment_links pl ON pl.id = pe.payment_link_id
JOIN public.invoices i ON i.id = pl.invoice_id
JOIN public.bookings b ON b.id = i.booking_id
ORDER BY pe.created_at DESC;

COMMENT ON VIEW public.admin_payment_events_log_v IS 'Admin log of all payment webhook events';

-- ----------------------------------------------------------------------------
-- 5. CREATE FUNCTION: Admin - Manually Trigger Invoice Generation
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_generate_invoice(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    -- Generate first invoice if billing_cycle_anchor is set
    PERFORM public.generate_first_invoice(p_booking_id);
    
    -- Return invoice details
    SELECT json_build_object(
        'success', true,
        'invoice_id', i.id,
        'invoice_number', i.invoice_number,
        'total_amount', i.total_amount,
        'due_date', i.due_date
    )
    INTO v_result
    FROM public.invoices i
    WHERE i.booking_id = p_booking_id
    ORDER BY i.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_result, json_build_object('success', false, 'error', 'No invoice generated'));
END;
$$;

COMMENT ON FUNCTION public.admin_generate_invoice IS 'Admin function to manually trigger invoice generation';

-- ----------------------------------------------------------------------------
-- 6. CREATE FUNCTION: Admin - Manually Create Payment Link
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_create_payment_link(p_invoice_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_data json;
BEGIN
    -- Get invoice data for payment link creation
    SELECT public.get_invoice_for_payment_link(p_invoice_id)
    INTO v_invoice_data;
    
    -- Return invoice data (actual link creation happens via edge function)
    RETURN json_build_object(
        'success', true,
        'invoice_id', p_invoice_id,
        'invoice_data', v_invoice_data,
        'message', 'Call create-payment-link edge function with this invoice_id'
    );
END;
$$;

COMMENT ON FUNCTION public.admin_create_payment_link IS 'Admin function to prepare payment link creation';

-- ----------------------------------------------------------------------------
-- 7. CREATE FUNCTION: Admin - Manually Escalate Booking
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_escalate_booking(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_status json;
    v_new_status text;
BEGIN
    -- Check payment status
    v_payment_status := public.check_booking_payment_status(p_booking_id);
    
    -- Get recommended status
    v_new_status := v_payment_status->>'recommended_status';
    
    -- Transition to recommended status
    PERFORM public.transition_booking_access_status(
        p_booking_id,
        v_new_status::text,
        'Manual escalation by admin'
    );
    
    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'new_status', v_new_status,
        'payment_status', v_payment_status
    );
END;
$$;

COMMENT ON FUNCTION public.admin_escalate_booking IS 'Admin function to manually escalate booking access status';

-- ----------------------------------------------------------------------------
-- 8. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Admins can read all admin views
GRANT SELECT ON public.admin_invoices_dashboard_v TO authenticated;
GRANT SELECT ON public.admin_payment_links_monitor_v TO authenticated;
GRANT SELECT ON public.admin_bookings_access_v TO authenticated;
GRANT SELECT ON public.admin_payment_events_log_v TO authenticated;

-- Admins can execute admin functions
GRANT EXECUTE ON FUNCTION public.admin_generate_invoice TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_payment_link TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_escalate_booking TO authenticated;

-- ============================================================================
-- END MODULE 7
-- ============================================================================
