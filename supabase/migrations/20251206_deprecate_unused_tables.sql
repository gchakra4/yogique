-- Deprecate unused tables safely
-- Pattern: rename -> monitor -> backup -> drop
-- Fill only for tables you are confident have no writers.

BEGIN;

-- Renames for zero-reference tables (from runtime scan)
ALTER TABLE public.admin_users RENAME TO __deprecated_admin_users_20251206;
ALTER TABLE public.assignments_with_timezone RENAME TO __deprecated_assignments_with_timezone_20251206;
ALTER TABLE public.blog_posts RENAME TO __deprecated_blog_posts_20251206;
ALTER TABLE public.class_assignment_templates RENAME TO __deprecated_class_assignment_templates_20251206;
ALTER TABLE public.class_bookings RENAME TO __deprecated_class_bookings_20251206;
ALTER TABLE public.class_feedback RENAME TO __deprecated_class_feedback_20251206;
ALTER TABLE public.instructor_availability RENAME TO __deprecated_instructor_availability_20251206;
ALTER TABLE public.instructor_ratings RENAME TO __deprecated_instructor_ratings_20251206;
ALTER TABLE public.manual_class_selections RENAME TO __deprecated_manual_class_selections_20251206;
ALTER TABLE public.payment_methods RENAME TO __deprecated_payment_methods_20251206;
ALTER TABLE public.referrals RENAME TO __deprecated_referrals_20251206;
ALTER TABLE public.scheduled_classes RENAME TO __deprecated_scheduled_classes_20251206;
ALTER TABLE public.subscription_plans RENAME TO __deprecated_subscription_plans_20251206;
ALTER TABLE public.system_metrics RENAME TO __deprecated_system_metrics_20251206;
ALTER TABLE public.user_activity RENAME TO __deprecated_user_activity_20251206;
ALTER TABLE public.user_packages RENAME TO __deprecated_user_packages_20251206;
ALTER TABLE public.user_preferences RENAME TO __deprecated_user_preferences_20251206;
ALTER TABLE public.user_subscriptions RENAME TO __deprecated_user_subscriptions_20251206;
ALTER TABLE public.waitlist RENAME TO __deprecated_waitlist_20251206;
ALTER TABLE public.yoga_queries RENAME TO __deprecated_yoga_queries_20251206;
ALTER TABLE public.zoom_tokens RENAME TO __deprecated_zoom_tokens_20251206;

COMMIT;

-- Follow-up (after 7–14 days of monitoring):
-- BEGIN;
-- DROP TABLE IF EXISTS public.__deprecated_phone_otps_20251206;
-- DROP TABLE IF EXISTS public.__deprecated_article_views_20251206;
-- COMMIT;
