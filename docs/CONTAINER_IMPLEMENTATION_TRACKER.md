# Class Container Implementation Tracker

## 📊 Implementation Progress

**Last Updated:** January 8, 2026  
**Status:** 🟡 Ready for Implementation  
**Approval:** ⏳ Pending

---

## Module Completion Status

| Module | Tasks | Completed | Progress | Status |
|--------|-------|-----------|----------|--------|
| **1. Database Schema** | 13 | 0 | 0% | ⏳ Not Started |
| **2. Type Definitions** | 5 | 0 | 0% | ⏳ Not Started |
| **3. Services** | 8 | 0 | 0% | ⏳ Not Started |
| **4. Hooks** | 4 | 0 | 0% | ⏳ Not Started |
| **5. UI Components** | 16 | 0 | 0% | ⏳ Not Started |
| **6. Integration** | 8 | 0 | 0% | ⏳ Not Started |
| **7. Testing** | 10 | 0 | 0% | ⏳ Not Started |
| **8. Documentation** | 6 | 0 | 0% | ⏳ Not Started |

**Overall Progress:** 0 / 70 tasks (0%)

---

## 📋 Module 1: Database Schema - Class Assignment

### Phase 1: Schema Creation (Non-Destructive)

- [ ] **Task 1.1:** Create `class_containers` table with all columns
  - **File:** `supabase/migrations/20260108000000_create_class_containers.sql`
  - **Status:** ⏳ Pending
  - **Notes:** Includes all container types, capacity fields, constraints

- [ ] **Task 1.2:** Add `class_container_id` column to `class_assignments`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending
  - **Notes:** Nullable initially, will make NOT NULL after data migration

- [ ] **Task 1.3:** Add `class_container_id` column to `assignment_bookings`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending
  - **Notes:** Denormalized for performance

- [ ] **Task 1.4:** Create index `idx_class_containers_instructor`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.5:** Create index `idx_class_containers_type`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.6:** Create index `idx_class_containers_active`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.7:** Create index `idx_class_containers_package`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.8:** Add check constraint `chk_booking_count`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.9:** Add check constraint `chk_booking_capacity`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.10:** Add check constraint `chk_individual_single`
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.11:** Add table and column comments
  - **File:** Same migration as 1.1
  - **Status:** ⏳ Pending

- [ ] **Task 1.12:** Verify migration runs successfully
  - **Manual:** Run in Supabase SQL Editor
  - **Status:** ⏳ Pending
  - **Validation:** Check table exists, all indexes created

- [ ] **Task 1.13:** Document schema in README
  - **File:** Update main README or create schema doc
  - **Status:** ⏳ Pending

### Phase 2: Data Migration

- [ ] **Task 2.1:** Migrate crash courses to containers
  - **File:** `supabase/migrations/20260108000001_migrate_to_containers.sql`
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_containers WHERE container_type = 'crash_course';
    ```

- [ ] **Task 2.2:** Migrate recurring individual classes to containers
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_containers WHERE container_type = 'individual';
    ```

- [ ] **Task 2.3:** Migrate public group classes to containers
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_containers WHERE container_type = 'public_group';
    ```

- [ ] **Task 2.4:** Migrate private group classes to containers
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_containers WHERE container_type = 'private_group';
    ```

- [ ] **Task 2.5:** Link all crash course assignments to containers
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_assignments 
    WHERE schedule_type = 'crash' AND class_container_id IS NULL;
    -- Should be 0
    ```

- [ ] **Task 2.6:** Link all monthly assignments to containers
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_assignments 
    WHERE schedule_type = 'monthly' AND class_container_id IS NULL;
    -- Should be 0
    ```

- [ ] **Task 2.7:** Link all group class assignments to containers
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_assignments 
    WHERE booking_type IN ('public_group', 'private_group') 
    AND class_container_id IS NULL;
    -- Should be 0
    ```

- [ ] **Task 2.8:** Populate `assignment_bookings.class_container_id`
  - **File:** Same migration as 2.1
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM assignment_bookings WHERE class_container_id IS NULL;
    -- Should be 0
    ```

