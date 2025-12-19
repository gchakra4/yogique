-- ============================================================================
-- MODULE 4: Payment Reconciliation
-- ============================================================================
-- Purpose: Process Razorpay webhooks and reconcile payments with invoices
-- Owns: Payment event logging, invoice status updates, transaction creation
-- Does NOT: Update booking access_status (Module 5), send confirmation emails
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. ALTER TRANSACTIONS TABLE: Add invoice payment columns
-- ----------------------------------------------------------------------------

-- Add columns for Razorpay invoice payments
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id),
ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id),
ADD COLUMN IF NOT EXISTS transaction_type text CHECK (transaction_type IN ('payment', 'refund', 'subscription')),
ADD COLUMN IF NOT EXISTS payment_status text,
ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
ADD COLUMN IF NOT EXISTS razorpay_payment_link_id text,
ADD COLUMN IF NOT EXISTS notes text;

-- Create index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON public.transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);

-- ----------------------------------------------------------------------------
-- 1. CREATE FUNCTION: Process Payment Event (Idempotent)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_payment_event(
    p_event_id text,
    p_event_type text,
    p_payment_link_id text,
    p_razorpay_payment_id text,
    p_amount numeric,
    p_currency text,
    p_signature_verified boolean,
    p_payload jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_link_id uuid;
    v_invoice_id uuid;
    v_invoice_number text;
    v_booking_id uuid;
    v_user_id uuid;
    v_total_amount numeric;
    v_invoice_status text;
    v_payment_link_status text;
    v_transaction_id uuid;
    v_payment_event_id uuid;
BEGIN
    -- Check if event already processed (idempotency check)
    IF EXISTS (SELECT 1 FROM public.payment_events WHERE event_id = p_event_id) THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Event already processed',
            'event_id', p_event_id,
            'idempotent', true
        );
    END IF;

    -- Log payment event first (for audit trail)
    -- First, find the payment_link UUID from razorpay_link_id
    SELECT id INTO v_payment_link_id
    FROM public.payment_links
    WHERE razorpay_link_id = p_payment_link_id;

    INSERT INTO public.payment_events (
        event_id,
        event_type,
        payment_link_id,
        signature_verified,
        payload,
        processed_at
    ) VALUES (
        p_event_id,
        p_event_type,
        v_payment_link_id,
        p_signature_verified,
        p_payload,
        NOW()
    ) RETURNING id INTO v_payment_event_id;

    -- Get invoice details from the payment link we just found
    SELECT 
        i.id,
        i.invoice_number,
        i.booking_id,
        i.user_id,
        i.total_amount,
        i.status,
        pl.status
    INTO 
        v_invoice_id,
        v_invoice_number,
        v_booking_id,
        v_user_id,
        v_total_amount,
        v_invoice_status,
        v_payment_link_status
    FROM public.payment_links pl
    JOIN public.invoices i ON i.id = pl.invoice_id
    WHERE pl.id = v_payment_link_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment link not found',
            'razorpay_link_id', p_payment_link_id,
            'event_logged', true
        );
    END IF;

    -- Only process if signature verified
    IF NOT p_signature_verified THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Signature verification failed',
            'event_logged', true
        );
    END IF;

    -- Process based on event type
    IF p_event_type IN ('payment_link.paid', 'payment.captured') THEN
        -- Update invoice status to paid
        UPDATE public.invoices
        SET 
            status = 'paid',
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = v_invoice_id
          AND status = 'pending';

        -- Update payment link status to paid
        UPDATE public.payment_links
        SET 
            status = 'paid',
            updated_at = NOW()
        WHERE id = v_payment_link_id
          AND status = 'created';

        -- Create transaction record
        INSERT INTO public.transactions (
            user_id,
            booking_id,
            transaction_type,
            amount,
            payment_method,
            payment_status,
            razorpay_payment_id,
            razorpay_payment_link_id,
            invoice_id,
            notes
        ) VALUES (
            v_user_id,
            v_booking_id,
            'payment',
            p_amount,
            'razorpay',
            'completed',
            p_razorpay_payment_id,
            p_payment_link_id,
            v_invoice_id,
            format('Payment for invoice %s', v_invoice_number)
        ) RETURNING id INTO v_transaction_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Payment processed successfully',
            'event_id', p_event_id,
            'payment_event_id', v_payment_event_id,
            'invoice_id', v_invoice_id,
            'invoice_number', v_invoice_number,
            'transaction_id', v_transaction_id,
            'invoice_status', 'paid',
            'amount', p_amount
        );

    ELSIF p_event_type = 'payment.failed' THEN
        -- Log failure, don't update invoice status
        RETURN json_build_object(
            'success', true,
            'message', 'Payment failure logged',
            'event_id', p_event_id,
            'payment_event_id', v_payment_event_id,
            'invoice_id', v_invoice_id,
            'action', 'no_status_change'
        );

    ELSIF p_event_type = 'refund.created' THEN
        -- Handle refund (create negative transaction)
        INSERT INTO public.transactions (
            user_id,
            booking_id,
            transaction_type,
            amount,
            payment_method,
            payment_status,
            razorpay_payment_id,
            invoice_id,
            notes
        ) VALUES (
            v_user_id,
            v_booking_id,
            'refund',
            -p_amount,
            'razorpay',
            'completed',
            p_razorpay_payment_id,
            v_invoice_id,
            format('Refund for invoice %s', v_invoice_number)
        ) RETURNING id INTO v_transaction_id;

        -- Update invoice status to refunded
        UPDATE public.invoices
        SET 
            status = 'refunded',
            updated_at = NOW()
        WHERE id = v_invoice_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Refund processed',
            'event_id', p_event_id,
            'payment_event_id', v_payment_event_id,
            'transaction_id', v_transaction_id,
            'invoice_status', 'refunded'
        );

    ELSE
        -- Log unknown event type
        RETURN json_build_object(
            'success', true,
            'message', 'Event type not handled',
            'event_type', p_event_type,
            'event_logged', true
        );
    END IF;

