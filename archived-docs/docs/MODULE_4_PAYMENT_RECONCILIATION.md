# 💰 MODULE 4: Payment Reconciliation

## 🎯 Scope & Boundaries

**Owns:**
- Razorpay webhook event processing
- HMAC signature verification
- Idempotent payment event logging
- Invoice status updates (pending → paid → refunded)
- Transaction record creation
- Payment link status updates

**Does NOT:**
- Update booking access_status (Module 5)
- Send payment confirmation emails (future enhancement)
- Handle payment retries (handled by Razorpay)
- Process partial payments (full payment only)

---

## 📦 Deliverables

### 1. Database Objects

#### Functions

1. **`process_payment_event(...)`**
   - Purpose: Process Razorpay webhook events with idempotency
   - Parameters: event_id, event_type, payment_link_id, razorpay_payment_id, amount, currency, signature_verified, payload
   - Returns: JSON with success status and action taken
   - Security: SECURITY DEFINER, service_role only
   - Logic:
     * Check idempotency (event_id UNIQUE constraint)
     * Log event in payment_events table
     * Find invoice via payment_link_id
     * Verify signature
     * Handle event types: payment_link.paid, payment.captured, payment.failed, refund.created
     * Update invoice status
     * Create transaction record
     * Update payment_link status

2. **`verify_razorpay_signature(p_payload, p_signature, p_webhook_secret)`**
   - Purpose: Verify HMAC-SHA256 signature from Razorpay
   - Returns: boolean (true if valid)
   - Security: IMMUTABLE (pure function)
   - Logic: Compute HMAC-SHA256 and compare with provided signature

3. **`get_payment_history(p_invoice_id)`**
   - Purpose: Get complete payment history for an invoice
   - Returns: JSON with payment_events and transactions
   - Security: STABLE, authenticated users
   - Use Case: Admin dashboard, customer portal

#### Views

1. **`recent_payment_events_v`**
   - Purpose: Last 100 payment events for monitoring
   - Columns: event_id, event_type, amount, invoice_number, customer_name, minutes_ago
   - Use Case: Real-time webhook monitoring dashboard

2. **`failed_payments_v`**
   - Purpose: Failed payment attempts requiring follow-up
   - Columns: invoice_number, customer_name, customer_email, payment_link_url, hours_since_failure
   - Use Case: Customer support, retry campaigns

3. **`paid_invoices_v`**
   - Purpose: Successfully paid invoices with payment details
   - Columns: invoice_number, customer_name, total_amount, paid_at, razorpay_payment_id, hours_to_payment
   - Use Case: Revenue dashboard, reconciliation reports

---

### 2. Edge Function

**Path:** `supabase/functions/payment-webhook/index.ts`

**Purpose:** Receive and process Razorpay webhook events

**Endpoint:** `https://<project-ref>.supabase.co/functions/v1/payment-webhook`

**Method:** POST (webhook from Razorpay)

**Headers:**
- `x-razorpay-signature`: HMAC-SHA256 signature for verification

**Request Body (Example):**
```json
{
  "event": "payment_link.paid",
  "payload": {
    "payment_link": {
      "entity": {
        "id": "plink_xxx",
        "amount_paid": 500000,
        "currency": "INR"
      }
    },
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "amount": 500000,
        "status": "captured"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "evt_xxx",
  "event_type": "payment_link.paid",
  "result": {
    "success": true,
    "message": "Payment processed successfully",
    "invoice_id": "uuid",
    "invoice_number": "YG-202512-0042",
    "transaction_id": "uuid"
  }
}
```

**Logic Flow:**
1. Verify `x-razorpay-signature` header exists
2. Compute HMAC-SHA256 of raw body using `RAZORPAY_WEBHOOK_SECRET`
3. Compare signatures (reject if mismatch)
4. Parse webhook payload
5. Extract: event_id, event_type, payment_link_id, payment_id, amount
6. Call `process_payment_event()` function
7. Return 200 OK (always, to acknowledge receipt)

