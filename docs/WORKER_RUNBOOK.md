# Notification Worker Runbook

Purpose: daily operations, debugging and manual intervention for `notification-worker`.

Quick checks
- Worker logs: Supabase Dashboard → Functions → `notification-worker` → Logs.
- DB: inspect `notifications_queue` rows: statuses are `pending`, `processing`, `sent`, `failed`.
- Audit: inspect `message_audit` for send attempts and provider_message_id mapping.

Common issues
- Stuck `processing` rows: check worker logs; if worker crashed, set `status='pending'` and `run_after=now()` for stuck rows older than 10 minutes.
- Network timeouts to provider: worker increments `attempts` and reschedules with exponential backoff (`run_after = now() + backoff_ms * attempts`).
- Template rendering errors: check `wa_templates` components and `default_vars` in DB.

Manual recovery commands (psql)
- Requeue stuck rows:
  UPDATE notifications_queue SET status='pending', run_after=now() WHERE status='processing' AND updated_at < now() - interval '10 minutes';
- Force-send a row via function (worker dry-run bypass): call the Edge Function `notification-service` with the row payload.

Configuration
- ENV variables:
  - `NOTIFICATION_MAX_ATTEMPTS` (default 5)
  - `NOTIFICATION_BASE_BACKOFF_MS` (default 1000)
  - `NOTIFICATION_MAX_BACKOFF_MS` (default 60000)
  - `NOTIFICATION_WORKER_LIMIT` (concurrency limit)
  - `MONITORING_WEBHOOK_URL`, `NOTIFICATION_ALERT_AFTER`

When to escalate
- Repeated failures for many rows (>50) and backoff exhausted — escalate to platform on-call and enable monitoring webhook.
