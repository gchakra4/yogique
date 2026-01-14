# 🏗️ Class Assignment Management V2 - Complete Architecture & Design

**Version:** 2.0.1  
**Created:** January 13, 2026  
**Updated:** January 14, 2026  
**Status:** 📋 Design Phase - Ready for Implementation  
**Isolation Level:** Complete (Route-based separation)
**Terminology:** Container/Program (used interchangeably - "Program" for business users, "Container" in code)

---

## 🎯 Executive Summary

### What is V2?

A **completely new, isolated module** for Class Assignment Management that:

1. ✅ **Program-first architecture** - `class_containers` (Programs) as single source of truth
2. ✅ **Zero pricing concerns** - All billing handled by separate invoice module
3. ✅ **Mobile-first PWA** - Completely different mobile/desktop experiences
4. ✅ **Predictable mental model** - Program = Class Series, Assignment = Individual Class Session
5. ✅ **Backward compatible** - Uses existing database schema with stricter validation
6. ✅ **Parallel deployment** - Runs alongside legacy system during validation
7. ✅ **Created from Packages** - Programs are instances of Class Packages from Class Type Manager

### Why V2?

**Problems Solved:**
- ❌ Inconsistent grouping logic (v1)
- ❌ "Unknown Class" groups (v1)
- ❌ Mixed pricing concerns in UI (v1)
- ❌ Complex conditional grouping (v1)
- ❌ Poor mobile experience (v1)

**V2 Benefits:**
- ✅ Single, predictable grouping key: `class_container_id`
- ✅ Clear capacity management
- ✅ Clean separation of concerns (no pricing in class module)
- ✅ Native app-like mobile experience
- ✅ Reduced admin cognitive load

---

## 🗺️ Navigation Structure

```
Old System (Preserved):
/dashboard/class-assignments  →  ClassAssignmentManager (legacy)

New System V2 (Single Page):
/dashboard/programs-v2        →  ProgramsDashboard (all-in-one)
    ├── Program list/grid (business users see "Class Series")
    ├── Program drawer (slide-out)
    │   ├── Assignment list (individual class sessions)
    │   └── Create assignment (modal)
    └── Create program from package (modal - links to Class Type Manager)

/dashboard/class_type_manager →  Existing: Manages Packages (source for Programs)
/dashboard/analytics          →  Future: Analytics & Reporting
```

**Business Terminology:**
- **Program** = A class series (e.g., "Monthly Yoga with Sarah")
- **Package** = Template defined in Class Type Manager (e.g., "12-Class Monthly Package")
- **Assignment** = Individual class session within a program
- **Container** = Technical term in code/database (same as Program)

**Access Control:**
- Initial: Super users & admins only (via `roleConfig.ts`)
- Future: Extend to instructors (read-only), students (their classes)

---

## 📊 Core Architectural Principles

### 1. Container-First Design

```
🏛️ MENTAL MODEL:
Program = Class Series (ongoing or fixed duration)
Assignment = Individual Class Session

Example:
Program: "Power Yoga - Sarah Johnson - Mon/Wed 6PM"
(Created from: "Monthly 12-Class Package")
├── Assignment: Jan 15, 2026 @ 6:00 PM
├── Assignment: Jan 20, 2026 @ 6:00 PM
├── Assignment: Jan 22, 2026 @ 6:00 PM
└── Assignment: Jan 27, 2026 @ 6:00 PM

Program Lifecycle:
1. Admin selects package from Class Type Manager
2. Program created as instance of that package
3. Instructor assigned (optional - can be added/changed later)
4. Classes assigned (manual or automatic via pg_cron)
5. Students book into program (via bookings)
```

**Grouping Rule (STRICT):**
```typescript
// ✅ ALWAYS use class_container_id
const groupedByContainer = assignments.reduce((acc, assignment) => {
  const containerId = assignment.class_container_id;
  if (!containerId) {
    // Flag as invalid - should never happen in v2
    acc['_invalid'].push(assignment);
  } else {
    if (!acc[containerId]) acc[containerId] = [];
    acc[containerId].push(assignment);
  }
  return acc;
}, {});

// ❌ NEVER do this (v1 anti-pattern)
const groupKey = `${instructor_id}-${package_id}-${booking_type}`; // NO!
```

### 2. Container Lifecycle & Capacity

**Container Types & Behavior:**

| Type | Capacity | Monthly Accumulation | Billing |
|------|----------|---------------------|---------|
| `individual` | 1 (locked) | ✅ Yes (Jan: 6, Feb: +12, Mar: +12) | Monthly/Quarterly/Annual |
| `public_group` | 1-50 (editable) | ✅ Yes | Monthly/Per-class |
| `private_group` | 1-30 (editable) | ✅ Yes | Monthly/Per-class |
| `crash_course` | 1-30 (editable) | ❌ No (all upfront) | One-time |

**Monthly Accumulation Example:**
```
Container ID: CONT-001
Type: individual
Instructor: Sarah Johnson
Package: Monthly Yoga (12 classes/month)

Timeline:
Jan 15, 2026 (Start Date)
├── Jan 15-31: 6 assignments created (half month)
│   Container State: 6 assignments, 1 booking
│
Feb 1, 2026 (T-5 automation runs on Jan 27)
├── Feb 1-28: +12 assignments added
│   Container State: 18 assignments total, 1 booking
│
Mar 1, 2026 (T-5 automation runs on Feb 24)
├── Mar 1-31: +12 assignments added
│   Container State: 30 assignments total, 1 booking
│
... continues until booking ends or is cancelled
```

**Container Expiry:**
```typescript
// Container remains active until ALL bookings end
const containerEndDate = Math.max(...bookings.map(b => b.end_date));

// When last booking ends:
container.is_active = false; // Soft delete
// Hard delete blocked by DB trigger
```

### 3. Zero Pricing in UI

**Strict Separation:**
```typescript
// ✅ V2 Assignment Form (NO PRICING)
interface AssignmentFormData {
  class_container_id: string;  // Required
  date: string;
  start_time: string;
  end_time: string;
  timezone?: string;           // Default: 'Asia/Kolkata'
  class_status?: string;       // Default: 'scheduled'
  instructor_status?: string;  // Default: 'pending'
  booking_type?: string;       // Default: 'individual'
  schedule_type?: string;      // Default: 'weekly'
  assignment_method?: string;  // Default: 'manual'
  notes?: string;
  zoom_meeting?: {             // Optional Zoom details
    meeting_id: string;
    password: string;
    join_url: string;
  };
  // ❌ NO payment_amount
  // ❌ NO payment_status
  // ❌ NO payment_type
  // ❌ NO pricing fields
}

// Pricing happens elsewhere:
// 1. T-5 automation generates invoices
// 2. Admin uses /dashboard/invoice-management
// 3. Invoices link to assignments via booking_id
```

