# PHASE 8: DEPLOYMENT CHECKLIST

## Pre-Deployment Verification

### 1. Code Review ✓

- [x] `automatedInvoiceService.ts` - T-5 invoice generation logic
- [x] `escalationOrchestrationService.ts` - Notification orchestration
- [x] `generate-t5-invoices/index.ts` - Edge function wrapper
- [x] `run-escalation-orchestration/index.ts` - Orchestration edge function
- [x] `generate_t5_invoices.sql` - Database RPC function
- [x] `.github/workflows/generate-t5-invoices.yaml` - Cron job 1 AM UTC
- [x] `.github/workflows/run-escalation-orchestration.yaml` - Cron job 2 AM UTC

### 2. Dependencies Check

**Database Tables Required:**
- [x] `bookings` - with columns: `billing_cycle_anchor`, `access_status`, `is_recurring`
- [x] `invoices` - with columns: `calendar_month`, `due_date`, `status`
- [x] `notifications_queue` - with columns: `channel`, `recipient`, `status`, `run_after`
- [x] `profiles` - with columns: `email`, `phone`, `whatsapp_opt_in`

**Database Functions Required:**
- [x] `escalate_overdue_bookings()` - Existing from Module 5
- [x] `generate_t5_invoices()` - NEW in Phase 8

**Services Required:**
- [x] `monthlyInvoiceService.ts` - Phase 4
- [x] `monthlySchedulingService.ts` - Phase 3
- [x] Supabase Edge Functions deployed
- [x] Notification worker function

### 3. Environment Variables

**Supabase (Dashboard → Settings → Edge Functions → Secrets):**
```
CRON_SECRET=<generated-secret>
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**GitHub (Repository → Settings → Secrets → Actions):**
```
SUPABASE_URL=https://xxx.supabase.co
CRON_SECRET=<same-as-supabase>
```

**Generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

## Deployment Steps

### Step 1: Deploy Database Function

```bash
# Connect to Supabase database
psql -h db.xxx.supabase.co -U postgres -d postgres

# Run migration
\i supabase/deploy/generate_t5_invoices.sql

# Verify function created
\df generate_t5_invoices

# Test function
SELECT generate_t5_invoices();
```

**Expected Output:**
```json
{
  "total_checked": 50,
  "total_generated": 0,
  "total_skipped": 50,
  "total_errors": 0,
  "execution_date": "2025-01-10"
}
```

**✅ Checkpoint:** Function returns valid JSON without errors

### Step 2: Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref xxx

# Deploy T-5 invoice generation
supabase functions deploy generate-t5-invoices

# Deploy escalation orchestration
supabase functions deploy run-escalation-orchestration

# Verify deployment
supabase functions list
```

**Expected Output:**
```
generate-t5-invoices         deployed
run-escalation-orchestration deployed
escalate-overdue-bookings    deployed (existing)
schedule-payment-reminders   deployed (existing)
```

**✅ Checkpoint:** All functions show "deployed" status

### Step 3: Set Environment Variables

```bash
# Supabase Edge Functions
supabase secrets set CRON_SECRET=<your-secret>

# Verify
supabase secrets list
```

**GitHub Actions:**
1. Go to repository → Settings → Secrets → Actions
2. Add `SUPABASE_URL`
3. Add `CRON_SECRET`

**✅ Checkpoint:** Secrets visible in GitHub and Supabase

### Step 4: Test Edge Functions Manually

**Test T-5 Invoice Generation:**
```bash
curl -X POST \
  "https://xxx.supabase.co/functions/v1/generate-t5-invoices" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "execution_time": "1234ms",
  "total_generated": 0,
  "total_skipped": 50,
  "total_errors": 0
}
```

**Test Escalation Orchestration:**
```bash
curl -X POST \
  "https://xxx.supabase.co/functions/v1/run-escalation-orchestration" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "execution_time": "2345ms",
  "escalation": {
    "escalated": 0,
    "restored": 0,
    "unchanged": 50
  },
  "reminders_sent": 0
}
```

**✅ Checkpoint:** Both functions return success without errors

### Step 5: Enable GitHub Actions

1. Go to repository → Actions tab
2. Enable workflows if disabled
3. Locate workflows:
   - `generate-t5-invoices.yaml`
   - `run-escalation-orchestration.yaml`
4. Manually trigger each workflow (workflow_dispatch)

**Verify in Actions tab:**
- ✅ Generate T-5 Invoices - Completed
- ✅ Run Escalation Orchestration - Completed

**Check logs:**
```bash
gh run list --workflow=generate-t5-invoices.yaml --limit 1
gh run view <run-id> --log
```

**✅ Checkpoint:** Workflows complete successfully with green checkmarks

### Step 6: Verify Cron Schedule

