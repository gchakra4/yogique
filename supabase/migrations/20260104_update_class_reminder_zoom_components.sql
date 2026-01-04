-- Update components and variables for class_reminder_zoom (en_IN)
-- Use dollar-quoting to avoid truncation issues when storing long JSON

UPDATE public.wa_templates
SET components = $$[
  {
    "type": "HEADER",
    "format": "TEXT",
    "text": "Next Class Details"
  },
  {
    "type": "BODY",
    "text": "Namaste {{1}},\n\nThis is a reminder for your upcoming Yogique class.\n\n📅 Date: {{2}}\n🕒 Time: {{3}}\n\nJoin using the link below 👇\n{{4}}\n\nSee you in class 🙏"
  },
  {
    "type": "FOOTER",
    "text": "Powered by Sampurnayogam LLM"
  }
]$$::jsonb,
    variables = $$["1","2","3","4"]$$::jsonb,
    has_buttons = false,
    button_types = $$[]$$::jsonb
WHERE meta_name = 'class_reminder_zoom' AND language = 'en_IN';

-- Verify the change:
-- SELECT meta_name, language, jsonb_pretty(components) FROM public.wa_templates WHERE meta_name='class_reminder_zoom' AND language='en_IN';
