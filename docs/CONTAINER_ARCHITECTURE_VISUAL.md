# Class Container Architecture - Visual Guide

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLASS CONTAINER SYSTEM                            │
│                     (Single Source of Truth)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌─────────────────────┐         ┌─────────────────────┐
        │   Database Layer    │         │   Frontend Layer     │
        │   (Supabase)        │         │   (React/TypeScript) │
        └─────────────────────┘         └─────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Validation & Enforcement    │
                    │   (Triggers + Client-side)    │
                    └───────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Core Tables                                 │
└─────────────────────────────────────────────────────────────────────┘

    class_containers                 class_assignments              bookings
    ┌──────────────────┐            ┌─────────────────┐         ┌──────────────┐
    │ id (PK)          │◄───────────│ class_container │         │ booking_id   │
    │ container_code   │            │     _id (FK)    │         │ (TEXT PK)    │
    │ container_type   │            │ instructor_id   │         │ user_id      │
    │ max_booking_     │            │ date            │         │ is_recurring │
    │   count          │            │ start_time      │         │ class_       │
    │ current_booking_ │            │ ...             │         │   package_id │
    │   count          │            └─────────────────┘         │ preferred_   │
    │ instructor_id    │                     │                  │   days[]     │
    │ package_id       │                     │                  └──────────────┘
    └──────────────────┘                     │                         │
            │                                │                         │
            │                                ▼                         │
            │                   ┌─────────────────────────┐           │
            │                   │  assignment_bookings    │           │
            └──────────────────►│  (Junction Table)       │◄──────────┘
                                │  ┌──────────────────┐   │
                                │  │ assignment_id FK │   │
                                │  │ booking_id FK    │   │
                                │  │ class_container_ │   │
                                │  │   id FK          │   │
                                │  └──────────────────┘   │
                                └─────────────────────────┘
```

---

## 🔄 Container Type Flow Diagrams

### 1️⃣ Monthly Individual Class Flow

```
User Booking
    │
    ├── is_recurring = TRUE
    ├── booking_type = 'individual'
    └── preferred_days = ['monday', 'wednesday', 'friday']
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  T-5 Automation (5 days before billing cycle)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Check: Container exists for this booking?         │  │
│  │    ├── NO  → Create new container (capacity = 1)     │  │
│  │    └── YES → Use existing container                  │  │
│  │                                                       │  │
│  │ 2. Generate all classes for next month               │  │
│  │    └── Based on preferred_days + package.class_count │  │
│  │                                                       │  │
│  │ 3. Set class_container_id on each assignment         │  │
│  │                                                       │  │
│  │ 4. Create invoice for the month                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         │
         ▼
    Container Structure:
    ┌─────────────────────────────────────────┐
    │ Container: "John Smith - Yoga"          │
    │ Type: individual                        │
    │ Capacity: 1 / 1 (LOCKED)                │
    │ ├── Assignment: Feb 1, 2025 @ 9:00 AM   │
    │ ├── Assignment: Feb 5, 2025 @ 9:00 AM   │
    │ ├── Assignment: Feb 8, 2025 @ 9:00 AM   │
    │ └── ... (12 total classes)              │
    └─────────────────────────────────────────┘
```

### 2️⃣ Public Group Class Flow

```
Admin Creates Container
    │
    └── Type: public_group
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  Container Creation Modal                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Container Type: Public Group Class                   │  │
│  │ Instructor: Sarah Johnson                            │  │
│  │ Class Type: Power Yoga                               │  │
│  │ Max Capacity: 20 participants                        │  │
│  │ [Create Container]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         │
         ▼
    Container Created:
    ┌─────────────────────────────────────────┐
    │ Container: "Power Yoga - Sarah Johnson" │
    │ Type: public_group                      │
    │ Capacity: 0 / 20 (Available)            │
    │ (No assignments yet)                    │
    └─────────────────────────────────────────┘
         │
         ▼
Admin Creates Assignments Manually
    │
    ├── Assignment 1: Feb 1, 10:00 AM
    ├── Assignment 2: Feb 8, 10:00 AM
    └── Assignment 3: Feb 15, 10:00 AM
         │
         ▼
Users Book Classes
    │
    ├── Booking 1 → Attached to Assignment 1
    ├── Booking 2 → Attached to Assignment 1  
    ├── Booking 3 → Attached to Assignment 2
    └── ... (up to 20 bookings total)
         │
         ▼
    Final Container State:
    ┌─────────────────────────────────────────┐
    │ Container: "Power Yoga - Sarah Johnson" │
    │ Type: public_group                      │
    │ Capacity: 15 / 20 (Available: 5)        │
    │ ├── Assignment: Feb 1 (8 participants)  │
    │ ├── Assignment: Feb 8 (5 participants)  │
    │ └── Assignment: Feb 15 (2 participants) │
    └─────────────────────────────────────────┘
