BEGIN;

-- Ensure booking_status enum exists with all 9 values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'pending',
      'confirmed',
      'classes_assigned',
      'active',
      'user_cancelled',
      'admin_cancelled',
      'completed',
      'suspended',
      'discontinued'
    );
  END IF;
END
$$;

-- Add any missing enum values safely
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'classes_assigned';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'user_cancelled';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'admin_cancelled';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'discontinued';

-- Drop legacy CHECK constraint that blocks new statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_status;

-- Drop dependent views before altering the column type
DROP VIEW IF EXISTS public.active_recurring_bookings_v CASCADE;
DROP VIEW IF EXISTS public.admin_bookings_access_v CASCADE;
DROP VIEW IF EXISTS public.admin_invoices_dashboard_v CASCADE;
DROP VIEW IF EXISTS public.bookings_at_risk_v CASCADE;
DROP VIEW IF EXISTS public.instructor_classes_v CASCADE;
DROP VIEW IF EXISTS public.invoices_pending_generation_v CASCADE;
DROP VIEW IF EXISTS public.locked_bookings_dashboard_v CASCADE;

-- Alter bookings.status to enum if needed, set default to pending
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
      AND column_name = 'status'
      AND udt_name <> 'booking_status'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE bookings ALTER COLUMN status TYPE booking_status USING status::booking_status;
  END IF;
END
$$;

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending';

COMMIT;

-- Recreate views with enum-safe status comparisons
CREATE OR REPLACE VIEW public.active_recurring_bookings_v AS
SELECT b.id,
  b.booking_id,
  b.user_id,
  (b.first_name || ' ') || b.last_name AS customer_name,
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
  count(i.id) FILTER (WHERE i.status = 'pending'::invoice_status) AS pending_invoice_count,
  count(i.id) FILTER (WHERE i.status = 'overdue'::invoice_status) AS overdue_invoice_count,
  max(i.due_date) FILTER (WHERE i.status = ANY (ARRAY['pending'::invoice_status, 'overdue'::invoice_status])) AS next_due_date
FROM bookings b
LEFT JOIN class_packages cp ON cp.id = b.class_package_id
LEFT JOIN invoices i ON i.booking_id = b.id
WHERE b.is_recurring = true
  AND (b.status::text <> ALL (ARRAY['cancelled','completed']))
GROUP BY b.id, cp.name, cp.price
ORDER BY b.created_at DESC;

CREATE OR REPLACE VIEW public.admin_bookings_access_v AS
SELECT b.id AS booking_id,
  b.booking_id AS booking_ref,
  (b.first_name || ' ') || b.last_name AS customer_name,
  b.email,
  b.phone,
  b.status AS booking_status,
  b.access_status,
  b.is_recurring,
  b.billing_cycle_anchor,
  b.created_at,
  b.updated_at,
  count(DISTINCT i.id) FILTER (WHERE i.status = 'pending'::invoice_status) AS pending_invoices,
  count(DISTINCT i.id) FILTER (WHERE i.status = 'paid'::invoice_status) AS paid_invoices,
  count(DISTINCT i.id) FILTER (WHERE i.status = 'overdue'::invoice_status) AS overdue_invoices,
  sum(i.total_amount) FILTER (WHERE i.status = 'pending'::invoice_status) AS total_pending_amount,
  max(i.due_date) FILTER (WHERE i.status = 'pending'::invoice_status) AS next_due_date,
  count(DISTINCT ca.id) FILTER (WHERE ca.class_status = 'scheduled'::text AND ca.date >= CURRENT_DATE) AS upcoming_classes,
  count(DISTINCT ca.id) FILTER (WHERE ca.class_status = 'completed'::text) AS completed_classes,
  CASE
    WHEN b.access_status = 'active'::access_status THEN 'success'::text
    WHEN b.access_status = 'overdue_grace'::access_status THEN 'warning'::text
    WHEN b.access_status = 'overdue_locked'::access_status THEN 'danger'::text
    ELSE 'neutral'::text
  END AS access_severity