- [ ] **Task 2.9:** Validate all container booking counts are correct
  - **File:** Manual validation
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT 
        cc.id,
        cc.display_name,
        cc.current_booking_count AS recorded_count,
        COUNT(DISTINCT ab.booking_id) AS actual_count
    FROM class_containers cc
    LEFT JOIN assignment_bookings ab ON ab.class_container_id = cc.id
    GROUP BY cc.id, cc.display_name, cc.current_booking_count
    HAVING cc.current_booking_count != COUNT(DISTINCT ab.booking_id);
    -- Should return 0 rows
    ```

- [ ] **Task 2.10:** Run full validation report
  - **File:** Manual validation
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    -- Validation Report
    SELECT 
        'Total Containers' AS metric,
        COUNT(*) AS value
    FROM class_containers
    UNION ALL
    SELECT 
        'Assignments with Container' AS metric,
        COUNT(*) AS value
    FROM class_assignments WHERE class_container_id IS NOT NULL
    UNION ALL
    SELECT 
        'Assignments without Container' AS metric,
        COUNT(*) AS value
    FROM class_assignments WHERE class_container_id IS NULL
    UNION ALL
    SELECT 
        'Junction Records with Container' AS metric,
        COUNT(*) AS value
    FROM assignment_bookings WHERE class_container_id IS NOT NULL;
    ```

### Phase 3: Triggers & Functions

- [ ] **Task 3.1:** Create `update_container_booking_count()` trigger function
  - **File:** `supabase/migrations/20260108000002_container_triggers.sql`
  - **Status:** ⏳ Pending
  - **Notes:** Updates count on INSERT/UPDATE/DELETE in assignment_bookings

- [ ] **Task 3.2:** Create trigger `trg_update_container_booking_count`
  - **File:** Same migration as 3.1
  - **Status:** ⏳ Pending
  - **Trigger:** AFTER INSERT OR UPDATE OR DELETE ON assignment_bookings

- [ ] **Task 3.3:** Create `validate_container_capacity()` trigger function
  - **File:** Same migration as 3.1
  - **Status:** ⏳ Pending
  - **Notes:** Validates capacity before INSERT/UPDATE

- [ ] **Task 3.4:** Create trigger `trg_validate_container_capacity`
  - **File:** Same migration as 3.1
  - **Status:** ⏳ Pending
  - **Trigger:** BEFORE INSERT OR UPDATE ON assignment_bookings

- [ ] **Task 3.5:** Create `enforce_individual_single_booking()` function
  - **File:** Same migration as 3.1
  - **Status:** ⏳ Pending
  - **Notes:** Enforces max_booking_count = 1 for individual type

- [ ] **Task 3.6:** Create trigger `trg_enforce_individual_rule`
  - **File:** Same migration as 3.1
  - **Status:** ⏳ Pending
  - **Trigger:** BEFORE INSERT OR UPDATE ON class_containers

- [ ] **Task 3.7:** Test triggers with INSERT operation
  - **Manual:** Test in SQL Editor
  - **Status:** ⏳ Pending
  - **Test SQL:**
    ```sql
    -- Test: Try to insert booking into full container
    INSERT INTO assignment_bookings (assignment_id, booking_id, class_container_id)
    VALUES (
        (SELECT id FROM class_assignments LIMIT 1),
        'TEST-BOOKING-001',
        (SELECT id FROM class_containers 
         WHERE current_booking_count >= max_booking_count LIMIT 1)
    );
    -- Should fail with capacity error
    ```

- [ ] **Task 3.8:** Test triggers with UPDATE operation
  - **Manual:** Test in SQL Editor
  - **Status:** ⏳ Pending

- [ ] **Task 3.9:** Test triggers with DELETE operation
  - **Manual:** Test in SQL Editor
  - **Status:** ⏳ Pending

- [ ] **Task 3.10:** Verify trigger functions in production
  - **Manual:** Check production database
  - **Status:** ⏳ Pending

### Phase 4: Update T-5 Auto-Scheduling

- [ ] **Task 4.1:** Backup existing `generate_t5_invoices()` function
  - **File:** Save current function SQL
  - **Status:** ⏳ Pending

- [ ] **Task 4.2:** Modify function to create/find containers
  - **File:** `supabase/migrations/20260108000003_update_t5_container_logic.sql`
  - **Status:** ⏳ Pending
  - **Notes:** Add container lookup logic before class generation

