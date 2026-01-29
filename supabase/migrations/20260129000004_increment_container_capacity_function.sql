-- Migration: Add helper function to safely increment container capacity
BEGIN;

CREATE OR REPLACE FUNCTION increment_container_capacity(
  p_container_id UUID,
  p_increment INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update both current_booking_count and capacity_booked for compatibility
  -- Use SQL increment to avoid race conditions
  UPDATE class_containers
  SET 
    current_booking_count = GREATEST(0, COALESCE(current_booking_count, 0) + p_increment),
    capacity_booked = GREATEST(0, COALESCE(capacity_booked, 0) + p_increment),
    updated_at = NOW()
  WHERE id = p_container_id;
END;
$$;

COMMIT;
