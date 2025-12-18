Date: 2025-12-18

Summary:
- Implemented Razorpay integration scaffolding (invoices, job queue, worker, webhook scaffold).
- Added proration logic in `supabase/functions/generate-monthly-invoices/index.ts`.
  - Preferred method: class-count prorating (scheduled_classes / total_classes_in_month).
  - Fallback: pro-rata by remaining days in billing month when class counts missing.

Files changed (high level):
- supabase/functions/generate-monthly-invoices/index.ts  (proration added)
- supabase/functions/process-payment-link-jobs/index.ts  (worker hardening)
- supabase/functions/create-invoice-or-link/index.ts     (enqueue job)
- supabase/migrations/20251218_*                        (invoices, jobs, enum, audit_logs additions)

Current status:
- Proration implemented and tested at code level (class-count preferred).
- Worker and job queue implemented and deployed to dev.
- Webhook mapping, email send-on-link-creation, reminder scheduler, and advanced payment rules still pending.

Next-decisions you should make before continuing:
1) Advanced payment rules: how to handle advance_amount, prepaid_months, credits, discounts.
2) Data source for class counts: caller-supplied vs generator DB query (bookings + scheduled_sessions + class_packages).
3) Reminder policy (3/5/7 days) and whether to auto-send email on link creation.

How to resume from here:
1) Open this repo and checkout the branch you were using (e.g., `dev`).

   git checkout dev
   git pull origin dev

2) Review the generator file:
   docs/RAZORPAY_CHECKPOINT.md
   supabase/functions/generate-monthly-invoices/index.ts

3) If you want me to add DB lookup for class counts or advanced payment handling, tell me which option:
   - Option A: caller provides `scheduled_classes` and `total_classes_in_month` in the generator payload (fastest).
   - Option B: generator queries DB to compute counts (I can add SQL using your bookings/scheduled_sessions tables).
   - Option C: add `advance_amount` / `prepaid_months` handling and integrate credits.

4) To persist this checkpoint to Git (recommended):

   git add docs/RAZORPAY_CHECKPOINT.md
   git add supabase/functions/generate-monthly-invoices/index.ts
   git commit -m "chore: checkpoint Razorpay integration progress (proration implemented)"
   git push origin HEAD:dev

5) To save this chat externally: copy this file or export/bookmark the chat in your chat UI. The repo file is the canonical snapshot.

Quick test commands (invoke generator with sample payload):

curl -s -X POST 'https://<your-supabase>.functions/v1/generate-monthly-invoices' \
  -H 'Authorization: Bearer <service-role-key>' \
  -H 'Content-Type: application/json' \
  -d '[{"booking_id":"<id>","billing_period_month":"2025-12-01","amount":1200,"scheduled_classes":6,"total_classes_in_month":12}]'

Notes:
- The generator accepts `scheduled_classes` and `total_classes_in_month`. If omitted, we can add a DB lookup.
- Keep secrets out of the repo; use Supabase function secrets for `RAZORPAY_*` and `RESEND_*` keys.

If you want, I can: commit and push this checkpoint for you, or add DB lookup code now — tell me which.
