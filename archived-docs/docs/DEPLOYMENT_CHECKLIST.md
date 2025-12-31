# Deployment Checklist — Notifications & Admin UI

Pre-deploy
- Run tests: `npm test` and any unit tests for functions.
- Verify migrations locally: `supabase db diff` / `supabase db push` on staging.

Secrets
- Ensure these are set in Supabase Dashboard → Settings → Secrets:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`
  - `SUPERUSER_API_TOKEN`
  - Worker tuning envs: `NOTIFICATION_MAX_ATTEMPTS`, etc.

Deploy steps
1. Apply DB migrations:
   ```bash
   supabase db push
   ```
2. Deploy functions (order optional but convenient):
   ```bash
   supabase functions deploy admin-template-mappings admin-proxy send-template notification-service notification-worker meta-webhook
   ```
3. Verify function health: open Supabase Dashboard → Functions → each function → Logs.

Post-deploy verification
- Create a test mapping via Admin UI and verify row in `activity_template_mappings`.
- Enqueue a test notification (insert into `notifications_queue`) and watch worker logs to confirm delivery and `message_audit` insertion.
- Verify webhook delivery mapping by sending a simulated provider callback to `meta-webhook`.
