# 📋 MODULE 2: Invoice Generation & Tracking

## 🎯 Scope & Boundaries

**Owns:**
- First invoice generation (prorated)
- Monthly invoice generation (full amount)
- Proration calculation (class-count based)
- Tax calculation from business_settings
- Invoice number generation

**Does NOT:**
- Create payment links (Module 3)
- Process payments (Module 4)
- Update access status (Module 5)
- Send invoice emails (deferred to Module 3)

---

## 📦 Deliverables

### 1. Database Objects

#### Functions
1. **`get_business_tax_rate()`**
   - Returns: `numeric` (GST/tax rate percentage)
   - Purpose: Fetch tax_rate from business_settings.invoice_preferences
   - Security: STABLE, accessible to authenticated users

2. **`count_scheduled_classes(p_booking_id, p_start_date, p_end_date)`**
   - Returns: `integer` (count of scheduled classes)
   - Purpose: Count non-cancelled classes for proration
   - Logic: Queries class_assignments via assignment_bookings
   - Excludes: cancelled, rescheduled classes

3. **`generate_first_invoice(p_booking_id)`**
   - Returns: `json` (success/failure with invoice details)
   - Purpose: Generate prorated first month invoice
   - Trigger: Automatically called when billing_cycle_anchor is set
   - Proration: `scheduled_classes_in_first_month / package.class_count × price`
   - Due Date: Same as billing_cycle_anchor (first class date)
   - Security: SECURITY DEFINER, service_role only

4. **`generate_monthly_invoices(p_target_month)`**
   - Returns: `json` (batch summary with counts)
   - Purpose: Generate full-month invoices for all active recurring bookings
   - Schedule: Called by cron job days 23-27
   - Due Date: Last day of previous month (1 day before billing period)
   - Security: SECURITY DEFINER, service_role only

#### Triggers
1. **`bookings_generate_first_invoice_trigger`**
   - Event: AFTER UPDATE OF billing_cycle_anchor ON bookings
   - Condition: OLD.billing_cycle_anchor IS NULL AND NEW.billing_cycle_anchor IS NOT NULL
   - Action: Calls generate_first_invoice(NEW.id)
   - Error Handling: Logs errors as NOTICE, does not block booking update

#### Views
1. **`invoices_pending_generation_v`**
   - Purpose: List bookings that need next month invoice generated
   - Columns: booking_id, customer_name, package_price, next_billing_period, next_due_date
   - Use Case: Manual verification dashboard, monitoring

---

### 2. Edge Function

**Path:** `supabase/functions/generate-monthly-invoices/index.ts`

**Cron Schedule:** Daily at midnight UTC, only executes days 23-27

**Logic:**
```typescript
1. Check if day of month is 23-27 → else skip
2. Verify CRON_SECRET authorization
3. Call supabase.rpc('generate_monthly_invoices', { p_target_month: null })
4. Return summary: { created_count, skipped_count, error_count, errors }
```

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (optional, for security)

**Deployment Command:**
```bash
supabase functions deploy generate-monthly-invoices
```

**Manual Test:**
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/generate-monthly-invoices \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

## 🧮 Business Logic Specifications

### First Invoice (Prorated)

**Trigger Condition:**
- Booking is recurring (`is_recurring = true`)
- Billing cycle anchor was just set (changed from NULL to a date)

**Billing Period:**
- Start: `billing_cycle_anchor` (first class date)
- End: Last day of that month

**Amount Calculation:**
```sql
base_amount = class_packages.price
scheduled_classes = count_scheduled_classes(booking_id, first_class_date, month_end)
prorated_amount = (scheduled_classes / package.class_count) × base_amount
tax_amount = prorated_amount × (tax_rate / 100)
total_amount = prorated_amount + tax_amount
```

**Due Date:** Same as billing_cycle_anchor (payment due on first class date)

**Proration Note Example:**
```
First month prorated: 8 classes scheduled out of 16 package classes
```

---

### Regular Monthly Invoices

**Trigger Condition:**
- Current date is between 23rd and 27th of the month
- Booking is recurring and active
- Billing cycle anchor exists and started before next month
- Invoice for next month does not already exist

**Billing Period:**
- Start: 1st of next month
- End: Last day of next month

**Amount Calculation:**
```sql
amount = class_packages.price (full month, no proration)
tax_amount = amount × (tax_rate / 100)
total_amount = amount + tax_amount
```

**Due Date:** Last day of current month (1 day before billing period starts)

**Example Timeline:**
- **December 26, 2024**: Invoice generated for January 2025
- **Billing Period**: Jan 1, 2025 → Jan 31, 2025
- **Due Date**: Dec 31, 2024

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ FIRST INVOICE FLOW                                              │
└─────────────────────────────────────────────────────────────────┘

