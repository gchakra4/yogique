-- Idempotent backfill: populate `corporate.companies` and `corporate.corporate_bookings`
-- Safe to run multiple times. Uses EXISTS checks and an advisory transaction lock.
BEGIN;
SELECT pg_advisory_xact_lock(20260106);

-- 1) Create companies from public.bookings.company_name where appropriate
INSERT INTO corporate.companies (id, name, created_at)
SELECT gen_random_uuid(), trim(b.company_name), now()
FROM public.bookings b
WHERE b.booking_type = 'corporate'
  AND b.company_name IS NOT NULL
  AND trim(b.company_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM corporate.companies c WHERE c.name = trim(b.company_name)
  );

-- 2) Insert corporate_bookings linking to newly-created or existing companies
-- Insert into corporate_bookings using `booking_code` (text). Use `b.booking_id` when present, else b.id::text
INSERT INTO corporate.corporate_bookings (id, booking_code, company_id, user_id, program_name, start_date, created_at)
SELECT gen_random_uuid(), COALESCE(b.booking_id, b.id::text), c.id, b.user_id, b.class_name, b.class_date, now()
FROM public.bookings b
JOIN corporate.companies c ON c.name = trim(b.company_name)
WHERE b.booking_type = 'corporate'
  AND b.company_name IS NOT NULL
  AND trim(b.company_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM corporate.corporate_bookings cb WHERE cb.booking_code = COALESCE(b.booking_id, b.id::text)
  );

COMMIT;

-- Notes:
-- - This migration assumes `corporate.companies.name` is treated as the canonical unique company identifier.
-- - If `corporate.companies` has additional required columns, modify the INSERT SELECT to provide defaults.
-- - Run this on staging first. It is read/write and will create rows in `corporate` schema.
