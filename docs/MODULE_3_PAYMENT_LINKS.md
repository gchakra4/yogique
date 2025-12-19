# 💳 MODULE 3: Payment Link Management

## 🎯 Scope & Boundaries

**Owns:**
- Payment link creation via Razorpay API
- Payment link metadata storage
- Link expiry management
- Invoice email delivery with payment links
- Email delivery audit log

**Does NOT:**
- Process actual payments (Module 4)
- Verify payment signatures (Module 4)
- Update invoice status (Module 4)
- Update booking access status (Module 5)
- Send reminders (Module 5)

---

## 📦 Deliverables

### 1. Database Objects

#### Functions

1. **`store_payment_link(...)`**
   - Purpose: Store payment link metadata from Razorpay API response
   - Parameters: invoice_id, razorpay_link_id, short_url, expires_at, razorpay_response
   - Returns: JSON with success/error
   - Security: SECURITY DEFINER, service_role only
   - Logic: INSERT new or UPDATE existing (one per invoice)

2. **`get_invoice_for_payment_link(p_invoice_id)`**
   - Purpose: Fetch comprehensive invoice details for API call
   - Returns: JSON with customer info, amounts, billing period
   - Security: STABLE, authenticated users
   - Use Case: Pre-fetch data before calling Razorpay API

3. **`expire_payment_links()`**
   - Purpose: Mark expired payment links (status → 'expired')
   - Returns: JSON with expired_count
   - Security: SECURITY DEFINER, service_role only
   - Schedule: Run daily via cron

4. **`cancel_payment_link(p_invoice_id)`**
   - Purpose: Cancel payment link in database
   - Returns: JSON with success/error
   - Security: SECURITY DEFINER, service_role only
   - Note: Caller must also cancel via Razorpay API

5. **`get_payment_link_status(p_invoice_id)`**
   - Purpose: Get current payment link status for invoice
   - Returns: JSON with has_payment_link, status, is_active, is_expired
   - Security: STABLE, authenticated users

6. **`log_invoice_email(...)`**
   - Purpose: Log email delivery for audit trail
   - Parameters: invoice_id, recipient_email, email_type, payment_link_id, metadata
   - Returns: JSON with email_log_id
   - Security: SECURITY DEFINER, service_role only

#### Tables

**`invoice_emails`**
- Columns: id, invoice_id, recipient_email, email_type, payment_link_id, sent_at, email_provider_id, email_status, metadata
- Purpose: Audit log of all invoice emails
- RLS: Enabled (users see only their own emails)
- Indexes: invoice_id, sent_at DESC, email_status

#### Views

1. **`invoices_needing_payment_links_v`**
   - Purpose: Pending invoices without active payment links
   - Columns: invoice_id, customer_email, total_amount, due_date, hours_since_created
   - Use Case: Dashboard to identify invoices needing links

2. **`active_payment_links_v`**
   - Purpose: Active payment links with expiry status
   - Columns: payment_link_id, short_url, invoice_number, customer_name, expiry_status, hours_until_expiry
   - Use Case: Monitoring dashboard, expiry alerts

---

### 2. Edge Functions

#### A. `create-payment-link`

**Path:** `supabase/functions/create-payment-link/index.ts`

**Purpose:** Create Razorpay payment link for an invoice

**Request:**
```json
{
  "invoice_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "payment_link_id": "uuid",
  "invoice_id": "uuid",
  "invoice_number": "YG-202512-0042",
  "razorpay_link_id": "plink_xxx",
  "short_url": "https://rzp.io/i/abc123",
  "expires_at": "2025-12-31T23:59:59Z",
  "amount": 5000.00,
  "currency": "INR"
}
```

**Logic:**
1. Fetch invoice details via `get_invoice_for_payment_link()`
2. Check if payment link already exists (skip if active)
3. Convert amount to paise (× 100)
4. Call Razorpay Payment Links API
5. Store response via `store_payment_link()`
6. Return success with short_url

