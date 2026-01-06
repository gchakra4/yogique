# 🏗️ ENTERPRISE PLATFORM ARCHITECTURE PLAN
**Supabase + React PWA Evolution to Enterprise-Ready System**

**Project:** Yogique Platform  
**Date:** January 5, 2026  
**Status:** Planning Phase  
**Version:** 1.0

---

## 📋 EXECUTIVE SUMMARY

**Approach:** Schema-based domain separation within a single Supabase project  
**Risk Level:** Low (phased, backward-compatible)  
**Timeline:** 6 phases, each independently deployable  
**Core Philosophy:** Evolution, not revolution

---

## ✅ ARCHITECTURAL DECISIONS REVIEW

### What You Got Right

1. **Single Database Approach** ✓  
   - Avoids cross-database joins
   - Simplifies transactions
   - Unified backup/recovery
   - Easier RLS management

2. **Schema-Based Separation** ✓  
   - Clean domain boundaries
   - Prevents naming collisions
   - Easy to reason about
   - Future-proof

3. **Phased Rollout** ✓  
   - Each phase is independently valuable
   - Clear rollback points
   - Progressive risk management

4. **Backward Compatibility Focus** ✓  
   - Production-first mindset
   - No breaking changes
   - Nullable foreign keys initially

### 🔧 SUGGESTED MODIFICATIONS

I recommend **4 key improvements** to your plan:

#### 1. **Add `shared` Schema** (NEW)
**Why:** Eliminate duplication between domains

```
shared schema contains:
- shared.users (unified user identity)
- shared.addresses (reusable)
- shared.contacts (polymorphic)
- shared.settings (global configs)
- shared.notifications_queue (existing, move here)
```

**Benefit:** Consumer and corporate bookings both reference the same user/notification infrastructure.

#### 2. **Rename `enterprise` → `corporate`** (CLARITY)
**Why:** More intuitive naming

- `enterprise` sounds like admin/platform internals
- `corporate` clearly signals B2B domain
- Avoids confusion with future "enterprise features" for consumers

**Recommended schemas:**
```
public       → consumer bookings (existing)
corporate    → B2B domain (companies, corporate_bookings)
billing      → invoices, payments (universal)
audit        → compliance logs
shared       → cross-domain entities
```

#### 3. **Add `integrations` Schema** (FUTURE-PROOF)
**Why:** External system connections will grow

```
integrations.zoom_meetings
integrations.payment_gateways
integrations.accounting_sync
integrations.crm_connections
```

**Benefit:** Keeps integration state separate from core business logic; easy to deprecate/replace providers.

#### 4. **Split Audit into Two Concerns** (GOVERNANCE)

**Current plan:** Single `audit` schema  
**Recommended:**

```
audit schema → business audit (who booked, who approved)
compliance schema → GDPR, data access logs, PII tracking
```

**Why:**
- Different retention policies (audit = 7 years, compliance = varies by jurisdiction)
- Different access patterns (compliance is write-heavy, rarely read)
- Regulatory separation

---

## 🎯 REVISED SCHEMA ARCHITECTURE

### Final Schema Layout

| Schema | Purpose | Key Tables | Access |
|--------|---------|------------|--------|
| `public` | Consumer platform (existing) | bookings, class_packages, instructors, assignments | All users |
| `corporate` | B2B domain | companies, corporate_bookings, participants, approvals | Corporate admins |
| `billing` | Universal finance | invoices, payments, purchase_orders, pricing_rules | Finance + admins |
| `shared` | Cross-domain resources | users, notifications_queue, addresses, contacts | All domains |
| `audit` | Business audit trail | action_logs, approval_history, booking_changes | Auditors |
| `compliance` | Regulatory compliance | gdpr_logs, data_access, consent_records | Compliance officers |
| `integrations` | External systems | zoom_meetings, payment_providers, accounting_sync | System only |

---

## 🗺️ ENTITY RELATIONSHIP MODEL (Conceptual)

### Core Domain Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         SHARED SCHEMA                        │
│  ┌──────────────┐      ┌─────────────────┐                 │
│  │ shared.users │◄────►│ shared.contacts │                 │
│  └──────────────┘      └─────────────────┘                 │
│         ▲                                                    │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          │
   ┌──────┴──────┐
   │             │
   ▼             ▼
┌──────────┐  ┌─────────────────────┐
│ PUBLIC   │  │ CORPORATE SCHEMA    │
│ SCHEMA   │  │                     │
│          │  │ companies           │
│ bookings │  │   └─► company_contacts
│   │      │  │   └─► corporate_bookings
│   │      │  │         └─► participants
│   │      │  │         └─► approvals
│   │      │  └─────────────────────┘
│   │      │           │
│   ▼      │           ▼
│ (class_  │     ┌──────────────────┐
│  packages│     │ BILLING SCHEMA   │
│  etc)    │     │                  │
└──────────┘     │ invoices         │
          ▲      │   └─► payments   │
          │      │   └─► po_refs    │
          │      └──────────────────┘
          │               │
          └───────────────┘
                  │
                  ▼
           ┌─────────────┐
           │ AUDIT       │
           │ SCHEMA      │
           │             │
           │ audit_logs  │
           └─────────────┘
```

### Key Relationships

**Consumer Flow:**
```
shared.users → public.bookings → billing.invoices → billing.payments
```

**Corporate Flow:**
```
shared.users → corporate.companies → corporate.corporate_bookings 
             → corporate.participants → billing.invoices → billing.payments
