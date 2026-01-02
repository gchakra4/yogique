-- Setup database configuration parameters
-- ⚠️ IMPORTANT: Replace placeholder values with your actual credentials

ALTER DATABASE postgres SET app.supabase_url = 'https://your-project-ref.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key-here';
ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret-here';
ALTER DATABASE postgres SET app.edge_function_url = 'https://your-project-ref.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.scheduler_secret_token = 'your-scheduler-token-here';

-- Verify configuration
SELECT 
  current_setting('app.supabase_url') as supabase_url,
  LENGTH(current_setting('app.service_role_key')) as key_length,
  current_setting('app.edge_function_url') as edge_url;

COMMENT ON DATABASE postgres IS 'pg_cron configuration set on ' || NOW()::TEXT;
