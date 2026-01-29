-- Migration: trigger to mark bookings as classes_assigned when assignment_bookings created
-- NOTE: Trigger approach disabled in favor of application-level bulk RPC calls for better scalability
-- The application calls mark_bookings_classes_assigned() after successful inserts
BEGIN;

-- Drop trigger if it exists (cleanup from previous approach)
DROP TRIGGER IF EXISTS tg_assignment_bookings_after_insert ON assignment_bookings;

-- Drop function if it exists
DROP FUNCTION IF EXISTS trg_mark_booking_on_assignment_insert();

-- Note: Application code handles booking status updates via mark_bookings_classes_assigned(p_booking_ids UUID[])
-- See migration 20260129000003_mark_bookings_classes_assigned_bulk.sql

COMMIT;
