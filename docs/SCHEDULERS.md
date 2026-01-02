# Scheduled Jobs (pg_cron)

This document lists repository scheduled workflows using Supabase's built-in `pg_cron` extension.

## ✅ Why pg_cron instead of GitHub Actions?

- **Available on free tier** - No external service needed
- **Lower latency** - Runs inside your database
- **More reliable** - No network dependencies
- **Simpler** - Just SQL, no workflow files
- **Built-in monitoring** - Query `cron.job_run_details` for logs

## Scheduled Jobs

All jobs are configured in `supabase/migrations/YYYYMMDD_schedule_all_cron_jobs.sql`

- Name: generate-t5-invoices  
  Path: .github/workflows/generate-t5-invoices.yaml  
  Cron: `0 1 * * *` (Daily at 01:00 UTC)  
  Action: POST to `${SUPABASE_URL}/functions/v1/generate-t5-invoices`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
  Notes: `workflow_dispatch` enabled for manual runs.

Description: This job automatically generates a daily batch of "T5" invoices so billing records stay up-to-date without a human running the process. Think of it as a nightly robot that creates invoices for yesterday's activity.

  Example curl (service role):
  ```
  curl -X POST "${SUPABASE_URL}/functions/v1/generate-t5-invoices" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

  Example GH CLI:
  ```
  gh workflow run generate-t5-invoices.yaml --ref main
  ```

- Name: run-escalation-orchestration  
  Path: .github/workflows/run-escalation-orchestration.yaml  
  Cron: `0 2 * * *` (Daily at 02:00 UTC)  
  Action: POST to `${SUPABASE_URL}/functions/v1/run-escalation-orchestration`  
  Required secrets: `SUPABASE_URL`, `CRON_SECRET` (used in `Authorization` header)  
  Notes: `workflow_dispatch` enabled. Workflow parses response for success.

Description: This job coordinates escalation rules (e.g., alerting or follow-ups) for items that need attention. It checks outstanding issues and triggers the right next steps so critical problems don't get missed.

  Example curl (cron secret):
  ```
  curl -X POST "${SUPABASE_URL}/functions/v1/run-escalation-orchestration" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    -d '{"force":false}'
  ```

- Name: schedule-create-zoom  
  Path: .github/workflows/schedule-create-zoom.yaml  
  Cron: `*/15 * * * *` (Every 15 minutes)  
  Action: runs `scheduler.js` which invokes edge function(s) configured by `EDGE_FUNCTION_URL`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `EDGE_FUNCTION_URL`, `SCHEDULER_SECRET_TOKEN`  
  Optional: `SCHEDULER_SECRET_HEADER`  
  Notes: accepts `force_invoke` input when manually dispatched.

Description: This scheduler watches for items that need Zoom meetings created (or similar quick tasks) and calls the appropriate function to create them. It's used to handle near-real-time scheduling without manual intervention.

  Example curl (edge function invocation):
  ```
  curl -X POST "${EDGE_FUNCTION_URL}/some-scheduler-endpoint" \
    -H "Authorization: Bearer ${SCHEDULER_SECRET_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"force_invoke":true}'
  ```

- Name: generate-monthly-invoices  
  Path: .github/workflows/generate-monthly-invoices.yaml  
  Cron: `0 2 * * *` (Daily at 02:00 UTC — function checks date window internally)  
  Action: POST to `${SUPABASE_URL}/functions/v1/generate-monthly-invoices`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Description: This job ensures monthly billing runs at the right time window. Even though it runs daily, the function itself decides whether it's the correct day to produce monthly invoices — preventing missed or duplicate billing.

  Example curl:
  ```
  curl -X POST "${SUPABASE_URL}/functions/v1/generate-monthly-invoices" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

- Name: escalate-overdue-bookings  
  Path: .github/workflows/escalate-overdue-bookings.yaml  
  Cron: `0 6 * * *` (Daily at 06:00 UTC)  
  Action: POST to `${SUPABASE_URL}/functions/v1/escalate-overdue-bookings`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
  Notes: `workflow_dispatch` enabled.

