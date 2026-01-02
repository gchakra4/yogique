# Scheduled Jobs (GitHub Actions)

This document lists repository scheduled workflows (cron) and explains how to configure and test them in GitHub Actions.

## Discovered scheduled workflows

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
  Cron: `*/5 * * * *` (Every 5 minutes)  
  Action: runs `scheduler.js` which invokes edge function(s) configured by `EDGE_FUNCTION_URL`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `EDGE_FUNCTION_URL`, `SCHEDULER_SECRET_TOKEN`  
  Optional: `SCHEDULER_SECRET_HEADER`  
  Notes: accepts `force_invoke` input when manually dispatched.

Description: This frequent scheduler watches for items that need Zoom meetings created (or similar quick tasks) and calls the appropriate function to create them. It's used to handle near-real-time scheduling without manual intervention.

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
  Cron: `*/2 * * * *` (Every 2 minutes)  
  Action: POST to `${SUPABASE_URL}/functions/v1/notification-worker`  
  Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
  Notes: `workflow_dispatch` enabled with configurable limit.

Description: This job continuously processes the notifications queue, sending WhatsApp and email notifications. It runs frequently to ensure timely delivery of messages like payment reminders, class notifications, and booking confirmations.

  Example curl:
  ```
  curl -X POST "${SUPABASE_URL}/functions/v1/notification-worker" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"limit":10}'
  ```

  Example GH CLI:
  ```
  gh workflow run run-worker-queue.yaml --ref main -f limit=20
  ```

## How to set these up in GitHub

1. Add required Actions secrets  
   Repository → Settings → Secrets and variables → Actions → New repository secret. Add:
   - `SUPABASE_URL` — e.g. `https://<project>.supabase.co`  
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (keep secret)  
   - `SUPABASE_ANON_KEY` — if used by the scheduler  
   - `CRON_SECRET` — secret used by `run-escalation-orchestration` (Authorization header)  
   - `EDGE_FUNCTION_URL` — base URL for edge functions (used by `schedule-create-zoom`)  
   - `SCHEDULER_SECRET_TOKEN` — token expected by scheduler when calling edge functions  
   - `SCHEDULER_SECRET_HEADER` — optional header name if needed

2. Ensure workflow files are in `.github/workflows/` on the repository default branch. GitHub enables cron triggers when the workflow file exists on the default branch.

## Testing / manual runs

- GitHub UI: Actions → select workflow → Run workflow → set inputs (if any).  
- GH CLI: `gh workflow run <workflow-file> --ref main`  
- Direct curl to function endpoints (use correct secret header as shown above).

## Monitor runs & logs

- GitHub: Actions → workflow run logs.  
- Supabase: Edge Functions → Logs for function execution.  
- Database / application logs for side-effects (e.g., notifications_queue, message_audit).

## Security recommendations

- Prefer minimal-scope credentials for scheduled invocations (dedicated cron/edge token) rather than exposing the `SERVICE_ROLE_KEY` unless necessary.  
- Store service role keys and other long-lived secrets securely and rotate regularly.  
- Use `SCHEDULER_SECRET_HEADER` and a short-lived token pattern where possible for edge functions.

## Troubleshooting

- If a scheduled run doesn't occur, verify the workflow file exists on the default branch and the cron expression is valid.  
- If the function rejects requests, confirm the Authorization header value and check function logs for error details.  
- Use `workflow_dispatch` to run and debug manually; inspect logs to reproduce and fix failures.

### How to deploy and run the worker queue

**✅ WORKER FUNCTION EXISTS** at `supabase/functions/notification-worker/index.ts`

**The worker is ready but needs scheduling.** Add the GitHub Actions workflow above to enable automatic processing.

**The worker itself needs to be running continuously to process the queue.** Simply having jobs in the `notifications_queue` table isn't enough—you need an active process polling and executing those jobs.

#### Deployment options:

**Option 1: Supabase Edge Function (serverless worker)**

Deploy a worker as a Supabase Edge Function that runs on a schedule (e.g., every 1-5 minutes via GitHub Actions or pg_cron).

