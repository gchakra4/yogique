-- Alter `wa_templates` to include activity mappings and default variables
alter table wa_templates
  add column if not exists activities jsonb default '[]'::jsonb,
  add column if not exists default_vars jsonb default '{}'::jsonb;

-- Indexing note: activities are read by application logic; JSONB index can be added if needed later.