```

### 3️⃣ Private Group Class Flow

```
Similar to Public Group, but:
    ├── Max capacity typically lower (5-10)
    ├── Private/closed group of students
    └── Admin manually manages participants
```

### 4️⃣ Crash Course Flow

```
Admin Creates Container
    │
    └── Type: crash_course
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  Container Creation Modal                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Container Type: Crash Course                         │  │
│  │ Instructor: Mike Chen                                │  │
│  │ Package: 4-Week Intensive Program                    │  │
│  │ Max Capacity: 10 participants                        │  │
│  │ [Create Container]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         │
         ▼
Admin Creates All Classes Upfront
    │
    ├── Week 1: Mon/Wed/Fri @ 6:00 PM
    ├── Week 2: Mon/Wed/Fri @ 6:00 PM
    ├── Week 3: Mon/Wed/Fri @ 6:00 PM
    └── Week 4: Mon/Wed/Fri @ 6:00 PM
         │
         ▼
    Container Structure:
    ┌─────────────────────────────────────────┐
    │ Container: "4-Week Intensive - Mike"    │
    │ Type: crash_course                      │
    │ Capacity: 8 / 10 (Available: 2)         │
    │ ├── Feb 3, 6:00 PM (8 students)         │
    │ ├── Feb 5, 6:00 PM (8 students)         │
    │ ├── Feb 7, 6:00 PM (8 students)         │
    │ └── ... (12 total classes)              │
    └─────────────────────────────────────────┘
```

---

## 🔒 Capacity Validation Flow

```
User Action: Attach Booking to Container
         │
         ▼
┌──────────────────────────────────────────────┐
│  Frontend Validation (Pre-check)             │
│  ├── Check: container.current_booking_count  │
│  │          < container.max_booking_count?   │
│  │   ├── NO  → Show error, block submission  │
│  │   └── YES → Proceed to API call           │
│  └────────────────────────────────────────── │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Service Layer Validation                    │
│  (containerService.attachBookingToContainer) │
│  ├── Fetch current container state           │
│  ├── Re-check capacity (in case of race)     │
│  │   ├── NO  → Throw error                   │
│  │   └── YES → Proceed to INSERT             │
│  └────────────────────────────────────────── │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Database Trigger (Final enforcement)        │
│  trg_validate_container_capacity             │
│  ├── BEFORE INSERT OR UPDATE                 │
│  ├── Check capacity in transaction           │
│  │   ├── Capacity exceeded → RAISE EXCEPTION │
│  │   └── Capacity OK → ALLOW                 │
│  └────────────────────────────────────────── │
└──────────────────────────────────────────────┘
         │
         ▼
    INSERT succeeds
         │
         ▼
┌──────────────────────────────────────────────┐
│  Post-Insert Trigger                         │
│  trg_update_container_booking_count          │
│  ├── AFTER INSERT                            │
│  ├── UPDATE class_containers                 │
│  │   SET current_booking_count =             │
│  │       current_booking_count + 1           │
│  └────────────────────────────────────────── │
└──────────────────────────────────────────────┘
         │
         ▼
    ✅ Booking attached successfully
    ✅ Container count auto-incremented
```

---

## 🎨 UI Grouping Logic

### Current (Before Container)

```
Assignment List View:
┌────────────────────────────────────────────────────┐
│ ❌ Complex grouping logic:                         │
│    - Crash courses: instructor + package           │
│    - Monthly: Multiple booking IDs                 │
│    - Weekly: Class type + instructor               │
│    - Fallback: "Unknown Class"                     │
│                                                     │
│ Problems:                                          │
│ ❌ Inconsistent grouping                           │
│ ❌ "Unknown Class" appears when logic fails        │
│ ❌ Auto-scheduled classes may not group correctly  │
└────────────────────────────────────────────────────┘
```

### After Container Implementation

```
Assignment List View:
┌────────────────────────────────────────────────────┐
│ ✅ Uniform grouping logic:                         │
│    GROUP BY class_container_id ONLY                │
│                                                     │
│ Container 1: "John Smith - Yoga"                   │
│   Type: individual                                 │
│   Capacity: 1/1 ██████████                         │
│   ├── Feb 1, 9:00 AM                               │
│   ├── Feb 5, 9:00 AM                               │
│   └── Feb 8, 9:00 AM                               │
│                                                     │
│ Container 2: "Power Yoga - Sarah Johnson"          │
│   Type: public_group                               │
│   Capacity: 15/20 ███████░░░                       │
│   ├── Feb 1, 10:00 AM (8 students)                 │
│   ├── Feb 8, 10:00 AM (5 students)                 │
│   └── Feb 15, 10:00 AM (2 students)                │
│                                                     │
│ Container 3: "4-Week Intensive - Mike"             │
│   Type: crash_course                               │
│   Capacity: 8/10 ████████░░                        │
│   ├── Feb 3, 6:00 PM                               │
│   ├── Feb 5, 6:00 PM                               │
│   └── ... (12 classes)                             │
│                                                     │
│ Benefits:                                          │
│ ✅ Consistent grouping across all types            │
│ ✅ Visual capacity indicators                      │
│ ✅ No "Unknown Class" groups                       │
│ ✅ Auto-scheduled classes automatically grouped    │
└────────────────────────────────────────────────────┘
```

---

## 🔄 Data Migration Strategy

### Phase 1: Prepare Schema (Non-Destructive)

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Create new table (class_containers)            │
│         ✅ Does not affect existing data                │
│                                                          │
│ Step 2: Add nullable foreign keys                       │
│         ├── class_assignments.class_container_id        │
│         └── assignment_bookings.class_container_id      │
│         ✅ Does not break existing queries              │
│                                                          │
│ Step 3: Create indexes                                  │
│         ✅ Improves query performance                   │
└─────────────────────────────────────────────────────────┘
```

