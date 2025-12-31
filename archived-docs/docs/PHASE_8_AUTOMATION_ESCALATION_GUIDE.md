# PHASE 8: AUTOMATION & ESCALATION - COMPLETE GUIDE

## Overview

Phase 8 completes the modular billing system with **full automation** of:
1. **T-5 Invoice Generation** - Automated monthly invoice creation
2. **Access Status Escalation** - Automatic status transitions based on payment overdue
3. **Email Notifications** - Proactive reminders and alerts
4. **Payment Reminders** - T-3 and T-1 day notifications

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATION FLOW                           │
└─────────────────────────────────────────────────────────────┘

Day T-5 (1 AM UTC)
├─ generate-t5-invoices (GitHub Actions)
│  ├─ Check all recurring bookings
│  ├─ Calculate next billing date
│  ├─ Generate invoices if today = T-5
│  └─ Skip if invoice exists or booking locked

Day T-3 (2 AM UTC)  
├─ run-escalation-orchestration
│  ├─ Check invoices due in 3 days
│  └─ Send reminder emails/WhatsApp

Day T-1 (2 AM UTC)
├─ run-escalation-orchestration
│  ├─ Check invoices due in 1 day
│  └─ Send final reminder

Day T+0 (Due Date)
├─ escalate-overdue-bookings (6 AM UTC)
│  ├─ Check unpaid invoices
│  ├─ Calculate days overdue
│  └─ Update access_status

Day T+8 (Grace Period)
├─ access_status → 'overdue_grace'
├─ Send grace period warning
└─ Allow booking with restrictions

Day T+11 (Locked)
├─ access_status → 'overdue_locked'
├─ Send access locked notification
└─ Block all new bookings
```

## Components

### 1. T-5 Invoice Generation

**File:** `src/.../services/automatedInvoiceService.ts`

```typescript
// Key exports
export async function generateInvoicesBatch(): Promise<BatchGenerationSummary>
export function calculateT5Date(billingCycleAnchor: Date): Date
export function shouldGenerateInvoiceToday(billingCycleAnchor: Date): CheckResult
export async function getBookingsDueForInvoice(): Promise<Booking[]>
```

**Logic:**
- Runs daily at 1 AM UTC
- For each recurring booking:
  1. Calculate next billing date (based on `billing_cycle_anchor`)
  2. Calculate T-5 date (billing date - 5 days)
  3. If today == T-5 date:
     - Check if invoice already exists for target month
     - Generate invoice using `monthlyInvoiceService`
     - Set `due_date` to billing date
  4. Skip if:
     - `access_status` = 'overdue_locked'
     - Invoice already exists for month
     - Not T-5 day

**Example:**
```
Billing anchor: 15th of every month
Today: Jan 10, 2025

Next billing: Jan 15, 2025
T-5 date: Jan 10, 2025
Action: Generate invoice for January 2025
Due date: Jan 15, 2025
```

### 2. Escalation Orchestration

**File:** `src/.../services/escalationOrchestrationService.ts`

```typescript
export async function runEscalationCycle(): Promise<EscalationResult>
export async function sendProactiveReminders(): Promise<ReminderResult>
```

**Flow:**
1. **Call `escalate_overdue_bookings()` DB function**
   - Updates `access_status` based on payment status
   - Returns counts: escalated, restored, unchanged

2. **Queue Notifications**
   - Insert into `notifications_queue` table
   - Channels: email, WhatsApp
   - Templates: reminder, warning, locked, restored

3. **Send Proactive Reminders**
   - T-3 days: "Payment due soon"
   - T-1 day: "Final reminder - payment due tomorrow"

### 3. Database Functions

#### `generate_t5_invoices()`

**File:** `supabase/deploy/generate_t5_invoices.sql`

```sql
CREATE OR REPLACE FUNCTION generate_t5_invoices()
RETURNS jsonb
```

**Returns:**
```json
{
  "total_checked": 50,
  "total_generated": 12,
  "total_skipped": 38,
  "total_errors": 0,
  "execution_date": "2025-01-10",
  "results": [...]
}
```

#### `escalate_overdue_bookings()`

**Existing** - File: `supabase/functions/.../escalate-overdue-bookings/index.ts`

**Logic:**
- Calculate `days_overdue` for each unpaid invoice
- Update `access_status`:
  ```sql
  CASE
    WHEN days_overdue <= 0 THEN 'active'
    WHEN days_overdue BETWEEN 1 AND 10 THEN 'overdue_grace'
    WHEN days_overdue > 10 THEN 'overdue_locked'
  END
  ```

### 4. Edge Functions

#### `generate-t5-invoices`

**File:** `supabase/functions/generate-t5-invoices/index.ts`

**Endpoint:** `POST /functions/v1/generate-t5-invoices`

**Headers:**
- `Authorization: Bearer <CRON_SECRET>`

**Response:**
```json
{
  "success": true,
  "execution_time": "1234ms",
  "total_generated": 12,
  "total_skipped": 38,
  "total_errors": 0,
  "total_checked": 50
}
```

#### `run-escalation-orchestration`

**File:** `supabase/functions/run-escalation-orchestration/index.ts`

**Endpoint:** `POST /functions/v1/run-escalation-orchestration`

**Response:**
```json
{
  "success": true,
  "execution_time": "2345ms",
  "escalation": {
    "escalated": 5,
    "restored": 3,
    "unchanged": 42
  },
  "reminders_sent": 8
}
```

### 5. GitHub Actions Workflows

#### `generate-t5-invoices.yaml`

**Schedule:** Daily at 1 AM UTC
```yaml
cron: '0 1 * * *'
```

**Action:**
```bash
curl -X POST \
  "$SUPABASE_URL/functions/v1/generate-t5-invoices" \
  -H "Authorization: Bearer $CRON_SECRET"
