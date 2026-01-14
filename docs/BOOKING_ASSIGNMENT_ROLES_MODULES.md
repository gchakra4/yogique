# Booking Assignment: Module & Role Permissions Guide

**Date:** January 14, 2026  
**Related:** CLASS_ASSIGNMENT_V2_ARCHITECTURE.md  
**Topic:** Who assigns bookings and which modules handle it

---

## 🎯 Quick Answer

**Q: Admin/other roles assigns booking? Which module to add for other roles to get permission to add bookings?**

**A: Bookings are assigned via:**

### 1. **Booking Management Module** (`/dashboard/booking_management`)
   - **Primary Module:** `BookingManagement` component
   - **Current Access:** Only `super_admin` role
   - **Path:** `/dashboard/booking_management`
   - **Purpose:** View all bookings, link to programs, manage booking details

### 2. **Programs V2 Module** (`/dashboard/programs-v2`) - NEW
   - **Module:** `ProgramsDashboard` component  
   - **Proposed Access:** `super_admin`, `admin`, `yoga_acharya`
   - **Path:** `/dashboard/programs-v2`
   - **Purpose:** Create programs, assign students to programs

### 3. **Automatic Assignment** (pg_cron)
   - **Method:** Background automation
   - **No UI needed:** Runs automatically for recurring bookings

---

## 📊 Current Role Configuration

### Existing Modules Access (from `roleConfig.ts`)

```typescript
// Current configuration in roleConfig.ts

super_admin: [
  { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
  { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 5 },
  // ... other modules
]

admin: [
  // ❌ NO booking_management access currently!
  // ❌ NO class_assignment access currently!
  { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
  { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
  // ... other modules
]

yoga_acharya: [
  { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 3 },
  // ❌ NO booking_management access
  // ... other modules
]

instructor: [
  { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
  // ❌ NO booking_management access
  // ❌ NO class_assignment access
]
```

### 🔴 Problem Identified:
- **Only `super_admin`** can access Booking Management
- **Regular `admin`** role cannot view/manage bookings
- **Other roles** have no way to assign bookings to programs

---

## ✅ Recommended Solution

### Option 1: Extend Existing Booking Management Module

Add booking assignment feature to existing `BookingManagement` module:

```typescript
// Update roleConfig.ts

export const ROLE_MODULES: Record<UserRole, ModuleConfig[]> = {
  super_admin: [
    // Keep existing access
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    // ... other modules
  ],

  admin: [
    // ADD booking_management access
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 10 },
    // ... other modules
  ],

  yoga_acharya: [
    // ADD booking_management access (read-only or limited)
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 7 },
    { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 3 },
    // ... other modules
  ],

  instructor: [
    // ADD read-only booking view (optional - only their classes)
    { id: 'assigned_bookings', title: 'My Students', component: 'AssignedBookings', icon: 'users', order: 2 },
    // ... other modules
  ],
};
```

**Pros:**
- Uses existing, proven module
- Minimal new code needed
- Admins already familiar with UI

**Cons:**
- May need permission checks within the component
- Current BookingManagement component might need refactor for role-based features

---

### Option 2: New "Assign Students" Feature in V2 Programs Module

Add booking assignment directly in Programs V2:

```typescript
// Add V2 module to roleConfig.ts

export const ROLE_MODULES: Record<UserRole, ModuleConfig[]> = {
  super_admin: [
    { id: 'programs_v2', title: 'Programs V2', component: 'ProgramsDashboard', icon: 'grid', order: 5.5 },
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    // ... other modules
  ],

  admin: [
    { id: 'programs_v2', title: 'Programs V2', component: 'ProgramsDashboard', icon: 'grid', order: 5.5 },
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    // ... other modules
  ],

  yoga_acharya: [
    { id: 'programs_v2', title: 'Programs V2', component: 'ProgramsDashboard', icon: 'grid', order: 2 },
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 7 },
    // ... other modules
  ],

  instructor: [
    // Optional: Read-only access to see their programs
    { id: 'programs_v2', title: 'My Programs', component: 'ProgramsDashboard', icon: 'grid', order: 2, readOnly: true },
  ],
};
```

**Pros:**
- All program management in one place
- Clean separation from legacy V1
- Built with booking assignment in mind from the start

**Cons:**
- Need to build new UI features
- More upfront development work

---

## 🔄 Complete Booking Assignment Workflow

