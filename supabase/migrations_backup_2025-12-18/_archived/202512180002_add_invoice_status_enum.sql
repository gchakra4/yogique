-- Add invoice_status enum and convert existing invoices.invoice_status to use it
-- 1) Normalize unexpected values to 'pending'
UPDATE public.invoices
SET invoice_status = 'pending'
WHERE invoice_status IS NULL OR invoice_status NOT IN ('pending','due_today','paid','overdue_grace','overdue_locked');

-- 2) Create enum type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status_enum') THEN
    CREATE TYPE public.invoice_status_enum AS ENUM ('pending','due_today','paid','overdue_grace','overdue_locked');
  END IF;
END$$;

-- 3) Drop default (prevents automatic cast error), then alter column type to enum using a safe cast
ALTER TABLE public.invoices ALTER COLUMN invoice_status DROP DEFAULT;
ALTER TABLE public.invoices
  ALTER COLUMN invoice_status TYPE public.invoice_status_enum USING invoice_status::public.invoice_status_enum;

-- 4) Set default
ALTER TABLE public.invoices ALTER COLUMN invoice_status SET DEFAULT 'pending';

-- 5) Add index if desired (already present as idx_invoices_status on text column; keeping it)
CREATE INDEX IF NOT EXISTS idx_invoices_status_enum ON public.invoices (invoice_status);