**Razorpay API Integration:**
```typescript
POST https://api.razorpay.com/v1/payment_links
Authorization: Basic base64(key_id:key_secret)

{
  "amount": 500000,  // in paise
  "currency": "INR",
  "description": "Invoice YG-202512-0042 - Jan 2025",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "+919876543210"
  },
  "notify": { "sms": false, "email": false },
  "reminder_enable": false,
  "callback_url": "https://xxx.supabase.co/functions/v1/payment-webhook",
  "reference_id": "invoice_uuid",
  "notes": {
    "invoice_id": "uuid",
    "invoice_number": "YG-202512-0042",
    "booking_ref": "BK-12345",
    "billing_month": "Jan 2025"
  }
}
```

**Environment Variables Required:**
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

#### B. `send-invoice-email`

**Path:** `supabase/functions/send-invoice-email/index.ts`

**Purpose:** Send invoice email with PDF and payment link

**Request:**
```json
{
  "invoice_id": "uuid",
  "payment_link_id": "uuid"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "invoice_id": "uuid",
  "invoice_number": "YG-202512-0042",
  "recipient": "john@example.com",
  "payment_link_included": true,
  "email_log_id": "uuid",
  "message": "Email sent successfully"
}
```

**Logic:**
1. Fetch invoice details
2. Fetch payment link (if payment_link_id provided)
3. Generate invoice PDF (TODO: integrate TransactionManagement.tsx logic)
4. Fetch business_settings for email template
5. Send email via email service (SendGrid/Resend/etc.)
6. Log delivery via `log_invoice_email()`

**Current Status:** 🚧 PDF generation pending (placeholder text email)

**Integration Point:** Copy `generateInvoicePdfBase64()` from [src/features/dashboard/components/Modules/TransactionManagement.tsx](src/features/dashboard/components/Modules/TransactionManagement.tsx#L652) to generate PDF in edge function.

---

## 🔄 Complete Payment Link Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTOMATIC FLOW (New Invoice Created)                           │
└─────────────────────────────────────────────────────────────────┘

1. Invoice Created (Module 2)
   - Status: 'pending'
   - Appears in invoices_needing_payment_links_v
   ↓
2. Edge Function: create-payment-link
   - Manual call: POST /functions/v1/create-payment-link
   - Or scheduled job checks invoices_needing_payment_links_v
   ↓
3. Razorpay API Call
   - Create payment link
   - Get short_url (e.g., https://rzp.io/i/abc123)
   - Expiry: 30 days default
   ↓
4. Store Payment Link
   - INSERT into payment_links table
   - status = 'active'
   - razorpay_response (full API response)
   ↓
5. Send Invoice Email
   - Edge Function: send-invoice-email
   - Generate PDF with invoice details
   - Include payment link in email body
   - Log in invoice_emails table
   ↓
6. Customer Receives Email
   - PDF attachment: Invoice_YG-202512-0042.pdf
   - "Pay Now" button with short_url
   - Payment handled in Module 4

┌─────────────────────────────────────────────────────────────────┐
│ EXPIRY MANAGEMENT                                               │
└─────────────────────────────────────────────────────────────────┘

1. Daily Cron Job (midnight UTC)
   - Call: expire_payment_links()
   - Updates: status = 'expired' WHERE expires_at < NOW()
   ↓
2. Expired Links Dashboard
   - active_payment_links_v shows expiry_status
   - Admin can regenerate links for expired invoices
   ↓
3. Regenerate Payment Link
   - Call create-payment-link again
   - Updates existing row (UNIQUE constraint on invoice_id)
   - New short_url generated
```

---

## 🧪 Testing Checklist

### Pre-Deployment Tests

```sql
-- 1. Check functions exist (expect 6 rows)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'store_payment_link',
      'get_invoice_for_payment_link',
      'expire_payment_links',
      'cancel_payment_link',
      'get_payment_link_status',
      'log_invoice_email'
  )
ORDER BY routine_name;

-- 2. Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'invoice_emails';

-- 3. Check views exist (expect 2 rows)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('invoices_needing_payment_links_v', 'active_payment_links_v');

-- 4. Test invoice data fetch (replace with real invoice_id)
SELECT public.get_invoice_for_payment_link('<invoice_uuid>');

-- 5. Check invoices needing links
SELECT * FROM public.invoices_needing_payment_links_v;
```

### Post-Deployment Tests

```bash
# 1. Set Razorpay credentials in Supabase Dashboard
# Settings → Edge Functions → Secrets
# - RAZORPAY_KEY_ID = rzp_test_xxxxx (use test keys first)
# - RAZORPAY_KEY_SECRET = xxxxx

# 2. Test create-payment-link (use real invoice_id from database)
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-payment-link \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "<invoice_uuid>"}'

