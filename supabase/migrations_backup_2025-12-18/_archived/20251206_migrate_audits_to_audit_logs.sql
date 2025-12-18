-- Migration: copy existing audit tables into public.audit_logs
-- Created: 2025-12-06
-- Purpose: Backfill `message_audit`, `auth.audit_log_entries`, and
-- `public.revoke_cancel_audit_logs` into the centralized `public.audit_logs` table.

BEGIN;

-- 1) Copy from public.message_audit -> public.audit_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'message_audit') THEN
    INSERT INTO public.audit_logs (event_type, entity_type, entity_id, action, actor_id, actor_role, metadata, created_at)
    SELECT
      CASE WHEN COALESCE(status, '') <> '' THEN
        CASE WHEN status IN ('delivered','sent') THEN 'notification_sent' ELSE 'notification_failed' END
      ELSE 'notification' END AS event_type,
      'class'::text AS entity_type,
      class_id::text AS entity_id,
      'send'::text AS action,
      user_id::uuid AS actor_id,
      NULL::text AS actor_role,
      jsonb_build_object(
        'channel', channel,
        'recipient', recipient,
        'provider', provider,
        'provider_message_id', provider_message_id,
        'status', status,
        'attempts', attempts,
        'message_metadata', COALESCE(metadata::jsonb, '{}'::jsonb),
        'delivered_at', delivered_at,
        'last_updated_at', last_updated_at
      ) AS metadata,
      created_at
    FROM public.message_audit
    WHERE TRUE;
  END IF;
END $$;

-- 2) Copy from auth.audit_log_entries (if auth schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') AND
     EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'auth' AND c.relname = 'audit_log_entries') THEN
    INSERT INTO public.audit_logs (event_type, entity_type, entity_id, action, actor_id, actor_role, metadata, created_at)
    SELECT
      'auth'::text AS event_type,
      'auth'::text AS entity_type,
      NULL::text AS entity_id,
      NULL::text AS action,
      NULL::uuid AS actor_id,
      NULL::text AS actor_role,
      (CASE WHEN pg_typeof(payload) = 'json'::regtype OR pg_typeof(payload) = 'jsonb'::regtype THEN payload::jsonb ELSE jsonb_build_object('payload', payload) END) AS metadata,
      created_at
    FROM auth.audit_log_entries;
  END IF;
END $$;

-- 3) Copy from public.revoke_cancel_audit_logs (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
             WHERE n.nspname = 'public' AND c.relname = 'revoke_cancel_audit_logs') THEN
    INSERT INTO public.audit_logs (event_type, entity_type, entity_id, action, actor_id, actor_role, metadata, created_at)
    SELECT
      COALESCE(event_type, 'revoke_cancel_token')::text AS event_type,
      COALESCE(entity_type, 'booking')::text AS entity_type,
      booking_id::text AS entity_id,
      COALESCE(action, 'revoke_token')::text AS action,
      admin_id::uuid AS actor_id,
      'admin'::text AS actor_role,
      (CASE WHEN pg_typeof(metadata) = 'json'::regtype OR pg_typeof(metadata) = 'jsonb'::regtype THEN metadata::jsonb ELSE jsonb_build_object('reason', reason, 'raw_metadata', metadata) END) AS metadata,
      created_at
    FROM public.revoke_cancel_audit_logs;
  END IF;
END $$;

COMMIT;

-- Notes:
-- - This migration performs best-effort copies and preserves `created_at` timestamps.
-- - It does not remove or alter source tables; use a separate cleanup migration after verification.
-- - Run in a maintenance window for large datasets.
