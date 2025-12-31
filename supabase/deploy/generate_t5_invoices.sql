-- ============================================================================
-- PHASE 8: T-5 AUTOMATED INVOICE + CLASS GENERATION RPC FUNCTION
-- ============================================================================
-- Purpose: Generate invoices AND monthly classes 5 days before billing cycle
-- Called by: Edge function generate-t5-invoices (daily cron at 1 AM UTC)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_t5_invoices()
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
            b.instructor_id,
            b.start_time,
            b.end_time,
            b.preferred_days,
            cp.class_count,
            cp.total_amount
        FROM bookings b
        JOIN class_packages cp ON cp.id = b.class_package_id
        WHERE b.is_recurring = true
          AND b.status IN ('confirmed', 'active')
          AND b.access_status != 'overdue_locked'
          AND b.billing_cycle_anchor IS NOT NULL
          AND b.class_package_id IS NOT NULL
          AND b.preferred_days IS NOT NULL
          AND array_length(b.preferred_days, 1) > 0
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
                BEGIN
                    v_per_class_amount := v_booking.total_amount / v_booking.class_count;
                    v_base_amount := v_booking.total_amount;
                    v_tax_rate := 0.18; -- 18% GST
                    v_tax_amount := ROUND(v_base_amount * v_tax_rate, 2);
                    v_total_amount := v_base_amount + v_tax_amount;
                    
                    INSERT INTO invoices (
                        booking_id,
                        user_id,
                        billing_month,
                        billing_period_start,
                        billing_period_end,
                        base_amount,
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
                    
                    RAISE NOTICE '✅ Invoice generated: % for booking % (month %)', 
                        v_invoice_number, v_booking.booking_id, v_target_month;
                    
                    -- 2. Generate monthly classes based on preferred_days
                    DECLARE
                        v_current_date date;
                        v_day_of_week integer;
                        v_preferred_day text;
                        v_classes_needed integer;
                    BEGIN
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
                                -- Insert class assignment
                                INSERT INTO class_assignments (
                                    package_id,
                                    class_package_id,
                                    date,
                                    start_time,
                                    end_time,
                                    instructor_id,
                                    payment_amount,
                                    schedule_type,
                                    assigned_by,
                                    booking_type,
                                    class_status,
                                    payment_status,
                                    instructor_status,
                                    calendar_month,
                                    is_adjustment,
                                    created_at,
                                    updated_at
                                ) VALUES (
                                    v_booking.class_package_id,
                                    v_booking.class_package_id,
                                    v_current_date,
                                    v_booking.start_time,
                                    v_booking.end_time,
                                    v_booking.instructor_id,
                                    v_per_class_amount,
                                    'monthly',
                                    'system_automated',
                                    'individual',
                                    'scheduled',
                                    'pending',
                                    'pending',
                                    v_target_month,
                                    false,
                                    now(),
                                    now()
                                )
                                RETURNING id INTO v_assignment_id;
                                
                                v_assignment_ids := array_append(v_assignment_ids, v_assignment_id);
                                v_classes_generated := v_classes_generated + 1;
                                
                                -- Link assignment to booking
                                INSERT INTO assignment_bookings (
                                    assignment_id,
                                    booking_id
                                ) VALUES (
                                    v_assignment_id,
                                    v_booking.id
                                );
                            END IF;
                            
                            v_current_date := v_current_date + 1;
                        END LOOP;
                        
                        RAISE NOTICE '✅ Generated % classes for booking % (month %)', 
                            v_classes_generated, v_booking.booking_id, v_target_month;
                    END;
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

-- Grant execute to service_role only
REVOKE ALL ON FUNCTION generate_t5_invoices() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_t5_invoices() TO service_role;

COMMENT ON FUNCTION generate_t5_invoices() IS 
'PHASE 8: Generate invoices AND monthly classes 5 days before billing cycle for recurring bookings. Called by daily cron job.';
