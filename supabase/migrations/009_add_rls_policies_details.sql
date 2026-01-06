-- 009_add_rls_policies_details.sql
-- Detailed RLS policies for `corporate` and `billing` tables
-- Conservative, idempotent creation: policies only created when absent.

BEGIN;

-- CORPORATE: company-admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'corporate' AND p.tablename = 'companies' AND p.policyname = 'company_admin_select'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'corporate' AND table_name = 'company_contacts' AND column_name = 'is_admin'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY company_admin_select
        ON corporate.companies
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc
            WHERE cc.company_id = companies.id
              AND cc.user_id = auth.uid()
              AND (cc.is_admin = true OR cc.role = 'admin')
          )
        );
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY company_admin_select
        ON corporate.companies
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc
            WHERE cc.company_id = companies.id
              AND cc.user_id = auth.uid()
              AND (cc.role = 'admin')
          )
        );
      $sql$;
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'corporate' AND p.tablename = 'companies' AND p.policyname = 'company_admin_modify'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'corporate' AND table_name = 'company_contacts' AND column_name = 'is_admin'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY company_admin_modify
        ON corporate.companies
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc
            WHERE cc.company_id = companies.id
              AND cc.user_id = auth.uid()
              AND (cc.is_admin = true OR cc.role = 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc
            WHERE cc.company_id = companies.id
              AND cc.user_id = auth.uid()
              AND (cc.is_admin = true OR cc.role = 'admin')
          )
        );
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY company_admin_modify
        ON corporate.companies
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc
            WHERE cc.company_id = companies.id
              AND cc.user_id = auth.uid()
              AND (cc.role = 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc
            WHERE cc.company_id = companies.id
              AND cc.user_id = auth.uid()
              AND (cc.role = 'admin')
          )
        );
      $sql$;
    END IF;
  END IF;
END$$;

-- CORPORATE: company_contacts — allow users to see/modify their own contact and allow company admins to manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'corporate' AND p.tablename = 'company_contacts' AND p.policyname = 'contact_self_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY contact_self_select
      ON corporate.company_contacts
      FOR SELECT
      USING ( user_id = auth.uid() );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'corporate' AND p.tablename = 'company_contacts' AND p.policyname = 'company_admin_manage_contacts'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'corporate' AND table_name = 'company_contacts' AND column_name = 'is_admin'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY company_admin_manage_contacts
        ON corporate.company_contacts
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc2
            WHERE cc2.company_id = company_contacts.company_id
              AND cc2.user_id = auth.uid()
              AND (cc2.is_admin = true OR cc2.role = 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc2
            WHERE cc2.company_id = company_contacts.company_id
              AND cc2.user_id = auth.uid()
              AND (cc2.is_admin = true OR cc2.role = 'admin')
          )
        );
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY company_admin_manage_contacts
        ON corporate.company_contacts
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc2
            WHERE cc2.company_id = company_contacts.company_id
              AND cc2.user_id = auth.uid()
              AND (cc2.role = 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM corporate.company_contacts cc2
            WHERE cc2.company_id = company_contacts.company_id
              AND cc2.user_id = auth.uid()
              AND (cc2.role = 'admin')
          )
        );
      $sql$;
    END IF;
  END IF;
END$$;

