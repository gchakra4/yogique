-- ============================================================================
-- MODULE 3: Payment Link Management
-- ============================================================================
-- Purpose: Create and manage Razorpay payment links for invoices
-- Owns: Payment link creation, email delivery, link expiry management
-- Does NOT: Process payments (Module 4), update access status (Module 5)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE FUNCTION: Store Payment Link from Razorpay Response
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.store_payment_link(
    p_invoice_id uuid,
    p_razorpay_link_id text,
    p_short_url text,
    p_expires_at timestamptz,
    p_razorpay_response jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_link_id uuid;
    v_invoice record;
BEGIN
    -- Verify invoice exists and is pending
    SELECT id, invoice_number, booking_id, user_id, status
    INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    IF v_invoice.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Invoice is not pending');
    END IF;

    -- Check if payment link already exists
    IF EXISTS (SELECT 1 FROM public.payment_links WHERE invoice_id = p_invoice_id) THEN
        -- Update existing link
        UPDATE public.payment_links
        SET 
            razorpay_link_id = p_razorpay_link_id,
            short_url = p_short_url,
            status = 'created',
            expires_at = p_expires_at,
            razorpay_response = p_razorpay_response,
            updated_at = NOW()
        WHERE invoice_id = p_invoice_id
        RETURNING id INTO v_payment_link_id;
    ELSE
        -- Insert new payment link
        INSERT INTO public.payment_links (
            invoice_id,
            razorpay_link_id,
            short_url,
            status,
            expires_at,
            razorpay_response
        ) VALUES (
            p_invoice_id,
            p_razorpay_link_id,
            p_short_url,
            'created',
            p_expires_at,
            p_razorpay_response
        ) RETURNING id INTO v_payment_link_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'payment_link_id', v_payment_link_id,
        'invoice_id', p_invoice_id,
        'invoice_number', v_invoice.invoice_number,
        'short_url', p_short_url
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.store_payment_link IS 'Store payment link metadata from Razorpay API response';

-- ----------------------------------------------------------------------------
-- 2. CREATE FUNCTION: Get Invoice Details for Payment Link Creation
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_invoice_for_payment_link(p_invoice_id uuid)
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
        'booking_id', b.id,
        'booking_ref', b.booking_id,
        'customer_name', b.first_name || ' ' || b.last_name,
        'customer_email', b.email,
        'customer_phone', b.phone,
        'amount', i.amount,
        'tax_amount', i.tax_amount,
        'total_amount', i.total_amount,
        'currency', i.currency,
        'billing_period_start', i.billing_period_start,
        'billing_period_end', i.billing_period_end,
        'billing_month', i.billing_month,
        'due_date', i.due_date,
        'proration_note', i.proration_note,
        'package_name', cp.name,
        'status', i.status
    )
    INTO v_result
    FROM public.invoices i
    JOIN public.bookings b ON b.id = i.booking_id
    LEFT JOIN public.class_packages cp ON cp.id = b.class_package_id
    WHERE i.id = p_invoice_id;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_invoice_for_payment_link IS 'Get comprehensive invoice details for Razorpay payment link creation';

-- ----------------------------------------------------------------------------
-- 3. CREATE FUNCTION: Mark Payment Links as Expired
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_payment_links()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_count integer;
BEGIN
    UPDATE public.payment_links
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE status = 'created'
      AND expires_at < NOW();

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'expired_count', v_expired_count,
        'timestamp', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.expire_payment_links IS 'Mark expired payment links (run daily via cron)';