**Environment Variables Required:**
- `RAZORPAY_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔄 Payment Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ SUCCESSFUL PAYMENT FLOW                                         │
└─────────────────────────────────────────────────────────────────┘

1. Customer clicks payment link (Module 3)
   - Opens Razorpay payment page
   - Enters card details / UPI / NetBanking
   ↓
2. Razorpay processes payment
   - Captures payment
   - Generates event: payment_link.paid
   ↓
3. Razorpay sends webhook to our endpoint
   - POST https://<project>.supabase.co/functions/v1/payment-webhook
   - Header: x-razorpay-signature
   - Body: { event, payload }
   ↓
4. Edge Function: payment-webhook
   - Verify HMAC signature
   - Extract event details
   - Call process_payment_event()
   ↓
5. Database Function: process_payment_event()
   - Check idempotency (event_id unique)
   - Log in payment_events table
   - Find invoice via payment_link_id
   - Update invoice: status = 'paid', paid_at = NOW()
   - Update payment_link: status = 'paid'
   - Create transaction record (amount, razorpay_payment_id)
   ↓
6. Return 200 OK to Razorpay
   - Acknowledges receipt
   - Razorpay stops retrying

┌─────────────────────────────────────────────────────────────────┐
│ FAILED PAYMENT FLOW                                             │
└─────────────────────────────────────────────────────────────────┘

1. Customer attempts payment → fails
   - Insufficient funds, expired card, etc.
   ↓
2. Razorpay sends webhook: payment.failed
   ↓
3. Edge Function processes event
   - Verify signature
   - Log in payment_events table
   - Invoice status remains 'pending'
   - Payment link remains 'created' (can retry)
   ↓
4. Failed payment appears in failed_payments_v
   - Admin/support can follow up
   - Customer can retry using same payment link

┌─────────────────────────────────────────────────────────────────┐
│ REFUND FLOW                                                     │
└─────────────────────────────────────────────────────────────────┘

1. Admin initiates refund in Razorpay Dashboard
   ↓
2. Razorpay processes refund
   - Sends webhook: refund.created
   ↓
3. Edge Function processes event
   - Verify signature
   - Update invoice: status = 'refunded'
   - Create transaction: type = 'refund', amount = -5000.00
   ↓
4. Refund reflected in payment history
```

---

## 🔐 Security: HMAC Signature Verification

### Why Signature Verification?

Webhooks are HTTP POST requests from Razorpay to your server. Without verification, anyone could send fake payment events to your endpoint.

### How It Works

**Razorpay sends:**
```
Header: x-razorpay-signature: <hmac_sha256_hex>
Body: { "event": "payment_link.paid", ... }
```

**You compute:**
```typescript
const computedSignature = createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')

if (computedSignature === receivedSignature) {
  // Valid webhook from Razorpay
  processEvent()
} else {
  // Reject (potential attack)
  return 401 Unauthorized
}
```

**Database verification (alternative):**
```sql
SELECT public.verify_razorpay_signature(
  p_payload := '{"event":"payment_link.paid"}',
  p_signature := 'abc123...',
  p_webhook_secret := 'whsec_xxx'
);
-- Returns: true or false
```

---

## 🔁 Idempotency Handling

### Why Idempotency?

Razorpay may send the same webhook multiple times:
- Network retries (if we don't respond quickly)
- Razorpay's retry policy (if we return 5xx)
- Manual retries from Razorpay Dashboard

Without idempotency, the same payment could:
- Create multiple transaction records
- Mark invoice as paid multiple times
- Cause data inconsistencies

### How We Handle It

**1. Unique Constraint on event_id:**
```sql
CREATE TABLE payment_events (
    id uuid PRIMARY KEY,
    event_id text UNIQUE NOT NULL,  -- Razorpay's event ID
    ...
);
```

**2. Check Before Processing:**
```sql
IF EXISTS (SELECT 1 FROM payment_events WHERE event_id = p_event_id) THEN
    RETURN json_build_object('success', true, 'idempotent', true);
END IF;
```

**3. Handle Race Conditions:**
```sql
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', true, 'idempotent', true);
```

**Result:** Same webhook received 5 times → only processed once, always returns success.

---

## 🧪 Testing Checklist

### Pre-Deployment Tests

```sql
-- 1. Check functions exist (expect 3 rows)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'process_payment_event',
      'verify_razorpay_signature',
      'get_payment_history'
  )
ORDER BY routine_name;

-- 2. Check views exist (expect 3 rows)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'recent_payment_events_v',
      'failed_payments_v',
      'paid_invoices_v'
  );

-- 3. Test signature verification
SELECT public.verify_razorpay_signature(
    'test payload',
    encode(hmac('test payload'::bytea, 'test_secret'::bytea, 'sha256'), 'hex'),
    'test_secret'
);
-- Expected: true
```

### Post-Deployment Tests

**1. Test Webhook with Razorpay Test Mode**

Create a test payment link in Razorpay Dashboard (Test Mode), complete payment, observe webhook.

**2. Manual Webhook Test (using curl):**

First, compute signature:
```bash
# In bash/Linux:
echo -n '{"event":"payment_link.paid","payload":{"payment_link":{"entity":{"id":"plink_test123","amount_paid":100000}}}}' | \
  openssl dgst -sha256 -hmac "your_webhook_secret" -hex
```

Then send webhook:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: <computed_signature>" \
  -d '{
    "event": "payment_link.paid",
    "payload": {
      "payment_link": {
        "entity": {
          "id": "plink_test123",
          "amount_paid": 100000,
          "currency": "INR"
        }
      },
      "payment": {
        "entity": {
          "id": "pay_test123",
          "amount": 100000,
          "status": "captured"
        }
      }
    }
  }'