```

**Unified Notifications:**
```
shared.notifications_queue ← (consumer + corporate producers)
```

---

## 📊 DETAILED SCHEMA DESIGN

### 1. **shared Schema** (NEW)

#### `shared.users`
```sql
Purpose: Single source of truth for user identity
Columns:
  - id (uuid, pk)
  - email (unique)
  - phone
  - first_name, last_name
  - role (consumer | corporate_admin | instructor | admin)
  - company_id (nullable, fk → corporate.companies)
  - created_at, updated_at
  - metadata (jsonb)

Notes:
  - Existing auth.users maps 1:1 via RLS
  - Single user can be both consumer AND corporate admin
```

#### `shared.notifications_queue`
```sql
Purpose: Universal notification pipeline
Columns:
  - id (uuid, pk)
  - channel (email | sms | whatsapp)
  - recipient
  - subject, html, attachments
  - metadata (jsonb) → includes domain context
  - status, attempts, last_error
  - run_after, created_at, updated_at

Notes:
  - MOVE from public schema (if exists there now)
  - Add metadata.domain field: 'consumer' | 'corporate'
```

#### `shared.addresses`
```sql
Purpose: Reusable address model
Columns:
  - id (uuid, pk)
  - addressable_type (companies | users)
  - addressable_id (uuid)
  - address_type (billing | shipping | office)
  - line1, line2, city, state, postal_code, country
  - is_primary (boolean)
```

---

### 2. **corporate Schema**

#### `corporate.companies`
```sql
Purpose: Organization master record
Columns:
  - id (uuid, pk)
  - name (text, not null)
  - legal_name (text)
  - domain (text, unique) → for SSO/auto-association
  - industry (text)
  - size_category (1-50 | 51-200 | 201-1000 | 1000+)
  - billing_terms (prepaid | net_15 | net_30 | net_60)
  - currency (text, default 'INR')
  - tax_id (text)
  - default_contact_id (uuid, nullable, fk)
  - billing_profile_id (uuid, fk → billing.billing_profiles)
  - status (active | suspended | archived)
  - metadata (jsonb) → custom fields, branding
  - created_at, updated_at

Indexes:
  - (domain)
  - (name)
  - (status)
```

#### `corporate.company_contacts`
```sql
Purpose: Multiple contacts per company
Columns:
  - id (uuid, pk)
  - company_id (fk → companies)
  - user_id (nullable, fk → shared.users)
  - name, email, phone
  - role (billing | coordinator | decision_maker | participant)
  - is_primary (boolean)
  - created_at, updated_at

Indexes:
  - (company_id, role)
  - (email)
```

#### `corporate.corporate_bookings`
```sql
Purpose: Corporate program bookings
Columns:
  - id (uuid, pk)
  - booking_id (text, unique) → YOG-YYYYMMDD-NNNN
  - company_id (fk → companies)
  - coordinator_id (fk → company_contacts)
  - user_id (fk → shared.users) → who created it
  
  -- Program details
  - class_package_id (nullable, fk → public.class_packages)
  - program_name (text)
  - program_type (wellness | fitness | stress_mgmt | custom)
  - session_frequency (weekly | biweekly | monthly)
  - program_duration_weeks (int)
  
  -- Logistics
  - delivery_mode (on_site | virtual | hybrid)
  - location_address_id (nullable, fk → shared.addresses)
  - preferred_days (text[])
  - preferred_times (text[])
  - start_date, end_date
  - timezone
  
  -- Participants
  - participants_count (int)
  - max_participants (int, nullable)
  
  -- Commercial
  - price_per_participant (numeric)
  - total_price (numeric)
  - currency (text)
  - po_number (text, nullable)
  - contract_reference (text, nullable)
  
  -- Workflow
  - status (draft | pending_approval | approved | active | completed | cancelled)
  - approval_required (boolean, default true)
  - approved_by (nullable, fk → shared.users)
  - approved_at (timestamptz)
  
  -- Metadata
  - goals (text)
  - special_requirements (text)
  - equipment_needed (boolean)
  - metadata (jsonb)
  
  - created_at, updated_at
  - cancelled_at, cancellation_reason

Indexes:
  - (company_id, status)
  - (booking_id)
  - (start_date)
```

#### `corporate.booking_participants`
```sql
Purpose: Individual participants in corporate programs
Columns:
  - id (uuid, pk)
  - corporate_booking_id (fk → corporate_bookings)
  - company_contact_id (nullable, fk → company_contacts)
  - name, email, phone
  - employee_id (text, nullable)
  - department (text, nullable)
  - status (invited | accepted | declined | attending | completed | dropped)
  - invitation_sent_at
  - accepted_at
  - attendance_count (int, default 0)
  - created_at, updated_at

Indexes:
  - (corporate_booking_id, status)
  - (email)
```

#### `corporate.approvals`
```sql
Purpose: Workflow approvals for bookings
Columns:
  - id (uuid, pk)
  - corporate_booking_id (fk → corporate_bookings)
  - requested_by (fk → shared.users)
  - approved_by (nullable, fk → shared.users)
  - status (pending | approved | rejected)
  - approval_level (1 | 2 | 3) → for multi-stage approvals
  - notes (text)
  - requested_at, responded_at
  - metadata (jsonb)

Indexes:
  - (corporate_booking_id, status)
  - (approved_by)
