drop trigger if exists "bookings_generate_first_invoice_trigger" on "public"."bookings";

drop trigger if exists "validate_class_assignment_access_trigger" on "public"."class_assignments";

drop trigger if exists "update_invoices_updated_at" on "public"."invoices";

drop trigger if exists "update_payment_links_updated_at" on "public"."payment_links";

drop policy "Authenticated users view own invoice emails" on "public"."invoice_emails";

drop policy "Service role full access to invoice_emails" on "public"."invoice_emails";

drop policy "invoice_reminders_admin_all" on "public"."invoice_reminders";

drop policy "instructors_block_invoices" on "public"."invoices";

drop policy "invoices_admin_all" on "public"."invoices";

drop policy "invoices_select_own" on "public"."invoices";

drop policy "payment_events_admin_all" on "public"."payment_events";

drop policy "instructors_block_payment_links" on "public"."payment_links";

drop policy "payment_links_admin_all" on "public"."payment_links";

drop policy "payment_links_select_own" on "public"."payment_links";

drop policy "instructors_block_transactions" on "public"."transactions";

alter table "public"."invoice_emails" drop constraint "invoice_emails_email_status_check";

alter table "public"."invoice_emails" drop constraint "invoice_emails_email_type_check";

alter table "public"."invoice_emails" drop constraint "invoice_emails_invoice_id_fkey";

alter table "public"."invoice_emails" drop constraint "invoice_emails_payment_link_id_fkey";

alter table "public"."invoice_reminders" drop constraint "invoice_reminders_invoice_id_fkey";

alter table "public"."invoices" drop constraint "invoices_amount_check";

alter table "public"."invoices" drop constraint "invoices_billing_period_valid";

alter table "public"."invoices" drop constraint "invoices_booking_id_fkey";

alter table "public"."invoices" drop constraint "invoices_due_date_after_start";

alter table "public"."invoices" drop constraint "invoices_invoice_number_key";

alter table "public"."invoices" drop constraint "invoices_paid_at_when_status_paid";

alter table "public"."invoices" drop constraint "invoices_tax_amount_check";

alter table "public"."invoices" drop constraint "invoices_tax_rate_check";

alter table "public"."invoices" drop constraint "invoices_total_amount_check";

alter table "public"."payment_events" drop constraint "payment_events_event_id_key";

alter table "public"."payment_events" drop constraint "payment_events_payment_link_id_fkey";

alter table "public"."payment_links" drop constraint "payment_links_invoice_id_fkey";

alter table "public"."payment_links" drop constraint "payment_links_invoice_id_key";

alter table "public"."payment_links" drop constraint "payment_links_razorpay_link_id_key";

alter table "public"."transactions" drop constraint "transactions_booking_id_fkey";

alter table "public"."transactions" drop constraint "transactions_invoice_id_fkey";

alter table "public"."transactions" drop constraint "transactions_transaction_type_check";

drop view if exists "public"."active_payment_links_v";

drop view if exists "public"."active_recurring_bookings_v";

drop view if exists "public"."admin_bookings_access_v";

drop function if exists "public"."admin_create_payment_link"(p_invoice_id uuid);

drop function if exists "public"."admin_escalate_booking"(p_booking_id uuid);

drop function if exists "public"."admin_generate_invoice"(p_booking_id uuid);

drop view if exists "public"."admin_invoices_dashboard_v";

drop view if exists "public"."admin_payment_events_log_v";

drop view if exists "public"."admin_payment_links_monitor_v";

drop view if exists "public"."bookings_at_risk_v";

drop function if exists "public"."calculate_days_overdue"(p_invoice_id uuid);

drop function if exists "public"."can_schedule_class"(p_booking_id uuid);

drop function if exists "public"."cancel_payment_link"(p_invoice_id uuid);

drop function if exists "public"."check_booking_payment_status"(p_booking_id uuid);

drop function if exists "public"."count_scheduled_classes"(p_booking_id uuid, p_start_date date, p_end_date date);