FROM bookings b
LEFT JOIN invoices i ON i.booking_id = b.id
LEFT JOIN assignment_bookings ab ON ab.booking_id = b.booking_id
LEFT JOIN class_assignments ca ON ca.id = ab.assignment_id
GROUP BY b.id, b.booking_id, b.first_name, b.last_name, b.email, b.phone, b.status, b.access_status, b.is_recurring, b.billing_cycle_anchor, b.created_at, b.updated_at
ORDER BY (
  CASE b.access_status
    WHEN 'overdue_locked'::access_status THEN 1
    WHEN 'overdue_grace'::access_status THEN 2
    WHEN 'active'::access_status THEN 3
    ELSE 4
  END
), b.updated_at DESC;

CREATE OR REPLACE VIEW public.admin_invoices_dashboard_v AS
SELECT i.id AS invoice_id,
  i.invoice_number,
  i.status AS invoice_status,
  i.total_amount,
  i.due_date,
  i.created_at,
  i.updated_at,
  b.id AS booking_id,
  b.booking_id AS booking_ref,
  (b.first_name || ' ') || b.last_name AS customer_name,
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
    WHEN i.status = 'pending'::invoice_status AND i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
    ELSE 0
  END AS days_overdue,
  CASE
    WHEN i.status = 'paid'::invoice_status THEN 'success'::text
    WHEN i.status = 'pending'::invoice_status AND i.due_date >= CURRENT_DATE THEN 'warning'::text
    WHEN i.status = 'pending'::invoice_status AND i.due_date < CURRENT_DATE THEN 'danger'::text
    WHEN i.status = 'cancelled'::invoice_status THEN 'neutral'::text
    ELSE 'neutral'::text
  END AS status_severity,
  count(DISTINCT pe.id) AS payment_event_count,
  max(pe.created_at) AS last_payment_event
FROM invoices i
JOIN bookings b ON b.id = i.booking_id
LEFT JOIN payment_links pl ON pl.invoice_id = i.id
LEFT JOIN payment_events pe ON pe.payment_link_id = pl.id
GROUP BY i.id, i.invoice_number, i.status, i.total_amount, i.due_date, i.created_at, i.updated_at, b.id, b.booking_id, b.first_name, b.last_name, b.email, b.phone, b.access_status, b.status, pl.id, pl.razorpay_link_id, pl.short_url, pl.status, pl.expires_at
ORDER BY i.created_at DESC;

CREATE OR REPLACE VIEW public.bookings_at_risk_v AS
SELECT b.id AS booking_id,
  b.booking_id AS booking_ref,
  (b.first_name || ' ') || b.last_name AS customer_name,
  b.email AS customer_email,
  b.phone AS customer_phone,
  b.access_status,
  i.id AS invoice_id,
  i.invoice_number,
  i.total_amount,
  i.due_date,
  CURRENT_DATE - i.due_date AS days_overdue,
  CASE
    WHEN (CURRENT_DATE - i.due_date) >= 11 THEN 'CRITICAL: Will lock today'::text
    WHEN (CURRENT_DATE - i.due_date) >= 8 THEN 'WARNING: Grace period'::text
    WHEN (CURRENT_DATE - i.due_date) >= 5 THEN 'NOTICE: Payment overdue'::text
    ELSE 'OK'::text
  END AS risk_level,
  pl.short_url AS payment_link_url
FROM bookings b
JOIN invoices i ON i.booking_id = b.id
LEFT JOIN payment_links pl ON pl.invoice_id = i.id AND pl.status = 'created'::payment_link_status
WHERE b.is_recurring = true
  AND (b.status::text <> ALL (ARRAY['cancelled','completed']))
  AND i.status = 'pending'::invoice_status
  AND i.due_date < CURRENT_DATE
ORDER BY (CURRENT_DATE - i.due_date) DESC;