```

---

### 3. **billing Schema**

#### `billing.billing_profiles`
```sql
Purpose: Billing configuration per entity
Columns:
  - id (uuid, pk)
  - entity_type (user | company)
  - entity_id (uuid)
  - billing_email (text)
  - payment_terms (prepaid | net_15 | net_30 | net_60 | custom)
  - currency (text, default 'INR')
  - tax_rate (numeric)
  - auto_invoice (boolean, default false)
  - invoice_frequency (per_booking | monthly | quarterly)
  - preferred_payment_method (razorpay | stripe | bank_transfer | offline)
  - metadata (jsonb)
  - created_at, updated_at
```

#### `billing.invoices`
```sql
Purpose: Universal invoicing
Columns:
  - id (uuid, pk)
  - invoice_number (text, unique) → INV-YYYY-NNNNNN
  
  -- Entity references (polymorphic)
  - billing_profile_id (fk → billing_profiles)
  - booking_type (consumer | corporate)
  - booking_id (uuid) → references public.bookings OR corporate.corporate_bookings
  
  -- Invoice details
  - description (text)
  - line_items (jsonb) → [{name, qty, unit_price, total}]
  - subtotal (numeric)
  - tax (numeric)
  - total_amount (numeric)
  - currency (text)
  
  -- Dates
  - issue_date
  - due_date
  - billing_period_start, billing_period_end
  
  -- Status
  - status (draft | issued | paid | overdue | cancelled | refunded)
  - payment_status (unpaid | partial | paid | refunded)
  
  -- Documents
  - pdf_url (text)
  - po_number (text, nullable)
  
  - metadata (jsonb)
  - created_at, updated_at, paid_at

Indexes:
  - (invoice_number)
  - (billing_profile_id, status)
  - (due_date, status)
  - (booking_id, booking_type)
```

#### `billing.payments`
```sql
Purpose: Payment transactions
Columns:
  - id (uuid, pk)
  - invoice_id (fk → invoices)
  - payment_number (text, unique)
  - amount (numeric)
  - currency (text)
  - payment_method (razorpay | stripe | bank_transfer | cash | offline)
  - transaction_id (text, nullable) → external provider ID
  - payment_gateway (text, nullable)
  - status (pending | completed | failed | refunded)
  - reference_number (text, nullable)
  - notes (text)
  - paid_at
  - created_at, updated_at

Indexes:
  - (invoice_id)
  - (transaction_id)
  - (status)
```

#### `billing.purchase_orders`
```sql
Purpose: Track corporate POs
Columns:
  - id (uuid, pk)
  - company_id (fk → corporate.companies)
  - po_number (text, unique)
  - amount (numeric)
  - currency (text)
  - valid_from, valid_until
  - status (active | exhausted | expired | cancelled)
  - pdf_url (text, nullable)
  - created_at, updated_at
```

#### `billing.pricing_rules`
```sql
Purpose: Custom pricing for companies/programs
Columns:
  - id (uuid, pk)
  - rule_name (text)
  - entity_type (company | program | package)
  - entity_id (uuid, nullable)
  - discount_type (percentage | fixed_amount | custom_price)
  - discount_value (numeric)
  - valid_from, valid_until
  - priority (int) → for rule stacking
  - conditions (jsonb) → {min_participants, min_sessions, etc.}
  - created_at, updated_at
```

---

### 4. **audit Schema**

#### `audit.action_logs`
```sql
Purpose: Business action audit trail
Columns:
  - id (uuid, pk)
  - actor_id (fk → shared.users)
  - action_type (create | update | delete | approve | cancel | refund)
  - entity_type (booking | invoice | company | participant)
  - entity_id (uuid)
  - changes (jsonb) → before/after snapshot
  - ip_address (inet)
  - user_agent (text)
  - created_at
  - metadata (jsonb)

Indexes:
  - (entity_type, entity_id, created_at)
  - (actor_id, created_at)
  - (created_at) BRIN → time-series optimization
```

#### `audit.approval_history`
```sql
Purpose: Track approval workflows
Columns:
  - id (uuid, pk)
  - approval_id (fk → corporate.approvals)
  - actor_id (fk → shared.users)
  - action (requested | approved | rejected | escalated)
  - previous_status, new_status
  - notes (text)
  - created_at
```

#### `audit.financial_audit`
```sql
Purpose: Immutable financial transaction log
Columns:
  - id (uuid, pk)
  - transaction_type (invoice_created | payment_received | refund_issued)
  - invoice_id (nullable, fk → billing.invoices)
  - payment_id (nullable, fk → billing.payments)
  - amount (numeric)
  - currency (text)
  - actor_id (fk → shared.users)
  - created_at (immutable)
  - metadata (jsonb)

Notes:
  - INSERT ONLY table (no updates/deletes)
  - Retention: 10 years
```

---

### 5. **compliance Schema** (NEW)

#### `compliance.gdpr_logs`
```sql
Purpose: GDPR data access tracking
Columns:
  - id (uuid, pk)
  - user_id (fk → shared.users)
  - data_type (profile | booking | payment | email)
  - operation (read | export | delete | anonymize)
  - requested_by (fk → shared.users)
  - ip_address
  - created_at
  - retention_until (timestamptz) → auto-purge date
```

#### `compliance.consent_records`
```sql
Purpose: Track marketing/data consent
Columns:
  - id (uuid, pk)
  - user_id (fk → shared.users)
  - consent_type (marketing_email | sms | data_processing | third_party)
  - granted (boolean)
  - granted_at, revoked_at
  - ip_address
  - metadata (jsonb)
```

---

### 6. **integrations Schema** (NEW)

#### `integrations.zoom_meetings`
```sql
Purpose: Track Zoom session state
Columns:
  - id (uuid, pk)
  - booking_id (uuid) → polymorphic reference
  - booking_type (consumer | corporate)
  - meeting_id (text)
  - join_url, start_url
  - password
  - scheduled_start
  - status (scheduled | started | ended)
  - metadata (jsonb)
  - created_at, updated_at