drop function if exists "public"."escalate_overdue_bookings"();

drop function if exists "public"."expire_payment_links"();

drop view if exists "public"."failed_payments_v";

drop function if exists "public"."generate_first_invoice"(p_booking_id uuid);

drop function if exists "public"."generate_monthly_invoices"(p_target_month date);

drop function if exists "public"."get_assignment_roster_instructor"(p_assignment_id uuid);

drop function if exists "public"."get_booking_lifecycle_info"(p_booking_id uuid);

drop function if exists "public"."get_business_tax_rate"();

drop function if exists "public"."get_escalation_timeline"(p_booking_id uuid);

drop function if exists "public"."get_invoice_for_payment_link"(p_invoice_id uuid);

drop function if exists "public"."get_payment_history"(p_invoice_id uuid);

drop function if exists "public"."get_payment_link_status"(p_invoice_id uuid);

drop function if exists "public"."initialize_billing_cycle"(p_booking_id uuid, p_start_date date);

drop view if exists "public"."instructor_completed_classes_v";

drop view if exists "public"."invoices_needing_payment_links_v";

drop view if exists "public"."invoices_pending_generation_v";

drop function if exists "public"."is_recurring_booking"(p_booking_id uuid);

drop view if exists "public"."locked_bookings_dashboard_v";

drop view if exists "public"."locked_bookings_v";

drop function if exists "public"."log_invoice_email"(p_invoice_id uuid, p_recipient_email text, p_email_type text, p_payment_link_id uuid, p_email_provider_id text, p_metadata jsonb);

drop view if exists "public"."overdue_invoices_v";

drop view if exists "public"."paid_invoices_v";

drop view if exists "public"."payment_links_with_invoice_v";

drop function if exists "public"."process_payment_event"(p_event_id text, p_event_type text, p_payment_link_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text, p_signature_verified boolean, p_payload jsonb);

drop view if exists "public"."recent_payment_events_v";

drop function if exists "public"."store_payment_link"(p_invoice_id uuid, p_razorpay_link_id text, p_short_url text, p_expires_at timestamp with time zone, p_razorpay_response jsonb);

drop function if exists "public"."transition_booking_access_status"(p_booking_id uuid, p_new_status access_status, p_reason text);

drop function if exists "public"."trigger_generate_first_invoice"();

drop function if exists "public"."validate_class_assignment_access"();

drop function if exists "public"."verify_razorpay_signature"(p_payload text, p_signature text, p_webhook_secret text);

drop view if exists "public"."admin_assignment_roster_v";

drop view if exists "public"."assignment_bookings_view_roster";

drop view if exists "public"."instructor_upcoming_classes_v";

drop view if exists "public"."transactions_with_user";

drop view if exists "public"."user_engagement_metrics";

drop view if exists "public"."instructor_classes_v";

drop function if exists "public"."can_view_assignment"(p_assignment_id uuid);

alter table "public"."activity_template_mappings" drop constraint "activity_template_mappings_pkey";

alter table "public"."invoice_emails" drop constraint "invoice_emails_pkey";

alter table "public"."invoice_reminders" drop constraint "invoice_reminders_pkey";

alter table "public"."invoices" drop constraint "invoices_pkey";

alter table "public"."notifications_queue" drop constraint "notifications_queue_pkey";

alter table "public"."otp_codes" drop constraint "otp_codes_pkey";

alter table "public"."payment_events" drop constraint "payment_events_pkey";

alter table "public"."payment_links" drop constraint "payment_links_pkey";

alter table "public"."wa_templates" drop constraint "wa_templates_pkey";

drop index if exists "public"."activity_template_mappings_pkey";

drop index if exists "public"."idx_activity_template_mappings_activity";

drop index if exists "public"."idx_bookings_access_status";

drop index if exists "public"."idx_bookings_billing_cycle_anchor";

drop index if exists "public"."idx_invoice_emails_invoice_id";

