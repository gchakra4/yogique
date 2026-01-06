-- 006_backfill_billing_data.sql
-- Idempotent backfill for billing tables.
-- This script attempts to backfill billing.invoices and billing.payments from existing public tables if present.

DO $$
DECLARE
  has_inv_external bool;
  has_inv_id bool;
  has_inv_metadata bool;
  has_pay_provider_ref bool;
  has_pay_id bool;
  has_pay_metadata bool;
  sql text;
BEGIN
  -- Acquire an advisory lock to prevent concurrent backfills
  PERFORM pg_advisory_lock(100006);

  -- Only proceed if source table exists
  IF to_regclass('public.invoices') IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='external_id') INTO has_inv_external;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='id') INTO has_inv_id;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='metadata') INTO has_inv_metadata;

    sql := 'INSERT INTO billing.invoices (id, billing_profile_id, amount, currency' ||
           (CASE WHEN has_inv_external THEN ', external_id' ELSE '' END) ||
           ', due_date, metadata, created_at, updated_at) ' ||
           'SELECT COALESCE(i.id, gen_random_uuid()), NULL::uuid, COALESCE(i.amount,0)::numeric(12,2), COALESCE(i.currency, ''USD'')::text' ||
           (CASE WHEN has_inv_external THEN ', i.external_id' ELSE '' END) ||
           ', i.due_date, ' || (CASE WHEN has_inv_metadata THEN 'COALESCE(i.metadata, ''{}''::jsonb)' ELSE '''{}''::jsonb' END) ||
           ', COALESCE(i.created_at, now()), COALESCE(i.updated_at, now()) FROM public.invoices i ' ||
           (CASE
              WHEN has_inv_external THEN 'WHERE NOT EXISTS (SELECT 1 FROM billing.invoices b WHERE b.external_id IS NOT NULL AND b.external_id = i.external_id)'
              WHEN has_inv_id THEN 'WHERE NOT EXISTS (SELECT 1 FROM billing.invoices b WHERE b.id = i.id)'
              ELSE ''
            END);

    EXECUTE sql;
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='provider_reference') INTO has_pay_provider_ref;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='id') INTO has_pay_id;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='metadata') INTO has_pay_metadata;

    sql := 'INSERT INTO billing.payments (id, invoice_id, amount, provider' ||
           (CASE WHEN has_pay_provider_ref THEN ', provider_reference' ELSE '' END) ||
           ', paid_at, metadata, created_at) ' ||
           'SELECT COALESCE(p.id, gen_random_uuid()), NULL::uuid, COALESCE(p.amount,0)::numeric(12,2), p.provider' ||
           (CASE WHEN has_pay_provider_ref THEN ', p.provider_reference' ELSE '' END) ||
           ', p.paid_at, ' || (CASE WHEN has_pay_metadata THEN 'COALESCE(p.metadata, ''{}''::jsonb)' ELSE '''{}''::jsonb' END) || ', COALESCE(p.created_at, now()) FROM public.payments p ' ||
           (CASE
              WHEN has_pay_provider_ref THEN 'WHERE NOT EXISTS (SELECT 1 FROM billing.payments bp WHERE bp.provider_reference IS NOT NULL AND bp.provider_reference = p.provider_reference)'
              WHEN has_pay_id THEN 'WHERE NOT EXISTS (SELECT 1 FROM billing.payments bp WHERE bp.id = p.id)'
              ELSE ''
            END);

    EXECUTE sql;
  END IF;

  PERFORM pg_advisory_unlock(100006);
EXCEPTION WHEN OTHERS THEN
  PERFORM pg_advisory_unlock(100006);
  RAISE;
END$$;

-- Notes:
-- - This backfill is conservative: it only runs if `public.invoices` or `public.payments` exist and inserts rows that do not have matching `external_id`/`provider_reference` in billing tables.
-- - Run this in dev first as a manual SQL statement in Supabase SQL editor. It is idempotent but will create rows only when sources exist.