### Phase 2: Migrate Data (Backward Compatible)

```
┌─────────────────────────────────────────────────────────┐
│ Crash Courses:                                          │
│   SELECT DISTINCT instructor_id, package_id             │
│   → CREATE container for each unique combination        │
│   → UPDATE assignments with container_id                │
│                                                          │
│ Monthly Individual:                                     │
│   SELECT DISTINCT booking_id FROM monthly assignments   │
│   → CREATE container for EACH booking (1:1 mapping)     │
│   → UPDATE assignments with container_id                │
│                                                          │
│ Group Classes:                                          │
│   SELECT DISTINCT instructor_id, class_type_id          │
│   → CREATE container for each unique combination        │
│   → UPDATE assignments with container_id                │
│                                                          │
│ Validation:                                             │
│   SELECT COUNT(*) FROM class_assignments                │
│   WHERE class_container_id IS NULL;                     │
│   ✅ Result must be 0 before proceeding                 │
└─────────────────────────────────────────────────────────┘
```

### Phase 3: Enforce Constraints (After Validation)

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Verify all data migrated                       │
│         ✅ Run validation queries                       │
│                                                          │
│ Step 2: Make class_container_id NOT NULL               │
│         ⚠️  Point of no return - ensure backups!        │
│                                                          │
│ Step 3: Enable triggers                                 │
│         ✅ Auto-updates container counts                │
│                                                          │
│ Step 4: Test T-5 automation                            │
│         ✅ New classes get container_id automatically   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 User Workflows

### Admin: Create New Monthly Individual Class

```
1. User fills booking form
   ├── Name: John Smith
   ├── Type: Individual
   ├── Package: Monthly Yoga (12 classes/month)
   ├── Preferred days: Mon, Wed, Fri
   └── Start date: Feb 1, 2025

2. Submit booking
   └── is_recurring = TRUE set

3. T-5 automation (5 days before Feb 1)
   ├── Finds/creates container for John
   │   └── Container: "John Smith - Yoga"
   │   └── Capacity: 1/1 (locked)
   │
   ├── Generates 12 classes for February
   │   ├── Feb 1 @ 9:00 AM
   │   ├── Feb 5 @ 9:00 AM
   │   └── ... (based on Mon/Wed/Fri)
   │
   └── All assignments get same class_container_id

4. Admin views assignment list
   └── Sees group: "John Smith - Yoga" with 12 classes
```

### Admin: Create New Public Group Class

```
1. Admin clicks "Create Container"
   
2. Container Creation Modal
   ├── Type: Public Group
   ├── Instructor: Sarah Johnson
   ├── Class Type: Power Yoga
   ├── Max Capacity: 20
   └── [Create]

3. Container created (empty)

4. Admin creates assignments manually
   ├── Assignment 1: Feb 1, 10:00 AM
   ├── Assignment 2: Feb 8, 10:00 AM
   └── Assignment 3: Feb 15, 10:00 AM
   └── All linked to same container

5. Users book classes
   ├── Booking 1 → Assignment 1
   ├── Booking 2 → Assignment 1
   └── ... (up to 20 total)

6. Container capacity updates automatically
   └── Shows: 15/20 filled
```

### Admin: Edit Container Capacity

```
1. Admin clicks "Edit Capacity" on container

2. Container Capacity Edit Modal
   ├── Current: 15 / 20
   ├── New Max: [__30__]
   └── Available after change: 15 slots
   
3. Validation
   ├── ✅ Increasing capacity → Always allowed
   ├── ❌ Decreasing below current → Blocked
   │   Example: Current = 15, New = 10
   │   Error: "Cannot reduce below 15"
   │
   └── ❌ Monthly individual → Always 1 (locked)

4. Submit
   └── Capacity updated
   └── No data loss
```