```

#### `run-escalation-orchestration.yaml`

**Schedule:** Daily at 2 AM UTC (after T-5 generation)
```yaml
cron: '0 2 * * *'
```

**Action:**
```bash
curl -X POST \
  "$SUPABASE_URL/functions/v1/run-escalation-orchestration" \
  -H "Authorization: Bearer $CRON_SECRET"
```

#### `escalate-overdue-bookings.yaml` (Existing)

**Schedule:** Daily at 6 AM UTC
```yaml
cron: '0 6 * * *'
```

## Notification Schedule

| Timing | Days Relative | Type | Channels | Trigger |
|--------|---------------|------|----------|---------|
| T-5 | -5 | Invoice Generated | Email | New invoice created |
| T-3 | -3 | Payment Reminder | Email, WhatsApp | Proactive reminder |
| T-1 | -1 | Final Reminder | Email, WhatsApp | Urgent reminder |
| T+0 | 0 | Payment Overdue | Email | Due date passed |
| T+8 | +8 | Grace Period Warning | Email, WhatsApp | Status → overdue_grace |
| T+11 | +11 | Access Locked | Email, WhatsApp | Status → overdue_locked |

## Email Templates

### T-3 Reminder
```
Subject: ⚠️ Payment Reminder - Invoice #INV-2025-001
Body: Payment due in 3 days (Due: Jan 15, 2025)
Amount: ₹2,400
```

### T-1 Final Reminder
```
Subject: 🔔 Final Reminder - Payment Due Tomorrow
Body: Payment due tomorrow. Avoid service interruption.
Warning: Access may be restricted if payment not received.
```

### Grace Period Warning (T+8)
```
Subject: ⚠️ Grace Period - Payment Overdue
Body: Payment is 8 days overdue. You are in grace period.
Status: Can still book with restrictions.
Action: Pay within 3 days to avoid suspension.
```

### Access Locked (T+11)
```
Subject: 🔒 Access Suspended - Payment Required
Body: Payment is 11 days overdue. Access suspended.
Status: Cannot schedule new classes.
Action: Pay immediately to restore access.
```

## Access Status Transitions

```
┌─────────┐
│ active  │ ← Default status for paid bookings
└────┬────┘
     │ Payment overdue 1-10 days
     ▼
┌──────────────┐
│overdue_grace │ ← Can book with warning banner
└──────┬───────┘
       │ Payment overdue 11+ days
       ▼
┌──────────────┐
│overdue_locked│ ← Cannot book new classes
└──────┬───────┘
       │ Payment received
       ▼
┌─────────┐
│ active  │ ← Restored to active
└─────────┘
```

## Testing

### 1. Test T-5 Invoice Generation

**Scenario:** Booking with billing anchor on 15th

```typescript
// Setup
const booking = {
  booking_id: 'BK001',
  billing_cycle_anchor: '2025-01-15',
  is_recurring: true,
  status: 'confirmed',
  access_status: 'active'
}

// Test on Jan 10, 2025
const today = new Date('2025-01-10')
const result = await generateInvoicesBatch()

// Expected
expect(result.total_generated).toBe(1)
expect(invoice.calendar_month).toBe('2025-01')
expect(invoice.due_date).toBe('2025-01-15')
```

### 2. Test Duplicate Prevention

```typescript
// Setup: Invoice already exists
const existingInvoice = {
  booking_id: 'BK001',
  calendar_month: '2025-01',
  status: 'pending'
}

