-- Add invoice_id to transactions
ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS invoice_id uuid;

CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON public.transactions (invoice_id);
