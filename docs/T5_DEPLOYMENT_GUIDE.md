# 🚀 T-5 Invoice Automation Deployment Guide

## ✅ Completed Changes

### **1. Client-Side Container Codes** ✅
- **File:** [assignmentCreation.ts](../src/features/dashboard/components/Modules/ClassAssignmentManager/services/assignmentCreation.ts)
- **Pattern:**
  - Individual: `{bookingId}-{YYYY-MM}`
  - Groups: `{instructorId}-{packageId}-{YYYY-MM}`

### **2. Manual Invoice Generation UI** ✅
- **File:** [ClassAssignmentManager.tsx](../src/features/dashboard/components/Modules/ClassAssignmentManager/ClassAssignmentManager.tsx)
- **Feature:** Purple "Generate Invoices" button in header
- **Calls:** `supabase.rpc('generate_monthly_invoices', { p_calendar_month })`

### **3. T-5 Database Function** ✅
- **File:** [generate_t5_invoices.sql](../supabase/deploy/generate_t5_invoices.sql)
- **Updated:**
  - Fetches `booking_type` field
  - Uses type-aware container code patterns
  - Automatically reuses existing containers
  - Creates new containers only when needed

---

## 📋 Deployment Steps

### **Step 1: Deploy Updated T-5 Function**

```bash
cd supabase/deploy
supabase db execute < generate_t5_invoices.sql
```

**Verification:**
```sql
-- Check function exists
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname = 'generate_t5_invoices';

-- Should show:
-- generate_t5_invoices_impl(uuid, boolean)
-- generate_t5_invoices()
-- generate_t5_invoices(uuid, boolean)
```

### **Step 2: Verify RPC Functions**

```sql
-- Check generate_monthly_invoices exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'generate_monthly_invoices';

-- Test dry run
SELECT generate_t5_invoices(NULL, true);
```

### **Step 3: Test Container Code Patterns**

```sql
-- Test individual container code
SELECT 
  'ABC123-2026-02' AS individual_pattern,
  'a1b2c3d4-e5f6g7h8-2026-02' AS group_pattern;

-- Check existing containers
SELECT 
  container_code,
  container_type,
  current_booking_count,
  max_booking_count
FROM class_containers
ORDER BY created_at DESC
LIMIT 10;
```

### **Step 4: Verify Edge Function (Optional)**

If you want to test the edge function manually:

```bash
# Deploy edge function
supabase functions deploy generate-t5-invoices

# Test with curl
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-t5-invoices' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### **Step 5: Test Manual Invoice Generation**

1. **Open UI:** Navigate to Class Assignment Manager
2. **Click:** Purple "Generate Invoices" button
3. **Select:** Month (e.g., "2026-02")
4. **Click:** "Generate Invoices"
5. **Verify:** Check success message and invoice count

**Database Verification:**
```sql
-- Check generated invoices
SELECT 
  invoice_number,
  booking_id,
  billing_month,
  total_amount,
  status,
  created_at
FROM invoices
WHERE billing_month = 'Feb 2026'
ORDER BY created_at DESC;
```

### **Step 6: Test T-5 Automation (Dry Run)**

```sql
-- Simulate T-5 run without creating records
SELECT generate_t5_invoices(NULL, true);

-- Check output:
-- {
--   "total_checked": 50,
--   "total_generated": 12,
--   "total_skipped": 38,
--   "total_errors": 0,
--   "results": [...]
-- }
```

### **Step 7: Test Container Reuse**

```sql
-- Create test booking with known booking_id
-- Generate invoice for month 1
SELECT generate_t5_invoices(
  p_booking_id := 'uuid-of-test-booking',
  p_dry_run := false
);

-- Get container_id from result
-- Generate invoice for month 2 (should reuse container)
SELECT generate_t5_invoices(
  p_booking_id := 'uuid-of-test-booking',
  p_dry_run := false
);

-- Verify same container used
SELECT 
  cc.container_code,
  COUNT(DISTINCT ca.booking_id) AS unique_bookings,
  COUNT(ca.id) AS total_classes,
  MIN(ca.class_date) AS first_class,
  MAX(ca.class_date) AS last_class
FROM class_containers cc
LEFT JOIN class_assignments ca ON ca.class_container_id = cc.id
WHERE cc.container_code LIKE 'test-booking-id%'
GROUP BY cc.id, cc.container_code;
```

---

## 🔧 Configuration Check

### **Database Functions Required**

```sql
-- All these should exist:
SELECT proname FROM pg_proc WHERE proname IN (
  'generate_t5_invoices',
  'generate_t5_invoices_impl',
  'generate_monthly_invoices',
  'get_business_tax_rate',
  'count_scheduled_classes'
);
```

### **Cron Schedule**

**File:** `supabase/config.toml`

```toml
[edge_runtime.functions.generate-t5-invoices]
schedule = "0 1 * * *"  # Daily at 1 AM UTC
```

**Verification:**
```bash
supabase functions list
# Should show generate-t5-invoices with schedule
```

---

## 🧪 End-to-End Test Scenario

### **Scenario: New User Joins Mid-Month**

```
Day 1 (Jan 18): User joins
├─ booking_id: "TEST123"
├─ booking_type: "individual"
├─ billing_cycle_anchor: "2026-01-18"
└─ package: 8 classes/month