- [ ] **Task 4.3:** Update function to set `class_container_id` on new assignments
  - **File:** Same migration as 4.2
  - **Status:** ⏳ Pending

- [ ] **Task 4.4:** Ensure container type is set correctly
  - **File:** Same migration as 4.2
  - **Status:** ⏳ Pending

- [ ] **Task 4.5:** Test T-5 function in development
  - **Manual:** Trigger function manually with test data
  - **Status:** ⏳ Pending
  - **Test SQL:**
    ```sql
    -- Manually call function
    SELECT generate_t5_invoices();
    
    -- Verify new assignments have container_id
    SELECT COUNT(*) FROM class_assignments 
    WHERE created_at > NOW() - INTERVAL '1 minute'
    AND class_container_id IS NULL;
    -- Should be 0
    ```

- [ ] **Task 4.6:** Deploy updated function to production
  - **Manual:** Run migration in production
  - **Status:** ⏳ Pending

- [ ] **Task 4.7:** Monitor T-5 automation logs
  - **Manual:** Check cron job logs
  - **Status:** ⏳ Pending

### Phase 5: Final Constraints

- [ ] **Task 5.1:** Validate all assignments have containers
  - **Manual:** Run validation query
  - **Status:** ⏳ Pending
  - **Validation Query:**
    ```sql
    SELECT COUNT(*) FROM class_assignments WHERE class_container_id IS NULL;
    -- MUST be 0 before proceeding
    ```

- [ ] **Task 5.2:** Make `class_container_id` NOT NULL in `class_assignments`
  - **File:** `supabase/migrations/20260108000004_container_constraints.sql`
  - **Status:** ⏳ Pending
  - **⚠️ WARNING:** Only run after validating Task 5.1

- [ ] **Task 5.3:** Add check constraint to prevent orphaned assignments
  - **File:** Same migration as 5.2
  - **Status:** ⏳ Pending

- [ ] **Task 5.4:** Create view for container summary
  - **File:** Same migration as 5.2
  - **Status:** ⏳ Pending
  - **View SQL:**
    ```sql
    CREATE OR REPLACE VIEW container_summary_v AS
    SELECT 
        cc.id,
        cc.display_name,
        cc.container_type,
        cc.max_booking_count,
        cc.current_booking_count,
        COUNT(DISTINCT ca.id) AS assignment_count,
        COUNT(DISTINCT ab.booking_id) AS booking_count,
        SUM(ca.payment_amount) AS total_revenue
    FROM class_containers cc
    LEFT JOIN class_assignments ca ON ca.class_container_id = cc.id
    LEFT JOIN assignment_bookings ab ON ab.class_container_id = cc.id
    GROUP BY cc.id, cc.display_name, cc.container_type, 
             cc.max_booking_count, cc.current_booking_count;
    ```

---

## 📋 Module 2: Type Definitions - Class Assignment

- [ ] **Task 2.1:** Create `container.types.ts` file
  - **File:** `src/features/class-assignment/types/container.types.ts`
  - **Status:** ⏳ Pending

- [ ] **Task 2.2:** Define `ContainerType` enum
  - **File:** Same as 2.1
  - **Status:** ⏳ Pending

- [ ] **Task 2.3:** Define `ClassContainer` interface
  - **File:** Same as 2.1
  - **Status:** ⏳ Pending

- [ ] **Task 2.4:** Define `ContainerCapacityInfo` interface
  - **File:** Same as 2.1
  - **Status:** ⏳ Pending

- [ ] **Task 2.5:** Define `ContainerCreationFormData` interface
  - **File:** Same as 2.1
  - **Status:** ⏳ Pending

