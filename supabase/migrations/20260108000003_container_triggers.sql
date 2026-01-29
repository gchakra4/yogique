-- Phase 3: Triggers & Functions for container booking counts and capacity validation
-- Migration: 2026-01-08 00:00:03

BEGIN;

-- 1) Function: validate_container_capacity()
--    BEFORE INSERT OR UPDATE on assignment_bookings
--    Ensures container has capacity for new booking(s)
CREATE OR REPLACE FUNCTION validate_container_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_container_id UUID;
    v_current_count INTEGER;
    v_max_allowed INTEGER;
BEGIN
    -- If no container assigned yet, allow (may be assigned later)
    IF (NEW.class_container_id IS NULL) THEN
        RETURN NEW;
    END IF;

    v_container_id := NEW.class_container_id;

    -- Lock the container row to avoid race conditions
    SELECT current_booking_count, max_booking_count
    INTO v_current_count, v_max_allowed
    FROM class_containers
    WHERE id = v_container_id
    FOR UPDATE;

    IF TG_OP = 'INSERT' THEN
        IF v_current_count + 1 > v_max_allowed THEN
            RAISE EXCEPTION 'Container capacity exceeded (id=%). Max: %, current: %', v_container_id, v_max_allowed, v_current_count;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If container changed, ensure target container has capacity
        IF NEW.class_container_id IS DISTINCT FROM OLD.class_container_id THEN
            IF v_current_count + 1 > v_max_allowed THEN
                RAISE EXCEPTION 'Container capacity exceeded for target container (id=%). Max: %, current: %', v_container_id, v_max_allowed, v_current_count;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 2) Function: update_container_booking_count()
--    AFTER INSERT OR DELETE OR UPDATE on assignment_bookings
--    Keeps class_containers.current_booking_count in sync
--    Counts unique bookings per container, not total rows
CREATE OR REPLACE FUNCTION update_container_booking_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_container_id UUID;
    v_unique_count INTEGER;
BEGIN
    -- Determine which container(s) to update
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_container_id := NEW.class_container_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_container_id := OLD.class_container_id;
    END IF;

    -- Recalculate unique booking count for affected container
    IF v_container_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT booking_id)
        INTO v_unique_count
        FROM assignment_bookings
        WHERE class_container_id = v_container_id;

        UPDATE class_containers
        SET 
            current_booking_count = v_unique_count,
            capacity_booked = v_unique_count,
            updated_at = NOW()
        WHERE id = v_container_id;
    END IF;

    -- If UPDATE changed containers, also update the old container
    IF TG_OP = 'UPDATE' AND OLD.class_container_id IS DISTINCT FROM NEW.class_container_id AND OLD.class_container_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT booking_id)
        INTO v_unique_count
        FROM assignment_bookings
        WHERE class_container_id = OLD.class_container_id;

        UPDATE class_containers
        SET 
            current_booking_count = v_unique_count,
            capacity_booked = v_unique_count,
            updated_at = NOW()
        WHERE id = OLD.class_container_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- 3) Function: enforce_individual_single_booking()
--    BEFORE INSERT OR UPDATE on class_containers
--    Enforce that `individual` containers have max_booking_count = 1
CREATE OR REPLACE FUNCTION enforce_individual_single_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.container_type = 'individual' AND NEW.max_booking_count != 1 THEN
        RAISE EXCEPTION 'Individual containers must have max_booking_count = 1';
    END IF;
    RETURN NEW;
END;
$$;

-- 4) Triggers
DROP TRIGGER IF EXISTS trg_validate_container_capacity ON assignment_bookings;
CREATE TRIGGER trg_validate_container_capacity
BEFORE INSERT OR UPDATE ON assignment_bookings
FOR EACH ROW
EXECUTE FUNCTION validate_container_capacity();

DROP TRIGGER IF EXISTS trg_update_container_booking_count ON assignment_bookings;
CREATE TRIGGER trg_update_container_booking_count
AFTER INSERT OR DELETE OR UPDATE ON assignment_bookings
FOR EACH ROW
EXECUTE FUNCTION update_container_booking_count();

DROP TRIGGER IF EXISTS trg_enforce_individual ON class_containers;
CREATE TRIGGER trg_enforce_individual
BEFORE INSERT OR UPDATE ON class_containers
FOR EACH ROW
EXECUTE FUNCTION enforce_individual_single_booking();

COMMIT;

-- Testing snippets (run manually after applying):
-- 1) Try to attach a booking to a full container (should error)
-- INSERT INTO assignment_bookings (assignment_id, booking_id, class_container_id) VALUES ('<assignment-id>', '<booking-id>', '<full-container-id>');

-- 2) Move booking from one container to another (counts should update)
-- UPDATE assignment_bookings SET class_container_id = '<new-container-id>' WHERE booking_id = '<booking-id>';

-- 3) Create individual container with wrong capacity (should error)
-- INSERT INTO class_containers (container_code, display_name, container_type, max_booking_count, created_by) VALUES ('test-1','Test','individual',2,NULL);
