# 📄 Invoice Generation Workflow

## Overview
Complete guide to invoice generation in the Yogique system, covering both **manual first-cycle** and **automated T-5** workflows.

---

## 🔄 Complete Workflow

### **Scenario: User joins on January 18, 2026**

```
┌─────────────────────────────────────────────────────────────────┐
│ TIMELINE                                                         │
├─────────────────────────────────────────────────────────────────┤
│ Jan 18: User joins (billing_cycle_anchor set to Jan 18)        │
│ Jan 18-31: Admin creates manual classes for remainder of Jan    │
│ Jan 18-31: Admin generates FIRST invoice manually              │
│                                                                  │
│ Jan 26: T-5 automation runs (5 days before Feb 1)              │
│   ├─ Generates Feb 1-28 classes automatically                  │
│   ├─ Reuses or creates containers                              │
│   └─ Generates Feb invoice automatically                       │
│                                                                  │
│ Feb 23: T-5 automation runs (5 days before Mar 1)              │
│   ├─ Generates Mar 1-31 classes automatically                  │
│   ├─ Reuses existing containers                                │
│   └─ Generates Mar invoice automatically                       │
│                                                                  │
│ ... continues monthly ...                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Invoice Generation Methods

### **1. Manual Invoice Generation (First Cycle)**

**Use Case:** Admin creates first month's classes manually and needs to generate the initial invoice.

**UI Location:** Class Assignment Manager → Header → "Generate Invoices" Button (Purple)

**Process:**
1. Admin clicks "Generate Invoices" button
2. Modal appears with month picker
3. Admin selects billing month (e.g., "2026-01")
4. System calls `generate_monthly_invoices` RPC function
5. Generates invoices for ALL active bookings for that month

**RPC Function:**
```sql
generate_monthly_invoices(p_target_month date DEFAULT NULL)
```

**Parameters:**
- `p_target_month`: Optional. Defaults to NEXT month if not provided

**Returns:**
```json
{
  "created_count": 5,
  "skipped_count": 2,
  "error_count": 0,
  "target_month": "2026-02-01",
  "errors": []
}
```

**Code Reference:**
- [ClassAssignmentManager.tsx](../src/features/dashboard/components/Modules/ClassAssignmentManager/ClassAssignmentManager.tsx#L1066-L1140) - Modal implementation
- Modal calls: `supabase.rpc('generate_monthly_invoices', { p_calendar_month: calendarMonth })`

---

### **2. Automated T-5 Invoice Generation**

**Use Case:** Automatic monthly invoice + class generation 5 days before billing cycle.

**Schedule:** Daily cron at 1 AM UTC

**Trigger:** When `current_date = billing_cycle_anchor_day - 5`

**Example:**
- Billing anchor: 1st of month
- T-5 date: 26th of previous month
- Generates: Next month's classes + invoice

**Edge Function:** `generate-t5-invoices`
- **Path:** [supabase/functions/generate-t5-invoices/index.ts](../supabase/functions/generate-t5-invoices/index.ts)
- **Calls:** `generate_t5_invoices()` RPC function

**RPC Function:**
```sql
generate_t5_invoices(p_booking_id uuid DEFAULT NULL, p_dry_run boolean DEFAULT false)
```

**Parameters:**
- `p_booking_id`: Optional. Process specific booking only (for testing)
- `p_dry_run`: If true, simulates without creating records

**Returns:**
```json
{
  "total_checked": 50,
  "total_generated": 12,
  "total_skipped": 38,
  "total_errors": 0,
  "execution_date": "2026-01-26",
  "results": [
    {
      "booking_id": "ABC123",
      "status": "generated",
      "invoice_id": "uuid",
      "invoice_number": "YG-202602-0042",
      "classes_generated": 8,
      "container_id": "uuid",
      "container_code": "ABC123-2026-02"
    }
  ]
}
```

---

## 🔧 Container Code Patterns

### **Individual Classes**
**Pattern:** `{bookingId}-{YYYY-MM}`

**Example:** `ABC123-2026-02`

**Properties:**
- `container_type`: `individual`
- `max_booking_count`: `1`
- Single user per container

### **Group Classes**
**Pattern:** `{instructorId}-{packageId}-{YYYY-MM}`

**Example:** `a1b2c3d4-e5f6g7h8-2026-02`

**Properties:**
- `container_type`: `public_group`, `private_group`, or `crash_course`
- `max_booking_count`: `10` (or custom)
- Multiple users share same container

**Why Different Patterns?**
- Individual: Each booking has unique container, so bookingId works
- Groups: Multiple bookings share one container, so use instructor+package as stable identifier

---

## 📊 Database Schema

### **Invoices Table**
```sql
invoices (
  id uuid PRIMARY KEY,
  invoice_number text UNIQUE,
  booking_id uuid REFERENCES bookings(id),
  user_id uuid REFERENCES users(id),
  billing_month text,
  billing_period_start date,
  billing_period_end date,
  base_amount numeric,
  tax_rate numeric,
  tax_amount numeric,
  total_amount numeric,
  due_date date,
  status text CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  proration_note text,
  currency text DEFAULT 'INR',
  created_at timestamptz,
  updated_at timestamptz
)
```

### **Class Containers Table**
```sql
class_containers (
  id uuid PRIMARY KEY,
  container_code text UNIQUE,
  display_name text,
  container_type text CHECK (container_type IN ('individual', 'public_group', 'private_group', 'crash_course')),
  instructor_id uuid,
  package_id uuid,
  max_booking_count integer,
  current_booking_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  CONSTRAINT individual_capacity CHECK (
    container_type != 'individual' OR max_booking_count = 1
  )
)
```

### **Class Assignments Table**
```sql
class_assignments (
  id uuid PRIMARY KEY,
  assignment_code text UNIQUE,
  class_container_id uuid REFERENCES class_containers(id),
  booking_id uuid REFERENCES bookings(id),
  user_id uuid REFERENCES users(id),
  instructor_id uuid,
  package_id uuid,
  class_date date,
  start_time time,
  end_time time,
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at timestamptz,
  updated_at timestamptz
)
```

---

## 🔄 Container Reuse Logic

### **T-5 Automation Flow**

```
FOR each active booking:
  1. Calculate target month (NEXT month from billing anchor)
  
  2. Check if invoice exists for target month
     └─ If yes: SKIP (prevent duplicates)
  
  3. Generate invoice for target month
  
  4. Generate container code:
     ├─ Individual: {bookingId}-{YYYY-MM}
     └─ Group: {instructorId}-{packageId}-{YYYY-MM}
  
  5. Check if container exists:
     ├─ EXISTS: Reuse existing container_id ✅
     └─ NEW: Create new container
  
  6. Generate monthly classes:
     └─ Loop through preferred_days in target month
        └─ Create assignment with class_container_id
