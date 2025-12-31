# Phase 1 Migration - Manual Application Guide

## Migration Files Created
✅ `supabase/migrations/20250101000000_phase1_schema_updates.sql` - Main migration
✅ `supabase/migrations/20250101000000_phase1_schema_updates_rollback.sql` - Rollback

## Manual Application Steps

Since there are migration history conflicts, apply the migration manually:

### Option 1: Via Supabase Dashboard (RECOMMENDED)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy contents of `20250101000000_phase1_schema_updates.sql`
3. Paste and execute
4. Verify success

### Option 2: Via SQL Editor in local client
1. Open your preferred SQL client connected to Supabase
2. Run the migration SQL file
3. Verify columns exist

### Option 3: Via CLI (if fixed)
```bash
supabase migration repair --status applied 20250101000000
supabase db push
```

## Verification Queries

### Check if columns exist:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'class_assignments' 
  AND column_name IN ('is_adjustment', 'adjustment_reason', 'calendar_month')
ORDER BY column_name;
```

Expected output:
```
column_name        | data_type | is_nullable | column_default
-------------------+-----------+-------------+---------------
adjustment_reason  | text      | YES         | NULL
calendar_month     | text      | YES         | NULL
is_adjustment      | boolean   | NO          | false
```

### Check if view exists:
```sql
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'instructor_classes_safe_v';
```

### Check if trigger exists:
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trg_set_calendar_month';
```

## TypeScript Types
✅ Updated: `src/features/dashboard/components/Modules/ClassAssignmentManager/types.ts`
- Added `is_adjustment` to ClassAssignment interface
- Added `adjustment_reason` to ClassAssignment interface  
- Added `calendar_month` to ClassAssignment interface
- Added `access_status` to Booking interface
- Added `billing_cycle_anchor` to Booking interface
- Added `is_recurring` to Booking interface

## What This Migration Does

### 1. New Columns in `class_assignments`:
- **is_adjustment** (boolean, default false) - Marks auto-generated classes
- **adjustment_reason** (text, nullable) - Explains why adjustment was needed
- **calendar_month** (text, nullable) - YYYY-MM format for billing periods

### 2. New Indexes:
- `idx_class_assignments_calendar_month` - For monthly queries
- `idx_class_assignments_is_adjustment` - For adjustment reports

### 3. New View: `instructor_classes_safe_v`
- Strips ALL payment/pricing information
- Shows only schedule, students, attendance
- Enforces RLS for instructor access

### 4. New View: `adjustment_classes_report_v`
- Admin-only view for monitoring adjustments
- Shows all adjustment classes with reasons

### 5. New Trigger: `trg_set_calendar_month`
- Auto-populates `calendar_month` from `date`
- Only for monthly schedule types

### 6. Data Backfill:
- Updates existing monthly assignments with calendar_month

## Rollback Instructions

If you need to undo the migration:
```sql
-- Run the rollback file
-- File: supabase/migrations/20250101000000_phase1_schema_updates_rollback.sql
```

Or execute manually:
```sql
DROP TRIGGER IF EXISTS trg_set_calendar_month ON public.class_assignments;
DROP FUNCTION IF EXISTS public.set_calendar_month_on_insert() CASCADE;
DROP VIEW IF EXISTS public.adjustment_classes_report_v CASCADE;
DROP VIEW IF EXISTS public.instructor_classes_safe_v CASCADE;
DROP INDEX IF EXISTS public.idx_class_assignments_calendar_month;
DROP INDEX IF EXISTS public.idx_class_assignments_is_adjustment;
ALTER TABLE public.class_assignments DROP COLUMN IF EXISTS calendar_month CASCADE;
ALTER TABLE public.class_assignments DROP COLUMN IF EXISTS adjustment_reason CASCADE;
ALTER TABLE public.class_assignments DROP COLUMN IF EXISTS is_adjustment CASCADE;
```

## Testing Checklist

After applying migration:

- [ ] Verify columns exist in `class_assignments`
- [ ] Verify indexes were created
- [ ] Verify `instructor_classes_safe_v` view exists
- [ ] Verify `adjustment_classes_report_v` view exists
- [ ] Verify trigger `trg_set_calendar_month` exists
- [ ] Test creating a new monthly assignment (should auto-set calendar_month)
- [ ] Test querying instructor view (should not see payment_amount)
- [ ] No TypeScript errors in VS Code
- [ ] Existing assignments still visible in UI

## Next Steps

Once Phase 1 is verified:
- ✅ Schema ready for Phase 3 (Calendar Month Logic)
- ✅ Types updated for adjustment class tracking
- ✅ Instructor views secured (no pricing visible)
- Ready to implement calendar-bound scheduling
