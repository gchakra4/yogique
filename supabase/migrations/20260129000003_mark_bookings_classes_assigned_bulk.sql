-- Migration: bulk RPC to mark multiple bookings as classes_assigned
BEGIN;

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

COMMIT;