- [ ] **Task 2.6:** Update `ClassAssignment` type to include `class_container_id`
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/types.ts`
  - **Status:** ⏳ Pending

- [ ] **Task 2.7:** Update `AssignmentBooking` type to include `class_container_id`
  - **File:** Same as 2.6
  - **Status:** ⏳ Pending

- [ ] **Task 2.8:** Export all container types from index
  - **File:** Create or update `src/features/class-assignment/types/index.ts`
  - **Status:** ⏳ Pending

---

## 📋 Module 3: Services - Class Assignment

- [ ] **Task 3.1:** Create `containerService.ts` file
  - **File:** `src/features/class-assignment/services/containerService.ts`
  - **Status:** ⏳ Pending

- [ ] **Task 3.2:** Implement `fetchContainers()` method
  - **File:** Same as 3.1
  - **Status:** ⏳ Pending
  - **Notes:** Includes joins for instructor, class_type, package

- [ ] **Task 3.3:** Implement `createContainer()` method
  - **File:** Same as 3.1
  - **Status:** ⏳ Pending
  - **Validation:** Check individual type = 1 capacity

- [ ] **Task 3.4:** Implement `updateContainerCapacity()` method
  - **File:** Same as 3.1
  - **Status:** ⏳ Pending
  - **Validation:** Cannot reduce below current count

- [ ] **Task 3.5:** Implement `attachBookingToContainer()` method
  - **File:** Same as 3.1
  - **Status:** ⏳ Pending
  - **Validation:** Check capacity before insert

- [ ] **Task 3.6:** Add error handling to all methods
  - **File:** Same as 3.1
  - **Status:** ⏳ Pending

- [ ] **Task 3.7:** Create `containerCapacityService.ts` file
  - **File:** `src/features/class-assignment/services/containerCapacityService.ts`
  - **Status:** ⏳ Pending

- [ ] **Task 3.8:** Implement capacity calculation helpers
  - **File:** Same as 3.7
  - **Status:** ⏳ Pending

---

## 📋 Module 4: Hooks - Class Assignment

- [ ] **Task 4.1:** Create `useContainers()` hook
  - **File:** `src/features/class-assignment/hooks/useContainers.ts`
  - **Status:** ⏳ Pending
  - **Functionality:** Fetch and cache container list

- [ ] **Task 4.2:** Create `useContainerValidation()` hook
  - **File:** `src/features/class-assignment/hooks/useContainerValidation.ts`
  - **Status:** ⏳ Pending
  - **Functionality:** Real-time capacity validation

- [ ] **Task 4.3:** Update `useClassAssignmentData()` to fetch containers
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/hooks/useClassAssignmentData.ts`
  - **Status:** ⏳ Pending
  - **Changes:** Add container fetch, state management

- [ ] **Task 4.4:** Add container filtering to existing hooks
  - **File:** Various hook files
  - **Status:** ⏳ Pending

---

## 📋 Module 5: UI Components - Class Assignment

### Container Creation Modal

- [ ] **Task 5.1:** Create `ContainerCreationModal/index.tsx`
  - **File:** `src/features/class-assignment/components/ContainerCreationModal/index.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.2:** Create `ContainerTypeSelector.tsx`
  - **File:** `src/features/class-assignment/components/ContainerCreationModal/ContainerTypeSelector.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.3:** Create `CapacityConfigPanel.tsx`
  - **File:** `src/features/class-assignment/components/ContainerCreationModal/CapacityConfigPanel.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.4:** Create `ContainerPreview.tsx`
  - **File:** `src/features/class-assignment/components/ContainerCreationModal/ContainerPreview.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.5:** Add form validation to modal
  - **File:** Index file for modal
  - **Status:** ⏳ Pending

- [ ] **Task 5.6:** Handle API errors in modal
  - **File:** Index file for modal
  - **Status:** ⏳ Pending

### Container Capacity Components

- [ ] **Task 5.7:** Create `ContainerCapacityEditModal.tsx`
  - **File:** `src/features/class-assignment/components/ContainerCapacityEditModal.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.8:** Create `ContainerCapacityIndicator.tsx`
  - **File:** `src/features/class-assignment/components/ContainerCapacityIndicator.tsx`
  - **Status:** ⏳ Pending
  - **Design:** Progress bar + text display

### Modified Existing Components

- [ ] **Task 5.9:** Update `AssignmentListView.tsx` grouping logic
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/AssignmentListView.tsx`
  - **Status:** ⏳ Pending
  - **Changes:** Group by container_id only, remove "Unknown Class" fallback

- [ ] **Task 5.10:** Add container info to group headers
  - **File:** Same as 5.9
  - **Status:** ⏳ Pending

- [ ] **Task 5.11:** Add capacity indicator to group headers
  - **File:** Same as 5.9
  - **Status:** ⏳ Pending

- [ ] **Task 5.12:** Update `AssignmentForm.tsx` to include container selection
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/AssignmentForm.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.13:** Add container capacity display to form
  - **File:** Same as 5.12
  - **Status:** ⏳ Pending

