-- Combined validation checks for supabase/migrations
-- Run this in Supabase SQL editor; it returns true/false rows for presence checks.

-- 000_add_message_audit_table.sql
SELECT '000_add_message_audit_table.sql' AS migration, to_regclass('public.message_audit') IS NOT NULL AS table_exists;
SELECT 'idx_message_audit_provider_message_id' AS artifact, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='message_audit' AND indexname='idx_message_audit_provider_message_id') AS present;
SELECT 'idx_message_audit_class_channel' AS artifact, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='message_audit' AND indexname='idx_message_audit_class_channel') AS present;

-- 000_add_notification_flags_to_class_assignments.sql
SELECT '000_add_notification_flags_to_class_assignments.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='class_assignments' AND column_name='whatsapp_notified') AS whatsapp_notified, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='class_assignments' AND column_name='email_notified') AS email_notified;

-- 2025-12-13-approve-devtools.sql
SELECT '2025-12-13-approve-devtools.sql' AS migration, to_regclass('public.devtools_developers') IS NOT NULL AS devtools_developers_exists, to_regclass('public.devtools_requests') IS NOT NULL AS devtools_requests_exists, to_regclass('public.approvals_log') IS NOT NULL AS approvals_log_exists;
SELECT 'devtools_developers_rls' AS artifact, (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND c.relname='devtools_developers') AS rls_enabled;
SELECT 'policy_devtools_developers_select_self' AS artifact, EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='devtools_developers' AND policyname='devtools_developers_select_self') AS present;
SELECT 'policy_devtools_requests_insert_self' AS artifact, EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='devtools_requests' AND policyname='devtools_requests_insert_self') AS present;
SELECT 'policy_devtools_requests_select_admin' AS artifact, EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='devtools_requests' AND policyname='devtools_requests_select_admin') AS present;
SELECT 'policy_approvals_log_select_admin' AS artifact, EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='approvals_log' AND policyname='approvals_log_select_admin') AS present;

-- 20250826074024_baseline.sql
SELECT '20250826074024_baseline.sql' AS migration, 'file_present_locally' AS artifact, TRUE AS present;

-- 20250829000001_add_transactions_snapshot.sql
SELECT '20250829000001_add_transactions_snapshot.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='user_email') AS user_email_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='user_full_name') AS user_full_name_exists;
SELECT 'transactions_with_user_view' AS artifact, EXISTS(SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='transactions_with_user') AS present;
SELECT 'idx_transactions_user_id' AS artifact, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='transactions' AND indexname='idx_transactions_user_id') AS present;

-- 20250829000002_drop_view_and_rerun.sql
SELECT '20250829000002_drop_view_and_rerun.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='user_email') AS user_email_exists, EXISTS(SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='transactions_with_user') AS view_present;

-- 20251113_add_timezone_to_newsletter_subscribers.sql
SELECT '20251113_add_timezone_to_newsletter_subscribers.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='newsletter_subscribers' AND column_name='timezone') AS timezone_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='newsletter_subscribers' AND indexname='idx_newsletter_subscribers_timezone') AS timezone_index_exists;

-- 20251202_add_whatsapp_opt_in_to_profiles.sql
SELECT '20251202_add_whatsapp_opt_in_to_profiles.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='whatsapp_opt_in') AS whatsapp_opt_in_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='whatsapp_opt_in_at') AS whatsapp_opt_in_at_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='profiles' AND indexname='idx_profiles_whatsapp_opt_in') AS whatsapp_index_exists;

-- 20251202_create_phone_otps_table.sql
SELECT '20251202_create_phone_otps_table.sql' AS migration, to_regclass('public.phone_otps') IS NOT NULL AS table_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='phone_otps' AND indexname='idx_phone_otps_phone') AS phone_index_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='phone_otps' AND indexname='idx_phone_otps_user_id') AS user_index_exists;

-- 20251206_add_cancelled_by_to_bookings.sql
SELECT '20251206_add_cancelled_by_to_bookings.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancelled_by') AS cancelled_by_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='bookings' AND indexname='idx_bookings_cancelled_by') AS index_exists;