### From Booking Creation to Program Assignment

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Books Class                                    │
├─────────────────────────────────────────────────────────────┤
│ User → /book/individual or /book/corporate                  │
│   ↓                                                          │
│ Fills booking form                                          │
│   ↓                                                          │
│ Booking created in `bookings` table                         │
│   • status = 'pending' or 'confirmed'                       │
│   • class_package_id set                                    │
│   • is_recurring = true/false                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: Admin Reviews Booking                               │
├─────────────────────────────────────────────────────────────┤
│ Admin → /dashboard/booking_management                       │
│   ↓                                                          │
│ Views pending/confirmed bookings                            │
│   ↓                                                          │
│ Clicks on booking to view details                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 3: Assign Booking to Program (Manual)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Option A: From Booking Management Module                    │
│ ────────────────────────────────────────                    │
│ 1. Click [Assign to Program] button                         │
│ 2. Modal opens showing:                                     │
│    • Available programs (matching package/instructor)       │
│    • OR [+ Create New Program] button                       │
│ 3. Select program OR create new                             │
│ 4. System creates entry in `assignment_bookings`:          │
│    INSERT INTO assignment_bookings (                        │
│      booking_id,                                            │
│      class_container_id,                                    │
│      assignment_id  -- NULL initially, filled when         │
│                     -- assignments created                  │
│    )                                                        │
│                                                              │
│ Option B: From Programs V2 Module                           │
│ ────────────────────────────────────                        │
│ 1. Admin → /dashboard/programs-v2                           │
│ 2. Opens program drawer                                     │
│ 3. Clicks [Assign Students] button                          │
│ 4. Modal shows available bookings:                          │
│    • Filter by package match                                │
│    • Filter by not-yet-assigned                             │
│    • Search by student name                                 │
│ 5. Select booking(s) to enroll                              │
│ 6. System creates `assignment_bookings` entries             │
│                                                              │
│ Option C: Automatic (pg_cron T-5)                           │
│ ────────────────────────────────────                        │
│ 1. pg_cron runs daily                                       │
│ 2. Finds recurring bookings (is_recurring = true)          │
│ 3. Auto-links to existing program OR creates new           │
│ 4. Creates `assignment_bookings` entries                    │
│ 5. Creates assignments for next month                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 4: Result                                               │
├─────────────────────────────────────────────────────────────┤
│ • Student enrolled in program                                │
│ • Capacity counter updates                                   │
│ • Student can see their classes                              │
│ • Admin can manage assignments for this booking              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Mockup: Booking Assignment Feature

### In Booking Management Module

```
┌────────────────────────────────────────────────────────────┐
│ 📅 Class Bookings (BookingManagement)                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ [Search...] [Filter: All Status ▼] [Date: All Time ▼]     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Booking: YOG-20260114-0001                          │   │
│ │ Student: John Doe (john@email.com)                  │   │
│ │ Package: Monthly 12-Class Individual                │   │
│ │ Status: Confirmed                                   │   │
│ │ Instructor: Not assigned yet                        │   │
│ │                                                      │   │
│ │ ─────────────────────────────────────────────────   │   │
│ │                                                      │   │
│ │ Program Assignment:                                 │   │
│ │  ● Not assigned to any program yet                  │   │
│ │                                                      │   │
│ │  [📎 Assign to Program]  [+ Create New Program]    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘

When [📎 Assign to Program] clicked:

┌────────────────────────────────────────────────────────────┐
│ Assign Student to Program                                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Student: John Doe                                          │
│ Package: Monthly 12-Class Individual                       │
│                                                             │
│ Available Programs (matching package):                     │
│                                                             │
│ ○ Monthly Yoga - Sarah Johnson (1/1 capacity - FULL)      │
│ ○ Monthly Yoga - Sarah Johnson (0/1 capacity) ✓           │
│ ○ Monthly Yoga - Mike Chen (0/1 capacity)                 │
│                                                             │
│ [Show programs for other instructors]                      │
│                                                             │
│ Or create new program:                                     │
│ [+ Create New Program from Package]                        │
│                                                             │
│                          [Cancel] [Assign to Selected]     │
└────────────────────────────────────────────────────────────┘
```

### In Programs V2 Module