```

**3. Verify in Database:**

```sql
-- Check payment event logged
SELECT * FROM payment_events
ORDER BY processed_at DESC
LIMIT 5;

-- Check invoice marked as paid
SELECT invoice_number, status, paid_at
FROM invoices
WHERE status = 'paid'
ORDER BY paid_at DESC
LIMIT 5;

-- Check transaction created
SELECT * FROM transactions
ORDER BY created_at DESC
LIMIT 5;

-- View recent events
SELECT * FROM recent_payment_events_v
LIMIT 10;
```

**4. Test Idempotency (send same webhook twice):**

```bash
# Send same webhook 3 times with same event_id
# Should process once, return success 3 times
```

```sql
-- Should see only 1 event in payment_events
SELECT COUNT(*) FROM payment_events WHERE event_id = 'test_event_123';
-- Expected: 1
```

---

## 📋 Deployment Steps

### 1. Push Database Migration
```bash
cd "d:\New folder\tryfix - Copy"
supabase db push
```

### 2. Deploy Edge Function
```bash
supabase functions deploy payment-webhook
```

### 3. Set Webhook Secret (Supabase Dashboard)

**Navigate to:** Settings → Edge Functions → Secrets

Add secret:
- `RAZORPAY_WEBHOOK_SECRET` = Get from Razorpay Dashboard → Settings → Webhooks → Generate

**How to get webhook secret from Razorpay:**
1. Login: https://dashboard.razorpay.com
2. Go to: Settings → Webhooks
3. Click "Create Webhook" (or edit existing)
4. URL: `https://<project-ref>.supabase.co/functions/v1/payment-webhook`
5. Events: Select `payment_link.paid`, `payment.failed`, `refund.created`
6. Copy the generated **Webhook Secret** (starts with `whsec_`)
7. Paste in Supabase Secrets as `RAZORPAY_WEBHOOK_SECRET`

### 4. Configure Webhook in Razorpay Dashboard

**Settings → Webhooks:**
- URL: `https://<project-ref>.supabase.co/functions/v1/payment-webhook`
- Active Events:
  * ✅ payment_link.paid
  * ✅ payment.captured
  * ✅ payment.failed
  * ✅ refund.created
  * ✅ refund.processed
- Secret: Auto-generated (copy to Supabase Secrets)

---

## 🔍 Verification Queries

```sql
-- 1. Check Module 4 functions (expect 3 rows)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'process_payment_event',
      'verify_razorpay_signature',
      'get_payment_history'
  )
ORDER BY routine_name;

-- 2. Check Module 4 views (expect 3 rows)
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'recent_payment_events_v',
      'failed_payments_v',
      'paid_invoices_v'
  )
ORDER BY table_name;

-- 3. Payment event statistics
SELECT 
    event_type,
    signature_verified,
    COUNT(*) AS count
FROM payment_events
GROUP BY event_type, signature_verified
ORDER BY count DESC;

-- 4. Invoice status breakdown
SELECT 
    status,
    COUNT(*) AS count,
    SUM(total_amount) AS total_amount
FROM invoices
GROUP BY status
ORDER BY count DESC;

-- 5. Recent payment activity
SELECT * FROM recent_payment_events_v
LIMIT 20;

-- 6. Failed payments requiring follow-up
SELECT 
    invoice_number,
    customer_name,
    customer_email,
    ROUND(hours_since_failure, 1) AS hours_ago
FROM failed_payments_v
WHERE hours_since_failure < 24
ORDER BY hours_since_failure DESC;
```

---

## 🐛 Troubleshooting

### Issue: Webhook returns 401 Unauthorized

