# Notification Pipeline Runbook

Purpose: operational runbook for the Notifications pipeline (queue, worker, notification-service, provider adapters).

1) Components
- Database: `notifications_queue`, `message_audit`, `wa_templates`, `activity_template_mappings`.
- Edge Functions: `notification-service`, `notification-worker`, `send-template`, `admin-proxy`, `admin-template-mappings`, `meta-webhook`.

2) Environment variables (required)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service role) — required by functions.
- `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_WEBHOOK_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` — Meta provider.
- `SUPERUSER_API_TOKEN` — used by `admin-template-mappings` (set as Supabase secret).
- Worker tuning: `NOTIFICATION_MAX_ATTEMPTS`, `NOTIFICATION_BASE_BACKOFF_MS`, `NOTIFICATION_MAX_BACKOFF_MS`, `NOTIFICATION_WORKER_LIMIT`, `NOTIFICATION_ALERT_AFTER`, `MONITORING_WEBHOOK_URL`.

3) Deploy sequence
- Apply DB migrations: `supabase db push` (ensure `pgcrypto` extension exists).
- Deploy Edge Functions: `supabase functions deploy notification-service notification-worker admin-proxy admin-template-mappings send-template meta-webhook`.
- Ensure `SUPERUSER_API_TOKEN` is set in Supabase secrets and `SUPABASE_SERVICE_ROLE_KEY` is valid.

4) Running in dev
- Add secrets to `secrets/dev.env` (do not commit production secrets).
- Start dev frontend: `npm run dev` and use a real Supabase session (admin role) to access `/dashboard/template_mappings`.

5) Monitoring and alerts
- Worker will call `MONITORING_WEBHOOK_URL` when repeated failures happen (configure in env).
- Watch `notification_worker` logs in Supabase Dashboard (Functions → Logs) and Postgres `message_audit` rows.

6) Troubleshooting
- If templates fail to render: verify `wa_templates` components and `default_vars` match Meta-approved template structure.
- If migrations fail with `uuid_generate_v4`: ensure `CREATE EXTENSION IF NOT EXISTS pgcrypto;` and use `gen_random_uuid()`.
- If worker stalls: check `notifications_queue.status` and `attempts`, and inspect function logs for network errors.

7) Rollback
- Revert Edge Function to previous deployment via the Supabase Dashboard function versions, or re-deploy an earlier commit tag.
- Revert DB migration only if safe — prefer writing corrective migrations.

8) Contacts
- Owner: platform team