# Expected response:
# {
#   "success": true,
#   "payment_link_id": "uuid",
#   "razorpay_link_id": "plink_xxx",
#   "short_url": "https://rzp.io/i/abc123",
#   "expires_at": "2025-01-18T23:59:59Z"
# }

# 3. Verify payment link stored
```

```sql
SELECT 
    pl.id,
    pl.razorpay_link_id,
    pl.short_url,
    pl.status,
    pl.expires_at,
    i.invoice_number
FROM payment_links pl
JOIN invoices i ON i.id = pl.invoice_id
ORDER BY pl.created_at DESC
LIMIT 5;
```

```bash
# 4. Test send-invoice-email
curl -X POST https://<project-ref>.supabase.co/functions/v1/send-invoice-email \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "<invoice_uuid>",
    "payment_link_id": "<payment_link_uuid>"
  }'

# 5. Check email log
```

```sql
SELECT * FROM invoice_emails
ORDER BY sent_at DESC
LIMIT 5;
```

---

## 🔐 Security Considerations

### 1. Razorpay Authentication
- Uses HTTP Basic Auth with key_id:key_secret
- Store credentials in Supabase Secrets (not in code)
- Use **test keys** in development: `rzp_test_xxxxx`
- Use **live keys** in production: `rzp_live_xxxxx`

### 2. Payment Link Security
- Razorpay generates unique `plink_xxx` IDs (non-guessable)
- Short URLs (`https://rzp.io/i/abc123`) are public but time-limited
- `reference_id` links payment to invoice (used in webhook verification)
- `notes` field contains metadata (invoice_id, booking_ref)

### 3. RLS Policies
- `payment_links` table: Inherited from Module 0 (users see only their own)
- `invoice_emails` table: Users see only emails for their own invoices
- Service role functions bypass RLS (for admin operations)

### 4. Idempotency
- `store_payment_link()` handles duplicate calls (UPDATE if exists)
- Unique constraint on `payment_links.invoice_id` prevents duplicates
- Safe to retry API calls without creating multiple links

---

## 📋 Deployment Steps

### 1. Push Database Migration
```bash
cd "d:\New folder\tryfix - Copy"
supabase db push
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy create-payment-link
supabase functions deploy send-invoice-email
```

### 3. Set Environment Variables (Supabase Dashboard)

**Navigate to:** Settings → Edge Functions → Secrets

Add the following secrets:

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` | Test key (development) |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxxxxxxx` | Test secret |
| `SUPABASE_URL` | Auto-populated | Already exists |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-populated | Already exists |

**For Production:**
- Replace `rzp_test_xxxxx` with `rzp_live_xxxxx`
- Get live keys from: Razorpay Dashboard → Settings → API Keys

### 4. Optional: Configure Daily Expiry Cron Job

```sql
-- Run in Supabase SQL Editor
SELECT cron.schedule(
    'expire-payment-links',
    '0 0 * * *', -- Daily at midnight UTC
    $$
    SELECT public.expire_payment_links();
    $$
);
```

**Alternative:** Create edge function wrapper and use pg_net

### 5. Optional: Auto-create Payment Links for New Invoices

**Option A:** Database Trigger (after invoice INSERT)

```sql
CREATE OR REPLACE FUNCTION trigger_create_payment_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only for pending invoices
    IF NEW.status = 'pending' THEN
        -- Call edge function asynchronously via pg_net
        PERFORM net.http_post(
            url := current_setting('app.settings.supabase_url') || '/functions/v1/create-payment-link',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
            ),
            body := jsonb_build_object('invoice_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER invoices_create_payment_link_trigger
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_payment_link();
```

**Option B:** Scheduled Job (check every hour)

Create edge function that queries `invoices_needing_payment_links_v` and creates links in batch.

---

## 🔍 Verification Queries

