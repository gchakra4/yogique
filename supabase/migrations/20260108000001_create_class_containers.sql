-- Phase 1: Create class_containers table and add nullable class_container_id columns
-- Migration: 2026-01-08 00:00:01

BEGIN;

-- 1) Create `class_containers` table
CREATE TABLE IF NOT EXISTS class_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_code VARCHAR(32) UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    container_type TEXT NOT NULL CHECK (container_type IN (
        'individual', 'public_group', 'private_group', 'crash_course'
    )),

    instructor_id UUID REFERENCES profiles(user_id),
    class_type_id UUID,
    package_id UUID,

    -- Booking Capacity Management
    max_booking_count INTEGER NOT NULL DEFAULT 1,
    current_booking_count INTEGER NOT NULL DEFAULT 0,

    -- Validity: computed from bookings (MAX of booking.billing_cycle_end_date)
    -- Container remains active until its last associated booking expires

    -- Metadata
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    -- Constraints
    CONSTRAINT chk_booking_count CHECK (current_booking_count >= 0),
    CONSTRAINT chk_booking_capacity CHECK (current_booking_count <= max_booking_count),
    CONSTRAINT chk_individual_single CHECK (
        container_type != 'individual' OR max_booking_count = 1
    )
);

-- 2) Add nullable `class_container_id` to `class_assignments`
ALTER TABLE IF EXISTS class_assignments
    ADD COLUMN IF NOT EXISTS class_container_id UUID REFERENCES class_containers(id);

-- 3) Add nullable `class_container_id` to `assignment_bookings`
ALTER TABLE IF EXISTS assignment_bookings
    ADD COLUMN IF NOT EXISTS class_container_id UUID REFERENCES class_containers(id);

-- 4) Indexes to speed lookups
CREATE INDEX IF NOT EXISTS idx_class_containers_instructor ON class_containers (instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_containers_type ON class_containers (container_type);
CREATE INDEX IF NOT EXISTS idx_assignments_container ON class_assignments (class_container_id);
CREATE INDEX IF NOT EXISTS idx_assignment_bookings_container ON assignment_bookings (class_container_id);

COMMIT;

-- Validation queries (run after applying migration):
-- SELECT to ensure table created
-- SELECT count(*) FROM class_containers;
-- Ensure columns exist
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'class_assignments' AND column_name = 'class_container_id';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'assignment_bookings' AND column_name = 'class_container_id';

-- Quick data-check example (no data expected yet):
-- SELECT * FROM class_containers LIMIT 10;
