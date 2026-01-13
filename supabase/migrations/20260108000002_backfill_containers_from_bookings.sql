-- Phase 2: Backfill containers from existing bookings and orphan assignments
-- Migration: 2026-01-08 00:00:02
-- Non-destructive: Creates containers where missing and links assignments + assignment_bookings

BEGIN;

-- 1) Create containers for bookings that have assignment_bookings but no container yet
INSERT INTO class_containers (
    container_code, display_name, container_type,
    instructor_id, class_type_id, package_id,
    max_booking_count, current_booking_count, created_by, created_at
)
SELECT DISTINCT
    b.booking_id AS container_code,
    COALESCE(NULLIF(TRIM(b.first_name || ' ' || b.last_name), ''), b.class_name, b.booking_id) AS display_name,
    CASE
        WHEN b.booking_type = 'individual' THEN 'individual'
        WHEN b.booking_type = 'public_group' THEN 'public_group'
        WHEN b.booking_type = 'private_group' THEN 'private_group'
        WHEN b.booking_type = 'corporate' THEN 'crash_course'
        ELSE 'public_group'
    END AS container_type,
    b.instructor_id,
    NULL::uuid AS class_type_id,
    b.class_package_id AS package_id,
    CASE WHEN b.booking_type = 'individual' THEN 1 ELSE COALESCE(b.participants_count, 20) END AS max_booking_count,
    0 AS current_booking_count,
    b.user_id AS created_by,
    NOW()
FROM bookings b
JOIN assignment_bookings ab ON ab.booking_id = b.booking_id
LEFT JOIN class_containers cc ON cc.container_code = b.booking_id
WHERE cc.id IS NULL;

-- 2) Link assignment_bookings -> class_containers using booking_id -> container_code
UPDATE assignment_bookings ab
SET class_container_id = cc.id
FROM class_containers cc
WHERE ab.booking_id = cc.container_code
  AND (ab.class_container_id IS NULL OR ab.class_container_id != cc.id);

-- 3) Propagate container_id to class_assignments via assignment_bookings
UPDATE class_assignments ca
SET class_container_id = ab.class_container_id
FROM assignment_bookings ab
WHERE ab.assignment_id = ca.id
  AND (ca.class_container_id IS NULL OR ca.class_container_id != ab.class_container_id)
  AND ab.class_container_id IS NOT NULL;

-- 4) Create containers for orphan class_assignments (no assignment_bookings and no container)
--    These get a generated container_code prefixed with 'assignment-'
INSERT INTO class_containers (
    container_code, display_name, container_type,
    instructor_id, class_type_id, package_id,
    max_booking_count, current_booking_count, created_by, created_at
)
SELECT
    ('assignment-' || ca.id)::varchar AS container_code,
    COALESCE(NULLIF(TRIM(ca.notes), ''), ('Assignment ' || ca.id)) AS display_name,
    'crash_course'::text AS container_type,
    ca.instructor_id,
    ca.class_type_id,
    ca.class_package_id AS package_id,
    20 AS max_booking_count,
    0 AS current_booking_count,
    NULL::uuid AS created_by,
    NOW()
FROM class_assignments ca
LEFT JOIN assignment_bookings ab ON ab.assignment_id = ca.id
LEFT JOIN class_containers cc ON cc.container_code = ('assignment-' || ca.id)
WHERE ca.class_container_id IS NULL
  AND ab.id IS NULL
  AND cc.id IS NULL;

-- 5) Link these newly created containers back to their assignments
UPDATE class_assignments ca
SET class_container_id = cc.id
FROM class_containers cc
WHERE cc.container_code = ('assignment-' || ca.id)
  AND ca.class_container_id IS NULL;

COMMIT;

-- Validation queries (run after this migration):
-- 1) Check any remaining assignments without container
-- SELECT count(*) FROM class_assignments WHERE class_container_id IS NULL;

-- 2) Check any assignment_bookings without container
-- SELECT count(*) FROM assignment_bookings WHERE class_container_id IS NULL;

-- 3) Sample containers created
-- SELECT id, container_code, display_name, container_type, max_booking_count FROM class_containers LIMIT 20;