```

#### `integrations.payment_gateways`
```sql
Purpose: Payment provider configuration
Columns:
  - id (uuid, pk)
  - provider (razorpay | stripe | phonepe)
  - environment (sandbox | production)
  - api_key_encrypted (text)
  - webhook_secret_encrypted (text)
  - is_active (boolean)
  - metadata (jsonb)
  - created_at, updated_at
```

---

## 🔐 ROW-LEVEL SECURITY (RLS) STRATEGY

### General Principles

1. **Default Deny** → All tables deny by default
2. **Explicit Grants** → Policies grant specific access
3. **Role-Based** → Use user role + company_id for filtering
4. **Audit Transparency** → All RLS bypasses logged

### Key Policies

#### Consumer Access (public schema)
```sql
-- Users see only their own bookings
CREATE POLICY "users_own_bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());
```

#### Corporate Access (corporate schema)
```sql
-- Company admins see their company's data
CREATE POLICY "company_admins_see_own_data" ON corporate.corporate_bookings
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM shared.users 
      WHERE id = auth.uid() AND role IN ('corporate_admin', 'admin')
    )
  );

-- Coordinators see bookings they coordinate
CREATE POLICY "coordinators_see_assigned" ON corporate.corporate_bookings
  FOR SELECT USING (
    coordinator_id IN (
      SELECT id FROM corporate.company_contacts 
      WHERE user_id = auth.uid()
    )
  );
```

#### Billing Access
```sql
-- Users see their own invoices
CREATE POLICY "users_see_own_invoices" ON billing.invoices
  FOR SELECT USING (
    billing_profile_id IN (
      SELECT id FROM billing.billing_profiles
      WHERE entity_id = auth.uid() AND entity_type = 'user'
    )
    OR
    billing_profile_id IN (
      SELECT bp.id FROM billing.billing_profiles bp
      JOIN shared.users u ON u.company_id = bp.entity_id
      WHERE u.id = auth.uid() AND bp.entity_type = 'company'
    )
  );
```

#### Audit Access
```sql
-- Only admins and auditors
CREATE POLICY "admin_audit_access" ON audit.action_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM shared.users WHERE role IN ('admin', 'auditor')
    )
  );
```

---

## ⚙️ EDGE FUNCTIONS ARCHITECTURE

### Organization

```
supabase/functions/
├── _shared/             → common utilities
│   ├── db.ts            → Supabase client helpers
│   ├── auth.ts          → auth middleware
│   ├── types.ts         → shared types
│   └── templates/       → email templates
│
├── corporate/
│   ├── create-company/
│   ├── manage-participants/
│   ├── approve-booking/
│   └── generate-participant-invites/
│
├── billing/
│   ├── generate-invoice-pdf/
│   ├── process-payment/
│   ├── send-invoice-email/
│   └── check-overdue-invoices/
│
├── notifications/
│   ├── notification-worker/        → existing
│   ├── enqueue-notification/       → existing
│   └── send-batch-emails/          → NEW for corporate
│
└── admin/
    ├── company-onboarding/
    └── generate-reports/
```

### Key New Functions

#### `corporate/create-company`
```
Purpose: Secure company creation API
Input: {name, domain, billing_contact}
Output: {company_id, billing_profile_id}
Auth: Admin only
Logic:
  1. Validate domain uniqueness
  2. Create company record
  3. Create billing_profile
  4. Create default contact
  5. Send welcome email
```

#### `billing/generate-invoice-pdf`
```
Purpose: Generate PDF invoices
Input: {invoice_id}
Output: {pdf_url}
Auth: Service role
Logic:
  1. Fetch invoice + line items
  2. Render HTML template
  3. Convert to PDF (puppeteer/gotenberg)
  4. Upload to Supabase Storage
  5. Update invoice.pdf_url
  6. Return URL
```

#### `corporate/generate-participant-invites`
```
Purpose: Send invites to all participants
Input: {corporate_booking_id}
Output: {sent_count, failed_count}
Auth: Coordinator or admin
Logic:
  1. Fetch all participants
  2. Generate personalized invite emails
  3. Enqueue to notifications_queue
  4. Update participant.invitation_sent_at
Idempotency: Check invitation_sent_at before re-sending
```

#### `notifications/send-batch-emails` (NEW)
```
Purpose: Handle large corporate batches
Input: {notification_ids[]}
Output: {success_count, failed_ids[]}
Auth: Service role
Logic:
  1. Batch into groups of 50
  2. Send via provider with rate limiting
  3. Update statuses atomically
  4. Retry failures with exponential backoff
```

---

## 🕐 CRON JOB DESIGN

### New Cron Jobs

#### Invoice Overdue Watcher
```yaml
Name: check-overdue-invoices
Schedule: "0 */6 * * *"  # Every 6 hours
Function: billing/check-overdue-invoices
Logic:
  - Query invoices WHERE due_date < NOW() AND status = 'issued'
  - For each:
    - Update status → 'overdue'
    - Enqueue reminder email
    - Log to audit
  - If overdue > 30 days → escalate to admin
```

#### Participant Invitation Reminders
```yaml
Name: send-participant-reminders
Schedule: "0 9 * * *"  # Daily 9 AM
Function: corporate/send-participant-reminders
Logic:
  - Find participants WHERE status = 'invited' AND invitation_sent_at < NOW() - 3 days
  - Enqueue reminder notification
  - Limit: max 1 reminder/week
