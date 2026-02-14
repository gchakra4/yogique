-- SQL: create_views/instructor_upcoming_classes_v.sql
--
-- Purpose: Provide a reusable view that surfaces instructor-facing upcoming class
-- information in a compact shape the frontend expects. Deploy this to any
-- environment (Supabase SQL editor or psql) to restore the missing view.
--
-- Notes:
-- - The frontend queries this view and applies its own date window filters,
--   so this view does not filter by date by default.
-- - Adjust user table columns (full_name) if your users schema differs.

CREATE OR REPLACE VIEW public.instructor_upcoming_classes_v AS
SELECT
  ca.id AS assignment_id,
  ca.date,
  ca.start_time,
  ca.end_time,
  ca.instructor_id,
  -- If you have a users/profile table, replace the following line with a JOIN
  -- to that table. For portability, we emit the instructor_id as the
  -- instructor_name fallback so view creation never fails due to a missing
  -- users table.
  ca.instructor_id::text AS instructor_name,
  -- Provide a small JSON object for class_types to match frontend expectations
  json_build_object(
    'id', ct.id,
    'name', ct.name,
    'description', ct.description
  ) AS class_types,
  -- Derive counts via subqueries to avoid depending on specific columns
  -- existing on the `class_assignments` table (portable across schemas).
  (
    SELECT COUNT(*) FROM public.assignment_bookings ab WHERE ab.assignment_id = ca.id
  ) AS participant_count,
  (
    SELECT COUNT(*) FROM public.class_attendance ca2 WHERE ca2.assignment_id = ca.id AND ca2.status = 'present'
  ) AS present_count,
  (
    SELECT COUNT(*) FROM public.class_attendance ca2 WHERE ca2.assignment_id = ca.id AND ca2.status = 'no_show'
  ) AS no_show_count,
  ca.class_status,
  ca.schedule_type,
  -- Payment columns may live in a separate financials view/table; default to NULL here
  NULL::text AS payment_status,
  NULL::numeric AS final_payment_amount
FROM public.class_assignments ca
LEFT JOIN public.class_types ct ON ct.id = ca.class_type_id;

-- If you want to include instructor full names, uncomment and adapt one of
-- the examples below depending on your schema, then remove the fallback
-- `instructor_name` line above.

-- Example (if you have a "profiles" table in public schema with full_name):
-- LEFT JOIN public.profiles p ON p.id = ca.instructor_id
--   -- SELECT p.full_name AS instructor_name,

-- Example (Supabase auth users in "auth" schema):
-- LEFT JOIN auth.users au ON au.id = ca.instructor_id
--   -- SELECT COALESCE(au.user_metadata->>'full_name', au.email) AS instructor_name,

-- Grant read access to the authenticated role (modify role name if different)
GRANT SELECT ON public.instructor_upcoming_classes_v TO authenticated;

-- Optional: create indexes on underlying table for common filters (run as admin)
-- CREATE INDEX IF NOT EXISTS idx_class_assignments_date ON public.class_assignments (date);
-- CREATE INDEX IF NOT EXISTS idx_class_assignments_instructor ON public.class_assignments (instructor_id);

-- End of file
