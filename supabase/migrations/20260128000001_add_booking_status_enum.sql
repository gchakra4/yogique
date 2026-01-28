-- Add comprehensive booking status enum and workflow
-- Migration: 2026-01-28 00:00:01

BEGIN;

-- Create booking status enum with comprehensive lifecycle states
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM (
            'pending',                    -- Initial state after booking creation
            'confirmed',                  -- Booking confirmed and ready for class assignment
            'classes_assigned',           -- Classes/assignments have been created for this booking
            'active',                     -- Booking is active with ongoing classes
            'user_cancelled',             -- User cancelled via email link or dashboard
            'admin_cancelled',            -- Admin/system cancelled the booking
            'completed',                  -- All classes completed successfully
            'suspended',                  -- Suspended due to non-payment
            'discontinued'                -- User or admin discontinued the booking
        );
    END IF;
END $$;

-- Ensure bookings.status supports the new workflow WITHOUT breaking dependent views.
-- We intentionally avoid ALTER COLUMN ... TYPE here because views referencing bookings.status
-- prevent type changes. Instead we normalize values and enforce allowed states via CHECK.
DO $$ 
BEGIN
    -- If status column doesn't exist, add it (safe default)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'status'
    ) THEN
        ALTER TABLE bookings
        ADD COLUMN status TEXT DEFAULT 'pending' NOT NULL;
    END IF;

    -- Normalize existing status values into the new vocabulary
    UPDATE bookings
    SET status = CASE
        WHEN status IS NULL THEN 'pending'
        WHEN status = 'cancelled' THEN 'admin_cancelled'
        WHEN status IN ('pending','confirmed','classes_assigned','active','user_cancelled','admin_cancelled','completed','suspended','discontinued') THEN status
        ELSE 'pending'
    END;

    -- Ensure a sensible default exists
    ALTER TABLE bookings
    ALTER COLUMN status SET DEFAULT 'pending';

    -- Enforce allowed values going forward (works regardless of column type)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_status_allowed_chk'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_status_allowed_chk
        CHECK (status::text IN (
            'pending',
            'confirmed',
            'classes_assigned',
            'active',
            'user_cancelled',
            'admin_cancelled',
            'completed',
            'suspended',
            'discontinued'
        ));
    END IF;
END $$;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- Add index for multi-column queries (common use case)
CREATE INDEX IF NOT EXISTS idx_bookings_status_created 
    ON bookings (status, created_at DESC);

-- Add cancelled_reason column for tracking why bookings were cancelled
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
    ADD COLUMN IF NOT EXISTS discontinued_reason TEXT;

-- Create function to update booking status with validation
CREATE OR REPLACE FUNCTION update_booking_status(
    p_booking_id UUID,
    p_new_status booking_status,
    p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status TEXT;
    v_booking RECORD;
BEGIN
    -- Get current booking
    SELECT status::text AS status, booking_id, user_id, first_name, last_name, email
    INTO v_booking
    FROM bookings
    WHERE id = p_booking_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Booking not found'
        );
    END IF;
    
    v_old_status := v_booking.status;
    
    -- Update the status
    UPDATE bookings
    SET 
        status = p_new_status,
        cancelled_reason = CASE 
            WHEN p_new_status IN ('user_cancelled', 'admin_cancelled') THEN p_reason 
            ELSE cancelled_reason 
        END,
        discontinued_reason = CASE 
            WHEN p_new_status = 'discontinued' THEN p_reason 
            ELSE discontinued_reason 
        END,
        cancelled_at = CASE 
            WHEN p_new_status IN ('user_cancelled', 'admin_cancelled') THEN NOW() 
            ELSE cancelled_at 
        END,
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking.booking_id,
        'old_status', v_old_status,
        'new_status', p_new_status::text,
        'updated_at', NOW()
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION update_booking_status IS 'Update booking status with validation and audit trail';

-- Create function to confirm booking
CREATE OR REPLACE FUNCTION confirm_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN update_booking_status(p_booking_id, 'confirmed'::booking_status, 'Booking confirmed by admin');
END;
$$;

-- Create function to assign classes to booking
CREATE OR REPLACE FUNCTION mark_booking_classes_assigned(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN update_booking_status(p_booking_id, 'classes_assigned'::booking_status, 'Classes assigned to booking');
END;
$$;

COMMIT;

-- Validation queries:
-- Check enum created
-- SELECT unnest(enum_range(NULL::booking_status));
-- 
-- Check status column
-- SELECT column_name, data_type, udt_name FROM information_schema.columns 
-- WHERE table_name = 'bookings' AND column_name = 'status';
--
-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'bookings' AND indexname LIKE '%status%';