```

#### Corporate Booking Status Sync
```yaml
Name: sync-corporate-booking-status
Schedule: "0 1 * * *"  # Daily 1 AM
Function: corporate/sync-booking-status
Logic:
  - Check bookings WHERE end_date < NOW() AND status = 'active'
  - Update status → 'completed'
  - Trigger completion workflow (surveys, invoices)
```

---

## ✉️ NOTIFICATION INTEGRATION

### Enhanced Metadata Schema

Add `domain` field to `shared.notifications_queue.metadata`:

```json
{
  "domain": "corporate",
  "notification_type": "corporate_booking_confirmation",
  "company_id": "uuid",
  "booking_id": "YOG-...",
  "coordinator_name": "...",
  "participants_count": 50,
  "invoice_url": "...",
  "pdf_attachments": ["invoice.pdf"]
}
```

### Template Strategy

#### Consumer Templates (Existing)
- booking_confirmation
- class_reminder
- payment_receipt

#### Corporate Templates (NEW)
- corporate_booking_confirmation (to coordinator)
- participant_invitation (to each participant)
- corporate_invoice (to billing contact)
- approval_request (to approver)
- participant_reminder

### Batch Handling

For corporate bookings with 50+ participants:
1. Insert all notifications with `status = 'pending'`
2. Cron job processes in batches of 50
3. Rate limit: 100 emails/minute
4. Retry failed sends with exponential backoff

---

## 🔄 MIGRATION & BACKFILL STRATEGY

### Phase 1: Schema Creation (Safe)

**Migration: `001_create_schemas.sql`**
```sql
CREATE SCHEMA IF NOT EXISTS corporate;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS shared;