// Test
const result = await generateInvoicesBatch()

// Expected
expect(result.total_skipped).toBe(1)
expect(result.results[0].reason).toContain('already exists')
```

### 3. Test Escalation

```typescript
// Setup: Invoice 9 days overdue
const invoice = {
  booking_id: 'BK001',
  due_date: '2025-01-01',
  status: 'pending'
}

// Test on Jan 10, 2025
const result = await runEscalationCycle()

// Expected
expect(booking.access_status).toBe('overdue_grace')
expect(result.events[0].new_status).toBe('overdue_grace')
expect(result.notifications_scheduled).toBeGreaterThan(0)
```

### 4. Test Proactive Reminders

```typescript
// Setup: Invoice due in 3 days
const invoice = {
  booking_id: 'BK001',
  due_date: '2025-01-13',
  status: 'pending'
}

// Test on Jan 10, 2025
const result = await sendProactiveReminders()

// Expected
expect(result.reminders_sent).toBe(1)
expect(notification.subject).toContain('Payment Reminder')
```

## Deployment

### 1. Deploy Database Function

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/deploy/generate_t5_invoices.sql
```

**Verify:**
```sql
SELECT generate_t5_invoices();
```

### 2. Deploy Edge Functions

```bash
# T-5 Invoice Generation
supabase functions deploy generate-t5-invoices

# Escalation Orchestration
supabase functions deploy run-escalation-orchestration
```

**Verify:**
```bash
curl -X POST \
  "https://xxx.supabase.co/functions/v1/generate-t5-invoices" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 3. Set Up GitHub Actions

1. Go to GitHub repository → Settings → Secrets
2. Add secrets:
   - `SUPABASE_URL`
   - `CRON_SECRET`
3. Enable workflows:
   - `.github/workflows/generate-t5-invoices.yaml`
   - `.github/workflows/run-escalation-orchestration.yaml`

**Verify:**
- Go to Actions tab
- Manually trigger workflow
- Check execution logs

### 4. Configure Notifications Queue

**Verify table exists:**
```sql
SELECT * FROM notifications_queue LIMIT 1;
```

**Columns:**
- `channel`: 'email' | 'whatsapp'
- `recipient`: Email or phone number
- `subject`: Email subject
- `html`: Email HTML body
- `template_key`: WhatsApp template
- `status`: 'pending' | 'sent' | 'failed'
- `run_after`: When to send
- `attempts`: Retry count

## Monitoring

### 1. Check T-5 Generation Logs

```bash
# GitHub Actions
gh run list --workflow=generate-t5-invoices.yaml

# Supabase Logs
# Go to Supabase Dashboard → Edge Functions → generate-t5-invoices → Logs
```

### 2. Check Escalation Logs

```bash
# GitHub Actions
gh run list --workflow=run-escalation-orchestration.yaml

# Supabase Logs
# Dashboard → Edge Functions → run-escalation-orchestration → Logs
```

### 3. Monitor Notifications Queue

```sql
-- Pending notifications
SELECT COUNT(*) FROM notifications_queue WHERE status = 'pending';

-- Failed notifications
SELECT * FROM notifications_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- Sent today
SELECT COUNT(*) FROM notifications_queue 
WHERE status = 'sent' 
AND created_at::date = current_date;
```

### 4. Monitor Access Status

```sql
-- Bookings by access_status
SELECT access_status, COUNT(*) 
FROM bookings 
GROUP BY access_status;

-- Recently escalated
SELECT booking_id, access_status, updated_at
FROM bookings
WHERE access_status IN ('overdue_grace', 'overdue_locked')
ORDER BY updated_at DESC
LIMIT 10;

-- Recently restored
SELECT booking_id, access_status, updated_at
FROM bookings
WHERE access_status = 'active'
AND updated_at > now() - interval '24 hours'
ORDER BY updated_at DESC;
```

## Troubleshooting

### Issue: T-5 invoices not generating

**Check:**
1. GitHub Actions running? Check Actions tab
2. Edge function deployed? `supabase functions list`
3. Database function exists? `SELECT generate_t5_invoices();`
4. CRON_SECRET correct? Check GitHub Secrets

**Fix:**
```bash
# Redeploy edge function
supabase functions deploy generate-t5-invoices

# Manually trigger
gh workflow run generate-t5-invoices.yaml
```

### Issue: Notifications not sending

**Check:**
1. Notifications in queue? `SELECT * FROM notifications_queue WHERE status = 'pending';`
2. Notification worker running? Check Supabase logs
3. Email service configured? Check SMTP settings

**Fix:**
```bash
# Check notification worker
supabase functions deploy notification-worker

