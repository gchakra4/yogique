-- 010_add_missing_rls_policies.sql
-- Idempotent RLS policies for missing tables detected by validator
-- Creates conservative `service_role_allow` policies and sensible user/admin stubs.

-- Note: run this in the dev Supabase SQL editor (service_role DATABASE_URL).

-- corporate.corporate_bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='corporate' AND tablename='corporate_bookings' AND policyname='service_role_allow'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY service_role_allow ON corporate.corporate_bookings
        FOR ALL
        USING (current_setting('jwt.claims.role'::text, true) = 'service_role'::text)
        WITH CHECK (current_setting('jwt.claims.role'::text, true) = 'service_role'::text);
    $sql$;
  END IF;

  -- company admin / coordinator policies (only if company_id exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='corporate' AND tablename='corporate_bookings' AND policyname='company_admin_select'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='corporate' AND table_name='corporate_bookings' AND column_name='company_id'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY company_admin_select ON corporate.corporate_bookings
          FOR SELECT USING (
            company_id IN (
              SELECT company_id FROM corporate.company_contacts WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      $sql$;

      -- split modify into UPDATE (with WITH CHECK) and DELETE (USING only)
      EXECUTE $sql$
        CREATE POLICY company_admin_modify_update ON corporate.corporate_bookings
          FOR UPDATE
          USING (
            company_id IN (
              SELECT company_id FROM corporate.company_contacts WHERE user_id = auth.uid() AND role = 'admin'
            )
          )
          WITH CHECK (
            company_id IN (
              SELECT company_id FROM corporate.company_contacts WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      $sql$;

      EXECUTE $sql$
        CREATE POLICY company_admin_modify_delete ON corporate.corporate_bookings
          FOR DELETE
          USING (
            company_id IN (
              SELECT company_id FROM corporate.company_contacts WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      $sql$;
    ELSE
      -- Fallback: allow coordinator (if coordinator_id exists)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='corporate' AND table_name='corporate_bookings' AND column_name='coordinator_id'
      ) THEN
        EXECUTE $sql$
          CREATE POLICY coordinator_select ON corporate.corporate_bookings
            FOR SELECT USING (
              coordinator_id IN (SELECT id FROM corporate.company_contacts WHERE user_id = auth.uid())
            );
        $sql$;
      END IF;
    END IF;
  END IF;
END
$$;

-- corporate.approvals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='corporate' AND tablename='approvals' AND policyname='service_role_allow'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY service_role_allow ON corporate.approvals
        FOR ALL
        USING (current_setting('jwt.claims.role'::text, true) = 'service_role'::text)
        WITH CHECK (current_setting('jwt.claims.role'::text, true) = 'service_role'::text);
    $sql$;
  END IF;

  -- auditors/admins can SELECT approvals (conservative)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='corporate' AND tablename='approvals' AND policyname='admin_audit_select'
  ) THEN
    -- only add if shared.users exists so the role mapping query is valid
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema='shared' AND table_name='users'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY admin_audit_select ON corporate.approvals
          FOR SELECT USING (
            auth.uid() IN (SELECT id FROM shared.users WHERE role IN ('admin','auditor'))
          );
      $sql$;
    END IF;
  END IF;
END
$$;

-- shared.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='shared' AND table_name='users'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='shared' AND tablename='users' AND policyname='service_role_allow'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY service_role_allow ON shared.users
          FOR ALL
          USING (current_setting('jwt.claims.role'::text, true) = 'service_role'::text)
          WITH CHECK (current_setting('jwt.claims.role'::text, true) = 'service_role'::text);
      $sql$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='shared' AND tablename='users' AND policyname='user_self_select'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY user_self_select ON shared.users
          FOR SELECT USING (id = auth.uid());
      $sql$;
    END IF;
  END IF;
END
$$;

-- shared.notifications_queue
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='shared' AND table_name='notifications_queue'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='shared' AND tablename='notifications_queue' AND policyname='service_role_allow'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY service_role_allow ON shared.notifications_queue
          FOR ALL
          USING (current_setting('jwt.claims.role'::text, true) = 'service_role'::text)
          WITH CHECK (current_setting('jwt.claims.role'::text, true) = 'service_role'::text);
      $sql$;
    END IF;
  END IF;
END
$$;

-- End of migration