Description: This job finds bookings that are overdue (e.g., missed payments or actions) and triggers escalation like notifications or admin alerts. It helps ensure clients or staff get reminders and issues are resolved quickly.

  Example curl:
  ```
  curl -X POST "${SUPABASE_URL}/functions/v1/escalate-overdue-bookings" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

- Name: run-worker-queue  
  Path: .github/workflows/run-worker-queue.yaml  
  Cron: `* * * * *` (Every minute)  
  Action: POST to `${SUPABASE_URL}/functions/v1/notification-worker`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
  Notes: `workflow_dispatch` enabled with configurable limit.

Description: This job processes the notifications queue, sending WhatsApp and email notifications. It runs frequently to ensure timely delivery of messages like payment reminders, class notifications, and booking confirmations.

  Example curl:
  ```
  curl -X POST "${SUPABASE_URL}/functions/v1/notification-worker" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"limit":5,"runs":1}'
  ```

  **Important (Edge Function runtime limit / EarlyDrop):**
  - Edge invocations can be dropped after ~15 seconds (`Shutdown reason: EarlyDrop`).
  - Keep the worker **fast**: `runs=1`, small `limit` (start with 5), **no internal sleep/poll loops**.

## How to set up pg_cron

1. **Enable extensions** (if not already enabled):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

2. **Create secrets table** (run migration):
```bash
supabase db push
```

Or manually run the migrations in SQL Editor:
- `supabase/migrations/20250101235959_create_secrets_table.sql`
- `supabase/migrations/20250102000000_schedule_all_cron_jobs.sql`

3. **Update secrets with your actual values**:
```sql
-- Get your values from Supabase Dashboard → Settings → API
UPDATE public.cron_secrets 
SET value = 'https://your-project.supabase.co', updated_at = NOW()
WHERE key = 'supabase_url';

UPDATE public.cron_secrets 
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', updated_at = NOW()
WHERE key = 'service_role_key';

UPDATE public.cron_secrets 
SET value = 'your-generated-secret', updated_at = NOW()
WHERE key = 'cron_secret';

UPDATE public.cron_secrets 
SET value = 'https://your-project.supabase.co/functions/v1', updated_at = NOW()
WHERE key = 'edge_function_url';

UPDATE public.cron_secrets 
SET value = 'your-generated-token', updated_at = NOW()
WHERE key = 'scheduler_secret_token';
```

4. **Verify secrets are set**:
```sql
SELECT key, 
       CASE WHEN value LIKE 'placeholder%' THEN '❌ NOT SET' ELSE '✅ SET' END as status,
       description
FROM public.cron_secrets
ORDER BY key;
```

5. **Verify cron jobs are scheduled**:
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;
```

## Managing Cron Jobs

### View scheduled jobs
```sql
SELECT * FROM cron.job;
```

### View job history
```sql
SELECT 
    j.jobname,
    jrd.status,
    jrd.start_time,
    jrd.end_time,
    (jrd.end_time - jrd.start_time) as duration,
    LEFT(jrd.return_message, 100) as message_preview
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC 
LIMIT 20;
```

### Manually trigger a job
```sql
-- Example: Trigger notification worker manually
SELECT net.http_post(
    url := public.get_secret('supabase_url') || '/functions/v1/notification-worker',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public.get_secret('service_role_key'),
        'apikey', public.get_secret('service_role_key')
    ),
    body := jsonb_build_object('limit', 5, 'runs', 1),
    timeout_milliseconds := 15000
);
```

### Update a secret
```sql
UPDATE public.cron_secrets 
SET value = 'new-value', updated_at = NOW()
WHERE key = 'service_role_key';
```

### Unschedule a job
```sql
SELECT cron.unschedule('notification-worker');
```

### Reschedule a job
```sql
-- Unschedule first
SELECT cron.unschedule('notification-worker');

-- Then schedule again with new timing
SELECT cron.schedule('notification-worker', '*/5 * * * *', $$ ... $$);
```

## Key rotation & restriction (quick guide)