- [ ] **Task 5.14:** Disable form submission if container full
  - **File:** Same as 5.12
  - **Status:** ⏳ Pending

- [ ] **Task 5.15:** Update `ClassDetailsPopup.tsx` to show container info
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/ClassDetailsPopup.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 5.16:** Add container link/navigation to popup
  - **File:** Same as 5.15
  - **Status:** ⏳ Pending

---

## 📋 Module 6: Integration - Class Assignment

- [ ] **Task 6.1:** Update `ClassAssignmentManager.tsx` grouping logic
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/ClassAssignmentManager.tsx`
  - **Status:** ⏳ Pending
  - **Changes:** Replace existing group logic with container-based

- [ ] **Task 6.2:** Modify `createAssignment` workflow
  - **File:** Assignment creation service
  - **Status:** ⏳ Pending
  - **Changes:** Include container validation

- [ ] **Task 6.3:** Update assignment deletion to decrement container count
  - **File:** ClassAssignmentManager or service
  - **Status:** ⏳ Pending
  - **Notes:** Should be automatic via trigger, but verify

- [ ] **Task 6.4:** Add container filter to `AdvancedFilters` component
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/AdvancedFilters.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 6.5:** Update calendar view to show container grouping
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/CalendarView.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 6.6:** Add container column to analytics view
  - **File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/AnalyticsView.tsx`
  - **Status:** ⏳ Pending

- [ ] **Task 6.7:** Update search to include container names
  - **File:** ClassAssignmentManager main file
  - **Status:** ⏳ Pending

- [ ] **Task 6.8:** Add container info to exports/reports
  - **File:** Any export/report components
  - **Status:** ⏳ Pending

---

## 📋 Module 7: Testing - Class Assignment

### Functional Tests

- [ ] **Task 7.1:** Test create individual container
  - **Test:** Create container with capacity = 1
  - **Status:** ⏳ Pending
  - **Expected:** Success, max_booking_count = 1

- [ ] **Task 7.2:** Test create public_group container
  - **Test:** Create container with capacity = 20
  - **Status:** ⏳ Pending
  - **Expected:** Success, max_booking_count = 20

- [ ] **Task 7.3:** Test capacity enforcement - cannot exceed
  - **Test:** Try to attach booking when container at capacity
  - **Status:** ⏳ Pending
  - **Expected:** Error message, booking not attached

- [ ] **Task 7.4:** Test capacity change - increase allowed
  - **Test:** Increase max_booking_count from 10 to 20
  - **Status:** ⏳ Pending
  - **Expected:** Success

- [ ] **Task 7.5:** Test capacity change - cannot reduce below current
  - **Test:** Try to reduce capacity from 20 to 10 when current = 15
  - **Status:** ⏳ Pending
  - **Expected:** Error, capacity not changed

- [ ] **Task 7.6:** Test individual type capacity lock
  - **Test:** Try to change individual container capacity to 2
  - **Status:** ⏳ Pending
  - **Expected:** Error, capacity remains 1

### Integration Tests

- [ ] **Task 7.7:** Test auto-scheduled classes appear in container
  - **Test:** Trigger T-5 automation, check new classes have container_id
  - **Status:** ⏳ Pending
  - **Expected:** All new classes linked to correct container

- [ ] **Task 7.8:** Test container count updates on assignment deletion
  - **Test:** Delete assignment, verify container count decrements
  - **Status:** ⏳ Pending
  - **Expected:** current_booking_count decreases by 1

- [ ] **Task 7.9:** Test UI grouping by container
  - **Test:** View assignment list, verify grouped by container
  - **Status:** ⏳ Pending
  - **Expected:** No "Unknown Class" groups

- [ ] **Task 7.10:** Test end-to-end: Create container → Add assignment → View in list
  - **Test:** Full workflow from container creation to viewing
  - **Status:** ⏳ Pending
  - **Expected:** Smooth workflow, data consistent

---

## 📋 Module 8: Documentation - Class Assignment

- [ ] **Task 8.1:** Update main README with container architecture
  - **File:** `README.md`
  - **Status:** ⏳ Pending

- [ ] **Task 8.2:** Create container management admin guide
  - **File:** `docs/CONTAINER_MANAGEMENT_GUIDE.md`
  - **Status:** ⏳ Pending

