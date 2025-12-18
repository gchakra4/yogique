-- Backfill: create one invoice per booking per billing month for transactions missing invoice_id
-- Inserts invoices aggregated by booking + month, then updates transactions.invoice_id

-- Aggregate by subscription_id if present, else by user_id.
WITH src AS (
  SELECT
    COALESCE(subscription_id::text, user_id::text) AS owner_key,
    date_trunc('month', created_at)::date AS billing_period_month,
    sum(amount) AS amount,
    min(created_at) AS generated_at,
    max(subscription_id::text) AS sample_subscription_id,
    max(user_id::text) AS sample_user_id
  FROM public.transactions
  WHERE invoice_id IS NULL AND (subscription_id IS NOT NULL OR user_id IS NOT NULL)
  GROUP BY COALESCE(subscription_id::text, user_id::text), date_trunc('month', created_at)::date
), ins AS (
  INSERT INTO public.invoices (id, booking_id, billing_period_month, amount, currency, generated_at, invoice_status, created_at, updated_at, metadata)
  SELECT
    gen_random_uuid(),
    NULL::text AS booking_id,
    s.billing_period_month,
    s.amount,
    COALESCE((SELECT currency FROM public.transactions t2 WHERE (t2.subscription_id::text = s.owner_key OR t2.user_id::text = s.owner_key) LIMIT 1), 'INR'),
    s.generated_at,
    'paid',
    now(),
    now(),
    jsonb_build_object('subscription_id', s.sample_subscription_id, 'user_id', s.sample_user_id)
  FROM src s
  ON CONFLICT DO NOTHING
  RETURNING id, billing_period_month, metadata
)
UPDATE public.transactions t
SET invoice_id = ins.id
FROM ins
WHERE date_trunc('month', t.created_at)::date = ins.billing_period_month
  AND t.invoice_id IS NULL
  AND (
    (ins.metadata ->> 'subscription_id' IS NOT NULL AND t.subscription_id::text = ins.metadata ->> 'subscription_id') OR
    (ins.metadata ->> 'user_id' IS NOT NULL AND t.user_id::text = ins.metadata ->> 'user_id')
  );

-- Verification: run after applying to see number of invoices created
-- SELECT count(*) FROM public.invoices WHERE created_at >= now() - interval '1 hour';