Day 1-13 (Jan 18-31): Admin creates manual classes
├─ Creates classes for Jan 18-31
├─ Clicks "Generate Invoices" → selects "2026-01"
└─ Invoice YG-202601-0001 created

Day 26 (Jan 26): T-5 automation runs
├─ Detects TEST123 needs Feb invoice
├─ Container code: "TEST123-2026-02"
├─ Container NOT found → creates new
├─ Generates 8 classes for Feb 1-28
└─ Invoice YG-202602-0001 created

Day 54 (Feb 23): T-5 automation runs
├─ Detects TEST123 needs Mar invoice
├─ Container code: "TEST123-2026-03"
├─ Container NOT found → creates new
├─ Generates 8 classes for Mar 1-31
└─ Invoice YG-202603-0001 created
```

**Database State After:**
```sql
-- Should have 3 containers
SELECT container_code FROM class_containers 
WHERE container_code LIKE 'TEST123%'
ORDER BY container_code;

-- Results:
-- TEST123-2026-01  (manual)
-- TEST123-2026-02  (T-5)
-- TEST123-2026-03  (T-5)

-- Should have 3 invoices
SELECT invoice_number, billing_month FROM invoices 
WHERE booking_id = (SELECT id FROM bookings WHERE booking_id = 'TEST123')
ORDER BY billing_period_start;

-- Results:
-- YG-202601-0001, Jan 2026
-- YG-202602-0001, Feb 2026
-- YG-202603-0001, Mar 2026
```

---

## 🚨 Troubleshooting

### **Container Codes Don't Match**

**Problem:** Client creates `ABC123-2026-02`, server creates `T5-ABC123-2026-02`

**Solution:**
1. Verify `generate_t5_invoices.sql` deployed (latest version)
2. Check line ~243 uses new pattern (not `T5-` prefix)
3. Re-deploy: `supabase db execute < supabase/deploy/generate_t5_invoices.sql`

### **Containers Not Reused**

**Problem:** New container created each month instead of reusing

**Solution:**
1. Check container_code pattern matches exactly
2. Verify `SELECT id FROM class_containers WHERE container_code = 'ABC123-2026-02'` returns result
3. Check for typos in booking_id or date formatting

### **Invoice Duplicates**

**Problem:** Multiple invoices for same booking + month

**Solution:**
- RPC should skip if invoice exists:
```sql
SELECT * FROM invoices 
WHERE booking_id = 'uuid' 
AND billing_period_start = '2026-02-01';
```
- Check RPC function has duplicate check (around line 345 in archived migration)

### **Manual Button Not Working**

**Problem:** "Generate Invoices" button doesn't create invoices

**Solution:**
1. Check browser console for errors
2. Verify RPC exists: `SELECT proname FROM pg_proc WHERE proname = 'generate_monthly_invoices';`
3. Check RPC permissions: `GRANT EXECUTE ON FUNCTION generate_monthly_invoices TO authenticated;`

---

## 📊 Monitoring

### **Invoice Generation Stats**

```sql
-- Daily T-5 execution log
SELECT 
  COUNT(*) AS total_runs,
  SUM((result->'total_generated')::int) AS total_invoices,
  SUM((result->'total_skipped')::int) AS total_skipped,
  SUM((result->'total_errors')::int) AS total_errors
FROM execution_logs
WHERE function_name = 'generate_t5_invoices'
AND created_at > NOW() - INTERVAL '30 days';
```

### **Container Reuse Rate**

```sql
-- Check how many classes per container (should be ~8/month/booking)
SELECT 
  container_code,
  COUNT(DISTINCT DATE_TRUNC('month', class_date)) AS months_used,
  COUNT(*) AS total_classes,
  COUNT(*) / COUNT(DISTINCT DATE_TRUNC('month', class_date)) AS avg_classes_per_month
FROM class_assignments ca
JOIN class_containers cc ON cc.id = ca.class_container_id
GROUP BY container_code
HAVING COUNT(DISTINCT DATE_TRUNC('month', class_date)) > 1
ORDER BY months_used DESC;
```

---

## ✅ Production Checklist

Before enabling in production:

- [ ] `generate_t5_invoices.sql` deployed with new container patterns
- [ ] `generate_monthly_invoices` RPC tested and working
- [ ] Manual invoice button tested (creates invoices correctly)
- [ ] T-5 dry run tested (`p_dry_run := true`)
- [ ] Container reuse verified (same booking_id → same container across months)
- [ ] Edge function deployed (if using cron)
- [ ] Cron schedule configured (daily 1 AM UTC)
- [ ] Monitoring queries set up
- [ ] Error alerting configured
- [ ] Documentation reviewed with team

---

## 📚 Related Documentation

- [INVOICE_GENERATION_WORKFLOW.md](./INVOICE_GENERATION_WORKFLOW.md) - Complete workflow guide
- [PHASE_8_IMPLEMENTATION_SUMMARY.md](./PHASE_8_IMPLEMENTATION_SUMMARY.md) - T-5 automation details
- [CONTAINER_INDEX.md](./CONTAINER_INDEX.md) - Container architecture overview

---

**Deployment Date:** January 8, 2026  
**Version:** 2.0  
**Status:** ✅ Ready for Deployment
