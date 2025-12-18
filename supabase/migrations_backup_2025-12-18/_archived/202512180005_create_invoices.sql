-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text,
  invoice_number text,
  billing_plan_type text,
  billing_period_month date,
  billing_cycle_anchor timestamptz,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  prorated_amount numeric DEFAULT 0,
  proration_detail jsonb,
  due_date date,
  generated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  invoice_status text DEFAULT 'pending',
  razorpay_link_id text,
  razorpay_link_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Idempotency: one invoice per booking + billing period
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoices_booking_billing_period ON public.invoices (booking_id, billing_period_month);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_period ON public.invoices (billing_period_month);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices (booking_id);

-- Note: keep audit columns nullable for smooth migration/backfill. Add constraints in a later migration after backfill.
