-- ============================================================================
-- PHASE 8: T-5 AUTOMATED INVOICE + CLASS GENERATION RPC FUNCTION
-- ============================================================================
-- Purpose: Generate invoices AND monthly classes 5 days before billing cycle
-- Called by: Edge function generate-t5-invoices (daily cron at 1 AM UTC)
-- ============================================================================

-- Drop previous overloads to avoid ambiguity
DROP FUNCTION IF EXISTS generate_t5_invoices() CASCADE;
DROP FUNCTION IF EXISTS generate_t5_invoices(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS generate_t5_invoices_impl(uuid, boolean) CASCADE;

CREATE OR REPLACE FUNCTION generate_t5_invoices_impl(p_booking_id uuid DEFAULT NULL, p_dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today date;
    v_target_month text;
    v_booking record;
    v_booking_details record;
    v_invoice_exists boolean;
    v_classes_exist boolean;
    v_total_checked integer := 0;
    v_total_generated integer := 0;
    v_total_skipped integer := 0;
    v_total_errors integer := 0;
    v_results jsonb := '[]'::jsonb;
    v_result jsonb;
    v_t5_date date;
    v_billing_cycle_anchor date;
    v_days_until_billing integer;
    v_invoice_id uuid;
    v_invoice_number text;
    v_classes_generated integer;
    v_month_start date;
    v_month_end date;
    v_assignment_ids uuid[];
    v_assignment_id uuid;
BEGIN
    v_today := current_date;
    
    RAISE NOTICE 'Starting T-5 invoice + class generation for date: %', v_today;
    
    -- Loop through all recurring bookings with complete details
    FOR v_booking IN
        SELECT 
            b.id,
            b.booking_id,
            b.user_id,
            b.billing_cycle_anchor,
            b.access_status,
            b.status,
            b.is_recurring,
            b.first_name,
            b.last_name,
            b.email,
            b.class_package_id,
            -- safely coerce instructor to uuid only if instructor_id is null and instructor looks like a uuid string
            (CASE
                WHEN b.instructor_id IS NOT NULL THEN b.instructor_id
                WHEN b.instructor ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$' THEN b.instructor::uuid
                ELSE NULL
            END) AS instructor_id,
            -- start_time/end_time removed (may not exist on bookings); assignments will use NULL if unavailable
            b.preferred_days,
            cp.class_count,
            cp.price AS package_price,
            b.price AS booking_price
                FROM bookings b
        JOIN class_packages cp ON cp.id = b.class_package_id
        WHERE b.is_recurring = true
          AND b.status IN ('confirmed', 'active')
          AND b.access_status != 'overdue_locked'
          AND b.billing_cycle_anchor IS NOT NULL
          AND b.class_package_id IS NOT NULL
          AND b.preferred_days IS NOT NULL
          AND array_length(b.preferred_days, 1) > 0
                    AND (p_booking_id IS NULL OR b.id = p_booking_id)
    LOOP
        v_total_checked := v_total_checked + 1;
        v_classes_generated := 0;
        
        -- Calculate T-5 date (5 days before billing cycle anchor)
        -- Find next billing date
        v_billing_cycle_anchor := v_booking.billing_cycle_anchor;
        
        -- Get day of month from anchor
        DECLARE
            v_anchor_day integer;
            v_current_month integer;
            v_current_year integer;
            v_next_billing_date date;
        BEGIN
            v_anchor_day := EXTRACT(DAY FROM v_billing_cycle_anchor);
            v_current_month := EXTRACT(MONTH FROM v_today);
            v_current_year := EXTRACT(YEAR FROM v_today);
            
            -- Calculate next billing date
            v_next_billing_date := make_date(
                v_current_year,
                v_current_month,
                LEAST(v_anchor_day, EXTRACT(DAY FROM (
                    make_date(v_current_year, v_current_month, 1) + interval '1 month - 1 day'
                ))::integer)
            );
            
            -- If next billing date is in the past or today, move to next month
            IF v_next_billing_date <= v_today THEN
                v_next_billing_date := make_date(
                    EXTRACT(YEAR FROM (v_next_billing_date + interval '1 month'))::integer,
                    EXTRACT(MONTH FROM (v_next_billing_date + interval '1 month'))::integer,
                    LEAST(v_anchor_day, EXTRACT(DAY FROM (
                        (v_next_billing_date + interval '1 month') + interval '1 month - 1 day'
                    ))::integer)
                );
            END IF;
            
            -- Calculate T-5 date
            v_t5_date := v_next_billing_date - interval '5 days';
            v_days_until_billing := (v_next_billing_date - v_today)::integer;
            
            -- Calculate target month (the month being billed for)
            v_target_month := to_char(v_next_billing_date, 'YYYY-MM');
            
            RAISE NOTICE 'Booking %: Next billing=%, T-5=%, Today=%, Days until=%', 
                v_booking.booking_id, v_next_billing_date, v_t5_date, v_today, v_days_until_billing;
            
            -- Check if today is T-5 day
            IF v_t5_date != v_today THEN
                v_total_skipped := v_total_skipped + 1;
                v_result := jsonb_build_object(
                    'booking_id', v_booking.booking_id,
                    'status', 'skipped',
                    'reason', 'Not T-5 day (T-5 is ' || v_t5_date || ', days until billing: ' || v_days_until_billing || ')'
                );
                v_results := v_results || v_result;
                CONTINUE;
            END IF;
            
            -- Check if invoice already exists for this month
            SELECT EXISTS(
                SELECT 1 FROM invoices
                WHERE booking_id = v_booking.id
                  AND billing_month = v_target_month
                  AND status != 'cancelled'
            ) INTO v_invoice_exists;
            
            IF v_invoice_exists THEN
                v_total_skipped := v_total_skipped + 1;
                v_result := jsonb_build_object(
                    'booking_id', v_booking.booking_id,
                    'status', 'skipped',
                    'reason', 'Invoice already exists for month ' || v_target_month
                );
                v_results := v_results || v_result;
                CONTINUE;
            END IF;
            
            -- Calculate month boundaries for class generation
            v_month_start := date_trunc('month', v_next_billing_date::timestamp)::date;
            v_month_end := (date_trunc('month', v_next_billing_date::timestamp) + interval '1 month - 1 day')::date;
            
            -- Generate invoice + classes in transaction
            BEGIN
                -- 1. Insert invoice with full calculation
                DECLARE
                    v_per_class_amount numeric;
                    v_base_amount numeric;
                    v_tax_rate numeric;
                    v_tax_amount numeric;
                    v_total_amount numeric;
                    -- variables for container and class generation (flattened into this block)
                    v_container_id uuid;
                    v_container_code text;
                    v_container_display text;
                    v_current_date date;
                    v_day_of_week integer;
                    v_preferred_day text;
                    v_classes_needed integer;
                    v_assignment_code text;
                BEGIN
                    -- Determine base amount: prefer explicit booking price, fall back to package price
                    v_base_amount := COALESCE(v_booking.booking_price, v_booking.package_price, 0);
                    -- Safely compute per-class amount
                    IF v_booking.class_count IS NULL OR v_booking.class_count = 0 THEN
                        v_per_class_amount := v_base_amount;
                    ELSE
                        v_per_class_amount := v_base_amount / v_booking.class_count;
                    END IF;
                    v_tax_rate := 0.18; -- 18% GST
                    v_tax_amount := ROUND(v_base_amount * v_tax_rate, 2);
                    v_total_amount := v_base_amount + v_tax_amount;
                    
                    -- compute invoice number and insert
                    v_invoice_number := 'T5-' || v_booking.booking_id || '-' || v_target_month;

                    IF NOT p_dry_run THEN
                        INSERT INTO invoices (
                        booking_id,
                        user_id,
                        billing_month,
                        billing_period_start,
                        billing_period_end,
                        invoice_number,
                        amount,
                        tax_rate,
                        tax_amount,
                        total_amount,
                        due_date,
                        status,
                        currency,
                        created_at,
                        updated_at
                    ) VALUES (
                        v_booking.id,
                        v_booking.user_id,
                        v_target_month,
                        v_month_start,
                        v_month_end,
                        v_invoice_number,
                        v_base_amount,
                        v_tax_rate,
                        v_tax_amount,
                        v_total_amount,
                        v_next_billing_date,
                        'pending',
                        'INR',
                        now(),
                        now()
                        )
                        RETURNING id, invoice_number INTO v_invoice_id, v_invoice_number;
                    ELSE
                        -- dry-run: set would-be invoice id; invoice_number already prepared
                        v_invoice_id := NULL;
                    END IF;
                    
                    RAISE NOTICE '✅ Invoice generated: % for booking % (month %)', 
                        v_invoice_number, v_booking.booking_id, v_target_month;

                    -- 2. Ensure container exists for this booking/month and then generate monthly classes
                    v_container_code := 'T5-' || v_booking.booking_id || '-' || v_target_month;
                    v_container_display := COALESCE(v_booking.first_name || ' ' || v_booking.last_name, v_booking.booking_id) || ' (' || v_target_month || ')';

                    SELECT id INTO v_container_id
                    FROM class_containers
                    WHERE container_code = v_container_code;

                    IF v_container_id IS NULL THEN
                        IF NOT p_dry_run THEN
                            INSERT INTO class_containers (
                                container_code,
                                display_name,
                                container_type,
                                instructor_id,
                                package_id,
                                max_booking_count,
                                created_by,
                                created_at,
                                updated_at
                            ) VALUES (
                                v_container_code,
                                v_container_display,
                                'individual',
                                v_booking.instructor_id,
                                v_booking.class_package_id,
                                1,
                                v_booking.user_id,
                                now(),
                                now()
                            ) RETURNING id INTO v_container_id;
                        ELSE
                            -- dry-run: leave container_id NULL to indicate would-be-created
                            v_container_id := NULL;
                        END IF;
                    END IF;

                    -- 2a. Generate monthly classes based on preferred_days
                    v_current_date := v_month_start;
                    v_classes_needed := v_booking.class_count;
                    v_assignment_ids := ARRAY[]::uuid[];

                    WHILE v_current_date <= v_month_end AND v_classes_generated < v_classes_needed LOOP
                        v_day_of_week := EXTRACT(DOW FROM v_current_date)::integer; -- 0=Sunday, 6=Saturday

                        -- Convert day number to day name for preferred_days check
                        v_preferred_day := CASE v_day_of_week
                            WHEN 0 THEN 'sunday'
                            WHEN 1 THEN 'monday'
                            WHEN 2 THEN 'tuesday'
                            WHEN 3 THEN 'wednesday'
                            WHEN 4 THEN 'thursday'
                            WHEN 5 THEN 'friday'
                            WHEN 6 THEN 'saturday'
                        END;

                        -- Check if this day is in preferred_days
                        IF v_preferred_day = ANY(v_booking.preferred_days) THEN
                            -- generate a unique assignment code for this generated class
                            v_assignment_code := 'ASG-' || v_booking.booking_id || '-' || to_char(v_current_date, 'YYYYMMDD') || '-' || (v_classes_generated + 1)::text;
                            -- Insert class assignment (attach to container) or simulate in dry-run
                            IF NOT p_dry_run THEN
                                INSERT INTO class_assignments (
                                    package_id,
                                    class_package_id,
                                    date,
                                    start_time,
                                    end_time,
                                    instructor_id,
                                    class_container_id,
                                    payment_amount,
                                    schedule_type,
                                    assigned_by,
                                    booking_type,
                                    class_status,
                                    payment_status,
                                    instructor_status,
                                    assignment_code,
                                    created_at,
                                    updated_at
                                ) VALUES (
                                    v_booking.class_package_id,
                                    v_booking.class_package_id,
                                    v_current_date,
                                        NULL,
                                        NULL,
                                    v_booking.instructor_id,
                                    v_container_id,
                                    v_per_class_amount,
                                    'monthly',
                                    v_booking.user_id,
                                    'individual',
                                    'scheduled',
                                    'pending',
                                    'pending',
                                    v_assignment_code,
                                    now(),
                                    now()
                                )
                                RETURNING id INTO v_assignment_id;

                                -- Link assignment to booking and record container
                                INSERT INTO assignment_bookings (
                                    assignment_id,
                                    booking_id,
                                    class_container_id
                                ) VALUES (
                                    v_assignment_id,
                                    v_booking.booking_id,
                                    v_container_id
                                );
                            ELSE
                                -- dry-run: do not insert, set assignment id to NULL (but count it)
                                v_assignment_id := NULL;
                            END IF;

                            v_assignment_ids := array_append(v_assignment_ids, v_assignment_id);
                            v_classes_generated := v_classes_generated + 1;
                        END IF;

                        v_current_date := v_current_date + 1;
                    END LOOP;

                    RAISE NOTICE '✅ Generated % classes for booking % (month %)', 
                        v_classes_generated, v_booking.booking_id, v_target_month;
                END;
                
                v_total_generated := v_total_generated + 1;
                
                v_result := jsonb_build_object(
                    'booking_id', v_booking.booking_id,
                    'status', 'generated',
                    'calendar_month', v_target_month,
                    'due_date', v_next_billing_date,
                    'invoice_id', v_invoice_id,
                    'invoice_number', v_invoice_number,
                    'classes_generated', v_classes_generated
                );
                v_results := v_results || v_result;
                
            EXCEPTION WHEN OTHERS THEN
                v_total_errors := v_total_errors + 1;
                v_result := jsonb_build_object(
                    'booking_id', v_booking.booking_id,
                    'status', 'error',
                    'reason', SQLERRM
                );
                v_results := v_results || v_result;
                
                RAISE WARNING 'Failed to generate invoice+classes for booking %: %', 
                    v_booking.booking_id, SQLERRM;
            END;
            
        END;
    END LOOP;
    
    RAISE NOTICE 'T-5 invoice+class generation complete. Checked=%, Generated=%, Skipped=%, Errors=%',
        v_total_checked, v_total_generated, v_total_skipped, v_total_errors;
    
    RETURN jsonb_build_object(
        'total_checked', v_total_checked,
        'total_generated', v_total_generated,
        'total_skipped', v_total_skipped,
        'total_errors', v_total_errors,
        'execution_date', v_today,
        'results', v_results
    );
END;
$$;

-- Grant execute to service_role only on impl
REVOKE ALL ON FUNCTION generate_t5_invoices_impl(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_t5_invoices_impl(uuid, boolean) TO service_role;

COMMENT ON FUNCTION generate_t5_invoices_impl(p_booking_id uuid, p_dry_run boolean) IS 
'PHASE 8: Generate invoices AND monthly classes 5 days before billing cycle for recurring bookings. Called by daily cron job.';

-- SQL wrapper: zero-arg (dry-run)
CREATE OR REPLACE FUNCTION generate_t5_invoices()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT generate_t5_invoices_impl(NULL, true);
$$;

-- SQL wrapper: two-arg forwarding to impl
CREATE OR REPLACE FUNCTION generate_t5_invoices(p_booking_id uuid, p_dry_run boolean)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT generate_t5_invoices_impl(p_booking_id, p_dry_run);
$$;

-- Grant execute to service_role on wrappers
REVOKE ALL ON FUNCTION generate_t5_invoices() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_t5_invoices() TO service_role;
REVOKE ALL ON FUNCTION generate_t5_invoices(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_t5_invoices(uuid, boolean) TO service_role;