```
┌────────────────────────────────────────────────────────────┐
│ 🎯 Programs Dashboard (V2)                                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ [Program Grid/Cards...]                                    │
│                                                             │
│  Click Program Card → Drawer Opens                         │
│                                                             │
└────────────────────────────────────────────────────────────┘

Program Drawer (Right Side):
┌────────────────────────────────────┐
│ ← Monthly Yoga - Sarah Johnson    │
│ CONT-001 • Individual             │
├────────────────────────────────────┤
│ 📊 Capacity: 1/1 (Full)           │
│ 📅 Jan 15 - Mar 31, 2026          │
│                                    │
│ 👥 Enrolled Students (1):         │
│ ├─ John Doe                       │
│ │  YOG-20260114-0001              │
│ │  Status: Confirmed              │
│ │  [View Booking]                 │
│                                    │
│ [+ Assign More Students]          │  ← Opens student selector
├────────────────────────────────────┤
│ Assignments (12)                   │
│ ✓ Jan 15 @ 9:00 AM (Completed)    │
│ ⏰ Jan 17 @ 9:00 AM (Upcoming)     │
│ ...                                │
└────────────────────────────────────┘

When [+ Assign More Students] clicked:

┌────────────────────────────────────┐
│ Assign Students to Program         │
├────────────────────────────────────┤
│ Program: Monthly Yoga - Sarah      │
│ Current: 1/1 (At capacity!)        │
│                                     │
│ ⚠️ Program at full capacity         │
│                                     │
│ Available Actions:                 │
│ [Edit Program] → Increase capacity │
│ [View Waitlist]                    │
│                                     │
│              [Close]                │
└────────────────────────────────────┘

If capacity available:

┌────────────────────────────────────┐
│ Assign Students to Program         │
├────────────────────────────────────┤
│ Program: Public Yoga Group         │
│ Current: 5/30 (25 slots left)      │
│                                     │
│ [Search bookings...]               │
│                                     │
│ Available Bookings:                │
│                                     │
│ ☐ Jane Smith (YOG-20260114-0002)  │
│   Monthly 12-Class Public Group    │
│   Preferred: Mon/Wed 6PM           │
│                                     │
│ ☐ Bob Wilson (YOG-20260114-0003)  │
│   Monthly 12-Class Public Group    │
│   Preferred: Mon/Wed 6PM           │
│                                     │
│      [Cancel] [Assign Selected]    │
└────────────────────────────────────┘
```

---

## 🔐 Recommended Role Permissions

### Level 1: Read-Only (Instructor)

```typescript
permissions: {
  bookings: {
    view: true,        // Can see assigned students only
    create: false,
    update: false,
    delete: false,
    assign: false,     // Cannot assign to programs
  },
  programs: {
    view: true,        // Can see their own programs only
    create: false,
    update: false,     // Cannot edit programs
    delete: false,
    assign: false,
  }
}
```

### Level 2: Limited (Yoga Acharya)

```typescript
permissions: {
  bookings: {
    view: true,        // Can see all bookings
    create: false,
    update: true,      // Can update booking details
    delete: false,
    assign: true,      // Can assign to existing programs
  },
  programs: {
    view: true,        // Can see all programs
    create: true,      // Can create new programs
    update: true,      // Can edit programs
    delete: false,
    assign: true,      // Can assign students
  }
}
```

### Level 3: Full Admin

```typescript
permissions: {
  bookings: {
    view: true,
    create: true,
    update: true,
    delete: true,
    assign: true,
  },
  programs: {
    view: true,
    create: true,
    update: true,
    delete: true,
    assign: true,
  }
}
```

### Level 4: Super Admin

```typescript
permissions: {
  bookings: {
    view: true,
    create: true,
    update: true,
    delete: true,      // Can hard delete
    assign: true,
    bulkAssign: true,  // Can bulk assign
  },
  programs: {
    view: true,
    create: true,
    update: true,
    delete: true,      // Can hard delete
    assign: true,
    bulkAssign: true,
  },
  automation: {
    viewLogs: true,    // Can see pg_cron logs
    manualTrigger: true, // Can manually trigger T-5
  }
}
```

---

## 🚀 Implementation Steps

### Step 1: Extend roleConfig.ts

```typescript
// File: src/shared/config/roleConfig.ts

export const ROLE_MODULES: Record<UserRole, ModuleConfig[]> = {
  super_admin: [
    // ... existing modules ...
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    { id: 'programs_v2', title: 'Programs V2', component: 'ProgramsDashboard', icon: 'grid', order: 5.5 },
  ],

  admin: [
    // ... existing modules ...
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 11 },
    { id: 'programs_v2', title: 'Programs V2', component: 'ProgramsDashboard', icon: 'grid', order: 10 },
  ],

  yoga_acharya: [
    // ... existing modules ...
    { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 7 },
    { id: 'programs_v2', title: 'Programs V2', component: 'ProgramsDashboard', icon: 'grid', order: 2 },
  ],

  instructor: [
    // ... existing modules ...
    { id: 'assigned_bookings', title: 'My Students', component: 'AssignedBookings', icon: 'users', order: 2 },
    { id: 'programs_v2', title: 'My Programs', component: 'ProgramsDashboard', icon: 'grid', order: 3, readOnly: true },
  ],
};
```