-- Move notifications_queue
ALTER TABLE public.notifications_queue SET SCHEMA shared;
```

**Risk:** Zero (no behavioral changes)

---

### Phase 2: Corporate Tables

**Migration: `002_create_corporate_tables.sql`**
```sql
-- Create all corporate schema tables
-- All FKs nullable initially
```

**Backfill Script: `backfill_corporate_data.ts`**
```typescript
// Find bookings with booking_type = 'corporate'
// Extract company_name → dedupe → create companies
// Migrate corporate booking data
// Map participants from metadata
```

**Risk:** Low (new tables, no changes to existing)

---

### Phase 3: Billing Tables

**Migration: `003_create_billing_tables.sql`**

**Backfill Script: `backfill_billing_data.ts`**
```typescript
// Migrate existing invoice data from public schema
// Create billing_profiles for existing users
// Link existing payments
```

**Risk:** Medium (involves financial data — extra validation)

---

### Phase 4: RLS & RBAC

**Migration: `004_enable_rls_policies.sql`**
```sql
-- Enable RLS on all new tables
-- Create policies
```

**Testing Plan:**
- Test consumer access (should not change)
- Test corporate admin access
- Test cross-domain isolation

**Risk:** Medium (requires thorough testing)

---

#### Phase 4 (RLS) — Required policies & deployment checklist

- Deployment order (apply in dev project first, then reproduce in production project):
  1. `shared` policies: `shared.users`, `shared.notifications_queue` — establish identity mapping and service-role allow.
  2. `corporate` policies: `corporate.companies`, `corporate.company_contacts`, `corporate.corporate_bookings`, `corporate.booking_participants`, `corporate.approvals`.
  3. `billing` policies: `billing.billing_profiles`, `billing.invoices`, `billing.payments`.
  4. `audit` / `compliance` policies: make audit append-only and restrict reads to auditors.
  5. Edge/Functions allowlist: grant service-role bypass to scheduled jobs and Edge Functions.

- Policy types to implement (per-table):
  - `service_role_allow` — full access for service-role functions: `FOR ALL USING (auth.role() = 'service_role')`.
  - `company_admin_*` — allow company admins to select/modify rows scoped to `company_id`.
  - `participant_self_*` — allow participants to view/modify their own participant row.
  - `billing_finance_*` — finance-role access to invoices/payments; users can only access their related invoices.
  - `audit_readonly` — auditors may SELECT but not modify audit/compliance tables.

- Validation checklist:
  - Add conservative RLS stubs in dev with `service_role_allow` and deny-by-default user policies.
  - Run integration tests and service-role jobs to confirm tooling and functions work.
  - Harden policies to real authorisation expressions using `auth.uid()` and `shared.users` mappings.
  - When validated, repeat the same scripts in the production Supabase project (user-run).


### Phase 5: Edge Function Deployment

**Deploy new functions:**
```bash
supabase functions deploy corporate/create-company
supabase functions deploy billing/generate-invoice-pdf
supabase functions deploy corporate/generate-participant-invites
```

**Risk:** Low (net-new functionality)

---

### Phase 6: UI Rollout

**Changes:**
- Corporate admin dashboard
- Participant management UI
- Invoice portal

**Feature Flags:**
```
ENABLE_CORPORATE_DASHBOARD=true/false
ENABLE_PARTICIPANT_INVITES=true/false
```

**Risk:** Low (UI only, no DB changes)

---

## 📱 UI / API INTEGRATION PLAN

### Consumer App (Existing)
**No Changes Required**
- Continue using public.bookings
- RLS ensures isolation

### Corporate Admin Dashboard (NEW)

**Routes:**
```
/corporate/dashboard          → Overview
/corporate/bookings           → All corporate bookings
/corporate/bookings/new       → Create booking
/corporate/bookings/:id       → Booking details
/corporate/participants       → Manage participants
/corporate/invoices           → Billing portal
/corporate/company-settings   → Company profile
```

**API Endpoints:**
```
POST /functions/v1/corporate/create-company
POST /functions/v1/corporate/create-booking
POST /functions/v1/corporate/invite-participants
GET  /functions/v1/corporate/bookings?company_id=...
POST /functions/v1/corporate/approve-booking
```

### Finance Portal (NEW)

**Routes:**
```
/finance/invoices             → Invoice list
/finance/invoices/:id         → Invoice detail + PDF
/finance/payments             → Payment history
/finance/reports              → Financial reports
```

**API Endpoints:**
```
GET  /functions/v1/billing/invoices?company_id=...
POST /functions/v1/billing/generate-invoice
POST /functions/v1/billing/record-payment
GET  /functions/v1/billing/download-invoice-pdf/:id
```

---

## 🧪 TESTING & ROLLOUT PLAN

### Pre-Production Testing

#### 1. Schema Validation (Staging)
- Run all migrations
- Verify FK constraints
- Test RLS policies
- Load test queries

#### 2. Backfill Dry Run
- Run backfill scripts on production copy
- Validate data integrity
- Check for orphaned records
- Performance test

#### 3. Edge Function Testing
- Unit tests for each function
- Integration tests (E2E)
- Load test batch operations
- Idempotency validation

#### 4. Notification Testing
- Send test emails to staging
- Verify attachments
- Test batch sending (100+ emails)
- Check retry logic

---

### Production Rollout Strategy

#### Week 1: Schema Foundation (Phase 1)
**Deploy:**
- Schema creation migration
- Move notifications_queue to shared

**Validate:**
- No impact on existing system
- All existing queries work
- Monitoring: zero errors

**Rollback Plan:**
- Revert schema creation
- Move table back to public

---

#### Week 2-3: Corporate Backend (Phase 2)
**Deploy:**
- Corporate schema tables
- Backfill existing corporate bookings
- Enable corporate Edge Functions

**Pilot:**
- Onboard 1 test company
- Create 1 test booking
- Send participant invites
- Validate notifications

**Success Criteria:**
- Booking created successfully
- Emails delivered
- No errors in logs

**Rollback Plan:**
- Disable Edge Functions
- Mark corporate tables as deprecated

---

#### Week 4: Billing System (Phase 3)
**Deploy:**
- Billing schema tables
- Invoice PDF generation
- Backfill existing invoices

**Pilot:**
- Generate 5 test invoices
- Process 1 test payment
- Send invoice emails

**Success Criteria:**
- PDFs generated correctly
- Payments recorded
- Audit logs populated

**Rollback Plan:**
- Revert to old invoice system
- Keep new tables as backup

---

#### Week 5-6: RLS & Security (Phase 4)
**Deploy:**
- Enable RLS on all tables
- Deploy policies
- Add audit logging

**Testing:**
- Security audit
- Penetration testing
- Access control validation

**Success Criteria:**
- No unauthorized access
- All policies working
- Audit logs comprehensive

---

#### Week 7-8: UI Rollout (Phase 5)
**Deploy:**
- Corporate dashboard (feature flagged)
- Invoice portal
- Admin tools

**Beta Testing:**
- Invite 5 pilot companies
- Collect feedback
- Iterate on UX

**Success Criteria:**
- 90% user satisfaction
- <5% error rate
- Positive feedback

---

#### Week 9+: General Availability (Phase 6)
**Deploy:**
- Enable for all companies
- Full marketing rollout
- Documentation published

**Monitoring:**
- Error rates
- Performance metrics
- User adoption

---

## 🚨 RISK ASSESSMENT & MITIGATION

### High Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Backfill data corruption | High | Low | Dry run, validation, rollback plan |
| RLS policy errors | High | Medium | Extensive testing, staged rollout |
| Performance degradation | Medium | Medium | Query optimization, indexes, caching |
| Billing errors | High | Low | Financial audit, manual review |
| Notification failures | Medium | Medium | Retry logic, manual resend |

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- **Zero** production incidents during migration
- **<100ms** p95 latency for corporate queries
- **99.9%** notification delivery rate
- **<1%** RLS policy violation attempts
- **100%** data integrity post-backfill

### Business Metrics
- **10+** corporate customers onboarded (Month 1)
- **500+** participants invited (Month 1)
- **$50K+** enterprise revenue (Quarter 1)
- **90%+** coordinator satisfaction
- **95%+** participant acceptance rate

---

## 🔮 FUTURE MODULE READINESS

This architecture supports:

1. **Gym Module** → Add `gym` schema with facilities, memberships, equipment
2. **White-labelling** → Add branding configs to `corporate.companies.metadata`
3. **Marketplace** → Add `marketplace` schema for third-party instructors
4. **Multi-location** → Add `corporate.company_locations` table
5. **Instructor Tools** → Add `instructor` schema for instructor-facing features
6. **Analytics** → Add `analytics` schema for reporting warehouse

All without changing core schemas.

---

## 📁 RECOMMENDED PROJECT FOLDER STRUCTURE

### Complete Project Layout

```
yogique-platform/
├── README.md
├── ENTERPRISE_ARCHITECTURE_PLAN.md          ← This document
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── docs/                                     ← All documentation
│   ├── architecture/
│   │   ├── SCHEMA_DESIGN.md
│   │   ├── ER_DIAGRAMS.md
│   │   ├── API_SPECIFICATIONS.md
│   │   └── SECURITY_MODEL.md
│   ├── deployment/
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── ROLLBACK_PROCEDURES.md
│   │   └── MONITORING_SETUP.md
│   ├── development/
│   │   ├── SETUP_GUIDE.md
│   │   ├── CODING_STANDARDS.md
│   │   └── TESTING_STRATEGY.md
│   └── user-guides/
│       ├── CORPORATE_ADMIN_GUIDE.md
│       ├── CONSUMER_GUIDE.md
│       └── INSTRUCTOR_GUIDE.md
│
├── supabase/                                 ← Supabase backend
│   ├── config.toml
│   ├── migrations/                           ← Database migrations
│   │   ├── 001_create_schemas.sql
│   │   ├── 002_create_shared_schema.sql
│   │   ├── 003_create_corporate_schema.sql
│   │   ├── 004_create_billing_schema.sql
│   │   ├── 005_create_audit_schema.sql
│   │   ├── 006_create_compliance_schema.sql
│   │   ├── 007_create_integrations_schema.sql
│   │   ├── 008_enable_rls_policies.sql
│   │   ├── 009_create_indexes.sql
│   │   └── 010_seed_initial_data.sql
│   │
│   ├── functions/                            ← Edge Functions
│   │   ├── _shared/                          ← Shared utilities
│   │   │   ├── db.ts
│   │   │   ├── auth.ts
│   │   │   ├── types.ts
│   │   │   ├── validators.ts
│   │   │   ├── errors.ts
│   │   │   ├── logger.ts
│   │   │   └── templates/
│   │   │       ├── email/
│   │   │       │   ├── corporate-booking-confirmation.html
│   │   │       │   ├── participant-invitation.html
│   │   │       │   ├── invoice-email.html
│   │   │       │   └── approval-request.html
│   │   │       └── pdf/
│   │   │           ├── invoice-template.html
│   │   │           └── contract-template.html
│   │   │
│   │   ├── corporate/                        ← Corporate domain functions
│   │   │   ├── create-company/
│   │   │   │   ├── index.ts
│   │   │   │   └── README.md
│   │   │   ├── update-company/
│   │   │   ├── manage-participants/
│   │   │   ├── approve-booking/
│   │   │   ├── generate-participant-invites/
│   │   │   ├── send-participant-reminders/
│   │   │   └── sync-booking-status/
│   │   │
│   │   ├── billing/                          ← Billing domain functions
│   │   │   ├── generate-invoice-pdf/
│   │   │   ├── process-payment/
│   │   │   ├── send-invoice-email/
│   │   │   ├── check-overdue-invoices/
│   │   │   └── create-billing-profile/
│   │   │
│   │   ├── notifications/                    ← Notification functions
│   │   │   ├── notification-worker/          → existing
│   │   │   ├── enqueue-notification/         → existing
│   │   │   ├── send-batch-emails/            → NEW
│   │   │   └── notification-service/         → existing
│   │   │
│   │   ├── admin/                            ← Admin functions
│   │   │   ├── company-onboarding/
│   │   │   ├── generate-reports/
│   │   │   ├── user-management/
│   │   │   └── audit-export/
│   │   │
│   │   └── [existing functions...]          ← All existing edge functions
│   │
│   └── seed/                                 ← Seed data scripts
│       ├── dev/
│       │   ├── companies.sql
│       │   ├── test-bookings.sql
│       │   └── test-users.sql
│       └── production/
│           └── initial-config.sql
│
├── scripts/                                  ← Utility scripts
│   ├── migration/
│   │   ├── backfill-corporate-data.ts
│   │   ├── backfill-billing-data.ts
│   │   ├── migrate-notifications-queue.ts
│   │   └── validate-migration.ts
│   ├── deployment/
│   │   ├── deploy-all-functions.sh
│   │   ├── deploy-migrations.sh
│   │   └── rollback-migration.sh
│   ├── testing/
│   │   ├── seed-test-data.ts
│   │   ├── cleanup-test-data.ts
│   │   └── performance-test.ts
│   └── maintenance/
│       ├── cleanup-old-logs.ts
│       └── archive-completed-bookings.ts
│
├── src/                                      ← React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── config/                               ← Configuration
│   │   ├── supabase.ts
│   │   ├── routes.ts
│   │   ├── features.ts                       ← Feature flags
│   │   └── constants.ts
│   │
│   ├── shared/                               ← Shared resources
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   └── Form/
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSupabase.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useFeatureFlag.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── booking.ts
│   │   │   ├── invoice.ts
│   │   │   └── company.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── currency.ts
│   │       └── validation.ts
│   │
│   ├── features/                             ← Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── contexts/
│   │   │   └── pages/
│   │   │
│   │   ├── consumer/                         ← Consumer booking (existing)
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── BookOneOnOne.tsx
│   │   │   │   ├── BookClass.tsx
│   │   │   │   └── MyBookings.tsx
│   │   │   └── services/
│   │   │
│   │   ├── corporate/                        ← NEW: Corporate module
│   │   │   ├── components/
│   │   │   │   ├── CompanyProfile.tsx
│   │   │   │   ├── BookingCard.tsx
│   │   │   │   ├── ParticipantList.tsx
│   │   │   │   └── ApprovalWorkflow.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Bookings.tsx
│   │   │   │   ├── CreateBooking.tsx
│   │   │   │   ├── BookingDetails.tsx
│   │   │   │   ├── Participants.tsx
│   │   │   │   └── CompanySettings.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCompany.ts
│   │   │   │   ├── useCorporateBookings.ts
│   │   │   │   └── useParticipants.ts
│   │   │   ├── services/
│   │   │   │   ├── companyService.ts
│   │   │   │   ├── bookingService.ts
│   │   │   │   └── participantService.ts
│   │   │   └── types/
│   │   │       ├── company.ts
│   │   │       ├── corporate-booking.ts
│   │   │       └── participant.ts
│   │   │
│   │   ├── billing/                          ← NEW: Billing module
│   │   │   ├── components/
│   │   │   │   ├── InvoiceCard.tsx
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   └── BillingHistory.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Invoices.tsx
│   │   │   │   ├── InvoiceDetails.tsx
│   │   │   │   ├── Payments.tsx
│   │   │   │   └── FinancialReports.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useInvoices.ts
│   │   │   │   └── usePayments.ts
│   │   │   └── services/
│   │   │       ├── invoiceService.ts
│   │   │       └── paymentService.ts
│   │   │
│   │   ├── admin/                            ← Admin module (existing + enhanced)
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Companies.tsx             ← NEW
│   │   │   │   ├── CorporateBookings.tsx     ← NEW
│   │   │   │   ├── Approvals.tsx             ← NEW
│   │   │   │   └── AuditLogs.tsx             ← NEW
│   │   │   └── services/
│   │   │
│   │   ├── instructor/                       ← Instructor module (existing)
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   │
│   │   └── scheduling/                       ← Scheduling (existing)
│   │       ├── components/
│   │       ├── pages/
│   │       └── hooks/
│   │
│   ├── pages/                                ← Top-level pages
│   │   ├── Home.tsx
│   │   ├── Pricing.tsx
│   │   ├── About.tsx
│   │   └── NotFound.tsx
│   │
│   └── services/                             ← Global services
│       ├── api/
│       │   ├── corporate.ts
│       │   ├── billing.ts
│       │   └── notifications.ts
│       └── supabase/
│           ├── auth.ts
│           ├── storage.ts
│           └── realtime.ts
│
├── tests/                                    ← Test suites
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── integration/
│   │   ├── corporate/
│   │   ├── billing/
│   │   └── notifications/
│   ├── e2e/
│   │   ├── consumer-booking.spec.ts
│   │   ├── corporate-booking.spec.ts
│   │   ├── billing-flow.spec.ts
│   │   └── admin-approval.spec.ts
│   └── fixtures/
│       ├── companies.json
│       ├── bookings.json
│       └── users.json
│
├── tools/                                    ← Development tools (existing)
│   ├── list-js-with-tsx.cjs
│   ├── scan-table-references.cjs
│   └── scheduler/
│
├── public/                                   ← Static assets
│   ├── images/
│   ├── fonts/
│   └── _redirects
│
├── archived-docs/                            ← Archive (existing)
│   └── [previous documentation]
│
├── archived-sql/                             ← Archive (existing)
│   └── [previous migrations]
│
├── archived-tests/                           ← Archive (existing)
│   └── [previous tests]
│
├── e2e/                                      ← Playwright E2E (existing)
│   ├── playwright.config.ts
│   └── tests/
│
├── netlify/                                  ← Deployment config (existing)
│   └── edge-functions/
│
├── secrets/                                  ← Environment secrets
│   ├── dev.env
│   ├── staging.env
│   └── prod.env
│
└── types/                                    ← Global TypeScript types
    ├── supabase.ts                           ← Auto-generated from DB
    ├── global.d.ts
    └── [other type definitions]
