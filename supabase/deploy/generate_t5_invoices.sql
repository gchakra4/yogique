-- ============================================================================
-- PHASE 8: T-5 AUTOMATED INVOICE GENERATION RPC FUNCTION
-- ============================================================================
-- Purpose: Generate invoices 5 days before billing cycle for recurring bookings
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
    v_invoice_exists boolean;
    v_total_checked integer := 0;
    v_total_generated integer := 0;
    v_total_skipped integer := 0;
    v_total_errors integer := 0;
    v_results jsonb := '[]'::jsonb;
    v_result jsonb;
    v_t5_date date;
    v_billing_cycle_anchor date;
    v_days_until_billing integer;
BEGIN
    v_today := current_date;
    
    RAISE NOTICE 'Starting T-5 invoice generation for date: %', v_today;
    
    -- Loop through all recurring bookings
    FOR v_booking IN
        SELECT 
            b.booking_id,
            b.user_id,
            b.billing_cycle_anchor,
            b.access_status,
            b.status,
            b.is_recurring,
            b.first_name,
            b.last_name,
            b.email
        FROM bookings b
        WHERE b.is_recurring = true
          AND b.status IN ('confirmed', 'active')
          AND b.access_status != 'overdue_locked'
          AND b.billing_cycle_anchor IS NOT NULL
    LOOP
        v_total_checked := v_total_checked + 1;
        
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
                WHERE booking_id = v_booking.booking_id
                  AND calendar_month = v_target_month
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
            
            -- Generate invoice using existing logic
            -- NOTE: This is a simplified version. In production, you would call
            -- the comprehensive invoice generation logic from Phase 4
            BEGIN
                INSERT INTO invoices (
                    booking_id,
                    user_id,
                    calendar_month,
                    due_date,
                    status,
                    created_at,
                    updated_at
                ) VALUES (
                    v_booking.booking_id,
                    v_booking.user_id,
                    v_target_month,
                    v_next_billing_date,
                    'pending',
                    now(),
                    now()
                )
                RETURNING id INTO STRICT v_result;
                
                v_total_generated := v_total_generated + 1;
                
                v_result := jsonb_build_object(
                    'booking_id', v_booking.booking_id,
                    'status', 'generated',
                    'calendar_month', v_target_month,
                    'due_date', v_next_billing_date,
                    'invoice_id', v_result
                );
                v_results := v_results || v_result;
                
                RAISE NOTICE '✅ Generated invoice for booking % (month %)', 
                    v_booking.booking_id, v_target_month;
                
            EXCEPTION WHEN OTHERS THEN
                v_total_errors := v_total_errors + 1;
                v_result := jsonb_build_object(
                    'booking_id', v_booking.booking_id,
                    'status', 'error',
                    'reason', SQLERRM
                );
                v_results := v_results || v_result;
                
                RAISE WARNING 'Failed to generate invoice for booking %: %', 
                    v_booking.booking_id, SQLERRM;
            END;
            
        END;
    END LOOP;
    
    RAISE NOTICE 'T-5 invoice generation complete. Checked=%, Generated=%, Skipped=%, Errors=%',
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
'PHASE 8: Generate invoices 5 days before billing cycle for recurring bookings. Called by daily cron job.';