1. Admin/System sets booking.billing_cycle_anchor = '2025-01-15'
   ↓
2. TRIGGER: bookings_generate_first_invoice_trigger fires
   ↓
3. FUNCTION: generate_first_invoice(booking_id)
   ├─ Query: class_packages.price
   ├─ Query: count_scheduled_classes(2025-01-15 to 2025-01-31)
   ├─ Calculate: prorated_amount = (scheduled / total) × price
   ├─ Fetch: get_business_tax_rate()
   ├─ Calculate: tax_amount, total_amount
   └─ INSERT: invoices table
       - due_date = 2025-01-15
       - status = 'pending'
       - proration_note populated

┌─────────────────────────────────────────────────────────────────┐
│ MONTHLY INVOICE FLOW                                            │
└─────────────────────────────────────────────────────────────────┘

1. Cron job runs daily at midnight UTC
   ↓
2. EDGE FUNCTION: generate-monthly-invoices/index.ts
   ├─ Check: Is today day 23-27? → else skip
   ├─ Verify: CRON_SECRET
   └─ Call: supabase.rpc('generate_monthly_invoices')
       ↓
3. FUNCTION: generate_monthly_invoices(NULL)
   ├─ Calculate: target_month = next month
   ├─ Query: all recurring bookings with billing_cycle_anchor < next month
   ├─ Loop: for each booking
   │   ├─ Check: invoice already exists? → skip
   │   ├─ Fetch: class_packages.price
   │   ├─ Fetch: get_business_tax_rate()
   │   ├─ Calculate: tax_amount, total_amount (full month, no proration)
   │   └─ INSERT: invoices table
   │       - billing_period_start = 2025-02-01
   │       - billing_period_end = 2025-02-28
   │       - due_date = 2025-01-31
   │       - status = 'pending'
   │       - proration_note = NULL
   └─ Return: { created_count, skipped_count, error_count, errors }
```

---

## 🧪 Testing Checklist

### Pre-Deployment Tests

```sql
-- 1. Test tax rate fetching
SELECT public.get_business_tax_rate();
-- Expected: numeric value (e.g., 18)

-- 2. Test class counting (replace UUIDs with real values)
SELECT public.count_scheduled_classes(
    '<booking_uuid>',
    '2025-01-15',
    '2025-01-31'
);
-- Expected: integer count

-- 3. Test first invoice generation (service_role context)
SELECT public.generate_first_invoice('<booking_uuid>');
-- Expected: json with success=true, invoice_id, amounts

-- 4. Verify invoice created
SELECT 
    invoice_number,
    booking_id,
    amount,
    tax_amount,
    total_amount,
    billing_period_start,
    billing_period_end,
    due_date,
    proration_note
FROM public.invoices
WHERE booking_id = '<booking_uuid>'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Test monthly invoice generation (dry run)
SELECT public.generate_monthly_invoices(DATE '2025-02-01');
-- Expected: json with created_count, skipped_count

-- 6. Check pending invoices view
SELECT * FROM public.invoices_pending_generation_v;
-- Expected: bookings needing next month invoice
```

### Post-Deployment Tests

```bash
# 1. Test edge function manually (use your project URL)
curl -X POST https://<project-ref>.supabase.co/functions/v1/generate-monthly-invoices \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "day_of_month": 26,
#   "created_count": 5,
#   "skipped_count": 2,
#   "error_count": 0
# }

# 2. Test with wrong date (should skip)
# Run on day 15 of month, expect:
# {
#   "success": true,
#   "message": "Skipped - not in execution window (day 15)",
#   "execution_window": "23-27 of each month"
# }

# 3. Verify invoices in database
supabase db shell
```

```sql
-- Check invoices created in last hour
SELECT 
    invoice_number,
    booking_id,
    billing_month,
    billing_period_start,
    billing_period_end,
    due_date,
    total_amount,
    status,
    created_at
FROM public.invoices
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🔐 Security Considerations

1. **Service Role Functions:**
   - `generate_first_invoice()` and `generate_monthly_invoices()` use SECURITY DEFINER
   - Only callable via service_role key (edge functions, triggers)
   - Not accessible to authenticated users directly

2. **Cron Secret:**
   - Edge function verifies `CRON_SECRET` header
   - Prevents unauthorized manual execution
   - Set via Supabase dashboard: Settings → Edge Functions → Secrets

3. **RLS Inheritance:**
   - Views inherit RLS from base tables (invoices, bookings)
   - No additional policies needed on views

