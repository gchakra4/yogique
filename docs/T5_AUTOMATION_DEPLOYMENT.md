# T-5 Automation Deployment Guide

## Overview
Automated invoice and class generation system that runs 5 days before billing cycle anchor dates for recurring monthly subscriptions.

---

## What Was Deployed

### 1. Database Function: `generate_t5_invoices()`
**Location:** `supabase/deploy/generate_t5_invoices.sql`  
**Status:** ✅ Deployed to Production

**What It Does:**
- Runs daily via cron job at 1 AM UTC
- Checks all recurring bookings for T-5 day eligibility
- Generates invoices AND monthly classes simultaneously
- Links classes to bookings via `assignment_bookings` table

---

## Business Logic

### Billing Cycle Rules
- **Calendar Month Billing**: Natural month boundaries (Jan 1-31, Feb 1-28, NOT rolling 30 days)
- **billing_cycle_anchor**: Set to last day of first month (e.g., 2025-01-31)
- **T-5 Day**: 5 days before billing_cycle_anchor day
- **Example**: If anchor = Jan 31, T-5 = Jan 26

### First Month vs Subsequent Months
**First Month (Join Day):**
- Join Jan 18 → Prorated classes Jan 18-31
- Invoice generated immediately
- billing_cycle_anchor = 2025-01-31

**Subsequent Months (T-5 Automation):**
- T-5 Day (Jan 26) → Generate Feb invoice + all Feb classes
- Full month billing (Feb 1-28)
- Classes scheduled for entire month based on `preferred_days`

### Assignment Types
Only 3 types exist:
1. **Monthly** - Recurring subscription with T-5 automation
2. **Crash Course** - Fixed duration program
3. **Single/Adhoc** - One-time classes

*Note: "weekly_recurrence" is a METHOD for generating monthly schedules, NOT a type*

---

## Function Behavior

### Selection Criteria
The function processes bookings where:
```sql
WHERE b.is_recurring = true
  AND b.status IN ('confirmed', 'active')
  AND b.access_status != 'overdue_locked'
  AND b.billing_cycle_anchor IS NOT NULL
  AND b.class_package_id IS NOT NULL
  AND b.preferred_days IS NOT NULL
  AND array_length(b.preferred_days, 1) > 0
```

### What Gets Generated

**Invoice Fields:**
- `booking_id` - Link to bookings.id
- `billing_month` - Format: YYYY-MM (e.g., "2025-02")
- `billing_period_start` - First day of month
- `billing_period_end` - Last day of month
- `base_amount` - Package total_amount
- `tax_rate` - 0.18 (18% GST)
- `tax_amount` - Calculated from base_amount
- `total_amount` - base_amount + tax_amount
- `due_date` - billing_cycle_anchor day in target month
- `status` - 'pending'

**Class Assignment Fields:**
- `package_id` / `class_package_id` - Package reference
- `date` - Specific class date based on preferred_days
- `start_time` / `end_time` - From booking
- `instructor_id` - From booking
- `payment_amount` - Per-class amount (total_amount / class_count)
- `schedule_type` - 'monthly'
- `assigned_by` - 'system_automated'
- `booking_type` - 'individual'
- `class_status` - 'scheduled'
- `payment_status` - 'pending'
- `instructor_status` - 'pending'
- `calendar_month` - Format: YYYY-MM
- `is_adjustment` - false

---

## Class Generation Logic

### How Classes Are Scheduled
1. Calculate month boundaries (e.g., Feb 1 - Feb 28)
2. Loop through each day in the month
3. Check if day matches `preferred_days` array
4. Insert class assignment if match found
5. Stop when `class_count` limit reached

### preferred_days Format
Stored as text array in bookings table:
```sql
preferred_days = ['monday', 'wednesday', 'friday']
```

**Day Mapping:**
- 0 (Sunday) → 'sunday'
- 1 (Monday) → 'monday'
- 2 (Tuesday) → 'tuesday'
- 3 (Wednesday) → 'wednesday'
- 4 (Thursday) → 'thursday'
- 5 (Friday) → 'friday'
- 6 (Saturday) → 'saturday'

### Example Scenario
**Booking Details:**
- Package: 12 classes/month
- preferred_days: ['monday', 'wednesday', 'friday']
- billing_cycle_anchor: 2025-01-31

**Feb 2025 Generation (on Jan 26):**
- Feb has: 4 Mondays, 4 Wednesdays, 4 Fridays = 12 total
- System generates exactly 12 classes (stops at limit)
- All classes get `calendar_month = '2025-02'`

---

## Access Status & Escalation

### Status Transitions
- **Day 0-7**: `access_status = 'active'` → Can schedule classes
- **Day 8-10**: `access_status = 'overdue_grace'` → Can still schedule (grace period)
- **Day 11+**: `access_status = 'overdue_locked'` → Cannot schedule, excluded from T-5

### Escalation Function
Separate DB function `escalate_overdue_bookings()` runs daily to update statuses based on payment delays.

**Location:** `archived-sql/supabase/migrations/20251219160000_module_5_access_control.sql`

---

## Edge Function Integration

### generate-t5-invoices Edge Function
**Location:** `supabase/functions/generate-t5-invoices/index.ts`