**Confirm schedules:**
- `generate-t5-invoices`: Daily at 1 AM UTC
- `run-escalation-orchestration`: Daily at 2 AM UTC
- `escalate-overdue-bookings`: Daily at 6 AM UTC (existing)

**Test schedule syntax:**
```bash
# Use crontab.guru to verify
# 0 1 * * * = "At 01:00 UTC every day"
# 0 2 * * * = "At 02:00 UTC every day"
# 0 6 * * * = "At 06:00 UTC every day"
```

**✅ Checkpoint:** Cron schedules are correct and non-conflicting

### Step 7: Monitor First Automated Run

**Wait for next scheduled run (or trigger manually)**

**Check GitHub Actions:**
```bash
gh run list --workflow=generate-t5-invoices.yaml --limit 5
```

**Check Supabase Logs:**
1. Go to Supabase Dashboard
2. Edge Functions → generate-t5-invoices → Logs
3. Verify logs show execution

**Check Database:**
```sql
-- Verify invoices created
SELECT * FROM invoices 
WHERE created_at::date = current_date 
ORDER BY created_at DESC;

-- Check notifications queued
SELECT * FROM notifications_queue 
WHERE created_at::date = current_date 
ORDER BY created_at DESC;

-- Check access status updates
SELECT booking_id, access_status, updated_at 
FROM bookings 
WHERE updated_at::date = current_date;
```

**✅ Checkpoint:** Automated run completes successfully

## Post-Deployment Validation

### Test Case 1: T-5 Invoice Generation

**Setup:**
1. Create test booking with `billing_cycle_anchor` = 5 days from today
2. Set `is_recurring` = true
3. Set `access_status` = 'active'

**Execute:**
```bash
# Manually trigger workflow
gh workflow run generate-t5-invoices.yaml

# Or call edge function
curl -X POST "$SUPABASE_URL/functions/v1/generate-t5-invoices" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Verify:**
```sql
SELECT * FROM invoices 
WHERE booking_id = 'TEST_BOOKING_ID' 
AND calendar_month = to_char(current_date + interval '5 days', 'YYYY-MM');
```

**Expected:** Invoice created with `due_date` = billing anchor date

**✅ Pass / ❌ Fail:** _____________

### Test Case 2: Duplicate Prevention

**Setup:**
1. Use same test booking from Test Case 1
2. Run T-5 generation again

**Execute:**
```bash
curl -X POST "$SUPABASE_URL/functions/v1/generate-t5-invoices" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Verify:**
```sql
SELECT COUNT(*) FROM invoices 
WHERE booking_id = 'TEST_BOOKING_ID' 
AND calendar_month = to_char(current_date + interval '5 days', 'YYYY-MM');
```

**Expected:** Count = 1 (no duplicate invoice created)

**✅ Pass / ❌ Fail:** _____________

### Test Case 3: Access Status Escalation

**Setup:**
1. Create invoice with `due_date` = 9 days ago
2. Set `status` = 'pending' (unpaid)
3. Booking `access_status` = 'active'

**Execute:**
```bash
# Trigger escalation
curl -X POST "$SUPABASE_URL/functions/v1/escalate-overdue-bookings" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Verify:**
```sql
SELECT access_status FROM bookings WHERE booking_id = 'TEST_BOOKING_ID';
```

**Expected:** `access_status` = 'overdue_grace'

**✅ Pass / ❌ Fail:** _____________

### Test Case 4: Proactive Reminders

**Setup:**
1. Create invoice with `due_date` = 3 days from today
2. Set `status` = 'pending'

**Execute:**
```bash
curl -X POST "$SUPABASE_URL/functions/v1/run-escalation-orchestration" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Verify:**
```sql
SELECT * FROM notifications_queue 
WHERE metadata->>'invoice_id' = 'TEST_INVOICE_ID'
AND metadata->>'reminder_type' = 't_minus_3';
```

**Expected:** Notification queued with subject containing "Payment Reminder"

**✅ Pass / ❌ Fail:** _____________

### Test Case 5: Email Notification Content

**Setup:**
1. Use notification from Test Case 4

**Verify:**
```sql
SELECT html FROM notifications_queue 
WHERE metadata->>'reminder_type' = 't_minus_3'
LIMIT 1;
```

**Expected:** HTML contains:
- ✅ Customer name
- ✅ Invoice number
- ✅ Amount due
- ✅ Due date
- ✅ "3 days" messaging

**✅ Pass / ❌ Fail:** _____________

## Monitoring Setup

### 1. GitHub Actions Monitoring

**Enable email notifications:**
1. Go to GitHub → Settings → Notifications
2. Enable "Actions: Workflow runs on workflows you created"