-- ----------------------------------------------------------------------------
-- 4. CREATE FUNCTION: Cancel Payment Link
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_payment_link(p_invoice_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_link record;
BEGIN
    -- Get payment link details
    SELECT id, razorpay_link_id, status
    INTO v_payment_link
    FROM public.payment_links
    WHERE invoice_id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Payment link not found');
    END IF;

    IF v_payment_link.status = 'cancelled' THEN
        RETURN json_build_object('success', false, 'error', 'Payment link already cancelled');
    END IF;

    -- Update status to cancelled
    UPDATE public.payment_links
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_payment_link.id;

    RETURN json_build_object(
        'success', true,
        'payment_link_id', v_payment_link.id,
        'razorpay_link_id', v_payment_link.razorpay_link_id,
        'message', 'Payment link cancelled (API cancellation required separately)'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.cancel_payment_link IS 'Cancel payment link in database (caller must also cancel via Razorpay API)';

-- ----------------------------------------------------------------------------
-- 5. CREATE VIEW: Pending Invoices for Payment Link Creation
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.invoices_needing_payment_links_v AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    i.booking_id,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    b.phone AS customer_phone,
    i.total_amount,
    i.currency,
    i.due_date,
    i.billing_month,
    i.created_at AS invoice_created_at,
    EXTRACT(EPOCH FROM (NOW() - i.created_at))/3600 AS hours_since_created
FROM public.invoices i
JOIN public.bookings b ON b.id = i.booking_id
WHERE i.status = 'pending'
  AND NOT EXISTS (
      SELECT 1 FROM public.payment_links pl
      WHERE pl.invoice_id = i.id
  )
ORDER BY i.created_at ASC;

COMMENT ON VIEW public.invoices_needing_payment_links_v IS 'Pending invoices without active/expired payment links';

-- ----------------------------------------------------------------------------
-- 6. CREATE VIEW: Active Payment Links Dashboard
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.active_payment_links_v AS
SELECT 
    pl.id AS payment_link_id,
    pl.razorpay_link_id,
    pl.short_url,
    pl.status,
    pl.expires_at,
    pl.created_at AS link_created_at,
    i.id AS invoice_id,
    i.invoice_number,
    i.total_amount,
    i.currency,
    i.due_date,
    i.status AS invoice_status,
    b.booking_id AS booking_ref,
    b.first_name || ' ' || b.last_name AS customer_name,
    b.email AS customer_email,
    CASE 
        WHEN pl.expires_at < NOW() THEN 'expired'
        WHEN pl.expires_at < NOW() + INTERVAL '24 hours' THEN 'expiring_soon'
        ELSE 'active'
    END AS expiry_status,
    EXTRACT(EPOCH FROM (pl.expires_at - NOW()))/3600 AS hours_until_expiry
FROM public.payment_links pl
JOIN public.invoices i ON i.id = pl.invoice_id
JOIN public.bookings b ON b.id = i.booking_id
WHERE pl.status = 'created'
ORDER BY pl.expires_at ASC;

COMMENT ON VIEW public.active_payment_links_v IS 'Active payment links with expiry status';

-- ----------------------------------------------------------------------------
-- 7. CREATE FUNCTION: Get Payment Link Status for Invoice
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_payment_link_status(p_invoice_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'has_payment_link', EXISTS (SELECT 1 FROM public.payment_links WHERE invoice_id = p_invoice_id),
        'payment_link_id', pl.id,
        'razorpay_link_id', pl.razorpay_link_id,
        'short_url', pl.short_url,
        'status', pl.status,
        'expires_at', pl.expires_at,
        'is_expired', pl.expires_at < NOW(),
        'is_active', pl.status = 'created' AND pl.expires_at >= NOW()
    )
    INTO v_result
    FROM public.payment_links pl
    WHERE pl.invoice_id = p_invoice_id
    ORDER BY pl.created_at DESC
    LIMIT 1;

    IF v_result IS NULL THEN
        RETURN json_build_object('has_payment_link', false);
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_payment_link_status IS 'Get current payment link status for an invoice';

-- ----------------------------------------------------------------------------
-- 8. CREATE TABLE: Email Delivery Log
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invoice_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    recipient_email text NOT NULL,
    email_type text NOT NULL CHECK (email_type IN ('invoice_with_link', 'reminder', 'payment_received')),
    payment_link_id uuid REFERENCES public.payment_links(id) ON DELETE SET NULL,
    sent_at timestamptz DEFAULT NOW(),
    email_provider_id text,
    email_status text DEFAULT 'sent' CHECK (email_status IN ('sent', 'delivered', 'bounced', 'failed')),
    metadata jsonb,
    created_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_invoice_emails_invoice_id ON public.invoice_emails(invoice_id);
CREATE INDEX idx_invoice_emails_sent_at ON public.invoice_emails(sent_at DESC);
CREATE INDEX idx_invoice_emails_status ON public.invoice_emails(email_status);

COMMENT ON TABLE public.invoice_emails IS 'Log of all invoice-related emails sent to customers';

-- ----------------------------------------------------------------------------
-- 9. ENABLE RLS ON invoice_emails
-- ----------------------------------------------------------------------------

ALTER TABLE public.invoice_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to invoice_emails"
    ON public.invoice_emails
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users view own invoice emails"
    ON public.invoice_emails
    FOR SELECT
    TO authenticated
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- 10. CREATE FUNCTION: Log Invoice Email
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_invoice_email(
    p_invoice_id uuid,
    p_recipient_email text,
    p_email_type text,
    p_payment_link_id uuid DEFAULT NULL,
    p_email_provider_id text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email_log_id uuid;
BEGIN
    INSERT INTO public.invoice_emails (
        invoice_id,
        recipient_email,
        email_type,
        payment_link_id,
        email_provider_id,
        metadata
    ) VALUES (
        p_invoice_id,
        p_recipient_email,
        p_email_type,
        p_payment_link_id,
        p_email_provider_id,
        p_metadata
    ) RETURNING id INTO v_email_log_id;

    RETURN json_build_object(
        'success', true,
        'email_log_id', v_email_log_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.log_invoice_email IS 'Log email delivery for audit trail';

-- ----------------------------------------------------------------------------
-- 11. GRANT PERMISSIONS
-- ----------------------------------------------------------------------------

-- Service-role functions
GRANT EXECUTE ON FUNCTION public.store_payment_link TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_payment_links TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_payment_link TO service_role;
GRANT EXECUTE ON FUNCTION public.log_invoice_email TO service_role;

-- Authenticated user functions
GRANT EXECUTE ON FUNCTION public.get_invoice_for_payment_link TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_link_status TO authenticated;

-- Views
GRANT SELECT ON public.invoices_needing_payment_links_v TO authenticated;
GRANT SELECT ON public.active_payment_links_v TO authenticated;

-- Table
GRANT SELECT ON public.invoice_emails TO authenticated;
GRANT ALL ON public.invoice_emails TO service_role;

-- ----------------------------------------------------------------------------
-- END OF MODULE 3 MIGRATION
-- ----------------------------------------------------------------------------