EXCEPTION
    WHEN unique_violation THEN
        -- Event already processed (race condition)
        RETURN json_build_object(
            'success', true,
            'message', 'Event already processed (concurrent)',
            'event_id', p_event_id,
            'idempotent', true
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'event_id', p_event_id
        );
END;
$$;

COMMENT ON FUNCTION public.process_payment_event IS 'Process Razorpay webhook events with idempotency (Module 4)';

-- ----------------------------------------------------------------------------
-- 2. CREATE FUNCTION: Verify Payment Signature (Helper)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_razorpay_signature(
    p_payload text,
    p_signature text,
    p_webhook_secret text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_computed_signature text;
BEGIN
    -- Compute HMAC-SHA256 signature
    v_computed_signature := encode(
        hmac(p_payload::bytea, p_webhook_secret::bytea, 'sha256'),
        'hex'
    );

    -- Compare signatures (constant-time comparison recommended in production)
    RETURN v_computed_signature = p_signature;
END;
$$;

COMMENT ON FUNCTION public.verify_razorpay_signature IS 'Verify Razorpay webhook HMAC-SHA256 signature';

-- ----------------------------------------------------------------------------
-- 3. CREATE FUNCTION: Get Payment History for Invoice
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_payment_history(p_invoice_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'invoice_id', i.id,
        'invoice_number', i.invoice_number,
        'status', i.status,
        'total_amount', i.total_amount,
        'paid_at', i.paid_at,
        'payment_events', (
            SELECT json_agg(
                json_build_object(
                    'event_id', pe.event_id,
                    'event_type', pe.event_type,
                    'signature_verified', pe.signature_verified,
                    'processed_at', pe.processed_at
                ) ORDER BY pe.processed_at DESC
            )
            FROM public.payment_events pe
            JOIN public.payment_links pl ON pl.id = pe.payment_link_id
            WHERE pl.invoice_id = i.id
        ),
        'transactions', (
            SELECT json_agg(
                json_build_object(
                    'transaction_id', t.id,
                    'transaction_type', t.transaction_type,
                    'amount', t.amount,
                    'payment_status', t.payment_status,
                    'created_at', t.created_at
                ) ORDER BY t.created_at DESC
            )
            FROM public.transactions t
            WHERE t.invoice_id = i.id
        )
    )
    INTO v_result
    FROM public.invoices i
    WHERE i.id = p_invoice_id;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_payment_history IS 'Get complete payment history for an invoice';

-- ----------------------------------------------------------------------------
-- 4. CREATE VIEW: Recent Payment Events Dashboard
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.recent_payment_events_v AS
SELECT 
    pe.id AS payment_event_id,
    pe.event_id,
    pe.event_type,
    pe.signature_verified,
    pe.processed_at,
    pl.id AS payment_link_id,
    pl.short_url,
    pl.razorpay_link_id,
    i.id AS invoice_id,
    i.invoice_number,
    i.total_amount AS amount,
    i.currency,
    i.status AS invoice_status,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    EXTRACT(EPOCH FROM (NOW() - pe.processed_at))/60 AS minutes_ago
FROM public.payment_events pe
LEFT JOIN public.payment_links pl ON pl.id = pe.payment_link_id
LEFT JOIN public.invoices i ON i.id = pl.invoice_id
LEFT JOIN public.bookings b ON b.id = i.booking_id
ORDER BY pe.processed_at DESC
LIMIT 100;

COMMENT ON VIEW public.recent_payment_events_v IS 'Last 100 payment events for monitoring dashboard';

-- ----------------------------------------------------------------------------
-- 5. CREATE VIEW: Failed Payments Dashboard
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.failed_payments_v AS
SELECT 
    pe.id AS payment_event_id,
    pe.event_id,
    pe.processed_at,
    i.id AS invoice_id,
    i.invoice_number,
    i.total_amount AS amount,
    i.due_date,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.phone AS customer_phone,
    pl.short_url AS payment_link_url,
    pl.razorpay_link_id,
    EXTRACT(EPOCH FROM (NOW() - pe.processed_at))/3600 AS hours_since_failure
FROM public.payment_events pe
JOIN public.payment_links pl ON pl.id = pe.payment_link_id
JOIN public.invoices i ON i.id = pl.invoice_id
JOIN public.bookings b ON b.id = i.booking_id
WHERE pe.event_type = 'payment.failed'
ORDER BY pe.processed_at DESC;

COMMENT ON VIEW public.failed_payments_v IS 'Failed payment attempts for follow-up';

-- ----------------------------------------------------------------------------
-- 6. CREATE VIEW: Paid Invoices Summary
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.paid_invoices_v AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    i.booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    i.total_amount,
    i.currency,
    i.billing_month,
    i.paid_at,
    t.razorpay_payment_id,
    t.id AS transaction_id,
    EXTRACT(EPOCH FROM (i.paid_at - i.created_at))/3600 AS hours_to_payment
FROM public.invoices i
JOIN public.bookings b ON b.id = i.booking_id
LEFT JOIN public.transactions t ON t.invoice_id = i.id AND t.transaction_type = 'payment'
WHERE i.status = 'paid'
ORDER BY i.paid_at DESC;

COMMENT ON VIEW public.paid_invoices_v IS 'Successfully paid invoices with payment details';

-- ----------------------------------------------------------------------------
-- 7. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Service-role functions (webhook endpoint only)
GRANT EXECUTE ON FUNCTION public.process_payment_event TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_razorpay_signature TO service_role;

-- Authenticated user functions
GRANT EXECUTE ON FUNCTION public.get_payment_history TO authenticated;

-- Views
GRANT SELECT ON public.recent_payment_events_v TO authenticated;
GRANT SELECT ON public.failed_payments_v TO authenticated;
GRANT SELECT ON public.paid_invoices_v TO authenticated;

-- ----------------------------------------------------------------------------
-- END OF MODULE 4 MIGRATION
-- ----------------------------------------------------------------------------