**How Invoice Generation Works (Existing System - Don't Touch):**
1. T-5 automation runs daily via `pg_cron` (not GitHub Actions)
2. Checks bookings with `is_recurring = true`
3. Generates invoice for next billing cycle
4. Admin can manually trigger invoice generation in `/dashboard/invoice-management`
5. Invoice contains line items pointing to assignments via `booking_id`

**Meeting Link Generation (Existing System - Don't Touch):**
1. `pg_cron` job runs and generates Zoom links 12 hours before each class
2. Calls Zoom API to create meeting
3. Stores in `zoom_meeting` jsonb field
4. Admin/Instructor can manually override or add meeting URL anytime

**V2's Role:** Just create assignments and optionally add manual meeting links. Invoicing and auto-meeting-generation are automatic.

---

## 🏗️ Database Schema (Existing - No Changes)

### Tables Used

```sql
-- Core table (single source of truth)
class_containers
├── id (uuid PK)
├── container_code (text UNIQUE)
├── container_type (text) -- 'individual', 'public_group', 'private_group', 'crash_course'
├── display_name (text)
├── instructor_id (uuid FK → profiles)
├── package_id (uuid FK → class_packages)
├── max_booking_count (int)
├── current_booking_count (int) -- Auto-updated by trigger
├── is_active (boolean)
├── created_at, updated_at

-- Assignments (many per container)
class_assignments
├── id (uuid PK)
├── class_container_id (uuid FK → class_containers) -- REQUIRED in v2 (added in migration)
├── instructor_id (uuid FK → profiles) NOT NULL
├── class_type_id (uuid FK → class_types)
├── package_id (uuid FK → class_packages)
├── class_package_id (uuid FK → class_packages)
├── date (date)
├── start_time (time without time zone)
├── end_time (time without time zone)
├── timezone (text) DEFAULT 'Asia/Kolkata'
├── class_status (text) DEFAULT 'scheduled' -- 'scheduled', 'completed', 'not_conducted', 'rescheduled'
├── instructor_status (text) DEFAULT 'pending' -- 'pending', 'accepted', 'rejected', 'rescheduled'
├── booking_type (text) DEFAULT 'individual' -- 'individual', 'corporate', 'private_group', 'public_group'
├── schedule_type (text) DEFAULT 'weekly' -- 'adhoc', 'weekly', 'monthly', 'crash'
├── assignment_method (text) DEFAULT 'manual' -- 'manual', 'weekly_recurrence', 'auto_distribute'
├── assignment_code (varchar(32)) UNIQUE NOT NULL -- Short human-friendly code
├── notes (text)
├── zoom_meeting (jsonb) -- Auto-generated by pg_cron 12hrs before class, or manually set by admin/instructor
│   Structure: { meeting_id, password, join_url, start_url }
├── whatsapp_notified (boolean) DEFAULT false
├── email_notified (boolean) DEFAULT false
├── parent_assignment_id (uuid FK → class_assignments) -- For bulk operations
├── recurrence_days (integer[]) -- Array of weekdays (0=Sunday, 6=Saturday)
├── rescheduled_to_id (uuid FK → class_assignments)
├── rescheduled_from_id (uuid FK → class_assignments)
├── attendance_locked (boolean) DEFAULT false
├── actual_start_time (timestamptz)
├── actual_end_time (timestamptz)
├── created_at (timestamptz) DEFAULT now()
├── updated_at (timestamptz) DEFAULT now()
├── ⚠️ LEGACY PAYMENT FIELDS (exist but DO NOT USE in V2):
│   ├── payment_amount (numeric(10,2)) DEFAULT 0.00
│   ├── payment_status (payment_status enum) DEFAULT 'pending'
│   ├── payment_type (varchar(50)) DEFAULT 'per_class'
│   ├── payment_date (date)
│   └── override_payment_amount (numeric(10,2))

-- Bookings (students enrolled)
bookings
├── id (uuid PK)
├── booking_id (text UNIQUE) -- Format: YOG-YYYYMMDD-XXXX
├── user_id (uuid FK → profiles)
├── class_package_id (uuid FK → class_packages)
├── booking_type (text) DEFAULT 'individual' -- 'individual', 'corporate', 'private_group', 'public_group'
├── status (text) DEFAULT 'confirmed' -- 'pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'
├── payment_status (text) DEFAULT 'pending' -- 'pending', 'paid', 'failed', 'refunded'
├── first_name, last_name, email, phone (text) NOT NULL
├── class_name, instructor (text) NOT NULL
├── class_date (date) DEFAULT CURRENT_DATE
├── class_time (text) NOT NULL
├── experience_level (text) DEFAULT 'beginner'
├── timezone (text)
├── price (numeric(10,2))
├── currency (text) DEFAULT 'USD'
├── session_duration (integer)
├── special_requests, booking_notes (text)
├── cancellation_reason (text)
├── cancelled_at (timestamptz)
├── cancelled_by (text)
├── user_cancelled (boolean) DEFAULT false
├── cancel_token (text)
├── cancel_token_expires_at (timestamptz)
├── preferred_days (text[])
├── preferred_times (text[])
├── session_frequency, program_duration (text)
├── created_at, updated_at (timestamptz) DEFAULT now()
├── 🏢 CORPORATE FIELDS:
│   ├── company_name, job_title (text)
│   ├── company_size, industry, website (text)
│   ├── participants_count (integer)
│   ├── work_location (text)
│   ├── budget_range, goals (text)
│   ├── current_wellness_programs (text)
│   ├── space_available (text)
│   └── equipment_needed (boolean) DEFAULT false
├── 👤 EMERGENCY CONTACT:
│   ├── emergency_contact (text)
│   └── emergency_phone (text)

-- Junction table (many-to-many)
assignment_bookings
├── assignment_id (uuid FK → class_assignments)
├── booking_id (text FK → bookings)
├── class_container_id (uuid FK → class_containers)
```

### Existing Triggers (Don't Modify)

```sql
-- 1. Auto-update container capacity
CREATE TRIGGER update_container_capacity
AFTER INSERT OR UPDATE OR DELETE ON assignment_bookings
FOR EACH ROW EXECUTE FUNCTION sync_container_capacity();

-- 2. Validate capacity before insert
CREATE TRIGGER validate_capacity
BEFORE INSERT ON assignment_bookings
FOR EACH ROW EXECUTE FUNCTION check_container_capacity();

-- 3. Prevent hard delete of containers with assignments
CREATE TRIGGER prevent_container_delete
BEFORE DELETE ON class_containers
FOR EACH ROW EXECUTE FUNCTION block_container_deletion();
```

**V2's Job:** Respect these triggers. UI validation must mirror database rules.

---

## 🎨 Frontend Architecture

### File Structure

```
src/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── Modules/
│   │   │   │   ├── ClassAssignmentManager/  ← OLD V1 (PRESERVED)
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   └── ClassesV2/               ← NEW V2 MODULE (SINGLE PAGE)
│   │   │   │       ├── ClassesDashboard.tsx         ← Main page component
│   │   │   │       ├── components/
│   │   │   │       │   ├── ContainerCard.tsx        ← Individual container card
│   │   │   │       │   ├── ContainerDrawer.tsx      ← Slide-out drawer
│   │   │   │       │   ├── ContainerGrid.tsx        ← Grid layout wrapper
│   │   │   │       │   ├── ContainerFilters.tsx     ← Filter panel
│   │   │   │       │   ├── EmptyState.tsx           ← No containers view
│   │   │   │       │   ├── AssignmentList.tsx       ← List within drawer
│   │   │   │       │   ├── AssignmentCard.tsx       ← Single assignment item
│   │   │   │       │   ├── CapacityIndicator.tsx    ← Capacity bar
│   │   │   │       │   └── modals/
│   │   │   │       │       ├── CreateContainerModal.tsx   ← New container form
│   │   │   │       │       ├── CreateAssignmentModal.tsx  ← New assignment form
│   │   │   │       │       ├── EditContainerModal.tsx     ← Edit container
│   │   │   │       │       └── DeleteConfirmModal.tsx     ← Delete confirmation
│   │   │   │       │
│   │   │   │       ├── forms/
│   │   │   │       │   ├── ContainerForm.tsx        ← Container form fields
│   │   │   │       │   ├── AssignmentForm.tsx       ← Assignment form fields
│   │   │   │       │   ├── DateTimePicker.tsx       ← Date/time selection
│   │   │   │       │   └── ValidationRules.ts       ← Client-side validation
│   │   │   │
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── v2/                          ← V2 SERVICES
│   │   │   │   ├── container.service.ts         ← Container CRUD
│   │   │   │   ├── assignment.service.ts        ← Assignment CRUD
│   │   │   │   ├── capacity.service.ts          ← Capacity calculations
│   │   │   │   └── validation.service.ts        ← Pre-flight checks
│   │   │   │
│   │   │   └── ...
│   │   │
│   │   ├── hooks/
│   │   │   ├── v2/                          ← V2 HOOKS
│   │   │   │   ├── useContainers.ts             ← Fetch containers with polling
│   │   │   │   ├── useAssignments.ts            ← Fetch assignments
│   │   │   │   ├── useCapacity.ts               ← Capacity state management
│   │   │   │   └── useMobileDetect.ts           ← Detect mobile/desktop
│   │   │   │
│   │   │   └── ...
│   │   │
│   │   ├── types/
│   │   │   ├── v2/                          ← V2 TYPES
│   │   │   │   ├── container.types.ts           ← Container interfaces
│   │   │   │   ├── assignment.types.ts          ← Assignment interfaces
│   │   │   │   └── capacity.types.ts            ← Capacity types
│   │   │   │
│   │   │   └── ...
│   │   │
│   │   └── utils/
│   │       ├── v2/                          ← V2 UTILS
│   │       │   ├── dateHelpers.ts               ← Date formatting
│   │       │   ├── capacityHelpers.ts           ← Capacity calculations
│   │       │   └── containerHelpers.ts          ← Container utilities
│   │       │
│   │       └── ...
│   │
│   └── ... (other features)
│
└── shared/
    ├── components/
    │   └── ui/
    │       ├── MobileShell.tsx              ← PWA wrapper (existing)
    │       ├── CapacityBadge.tsx            ← NEW: Capacity indicator
    │       └── ContainerTypeBadge.tsx       ← NEW: Type badge
    │
    └── config/
        └── roleConfig.ts                    ← Add v2 routes here
```

### Component Hierarchy

```
ClassesDashboard (Main Container - SINGLE PAGE)
│
├── MobileShell (PWA wrapper)
│   │
│   ├── Desktop View
│   │   ├── Header
│   │   │   ├── Search bar
│   │   │   ├── ContainerFilters
│   │   │   └── [+ Create Container] → Opens CreateContainerModal
│   │   │
│   │   ├── ContainerGrid
│   │   │   └── ContainerCard (repeated)
│   │   │       ├── ContainerHeader (Name, Type, Instructor)
│   │   │       ├── CapacityIndicator (Visual bar)
│   │   │       ├── Stats (Assignment count, Date range)
│   │   │       └── onClick → Opens ContainerDrawer
│   │   │
│   │   ├── ContainerDrawer (Slide-out on card click)
│   │   │   ├── DrawerHeader
│   │   │   │   ├── Container name & type
│   │   │   │   ├── [Edit] → Opens EditContainerModal
│   │   │   │   ├── [Delete] → Opens DeleteConfirmModal
│   │   │   │   └── [× Close]
│   │   │   │
│   │   │   ├── ContainerDetails
│   │   │   │   ├── Capacity visualization
│   │   │   │   ├── Date range
│   │   │   │   └── Enrolled students
│   │   │   │
│   │   │   ├── AssignmentList
│   │   │   │   ├── [+ Create Assignment] → Opens CreateAssignmentModal
│   │   │   │   └── AssignmentCard (repeated)
│   │   │   │       ├── Date/Time
│   │   │   │       ├── Status Badge
│   │   │   │       └── [Edit] [Delete] actions
│   │   │   │
│   │   │   └── Footer actions
│   │   │
│   │   └── Modals (Overlays)
│   │       ├── CreateContainerModal
│   │       ├── EditContainerModal
│   │       ├── CreateAssignmentModal (pre-filled with container)
│   │       └── DeleteConfirmModal
│   │
│   └── Mobile View (Completely Different)
│       ├── Header (Compact, Sticky)
│       ├── FAB (Create Container) → Opens bottom sheet
│       ├── ContainerList (Vertical scroll)
│       │   └── ContainerCard (Mobile optimized)
│       │       ├── Tap to Expand (Inline assignments)
│       │       ├── Swipe Actions (Edit, Delete)
│       │       └── Tap "+ Create" → Opens assignment bottom sheet
│       │
│       └── BottomSheets (Mobile modals)
│           ├── CreateContainerSheet
│           ├── CreateAssignmentSheet
│           └── ConfirmDeleteSheet
```

---

## 🎨 UI/UX Design Specifications

### Desktop View

**Layout:** Grid-based, cards with hover effects

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Classes Dashboard V2                          [+ Create] │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search containers...        [Filters ▼] [Sort: Newest]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ CONT-001    │  │ CONT-002    │  │ CONT-003    │        │
│  │ Power Yoga  │  │ Beginner    │  │ 4-Wk Crash  │        │
│  │             │  │             │  │             │        │
│  │ 👤 Sarah J. │  │ 👤 Mike C.  │  │ 👤 Lisa W.  │        │
│  │ 📅 12 class │  │ 📅 8 class  │  │ 📅 12 class │        │
│  │ 🎯 15/20 ▓▓ │  │ 🎯 5/30 ░░  │  │ 🎯 10/10 ▓▓ │        │
│  │             │  │             │  │             │        │
│  │ Individual  │  │ Public Grp  │  │ Crash Crse  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Drawer (slides from right when container clicked):
┌─────────────────────────────────┐
│ ← Power Yoga - Sarah Johnson   │
│ CONT-001 • Individual           │
├─────────────────────────────────┤
│ 📊 Capacity: 1/1 (Full)         │
│ 📅 Jan 15 - Mar 31, 2026        │
│ 👥 Enrolled: John Doe           │
├─────────────────────────────────┤
│ Assignments (12)                │
│                                 │
│ ✓ Jan 15 @ 9:00 AM (Completed) │
│ ⏰ Jan 17 @ 9:00 AM (Upcoming)  │
│ ⏰ Jan 20 @ 9:00 AM (Upcoming)  │
│ ...                             │
│                                 │
│ [+ Create Assignment]           │
└─────────────────────────────────┘
```

**Key Features:**
- Hover to preview container details
- Click to open drawer with full details
- Inline editing for container name
- Color-coded capacity bars (green < 50%, yellow 50-80%, red > 80%)
- Type badges (Individual, Public Group, Private Group, Crash Course)

### Mobile View (PWA)

**Layout:** Full-screen, app-like, swipe gestures

```
┌─────────────────────────────┐
│ ☰  Classes V2      [+]      │  ← Sticky header
├─────────────────────────────┤
│ 🔍 Search...    [Filters]   │
├─────────────────────────────┤
│                             │
│ ╔═══════════════════════╗  │  ← Swipe left: Edit
│ ║ Power Yoga            ║  │     Swipe right: Delete
│ ║ Sarah Johnson         ║  │
│ ║ ▓▓▓▓▓░░░░░ 1/1       ║  │
│ ║ 12 classes • Jan-Mar  ║  │
│ ║ [Individual]          ║  │
│ ╚═══════════════════════╝  │
│                             │
│ ╔═══════════════════════╗  │
│ ║ Beginner Yoga         ║  │
│ ║ Mike Chen             ║  │
│ ║ ░░░░░░░░░░ 5/30       ║  │
│ ║ 8 classes • Feb-Apr   ║  │
│ ║ [Public Group]        ║  │
│ ╚═══════════════════════╝  │
│                             │
│  ▼ Pull to refresh          │
└─────────────────────────────┘

Expanded Container (tap to expand inline):
╔═══════════════════════════╗
║ Power Yoga                ║  ← Tap to collapse
║ Sarah Johnson             ║
║ ▓▓▓▓▓░░░░░ 1/1           ║
║                           ║
║ ┌───────────────────────┐ ║
║ │ Jan 15 @ 9:00 AM     │ ║
║ │ ✓ Completed          │ ║
║ ├───────────────────────┤ ║
║ │ Jan 17 @ 9:00 AM     │ ║
║ │ ⏰ Upcoming           │ ║
║ └───────────────────────┘ ║
║                           ║
║ [View All 12] [+ Create]  ║
╚═══════════════════════════╝
```

**Mobile-Specific Features:**
- Pull-to-refresh
- Swipe gestures (left: edit, right: delete)
- Large touch targets (min 44px)
- Bottom sheet for detailed view
- FAB (Floating Action Button) for quick create
- Haptic feedback on actions
- Offline support (PWA cache)
- Install prompt for home screen

**Typography (Mobile):**
```css
/* Mobile-first sizes */
--font-heading: 1.25rem;     /* 20px */
--font-body: 0.875rem;       /* 14px */
--font-caption: 0.75rem;     /* 12px */
--touch-target: 44px;        /* Apple HIG minimum */
--spacing-mobile: 12px;      /* Tighter spacing */
```

---

## 🔄 Complete User Workflows

### Workflow 1: Create New Program (Admin)

```
1. Admin on /dashboard/programs-v2 page
   ↓
2. Clicks [+ Create Program] button in header
   ↓
3. CreateProgramModal opens with form:
   ┌────────────────────────────────────┐
   │ Create New Program (Class Series)  │
   ├────────────────────────────────────┤
   │ 📦 Step 1: Select Package          │
   │                                     │
   │ Class Package: [Select]            │
   │  → Loads from /dashboard/class_    │
   │     type_manager packages          │
   │  → Shows: Name, Class Count, Type  │
   │                                     │
   │ Selected Package Details:          │
   │  • Monthly 12-Class Package        │
   │  • Type: Individual                │
   │  • ₹800/month                      │
   │  • Course Type: Regular            │
   │                                     │
   │ 👤 Step 2: Instructor (Optional)   │
   │                                     │
   │ Instructor: [Select] (optional)    │
   │  • Can be assigned later           │
   │  • Can be changed anytime          │
   │                                     │
   │ 🎯 Step 3: Program Type & Capacity │
   │                                     │
   │ Program Type: [Auto from package]  │
   │  ○ Individual (1 student) - locked │
   │  ○ Public Group (open enrollment)  │
   │  ○ Private Group (closed group)    │
   │  ○ Crash Course (fixed duration)   │
   │                                     │
   │ Capacity: [Number Input]           │
   │  • Individual: 1 (disabled)        │
   │  • Others: 1-50                    │
   │                                     │
   │ Display Name: [Auto-generated]     │
   │  "Monthly Yoga - Sarah Johnson"    │
   │  OR "Monthly Yoga (Unassigned)"    │
   │  [✏️ Edit if needed]                │
   │                                     │
   │ [Cancel]              [Create]     │
   └────────────────────────────────────┘
   ↓
3. Validation runs:
   ✓ Package selected (REQUIRED)
   ✓ Program type determined from package
   ✓ Instructor selected (OPTIONAL - can be null/assigned later)
   ✓ Capacity valid (1 for individual, 1-50 for others)
   ✓ No duplicate container_code
   ↓
4. Program (container) created in database
   • Links to selected package
   • Instructor can be null initially
   • Display name includes instructor if assigned, else "(Unassigned)"
   ↓
5. Success notification
   ↓
6. Container appears in dashboard
   ↓
7. Admin can now create assignments in this container
```

**Container Code Format:**
```typescript
// Auto-generated, unique identifier
const containerCode = 
  `${instructorId}-${packageId}-${containerType}-${timestamp}`;

// Example: "usr_123-pkg_456-individual-20260115"
```

### Workflow 2: Create Assignment in Program

**Two Methods:**

#### A. Manual Assignment (Admin/Instructor)

```
1. Admin clicks program card on main page
   ↓
2. ProgramDrawer slides in from right
   ↓
3. Drawer shows program details + assignment list
   ↓
4. Admin clicks [+ Create Assignment] button in drawer
   ↓
5. CreateAssignmentModal opens (overlays drawer):
   Program: Power Yoga - Sarah Johnson (pre-filled, read-only)
   ┌────────────────────────────────────┐
   │ New Assignment (Manual)            │
   │ Program: Power Yoga - Sarah        │
   ├────────────────────────────────────┤
   │ Date: [Calendar Picker]            │
   │ Start Time: [Time Picker]          │
   │ End Time: [Time Picker]            │
   │ Timezone: [Dropdown]               │
   │  • Asia/Kolkata (default)          │
   │  • America/New_York                │
   │  • Europe/London, etc.             │
   │                                     │
   │ ⚠️ Instructor: [Required if not    │
   │    set at program level]           │
   │                                     │
   │ Class Status: [Dropdown]           │
   │  ○ Scheduled (default)             │
   │  ○ Completed                       │
   │  ○ Not Conducted                   │
   │  ○ Rescheduled                     │
   │                                     │
   │ Meeting Link: (optional)           │
   │  [Manual Entry] OR [Auto at T-12]  │
   │  Join URL: [Text input]            │
   │  Note: pg_cron will auto-generate  │
   │        12hrs before if empty       │
   │                                     │
   │ Notes: [Textarea]                  │
   │  (optional)                         │
   │                                     │
   │ [Cancel]              [Create]     │
   └────────────────────────────────────┘
```

#### B. Automatic Assignment (pg_cron T-5 Automation)

```
Background Process (No UI):

1. pg_cron job runs daily at T-5 (5 days before billing)
   ↓
2. Finds bookings with:
   • is_recurring = true
   • Next billing cycle approaching
   • Active status
   ↓
3. For each booking:
   ├── Checks if program exists
   │   ├── YES: Use existing program
   │   └── NO: Create new program from package
   │
   ├── Calculate # of classes for next month
   │   └── Based on package.class_count + booking.preferred_days
   │
   ├── Generate assignments
   │   ├── Set dates based on preferred_days
   │   ├── Set times based on preferred_times
   │   ├── Link to program via class_container_id
   │   └── Mark as assignment_method = 'auto_distribute'
   │
   └── Link to booking via assignment_bookings

Result: Classes auto-created every month

Special Case - Crash Courses:
• Crash courses do NOT use T-5 automation
• All assignments created manually upfront
• No monthly accumulation
• Fixed duration (e.g., 4 weeks, 12 sessions)
```
   ↓
5. Validation runs:
   ✓ Date/time valid
   ✓ No scheduling conflicts for instructor
   ✓ Container is active
   ✓ (NO capacity check - that's for bookings)
   ↓
6. Assignment created with class_container_id
   ↓
7. Assignment appears in container's assignment list
   ↓
8. Success notification
```

**Important:** Assignment creation does NOT check capacity. Capacity is checked when bookings are attached to assignments.

### Workflow 2B: How Bookings are Assigned to Programs

**Booking → Program → Assignment Relationship:**

```
┌─────────────────────────────────────────────────────────────┐
│ Junction Table: assignment_bookings                         │
│                                                              │
│ assignment_id ──→ class_assignments (individual session)    │
│ booking_id ───────→ bookings (student enrollment)           │
│ class_container_id → class_containers (program)             │
└─────────────────────────────────────────────────────────────┘

**From UI (Admin):**

1. User books class via /book/* page
   → Creates record in `bookings` table
   
2. Admin reviews booking in /dashboard/booking-management
   ↓
3. Admin assigns booking to program:
   
   Option A: During program creation
   • Create program from package
   • Select existing bookings to link
   • System creates assignment_bookings entries
   
   Option B: After program creation
   • Open program drawer
   • Click "Assign Students" button
   • Select bookings to link
   • System creates assignment_bookings entries
   
   Option C: Automatic (for recurring)
   • pg_cron T-5 automation links bookings
   • Based on package_id + instructor_id match
   • Creates assignment_bookings entries

4. Result:
   • Student is enrolled in program
   • Student sees all assignments in program
   • Capacity counter increments
   • Invoice generation can reference program

**Business Rules:**
• One booking can link to multiple assignments (all sessions in program)
• One assignment can link to multiple bookings (group classes)
• Capacity checked via count of DISTINCT bookings per program
• Booking status must be 'confirmed' to count toward capacity

**Who Can Assign Bookings:**
• **super_admin:** Full access (via `/dashboard/booking_management`)
• **admin:** Full access (needs to be added to roleConfig)
• **yoga_acharya:** Limited access (can assign, cannot delete)
• **instructor:** Read-only (their students only)

**Modules for Booking Assignment:**
1. **Booking Management** (`/dashboard/booking_management`)
   - Existing module, currently only for super_admin
   - Shows all bookings with "Assign to Program" button
   - Needs permission extension to admin & yoga_acharya roles

2. **Programs V2** (`/dashboard/programs-v2`) - NEW
   - Program drawer has "Assign Students" button
   - Shows enrolled students in program details
   - Allows quick assignment from program view

See [BOOKING_ASSIGNMENT_ROLES_MODULES.md](BOOKING_ASSIGNMENT_ROLES_MODULES.md) for complete role permission details.
```

### Workflow 3: View Container Details

```
Desktop:
1. Hover over container card → Preview tooltip (optional)
2. Click container card → ContainerDrawer slides from right
3. Drawer shows:
   - Container metadata (name, type, instructor)
   - Capacity visualization (current/max with bar)
   - List of all assignments (scrollable)
   - Enrolled students (from bookings)
   - Action buttons (Edit Container, Create Assignment)
4. Click outside drawer or [× Close] → Drawer slides out
5. All actions happen via modals (no page navigation)

Mobile:
1. Tap container card → Card expands inline showing assignments
2. Tap "View Details" → Bottom sheet slides up
3. Bottom sheet shows full container info + assignments
4. Tap [+ Create Assignment] → Another bottom sheet opens
5. Swipe down or tap outside → Sheet dismisses
6. All actions stay on same page
```

### Workflow 4: Filter & Search

```
Filters:
├── Container Type
│   ☐ Individual
│   ☐ Public Group
│   ☐ Private Group
│   ☐ Crash Course
│
├── Instructor
│   ☐ Sarah Johnson
│   ☐ Mike Chen
│   ☐ Lisa Wong
│
├── Capacity Status
│   ☐ Available (< 80%)
│   ☐ Near Full (80-99%)
│   ☐ Full (100%)
│
└── Active Status
    ☐ Active
    ☐ Inactive

Search:
- Container name
- Instructor name
- Container code

Sorting:
- Newest first (default)
- Oldest first
- Name A-Z
- Capacity (highest first)
- Assignment count (most first)
```

### Workflow 5: Monthly Accumulation (Automatic)

```
Background Process (Existing T-5 Automation via pg_cron):

Day T-5 before billing cycle:
1. T-5 automation runs (pg_cron scheduled job, NOT GitHub Actions)
   ↓
2. Finds all recurring bookings with upcoming billing date
   ↓
3. For each booking:
   ├── Check if container exists
   │   ├── YES: Use existing container
   │   └── NO: Create new container
   │
   ├── Calculate classes for next month
   │   └── Based on package.class_count + preferred_days
   │
   ├── Create assignments
   │   └── Set class_container_id = existing container
   │
   └── Link assignments to booking via assignment_bookings

Result:
Program (container) accumulates assignments over time:
- January: 6 assignments (half month)
- February: 18 assignments total (6 + 12 new)
- March: 30 assignments total (18 + 12 new)
- etc.

Admin's job in V2:
- Monitor programs
- View accumulated assignments
- Manually adjust if needed
- For crash courses: Create all assignments upfront (no accumulation)
```

---

## 📝 Data Access Patterns

### Query Pattern (Strict)

```typescript
// ✅ CORRECT: Container-first query
const { data: containers, error } = await supabase
  .from('class_containers')
  .select(`
    *,
    instructor:profiles!instructor_id(full_name),
    package:class_packages!package_id(name, class_count),
    assignments:class_assignments(
      id,
      date,
      start_time,
      end_time,
      class_status
    ),
    bookings:assignment_bookings(
      booking:bookings(booking_id, user_id, is_recurring)
    )
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false });

