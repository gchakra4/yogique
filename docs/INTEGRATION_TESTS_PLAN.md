# Integration / E2E Test Plan

Scenarios
1. Admin mapping CRUD
   - Login as `super_admin`, open `/dashboard/template_mappings`.
   - Create mapping for `payment_due_reminder` → confirm DB row.
   - Update mapping → confirm DB change.
   - Delete mapping → confirm deletion.

2. End-to-end notification send
   - Create a mapping for an activity.
   - Trigger activity that enqueues a notification (or insert into `notifications_queue`).
   - Run worker (or wait) and assert `message_audit` row created and `notifications_queue` row marked `sent`.

3. Webhook reconciliation
   - Simulate provider callback to `meta-webhook` with a provider_message_id matching `message_audit` and assert DB status updated.

Tooling
- Use Playwright for UI flows and `psql` or Supabase REST to assert DB state.
- Tests should run against a staging project with test credentials and isolated data.
