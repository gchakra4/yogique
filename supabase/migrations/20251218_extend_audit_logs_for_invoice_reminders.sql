-- Extend public.audit_logs to support invoice reminder audit rows
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS audit_type text,
  ADD COLUMN IF NOT EXISTS invoice_id uuid,
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS attempt integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS provider_response jsonb,
  ADD COLUMN IF NOT EXISTS reminder_status text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Indexes to support reminder queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_invoice_id ON public.audit_logs (invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_sent_at ON public.audit_logs (sent_at);
-- Partial index for fast reads of invoice_reminder rows
CREATE INDEX IF NOT EXISTS idx_audit_logs_audit_type_invoice_reminder ON public.audit_logs (created_at) WHERE audit_type = 'invoice_reminder';

-- Note: don't add strict NOT NULL/check constraints here; backfill first and then tighten constraints in a later migration.