- When rotating a key (recommended regularly):
  1. Generate the new key in Supabase / provider.
  2. Update the secret in the database (see SQL below).
  3. Update any running functions / services that read the secret (Edge Functions, cron jobs).
  4. Verify behaviour by manually invoking the job (see "Manually trigger a job").
  5. Revoke or remove the old key from the provider.

- Secure update pattern (run in SQL Editor — do NOT commit real secrets to git):

```sql
-- rotate an individual secret
BEGIN;
UPDATE public.cron_secrets
SET value = 'NEW_SECRET_VALUE', updated_at = NOW()
WHERE key = 'service_role_key';
COMMIT;

-- verify
SELECT key, LEFT(value, 10) || '...' AS preview, updated_at
FROM public.cron_secrets
WHERE key = 'service_role_key';
```

- Restrict direct writes and use a secure helper:
  1. Revoke DML from PUBLIC so only explicit actors/roles can modify.
  2. Provide a SECURITY DEFINER function to perform rotations (callable only by admins).

```sql
-- revoke direct modification
REVOKE INSERT, UPDATE, DELETE ON public.cron_secrets FROM PUBLIC;

-- secure helper to rotate secrets (runs with function owner's privileges)
CREATE OR REPLACE FUNCTION public.rotate_cron_secret(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.cron_secrets
  SET value = p_value, updated_at = NOW()
  WHERE key = p_key;
END;
$$;

-- grant execute only to a controlled role (replace 'admin_role' with your admin role)
GRANT EXECUTE ON FUNCTION public.rotate_cron_secret(text, text) TO postgres;
-- optionally: create a restricted DB role for operators and grant execute to it
```

- Post-rotation checks:
  - Trigger a manual test request to the function (see "Manually trigger a job").
  - Inspect Edge Function logs and cron.job_run_details for failures.
  - Rotate provider-side secret (if applicable) only after consumers verified.

- Notes:
  - Using the service_role key gives full privileges to the requests — treat it as highly sensitive and limit exposure.
  - Keep migration placeholders in source; apply real values via SQL Editor or CI secrets during deployment.

## Troubleshooting

- **Check if pg_cron is running**: `SELECT * FROM cron.job;`
- **View recent failures**: 
```sql
SELECT 
    j.jobname,
    jrd.status,
    jrd.return_message,
    jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE jrd.status = 'failed'
ORDER BY jrd.start_time DESC 
LIMIT 10;
```
- **Check function logs**: Supabase Dashboard → Edge Functions → Logs
- **Verify secrets are set**: 
```sql
SELECT key, 
       CASE WHEN value LIKE 'placeholder%' THEN 'NOT SET' ELSE 'SET' END as status
FROM public.cron_secrets;
```
- **Common error: "schema net does not exist"**: Enable pg_net extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres;
```

- Live verification:
  - send-email function now returns 200 for requests coming from the notification-worker (confirmed). If you see "POST | 200 | .../functions/v1/send-email" in Edge Function logs, the authentication fix is working.
  - If you still observe 401s, re-check:
    - public.cron_secrets.service_role_key is the correct service_role JWT (no quotes/newlines).
    - scheduler token (if used) matches the configured SCHEDULER_SECRET_TOKEN and header.
    - Edge Function logs for the incoming masked header lengths and debugUnauthorized entries.

## Edge Function "EarlyDrop" / Shutdown (diagnose & fix)

Symptoms:
- Cron job shows short run duration and Edge Function logs include "shutdown" / "EarlyDrop".
- Notifications show failed with short duration or 401/timeout in job_run_details.
- Worker logs show abrupt termination after small CPU/memory usage.

Cause:
- Edge Function invocation exceeded the runtime/timeout allowed for a single net.http_post call or the function's runtime limit. Long internal loops (e.g., many 10s polls per invocation) can trigger EarlyDrop.

Quick fixes (recommended):
- Make the worker finish quickly:
  - `runs = 1`
  - remove any `sleep`/poll loops
  - keep `limit` small enough to complete within ~15s

Example reschedule (run in SQL Editor):
```sql
SELECT cron.unschedule('notification-worker');

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
    body := jsonb_build_object('limit', 5, 'runs', 1),
    timeout_milliseconds := 60000
  );
  $$
);
```