### Step 2: Add Permission Checks

```typescript
// File: src/shared/utils/permissions.ts

export interface UserPermissions {
  bookings: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    assign: boolean;
  };
  programs: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    assign: boolean;
  };
}

export function getUserPermissions(role: UserRole): UserPermissions {
  const permissionMap: Record<UserRole, UserPermissions> = {
    super_admin: {
      bookings: { view: true, create: true, update: true, delete: true, assign: true },
      programs: { view: true, create: true, update: true, delete: true, assign: true },
    },
    admin: {
      bookings: { view: true, create: true, update: true, delete: true, assign: true },
      programs: { view: true, create: true, update: true, delete: true, assign: true },
    },
    yoga_acharya: {
      bookings: { view: true, create: false, update: true, delete: false, assign: true },
      programs: { view: true, create: true, update: true, delete: false, assign: true },
    },
    instructor: {
      bookings: { view: true, create: false, update: false, delete: false, assign: false },
      programs: { view: true, create: false, update: false, delete: false, assign: false },
    },
    // ... other roles
  };

  return permissionMap[role] || permissionMap.user;
}
```

### Step 3: Update BookingManagement Component

```typescript
// File: src/features/dashboard/components/Modules/BookingManagement.tsx

import { getUserPermissions } from '../../../../shared/utils/permissions';

export function BookingManagement() {
  const { user } = useAuth();
  const permissions = getUserPermissions(user.role);

  // Only show "Assign to Program" if user has permission
  const canAssign = permissions.bookings.assign;

  return (
    <div>
      {/* Booking details */}
      
      {canAssign && (
        <div className="mt-4">
          <h3>Program Assignment</h3>
          {booking.assignedProgram ? (
            <div>
              Assigned to: {booking.assignedProgram.display_name}
              <button onClick={handleUnassign}>Unassign</button>
            </div>
          ) : (
            <div>
              <button onClick={handleAssignToProgram}>
                Assign to Program
              </button>
              <button onClick={handleCreateNewProgram}>
                Create New Program
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Create AssignmentService

```typescript
// File: src/features/dashboard/services/v2/assignment-bookings.service.ts

export class AssignmentBookingsService {
  // Link booking to program
  static async assignBookingToProgram(
    bookingId: string,
    programId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('assignment_bookings')
      .insert({
        booking_id: bookingId,
        class_container_id: programId,
        assignment_id: null, // Will be filled when assignments created
      });

    if (error) throw error;
  }

  // Get bookings for a program
  static async getBookingsForProgram(programId: string) {
    const { data, error } = await supabase
      .from('assignment_bookings')
      .select(`
        booking_id,
        bookings:bookings!booking_id (*)
      `)
      .eq('class_container_id', programId);

    if (error) throw error;
    return data;
  }

  // Get programs for a booking
  static async getProgramsForBooking(bookingId: string) {
    const { data, error } = await supabase
      .from('assignment_bookings')
      .select(`
        class_container_id,
        class_containers:class_containers!class_container_id (*)
      `)
      .eq('booking_id', bookingId);

    if (error) throw error;
    return data;
  }

  // Unassign booking from program
  static async unassignBookingFromProgram(
    bookingId: string,
    programId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('assignment_bookings')
      .delete()
      .eq('booking_id', bookingId)
      .eq('class_container_id', programId);

    if (error) throw error;
  }
}
```

---

## 📋 Summary & Recommendations

### ✅ Recommended Approach:

1. **Extend Access to Booking Management:**
   - Add `booking_management` module to `admin` role
   - Add `booking_management` module to `yoga_acharya` role (limited permissions)
   
2. **Build V2 Programs Module with Built-in Assignment:**
   - Add "Assign Students" feature in program drawer
   - Show enrolled students in program details
   - Allow quick assignment from program view

3. **Create Permission System:**
   - Implement role-based permission checks
   - Show/hide features based on permissions
   - Prevent unauthorized actions at API level

4. **Enhance BookingManagement:**
   - Add "Assign to Program" button in booking details
   - Show program assignment status
   - Allow unassignment/reassignment

### 📅 Implementation Timeline:

- **Week 1:** Update roleConfig, add permissions system
- **Week 2:** Extend BookingManagement with assignment feature
- **Week 3:** Build V2 program assignment UI
- **Week 4:** Testing & refinement

---

**Next:** Update roleConfig.ts and start implementation! 🚀