-- 20251206_add_cancel_token_columns_to_bookings.sql
SELECT '20251206_add_cancel_token_columns_to_bookings.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancel_token') AS cancel_token_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancel_token_expires_at') AS cancel_token_expires_at_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='bookings' AND indexname='idx_bookings_cancel_token') AS index_exists;

-- 20251206_add_revoke_audit_logs.sql
SELECT '20251206_add_revoke_audit_logs.sql' AS migration, to_regclass('public.audit_logs') IS NOT NULL AS table_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='audit_logs' AND indexname='idx_audit_logs_created_at') AS idx_created_at_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='audit_logs' AND indexname='idx_audit_logs_metadata_gin') AS idx_metadata_gin_exists;
SELECT 'audit_logs_rls' AS artifact, (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND c.relname='audit_logs') AS rls_enabled;
SELECT 'policy_admins_can_read_audit_logs' AS artifact, EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Admins can read audit logs') AS present;

-- 20251206_add_user_cancelled_columns_to_bookings.sql
SELECT '20251206_add_user_cancelled_columns_to_bookings.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='user_cancelled') AS user_cancelled_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancelled_at') AS cancelled_at_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='bookings' AND indexname='idx_bookings_cancelled_at') AS index_exists;

-- 20251206_deprecate_unused_tables.sql
SELECT '20251206_deprecate_unused_tables.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='__deprecated_admin_users_20251206') AS deprecated_admin_users_renamed;

-- 20251206_migrate_audits_to_audit_logs.sql
SELECT '20251206_migrate_audits_to_audit_logs.sql' AS migration, to_regclass('public.audit_logs') IS NOT NULL AS central_audit_logs_exists;

-- 20251218_add_invoice_id_to_transactions.sql
SELECT '20251218_add_invoice_id_to_transactions.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='invoice_id') AS invoice_id_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='transactions' AND indexname='idx_transactions_invoice_id') AS invoice_idx_exists;

-- 20251218_add_invoice_status_enum.sql
SELECT '20251218_add_invoice_status_enum.sql' AS migration, EXISTS(SELECT 1 FROM pg_type WHERE typname='invoice_status_enum') AS enum_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invoices' AND indexname='idx_invoices_status_enum') AS status_index_exists;

-- 20251218_add_payment_link_job_columns.sql
SELECT '20251218_add_payment_link_job_columns.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_link_jobs' AND column_name='next_run_at') AS next_run_at_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_link_jobs' AND column_name='processing_started_at') AS processing_started_at_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='payment_link_jobs' AND indexname='idx_payment_link_jobs_next_run_at') AS next_run_idx_exists;

-- 20251218_backfill_transactions_to_invoices.sql
SELECT '20251218_backfill_transactions_to_invoices.sql' AS migration, to_regclass('public.invoices') IS NOT NULL AS invoices_table_exists;

-- 20251218_create_invoices.sql
SELECT '20251218_create_invoices.sql' AS migration, to_regclass('public.invoices') IS NOT NULL AS table_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invoices' AND indexname='uniq_invoices_booking_billing_period') AS unique_index_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invoices' AND indexname='idx_invoices_status') AS status_index_exists;

-- 20251218_create_payment_link_jobs.sql
SELECT '20251218_create_payment_link_jobs.sql' AS migration, to_regclass('public.payment_link_jobs') IS NOT NULL AS table_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='payment_link_jobs' AND indexname='idx_payment_link_jobs_status') AS status_index_exists;

-- 20251218_extend_audit_logs_for_invoice_reminders.sql
SELECT '20251218_extend_audit_logs_for_invoice_reminders.sql' AS migration, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='audit_type') AS audit_type_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='audit_logs' AND indexname='idx_audit_logs_invoice_id') AS invoice_id_index_exists, EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='audit_logs' AND indexname='idx_audit_logs_audit_type_invoice_reminder') AS partial_index_exists;

-- End of checks
