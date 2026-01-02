-- Create a table to store configuration secrets
CREATE TABLE IF NOT EXISTS public.cron_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only allow postgres/service role to access
ALTER TABLE public.cron_secrets ENABLE ROW LEVEL SECURITY;

-- Create a function to get secrets safely (trim whitespace/newlines and strip surrounding quotes)
CREATE OR REPLACE FUNCTION public.get_secret(secret_key TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    -- remove all whitespace (including newlines), then strip surrounding single/double quotes if present
    regexp_replace(
      regexp_replace(value, '\s', '', 'g'),
      '^["'']+|["'']+$',
      ''
    )
  FROM public.cron_secrets
  WHERE key = secret_key
  LIMIT 1;
$$;

-- Insert placeholder values (update these after migration)
INSERT INTO public.cron_secrets (key, value, description) VALUES
  ('supabase_url', 'https://placeholder.supabase.co', 'Supabase project URL'),
  ('service_role_key', 'placeholder-key', 'Supabase service role key'),
  ('cron_secret', 'placeholder-secret', 'Custom cron authentication secret'),
  ('edge_function_url', 'https://placeholder.supabase.co/functions/v1', 'Edge function base URL'),
  ('scheduler_secret_token', 'placeholder-token', 'Scheduler authentication token')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.cron_secrets IS 'Configuration secrets for pg_cron jobs';