-- CORPORATE: booking participants — participant_self_select allows the participant's linked contact user to see their row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'corporate' AND p.tablename = 'booking_participants' AND p.policyname = 'participant_self_select'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'corporate' AND table_name = 'company_contacts' AND column_name = 'is_admin'
    ) THEN
      -- choose policy variant depending on whether booking_participants has company_id or corporate_booking_id
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'corporate' AND table_name = 'booking_participants' AND column_name = 'company_id'
      ) THEN
        EXECUTE $sql$
          CREATE POLICY participant_self_select
          ON corporate.booking_participants
          FOR SELECT
          USING (
            (company_contact_id IS NOT NULL AND
              EXISTS (
                SELECT 1 FROM corporate.company_contacts cc
                WHERE cc.id = company_contact_id
                  AND cc.user_id = auth.uid()
              )
            )
            OR
            EXISTS (
              SELECT 1 FROM corporate.company_contacts cc2
              WHERE cc2.company_id = booking_participants.company_id
                AND cc2.user_id = auth.uid()
                AND (cc2.is_admin = true OR cc2.role = 'admin')
            )
          );
        $sql$;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'corporate' AND table_name = 'booking_participants' AND column_name = 'corporate_booking_id'
      ) THEN
        EXECUTE $sql$
          CREATE POLICY participant_self_select
          ON corporate.booking_participants
          FOR SELECT
          USING (
            (company_contact_id IS NOT NULL AND
              EXISTS (
                SELECT 1 FROM corporate.company_contacts cc
                WHERE cc.id = company_contact_id
                  AND cc.user_id = auth.uid()
              )
            )
            OR
            EXISTS (
              SELECT 1 FROM corporate.company_contacts cc2
              WHERE cc2.company_id = (
                SELECT cb.company_id FROM corporate.corporate_bookings cb WHERE cb.id = booking_participants.corporate_booking_id
              )
                AND cc2.user_id = auth.uid()
                AND (cc2.is_admin = true OR cc2.role = 'admin')
            )
          );
        $sql$;
      ELSE
        -- fallback: only allow participant's linked contact
        EXECUTE $sql$
          CREATE POLICY participant_self_select
          ON corporate.booking_participants
          FOR SELECT
          USING (
            company_contact_id IS NOT NULL AND
            EXISTS (
              SELECT 1 FROM corporate.company_contacts cc
              WHERE cc.id = company_contact_id
                AND cc.user_id = auth.uid()
            )
          );
        $sql$;
      END IF;
    ELSE
      -- same variants but without is_admin checks
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'corporate' AND table_name = 'booking_participants' AND column_name = 'company_id'
      ) THEN
        EXECUTE $sql$
          CREATE POLICY participant_self_select
          ON corporate.booking_participants
          FOR SELECT
          USING (
            (company_contact_id IS NOT NULL AND
              EXISTS (
                SELECT 1 FROM corporate.company_contacts cc
                WHERE cc.id = company_contact_id
                  AND cc.user_id = auth.uid()
              )
            )
            OR
            EXISTS (
              SELECT 1 FROM corporate.company_contacts cc2
              WHERE cc2.company_id = booking_participants.company_id
                AND cc2.user_id = auth.uid()
                AND (cc2.role = 'admin')
            )
          );
        $sql$;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'corporate' AND table_name = 'booking_participants' AND column_name = 'corporate_booking_id'
      ) THEN
        EXECUTE $sql$
          CREATE POLICY participant_self_select
          ON corporate.booking_participants
          FOR SELECT
          USING (
            (company_contact_id IS NOT NULL AND
              EXISTS (
                SELECT 1 FROM corporate.company_contacts cc
                WHERE cc.id = company_contact_id
                  AND cc.user_id = auth.uid()
              )
            )
            OR
            EXISTS (
              SELECT 1 FROM corporate.company_contacts cc2
              WHERE cc2.company_id = (
                SELECT cb.company_id FROM corporate.corporate_bookings cb WHERE cb.id = booking_participants.corporate_booking_id
              )
                AND cc2.user_id = auth.uid()
                AND (cc2.role = 'admin')
            )
          );
        $sql$;
      ELSE
        EXECUTE $sql$
          CREATE POLICY participant_self_select
          ON corporate.booking_participants
          FOR SELECT
          USING (
            company_contact_id IS NOT NULL AND
            EXISTS (
              SELECT 1 FROM corporate.company_contacts cc
              WHERE cc.id = company_contact_id
                AND cc.user_id = auth.uid()
            )
          );
        $sql$;
      END IF;
    END IF;
  END IF;
END$$;