```

### Key Folder Explanations

#### `docs/` - Centralized Documentation
- **architecture/** - System design, ER diagrams, API specs
- **deployment/** - Production deployment guides
- **development/** - Developer onboarding and standards
- **user-guides/** - End-user documentation

#### `supabase/migrations/` - Database Evolution
- Numbered migrations in order of execution
- Each phase gets its own migration file(s)
- Clear naming: `001_create_schemas.sql`, `002_create_shared_schema.sql`

#### `supabase/functions/_shared/` - Reusable Code
- Common database utilities
- Authentication middleware
- Email/PDF templates
- Type definitions shared across functions

#### `src/features/` - Feature-Based Organization
- Each major feature is self-contained
- Co-locate components, hooks, services, and types
- Easy to understand and maintain
- Supports future code splitting

#### `src/features/corporate/` - NEW Corporate Module
- Complete isolation of corporate functionality
- Own pages, components, services
- Can be feature-flagged independently
- Clear separation from consumer features

#### `src/features/billing/` - NEW Billing Module
- Universal billing UI
- Works for both consumer and corporate
- Invoice viewing and payment processing
- Financial reports

#### `scripts/` - Automation & DevOps
- **migration/** - Backfill and data migration scripts
- **deployment/** - Automated deployment scripts
- **testing/** - Test data seeding
- **maintenance/** - Cleanup and archival tasks

#### `tests/` - Comprehensive Testing
- **unit/** - Component and function tests
- **integration/** - API and database tests
- **e2e/** - Full user journey tests
- **fixtures/** - Test data

---

## ✅ RECOMMENDED NEXT STEPS

1. **Review & Approve** this plan
2. **Request Clarifications** on any section
3. **Generate SQL Migrations** (I can do this)
4. **Generate Edge Function Templates** (I can do this)
5. **Create ER Diagrams** (visual tool or I provide Mermaid syntax)
6. **Define Test Data** for staging
7. **Set Timeline** for each phase

---

**Ready to proceed?** Tell me which deliverable you'd like me to generate first:
- SQL migration scripts?
- Edge function code?
- RLS policies?
- Notification templates?
- Something else?

---

**Document Version:** 1.0  
**Last Updated:** January 5, 2026  
**Maintained By:** Development Team  
**Review Status:** Awaiting Approval
