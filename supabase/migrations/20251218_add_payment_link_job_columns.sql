-- Add scheduling and processing timestamp columns to payment_link_jobs
ALTER TABLE IF EXISTS public.payment_link_jobs
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_finished_at timestamptz;

-- Backfill next_run_at from scheduled_at where present
UPDATE public.payment_link_jobs
SET next_run_at = COALESCE(scheduled_at, now())
WHERE next_run_at IS NULL;

-- Add an index to efficiently select due jobs
CREATE INDEX IF NOT EXISTS idx_payment_link_jobs_next_run_at ON public.payment_link_jobs(next_run_at);