-- BILLING: finance role + owner access for invoices and payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'invoices' AND p.policyname = 'billing_finance_select'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'billing' AND table_name = 'billing_profiles' AND column_name = 'owner_id'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY billing_finance_select
        ON billing.invoices
        FOR SELECT
        USING (
          current_setting('jwt.claims.role', true) = 'finance'
          OR EXISTS (
            SELECT 1 FROM billing.billing_profiles bp
            WHERE bp.id = invoices.billing_profile_id
              AND bp.owner_id = auth.uid()
          )
        );
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY billing_finance_select
        ON billing.invoices
        FOR SELECT
        USING (
          current_setting('jwt.claims.role', true) = 'finance'
          OR EXISTS (
            SELECT 1 FROM billing.billing_profiles bp
            WHERE bp.id = invoices.billing_profile_id
              AND bp.user_id = auth.uid()
          )
        );
      $sql$;
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'invoices' AND p.policyname = 'billing_owner_modify'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'billing' AND table_name = 'billing_profiles' AND column_name = 'owner_id'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY billing_owner_modify
        ON billing.invoices
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM billing.billing_profiles bp
            WHERE bp.id = invoices.billing_profile_id
              AND bp.owner_id = auth.uid()
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM billing.billing_profiles bp
            WHERE bp.id = invoices.billing_profile_id
              AND bp.owner_id = auth.uid()
          )
        );
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY billing_owner_modify
        ON billing.invoices
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM billing.billing_profiles bp
            WHERE bp.id = invoices.billing_profile_id
              AND bp.user_id = auth.uid()
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM billing.billing_profiles bp
            WHERE bp.id = invoices.billing_profile_id
              AND bp.user_id = auth.uid()
          )
        );
      $sql$;
    END IF;
  END IF;
END$$;

-- BILLING: payments follow invoices (finance or owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'billing' AND p.tablename = 'payments' AND p.policyname = 'payments_finance_or_owner'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'billing' AND table_name = 'billing_profiles' AND column_name = 'owner_id'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY payments_finance_or_owner
        ON billing.payments
        FOR ALL
        USING (
          current_setting('jwt.claims.role', true) = 'finance'
          OR EXISTS (
            SELECT 1 FROM billing.invoices i
            WHERE i.id = payments.invoice_id
              AND EXISTS (
                SELECT 1 FROM billing.billing_profiles bp
                WHERE bp.id = i.billing_profile_id
                  AND bp.owner_id = auth.uid()
              )
          )
        )
        WITH CHECK (
          current_setting('jwt.claims.role', true) = 'finance'
          OR EXISTS (
            SELECT 1 FROM billing.invoices i
            WHERE i.id = payments.invoice_id
              AND EXISTS (
                SELECT 1 FROM billing.billing_profiles bp
                WHERE bp.id = i.billing_profile_id
                  AND bp.owner_id = auth.uid()
              )
          )
        );
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY payments_finance_or_owner
        ON billing.payments
        FOR ALL
        USING (
          current_setting('jwt.claims.role', true) = 'finance'
          OR EXISTS (
            SELECT 1 FROM billing.invoices i
            WHERE i.id = payments.invoice_id
              AND EXISTS (
                SELECT 1 FROM billing.billing_profiles bp
                WHERE bp.id = i.billing_profile_id
                  AND bp.user_id = auth.uid()
              )
          )
        )
        WITH CHECK (
          current_setting('jwt.claims.role', true) = 'finance'
          OR EXISTS (
            SELECT 1 FROM billing.invoices i
            WHERE i.id = payments.invoice_id
              AND EXISTS (
                SELECT 1 FROM billing.billing_profiles bp
                WHERE bp.id = i.billing_profile_id
                  AND bp.user_id = auth.uid()
              )
          )
        );
      $sql$;
    END IF;
  END IF;
END$$;

COMMIT;

-- NOTES:
-- - These policies are conservative templates. Replace `is_admin`, `role`, and `owner_id` column names to match your real schema.
-- - Test policies in dev using `scripts/policies/validate_rls.cjs` and a service-role `DATABASE_URL` for verification.
-- - Keep `service_role_allow` policy (from `008_enable_rls_policies.sql`) until user policies are fully validated.