CREATE OR REPLACE VIEW public.instructor_classes_v AS
SELECT ca.id AS assignment_id,
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
  (b.first_name || ' ') || b.last_name AS student_name,
  b.access_status,
  b.status AS booking_status,
  CASE
    WHEN b.access_status = 'overdue_locked'::access_status
      AND (ca.class_status <> ALL (ARRAY['completed'::text, 'not_conducted'::text, 'cancelled'::text, 'rescheduled'::text]))
    THEN true
    ELSE false
  END AS is_blocked
FROM class_assignments ca
LEFT JOIN class_types ct ON ct.id = ca.class_type_id
LEFT JOIN assignment_bookings ab ON ab.assignment_id = ca.id
LEFT JOIN bookings b ON b.booking_id = ab.booking_id
WHERE can_view_assignment(ca.id) = true;

CREATE OR REPLACE VIEW public.invoices_pending_generation_v AS
SELECT b.id AS booking_id,
  b.booking_id AS booking_ref,
  b.user_id,
  (b.first_name || ' ') || b.last_name AS customer_name,
  b.email AS customer_email,
  b.billing_cycle_anchor,
  cp.name AS package_name,
  cp.price AS package_price,
  date_trunc('month', CURRENT_DATE + '1 mon'::interval)::date AS next_billing_period_start,
  (date_trunc('month', CURRENT_DATE + '1 mon'::interval) + '1 mon'::interval - '1 day'::interval)::date AS next_billing_period_end,
  (date_trunc('month', CURRENT_DATE + '1 mon'::interval) - '1 day'::interval)::date AS next_due_date
FROM bookings b
JOIN class_packages cp ON cp.id = b.class_package_id
WHERE b.is_recurring = true
  AND (b.status::text <> ALL (ARRAY['cancelled','completed']))
  AND b.billing_cycle_anchor IS NOT NULL
  AND b.billing_cycle_anchor < date_trunc('month', CURRENT_DATE + '1 mon'::interval)::date
  AND NOT EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.booking_id = b.id
      AND i.billing_period_start = date_trunc('month', CURRENT_DATE + '1 mon'::interval)::date
  )
ORDER BY b.billing_cycle_anchor;

CREATE OR REPLACE VIEW public.locked_bookings_dashboard_v AS
SELECT b.id AS booking_id,
  b.booking_id AS booking_ref,
  (b.first_name || ' ') || b.last_name AS customer_name,
  b.email AS customer_email,
  b.phone AS customer_phone,
  b.access_status,
  b.updated_at AS status_changed_at,
  count(DISTINCT i.id) FILTER (WHERE i.status = 'pending'::invoice_status) AS pending_invoices_count,
  sum(i.total_amount) FILTER (WHERE i.status = 'pending'::invoice_status) AS total_amount_due,
  max(CURRENT_DATE - i.due_date) FILTER (WHERE i.status = 'pending'::invoice_status) AS max_days_overdue,
  count(DISTINCT ca.id) AS scheduled_classes_count,
  min(ca.date) FILTER (WHERE ca.date >= CURRENT_DATE AND (ca.class_status <> ALL (ARRAY['cancelled'::text, 'rescheduled'::text]))) AS next_class_date
FROM bookings b
LEFT JOIN invoices i ON i.booking_id = b.id
LEFT JOIN assignment_bookings ab ON ab.booking_id = b.booking_id
LEFT JOIN class_assignments ca ON ca.id = ab.assignment_id
WHERE (b.access_status = ANY (ARRAY['overdue_grace'::access_status, 'overdue_locked'::access_status]))
  AND (b.status::text <> ALL (ARRAY['cancelled','completed']))
GROUP BY b.id, b.booking_id, b.first_name, b.last_name, b.email, b.phone, b.access_status, b.updated_at
ORDER BY b.access_status DESC,
  (max(CURRENT_DATE - i.due_date) FILTER (WHERE i.status = 'pending'::invoice_status)) DESC;