**What It Does:**
```typescript
// Calls the RPC function
const { data, error } = await supabase.rpc('generate_t5_invoices')
```

**Schedule:** Daily at 1 AM UTC (configured in Supabase Dashboard)

**No changes needed** - Edge function just triggers the SQL function we deployed.

---

## Return Format

### Success Response
```json
{
  "total_checked": 45,
  "total_generated": 12,
  "total_skipped": 30,
  "total_errors": 3,
  "execution_date": "2025-01-26",
  "results": [
    {
      "booking_id": "YG-202501-0042",
      "status": "generated",
      "calendar_month": "2025-02",
      "due_date": "2025-02-28",
      "invoice_id": "uuid",
      "invoice_number": "INV-202502-0001",
      "classes_generated": 12
    },
    {
      "booking_id": "YG-202501-0043",
      "status": "skipped",
      "reason": "Not T-5 day (T-5 is 2025-01-27, days until billing: 6)"
    },
    {
      "booking_id": "YG-202501-0044",
      "status": "error",
      "reason": "null value in column \"instructor_id\" violates not-null constraint"
    }
  ]
}
```

---

## Testing the Function

### Manual Test in SQL Editor
```sql
-- Run the function manually
SELECT generate_t5_invoices();

-- Check what would run today
SELECT 
    b.booking_id,
    b.billing_cycle_anchor,
    b.billing_cycle_anchor - INTERVAL '5 days' as t5_date,
    current_date,
    CASE 
        WHEN (b.billing_cycle_anchor - INTERVAL '5 days')::date = current_date 
        THEN 'Would Generate' 
        ELSE 'Skip' 
    END as status
FROM bookings b
WHERE b.is_recurring = true
  AND b.access_status != 'overdue_locked';
```

### Verify Generated Data
```sql
-- Check latest invoices
SELECT * FROM invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- Check latest classes
SELECT ca.*, ab.booking_id 
FROM class_assignments ca
JOIN assignment_bookings ab ON ab.assignment_id = ca.id
WHERE ca.assigned_by = 'system_automated'
ORDER BY ca.created_at DESC
LIMIT 20;
```

---

## Monitoring & Logs

### View Function Logs
Supabase Dashboard → Database → Functions → generate_t5_invoices → View Logs

Look for:
- `NOTICE` statements showing processing details
- `WARNING` statements for errors
- Execution summary at end

### Key Metrics to Monitor
- `total_checked` - Should match recurring bookings count
- `total_generated` - Invoices/classes created successfully
- `total_errors` - Should be 0 (investigate if > 0)
- `classes_generated` - Per booking, should match package class_count

---

## Rollback Instructions

### If Issues Occur
1. **Disable Cron Job**:
   - Supabase Dashboard → Edge Functions → generate-t5-invoices → Disable Schedule

2. **Revert Function**:
   ```sql
   -- Run the old version or drop function
   DROP FUNCTION IF EXISTS generate_t5_invoices();
   ```

3. **Clean Up Bad Data** (if needed):
   ```sql
   -- Delete incorrectly generated invoices/classes
   DELETE FROM class_assignments 
   WHERE assigned_by = 'system_automated' 
     AND created_at > 'YYYY-MM-DD HH:MM:SS';
   
   DELETE FROM invoices 
   WHERE created_at > 'YYYY-MM-DD HH:MM:SS'
     AND status = 'pending';
   ```

---

## Related Files

### Frontend Components
- `src/features/dashboard/components/Modules/ClassAssignmentManager/services/automatedInvoiceService.ts` - TypeScript version for manual admin operations
- `src/features/dashboard/components/Modules/ClassAssignmentManager/ClassAssignmentManager.tsx` - UI for class management

### Database Migrations
- `supabase/migrations/20250101000000_phase1_schema_updates.sql` - Schema setup
- `archived-sql/supabase/migrations/20251219160000_module_5_access_control.sql` - Access control & escalation

### Edge Functions
- `supabase/functions/generate-t5-invoices/index.ts` - Cron trigger
- `supabase/functions/run-escalation-orchestration/index.ts` - Access status escalation

---

## Support & Troubleshooting

### Common Issues

**Issue:** Classes not generating
- Check `preferred_days` is populated in bookings table
- Verify `class_package_id` exists and has `class_count` set
- Check `instructor_id` is not null

**Issue:** Wrong number of classes
- Verify `class_count` in class_packages table
- Check if month has enough matching days (e.g., only 4 Mondays)
- Review WHILE loop limit in function

**Issue:** Invoice amounts incorrect
- Check `total_amount` in class_packages table
- Verify tax_rate = 0.18 (18%)
- Review calculation: `base_amount + (base_amount * 0.18)`

---

## Deployment Checklist

- [x] SQL function created/updated
- [x] Function deployed to production database
- [x] Permissions granted to service_role
- [x] Edge function verified (no changes needed)
- [x] Cron schedule active (1 AM UTC daily)
- [ ] Monitor first automated run
- [ ] Verify generated invoices and classes
- [ ] Check email notifications sent (if applicable)

---

**Last Updated:** December 31, 2025  
**Deployed By:** Manual SQL Editor deployment  
**Production Status:** ✅ Active
