-- 002_create_corporate_tables.sql
-- Phase 2: corporate schema and supporting tables (nullable FKs, safe defaults)

BEGIN;

CREATE SCHEMA IF NOT EXISTS corporate;

CREATE TABLE IF NOT EXISTS corporate.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  domain text,
  industry text,
  size_category text,
  billing_terms text,
  currency text DEFAULT 'INR',
  tax_id text,
  default_contact_id uuid,
  billing_profile_id uuid,
  status text DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate.company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid,
  name text,
  email text,
  phone text,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate.corporate_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text,
  company_id uuid,
  coordinator_id uuid,
  user_id uuid,
  class_package_id uuid,
  program_name text,
  program_type text,
  session_frequency text,
  program_duration_weeks int,
  delivery_mode text,
  location_address_id uuid,
  preferred_days text[],
  preferred_times text[],
  start_date date,
  end_date date,
  timezone text,
  participants_count int,
  max_participants int,
  price_per_participant numeric,
  total_price numeric,
  currency text,
  po_number text,
  contract_reference text,
  status text DEFAULT 'draft',
  approval_required boolean DEFAULT true,
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate.booking_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_booking_id uuid,
  company_contact_id uuid,
  name text,
  email text,
  phone text,
  employee_id text,
  department text,
  status text DEFAULT 'invited',
  invitation_sent_at timestamptz,
  accepted_at timestamptz,
  attendance_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_booking_id uuid,
  requested_by uuid,
  approved_by uuid,
  status text DEFAULT 'pending',
  approval_level int DEFAULT 1,
  notes text,
  requested_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  metadata jsonb
);

-- Note: FKs intentionally omitted/nullable for safe backfill; add FK constraints in later migration once data is validated.

COMMIT;

-- To apply: run this SQL in Supabase SQL editor or use migration tooling after syncing migration history.