- [ ] **Task 8.3:** Document container type rules and capacities
  - **File:** Same as 8.2 or separate reference doc
  - **Status:** ⏳ Pending

- [ ] **Task 8.4:** Create migration runbook
  - **File:** `docs/CONTAINER_MIGRATION_RUNBOOK.md`
  - **Status:** ⏳ Pending

- [ ] **Task 8.5:** Document T-5 automation changes
  - **File:** Update `docs/T5_AUTOMATION_DEPLOYMENT.md`
  - **Status:** ⏳ Pending

- [ ] **Task 8.6:** Create troubleshooting guide
  - **File:** `docs/CONTAINER_TROUBLESHOOTING.md`
  - **Status:** ⏳ Pending

---

## 🚨 Critical Path Items

These tasks MUST be completed in order and cannot be skipped:

1. ✅ **Approval of implementation plan** (Current step)
2. Create `class_containers` table (Task 1.1 - 1.13)
3. Migrate all existing data (Task 2.1 - 2.10)
4. Validate data migration (All counts match)
5. Create triggers (Task 3.1 - 3.10)
6. Update T-5 function (Task 4.1 - 4.7)
7. Make container_id NOT NULL (Task 5.1 - 5.4)
8. Frontend implementation (Modules 2-6)
9. Full testing (Module 7)
10. Documentation (Module 8)

---

## 🔍 Validation Queries

Run these after each phase to verify correctness:

### After Phase 1: Schema Creation
```sql
-- Check table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'class_containers'
);

-- Check all indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'class_containers';
```

### After Phase 2: Data Migration
```sql
-- Check all assignments have containers
SELECT COUNT(*) AS orphaned_assignments
FROM class_assignments 
WHERE class_container_id IS NULL;
-- Should be 0

-- Check container counts match reality
SELECT 
    cc.display_name,
    cc.current_booking_count AS recorded,
    COUNT(DISTINCT ab.booking_id) AS actual,
    CASE 
        WHEN cc.current_booking_count = COUNT(DISTINCT ab.booking_id) THEN '✓'
        ELSE '✗'
    END AS status
FROM class_containers cc
LEFT JOIN assignment_bookings ab ON ab.class_container_id = cc.id
GROUP BY cc.id, cc.display_name, cc.current_booking_count;
```

### After Phase 3: Triggers
```sql
-- Test trigger by inserting test booking
BEGIN;
    INSERT INTO assignment_bookings (assignment_id, booking_id, class_container_id)
    VALUES (
        (SELECT id FROM class_assignments LIMIT 1),
        'TEST-' || gen_random_uuid(),
        (SELECT id FROM class_containers LIMIT 1)
    );
    
    -- Check count increased
    SELECT current_booking_count 
    FROM class_containers 
    WHERE id = (SELECT class_container_id FROM assignment_bookings 
                WHERE booking_id LIKE 'TEST-%' LIMIT 1);
ROLLBACK; -- Rollback test
```

---

## 📊 Progress Dashboard

```
╔════════════════════════════════════════════════════════════╗
║          CLASS CONTAINER IMPLEMENTATION STATUS             ║
╠════════════════════════════════════════════════════════════╣
║  Phase 1: Database Schema          [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Phase 2: Data Migration           [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Phase 3: Triggers & Functions     [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Phase 4: T-5 Updates              [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Phase 5: Constraints              [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Frontend: Types                   [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Frontend: Services                [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Frontend: Hooks                   [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Frontend: Components              [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Frontend: Integration             [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Testing                           [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
║  Documentation                     [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
╠════════════════════════════════════════════════════════════╣
║  OVERALL PROGRESS                  [ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ ]   0% ║
╚════════════════════════════════════════════════════════════╝
```

---

## 📝 Update Instructions

After completing a task:
1. Change `[ ]` to `[x]` in the task checkbox
2. Update the status from ⏳ to ✅
3. Add completion date and notes if needed
4. Update the progress percentage
5. Update the progress dashboard visualization
6. Commit changes with message: `chore: update container tracker - completed task X.Y`

---

**Last Updated By:** AI Assistant  
**Next Update Due:** After first task completion  
**Estimated Completion:** TBD based on development velocity
