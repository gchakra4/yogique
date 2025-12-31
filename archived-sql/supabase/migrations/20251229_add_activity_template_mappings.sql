-- Create table to map application activities to WA template keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.activity_template_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity text NOT NULL,
  template_key text NOT NULL,
  template_language text DEFAULT 'en',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_template_mappings_activity ON public.activity_template_mappings (activity);

-- optional: ensure unique per activity+language
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_language ON public.activity_template_mappings (activity, template_language);