# Manually process queue
SELECT process_notification_queue();
```

### Issue: Access status not updating

**Check:**
1. Escalation function running? Check GitHub Actions
2. Invoices exist? `SELECT * FROM invoices WHERE status = 'pending';`
3. Days overdue calculated? `SELECT *, (current_date - due_date) AS days_overdue FROM invoices;`

**Fix:**
```bash
# Manually trigger escalation
gh workflow run escalate-overdue-bookings.yaml

# Or call directly
curl -X POST "$SUPABASE_URL/functions/v1/escalate-overdue-bookings" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Performance

### Expected Load

| Metric | Expected | Max |
|--------|----------|-----|
| Recurring bookings | 100-500 | 1000 |
| T-5 invoices/day | 5-20 | 50 |
| Notifications/day | 10-50 | 200 |
| Escalations/day | 1-10 | 30 |

### Optimization

1. **Batch processing** - Process in batches of 50
2. **Indexing** - Ensure indexes on:
   - `bookings.billing_cycle_anchor`
   - `bookings.access_status`
   - `invoices.due_date`
   - `invoices.status`
3. **Caching** - Cache booking details
4. **Async notifications** - Queue for background processing

## Security

### 1. CRON_SECRET

**Required for:**
- `generate-t5-invoices`
- `run-escalation-orchestration`
- `escalate-overdue-bookings`

**Generate:**
```bash
openssl rand -base64 32
```

**Store in:**
- GitHub Secrets
- Supabase Environment Variables

### 2. Database Functions

**Security:**
```sql
CREATE OR REPLACE FUNCTION generate_t5_invoices()
SECURITY DEFINER  -- Runs with owner's privileges
```

**Permissions:**
```sql
REVOKE ALL ON FUNCTION generate_t5_invoices() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_t5_invoices() TO service_role;
```

### 3. Edge Functions

**Authentication:**
```typescript
const authHeader = req.headers.get('Authorization')
const cronSecret = Deno.env.get('CRON_SECRET')

if (!authHeader || !authHeader.includes(cronSecret)) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Integration with Other Phases

| Phase | Integration Point | Description |
|-------|------------------|-------------|
| Phase 1 | Database schema | Uses `bookings`, `invoices` tables |
| Phase 2 | Booking enforcement | Respects `access_status` for booking rules |
| Phase 3 | Calendar month | Uses calendar month for invoice generation |
| Phase 4 | Monthly invoicing | Calls `monthlyInvoiceService` for calculations |
| Phase 5 | Adjustments | Includes adjustment classes in invoices |
| Phase 6 | Crash course | Handles crash course invoicing |
| Phase 7 | Instructor filter | Filters visible bookings by `access_status` |

## Complete Automation Timeline

```
Day 1 (Jan 10)
├─ 1 AM: T-5 invoice generation for Jan 15 billing
├─ 2 AM: Check T-3 reminders (for Jan 13 due dates)
└─ 6 AM: Escalate overdue bookings

Day 4 (Jan 13)
├─ 2 AM: Send T-3 reminders for Jan 16 due dates
└─ 6 AM: Escalate overdue bookings

Day 6 (Jan 15) - DUE DATE
├─ 2 AM: Send T-1 reminders for Jan 16 due dates
└─ 6 AM: Escalate overdue (status still active on due date)

Day 7 (Jan 16) - T+1
└─ 6 AM: Escalate overdue (status still active, 1 day overdue)

Day 15 (Jan 24) - T+9
└─ 6 AM: Escalate to overdue_grace (8-10 days overdue)

Day 18 (Jan 27) - T+12
└─ 6 AM: Escalate to overdue_locked (11+ days overdue)
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Invoice generation success rate | > 99% | `total_generated / total_checked` |
| Notification delivery rate | > 95% | `sent / (sent + failed)` |
| False escalations | < 1% | Manual review |
| Payment collection time | < 10 days | Average `paid_date - due_date` |
| Customer complaints | < 5/month | Support tickets |

## Phase 8 Complete ✅

**Deliverables:**
- ✅ T-5 automated invoice generation
- ✅ Access status escalation logic
- ✅ Email notification system
- ✅ Proactive payment reminders
- ✅ GitHub Actions cron jobs
- ✅ Database RPC functions
- ✅ Edge functions
- ✅ Complete documentation

**Next Steps:**
1. Deploy to production
2. Monitor for 1 month
3. Adjust thresholds based on data
4. Gather user feedback
5. Optimize notification templates

---

**Phase 8 Status: COMPLETE** 🎉

All 8 phases of the modular billing system are now implemented and ready for production deployment.