Example worker edge function structure:
```typescript
// filepath: supabase/functions/process-queue/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch pending jobs with lock
  const { data: jobs } = await supabase
    .from('notifications_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10)

  for (const job of jobs || []) {
    // Mark as processing
    await supabase
      .from('notifications_queue')
      .update({ status: 'processing' })
      .eq('id', job.id)

    try {
      // Execute job based on type
      await executeJob(job)
      
      // Mark as completed
      await supabase
        .from('notifications_queue')
        .update({ status: 'completed' })
        .eq('id', job.id)
    } catch (error) {
      // Handle failure with retry logic
      const newAttempts = job.attempts + 1
      await supabase
        .from('notifications_queue')
        .update({ 
          status: newAttempts >= 5 ? 'failed' : 'pending',
          attempts: newAttempts,
          error_message: error.message
        })
        .eq('id', job.id)
    }
  }

  return new Response(JSON.stringify({ processed: jobs?.length || 0 }))
})
```

Deploy: `supabase functions deploy process-queue`

Schedule via GitHub Actions (`.github/workflows/run-worker-queue.yaml`):
```yaml
name: Run Worker Queue
on:
  schedule:
    - cron: '*/2 * * * *'  # Every 2 minutes
  workflow_dispatch:

jobs:
  process-queue:
    runs-on: ubuntu-latest
    steps:
      - name: Call worker function
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/process-queue" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

**Option 2: Long-running Node.js/Deno process**

Run a dedicated worker process on a server, container, or platform like Railway/Fly.io/Heroku.

Example: `worker/index.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function pollQueue() {
  while (true) {
    try {
      // Similar logic to Option 1 but in infinite loop
      const { data: jobs } = await supabase
        .from('notifications_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .limit(10)

      for (const job of jobs || []) {
        await processJob(job)
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5 seconds
    } catch (error) {
      console.error('Worker error:', error)
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10 seconds on error
    }
  }
}

pollQueue()
```

Run: `npm start` or `deno run --allow-net --allow-env worker/index.ts`

Deploy to Railway/Fly.io/etc with environment variables set.

**Option 3: PostgreSQL pg_cron (database-native)**

Use Supabase's built-in pg_cron to call a PostgreSQL function that processes the queue.

```sql
-- Create worker function
CREATE OR REPLACE FUNCTION process_notifications_queue()
RETURNS void AS $$
DECLARE
  job RECORD;
BEGIN
  FOR job IN 
    SELECT * FROM notifications_queue
    WHERE status = 'pending'
    AND scheduled_for <= NOW()
    LIMIT 10
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update to processing
    UPDATE notifications_queue SET status = 'processing' WHERE id = job.id;
    
    -- Call edge function or execute logic here
    -- PERFORM net.http_post(...)
    
    -- Update to completed
    UPDATE notifications_queue SET status = 'completed' WHERE id = job.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (requires Supabase pg_cron extension)
SELECT cron.schedule(
  'process-queue',
  '*/2 * * * *',  -- Every 2 minutes
  'SELECT process_notifications_queue();'
);
```

Enable pg_cron in Supabase: Dashboard → Database → Extensions → enable `pg_cron`

**Option 4: Existing scheduler triggers worker**

Your `schedule-create-zoom` workflow already runs every 5 minutes. You can extend it to also call a worker endpoint:

```yaml
# In .github/workflows/schedule-create-zoom.yaml
- name: Process notification queue
  run: |
    curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/process-queue" \
      -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

#### Recommended approach for your setup:

Based on your existing GitHub Actions schedulers, I recommend **Option 1 (Edge Function + GitHub Actions scheduler)** or **Option 4 (extend existing scheduler)**:

1. Create `supabase/functions/process-queue/index.ts` worker function
2. Deploy it: `supabase functions deploy process-queue`
3. Either:
   - Create new GitHub Actions workflow that calls it every 1-2 minutes, OR
   - Add worker call to your existing `schedule-create-zoom.yaml` (already runs every 5 min)

#### Verifying the worker is running:

```sql
-- Check if jobs are being processed (status changes from pending → processing → completed)
SELECT status, COUNT(*), MAX(updated_at) as last_activity
FROM notifications_queue
GROUP BY status;

-- If you see old 'pending' jobs with recent created_at, the worker isn't running
SELECT id, type, status, created_at, updated_at, attempts
FROM notifications_queue
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '10 minutes';
```

**Logs to confirm worker execution:**
- GitHub Actions logs (if using scheduled workflow approach)
- Supabase Edge Functions logs: Dashboard → Edge Functions → `process-queue` → Logs
- Database audit tables showing recent activity

### Queue table structure (typical)

```sql
-- Typical structure for notifications_queue table
CREATE TABLE notifications_queue (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ
);

-- Indexes to optimize processing
CREATE INDEX idx_notifications_queue_status ON notifications_queue(status);
CREATE INDEX idx_notifications_queue_scheduled_for ON notifications_queue(scheduled_for);
```

