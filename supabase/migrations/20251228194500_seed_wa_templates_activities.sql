-- Seed activity mappings and default vars for common templates
-- Class reminder
UPDATE wa_templates
SET activities = ' ["class_reminder"] '::jsonb,
    default_vars = '{"title":"{{title}}","class_time":"{{class_time}}","zoom_link":"{{zoom_link}}"}'::jsonb
WHERE key = 'class_reminder_zoom';

-- Payment due reminder
UPDATE wa_templates
SET activities = ' ["payment_due"] '::jsonb,
    default_vars = '{"amount":"{{amount}}","due_date":"{{due_date}}"}'::jsonb
WHERE key = 'payment_overdue_reminder';

-- Payment success
UPDATE wa_templates
SET activities = ' ["payment_success"] '::jsonb,
    default_vars = '{"amount":"{{amount}}","payment_id":"{{payment_id}}"}'::jsonb
WHERE key = 'yogique_payment_success';