**Set up Slack notifications (optional):**
```yaml
# Add to workflow
- name: Notify Slack on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Supabase Monitoring

**Set up alerts:**
1. Go to Supabase Dashboard → Settings → Alerts
2. Add alert for Edge Function failures
3. Set threshold: > 5 failures in 1 hour

**Monitor logs:**
- Edge Functions → Logs
- Database → Logs
- Check daily for errors

### 3. Database Monitoring Queries

**Save these queries for daily checks:**

```sql
-- Daily invoice generation summary
SELECT 
    current_date AS report_date,
    COUNT(*) FILTER (WHERE created_at::date = current_date) AS invoices_today,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_total,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_today
FROM invoices;

-- Escalation status summary
SELECT 
    access_status,
    COUNT(*) AS count
FROM bookings
WHERE is_recurring = true
GROUP BY access_status;

-- Notification queue status
SELECT 
    status,
    channel,
    COUNT(*) AS count
FROM notifications_queue
WHERE created_at > current_date - interval '7 days'
GROUP BY status, channel;

-- Failed notifications (last 24h)
SELECT 
    id,
    channel,
    recipient,
    error_message,
    attempts,
    created_at
FROM notifications_queue
WHERE status = 'failed'
AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### 4. Performance Metrics

**Track weekly:**
- Invoice generation success rate
- Average execution time
- Notification delivery rate
- Escalation accuracy
- Customer complaints

**Create dashboard:**
```sql
CREATE VIEW automation_health AS
SELECT 
    (SELECT COUNT(*) FROM invoices WHERE created_at::date = current_date) AS invoices_today,
    (SELECT COUNT(*) FROM notifications_queue WHERE status = 'sent' AND created_at::date = current_date) AS notifications_sent,
    (SELECT COUNT(*) FROM bookings WHERE access_status = 'overdue_locked') AS locked_bookings,
    (SELECT AVG(EXTRACT(DAY FROM (paid_date - due_date))) FROM invoices WHERE paid_date IS NOT NULL) AS avg_payment_delay_days;
```

## Rollback Plan

### If T-5 Generation Fails

**Immediate action:**
```bash
# Disable GitHub Action
gh workflow disable generate-t5-invoices.yaml

# Or delete workflow file
git rm .github/workflows/generate-t5-invoices.yaml
git commit -m "Disable T-5 generation temporarily"
git push
```

**Manual invoice generation:**
```typescript
// Run manually from frontend
import { generateInvoicesBatch } from './services/automatedInvoiceService'

const result = await generateInvoicesBatch()
console.log('Manual generation:', result)
```

### If Escalation Fails

**Immediate action:**
```bash
# Disable escalation workflow
gh workflow disable run-escalation-orchestration.yaml
```

**Manual escalation:**
```sql
-- Run database function directly
SELECT escalate_overdue_bookings();
```

### If Notifications Spam Users

**Immediate action:**
```sql
-- Pause notification processing
UPDATE notifications_queue 
SET status = 'paused' 
WHERE status = 'pending';

-- Resume after fix
UPDATE notifications_queue 
SET status = 'pending' 
WHERE status = 'paused';
```

## Sign-Off

### Development Team
- [ ] Code reviewed
- [ ] Tests passed
- [ ] Documentation complete

**Signed:** _______________ **Date:** _______________

### QA Team
- [ ] Manual tests passed
- [ ] Edge cases verified
- [ ] Performance acceptable

**Signed:** _______________ **Date:** _______________

### DevOps Team
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Rollback plan tested

**Signed:** _______________ **Date:** _______________

### Product Owner
- [ ] Business requirements met
- [ ] User acceptance criteria satisfied
- [ ] Ready for production

**Signed:** _______________ **Date:** _______________

## Deployment Date

**Scheduled:** _______________

**Actual:** _______________

**Status:** ⬜ Success ⬜ Partial ⬜ Rollback

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

## Post-Deployment Review (7 days after deployment)

### Metrics Review

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Invoice generation rate | > 99% | _____ | ⬜ ✅ ❌ |
| Notification delivery rate | > 95% | _____ | ⬜ ✅ ❌ |
| False escalations | < 1% | _____ | ⬜ ✅ ❌ |
| System uptime | > 99.9% | _____ | ⬜ ✅ ❌ |
| User complaints | < 5 | _____ | ⬜ ✅ ❌ |

### Issues Encountered

1. _____________________________________________________________________________
2. _____________________________________________________________________________
3. _____________________________________________________________________________

### Lessons Learned

1. _____________________________________________________________________________
2. _____________________________________________________________________________
3. _____________________________________________________________________________

### Recommended Improvements

1. _____________________________________________________________________________
2. _____________________________________________________________________________
3. _____________________________________________________________________________

**Review Date:** _______________

**Reviewed By:** _______________

**Overall Assessment:** ⬜ Excellent ⬜ Good ⬜ Needs Improvement ⬜ Critical Issues

---

**PHASE 8 DEPLOYMENT COMPLETE** ✅