```sql
-- 1. Check all Module 3 functions (expect 6 rows)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%payment_link%'
   OR routine_name LIKE '%invoice_email%'
ORDER BY routine_name;

-- 2. Check invoice_emails table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoice_emails'
ORDER BY ordinal_position;

-- 3. View invoices needing payment links
SELECT 
    invoice_number,
    customer_name,
    customer_email,
    total_amount,
    due_date,
    ROUND(hours_since_created::numeric, 1) AS hours_old
FROM invoices_needing_payment_links_v
ORDER BY invoice_created_at ASC;

-- 4. View active payment links with expiry
SELECT 
    invoice_number,
    customer_name,
    short_url,
    expiry_status,
    ROUND(hours_until_expiry::numeric, 1) AS hours_left
FROM active_payment_links_v
ORDER BY expires_at ASC;

-- 5. Payment link statistics
SELECT 
    status,
    COUNT(*) AS count,
    MIN(created_at) AS oldest,
    MAX(created_at) AS newest
FROM payment_links
GROUP BY status
ORDER BY status;

-- 6. Email delivery statistics
SELECT 
    email_type,
    email_status,
    COUNT(*) AS count
FROM invoice_emails
GROUP BY email_type, email_status
ORDER BY email_type, email_status;
```

---

## 🐛 Troubleshooting

### Issue: Payment link creation fails with 401 Unauthorized

**Check:**
1. Are Razorpay credentials configured? `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
2. Are you using the correct key format? `rzp_test_xxxxx` or `rzp_live_xxxxx`
3. Check Razorpay Dashboard → API Keys → ensure keys are active

**Fix:**
```bash
# Re-deploy with correct secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=xxxxx
supabase functions deploy create-payment-link
```

---

### Issue: Payment link already exists error

**Check:**
```sql
SELECT * FROM payment_links WHERE invoice_id = '<invoice_uuid>';
```

**Fix:**
- This is expected behavior (one link per invoice)
- To regenerate: Call `cancel_payment_link()` first, then create new link
- Or let `store_payment_link()` UPDATE existing (automatic)

---

### Issue: Email not sending

**Check:**
1. Is email service configured? (SendGrid, Resend, etc.)
2. Check edge function logs in Supabase Dashboard
3. Verify invoice_emails table for error logs

**Current Status:**
- Email function is **placeholder** (logs email content only)
- Full implementation requires:
  * Email service API integration
  * PDF generation port from TransactionManagement.tsx
  * HTML email template

---

### Issue: Link expired immediately

**Check:**
```sql
SELECT razorpay_link_id, expires_at, status
FROM payment_links
WHERE invoice_id = '<invoice_uuid>';
```

**Fix:**
- Razorpay default expiry: 30 days
- If expired, call `create-payment-link` again to regenerate

---

## 📊 Razorpay Dashboard Monitoring

### View Created Payment Links
1. Login: https://dashboard.razorpay.com
2. Navigate: **Payment Links** section
3. Filter by status: Active / Expired / Paid
4. Search by: invoice_number (in notes field)

### Webhook Setup (Module 4)
Payment Links API sends webhooks for:
- `payment_link.paid` - customer completed payment
- `payment_link.expired` - link expired without payment
- `payment_link.cancelled` - admin cancelled link

**Webhook URL:** `https://<project-ref>.supabase.co/functions/v1/payment-webhook`

*(Webhook handling implemented in Module 4)*

---

## 📌 Next Steps (Module 4)

After Module 3 is verified:
1. **Module 4: Payment Reconciliation**
   - Webhook endpoint with HMAC signature verification
   - Idempotent payment event logging
   - Invoice status updates (pending → paid)
   - Transaction record creation
   - Handle refunds and failed payments

**Integration Point:** Module 4 will listen for Razorpay webhooks and update invoice/booking status based on payment events.

---

## 📝 Summary

**Module 3 Completed:**
✅ 6 database functions (store, fetch, expire, cancel, status, log)  
✅ 1 table (invoice_emails audit log)  
✅ 2 views (pending invoices, active links)  
✅ 2 edge functions (create-payment-link, send-invoice-email)  
✅ Razorpay Payment Links API integration  
✅ Payment link expiry management  
✅ Email delivery logging  

**Boundary Respected:**
❌ No payment processing (Module 4)  
❌ No webhook handling (Module 4)  
❌ No access status updates (Module 5)  
❌ No reminder scheduling (Module 5)  

**Pending Implementation:**
🚧 PDF generation in send-invoice-email (port from TransactionManagement.tsx)  
🚧 Email service integration (SendGrid/Resend)  
🚧 HTML email template  

Ready to proceed to **Module 4: Payment Reconciliation** after verification.
