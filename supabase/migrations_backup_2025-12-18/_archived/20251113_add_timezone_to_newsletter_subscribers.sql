-- Add timezone column for lead-magnet signups
ALTER TABLE public.newsletter_subscribers
    ADD COLUMN IF NOT EXISTS timezone text;

-- Ensure subscribed_at defaults to now()
ALTER TABLE public.newsletter_subscribers
    ALTER COLUMN subscribed_at SET DEFAULT now();

-- Optional: create an index on timezone if you'll query by it
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_timezone
    ON public.newsletter_subscribers (timezone);