drop index if exists "public"."idx_invoice_emails_sent_at";

drop index if exists "public"."idx_invoice_emails_status";

drop index if exists "public"."idx_invoice_reminders_invoice_id";

drop index if exists "public"."idx_invoice_reminders_sent_at";

drop index if exists "public"."idx_invoices_billing_period";

drop index if exists "public"."idx_invoices_booking_id";

drop index if exists "public"."idx_invoices_created_at";

drop index if exists "public"."idx_invoices_due_date";

drop index if exists "public"."idx_invoices_status";

drop index if exists "public"."idx_invoices_user_id";

drop index if exists "public"."idx_notifications_queue_status_run_after";

drop index if exists "public"."idx_payment_events_created_at";

drop index if exists "public"."idx_payment_events_event_id";

drop index if exists "public"."idx_payment_events_event_type";

drop index if exists "public"."idx_payment_events_payment_link_id";

drop index if exists "public"."idx_payment_links_invoice_id";

drop index if exists "public"."idx_payment_links_razorpay_link_id";

drop index if exists "public"."idx_payment_links_status";

drop index if exists "public"."idx_transactions_booking_id";

drop index if exists "public"."idx_transactions_invoice_id";

drop index if exists "public"."invoice_emails_pkey";

drop index if exists "public"."invoice_reminders_pkey";

drop index if exists "public"."invoices_invoice_number_key";

drop index if exists "public"."invoices_pkey";

drop index if exists "public"."notifications_queue_pkey";

drop index if exists "public"."otp_codes_expires_at_idx";

drop index if exists "public"."otp_codes_phone_idx";

drop index if exists "public"."otp_codes_pkey";

drop index if exists "public"."otp_codes_user_id_idx";

drop index if exists "public"."payment_events_event_id_key";

drop index if exists "public"."payment_events_pkey";

drop index if exists "public"."payment_links_invoice_id_key";

drop index if exists "public"."payment_links_pkey";

drop index if exists "public"."payment_links_razorpay_link_id_key";

drop index if exists "public"."uq_activity_language";

drop index if exists "public"."uq_wa_templates_key";

drop index if exists "public"."wa_templates_key_lang_idx";

drop index if exists "public"."wa_templates_pkey";

drop table "public"."activity_template_mappings";

drop table "public"."invoice_emails";

drop table "public"."invoice_reminders";

drop table "public"."invoices";

drop table "public"."notifications_queue";

drop table "public"."otp_codes";

drop table "public"."payment_events";

drop table "public"."payment_links";

drop table "public"."wa_templates";

create table "realtime"."messages_2025_12_26" partition of "realtime"."messages" FOR VALUES FROM ('2025-12-26 00:00:00') TO ('2025-12-27 00:00:00');


alter table "public"."bookings" drop column "access_status";

alter table "public"."bookings" drop column "billing_cycle_anchor";

alter table "public"."bookings" drop column "is_recurring";

alter table "public"."transactions" drop column "booking_id";

alter table "public"."transactions" drop column "invoice_id";

alter table "public"."transactions" drop column "notes";

alter table "public"."transactions" drop column "payment_status";

alter table "public"."transactions" drop column "razorpay_payment_id";

alter table "public"."transactions" drop column "razorpay_payment_link_id";

alter table "public"."transactions" drop column "transaction_type";

drop type "public"."access_status";

drop type "public"."invoice_status";

drop type "public"."payment_link_status";

drop type "public"."reminder_type";

CREATE INDEX messages_2025_12_26_inserted_at_topic_idx ON realtime.messages_2025_12_26 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

CREATE UNIQUE INDEX messages_2025_12_26_pkey ON realtime.messages_2025_12_26 USING btree (id, inserted_at);

alter table "realtime"."messages_2025_12_26" add constraint "messages_2025_12_26_pkey" PRIMARY KEY using index "messages_2025_12_26_pkey";

set check_function_bodies = off;