---

## 📈 Capacity Management Rules

```
Container Type         │ Min Capacity │ Max Capacity │ Can Edit? │ Auto-Scheduled?
───────────────────────┼──────────────┼──────────────┼───────────┼────────────────
individual             │      1       │      1       │   ❌ NO   │   ✅ If recurring
public_group           │      1       │     50       │   ✅ YES  │   ✅ If recurring
private_group          │      1       │     30       │   ✅ YES  │   ✅ If recurring
crash_course           │      1       │     50       │   ✅ YES  │   ❌ NO (one-time)

💡 Key: Auto-scheduling depends on the BOOKING's is_recurring flag, not container type.

Capacity Edit Rules:
├── ✅ Increase: Always allowed
├── ⚠️  Decrease: Only if new_max >= current_count
└── ❌ Individual: Cannot change (always 1)
```

---

## 🔍 Query Performance

### Before Container (Complex Joins)

```sql
-- Multiple GROUP BY strategies needed
SELECT 
    CASE 
        WHEN schedule_type = 'crash' THEN 
            CONCAT(instructor_id, '-', package_id)
        WHEN booking_type = 'individual' THEN
            (SELECT booking_id FROM assignment_bookings ...)
        ELSE 'unknown'
    END AS group_key,
    ...
FROM class_assignments
LEFT JOIN ... (multiple joins)
GROUP BY group_key
```

**Problems:**
- Complex CASE logic
- Multiple subqueries
- Slow on large datasets
- Inconsistent results

### After Container (Simple Join)

```sql
-- Single GROUP BY on container_id
SELECT 
    cc.id AS container_id,
    cc.display_name,
    cc.container_type,
    cc.current_booking_count,
    cc.max_booking_count,
    COUNT(ca.id) AS assignment_count,
    SUM(ca.payment_amount) AS total_revenue
FROM class_containers cc
LEFT JOIN class_assignments ca ON ca.class_container_id = cc.id
WHERE cc.is_active = TRUE
GROUP BY cc.id, cc.display_name, cc.container_type, 
         cc.current_booking_count, cc.max_booking_count
ORDER BY cc.created_at DESC;
```

**Benefits:**
- ✅ Single GROUP BY
- ✅ Indexed join (class_container_id)
- ✅ Fast on large datasets
- ✅ Consistent results

---

## 🚨 Edge Cases Handled

### 1. Race Condition: Two bookings added simultaneously

```
Thread A: Attach booking 1 → Container at 19/20
Thread B: Attach booking 2 → Container at 19/20
                                         ↓
                            Database Trigger (Atomic)
                                         ↓
                      ┌──────────────────┴──────────────────┐
                      ▼                                     ▼
            Thread A: Check capacity                Thread B: Check capacity
            19 < 20? ✅ Allow                       19 < 20? ✅ Allow
                      │                                     │
                      └──────────────────┬──────────────────┘
                                         ▼
                          Update count to 20 (Thread A)
                                         ▼
                          Update count to 21 (Thread B)
                                         ▼
                            ❌ EXCEPTION: Capacity exceeded
                            ✅ Only Thread A succeeds
```

### 2. Container deleted with active assignments

```
Admin tries to delete container
         │
         ▼
┌────────────────────────────────────┐
│ Check: Active assignments exist?   │
│  ├── YES → Block deletion          │
│  │         Show error message      │
│  └── NO  → Allow deletion           │
└────────────────────────────────────┘

Solution: Soft delete
  └── Set is_active = FALSE
      └── Assignments remain linked
          └── Can reactivate later
```

### 3. T-5 automation fails mid-process

```
T-5 Process:
├── Step 1: Create/find container ✅
├── Step 2: Generate invoice ✅
├── Step 3: Generate classes... ❌ ERROR (network issue)
         │
         ▼
┌────────────────────────────────────┐
│ Transaction Rollback               │
│  ├── Invoice deleted               │
│  ├── Partial classes deleted       │
│  └── Container count corrected     │
└────────────────────────────────────┘

Next run (next day):
  └── Process retries from beginning
      └── Uses idempotency checks
          └── Prevents duplicates
```

---

## 📝 Summary Checklist

```
✅ Container is single source of truth for grouping
✅ All container types use same table and logic
✅ Capacity enforced at 3 levels (UI, Service, DB)
✅ Monthly individual locked to 1 booking
✅ Auto-scheduling preserved and enhanced
✅ No "Unknown Class" groups possible
✅ Backward compatible (non-destructive)
✅ Performance optimized with indexes
✅ Race conditions handled atomically
✅ Edge cases documented and handled
```

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** 📋 Ready for Implementation