```

**Key Points:**
- Container codes are **deterministic** (same inputs = same code)
- Lookup before insert ensures reuse
- Groups naturally share containers through instructor+package pattern

---

## 🧪 Testing Invoice Generation

### **Manual Invoice (First Cycle)**

```typescript
// In browser console or admin panel
const result = await supabase.rpc('generate_monthly_invoices', {
  p_target_month: '2026-01-01'
})

console.log('Generated:', result.data.created_count)
console.log('Skipped:', result.data.skipped_count)
```

### **T-5 Automation (Specific Booking)**

```sql
-- Test specific booking
SELECT generate_t5_invoices(
  p_booking_id := 'uuid-of-booking',
  p_dry_run := true  -- Simulate without creating
);

-- Test all bookings (dry run)
SELECT generate_t5_invoices();

-- Generate for all (production)
SELECT generate_t5_invoices(NULL, false);
```

### **Container Reuse Verification**

```sql
-- Check container reuse
SELECT 
  cc.container_code,
  cc.container_type,
  cc.current_booking_count,
  cc.max_booking_count,
  COUNT(DISTINCT ca.booking_id) AS actual_bookings,
  COUNT(ca.id) AS total_classes
FROM class_containers cc
LEFT JOIN class_assignments ca ON ca.class_container_id = cc.id
GROUP BY cc.id, cc.container_code, cc.container_type, cc.current_booking_count, cc.max_booking_count
ORDER BY cc.created_at DESC;
```

---

## 📈 Production Setup

### **Cron Schedule**

Edit [supabase/config.toml](../supabase/config.toml):

```toml
[edge_runtime.functions.generate-t5-invoices]
schedule = "0 1 * * *"  # Daily at 1 AM UTC
```

### **Environment Variables**

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-random-secret-for-cron-auth
```

### **Deployment**

```bash
# Deploy T-5 function
cd supabase/deploy
supabase db execute < generate_t5_invoices.sql

# Deploy edge function
supabase functions deploy generate-t5-invoices

# Verify cron schedule
supabase functions list
```

---

## 🚨 Error Handling

### **Invoice Duplicates**
- System checks: `invoices WHERE booking_id = X AND billing_period_start = Y`
- Skips if exists

### **Container Conflicts**
- Deterministic codes prevent duplicates
- Lookup before insert ensures reuse

### **Missing Data**
- Skips bookings missing: `billing_cycle_anchor`, `class_package_id`, `preferred_days`
- Logs warnings in function output

---

## 📚 Code References

### **Client-Side**
- [ClassAssignmentManager.tsx](../src/features/dashboard/components/Modules/ClassAssignmentManager/ClassAssignmentManager.tsx#L1066-L1140) - Manual invoice modal
- [assignmentCreation.ts](../src/features/dashboard/components/Modules/ClassAssignmentManager/services/assignmentCreation.ts#L730,L1120) - Container code generation

### **Database**
- [generate_t5_invoices.sql](../supabase/deploy/generate_t5_invoices.sql) - T-5 automation RPC
- [20251219130000_module_2_invoice_generation.sql](../archived-sql/supabase/migrations/20251219130000_module_2_invoice_generation.sql#L287-L447) - Monthly invoice RPC

### **Edge Functions**
- [generate-t5-invoices/index.ts](../supabase/functions/generate-t5-invoices/index.ts) - T-5 edge function
- [generate-monthly-invoices/index.ts](../supabase/functions/generate-monthly-invoices/index.ts) - Manual generation edge function

---

## ✅ Checklist: Production Ready

- [ ] `generate_t5_invoices` RPC deployed
- [ ] `generate_monthly_invoices` RPC deployed
- [ ] Edge function `generate-t5-invoices` deployed
- [ ] Cron schedule configured (daily 1 AM UTC)
- [ ] Environment variables set
- [ ] Container code patterns match (client + server)
- [ ] Manual invoice button tested
- [ ] T-5 automation tested (dry run)
- [ ] Container reuse verified
- [ ] Duplicate prevention tested

---

## 📞 Support

For issues or questions:
1. Check function logs: `supabase functions logs generate-t5-invoices`
2. Verify RPC exists: `SELECT proname FROM pg_proc WHERE proname LIKE '%invoice%';`
3. Test dry run: `SELECT generate_t5_invoices(NULL, true);`
4. Review container codes: Check pattern consistency across client/server

---

**Last Updated:** January 8, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