create or replace view "public"."admin_assignment_roster_v" as  SELECT ab.assignment_id,
    b.booking_id,
    b.user_id AS member_id,
    ((b.first_name || ' '::text) || b.last_name) AS full_name,
    b.email,
    att.status,
    att.marked_at,
    att.marked_by
   FROM ((assignment_bookings ab
     JOIN bookings b ON ((b.booking_id = ab.booking_id)))
     LEFT JOIN class_attendance att ON (((att.assignment_id = ab.assignment_id) AND (att.member_id = b.user_id))));


create or replace view "public"."assignment_bookings_view_roster" as  SELECT ab.assignment_id,
    b.booking_id,
    b.user_id,
    ((b.first_name || ' '::text) || b.last_name) AS full_name,
    b.email,
    ca.status,
    ca.notes,
    ca.marked_at
   FROM ((assignment_bookings ab
     JOIN bookings b ON ((b.booking_id = ab.booking_id)))
     LEFT JOIN class_attendance ca ON (((ca.assignment_id = ab.assignment_id) AND (ca.member_id = b.user_id))));


create or replace view "public"."instructor_upcoming_classes_v" as  SELECT ca.id AS assignment_id,
    ca.instructor_id,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.schedule_type,
    ca.class_status,
    ca.payment_status,
    ca.payment_amount,
    ca.override_payment_amount,
    COALESCE(ca.override_payment_amount, ca.payment_amount) AS final_payment_amount,
    ca.timezone,
    ca.attendance_locked,
    COALESCE(sum(((att.status = ANY (ARRAY['present'::attendance_status_enum, 'late'::attendance_status_enum, 'makeup_completed'::attendance_status_enum])))::integer), (0)::bigint) AS present_count,
    COALESCE(sum(((att.status = 'no_show'::attendance_status_enum))::integer), (0)::bigint) AS no_show_count,
    COALESCE(avg(NULLIF(cr.rating, 0)), (0)::numeric) AS avg_rating,
    count(cr.id) AS rating_count
   FROM ((class_assignments ca
     LEFT JOIN class_attendance att ON ((att.assignment_id = ca.id)))
     LEFT JOIN class_ratings cr ON ((cr.assignment_id = ca.id)))
  WHERE ((ca.date >= CURRENT_DATE) AND (ca.date <= (CURRENT_DATE + '60 days'::interval)))
  GROUP BY ca.id;


create or replace view "public"."transactions_with_user" as  SELECT t.id,
    t.user_id,
    t.subscription_id,
    t.amount,
    t.currency,
    t.status,
    t.payment_method,
    t.stripe_payment_intent_id,
    t.description,
    t.created_at,
    t.updated_at,
    t.billing_plan_type,
    t.billing_period_month,
    t.category,
    t.user_email,
    t.user_full_name,
    COALESCE(t.user_email, (u.email)::text) AS payer_email,
    COALESCE(t.user_full_name, p.full_name, NULLIF((u.raw_user_meta_data ->> 'full_name'::text), ''::text)) AS payer_full_name
   FROM ((transactions t
     LEFT JOIN auth.users u ON ((t.user_id = u.id)))
     LEFT JOIN profiles p ON ((p.id = t.user_id)));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."user_engagement_metrics" as  SELECT p.user_id,
    p.email,
    p.full_name,
    count(b.id) AS total_bookings,
    (0)::bigint AS attended_classes,
    (0)::bigint AS articles_viewed,
    GREATEST(p.created_at, p.updated_at) AS last_activity,
        CASE
            WHEN (p.updated_at >= (CURRENT_DATE - '7 days'::interval)) THEN 'active'::text
            WHEN (p.updated_at >= (CURRENT_DATE - '30 days'::interval)) THEN 'inactive'::text
            ELSE 'dormant'::text
        END AS engagement_status
   FROM (profiles p
     LEFT JOIN bookings b ON ((p.user_id = b.user_id)))
  GROUP BY p.user_id, p.email, p.full_name, p.created_at, p.updated_at;


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();