**Check:**
1. Is signature verification passing?
2. Is `RAZORPAY_WEBHOOK_SECRET` configured correctly?
3. Are you using the same secret from Razorpay Dashboard?

**Debug:**
```typescript
// Add logging in payment-webhook/index.ts
console.log('Raw body:', rawBody)
console.log('Received signature:', signature)
console.log('Computed signature:', computedSignature)
console.log('Match:', computedSignature === signature)
```

**Fix:**
- Regenerate webhook secret in Razorpay Dashboard
- Update `RAZORPAY_WEBHOOK_SECRET` in Supabase
- Redeploy edge function

---

### Issue: Invoice not updating to 'paid'

**Check:**
```sql
-- Was event logged?
SELECT * FROM payment_events WHERE event_id = '<event_id>';

-- Was signature verified?
SELECT signature_verified FROM payment_events WHERE event_id = '<event_id>';

-- What was the result?
SELECT payload->'result' FROM payment_events WHERE event_id = '<event_id>';
```

**Common Causes:**
1. Signature verification failed → event logged but not processed
2. Payment link not found → check `razorpay_link_id` matches
3. Invoice already paid → idempotency check prevents duplicate processing

---

### Issue: Duplicate transactions created

**Check:**
```sql
-- Count transactions per invoice
SELECT invoice_id, COUNT(*) AS transaction_count
FROM transactions
GROUP BY invoice_id
HAVING COUNT(*) > 1;
```

**Should Not Happen** if event_id is unique. If it does:
- Check if multiple webhooks had different event_ids
- Verify idempotency logic in `process_payment_event()`

---

### Issue: Razorpay shows webhook as "Failed"

**Check:**
- Did we return 200 OK?
- Check edge function logs in Supabase Dashboard
- Check execution time (must respond < 10 seconds)

**Fix:**
- Edge function always returns 200 (even for errors)
- If processing takes too long, move to background job

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **Webhook Success Rate**
```sql
SELECT 
    DATE_TRUNC('hour', processed_at) AS hour,
    COUNT(*) AS total_webhooks,
    SUM(CASE WHEN signature_verified THEN 1 ELSE 0 END) AS verified,
    ROUND(100.0 * SUM(CASE WHEN signature_verified THEN 1 ELSE 0 END) / COUNT(*), 2) AS verification_rate
FROM payment_events
WHERE processed_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

2. **Payment Success Rate**
```sql
SELECT 
    COUNT(CASE WHEN event_type = 'payment_link.paid' THEN 1 END) AS successful,
    COUNT(CASE WHEN event_type = 'payment.failed' THEN 1 END) AS failed,
    ROUND(100.0 * COUNT(CASE WHEN event_type = 'payment_link.paid' THEN 1 END) / 
          NULLIF(COUNT(*), 0), 2) AS success_rate
FROM payment_events
WHERE processed_at > NOW() - INTERVAL '7 days';
```

3. **Revenue Dashboard**
```sql
SELECT 
    DATE(paid_at) AS date,
    COUNT(*) AS invoices_paid,
    SUM(total_amount) AS revenue
FROM paid_invoices_v
WHERE paid_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(paid_at)
ORDER BY date DESC;
```

---

## 📌 Next Steps (Module 5)

After Module 4 is verified:
1. **Module 5: Access Control & Escalation**
   - Daily cron to calculate days overdue
   - Transition booking.access_status (active → overdue_grace → overdue_locked)
   - Block scheduling for locked bookings
   - Send reminder emails (T-3, T-0, T+7)

**Integration Point:** Module 5 will monitor invoice status (from Module 4) and payment_events to determine when to lock access.

---

## 📝 Summary

**Module 4 Completed:**
✅ 3 database functions (process_payment_event, verify_razorpay_signature, get_payment_history)  
✅ 3 views (recent_payment_events_v, failed_payments_v, paid_invoices_v)  
✅ 1 edge function (payment-webhook with HMAC verification)  
✅ Idempotent event processing (event_id unique constraint)  
✅ Invoice status automation (pending → paid → refunded)  
✅ Transaction record creation  
✅ Payment link status updates  

**Boundary Respected:**
❌ No access_status updates (Module 5)  
❌ No confirmation emails (future enhancement)  
❌ No payment retries (handled by Razorpay)  

**Security Implemented:**
🔒 HMAC-SHA256 signature verification  
🔒 Service-role only functions  
🔒 Idempotency prevents duplicate processing  
🔒 Always return 200 to prevent retry storms  

Ready to proceed to **Module 5: Access Control & Escalation** after verification.
