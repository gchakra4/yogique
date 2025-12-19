-- Check existing enum values for payment_link_status
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'payment_link_status'
ORDER BY e.enumsortorder;
