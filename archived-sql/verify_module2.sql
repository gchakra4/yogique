-- Module 2 Verification Queries

-- 1. Check functions exist (expect 4 rows)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'get_business_tax_rate',
      'count_scheduled_classes',
      'generate_first_invoice',
      'generate_monthly_invoices'
  )
ORDER BY routine_name;

-- 2. Check trigger exists (expect 1 row)
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'bookings_generate_first_invoice_trigger';

-- 3. Check view exists (expect 1 row)
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'invoices_pending_generation_v';

-- 4. Test tax rate function
SELECT public.get_business_tax_rate() AS current_tax_rate;
