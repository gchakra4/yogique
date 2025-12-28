-- Migration: create wa_templates table for storing WhatsApp (Meta) templates
create table if not exists wa_templates (
  id uuid default gen_random_uuid() primary key,
  key text not null,
  meta_name text not null,
  language text not null,
  category text,
  status text,
  components jsonb not null,
  variables jsonb default '[]'::jsonb,
  example jsonb default '[]'::jsonb,
  has_buttons boolean default false,
  button_types jsonb default '[]'::jsonb,
  approved boolean default false,
  version int default 1,
  created_by text,
  created_at timestamptz default now()
);

create unique index if not exists wa_templates_key_lang_idx on wa_templates (key, language);
