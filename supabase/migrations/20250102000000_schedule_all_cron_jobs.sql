-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to pg_net
GRANT USAGE ON SCHEMA net TO postgres;

-- Unschedule existing jobs (if any) to avoid duplicates
DO $$
BEGIN
  PERFORM cron.unschedule(jobname) 
  FROM cron.job 
  WHERE jobname IN (
    'notification-worker',
    'generate-t5-invoices',
    'run-escalation-orchestration',
    'schedule-create-zoom',
    'generate-monthly-invoices',
    'escalate-overdue-bookings'
  );
END $$;

-- 1. Notification Worker (every 1 minute - single short poll to avoid EarlyDrop)
SELECT cron.schedule(
    'notification-worker',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := public.get_secret('supabase_url') || '/functions/v1/notification-worker',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_secret('service_role_key'),
            'apikey', public.get_secret('service_role_key')
        ),
        -- keep invocation short to avoid Edge EarlyDrop (~15s)
        body := jsonb_build_object('limit', 1, 'runs', 1, 'budget_ms', 9000),
        timeout_milliseconds := 60000
    );
    $$
);

-- 2. Generate T5 Invoices (daily at 01:00 UTC)
SELECT cron.schedule(
    'generate-t5-invoices',
    '0 1 * * *',
    $$
    SELECT net.http_post(
        url := public.get_secret('supabase_url') || '/functions/v1/generate-t5-invoices',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_secret('service_role_key'),
            'apikey', public.get_secret('service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 3. Run Escalation Orchestration (daily at 02:00 UTC)
SELECT cron.schedule(
    'run-escalation-orchestration',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := public.get_secret('supabase_url') || '/functions/v1/run-escalation-orchestration',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_secret('cron_secret'),
            'apikey', public.get_secret('service_role_key')
        ),
        body := jsonb_build_object('force', false)
    );
    $$
);

-- 4. Schedule Create Zoom (every 15 minutes)
SELECT cron.schedule(
    'schedule-create-zoom',
    '*/15 * * * *',
    $$
    SELECT net.http_post(
        url := public.get_secret('edge_function_url'),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_secret('scheduler_secret_token')
        ),
        body := jsonb_build_object('force_invoke', false)
    );
    $$
);

-- 5. Generate Monthly Invoices (daily at 02:00 UTC)
SELECT cron.schedule(
    'generate-monthly-invoices',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := public.get_secret('supabase_url') || '/functions/v1/generate-monthly-invoices',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_secret('service_role_key'),
            'apikey', public.get_secret('service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 6. Escalate Overdue Bookings (daily at 06:00 UTC)
SELECT cron.schedule(
    'escalate-overdue-bookings',
    '0 6 * * *',
    $$
    SELECT net.http_post(
        url := public.get_secret('supabase_url') || '/functions/v1/escalate-overdue-bookings',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_secret('service_role_key'),
            'apikey', public.get_secret('service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Verify all jobs are scheduled
SELECT jobid, jobname, schedule, active
FROM cron.job 
ORDER BY jobname;

-- Show reminder to update secrets
DO $$
DECLARE
  placeholder_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO placeholder_count 
  FROM public.cron_secrets 
  WHERE value LIKE 'placeholder%';
  
  IF placeholder_count > 0 THEN
    RAISE WARNING 'IMPORTANT: Update cron_secrets table with actual values:
    UPDATE public.cron_secrets SET value = ''your-actual-url'' WHERE key = ''supabase_url'';
    UPDATE public.cron_secrets SET value = ''your-actual-key'' WHERE key = ''service_role_key'';
    -- etc.';
  END IF;
END $$;
