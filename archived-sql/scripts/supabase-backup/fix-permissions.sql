-- Fix permissions after migration
-- Run this on the new project to fix "permission denied" errors

-- First, list what tables exist
SELECT 'Existing tables:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Grant ALL permissions to authenticated role (for app users)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant ALL permissions to service_role (for Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant USAGE on schema to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Enable RLS on all tables (if not already enabled)
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- List all tables and their RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show current grants on user_roles and notifications_queue
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name IN ('user_roles', 'notifications_queue', 'bookings', 'users')
ORDER BY table_name, grantee, privilege_type;
