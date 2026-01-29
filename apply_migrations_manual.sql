-- =====================================================
-- APPLY THESE MIGRATIONS IN YOUR SUPABASE SQL EDITOR
-- =====================================================
-- Copy and paste this entire file into your Supabase SQL Editor and run it
-- This will create the necessary functions to update booking status

-- 1. Create booking_status enum (if not exists)
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show',
    'classes_assigned',
    'payment_pending'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add status column to bookings table (if not exists)
DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status booking_status DEFAULT 'confirmed';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 3. Create index on status column (if not exists)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 4. Drop existing function if it exists (to handle parameter name changes)
DROP FUNCTION IF EXISTS update_booking_status(uuid, booking_status, text);

-- 5. Create or replace the update_booking_status function
CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_new_status booking_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status booking_status;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Fetch current status
  SELECT status INTO v_old_status
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found',
      'booking_id', p_booking_id
    );
  END IF;

  -- Update status
  UPDATE bookings
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING updated_at INTO v_updated_at;

  -- Log the status change in audit_logs (if table exists)
  BEGIN
    INSERT INTO audit_logs (
      action,
      resource_type,
      resource_id,
      metadata,
      created_at
    )
    VALUES (
      'booking_status_changed',
      'booking',
      p_booking_id,
      jsonb_build_object(
        'old_status', v_old_status,
        'new_status', p_new_status,
        'notes', p_notes
      ),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If audit_logs doesn't exist or fails, continue
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'old_status', v_old_status,
    'new_status', p_new_status,
    'updated_at', v_updated_at
  );
END;
$$;

-- 6. Create or replace the bulk update function
CREATE OR REPLACE FUNCTION mark_bookings_classes_assigned(p_booking_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_results JSONB := '[]'::jsonb;
  v_res JSONB;
BEGIN
  IF p_booking_ids IS NULL OR array_length(p_booking_ids,1) IS NULL THEN
    RETURN jsonb_build_object('success', true, 'updated', 0);
  END IF;

  FOREACH v_id IN ARRAY p_booking_ids LOOP
    BEGIN
      v_res := update_booking_status(v_id, 'classes_assigned'::booking_status, 'Classes assigned to booking (bulk)');
      v_results := v_results || jsonb_build_object(v_id::text, v_res);
    EXCEPTION WHEN OTHERS THEN
      v_results := v_results || jsonb_build_object(v_id::text, jsonb_build_object('success', false, 'error', SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', array_length(p_booking_ids,1), 'results', v_results);
END;
$$;

-- 7. Test the function (optional - comment out if you prefer)
-- SELECT mark_bookings_classes_assigned(ARRAY[]::UUID[]); -- Should return success with 0 updated

-- Done!
SELECT 'Migrations applied successfully! You can now use the booking status update functions.' as message;