// ❌ WRONG: Assignment-first with grouping logic
const assignments = await supabase
  .from('class_assignments')
  .select('*');
// Then group by instructor/package (NO!)
```

### Service Layer Pattern

```typescript
// container.service.ts
export class ContainerService {
  
  // Fetch all active containers with full details
  static async fetchContainers(filters?: ContainerFilters) {
    let query = supabase
      .from('class_containers')
      .select(`
        *,
        instructor:profiles!instructor_id(id, full_name),
        package:class_packages!package_id(id, name, class_count),
        assignments:class_assignments!class_container_id(
          id,
          date,
          start_time,
          end_time,
          class_status,
          location,
          meeting_link
        )
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters?.containerType) {
      query = query.eq('container_type', filters.containerType);
    }
    if (filters?.instructorId) {
      query = query.eq('instructor_id', filters.instructorId);
    }

    const { data, error } = await query;
    
    // Transform data
    return data?.map(container => ({
      ...container,
      capacityPercentage: (container.current_booking_count / container.max_booking_count) * 100,
      assignmentCount: container.assignments?.length || 0,
      dateRange: this.calculateDateRange(container.assignments)
    }));
  }

  // Create new container
  static async createContainer(data: CreateContainerInput) {
    // Validate
    if (data.container_type === 'individual' && data.max_booking_count !== 1) {
      throw new Error('Individual containers must have capacity = 1');
    }

    // Generate unique code
    const containerCode = this.generateContainerCode(data);

    const { data: container, error } = await supabase
      .from('class_containers')
      .insert({
        container_code: containerCode,
        container_type: data.container_type,
        display_name: data.display_name || this.generateDisplayName(data),
        instructor_id: data.instructor_id,
        package_id: data.package_id,
        max_booking_count: data.max_booking_count,
        current_booking_count: 0,
        is_active: true
      })
      .select()
      .single();

    return container;
  }

  // Helper: Generate container code
  private static generateContainerCode(data: CreateContainerInput): string {
    const timestamp = Date.now().toString(36);
    return `${data.instructor_id.slice(0,8)}-${data.package_id.slice(0,8)}-${data.container_type}-${timestamp}`;
  }

  // Helper: Generate display name
  private static generateDisplayName(data: CreateContainerInput): string {
    // Will be populated with actual instructor/package names
    return `${data.instructorName} - ${data.packageName}`;
  }

  // Helper: Calculate date range from assignments
  private static calculateDateRange(assignments: Assignment[]) {
    if (!assignments || assignments.length === 0) return null;
    
    const dates = assignments.map(a => new Date(a.date));
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }
}
```

### Capacity Calculation

```typescript
// capacity.service.ts
export class CapacityService {
  
  // Check if container can accept more bookings
  static async canAcceptBooking(containerId: string): Promise<boolean> {
    const { data: container } = await supabase
      .from('class_containers')
      .select('current_booking_count, max_booking_count')
      .eq('id', containerId)
      .single();

    return container.current_booking_count < container.max_booking_count;
  }

  // Get capacity status
  static getCapacityStatus(current: number, max: number): CapacityStatus {
    const percentage = (current / max) * 100;
    
    if (percentage >= 100) return { level: 'full', color: 'red', label: 'Full' };
    if (percentage >= 80) return { level: 'near-full', color: 'yellow', label: 'Almost Full' };
    if (percentage >= 50) return { level: 'half', color: 'blue', label: 'Half Full' };
    return { level: 'available', color: 'green', label: 'Available' };
  }

  // Calculate capacity percentage for visualization
  static calculatePercentage(current: number, max: number): number {
    return Math.min((current / max) * 100, 100);
  }
}
```

---

## 🧪 Validation Rules

### Client-Side Validation

```typescript
// validation.service.ts
export class ValidationService {

  // Validate container creation
  static validateContainerCreation(data: CreateContainerInput): ValidationResult {
    const errors: string[] = [];

    // Type required
    if (!data.container_type) {
      errors.push('Container type is required');
    }

    // Instructor required
    if (!data.instructor_id) {
      errors.push('Instructor is required');
    }

    // Package required
    if (!data.package_id) {
      errors.push('Package is required');
    }

    // Capacity rules
    if (data.container_type === 'individual') {
      if (data.max_booking_count !== 1) {
        errors.push('Individual containers must have capacity = 1');
      }
    } else {
      if (data.max_booking_count < 1 || data.max_booking_count > 50) {
        errors.push('Capacity must be between 1 and 50');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate assignment creation
  static validateAssignmentCreation(data: CreateAssignmentInput): ValidationResult {
    const errors: string[] = [];

    // Container required
    if (!data.class_container_id) {
      errors.push('Container is required');
    }

    // Date required
    if (!data.date) {
      errors.push('Date is required');
    }

    // Time required
    if (!data.start_time || !data.end_time) {
      errors.push('Start and end time are required');
    }

    // Validate time order
    if (data.start_time >= data.end_time) {
      errors.push('End time must be after start time');
    }

    // Validate date not in past
    if (new Date(data.date) < new Date()) {
      errors.push('Cannot create assignment in the past');
    }

    // Validate instructor (required for assignment, but not for container/program)
    if (!data.instructor_id) {
      errors.push('Instructor is required for creating assignment (can be set at program level or here)');
    }

    // Validate timezone
    if (data.timezone && !isValidTimezone(data.timezone)) {
      errors.push('Invalid timezone');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check instructor schedule conflict
  // Note: Handles multiple timezones by:
  // 1. Converting all times to instructor's preferred timezone from instructor_availability table
  // 2. Comparing in unified timezone
  // 3. instructor_availability has fixed timezone per instructor for reference
  static async checkInstructorConflict(
    instructorId: string,
    date: string,
    startTime: string,
    endTime: string,
    timezone: string = 'Asia/Kolkata'
  ): Promise<ConflictResult> {
    // Get instructor's preferred timezone from instructor_availability
    const { data: instructorAvailability } = await supabase
      .from('instructor_availability')
      .select('*')
      .eq('instructor_id', instructorId)
      .limit(1)
      .single();
    
    // Convert input times to instructor's timezone for comparison
    const instructorTz = instructorAvailability?.timezone || 'Asia/Kolkata';
    const normalizedStartTime = convertToTimezone(startTime, timezone, instructorTz);
    const normalizedEndTime = convertToTimezone(endTime, timezone, instructorTz);

    const { data: existingAssignments } = await supabase
      .from('class_assignments')
      .select('id, start_time, end_time, timezone')
      .eq('instructor_id', instructorId)
      .eq('date', date)
      .neq('class_status', 'cancelled')
      .neq('class_status', 'rescheduled');

    const conflicts = existingAssignments?.filter(existing => {
      // Normalize existing assignment times to instructor timezone
      const existingStart = convertToTimezone(
        existing.start_time, 
        existing.timezone || 'Asia/Kolkata',
        instructorTz
      );
      const existingEnd = convertToTimezone(
        existing.end_time,
        existing.timezone || 'Asia/Kolkata', 
        instructorTz
      );
      
      return this.timeOverlaps(
        normalizedStartTime,
        normalizedEndTime,
        existingStart,
        existingEnd
      );
    });

    return {
      hasConflict: conflicts && conflicts.length > 0,
      conflictingAssignments: conflicts || []
    };
  }

  // Validate crash course assignment
  static validateCrashCourseAssignment(data: CreateAssignmentInput[]): ValidationResult {
    const errors: string[] = [];

    // Crash courses must have all assignments created upfront
    if (data.length === 0) {
      errors.push('Crash course must have at least one assignment');
    }

    // All assignments must be within course duration
    const packageDuration = data[0].package?.duration; // e.g., "4 weeks"
    if (packageDuration) {
      const startDate = new Date(data[0].date);
      const endDate = new Date(data[data.length - 1].date);
      const durationDays = this.parseDuration(packageDuration);
      
      const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (actualDays > durationDays) {
        errors.push(`Assignments span ${actualDays} days but package duration is ${durationDays} days`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper: Check time overlap
  private static timeOverlaps(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    return start1 < end2 && end1 > start2;
  }
}
```

### Database-Level Validation (Existing Triggers)

```sql
-- Already exists - don't modify
CREATE OR REPLACE FUNCTION check_container_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if adding this booking exceeds capacity
  DECLARE
    current_count INTEGER;
    max_count INTEGER;
  BEGIN
    SELECT current_booking_count, max_booking_count
    INTO current_count, max_count
    FROM class_containers
    WHERE id = NEW.class_container_id;

    IF current_count >= max_count THEN
      RAISE EXCEPTION 'Container capacity exceeded';
    END IF;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;
```

**V2's Responsibility:** Mirror this logic in UI before attempting insert.

---

## 📱 Mobile PWA Implementation

### Progressive Web App Features

```typescript
// manifest.json (existing - ensure v2 routes included)
{
  "name": "Yogique Class Management",
  "short_name": "Yogique",
  "start_url": "/dashboard/classes-v2",
  "display": "standalone",
  "theme_color": "#4F46E5",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

// Service worker caching strategy
const CACHE_NAME = 'yogique-v2-cache-v1';
const urlsToCache = [
  '/dashboard/classes-v2',
  '/dashboard/assignments-v2',
  // Static assets
  '/icons/',
  '/fonts/'
];
```

### Mobile-Specific Components

```typescript
// useMobileDetect.ts
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// MobileContainerCard.tsx (completely different from desktop)
export const MobileContainerCard: React.FC<Props> = ({ container }) => {
  const [expanded, setExpanded] = useState(false);
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: () => handleEdit(),
    onSwipeRight: () => handleDelete()
  });

  return (
    <div
      {...swipeHandlers}
      className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">
              {container.display_name}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {container.instructor.full_name}
            </p>
          </div>
          <ContainerTypeBadge type={container.container_type} />
        </div>

        {/* Capacity bar (large, visual) */}
        <div className="mt-3">
          <CapacityIndicator
            current={container.current_booking_count}
            max={container.max_booking_count}
            size="large"
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <span>📅 {container.assignmentCount} classes</span>
          <span>{formatDateRange(container.dateRange)}</span>
        </div>
      </div>

      {/* Expanded section (animate in) */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 animate-slideDown">
          <div className="space-y-2">
            {container.assignments.slice(0, 3).map(assignment => (
              <MobileAssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button className="flex-1 btn-secondary">
              View All ({container.assignmentCount})
            </button>
            <button className="flex-1 btn-primary">
              + Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Touch Gestures

```typescript
// useSwipeGestures.ts
export function useSwipeGestures(handlers: SwipeHandlers) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handlers.onSwipeLeft?.();
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
    if (isRightSwipe) {
      handlers.onSwipeRight?.();
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
```

---

## 🔄 Polling Strategy

```typescript
// useContainers.ts
export function useContainers(filters?: ContainerFilters) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch function
  const fetchContainers = async () => {
    try {
      const data = await ContainerService.fetchContainers(filters);
      setContainers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchContainers();
  }, [JSON.stringify(filters)]);

  // Polling (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchContainers, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // Manual refresh
  const refresh = () => {
    setLoading(true);
    fetchContainers();
  };

  return {
    containers,
    loading,
    error,
    refresh
  };
}
```

**Benefits:**
- Simple, reliable
- No WebSocket complexity
- Works offline (PWA cache)
- Can be upgraded to real-time later

---

## 🎨 Component Examples

### ContainerCard.tsx

```typescript
interface ContainerCardProps {
  container: Container;
  onView: (container: Container) => void;
  onEdit: (container: Container) => void;
  onDelete: (container: Container) => void;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  onView,
  onEdit,
  onDelete
}) => {
  const capacityStatus = CapacityService.getCapacityStatus(
    container.current_booking_count,
    container.max_booking_count
  );

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(container)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {container.display_name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            👤 {container.instructor.full_name}
          </p>
        </div>
        <ContainerTypeBadge type={container.container_type} />
      </div>

      {/* Capacity */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Capacity</span>
          <span className={`font-medium text-${capacityStatus.color}-600`}>
            {container.current_booking_count} / {container.max_booking_count}
          </span>
        </div>
        <CapacityIndicator
          current={container.current_booking_count}
          max={container.max_booking_count}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>📅 {container.assignmentCount} classes</span>
        <span>{formatDateRange(container.dateRange)}</span>
      </div>

      {/* Actions (show on hover) */}
      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(container); }}
          className="btn-secondary flex-1"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(container); }}
          className="btn-danger flex-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
```

### CapacityIndicator.tsx

```typescript
interface CapacityIndicatorProps {
  current: number;
  max: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  current,
  max,
  size = 'medium',
  showLabel = true
}) => {
  const percentage = CapacityService.calculatePercentage(current, max);
  const status = CapacityService.getCapacityStatus(current, max);

  const heights = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  };

  return (
    <div>
      {/* Progress bar */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full bg-${status.color}-500 transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
          <span>{status.label}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] All assignments have `class_container_id`
- [ ] Zero "Unknown Class" groups
- [ ] < 100ms query time for container list
- [ ] < 3 seconds full page load (mobile 3G)
- [ ] 90+ Lighthouse PWA score
- [ ] Zero capacity validation errors

### User Experience Metrics
- [ ] Admin can create container in < 30 seconds
- [ ] Admin can create assignment in < 15 seconds
- [ ] Mobile touch targets meet 44px minimum
- [ ] Pull-to-refresh works consistently
- [ ] Offline mode caches last 50 containers
- [ ] Search returns results in < 500ms

### Business Metrics
- [ ] 100% container coverage (no orphaned assignments)
- [ ] Capacity utilization visible at a glance
- [ ] Admin time to schedule classes reduced by 50%
- [ ] Zero pricing-related support tickets from this module

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up v2 structure, routing, and basic container list with drawer

**Tasks:**
1. Create `ClassesV2/` module structure under `dashboard/components/Modules/`
2. Add v2 route to `roleConfig.ts` (`/dashboard/classes-v2`)
3. Create type definitions (`container.types.ts`, `assignment.types.ts`)
4. Create service layer (`container.service.ts`)
5. Create `useContainers` hook with polling
6. Create `ClassesDashboard` component (main page)
7. Create `ContainerCard` component (read-only)
8. Create `ContainerDrawer` component (slide-out, read-only)
9. Create `EmptyState` component
10. Test: Can view containers and open drawer

**Deliverable:** Admin can navigate to `/dashboard/classes-v2`, see container list, and click to view details in drawer

---

### Phase 2: Container CRUD (Week 2)
**Goal:** Create, edit, delete containers via modals

**Tasks:**
1. Create `ContainerForm` component (reusable form fields)
2. Create `CreateContainerModal` component
3. Create `EditContainerModal` component
4. Create `DeleteConfirmModal` component
5. Implement create container flow (modal → API → refresh list)
6. Implement edit container flow (drawer → modal → API → refresh)
7. Implement delete container (confirmation → soft delete)
8. Add client-side validation (`ValidationService`)
9. Add success/error toasts
10. Test: Full CRUD operations without leaving page

**Deliverable:** Admin can create, edit, delete containers - all actions on single page

---

### Phase 3: Assignment Management (Week 3)
**Goal:** Create/edit assignments within containers via modals

**Tasks:**
1. Create `AssignmentList` component (inside drawer)
2. Create `AssignmentCard` component (single assignment item)
3. Create `AssignmentForm` component (reusable form fields)
4. Create `CreateAssignmentModal` component (pre-filled with container)
5. Create `EditAssignmentModal` component
6. Create `DateTimePicker` component
7. Implement create assignment flow (drawer → modal → API → refresh)
8. Add instructor conflict checking
9. Create `assignment.service.ts`
10. Add assignment quick actions (Edit, Delete)
11. Test: Can create/edit assignments from drawer

**Deliverable:** Admin can manage assignments within container drawer - no page navigation

---

### Phase 4: Mobile PWA (Week 4)
**Goal:** Mobile-optimized experience

**Tasks:**
1. Create `MobileContainerCard` component
2. Implement swipe gestures
3. Create bottom sheet for details
4. Add FAB for quick create
5. Implement pull-to-refresh
6. Add haptic feedback
7. Test PWA manifest
8. Test offline mode

**Deliverable:** Fully functional mobile app experience

---

### Phase 5: Filters & Search (Week 5)
**Goal:** Advanced filtering and search

**Tasks:**
1. Create `ContainerFilters` component
2. Implement filter logic in service
3. Add search functionality
4. Add sorting options
5. Create filter URL params for sharing
6. Test: All filter combinations

**Deliverable:** Admin can find containers quickly

---

### Phase 6: Capacity Visualization (Week 6)
**Goal:** Visual capacity management

**Tasks:**
1. Create `CapacityIndicator` component
2. Create `CapacityBadge` component
3. Add color-coded status
4. Create capacity analytics view
5. Add capacity alerts
6. Test: Capacity updates in real-time

**Deliverable:** Clear capacity visibility

---

### Phase 7: Polish & Testing (Week 7)
**Goal:** Production-ready quality

**Tasks:**
1. Add loading skeletons
2. Add error boundaries
3. Add success/error toasts
4. Improve animations
5. Add keyboard shortcuts (desktop)
6. Accessibility audit (WCAG 2.1)
7. Performance optimization
8. Cross-browser testing

**Deliverable:** Polished, production-ready UI

---

### Phase 8: Documentation & Handoff (Week 8)
**Goal:** Complete documentation

**Tasks:**
1. Update README with v2 routes
2. Create admin user guide
3. Create developer documentation
4. Add inline code comments
5. Create video walkthrough
6. Migration guide (v1 → v2 eventually)

**Deliverable:** Fully documented system

---

## 🔧 Configuration Changes

### roleConfig.ts

```typescript
// Add v2 routes
export const roleConfig = {
  super_user: {
    modules: [
      // ... existing modules
      {
        id: 'classes-v2',
        title: 'Classes V2',
        component: 'ClassesDashboardV2',
        icon: 'calendar',
        order: 4.5,
        path: '/dashboard/classes-v2'
      }
    ]
  },
  admin: {
    modules: [
      // ... existing modules
      {
        id: 'classes-v2',
        title: 'Classes V2',
        component: 'ClassesDashboardV2',
        icon: 'calendar',
        order: 4.5,
        path: '/dashboard/classes-v2'
      }
    ]
  }
};
```

### Routing

```typescript
// App routing (single route for V2)
<Route path="/dashboard">
  {/* Existing routes */}
  <Route path="class-assignments" element={<ClassAssignmentManager />} /> {/* V1 */}
  
  {/* V2 Route - SINGLE PAGE, ALL ACTIONS VIA MODALS/DRAWER */}
  <Route path="classes-v2" element={<ClassesDashboard />} />
</Route>

// Note: No separate routes for create/edit
// Everything happens on /dashboard/classes-v2 via:
// - ContainerDrawer (slide-out)
// - Modals (overlays)
// - Bottom sheets (mobile)
```

---

## 🚨 Critical Implementation Notes

### 1. Never Modify These
- ❌ `class_containers` table structure
- ❌ `class_assignments` table structure
- ❌ Database triggers
- ❌ T-5 automation edge functions
- ❌ Invoice generation logic

### 2. Always Validate
- ✅ Container type rules (individual = 1 capacity)
- ✅ Instructor schedule conflicts
- ✅ Date/time validity
- ✅ Container active status

### 3. Pricing Separation
- ❌ No `payment_amount` in assignment form
- ❌ No `payment_status` in assignment list
- ❌ No invoice generation buttons
- ✅ All invoicing happens in `/dashboard/invoice-management`

### 4. Mobile Performance
- ✅ Lazy load assignment lists
- ✅ Virtualize long lists (> 50 items)
- ✅ Cache API responses (30s)
- ✅ Compress images
- ✅ Minimize bundle size

### 5. Error Handling
```typescript
// Always handle capacity errors gracefully
try {
  await ContainerService.createAssignment(data);
} catch (error) {
  if (error.message.includes('capacity exceeded')) {
    showError('This container is at full capacity. Please create a new container or remove bookings.');
  } else if (error.message.includes('conflict')) {
    showError('Instructor has another class scheduled at this time.');
  } else {
    showError('Failed to create assignment. Please try again.');
  }
}
```

---

## 📚 API Reference

### Container Service

```typescript
ContainerService.fetchContainers(filters?: ContainerFilters): Promise<Container[]>
ContainerService.createContainer(data: CreateContainerInput): Promise<Container>
ContainerService.updateContainer(id: string, data: UpdateContainerInput): Promise<Container>
ContainerService.deleteContainer(id: string): Promise<void>
ContainerService.getContainerById(id: string): Promise<Container>
```

### Assignment Service

```typescript
AssignmentService.fetchAssignments(containerId: string): Promise<Assignment[]>
AssignmentService.createAssignment(data: CreateAssignmentInput): Promise<Assignment>
AssignmentService.updateAssignment(id: string, data: UpdateAssignmentInput): Promise<Assignment>
AssignmentService.deleteAssignment(id: string): Promise<void>
AssignmentService.checkConflicts(data: ConflictCheckInput): Promise<ConflictResult>
```

### Capacity Service

```typescript
CapacityService.canAcceptBooking(containerId: string): Promise<boolean>
CapacityService.getCapacityStatus(current: number, max: number): CapacityStatus
CapacityService.calculatePercentage(current: number, max: number): number
```

---

## 🎯 Next Steps

1. **Review this document** with team
2. **Ask questions** - clarify any unclear points
3. **Approve architecture** - sign off on approach
4. **Start Phase 1** - foundation work
5. **Weekly check-ins** - track progress
6. **Deploy to dev** - validate with real data
7. **Deploy to production** - gradual rollout

---

## 📞 Support & Questions

**During Implementation:**
- Tag all v2 code with `// V2:` comments
- Use feature flag for gradual rollout
- Keep v1 running in parallel
- Monitor error logs closely

**After Launch:**
- Collect user feedback
- Monitor performance metrics
- Plan v1 → v2 migration timeline
- Consider deprecating v1 after 3 months

---

**Document Status:** ✅ Complete - Ready for Review  
**Next Action:** Await approval and questions from team  
**Estimated Implementation Time:** 8 weeks (1 developer full-time)