4. **Error Handling:**
   - First invoice trigger logs errors as NOTICE, does not block booking updates
   - Monthly generation continues if individual booking fails (error logged in result)

---

## 📋 Deployment Steps

### 1. Push Database Migration
```bash
cd "d:\New folder\tryfix - Copy"
supabase db push
```

Expected output:
```
Applying migration 20251219130000_module_2_invoice_generation.sql...
Finished supabase db push.
```

### 2. Deploy Edge Function
```bash
supabase functions deploy generate-monthly-invoices
```

Expected output:
```
Deploying generate-monthly-invoices (project ref: <your-ref>)
Deployed function generate-monthly-invoices
```

### 3. Set Cron Secret (via Supabase Dashboard)
1. Go to: Settings → Edge Functions → Secrets
2. Add secret: `CRON_SECRET` = `<your-random-secure-string>`
3. Restart edge functions

### 4. Configure Cron Job (via Supabase Dashboard)
1. Go to: Database → Cron Jobs (pg_cron extension)
2. Create new job:
   ```sql
   SELECT cron.schedule(
       'generate-monthly-invoices',
       '0 0 * * *', -- Daily at midnight UTC
       $$
       SELECT net.http_post(
           url := 'https://<project-ref>.supabase.co/functions/v1/generate-monthly-invoices',
           headers := jsonb_build_object(
               'Content-Type', 'application/json',
               'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
           )
       );
       $$
   );
   ```

**Alternative:** Use Supabase's built-in cron feature (if available in your plan)

---

## 🔍 Verification Queries

Run after deployment to confirm Module 2 is working:

```sql
-- 1. Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'get_business_tax_rate',
      'count_scheduled_classes',
      'generate_first_invoice',
      'generate_monthly_invoices'
  )
ORDER BY routine_name;
-- Expected: 4 rows

-- 2. Check trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'bookings_generate_first_invoice_trigger';
-- Expected: 1 row

-- 3. Check view exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'invoices_pending_generation_v';
-- Expected: 1 row (table_type = 'VIEW')

-- 4. Test basic functionality
SELECT public.get_business_tax_rate();
-- Expected: numeric (e.g., 18)

-- 5. Check pending invoices
SELECT COUNT(*) AS pending_count
FROM public.invoices_pending_generation_v;
-- Expected: integer (may be 0 if no bookings ready)
```

---

## 🐛 Troubleshooting

### Issue: First invoice not generating after setting billing_cycle_anchor

**Check:**
1. Is `is_recurring = true`?
2. Did billing_cycle_anchor change from NULL to a date?
3. Check logs: `SELECT * FROM postgres_log ORDER BY log_time DESC LIMIT 10;`

**Fix:**
```sql
-- Manual generation if trigger failed
SELECT public.generate_first_invoice('<booking_id>');
```

---

### Issue: Monthly cron job not creating invoices

**Check:**
1. Is today between 23-27 of the month?
2. Is CRON_SECRET configured correctly?
3. Check edge function logs in Supabase dashboard

**Fix:**
```sql
-- Manual generation for testing
SELECT public.generate_monthly_invoices(DATE '2025-02-01');
```

---

### Issue: Proration amount incorrect

**Check:**
1. How many classes are scheduled? `SELECT public.count_scheduled_classes(...)`
2. What is package.class_count? `SELECT class_count FROM class_packages WHERE id = ...`
3. Is calculation correct? `scheduled / total × price`

**Fix:**
- Update proration_note manually if needed:
```sql
UPDATE invoices
SET proration_note = 'Corrected: X classes scheduled out of Y'
WHERE id = '<invoice_id>';
```

---

## 📌 Next Steps (Module 3)

After Module 2 is verified:
1. **Module 3: Payment Link Management**
   - Create Razorpay payment links for pending invoices
   - Store link metadata in payment_links table
   - Send invoice emails with payment links

**Integration Point:** Module 3 will listen for new invoices (status = 'pending') and auto-create payment links.

---

## 📝 Summary

**Module 2 Completed:**
✅ 4 database functions (tax rate, class counting, first invoice, monthly invoices)  
✅ 1 database trigger (auto-generate first invoice)  
✅ 1 view (pending invoices dashboard)  
✅ 1 edge function (cron job for monthly generation)  
✅ Proration logic (class-count based)  
✅ Tax calculation (GST from business_settings)  
✅ Invoice numbering (YG-YYYYMM-XXXX format)  

**Boundary Respected:**
❌ No payment link creation (Module 3)  
❌ No payment processing (Module 4)  
❌ No access status updates (Module 5)  
❌ No email sending yet (Module 3)  

Ready to proceed to **Module 3: Payment Link Management** after verification.
