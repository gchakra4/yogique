-- 004_add_corporate_fk_constraints.sql
-- Phase 2b: Add foreign key constraints to corporate schema tables
-- Safe to run after backfill is validated (003_backfill_corporate_data.sql applied)

BEGIN;

-- Add FK constraints to corporate.company_contacts
ALTER TABLE corporate.company_contacts
  ADD CONSTRAINT fk_company_contacts_company_id 
  FOREIGN KEY (company_id) REFERENCES corporate.companies(id) ON DELETE CASCADE;

ALTER TABLE corporate.company_contacts
  ADD CONSTRAINT fk_company_contacts_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add FK constraints to corporate.corporate_bookings
ALTER TABLE corporate.corporate_bookings
  ADD CONSTRAINT fk_corporate_bookings_company_id 
  FOREIGN KEY (company_id) REFERENCES corporate.companies(id) ON DELETE CASCADE;

ALTER TABLE corporate.corporate_bookings
  ADD CONSTRAINT fk_corporate_bookings_coordinator_id 
  FOREIGN KEY (coordinator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE corporate.corporate_bookings
  ADD CONSTRAINT fk_corporate_bookings_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE corporate.corporate_bookings
  ADD CONSTRAINT fk_corporate_bookings_approved_by 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add FK constraints to corporate.booking_participants
ALTER TABLE corporate.booking_participants
  ADD CONSTRAINT fk_booking_participants_corporate_booking_id 
  FOREIGN KEY (corporate_booking_id) REFERENCES corporate.corporate_bookings(id) ON DELETE CASCADE;

ALTER TABLE corporate.booking_participants
  ADD CONSTRAINT fk_booking_participants_company_contact_id 
  FOREIGN KEY (company_contact_id) REFERENCES corporate.company_contacts(id) ON DELETE SET NULL;

-- Add FK constraints to corporate.approvals
ALTER TABLE corporate.approvals
  ADD CONSTRAINT fk_approvals_corporate_booking_id 
  FOREIGN KEY (corporate_booking_id) REFERENCES corporate.corporate_bookings(id) ON DELETE CASCADE;

ALTER TABLE corporate.approvals
  ADD CONSTRAINT fk_approvals_requested_by 
  FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE corporate.approvals
  ADD CONSTRAINT fk_approvals_approved_by 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for FK columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON corporate.company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_user_id ON corporate.company_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_corporate_bookings_company_id ON corporate.corporate_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_corporate_bookings_coordinator_id ON corporate.corporate_bookings(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_corporate_bookings_user_id ON corporate.corporate_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_bookings_booking_code ON corporate.corporate_bookings(booking_code);

CREATE INDEX IF NOT EXISTS idx_booking_participants_corporate_booking_id ON corporate.booking_participants(corporate_booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_company_contact_id ON corporate.booking_participants(company_contact_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_email ON corporate.booking_participants(email);

CREATE INDEX IF NOT EXISTS idx_approvals_corporate_booking_id ON corporate.approvals(corporate_booking_id);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON corporate.approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON corporate.approvals(status);

-- Add unique constraint on corporate.companies.name (business requirement)
ALTER TABLE corporate.companies
  ADD CONSTRAINT uq_companies_name UNIQUE (name);

COMMIT;

-- Notes:
-- - ON DELETE CASCADE: Child records deleted when parent is deleted (company -> bookings, bookings -> participants/approvals)
-- - ON DELETE SET NULL: FK set to NULL when referenced user is deleted (preserves audit trail)
-- - Indexes improve JOIN and WHERE performance on FK columns
-- - Run on staging first and verify no constraint violations
