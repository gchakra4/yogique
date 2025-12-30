-- ============================================================================
-- MODULE 2: Invoice Generation & Tracking
-- ============================================================================
-- Purpose: Auto-generate monthly invoices with proration logic
-- Owns: Invoice creation, proration, due date calculation
-- Does NOT: Create payment links, process payments, update access status
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE HELPER FUNCTION: GET TAX RATE FROM BUSINESS SETTINGS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_business_tax_rate()
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_tax_rate numeric;
BEGIN
    SELECT COALESCE(
        (value->>'tax_rate')::numeric,
        0
    )
    INTO v_tax_rate
    FROM public.business_settings
    WHERE key = 'invoice_preferences'
    LIMIT 1;
    
    RETURN COALESCE(v_tax_rate, 0);
END;
$$;

COMMENT ON FUNCTION public.get_business_tax_rate IS 'Get GST/tax rate from business_settings.invoice_preferences';

-- ----------------------------------------------------------------------------
-- 2. CREATE FUNCTION: COUNT SCHEDULED CLASSES FOR A BOOKING IN DATE RANGE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_scheduled_classes(
    p_booking_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_class_count integer;
BEGIN
    -- Count class_assignments linked to this booking via assignment_bookings
    SELECT COUNT(DISTINCT ca.id)
    INTO v_class_count
    FROM public.class_assignments ca
    JOIN public.assignment_bookings ab ON ab.assignment_id = ca.id
    JOIN public.bookings b ON b.booking_id = ab.booking_id
    WHERE b.id = p_booking_id
      AND ca.date >= p_start_date
      AND ca.date <= p_end_date
      AND ca.class_status NOT IN ('cancelled', 'rescheduled');
    
    RETURN COALESCE(v_class_count, 0);
END;
$$;

COMMENT ON FUNCTION public.count_scheduled_classes IS 'Count non-cancelled classes for a booking within a date range';

-- ----------------------------------------------------------------------------
-- 3. CREATE FUNCTION: GENERATE FIRST INVOICE (Prorated)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_first_invoice(p_booking_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking record;
    v_package record;
    v_first_class_date date;
    v_month_end_date date;
    v_scheduled_classes_count integer;
    v_base_amount numeric;
    v_prorated_amount numeric;
    v_tax_rate numeric;
    v_tax_amount numeric;
    v_total_amount numeric;
    v_invoice_number text;
    v_invoice_id uuid;
    v_proration_note text;
    v_billing_month text;
BEGIN
    -- Get booking details
    SELECT 
        b.id,
        b.booking_id,
        b.user_id,
        b.first_name,
        b.last_name,
        b.email,
        b.billing_cycle_anchor,
        b.class_package_id,
        b.is_recurring
    INTO v_booking
    FROM public.bookings b
    WHERE b.id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found');
    END IF;

    -- Validate this is a recurring booking
    IF NOT COALESCE(v_booking.is_recurring, false) THEN
        RETURN json_build_object('success', false, 'error', 'Not a recurring booking');
    END IF;

    -- Validate billing_cycle_anchor is set
    IF v_booking.billing_cycle_anchor IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Billing cycle anchor not set');
    END IF;

    -- Check if first invoice already exists
    IF EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE booking_id = p_booking_id 
        AND billing_period_start = v_booking.billing_cycle_anchor
    ) THEN
        RETURN json_build_object('success', false, 'error', 'First invoice already exists');
    END IF;

    -- Get package details
    SELECT id, name, price, class_count
    INTO v_package
    FROM public.class_packages
    WHERE id = v_booking.class_package_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Package not found');
    END IF;

    -- Calculate date range for first partial month
    v_first_class_date := v_booking.billing_cycle_anchor;
    v_month_end_date := (DATE_TRUNC('month', v_first_class_date) + INTERVAL '1 month' - INTERVAL '1 day')::date;

    -- Count scheduled classes in first month
    v_scheduled_classes_count := public.count_scheduled_classes(
        p_booking_id,
        v_first_class_date,
        v_month_end_date
    );

    -- Calculate proration (class-count based)
    v_base_amount := v_package.price;
    
    IF v_scheduled_classes_count > 0 AND v_package.class_count > 0 THEN
        v_prorated_amount := ROUND(
            (v_scheduled_classes_count::numeric / v_package.class_count::numeric) * v_base_amount,
            2
        );
        v_proration_note := format(
            'First month prorated: %s classes scheduled out of %s package classes',
            v_scheduled_classes_count,
            v_package.class_count
        );
    ELSE
        -- Fallback: no proration if classes not scheduled yet
        v_prorated_amount := v_base_amount;
        v_proration_note := 'First month - proration will adjust when classes are scheduled';
    END IF;

    -- Get tax rate
    v_tax_rate := public.get_business_tax_rate();
    v_tax_amount := ROUND(v_prorated_amount * v_tax_rate / 100, 2);
    v_total_amount := v_prorated_amount + v_tax_amount;

    -- Generate invoice number (YG-YYYYMM-XXXX format)
    v_invoice_number := format(
        'YG-%s-%s',
        TO_CHAR(CURRENT_DATE, 'YYYYMM'),
        LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
    );

    -- Format billing month
    v_billing_month := TO_CHAR(v_first_class_date, 'Mon YYYY');

    -- Create invoice
    INSERT INTO public.invoices (
        invoice_number,
        booking_id,
        user_id,
        amount,
        currency,
        tax_rate,
        tax_amount,
        total_amount,
        billing_period_start,
        billing_period_end,
        billing_month,
        due_date,
        status,
        proration_note
    ) VALUES (
        v_invoice_number,
        v_booking.id,
        v_booking.user_id,
        v_prorated_amount,
        'INR',
        v_tax_rate,
        v_tax_amount,
        v_total_amount,
        v_first_class_date,
        v_month_end_date,
        v_billing_month,
        v_first_class_date, -- Due on first class date
        'pending',
        v_proration_note
    ) RETURNING id INTO v_invoice_id;

    -- Return success
    RETURN json_build_object(
        'success', true,
        'invoice_id', v_invoice_id,
        'invoice_number', v_invoice_number,
        'booking_id', v_booking.id,
        'booking_ref', v_booking.booking_id,
        'amount', v_prorated_amount,
        'tax_amount', v_tax_amount,
        'total_amount', v_total_amount,
        'billing_period_start', v_first_class_date,
        'billing_period_end', v_month_end_date,
        'due_date', v_first_class_date,
        'proration_note', v_proration_note,
        'scheduled_classes_count', v_scheduled_classes_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.generate_first_invoice IS 'Generate prorated first invoice when billing_cycle_anchor is set. Uses class-count proration.';

-- ----------------------------------------------------------------------------
-- 4. CREATE TRIGGER: Auto-generate first invoice when billing_cycle_anchor set
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trigger_generate_first_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    -- Only trigger if billing_cycle_anchor was just set (changed from NULL to a date)
    IF OLD.billing_cycle_anchor IS NULL AND NEW.billing_cycle_anchor IS NOT NULL THEN
        -- Only for recurring bookings
        IF NEW.is_recurring = true THEN
            -- Generate first invoice asynchronously (don't block the update)
            v_result := public.generate_first_invoice(NEW.id);
            
            -- Log if failed (don't raise error to avoid blocking booking update)
            IF (v_result->>'success')::boolean = false THEN
                RAISE NOTICE 'Failed to generate first invoice for booking %: %', 
                    NEW.id, v_result->>'error';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_generate_first_invoice_trigger
    AFTER UPDATE OF billing_cycle_anchor ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_first_invoice();

COMMENT ON FUNCTION public.trigger_generate_first_invoice IS 'Auto-trigger first invoice generation when billing_cycle_anchor is set';

-- ----------------------------------------------------------------------------
-- 5. CREATE FUNCTION: GENERATE MONTHLY INVOICES (Regular billing)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(
    p_target_month date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_month date;
    v_billing_period_start date;
    v_billing_period_end date;
    v_generation_date date;
    v_due_date date;
    v_tax_rate numeric;
    v_booking record;
    v_package record;
    v_invoice_number text;
    v_invoice_id uuid;
    v_billing_month text;
    v_amount numeric;
    v_tax_amount numeric;
    v_total_amount numeric;
    v_created_count integer := 0;
    v_skipped_count integer := 0;
    v_error_count integer := 0;
    v_errors jsonb := '[]'::jsonb;
BEGIN
    -- Default to next month if not specified
    v_target_month := COALESCE(p_target_month, DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::date);
    
    -- Calculate billing period (full month)
    v_billing_period_start := DATE_TRUNC('month', v_target_month)::date;
    v_billing_period_end := (v_billing_period_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
    
    -- Due date: last day of previous month
    v_due_date := v_billing_period_start - INTERVAL '1 day';
    
    -- Format billing month
    v_billing_month := TO_CHAR(v_target_month, 'Mon YYYY');
    
    -- Get tax rate once
    v_tax_rate := public.get_business_tax_rate();

    -- Loop through all active recurring bookings
    FOR v_booking IN
        SELECT 
            b.id,
            b.booking_id,
            b.user_id,
            b.class_package_id,
            b.billing_cycle_anchor
        FROM public.bookings b
        WHERE b.is_recurring = true
          AND b.status NOT IN ('cancelled', 'completed')
          AND b.billing_cycle_anchor IS NOT NULL
          AND b.billing_cycle_anchor < v_billing_period_start -- Only bookings that started before this month
    LOOP
        BEGIN
            -- Check if invoice already exists for this period
            IF EXISTS (
                SELECT 1 FROM public.invoices
                WHERE booking_id = v_booking.id
                  AND billing_period_start = v_billing_period_start
                  AND billing_period_end = v_billing_period_end
            ) THEN
                v_skipped_count := v_skipped_count + 1;
                CONTINUE;
            END IF;

            -- Get package details
            SELECT id, name, price, class_count
            INTO v_package
            FROM public.class_packages
            WHERE id = v_booking.class_package_id;

            IF NOT FOUND THEN
                v_error_count := v_error_count + 1;
                v_errors := v_errors || jsonb_build_object(
                    'booking_id', v_booking.id,
                    'error', 'Package not found'
                );
                CONTINUE;
            END IF;

            -- Full month amount (no proration for regular monthly invoices)
            v_amount := v_package.price;
            v_tax_amount := ROUND(v_amount * v_tax_rate / 100, 2);
            v_total_amount := v_amount + v_tax_amount;

            -- Generate unique invoice number
            v_invoice_number := format(
                'YG-%s-%s',
                TO_CHAR(CURRENT_DATE, 'YYYYMM'),
                LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
            );

            -- Create invoice
            INSERT INTO public.invoices (
                invoice_number,
                booking_id,
                user_id,
                amount,
                currency,
                tax_rate,
                tax_amount,
                total_amount,
                billing_period_start,
                billing_period_end,
                billing_month,
                due_date,
                status,
                proration_note
            ) VALUES (
                v_invoice_number,
                v_booking.id,
                v_booking.user_id,
                v_amount,
                'INR',
                v_tax_rate,
                v_tax_amount,
                v_total_amount,
                v_billing_period_start,
                v_billing_period_end,
                v_billing_month,
                v_due_date,
                'pending',
                NULL -- No proration for regular monthly invoices
            ) RETURNING id INTO v_invoice_id;

            v_created_count := v_created_count + 1;

        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                v_errors := v_errors || jsonb_build_object(
                    'booking_id', v_booking.id,
                    'error', SQLERRM
                );
        END;
    END LOOP;

    -- Return summary
    RETURN json_build_object(
        'success', true,
        'target_month', v_target_month,
        'billing_period_start', v_billing_period_start,
        'billing_period_end', v_billing_period_end,
        'due_date', v_due_date,
        'created_count', v_created_count,
        'skipped_count', v_skipped_count,
        'error_count', v_error_count,
        'errors', v_errors
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.generate_monthly_invoices IS 'Generate regular monthly invoices for all active recurring bookings. Run on days 23-27 of each month.';

-- ----------------------------------------------------------------------------
-- 6. CREATE VIEW: Invoices Pending Generation
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.invoices_pending_generation_v AS
SELECT 
    b.id AS booking_id,
    b.booking_id AS booking_ref,
    b.user_id,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.billing_cycle_anchor,
    cp.name AS package_name,
    cp.price AS package_price,
    DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::date AS next_billing_period_start,
    (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '1 month' - INTERVAL '1 day')::date AS next_billing_period_end,
    (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day')::date AS next_due_date
FROM public.bookings b
JOIN public.class_packages cp ON cp.id = b.class_package_id
WHERE b.is_recurring = true
  AND b.status NOT IN ('cancelled', 'completed')
  AND b.billing_cycle_anchor IS NOT NULL
  AND b.billing_cycle_anchor < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::date
  AND NOT EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.booking_id = b.id
        AND i.billing_period_start = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::date
  )
ORDER BY b.billing_cycle_anchor ASC;

COMMENT ON VIEW public.invoices_pending_generation_v IS 'Bookings that need next month invoice generated (days 23-27)';

-- ----------------------------------------------------------------------------
-- 7. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Public functions
GRANT EXECUTE ON FUNCTION public.get_business_tax_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_scheduled_classes TO authenticated;

-- Service-role only functions (called by cron/edge functions)
GRANT EXECUTE ON FUNCTION public.generate_first_invoice TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices TO service_role;

-- Views
GRANT SELECT ON public.invoices_pending_generation_v TO authenticated;

-- ----------------------------------------------------------------------------
-- END OF MODULE 2 MIGRATION
-- ----------------------------------------------------------------------------

-- Manual test queries (commented out):
-- SELECT public.generate_monthly_invoices(DATE '2025-02-01');
-- SELECT * FROM public.invoices_pending_generation_v;
-- SELECT public.get_business_tax_rate();
