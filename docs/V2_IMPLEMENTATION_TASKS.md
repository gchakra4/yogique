# Classes V2 Implementation Task Tracker

**Project:** Classes V2 (Programs Dashboard)  
**Start Date:** January 14, 2026  
**Estimated Duration:** 9 weeks  
**Status:** 🟡 In Progress

---

## 🧭 Golden Rule

**🟣 PRO (Claude Sonnet)** → Design, Architecture, Trade-offs, Multi-doc synthesis  
**🟢 MINI (GPT-5 mini)** → Mechanical coding, Pattern repetition, Already-decided tasks

---

## 📊 Progress Overview

- **Total Tasks:** 65
- **Pro Tasks:** 19 (Design & Architecture)
- **Mini Tasks:** 46 (Implementation)
- **Completed:** 15 / 65
- **In Progress:** 0 / 65
- **Blocked:** 0 / 65

---

## 📋 Phase 1: Foundation Setup (Week 1)

**Goal:** Project structure, types, services skeleton, basic routing

### Task 1.1: Project Structure Planning
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Critical
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Review existing src/ structure and validate V2 folder structure from architecture doc
- [x] **Deliverable:** Approved folder structure list
- [x] **Prompt:** "Review existing src/ structure in this workspace and confirm the V2 folder structure from CLASS_ASSIGNMENT_V2_ARCHITECTURE.md (File Structure section). Check for naming conflicts with existing modules."
- [x] **Output Location:** Comment or separate doc
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

### Task 1.2: Create Folder Structure
- [x] **Model:** 🟢 MINI
- [x] **Priority:** Critical
- [x] **Estimated Time:** 15 minutes
- [x] **Dependencies:** Task 1.1 ✓
- [x] **Description:** Create all folders under src/features/dashboard/components/Modules/ClassesV2/
- [x] **Deliverable:** Complete folder structure with .gitkeep files
- [x] **Prompt:** "Create the following folder structure under src/features/dashboard/components/Modules/: ClassesV2/ ├── components/ │ ├── modals/ │ ├── mobile/ │ └── [other folders from Task 1.1] ├── forms/ ├── services/ ├── hooks/ ├── types/ └── utils/. Add .gitkeep to empty folders."
- [x] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

### Task 1.3: TypeScript Type Definitions Design
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Critical
- [x] **Estimated Time:** 2 hours
- [x] **Dependencies:** None
- [x] **Description:** Design TypeScript interfaces based on database schema and business rules
- [x] **Deliverable:** Complete type definitions with JSDoc comments
- [x] **Prompt:** "Based on CLASS_ASSIGNMENT_V2_ARCHITECTURE.md database schema and CLASS_TYPE_MANAGER_V2_INTEGRATION.md, design TypeScript interfaces for: Container (Program), Assignment, Package, Booking. Consider: Optional vs required fields, Instructor optional at program level, Timezone handling, Readonly fields from database."
- [x] **Output Location:** Comment for Task 1.4
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

### Task 1.4: Create Type Files
- [x] **Model:** 🟢 MINI
- [x] **Priority:** Critical
- [x] **Estimated Time:** 30 minutes
- [x] **Dependencies:** Task 1.3 ✓
- [x] **Description:** Create type definition files from Pro's design
- [x] **Deliverable:** Type files with interfaces and exports
- [x] **Prompt:** "Create these type definition files using interfaces from Task 1.3: 1. src/features/dashboard/types/v2/container.types.ts 2. src/features/dashboard/types/v2/assignment.types.ts 3. src/features/dashboard/types/v2/capacity.types.ts"
- [x] **Output Location:** src/features/dashboard/types/v2/
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

### Task 1.5: Route Configuration Strategy
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Decide on route naming, permission levels, avoid V1 conflicts
- [x] **Deliverable:** Route configuration strategy document
- [x] **Prompt:** "Review roleConfig.ts and BOOKING_ASSIGNMENT_ROLES_MODULES.md. Decide: Best route name (/programs-v2 or /classes-v2)? Which roles get access initially? How to avoid conflicts with existing class_assignment route? Should we use feature flags?"
- [x] **Output Location:** Comment for Task 1.6
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

## 📋 Task 1.5 Deliverable: Route Configuration Strategy

### Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Route Name** | `/dashboard/programs-v2` | Business-friendly, aligns with "Programs" terminology in architecture |
| **Module ID** | `programs_v2` | Clear versioning, no conflicts with `class_assignment` |
| **Component Name** | `ClassesDashboard` | Technical clarity (maps to ClassesV2 folder) |
| **Display Title** | `Programs` (super_admin/admin)<br>`My Programs` (instructor - future) | User-facing, simple naming |
| **Initial Access** | `super_admin`, `admin` only | Safe rollout to power users first |
| **Feature Flags** | ❌ No - use role-based access | Simpler; role config sufficient for gradual rollout |
| **V1 Coexistence** | Keep `class_assignment` route active | Zero disruption; validate V2 before deprecating V1 |

### Route Configuration to Add

```typescript
// In roleConfig.ts

export type DashboardModule =
  | 'overview'
  | 'user_management'
  // ... existing modules
  | 'class_assignment'        // ← Keep existing V1
  | 'programs_v2'              // ← Add new V2
  | 'booking_management'
  // ... other modules

export const ROLE_MODULES: Record<UserRole, ModuleConfig[]> = {
  super_admin: [
    { id: 'message_monitor', title: 'Message Monitoring', component: 'MessageMonitor', icon: 'monitor', order: 3 },
    { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
    { id: 'rate_management', title: 'Rate Management', component: 'InstructorRatesPage', icon: 'dollar-sign', order: 4 },
    
    // ✅ Keep V1 for now (order 5)
    { id: 'class_assignment', title: 'Class Management (V1)', component: 'ClassAssignmentManager', icon: 'edit', order: 5 },
    
    // ✅ Add V2 (order 5.5 - between V1 and article management)
    { id: 'programs_v2', title: 'Programs', component: 'ClassesDashboard', icon: 'grid', order: 5.5 },
    
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 6 },
    // ... rest of super_admin modules
  ],

  admin: [
    { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
    { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
    { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
    { id: 'rate_management', title: 'Rate Management', component: 'InstructorRatesPage', icon: 'dollar-sign', order: 4 },
    
    // ✅ Add V2 to admin role (no V1 access for admin currently)
    { id: 'programs_v2', title: 'Programs', component: 'ClassesDashboard', icon: 'grid', order: 5 },
    
    { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 6 },
    // ... rest of admin modules
  ],

  yoga_acharya: [
    { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
    
    // ✅ Keep V1 for yoga_acharya (they already use it)
    { id: 'class_assignment', title: 'Class Management (V1)', component: 'ClassAssignmentManager', icon: 'edit', order: 3 },
    
    // 🔮 FUTURE: Add V2 access in Phase 8 after testing
    // { id: 'programs_v2', title: 'Programs', component: 'ClassesDashboard', icon: 'grid', order: 2 },
    
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 4 },
    // ... rest of yoga_acharya modules
  ],

  instructor: [
    { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
    
    // 🔮 FUTURE: Add read-only V2 access (Phase 8)
    // { id: 'programs_v2', title: 'My Programs', component: 'ClassesDashboard', icon: 'grid', order: 2, readOnly: true },
    
    { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 2 },
  ],

  // ... other roles unchanged
};
```

### Component Registration

```typescript
// In UniversalDashboard.tsx

// Lazy load V2 component
const ClassesDashboard = React.lazy(() => import('./Modules/ClassesV2/ClassesDashboard'));

// Add to component map
const componentMap = {
  ClassAssignmentManager,          // ← V1 (keep)
  ClassesDashboard,                 // ← V2 (new)
  ArticleManagement,
  UserManagement,
  // ... rest of components
};
```

### Conflict Avoidance Strategy

**1. Module ID Separation**
- V1: `class_assignment` → `/dashboard/class-assignments`
- V2: `programs_v2` → `/dashboard/programs-v2`
- No route collision; both can run simultaneously

**2. Database Isolation**
- V1: Queries with `class_container_id IS NULL` OR uses grouping logic
- V2: Queries with `class_container_id IS NOT NULL` (strict requirement)
- Minimal overlap in practice

**3. Permission Granularity**
```typescript
// Future enhancement (not in Phase 1)
interface ModuleConfig {
  id: DashboardModule | string;
  title: string;
  component: string;
  icon?: string;
  order: number;
  permissions?: {                    // Optional fine-grained permissions
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    assign?: boolean;                 // For booking assignment
  };
}

// Example:
{ 
  id: 'programs_v2', 
  title: 'My Programs', 
  component: 'ClassesDashboard', 
  icon: 'grid', 
  order: 2,
  permissions: { read: true, create: false, update: false, delete: false }  // Read-only for instructors
}
```

### Feature Flag Consideration (Rejected)

**Why No Feature Flags:**
- Role-based access sufficient for controlled rollout
- Simpler codebase (no conditional rendering based on flags)
- Existing `roleConfig.ts` pattern well-established
- Can add roles incrementally (super_admin → admin → yoga_acharya → instructor)

**If Needed Later:**
- Could add to user profile: `features_enabled: string[]`
- Check with: `user.features_enabled?.includes('programs_v2')`
- But: Adds complexity without clear benefit for this use case

### Rollout Plan

**Phase 1 (Current):** Foundation
- Add to `super_admin` and `admin` roles only
- V1 remains primary for all other roles
- Both accessible via sidebar navigation

**Phase 2-7:** Development & Testing
- super_admin/admin test and provide feedback
- V1 remains untouched as fallback

**Phase 8:** Gradual Expansion
- Add read-only access for `instructor` role
- Monitor usage and errors
- Collect user feedback

**Phase 9 (Future):** Full Migration
- Add to `yoga_acharya` role
- Add student view (read-only for their bookings)
- Deprecate V1 route (mark as "Legacy" in title)
- Eventually remove V1 when validated

### Access Control Examples

```typescript
// Example permission check in component
import { hasModuleAccess } from '@/shared/config/roleConfig';

const ClassesDashboard = () => {
  const { user } = useAuth();
  
  // Check if user has access to V2
  const hasV2Access = hasModuleAccess(user.role, 'programs_v2');
  
  if (!hasV2Access) {
    return <Navigate to="/dashboard" />;
  }
  
  // Further granular checks
  const canCreateContainers = ['super_admin', 'admin'].includes(user.role);
  const canDeleteContainers = user.role === 'super_admin';
  const canAssignBookings = ['super_admin', 'admin', 'yoga_acharya'].includes(user.role);
  
  return (
    <div>
      {canCreateContainers && <Button onClick={openCreateModal}>+ Create Program</Button>}
      {/* ... rest of component */}
    </div>
  );
};
```

### Migration Path for Users

**Week 1-4:** Dual Access
- super_admin sees both "Class Management (V1)" and "Programs" in sidebar
- Can compare workflows side-by-side
- Report issues without blocking regular work

**Week 5-8:** Validation
- Admin users added to V2
- Collect feedback on UI/UX
- Fix bugs and refine features

**Week 9+:** Deprecation Planning
- Remove V1 access once V2 validated
- Update documentation
- Train users on new workflows

### URL Structure

```
Current (V1):
/dashboard/class-assignments           → ClassAssignmentManager (legacy)

New (V2):
/dashboard/programs-v2                 → ClassesDashboard (main view)
/dashboard/programs-v2?container=123   → Deep link to specific container drawer

Future (Optional):
/dashboard/programs-v2/analytics       → Analytics sub-route
/dashboard/programs-v2/reports         → Reports sub-route
```

### Icon Selection

**Recommended Icon:** `grid` (Material/Lucide icon)
- Represents modular structure (programs as containers)
- Distinct from V1's `edit` icon
- Business-friendly, modern aesthetic

**Alternatives:**
- `layers` - but already used for Class Type Manager
- `package` - too technical
- `calendar` - conflicts with Booking Management
- `folder` - too generic

---

## 🎯 Summary for Task 1.6 (MINI)

**What to update in `roleConfig.ts`:**

1. Add `'programs_v2'` to `DashboardModule` type union
2. Add module config to `super_admin` array at order 5.5
3. Add module config to `admin` array at order 5
4. Import and register `ClassesDashboard` in `UniversalDashboard.tsx`
5. Keep all V1 routes unchanged

**Implementation Notes:**
- No feature flags needed
- V1 and V2 coexist peacefully
- Gradual rollout via role additions
- Clear versioning in module ID and route
- Business-friendly naming in UI ("Programs" not "Containers")

---

### Task 1.6: Update roleConfig.ts
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 15 minutes
- [x] **Dependencies:** Task 1.5 ✓
- [x] **Description:** Add V2 module to role configuration
- [x] **Deliverable:** Updated roleConfig.ts with new module
- [x] **Prompt:** "Update src/shared/config/roleConfig.ts: Add to super_admin and admin modules per Task 1.5 decision. Update DashboardModule type to include new module ID."
- [x] **Output Location:** src/shared/config/roleConfig.ts
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

### Task 1.7: Service Layer Architecture Design
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Critical
- [x] **Estimated Time:** 2 hours
- [x] **Dependencies:** None
- [x] **Description:** Design service layer with error handling, caching, query patterns
- [x] **Deliverable:** Service architecture design document
- [x] **Prompt:** "Design the service layer architecture for V2: ContainerService methods, PackageService integration, AssignmentService structure. Decide: Class-based or functional? Error handling patterns? Query optimization (joins vs multiple)? Caching strategy?"
- [x] **Output Location:** Comment for Task 1.8
- [x] **Notes:** ✅ Completed Jan 14, 2026

---

## 📋 Task 1.7 Deliverable: Service Layer Architecture Design

### Architecture Overview

**Pattern:** Class-based Services with Singleton Instances  
**Rationale:** Classes provide encapsulation, clear method organization, easy mocking for tests, and align with existing V1 patterns (EmailService, AssignmentCreationService)

### Core Principles

1. **Single Responsibility:** Each service handles one domain (Containers, Assignments, Packages, Capacity, Validation)
2. **Dependency Injection:** Services receive Supabase client instance
3. **Consistent Error Handling:** All methods return typed result objects
4. **Zero Business Logic in Components:** All CRUD + validation in services
5. **Client-Side Caching:** Leverage React Query for data fetching (hooks layer)

---

### 1. Service Base Pattern

```typescript
// Base pattern for all V2 services
import { supabase } from '@/shared/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;        // Machine-readable error code
    message: string;     // User-friendly message
    details?: any;       // Technical details for logging
  };
};

export abstract class BaseService {
  protected client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  protected handleError(error: any, context: string): ServiceResult<never> {
    console.error(`[${this.constructor.name}] ${context}:`, error);
    
    // Map Supabase/Postgres errors to user-friendly messages
    const errorCode = error?.code || 'unknown_error';
    let message = 'An unexpected error occurred. Please try again.';

    switch (errorCode) {
      case '23505': // unique_violation
        message = 'A record with this information already exists.';
        break;
      case '23503': // foreign_key_violation
        message = 'Referenced record does not exist.';
        break;
      case '23514': // check_violation
        message = 'Data validation failed. Please check your inputs.';
        break;
      case 'PGRST116': // no rows returned
        message = 'Record not found.';
        break;
      default:
        if (error?.message) {
          message = error.message;
        }
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message,
        details: error
      }
    };
  }

  protected success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }
}
```

---

### 2. ContainerService Architecture

**Responsibilities:**
- CRUD operations for `class_containers`
- Container code generation (e.g., `CONT-20260114-0001`)
- Display name generation
- Soft delete handling
- Query optimization with joins

```typescript
// ContainerService method signatures

export class ContainerService extends BaseService {
  
  /**
   * List containers with optional filtering and pagination
   * Query Strategy: Single query with LEFT JOINs for related data
   */
  async listContainers(params?: {
    instructorId?: string;
    packageId?: string;
    containerType?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResult<{
    containers: Container[];
    total: number;
  }>> {
    // Single optimized query with joins:
    // - Join instructor profile for name/email
    // - Join package for package details
    // - Count assignments via subquery
    // - Count bookings via assignment_bookings
    // Use .select() with nested syntax for efficiency
  }

  /**
   * Get single container with full details
   * Query Strategy: Single query with all related data
   */
  async getContainer(id: string): Promise<ServiceResult<ContainerDetail>> {
    // Fetch with joins:
    // - Instructor profile
    // - Package
    // - Assignment count
    // - Current booking count
    // - List of assigned bookings (students)
  }

  /**
   * Create new container
   * Business Rules:
   * - Generate container_code if not provided
   * - Auto-generate display_name if not provided
   * - Instructor is optional (can be null)
   * - Capacity validation based on container type
   * - Type-specific validations (crash course dates, etc.)
   */
  async createContainer(data: CreateContainerInput): Promise<ServiceResult<Container>> {
    try {
      // 1. Validate inputs (use ValidationService)
      // 2. Generate container_code
      // 3. Generate display_name
      // 4. Insert with transaction safety
      // 5. Return created container with related data
    } catch (error) {
      return this.handleError(error, 'createContainer');
    }
  }

  /**
   * Update existing container
   * Business Rules:
   * - Cannot change container_code
   * - Cannot change package_id if assignments exist
   * - Capacity can only be increased if bookings exist
   * - Instructor can be updated (even to null)
   */
  async updateContainer(
    id: string, 
    data: UpdateContainerInput
  ): Promise<ServiceResult<Container>> {
    // 1. Fetch existing container
    // 2. Validate update rules
    // 3. Update with optimistic locking
    // 4. Return updated container
  }

  /**
   * Soft delete container
   * Business Rules:
   * - Set is_active = false
   * - Cannot delete if active bookings exist
   * - Cascade warnings (assignments will be hidden)
   */
  async deleteContainer(id: string): Promise<ServiceResult<void>> {
    // 1. Check for active bookings
    // 2. Set is_active = false
    // 3. Log deletion for audit
  }

  /**
   * Generate unique container code
   * Format: CONT-YYYYMMDD-XXXX
   */
  private async generateContainerCode(): Promise<string> {
    // 1. Get today's date
    // 2. Query max sequence for today
    // 3. Increment and format
    // 4. Retry on collision
  }

  /**
   * Generate display name
   * Format: "{PackageName} - {InstructorName|'Unassigned'}"
   */
  private generateDisplayName(
    packageName: string,
    instructorName: string | null,
    containerType: string
  ): string {
    const instructor = instructorName || 'Unassigned';
    return `${packageName} - ${instructor}`;
  }
}
```

**Query Optimization Examples:**

```typescript
// ❌ BAD: Multiple queries (N+1 problem)
const containers = await supabase.from('class_containers').select('*');
for (const c of containers) {
  const instructor = await supabase.from('profiles').select('*').eq('id', c.instructor_id);
  const package = await supabase.from('class_packages').select('*').eq('id', c.package_id);
}

// ✅ GOOD: Single query with joins
const { data: containers } = await supabase
  .from('class_containers')
  .select(`
    *,
    instructor:profiles!instructor_id (id, full_name, email),
    package:class_packages!package_id (id, name, description, sessions_per_month),
    assignments:class_assignments (count)
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

---

### 3. PackageService Architecture

**Responsibilities:**
- Fetch packages from `class_packages` table
- Cache package data (rarely changes)
- Filter by type, active status

```typescript
export class PackageService extends BaseService {
  
  private packageCache: Map<string, { data: Package; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * List packages with optional filtering
   * Caching Strategy: In-memory cache with TTL
   */
  async listPackages(params?: {
    type?: string;
    isActive?: boolean;
    useCache?: boolean;
  }): Promise<ServiceResult<Package[]>> {
    const cacheKey = JSON.stringify(params || {});
    
    if (params?.useCache !== false) {
      const cached = this.packageCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return this.success(cached.data);
      }
    }

    try {
      let query = this.client
        .from('class_packages')
        .select(`
          *,
          class_type:class_types!class_type_id (id, name, description)
        `);

      if (params?.type) query = query.eq('package_type', params.type);
      if (params?.isActive !== undefined) query = query.eq('is_active', params.isActive);

      const { data, error } = await query.order('name');

      if (error) return this.handleError(error, 'listPackages');

      // Cache result
      this.packageCache.set(cacheKey, { data, timestamp: Date.now() });

      return this.success(data);
    } catch (error) {
      return this.handleError(error, 'listPackages');
    }
  }

  /**
   * Get single package by ID
   */
  async getPackage(id: string): Promise<ServiceResult<Package>> {
    // Check cache first, then fetch
  }

  /**
   * Clear package cache (call after package updates)
   */
  clearCache(): void {
    this.packageCache.clear();
  }
}
```

**Caching Strategy:**
- **Package data:** In-memory cache with 5-minute TTL (packages rarely change)
- **Container/Assignment data:** No service-level caching (React Query handles this in hooks)
- **Cache invalidation:** Manual via `clearCache()` after mutations

---

### 4. AssignmentService Architecture

**Responsibilities:**
- CRUD for `class_assignments`
- Assignment code generation
- Bulk operations (create multiple assignments)
- Date/time validation
- Instructor conflict checking (via ValidationService)

```typescript
export class AssignmentService extends BaseService {
  
  /**
   * List assignments for a container
   * Query Strategy: Fetch with instructor join
   */
  async listAssignments(params: {
    containerId: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<ServiceResult<Assignment[]>> {
    // Single query with joins for instructor profile
  }

  /**
   * Create single assignment
   * Business Rules:
   * - container_id is REQUIRED
   * - instructor_id: use container's instructor or override
   * - Generate assignment_code
   * - Validate date/time not in past
   * - Check instructor conflicts (call ValidationService)
   */
  async createAssignment(
    data: CreateAssignmentInput
  ): Promise<ServiceResult<Assignment>> {
    try {
      // 1. Validate inputs
      // 2. Check instructor conflicts
      // 3. Generate assignment_code
      // 4. Insert assignment
      // 5. Return with related data
    } catch (error) {
      return this.handleError(error, 'createAssignment');
    }
  }

  /**
   * Bulk create assignments (for recurring schedules)
   * Transaction Strategy: Use Supabase transactions
   */
  async bulkCreateAssignments(
    assignments: CreateAssignmentInput[]
  ): Promise<ServiceResult<{
    created: Assignment[];
    failed: { input: CreateAssignmentInput; error: string }[];
  }>> {
    // 1. Validate all inputs
    // 2. Batch insert with transaction
    // 3. Return successes and failures
  }

  /**
   * Update assignment
   * Business Rules:
   * - Cannot change container_id
   * - Date/time changes trigger conflict check
   * - Status changes have restrictions
   */
  async updateAssignment(
    id: string,
    data: UpdateAssignmentInput
  ): Promise<ServiceResult<Assignment>> {
    // 1. Fetch existing
    // 2. Validate changes
    // 3. Re-check conflicts if date/time changed
    // 4. Update
  }

  /**
   * Cancel/delete assignment
   * Business Rules:
   * - Check if bookings attached
   * - Cascade handling
   */
  async deleteAssignment(id: string): Promise<ServiceResult<void>> {
    // Soft delete or hard delete based on booking status
  }

  /**
   * Generate unique assignment code
   * Format: YOG-YYYYMMDD-XXXX
   */
  private async generateAssignmentCode(): Promise<string> {
    // Similar to container code generation
  }
}
```

**Transaction Handling Example:**

```typescript
// Bulk insert with transaction safety
async bulkCreateAssignments(assignments: CreateAssignmentInput[]) {
  try {
    // Generate codes for all assignments
    const withCodes = await Promise.all(
      assignments.map(async a => ({
        ...a,
        assignment_code: await this.generateAssignmentCode()
      }))
    );

    // Insert all at once (Postgres transaction)
    const { data, error } = await this.client
      .from('class_assignments')
      .insert(withCodes)
      .select();

    if (error) return this.handleError(error, 'bulkCreateAssignments');

    return this.success({ created: data, failed: [] });
  } catch (error) {
    return this.handleError(error, 'bulkCreateAssignments');
  }
}
```

---

### 5. CapacityService Architecture

**Responsibilities:**
- Calculate capacity for containers
- Check available spots
- Enforce capacity limits
- Real-time capacity tracking

```typescript
export class CapacityService extends BaseService {
  
  /**
   * Get capacity status for a container
   * Query Strategy: Count bookings via assignment_bookings join
   */
  async getCapacity(containerId: string): Promise<ServiceResult<{
    maxCapacity: number;
    currentBookings: number;
    availableSpots: number;
    utilizationPercent: number;
    isFull: boolean;
  }>> {
    try {
      // 1. Fetch container max_booking_count
      // 2. Count current bookings from assignment_bookings
      // 3. Calculate metrics
    } catch (error) {
      return this.handleError(error, 'getCapacity');
    }
  }

  /**
   * Check if capacity available for booking
   */
  async checkAvailability(
    containerId: string,
    spotsNeeded: number = 1
  ): Promise<ServiceResult<{
    available: boolean;
    reason?: string;
  }>> {
    const capacityResult = await this.getCapacity(containerId);
    if (!capacityResult.success) return capacityResult;

    const { availableSpots } = capacityResult.data!;
    
    if (availableSpots >= spotsNeeded) {
      return this.success({ available: true });
    }

    return this.success({
      available: false,
      reason: `Only ${availableSpots} spot(s) available, ${spotsNeeded} requested.`
    });
  }

  /**
   * Reserve spots (optimistic locking)
   * Used during booking assignment flow
   */
  async reserveSpots(
    containerId: string,
    count: number
  ): Promise<ServiceResult<void>> {
    // 1. Check capacity
    // 2. Update current_booking_count
    // 3. Use optimistic locking (check version)
  }
}
```

---

### 6. ValidationService Architecture

**Responsibilities:**
- Pre-flight validation before mutations
- Instructor conflict detection
- Timezone handling
- Business rule enforcement

```typescript
export class ValidationService extends BaseService {
  
  /**
   * Validate container creation inputs
   */
  validateContainerCreation(data: CreateContainerInput): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Type validation
    if (!['individual', 'public_group', 'private_group', 'crash_course'].includes(data.container_type)) {
      errors.container_type = 'Invalid container type';
    }

    // Package validation
    if (!data.package_id || !isValidUUID(data.package_id)) {
      errors.package_id = 'Valid package ID required';
    }

    // Capacity validation
    if (data.container_type === 'individual' && data.max_booking_count !== 1) {
      errors.max_booking_count = 'Individual programs must have capacity of 1';
    }

    if (data.max_booking_count < 1 || data.max_booking_count > 50) {
      errors.max_booking_count = 'Capacity must be between 1 and 50';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate assignment creation inputs
   */
  validateAssignmentCreation(data: CreateAssignmentInput): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Container required
    if (!data.class_container_id) {
      errors.class_container_id = 'Container ID is required';
    }

    // Date validation
    if (!isValidDate(data.date)) {
      errors.date = 'Invalid date format (expected YYYY-MM-DD)';
    } else {
      const assignmentDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (assignmentDate < today) {
        errors.date = 'Cannot create assignment in the past';
      }
    }

    // Time validation
    if (!isValidTime(data.start_time)) {
      errors.start_time = 'Invalid time format (expected HH:MM)';
    }
    if (!isValidTime(data.end_time)) {
      errors.end_time = 'Invalid time format (expected HH:MM)';
    }

    // Start before end
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      errors.end_time = 'End time must be after start time';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Check instructor conflicts
   * Query Strategy: Fetch instructor's assignments for date range, normalize to instructor's timezone
   */
  async checkInstructorConflict(params: {
    instructorId: string;
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
    excludeAssignmentId?: string;
  }): Promise<ServiceResult<{
    hasConflict: boolean;
    conflictingAssignments?: Assignment[];
  }>> {
    try {
      // 1. Fetch instructor timezone from instructor_availability
      // 2. Fetch all assignments for instructor on date
      // 3. Normalize times to instructor timezone
      // 4. Check for overlaps
      // 5. Return conflicts if any
    } catch (error) {
      return this.handleError(error, 'checkInstructorConflict');
    }
  }

  /**
   * Normalize date/time to UTC for comparison
   */
  normalizeToUTC(date: string, time: string, timezone: string): Date {
    // Use Luxon or date-fns-tz for timezone conversion
    // Return UTC Date object for comparison
  }
}
```

**Timezone Handling:**
- Store all times in database without timezone (time column type)
- Store timezone separately in `timezone` column (default: 'Asia/Kolkata')
- For conflict checking: convert to instructor's timezone
- Use `luxon` library (already in use for Supabase Functions)

---

### 7. Error Handling Patterns

**Consistent Error Response Structure:**

```typescript
export type ServiceError = {
  code: string;         // Machine-readable code
  message: string;      // User-friendly message
  details?: any;        // Technical details (dev only)
};

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: ServiceError;
};
```

**Error Handling in Components:**

```typescript
// Component usage pattern
const handleCreateContainer = async (formData) => {
  const result = await containerService.createContainer(formData);
  
  if (result.success) {
    toast.success('Program created successfully!');
    onSuccess(result.data);
  } else {
    // Display user-friendly error
    toast.error(result.error.message);
    
    // Log technical details
    console.error('Container creation failed:', result.error.details);
    
    // Show inline errors for form fields
    if (result.error.code === 'validation_error') {
      setFieldErrors(result.error.details);
    }
  }
};
```

**HTTP Status Code Mapping:**
- Supabase errors already include status codes
- Service layer wraps these with context
- No need to reinvent error codes

---

### 8. Query Optimization Strategy

**Guidelines:**

1. **Single Query with Joins (Preferred):**
   - Use nested select syntax: `.select('*, profile:profiles(*)')`
   - Reduces round trips
   - Better performance

2. **Multiple Queries (When Needed):**
   - If joins cause performance issues
   - When data is conditionally loaded
   - For very large result sets

3. **Pagination:**
   - Always use `limit` and `offset` for lists
   - Return total count for pagination UI

4. **Filtering:**
   - Push filters to database (WHERE clauses)
   - Avoid client-side filtering of large datasets

**Example - Optimized Container List:**

```typescript
async listContainers(params) {
  let query = this.client
    .from('class_containers')
    .select(`
      *,
      instructor:profiles!instructor_id (id, full_name, email),
      package:class_packages!package_id (
        id, name, description, sessions_per_month,
        class_type:class_types!class_type_id (name)
      )
    `, { count: 'exact' });  // Get total count for pagination

  // Apply filters
  if (params.instructorId) query = query.eq('instructor_id', params.instructorId);
  if (params.isActive !== undefined) query = query.eq('is_active', params.isActive);
  if (params.search) {
    query = query.or(`display_name.ilike.%${params.search}%,container_code.ilike.%${params.search}%`);
  }

  // Pagination
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Sort
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) return this.handleError(error, 'listContainers');

  return this.success({ containers: data, total: count });
}
```

---

### 9. Service Instance Management

**Singleton Pattern:**

```typescript
// src/features/dashboard/services/v2/index.ts
import { ContainerService } from './container.service';
import { PackageService } from './package.service';
import { AssignmentService } from './assignment.service';
import { CapacityService } from './capacity.service';
import { ValidationService } from './validation.service';
import { supabase } from '@/shared/lib/supabase';

// Create singleton instances
export const containerService = new ContainerService(supabase);
export const packageService = new PackageService(supabase);
export const assignmentService = new AssignmentService(supabase);
export const capacityService = new CapacityService(supabase);
export const validationService = new ValidationService(supabase);

// Export classes for testing (can create mock instances)
export {
  ContainerService,
  PackageService,
  AssignmentService,
  CapacityService,
  ValidationService
};
```

**Usage in Components:**

```typescript
import { containerService, packageService } from '@/features/dashboard/services/v2';

// Direct usage
const result = await containerService.listContainers({ isActive: true });

// Or via hooks (preferred - adds caching, loading states, etc.)
const { data, isLoading, error } = useContainers({ isActive: true });
```

---

### 10. Caching Strategy

**Client-Side Caching (React Query):**

```typescript
// In hooks layer (useContainers.ts)
import { useQuery } from '@tanstack/react-query';
import { containerService } from '../services/v2';

export const useContainers = (params = {}) => {
  return useQuery({
    queryKey: ['containers', params],
    queryFn: async () => {
      const result = await containerService.listContainers(params);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 30 * 1000,        // 30 seconds
    cacheTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useContainerMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => containerService.createContainer(data),
    onSuccess: () => {
      // Invalidate containers list cache
      queryClient.invalidateQueries(['containers']);
    }
  });
};
```

**Service-Level Caching:**
- Only for PackageService (packages rarely change)
- In-memory Map with TTL
- Manual invalidation via `clearCache()`

**No Caching For:**
- Container data (changes frequently)
- Assignment data (real-time updates needed)
- Capacity data (must be real-time)

---

### 11. Testing Strategy

**Unit Tests for Services:**

```typescript
// __tests__/container.service.test.ts
import { ContainerService } from '../container.service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  }))
};

describe('ContainerService', () => {
  let service: ContainerService;

  beforeEach(() => {
    service = new ContainerService(mockClient as any);
  });

  it('should list containers with filters', async () => {
    mockClient.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: '123', display_name: 'Test' }],
        error: null
      })
    });

    const result = await service.listContainers({ isActive: true });
    
    expect(result.success).toBe(true);
    expect(result.data.containers).toHaveLength(1);
  });

  it('should handle errors gracefully', async () => {
    mockClient.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      })
    });

    const result = await service.listContainers();
    
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('PGRST116');
  });
});
```

---

### 12. Migration from V1 Patterns

**V1 (Anti-patterns to avoid):**
```typescript
// ❌ Mixed concerns - business logic in component
const handleSubmit = async () => {
  const { data, error } = await supabase.from('class_assignments').insert({...});
  if (error) alert('Failed');
  // ... more logic
};
```

**V2 (Clean separation):**
```typescript
// ✅ Business logic in service
const handleSubmit = async (formData) => {
  const result = await assignmentService.createAssignment(formData);
  if (result.success) {
    toast.success('Assignment created!');
  } else {
    toast.error(result.error.message);
  }
};
```

---

## 🎯 Summary for Task 1.8 (MINI)

**What to implement in service skeletons:**

1. **BaseService class** with:
   - Constructor accepting Supabase client
   - `handleError()` method
   - `success()` helper
   - `ServiceResult<T>` type

2. **Each service extends BaseService** and implements:
   - CRUD methods with signatures from this design
   - Proper error handling (try/catch, return ServiceResult)
   - Input validation
   - Query optimization (joins, filters)
   - JSDoc comments for each method

3. **Singleton exports** in `index.ts`:
   - Create instances with shared supabase client
   - Export both instances and classes

4. **Type definitions** for:
   - Method parameters (CreateContainerInput, UpdateContainerInput, etc.)
   - ServiceResult<T>
   - ServiceError

**Implementation Notes:**
- Use existing `supabase` client from `@/shared/lib/supabase`
- Follow patterns from V1's EmailService and AssignmentCreationService
- All async methods return `Promise<ServiceResult<T>>`
- No business logic in components - all in services
- Client-side caching handled by React Query (hooks layer)

---

### Task 1.8: Create Service Skeleton
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 45 minutes
- [x] **Dependencies:** Task 1.7 ✓
- [x] **Description:** Create service files with method signatures and JSDoc
- [x] **Deliverable:** Service skeleton files
- [x] **Prompt:** "Create skeleton files per Task 1.7 design: 1. container.service.ts 2. package.service.ts 3. assignment.service.ts 4. capacity.service.ts 5. validation.service.ts. Include method signatures, type imports, TODO comments, error handling structure."
- [x] **Output Location:** src/features/dashboard/services/v2/
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Created base.service.ts + 5 service skeletons + index.ts

---

### Task 1.9: Hook Design Strategy
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1.5 hours
- [x] **Dependencies:** None
- [x] **Description:** Design React hooks with polling, caching, state management
- [x] **Deliverable:** Hook design patterns document
- [x] **Prompt:** "Design React hooks for V2: useContainers (with polling) strategy, usePackages caching approach, useMobileDetect implementation. Decide: Context for shared state or prop drilling? Error boundary strategy?"
- [x] **Output Location:** Comment for Task 1.10
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Designed 8 hooks with React Query, no Context needed, ErrorBoundary strategy defined

---

## 📋 Task 1.9 Deliverable: Hook Design Strategy

### Architecture Decision: React Query + Custom Hooks (No Context)

**Pattern:** React Query for data fetching + Custom hooks + Local state in components

**Key Decisions:**
- ✅ React Query for caching, polling, and server state
- ✅ No Context API needed (React Query cache acts as global state)
- ✅ Local state in ClassesDashboard for UI (modals, drawer)
- ✅ ErrorBoundary at route level for catastrophic failures
- ✅ Toast notifications for user-facing errors

---

### 1. useContainers Hook

**Purpose:** Fetch and manage container list with real-time updates

**Signature:**
```typescript
export function useContainers(params?: {
  instructorId?: string;
  packageId?: string;
  containerType?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  enablePolling?: boolean;
  pollingInterval?: number;
}): {
  containers: Container[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Implementation Pattern:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { containerService } from '../services/v2';

export const useContainers = (params = {}) => {
  const { enablePolling = false, pollingInterval = 30000, ...filterParams } = params;

  const query = useQuery({
    queryKey: ['containers', filterParams],
    queryFn: async () => {
      const result = await containerService.listContainers(filterParams);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: enablePolling ? pollingInterval : false,
    refetchIntervalInBackground: false,
  });

  return {
    containers: query.data?.containers || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
```

**Polling Strategy:**
- Default: OFF (opt-in via `enablePolling: true`)
- Interval: 30 seconds (configurable)
- Pauses when tab inactive
- Use case: Real-time capacity monitoring

---

### 2. useContainerDetail Hook

**Purpose:** Fetch single container with full details

**Signature:**
```typescript
export function useContainerDetail(
  containerId: string | null,
  options?: { enabled?: boolean }
): {
  container: ContainerDetail | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Implementation:**
```typescript
export const useContainerDetail = (containerId, options = {}) => {
  const query = useQuery({
    queryKey: ['container', containerId],
    queryFn: async () => {
      if (!containerId) return null;
      const result = await containerService.getContainer(containerId);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!containerId && (options.enabled !== false),
    staleTime: 10 * 1000,
    cacheTime: 2 * 60 * 1000,
  });

  return {
    container: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
```

---

### 3. useContainerMutations Hook

**Purpose:** Container CRUD operations with cache invalidation

**Signature:**
```typescript
export function useContainerMutations(): {
  createContainer: UseMutationResult<Container, Error, CreateContainerInput>;
  updateContainer: UseMutationResult<Container, Error, { id: string; data: UpdateContainerInput }>;
  deleteContainer: UseMutationResult<void, Error, string>;
}
```

**Implementation:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useContainerMutations = () => {
  const queryClient = useQueryClient();

  const createContainer = useMutation({
    mutationFn: async (data: CreateContainerInput) => {
      const result = await containerService.createContainer(data);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['containers']);
    },
  });

  const updateContainer = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await containerService.updateContainer(id, data);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries(['container', id]);
      const previous = queryClient.getQueryData(['container', id]);
      queryClient.setQueryData(['container', id], (old: any) => ({ ...old, ...data }));
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['container', variables.id], context.previous);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['container', variables.id]);
      queryClient.invalidateQueries(['containers']);
    },
  });

  const deleteContainer = useMutation({
    mutationFn: async (id: string) => {
      const result = await containerService.deleteContainer(id);
      if (!result.success) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['containers']);
    },
  });

  return { createContainer, updateContainer, deleteContainer };
};
```

**Optimistic Update Strategy:**
- Use for: Updates (editing display name, instructor)
- Skip for: Creates and deletes
- Rollback on error, refetch on success

---

### 4. usePackages Hook

**Purpose:** Fetch packages with aggressive caching

**Signature:**
```typescript
export function usePackages(params?: {
  type?: string;
  isActive?: boolean;
}): {
  packages: Package[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  clearCache: () => void;
}
```

**Implementation:**
```typescript
export const usePackages = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['packages', params],
    queryFn: async () => {
      const result = await packageService.listPackages({ ...params, useCache: true });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 10 * 60 * 1000,      // 10 minutes
    cacheTime: 30 * 60 * 1000,      // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const clearCache = () => {
    packageService.clearCache();
    queryClient.invalidateQueries(['packages']);
  };

  return {
    packages: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    clearCache,
  };
};
```

**Caching Strategy:**
- Service cache: 5 minutes TTL
- React Query cache: 10 minutes stale, 30 minutes retention
- Total: Up to 30 minutes before guaranteed fresh fetch

---

### 5. useAssignments Hook

**Purpose:** Fetch assignments for a container

**Signature:**
```typescript
export function useAssignments(params: {
  containerId: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  enabled?: boolean;
}): {
  assignments: Assignment[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Implementation:**
```typescript
export const useAssignments = (params) => {
  const { enabled = true, ...filterParams } = params;

  const query = useQuery({
    queryKey: ['assignments', filterParams],
    queryFn: async () => {
      const result = await assignmentService.listAssignments(filterParams);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!params.containerId && enabled,
    staleTime: 15 * 1000,
    cacheTime: 2 * 60 * 1000,
  });

  return {
    assignments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
```

---

### 6. useAssignmentMutations Hook

**Purpose:** Assignment CRUD with bulk support

**Signature:**
```typescript
export function useAssignmentMutations(): {
  createAssignment: UseMutationResult;
  bulkCreateAssignments: UseMutationResult;
  updateAssignment: UseMutationResult;
  deleteAssignment: UseMutationResult;
}
```

**Implementation:**
```typescript
export const useAssignmentMutations = () => {
  const queryClient = useQueryClient();

  const createAssignment = useMutation({
    mutationFn: async (data: CreateAssignmentInput) => {
      const result = await assignmentService.createAssignment(data);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assignments', { containerId: data.class_container_id }]);
      queryClient.invalidateQueries(['container', data.class_container_id]);
    },
  });

  const bulkCreateAssignments = useMutation({
    mutationFn: async (assignments: CreateAssignmentInput[]) => {
      const result = await assignmentService.bulkCreateAssignments(assignments);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      queryClient.invalidateQueries(['containers']);
    },
  });

  // updateAssignment and deleteAssignment similar...

  return { createAssignment, bulkCreateAssignments, updateAssignment, deleteAssignment };
};
```

---

### 7. useCapacity Hook

**Purpose:** Real-time capacity tracking

**Signature:**
```typescript
export function useCapacity(
  containerId: string | null,
  options?: { enabled?: boolean }
): {
  capacity: {
    maxCapacity: number;
    currentBookings: number;
    availableSpots: number;
    utilizationPercent: number;
    isFull: boolean;
  } | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

**Implementation:**
```typescript
export const useCapacity = (containerId, options = {}) => {
  const query = useQuery({
    queryKey: ['capacity', containerId],
    queryFn: async () => {
      if (!containerId) return null;
      const result = await capacityService.getCapacity(containerId);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!containerId && (options.enabled !== false),
    staleTime: 5 * 1000,
    cacheTime: 1 * 60 * 1000,
    refetchInterval: 15 * 1000,     // Auto-refetch every 15 seconds
  });

  return {
    capacity: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
```

---

### 8. useMobileDetect Hook

**Purpose:** Detect mobile viewport for responsive rendering

**Signature:**
```typescript
export function useMobileDetect(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}
```

**Implementation:**
```typescript
import { useState, useEffect } from 'react';

export const useMobileDetect = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return { isMobile, isTablet, isDesktop, width: windowSize.width };
};
```

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px

---

### 9. Error Handling Strategy

**Three-Layer Approach:**

**Layer 1: Service Layer**
- Services return `ServiceResult<T>` with structured errors
- User-friendly messages

**Layer 2: Hook Layer**
- React Query handles network errors
- Hooks throw errors from service failures

**Layer 3: Component Layer**
- Toast notifications for user-facing errors
- Inline errors for forms
- ErrorBoundary for catastrophic failures

**ErrorBoundary Implementation:**
```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Usage in Routing:**
```typescript
<ErrorBoundary fallback={<DashboardError />}>
  <Suspense fallback={<LoadingSpinner />}>
    <ClassesDashboard />
  </Suspense>
</ErrorBoundary>
```

---

### 10. State Management Decision

**Decision: No Context API Needed**

**Rationale:**
- React Query cache = global server state
- Modal/drawer state co-located in ClassesDashboard
- No deep prop drilling (1 level max)
- Simpler debugging and performance

**State Structure:**
```typescript
const ClassesDashboard = () => {
  // UI state (local)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [drawerContainerId, setDrawerContainerId] = useState<string | null>(null);

  // Server state (React Query)
  const { containers, isLoading } = useContainers();
  const { packages } = usePackages();

  return (
    <>
      <ContainerGrid
        containers={containers}
        onCardClick={(id) => setDrawerContainerId(id)}
      />
      <ContainerDrawer
        containerId={drawerContainerId}
        onClose={() => setDrawerContainerId(null)}
      />
    </>
  );
};
```

---

### 11. React Query Configuration

**Global Config:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  {process.env.NODE_ENV === 'development' && (
    <ReactQueryDevtools initialIsOpen={false} />
  )}
</QueryClientProvider>
```

---

### 12. Loading State Strategy

**Skeleton Screens (Preferred):**
```typescript
const ClassesDashboard = () => {
  const { containers, isLoading } = useContainers();

  if (isLoading) {
    return <ContainerGridSkeleton count={6} />;
  }

  return <ContainerGrid containers={containers} />;
};
```

**Button Loading States:**
```typescript
const { mutate, isLoading } = useContainerMutations().createContainer;

<button disabled={isLoading}>
  {isLoading ? 'Creating...' : 'Create Program'}
</button>
```

---

## 🎯 Summary for Task 1.10 (MINI)

**Hooks to Create:**

1. **useContainers.ts** - List with polling, filters, pagination
2. **useContainerDetail.ts** - Single container with full details
3. **useContainerMutations.ts** - Create, update, delete
4. **usePackages.ts** - Packages with aggressive caching
5. **useAssignments.ts** - Assignments for a container
6. **useAssignmentMutations.ts** - CRUD + bulk operations
7. **useCapacity.ts** - Real-time capacity tracking
8. **useMobileDetect.ts** - Responsive viewport detection

**Implementation Requirements:**
- All data hooks use React Query (`useQuery`, `useMutation`)
- Import services from `../services/v2`
- Consistent return shape: `{ data, isLoading, isError, error, refetch }`
- Mutations return: `{ mutate, mutateAsync, isLoading, isError, error }`
- Cache keys: `['containers', params]`, `['container', id]`, etc.
- TypeScript with proper types from `../types/v2`
- useMobileDetect: pure client-side, debounced resize listener

**Dependencies:**
```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0"
}
```

**File Locations:**
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useContainers.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useContainerDetail.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useContainerMutations.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/usePackages.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useAssignments.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useAssignmentMutations.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useCapacity.ts`
- `src/features/dashboard/components/Modules/ClassesV2/hooks/useMobileDetect.ts`

---

### Task 1.10: Create Hook Skeletons
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 30 minutes
- [x] **Dependencies:** Task 1.9 ✓
- [x] **Description:** Create hook files with basic structure
- [x] **Deliverable:** Hook skeleton files
- [x] **Prompt:** "Create hook skeleton files per Task 1.9: 1. useContainers.ts 2. usePackages.ts 3. useAssignments.ts 4. useMobileDetect.ts 5. useCapacity.ts. Include hook signatures, return types, TODO comments, useState/useEffect placeholders."
- [x] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/hooks/
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Created 5 hook skeleton files (useContainers, usePackages, useAssignments, useCapacity, useMobileDetect)

---

### Task 1.11: Main Dashboard Component Design
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Critical
- [x] **Estimated Time:** 2 hours
- [x] **Dependencies:** None
- [x] **Description:** Design ClassesDashboard state management and component composition
- [x] **Deliverable:** Component architecture document
- [x] **Prompt:** "Design ClassesDashboard main component: State management (local vs context)? Component composition? Mobile vs Desktop rendering? Loading states? Modal management? Drawer state?"
- [x] **Output Location:** Comment for Task 1.12
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Designed component with local state, responsive grid, skeleton loading, and coordinated modal/drawer management

---

## 📋 Task 1.11 Deliverable: ClassesDashboard Component Architecture

### 1. Component Hierarchy Overview

```
ClassesDashboard (Main Container)
├── Header Section
│   ├── Title + Breadcrumb
│   ├── Search Bar (filters containers)
│   └── Action Buttons (+ Create Program, Filters)
├── Loading State → ContainerGridSkeleton
├── Empty State → EmptyState component
├── Container Grid (Desktop/Tablet)
│   └── ContainerCard[] (clickable cards)
├── Container List (Mobile)
│   └── ContainerListItem[] (optimized for touch)
├── ContainerDrawer (Slide-out Panel)
│   ├── Drawer Header (title, close button)
│   ├── Container Details Section
│   ├── Assignment List Section
│   └── Action Footer (Edit, Delete, Assign Students)
├── CreateContainerModal (Dialog)
│   └── ContainerForm
├── EditContainerModal (Dialog)
│   └── ContainerForm (pre-filled)
└── DeleteConfirmModal (Dialog)
    └── Confirmation message + actions
```

---

### 2. State Management Strategy

**Decision: Local State Only (No Context)**

**Rationale:**
- React Query provides global server state cache
- UI state (modals, drawer) is simple and shallow
- Only ClassesDashboard needs to coordinate UI elements
- No prop drilling beyond 1 level
- Easier to test and debug

**State Structure:**

```typescript
const ClassesDashboard = () => {
  // --- Server State (React Query) ---
  const { containers, total, isLoading, isError, error, refetch } = useContainers({
    isActive: true,
    enablePolling: false, // Can be toggled by user
  });
  const { packages } = usePackages({ isActive: true });

  // --- UI State (Local) ---
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    instructorId: null,
    packageId: null,
    containerType: null,
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  // Drawer State
  const [drawerContainerId, setDrawerContainerId] = useState<string | null>(null);

  // Responsive State
  const { isMobile, isTablet, isDesktop } = useMobileDetect();

  // Derived State
  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      if (searchQuery && !c.display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.instructorId && c.instructor_id !== filters.instructorId) return false;
      if (filters.packageId && c.package_id !== filters.packageId) return false;
      if (filters.containerType && c.container_type !== filters.containerType) return false;
      return true;
    });
  }, [containers, searchQuery, filters]);

  // Event Handlers
  const handleCardClick = (containerId: string) => {
    setDrawerContainerId(containerId);
  };

  const handleEditClick = (container: Container) => {
    setSelectedContainer(container);
    setIsEditModalOpen(true);
    setDrawerContainerId(null); // Close drawer when opening modal
  };

  const handleDeleteClick = (container: Container) => {
    setSelectedContainer(container);
    setIsDeleteModalOpen(true);
    setDrawerContainerId(null);
  };

  const handleCloseDrawer = () => {
    setDrawerContainerId(null);
  };

  // ... render logic
};
```

**Why No useState for Mutations:**
- Mutations handled by React Query hooks (useContainerMutations)
- Loading states come from mutation hooks directly
- No need to track "isSubmitting" separately

---

### 3. Component Composition Strategy

**A. Container Display Components**

```typescript
// Desktop/Tablet: Grid Layout
<div className="container-grid">
  {filteredContainers.map(container => (
    <ContainerCard
      key={container.id}
      container={container}
      onClick={() => handleCardClick(container.id)}
    />
  ))}
</div>

// Mobile: List Layout (better for scrolling)
<div className="container-list">
  {filteredContainers.map(container => (
    <ContainerListItem
      key={container.id}
      container={container}
      onClick={() => handleCardClick(container.id)}
    />
  ))}
</div>
```

**B. Modal Coordination**

**Rule:** Only ONE modal can be open at a time

```typescript
// Modal states are mutually exclusive
const openCreateModal = () => {
  setIsCreateModalOpen(true);
  setIsEditModalOpen(false);
  setIsDeleteModalOpen(false);
  setDrawerContainerId(null); // Also close drawer
};

const openEditModal = (container: Container) => {
  setSelectedContainer(container);
  setIsEditModalOpen(true);
  setIsCreateModalOpen(false);
  setIsDeleteModalOpen(false);
  setDrawerContainerId(null);
};

// Close all modals
const closeAllModals = () => {
  setIsCreateModalOpen(false);
  setIsEditModalOpen(false);
  setIsDeleteModalOpen(false);
  setSelectedContainer(null);
};
```

**C. Drawer + Modal Interaction**

**Rule:** Drawer can be open WHILE a modal is closed, but opening a modal closes the drawer

```typescript
// Drawer opens independently
const openDrawer = (containerId: string) => {
  setDrawerContainerId(containerId);
  // Modals remain closed
};

// Opening modal closes drawer
const openModalFromDrawer = (action: 'edit' | 'delete', container: Container) => {
  setSelectedContainer(container);
  setDrawerContainerId(null); // Close drawer first
  
  if (action === 'edit') setIsEditModalOpen(true);
  if (action === 'delete') setIsDeleteModalOpen(true);
};
```

---

### 4. Mobile vs Desktop Rendering

**Responsive Breakpoints:**
- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** >= 1024px

**Rendering Strategy:**

```typescript
const ClassesDashboard = () => {
  const { isMobile, isTablet, isDesktop } = useMobileDetect();

  return (
    <div className="classes-dashboard">
      {/* Header: Same on all devices */}
      <DashboardHeader
        title="Programs"
        onCreateClick={() => setIsCreateModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isMobile={isMobile}
      />

      {/* Filters: Collapse on mobile */}
      {!isMobile && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          packages={packages}
        />
      )}

      {/* Container Display */}
      {isLoading ? (
        <ContainerGridSkeleton count={isMobile ? 3 : 6} />
      ) : filteredContainers.length === 0 ? (
        <EmptyState
          message={searchQuery ? 'No programs match your search' : 'No programs yet'}
          action={!searchQuery && <Button onClick={openCreateModal}>Create First Program</Button>}
        />
      ) : (
        <>
          {/* Desktop/Tablet: Grid */}
          {(isDesktop || isTablet) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContainers.map(container => (
                <ContainerCard
                  key={container.id}
                  container={container}
                  onClick={() => handleCardClick(container.id)}
                />
              ))}
            </div>
          )}

          {/* Mobile: List */}
          {isMobile && (
            <div className="space-y-2">
              {filteredContainers.map(container => (
                <ContainerListItem
                  key={container.id}
                  container={container}
                  onClick={() => handleCardClick(container.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Drawer: Slide from right (desktop) or bottom (mobile) */}
      <ContainerDrawer
        containerId={drawerContainerId}
        isOpen={!!drawerContainerId}
        onClose={handleCloseDrawer}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        isMobile={isMobile}
      />

      {/* Modals: Same on all devices (centered overlay) */}
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={closeAllModals}
        packages={packages}
      />

      <EditContainerModal
        isOpen={isEditModalOpen}
        onClose={closeAllModals}
        container={selectedContainer}
        packages={packages}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeAllModals}
        container={selectedContainer}
      />
    </div>
  );
};
```

**Mobile-Specific Optimizations:**
- **Touch targets:** Minimum 44x44px (iOS guidelines)
- **Drawer:** Slide from bottom (easier to reach)
- **Search:** Collapsible to save space
- **Filters:** Hidden by default, shown in a modal/sheet when clicked
- **Cards:** Full-width list items with larger text

---

### 5. Loading States Strategy

**A. Initial Load (Skeleton Screen)**

```typescript
if (isLoading && !containers.length) {
  return (
    <div className="classes-dashboard">
      <DashboardHeader title="Programs" isLoading />
      <ContainerGridSkeleton count={isMobile ? 3 : 6} />
    </div>
  );
}
```

**ContainerGridSkeleton Component:**

```typescript
const ContainerGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded-lg">
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

**B. Refetch/Background Updates**

```typescript
// Show subtle loading indicator while refetching
{isLoading && containers.length > 0 && (
  <div className="fixed top-4 right-4 z-50">
    <div className="bg-blue-500 text-white px-3 py-2 rounded shadow-lg flex items-center gap-2">
      <Spinner size="sm" />
      <span>Updating...</span>
    </div>
  </div>
)}
```

**C. Mutation Loading States**

```typescript
const { createContainer, isLoading: isCreating } = useContainerMutations();

// In modal
<Button
  onClick={handleSubmit}
  disabled={isCreating}
>
  {isCreating ? (
    <>
      <Spinner size="sm" />
      Creating...
    </>
  ) : (
    'Create Program'
  )}
</Button>
```

**D. Error States**

```typescript
if (isError) {
  return (
    <div className="classes-dashboard">
      <DashboardHeader title="Programs" />
      <ErrorState
        title="Failed to load programs"
        message={error?.message || 'Something went wrong'}
        action={<Button onClick={refetch}>Try Again</Button>}
      />
    </div>
  );
}
```

---

### 6. Modal Management Architecture

**A. Modal State Pattern**

```typescript
// Centralized modal state
interface ModalState {
  create: boolean;
  edit: boolean;
  delete: boolean;
  selectedContainer: Container | null;
}

// Could use useReducer for complex logic
const modalReducer = (state: ModalState, action: any): ModalState => {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { ...state, create: true, edit: false, delete: false, selectedContainer: null };
    case 'OPEN_EDIT':
      return { ...state, create: false, edit: true, delete: false, selectedContainer: action.payload };
    case 'OPEN_DELETE':
      return { ...state, create: false, edit: false, delete: true, selectedContainer: action.payload };
    case 'CLOSE_ALL':
      return { create: false, edit: false, delete: false, selectedContainer: null };
    default:
      return state;
  }
};

const [modalState, dispatchModal] = useReducer(modalReducer, {
  create: false,
  edit: false,
  delete: false,
  selectedContainer: null,
});
```

**B. Modal Component Props Interface**

```typescript
interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: Package[];
}

interface EditContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: Container | null;
  packages: Package[];
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: Container | null;
}
```

**C. Modal Behavior Rules**

1. **Backdrop Click:** Close modal (unless form is dirty → show confirm dialog)
2. **Escape Key:** Close modal
3. **Submit Success:** Close modal + show success toast + refetch data
4. **Submit Error:** Keep modal open + show inline error
5. **Focus Trap:** Keep Tab key within modal
6. **Scroll Lock:** Prevent body scroll when modal open

**D. Modal Success Flow**

```typescript
const { createContainer } = useContainerMutations();

const handleCreateSubmit = async (formData) => {
  try {
    await createContainer.mutateAsync(formData);
    toast.success('Program created successfully!');
    closeAllModals();
    // React Query auto-refetches containers
  } catch (error) {
    // Error shown inline in form
    // Modal stays open for user to fix
  }
};
```

---

### 7. Drawer State Architecture

**A. Drawer Trigger**

```typescript
// Triggered by clicking a container card
const handleCardClick = (containerId: string) => {
  setDrawerContainerId(containerId);
};

// Drawer fetches its own data
<ContainerDrawer
  containerId={drawerContainerId}
  isOpen={!!drawerContainerId}
  onClose={() => setDrawerContainerId(null)}
/>
```

**B. Drawer Component Structure**

```typescript
const ContainerDrawer = ({ containerId, isOpen, onClose, isMobile }) => {
  // Fetch container details only when drawer opens
  const { container, isLoading } = useContainerDetail(containerId, { enabled: isOpen });
  const { assignments } = useAssignments({ containerId, enabled: isOpen });
  const { capacity } = useCapacity(containerId, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div className={`drawer ${isMobile ? 'drawer-bottom' : 'drawer-right'}`}>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="drawer-panel">
        {isLoading ? (
          <DrawerSkeleton />
        ) : (
          <>
            <DrawerHeader container={container} onClose={onClose} />
            <DrawerContent
              container={container}
              assignments={assignments}
              capacity={capacity}
            />
            <DrawerFooter
              container={container}
              onEdit={() => onEdit(container)}
              onDelete={() => onDelete(container)}
            />
          </>
        )}
      </div>
    </div>
  );
};
```

**C. Drawer Animation**

```css
/* Desktop: Slide from right */
@media (min-width: 1024px) {
  .drawer-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: 500px;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
  }

  .drawer.open .drawer-panel {
    transform: translateX(0);
  }
}

/* Mobile: Slide from bottom */
@media (max-width: 767px) {
  .drawer-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 80vh;
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
    border-radius: 16px 16px 0 0;
  }

  .drawer.open .drawer-panel {
    transform: translateY(0);
  }
}
```

**D. Drawer Behavior Rules**

1. **Close on Backdrop Click:** Yes
2. **Close on Escape:** Yes
3. **Close on Route Change:** Yes (use useEffect with router)
4. **Close on Modal Open:** Yes (mutual exclusivity)
5. **Scroll Behavior:** Panel scrollable, body locked
6. **Keyboard Navigation:** Tab trap within drawer

---

### 8. Search and Filter Strategy

**A. Search Implementation**

```typescript
// Debounced search (avoid re-filtering on every keystroke)
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Filter containers based on debounced search
const filteredContainers = useMemo(() => {
  if (!debouncedSearch) return containers;
  
  const lowerQuery = debouncedSearch.toLowerCase();
  return containers.filter(c =>
    c.display_name.toLowerCase().includes(lowerQuery) ||
    c.container_code.toLowerCase().includes(lowerQuery)
  );
}, [containers, debouncedSearch]);
```

**B. Filter Implementation**

```typescript
interface Filters {
  instructorId: string | null;
  packageId: string | null;
  containerType: string | null;
  isActive: boolean;
}

const [filters, setFilters] = useState<Filters>({
  instructorId: null,
  packageId: null,
  containerType: null,
  isActive: true,
});

// Apply filters
const filteredContainers = useMemo(() => {
  return containers.filter(c => {
    if (filters.instructorId && c.instructor_id !== filters.instructorId) return false;
    if (filters.packageId && c.package_id !== filters.packageId) return false;
    if (filters.containerType && c.container_type !== filters.containerType) return false;
    if (filters.isActive !== undefined && c.is_active !== filters.isActive) return false;
    return true;
  });
}, [containers, filters]);
```

**C. Filter UI (Desktop)**

```typescript
<div className="filter-bar">
  <Select
    placeholder="All Instructors"
    value={filters.instructorId}
    onChange={(id) => setFilters({ ...filters, instructorId: id })}
  >
    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
  </Select>

  <Select
    placeholder="All Packages"
    value={filters.packageId}
    onChange={(id) => setFilters({ ...filters, packageId: id })}
  >
    {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
  </Select>

  <Select
    value={filters.containerType || ''}
    onChange={(type) => setFilters({ ...filters, containerType: type || null })}
  >
    <option value="">All Types</option>
    <option value="individual">Individual</option>
    <option value="public_group">Public Group</option>
    <option value="private_group">Private Group</option>
    <option value="crash_course">Crash Course</option>
  </Select>

  <Button variant="ghost" onClick={() => setFilters({ instructorId: null, packageId: null, containerType: null, isActive: true })}>
    Clear Filters
  </Button>
</div>
```

**D. Filter UI (Mobile)**

```typescript
// Filters in a bottom sheet/modal
const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

<Button onClick={() => setIsFilterSheetOpen(true)}>
  <FilterIcon />
  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
</Button>

<BottomSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)}>
  <FilterForm filters={filters} onFiltersChange={setFilters} />
</BottomSheet>
```

---

### 9. Event Flow Diagrams

**A. Container Creation Flow**

```
User clicks "+ Create Program"
  ↓
setIsCreateModalOpen(true)
  ↓
CreateContainerModal renders with ContainerForm
  ↓
User fills form and clicks "Create"
  ↓
Form validation (client-side)
  ↓
createContainer.mutate(formData)
  ↓
[Service Layer] containerService.createContainer()
  ↓
Success:
  - React Query invalidates ['containers']
  - Auto-refetch containers list
  - toast.success('Program created!')
  - closeAllModals()
  ↓
Error:
  - Show inline error in form
  - Modal stays open
```

**B. Container Edit Flow**

```
User clicks container card
  ↓
setDrawerContainerId(id)
  ↓
ContainerDrawer opens and fetches details
  ↓
User clicks "Edit" button in drawer
  ↓
handleEditClick(container)
  - setSelectedContainer(container)
  - setIsEditModalOpen(true)
  - setDrawerContainerId(null) // Close drawer
  ↓
EditContainerModal renders with pre-filled form
  ↓
User updates and submits
  ↓
updateContainer.mutate({ id, data })
  ↓
Success:
  - Optimistic update in cache
  - toast.success('Program updated!')
  - closeAllModals()
  - Drawer can be reopened with updated data
```

**C. Container Delete Flow**

```
User clicks "Delete" in drawer
  ↓
handleDeleteClick(container)
  - setSelectedContainer(container)
  - setIsDeleteModalOpen(true)
  - setDrawerContainerId(null)
  ↓
DeleteConfirmModal shows warning
  ↓
User confirms deletion
  ↓
deleteContainer.mutate(id)
  ↓
[Service Layer] Checks for active bookings, soft deletes
  ↓
Success:
  - Container removed from list (is_active = false filter)
  - toast.success('Program deleted')
  - closeAllModals()
```

---

### 10. Performance Optimizations

**A. Memoization**

```typescript
// Memoize filtered/sorted containers
const filteredContainers = useMemo(() => {
  // Expensive filtering/sorting logic
}, [containers, searchQuery, filters]);

// Memoize event handlers passed as props
const handleCardClick = useCallback((id: string) => {
  setDrawerContainerId(id);
}, []);

const handleEditClick = useCallback((container: Container) => {
  setSelectedContainer(container);
  setIsEditModalOpen(true);
  setDrawerContainerId(null);
}, []);
```

**B. Virtualization (Optional - for large lists)**

```typescript
// If containers.length > 100, use react-window
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  columnWidth={300}
  height={600}
  rowCount={Math.ceil(filteredContainers.length / 3)}
  rowHeight={200}
  width={1000}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    const container = filteredContainers[index];
    return container ? (
      <div style={style}>
        <ContainerCard container={container} onClick={handleCardClick} />
      </div>
    ) : null;
  }}
</FixedSizeGrid>
```

**C. Code Splitting**

```typescript
// Lazy load modals (only load when opened)
const CreateContainerModal = lazy(() => import('./modals/CreateContainerModal'));
const EditContainerModal = lazy(() => import('./modals/EditContainerModal'));
const DeleteConfirmModal = lazy(() => import('./modals/DeleteConfirmModal'));

// Wrap in Suspense
<Suspense fallback={<ModalSkeleton />}>
  <CreateContainerModal isOpen={isCreateModalOpen} onClose={closeAllModals} />
</Suspense>
```

---

### 11. Accessibility Considerations

**A. Keyboard Navigation**

```typescript
// Focus management
useEffect(() => {
  if (isCreateModalOpen) {
    // Focus first input in modal
    document.getElementById('container-name-input')?.focus();
  }
}, [isCreateModalOpen]);

// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + K: Open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }

    // Escape: Close drawer or modal
    if (e.key === 'Escape') {
      if (drawerContainerId) handleCloseDrawer();
      if (isCreateModalOpen || isEditModalOpen || isDeleteModalOpen) closeAllModals();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [drawerContainerId, isCreateModalOpen, isEditModalOpen, isDeleteModalOpen]);
```

**B. ARIA Labels**

```typescript
<button
  onClick={() => handleCardClick(container.id)}
  aria-label={`Open details for ${container.display_name}`}
  aria-expanded={drawerContainerId === container.id}
>
  <ContainerCard container={container} />
</button>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <CreateContainerModal />
</div>
```

**C. Focus Trap**

```typescript
// Use react-focus-lock for modals and drawer
import FocusLock from 'react-focus-lock';

<FocusLock disabled={!isOpen}>
  <div className="modal">
    {/* Modal content */}
  </div>
</FocusLock>
```

---

### 12. Error Recovery Patterns

**A. Mutation Error Handling**

```typescript
const { createContainer } = useContainerMutations();

const handleCreate = async (formData) => {
  try {
    await createContainer.mutateAsync(formData);
    toast.success('Program created!');
    closeAllModals();
  } catch (error) {
    // Error is already logged by service layer
    // Show user-friendly message
    if (error.message.includes('unique')) {
      toast.error('A program with this name already exists');
    } else {
      toast.error(error.message || 'Failed to create program');
    }
    // Modal stays open so user can retry
  }
};
```

**B. Network Error Retry**

```typescript
// React Query auto-retries (configured in queryClient)
// Manual retry button
{isError && (
  <div className="error-banner">
    <p>Failed to load programs</p>
    <Button onClick={refetch} disabled={isLoading}>
      {isLoading ? 'Retrying...' : 'Retry'}
    </Button>
  </div>
)}
```

**C. Optimistic Update Rollback**

```typescript
// Handled by React Query in useContainerMutations
// On error, previous cache state is restored
// User sees brief flicker of old data (acceptable)
```

---

## 🎯 Summary for Task 1.12 (MINI)

**What to implement in ClassesDashboard.tsx skeleton:**

1. **Component Structure:**
   - Main container div
   - Header section with title, search, and action buttons
   - Conditional rendering: loading → skeleton, error → error state, success → grid/list
   - ContainerDrawer component
   - Modal components (3 total)

2. **State Declarations:**
   - Search query state
   - Filter state object
   - Modal states (create, edit, delete)
   - Selected container state
   - Drawer container ID state

3. **Hook Integrations:**
   - `useContainers()` for fetching containers
   - `usePackages()` for dropdown options
   - `useMobileDetect()` for responsive rendering
   - `useContainerMutations()` (import but don't use yet)

4. **Event Handlers (Stubs):**
   - `handleCardClick(id)` - open drawer
   - `handleEditClick(container)` - open edit modal
   - `handleDeleteClick(container)` - open delete modal
   - `handleCloseDrawer()` - close drawer
   - `closeAllModals()` - close all modals

5. **JSX Structure:**
   ```tsx
   return (
     <div className="classes-dashboard">
       {/* Header */}
       {/* Loading State */}
       {/* Error State */}
       {/* Empty State */}
       {/* Container Grid/List */}
       {/* Drawer */}
       {/* Modals */}
     </div>
   );
   ```

6. **TypeScript:**
   - Import Container type
   - Import Package type
   - Type all state variables
   - Type all event handlers

7. **TODOs to Add:**
   - "TODO: Add filter bar component"
   - "TODO: Wire up mutation handlers"
   - "TODO: Add polling toggle button"
   - "TODO: Add keyboard shortcuts"
   - "TODO: Add focus management"

**File Location:** `src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx`

**Dependencies:**
- React, useState, useMemo, useCallback
- Custom hooks (useContainers, usePackages, useMobileDetect)
- Type imports
- Child components (ContainerCard, ContainerDrawer, modals) - create placeholders if not exist

---

### Task 1.12: Create Main Dashboard Component (Skeleton)
- [x] **Model:** 🟢 MINI
- [x] **Priority:** Critical
- [x] **Estimated Time:** 45 minutes
- [x] **Dependencies:** Task 1.11 ✓
- [x] **Description:** Create ClassesDashboard component skeleton
- [x] **Deliverable:** ClassesDashboard.tsx skeleton
- [x] **Prompt:** "Create ClassesDashboard.tsx per Task 1.11 design: Component shell with TypeScript, state declarations (empty), return JSX skeleton with div placeholders, import statements, TODO comments."
- [x] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Created component skeleton with hooks, state, event handlers, and placeholder JSX

---

## 📋 Phase 2: Container Service Implementation (Week 2)

**Goal:** Complete service layer with validation, CRUD operations

### Task 2.1: Package Fetching Logic Design
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design package fetching with filtering, error handling
- [x] **Deliverable:** Package fetching specification
- [x] **Prompt:** "Design package fetching logic: Filter active only? Which fields needed? Join with class_types? Error handling for corrupted data? Caching strategy?"
- [x] **Output Location:** Comment for Task 2.2
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Designed package fetching with filtering, field selection, error handling, and dual-layer caching strategy

---

## 📋 Task 2.1 Deliverable: Package Fetching Logic Design

### 1. Overview

**Purpose:** Fetch packages (class templates) from `class_packages` table for dropdown selection in CreateContainerModal

**Key Requirements:**
- Support filtering by active status
- Efficient field selection (no over-fetching)
- No joins needed (packages are standalone)
- Robust error handling for corrupted/missing data
- Aggressive caching (packages rarely change)

---

### 2. Database Schema

**Table:** `class_packages`

```sql
CREATE TABLE class_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT,  -- Optional short code
  class_type_id UUID,  -- Reference to class_type (if applicable)
  class_count INTEGER,  -- Number of sessions
  price DECIMAL(10,2),
  validity_days INTEGER,
  type TEXT,  -- 'Individual', 'Corporate', 'Private group'
  course_type TEXT,  -- 'regular', 'crash'
  duration TEXT,  -- e.g., '4 weeks' (for crash courses)
  metadata JSONB,  -- Additional flexible data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**V2 Type Mapping:**

```typescript
export interface Package {
  id: string;
  name: string;
  code?: string | null;
  class_type_id?: string | null;
  sessions_count?: number | null;  // Maps to class_count
  metadata?: Record<string, any> | null;
  active?: boolean;  // Maps to is_active
  created_at?: string;
  updated_at?: string;
}
```

---

### 3. Field Selection Strategy

**Decision: Fetch Only Required Fields**

**For Dropdown in CreateContainerModal:**

```typescript
.select(`
  id,
  name,
  code,
  sessions_count:class_count,
  active:is_active
`)
```

**Why not fetch all fields?**
- Reduce payload size
- Frontend doesn't need `price`, `validity_days`, `description`, etc.
- Faster network transfer
- Smaller React Query cache

**For Future Detail View (if needed):**

```typescript
.select(`
  id,
  name,
  code,
  class_type_id,
  sessions_count:class_count,
  metadata,
  active:is_active,
  created_at,
  updated_at
`)
```

---

### 4. Filtering Strategy

**A. Active-Only Filter (Default)**

```typescript
export interface FetchPackagesParams {
  isActive?: boolean;  // Default: true
  type?: string;  // Optional: 'Individual', 'Corporate', 'Private group'
}

// Usage:
fetchPackages({ isActive: true })  // Only active packages
fetchPackages({ isActive: false }) // Only inactive (archived)
fetchPackages({})                  // All packages (admin view)
```

**B. Type Filter (Optional)**

If we want to filter by package type:

```typescript
fetchPackages({ isActive: true, type: 'Individual' })
```

**C. Course Type Filter (Future)**

For filtering crash courses vs regular:

```typescript
interface FetchPackagesParams {
  isActive?: boolean;
  type?: string;
  courseType?: 'regular' | 'crash';  // Future enhancement
}
```

**Default Behavior:**
- If `isActive` is undefined → fetch only active (`is_active = true`)
- If `isActive` is explicitly `false` → fetch inactive
- If `isActive` is `null` → fetch all (no filter)

---

### 5. Join Strategy

**Decision: No Joins Needed**

**Rationale:**
- Packages are **standalone entities**
- `class_type_id` is optional reference to external Class Type Manager
- V2 doesn't need class type details for dropdown
- If class type name is needed, it's stored in package metadata or fetched separately

**No Join Required:**

```typescript
// ❌ Don't do this (unnecessary complexity)
.select(`
  *,
  class_type:class_types(id, name)
`)

// ✅ Do this (simple, fast)
.select(`
  id,
  name,
  code,
  sessions_count:class_count,
  active:is_active
`)
```

**If Class Type Name Needed:**
- Store it in `metadata.class_type_name` when package is created
- Or fetch separately if absolutely required

---

### 6. Error Handling Strategy

**A. Supabase Query Errors**

```typescript
const result = await this.supabase
  .from('class_packages')
  .select('id, name, code, sessions_count:class_count, active:is_active')
  .eq('is_active', true)
  .order('name');

if (result.error) {
  console.error('[PackageService] Fetch failed:', result.error);
  return {
    success: false,
    error: {
      code: 'FETCH_FAILED',
      message: 'Failed to load packages. Please try again.',
      details: result.error,
    },
  };
}
```

**B. Corrupted/Missing Data**

**Validation Rules:**
1. Package must have `id` and `name` (required)
2. If `name` is null/empty → skip or use fallback
3. If `sessions_count` is null → treat as 0 or exclude

```typescript
const packages = (result.data || []).filter(pkg => {
  // Filter out corrupted records
  if (!pkg.id || !pkg.name) {
    console.warn('[PackageService] Skipping invalid package:', pkg);
    return false;
  }
  return true;
}).map(pkg => ({
  id: pkg.id,
  name: pkg.name,
  code: pkg.code || null,
  sessions_count: pkg.sessions_count || 0,
  active: pkg.active ?? true,
}));
```

**C. Empty Result**

```typescript
if (packages.length === 0) {
  // Not an error, just empty state
  return {
    success: true,
    data: [],
  };
}
```

**D. Network Errors**

Handled by Supabase client automatically, caught in try-catch:

```typescript
try {
  const result = await this.supabase.from('class_packages').select(...);
  // ...
} catch (error) {
  console.error('[PackageService] Unexpected error:', error);
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
      details: error,
    },
  };
}
```

---

### 7. Caching Strategy (Dual-Layer)

**A. Service-Level Cache (In-Memory)**

```typescript
private packageCache: Map<string, { data: Package[], timestamp: number }> = new Map();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

private getCacheKey(params: FetchPackagesParams): string {
  return JSON.stringify(params);
}

private getCachedPackages(params: FetchPackagesParams): Package[] | null {
  const key = this.getCacheKey(params);
  const cached = this.packageCache.get(key);
  
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > this.CACHE_TTL) {
    this.packageCache.delete(key);
    return null;
  }
  
  return cached.data;
}

private setCachedPackages(params: FetchPackagesParams, data: Package[]): void {
  const key = this.getCacheKey(params);
  this.packageCache.set(key, { data, timestamp: Date.now() });
}

public clearCache(): void {
  this.packageCache.clear();
}
```

**B. React Query Cache (Client-Side)**

```typescript
// In usePackages.ts
export const usePackages = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['packages', params],
    queryFn: () => packageService.fetchPackages(params),
    staleTime: 10 * 60 * 1000,     // 10 minutes
    cacheTime: 30 * 60 * 1000,     // 30 minutes
    refetchOnWindowFocus: false,   // Don't refetch on tab switch
    refetchOnMount: false,         // Don't refetch on remount
  });

  return {
    packages: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    clearCache: () => {
      packageService.clearCache();
      queryClient.invalidateQueries(['packages']);
    },
  };
};
```

**Combined Cache Flow:**

```
1st Request:
Component → usePackages → packageService.fetchPackages()
  → Check service cache (miss)
  → Fetch from Supabase
  → Store in service cache (5min TTL)
  → Return to React Query (10min stale, 30min retention)
  → Render

2nd Request (within 5 min):
Component → usePackages → packageService.fetchPackages()
  → Check service cache (hit!)
  → Return cached data immediately
  → React Query serves from its cache

3rd Request (6-10 min later):
Component → usePackages → packageService.fetchPackages()
  → Check service cache (expired, miss)
  → Fetch from Supabase (React Query considers stale but still serves cached)
  → Update both caches

4th Request (30+ min later):
Component → usePackages → packageService.fetchPackages()
  → React Query cache expired
  → Service cache expired
  → Fresh fetch from Supabase
```

**Cache Invalidation:**

```typescript
// Manual invalidation (when package is created/updated in Class Type Manager)
packageService.clearCache();
queryClient.invalidateQueries(['packages']);
```

---

### 8. Implementation Signature

**PackageService Method:**

```typescript
/**
 * Fetch packages with optional filtering
 * @param params - Filtering parameters
 * @returns ServiceResult with Package array
 */
public async fetchPackages(
  params: FetchPackagesParams = {}
): Promise<ServiceResult<Package[]>> {
  try {
    // Check cache first
    const cached = this.getCachedPackages(params);
    if (cached) {
      return { success: true, data: cached };
    }

    // Build query
    let query = this.supabase
      .from('class_packages')
      .select('id, name, code, sessions_count:class_count, active:is_active');

    // Apply filters
    if (params.isActive !== undefined && params.isActive !== null) {
      query = query.eq('is_active', params.isActive);
    }

    if (params.type) {
      query = query.eq('type', params.type);
    }

    // Execute query
    const result = await query.order('name');

    if (result.error) {
      console.error('[PackageService] Fetch failed:', result.error);
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to load packages. Please try again.',
          details: result.error,
        },
      };
    }

    // Validate and clean data
    const packages = (result.data || [])
      .filter(pkg => pkg.id && pkg.name)
      .map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        code: pkg.code || null,
        sessions_count: pkg.sessions_count || 0,
        active: pkg.active ?? true,
      }));

    // Cache result
    this.setCachedPackages(params, packages);

    return { success: true, data: packages };
  } catch (error) {
    console.error('[PackageService] Unexpected error:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
        details: error,
      },
    };
  }
}
```

---

### 9. Usage Examples

**A. In CreateContainerModal:**

```typescript
import { usePackages } from '../hooks/usePackages';

const CreateContainerModal = ({ isOpen, onClose }) => {
  const { packages, isLoading, isError } = usePackages({ isActive: true });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage />;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <select name="package_id">
        <option value="">Select Package</option>
        {packages.map(pkg => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.name} {pkg.code && `(${pkg.code})`} - {pkg.sessions_count} sessions
          </option>
        ))}
      </select>
    </Modal>
  );
};
```

**B. Admin View (All Packages):**

```typescript
const { packages } = usePackages({ isActive: null }); // Fetch all
```

**C. Filtered by Type:**

```typescript
const { packages } = usePackages({ isActive: true, type: 'Individual' });
```

---

### 10. Performance Considerations

**A. Query Performance:**
- Index on `is_active` column (if not exists)
- Index on `name` for sorting
- Total packages expected: < 100 (small dataset)
- Query time: < 50ms

**B. Cache Hit Rate:**
- Expected: > 95% (packages rarely change)
- Service cache: 5min TTL
- React Query cache: 30min retention
- Combined: Up to 30min before guaranteed fresh fetch

**C. Network Payload:**
- ~20 packages × 100 bytes/package = ~2KB
- Negligible overhead

---

### 11. Edge Cases

**A. No Active Packages:**

```typescript
if (packages.length === 0) {
  return (
    <EmptyState message="No packages available. Contact admin to create packages in Class Type Manager." />
  );
}
```

**B. Package Deleted After Cache:**

If package is deleted in Class Type Manager but cached in V2:
- User selects deleted package → Container creation fails
- Error: "Package not found"
- Solution: Clear cache on error, refetch

**C. Package Name Changed:**

Old name stays in cache for up to 30min:
- Acceptable (non-critical)
- Manual cache clear via `clearCache()` if needed

---

## 🎯 Summary for Task 2.2 (MINI)

**What to implement in PackageService.fetchPackages():**

1. **Method Signature:**
   - `fetchPackages(params: { isActive?: boolean, type?: string }): Promise<ServiceResult<Package[]>>`

2. **Query:**
   - Table: `class_packages`
   - Fields: `id, name, code, sessions_count:class_count, active:is_active`
   - Filter: `is_active` (default: true)
   - Order: `name ASC`

3. **Caching:**
   - Check in-memory cache first (5min TTL)
   - Store result in cache after fetch
   - Provide `clearCache()` method

4. **Error Handling:**
   - Supabase errors → return ServiceResult with error
   - Corrupted data → filter out invalid records
   - Empty result → return empty array (not error)

5. **Data Validation:**
   - Filter records missing `id` or `name`
   - Default `sessions_count` to 0 if null
   - Default `active` to true if null

6. **No Joins:**
   - Packages are standalone
   - No need to join with class_types

**File Location:** `src/features/dashboard/services/v2/package.service.ts`

**Testing:**
- Test with active packages only
- Test with all packages
- Test with empty result
- Test cache hit/miss
- Test corrupted data handling

---

### Task 2.2: Implement PackageService.fetchPackages()
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 30 minutes
- [x] **Dependencies:** Task 2.1 ✓
- [x] **Description:** Implement package fetching method
- [x] **Deliverable:** Working fetchPackages method
- [x] **Prompt:** "Implement PackageService.fetchPackages() per Task 2.1 spec. Use Supabase client, include error handling, return typed result."
- [x] **Output Location:** src/features/dashboard/services/v2/package.service.ts
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Implemented listPackages() and getPackage() with Supabase queries, filtering, caching, and validation

---

### Task 2.3: Container CRUD Logic Design
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Critical
- [x] **Estimated Time:** 2 hours
- [x] **Dependencies:** None
- [x] **Description:** Design container CRUD with business rules and validation
- [x] **Deliverable:** Container CRUD specification
- [x] **Prompt:** "Design ContainerService CRUD: CreateContainer with instructor_id=null handling, display name generation. UpdateContainer validations. DeleteContainer soft delete rules. Capacity validation. Container code generation algorithm. Transaction handling."
- [x] **Output Location:** Comment for Task 2.4
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Designed comprehensive CRUD with code generation, display name rules, soft delete, capacity validation, and transaction handling

---

## 📋 Task 2.3 Deliverable: Container CRUD Design

### 1. Overview

**Purpose:** Complete CRUD operations for `class_containers` (Programs) with business rules, validation, and data integrity

**Key Requirements:**
- Generate unique container codes
- Auto-generate display names with instructor handling
- Validate capacity constraints
- Soft delete with active bookings check
- Transaction safety for multi-step operations

---

### 2. Database Schema Reference

**Table:** `class_containers`

```sql
CREATE TABLE class_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,  -- Auto-generated unique code
  package_id UUID NOT NULL REFERENCES class_packages(id),
  display_name TEXT NOT NULL,  -- Auto-generated or manual
  instructor_id UUID REFERENCES profiles(id),  -- Optional
  timezone TEXT,  -- IANA timezone (e.g., 'Asia/Kolkata')
  start_date DATE,
  end_date DATE,
  capacity_total INTEGER,  -- NULL for individual
  capacity_booked INTEGER DEFAULT 0,  -- Cached, updated by triggers
  status TEXT DEFAULT 'active',  -- 'draft', 'active', 'paused', 'completed', 'cancelled'
  is_active BOOLEAN DEFAULT true,  -- Soft delete flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE UNIQUE INDEX idx_class_containers_code ON class_containers(code);
CREATE INDEX idx_class_containers_package_id ON class_containers(package_id);
CREATE INDEX idx_class_containers_instructor_id ON class_containers(instructor_id);
CREATE INDEX idx_class_containers_status ON class_containers(status);
CREATE INDEX idx_class_containers_is_active ON class_containers(is_active);
```

---

### 3. Container Code Generation Algorithm

**Format:** `PROG-{YYYYMMDD}-{RANDOM}`

**Examples:**
- `PROG-20260114-A3X9`
- `PROG-20260114-B7K2`
- `PROG-20260114-C1M5`

**Algorithm:**

```typescript
private async generateContainerCode(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 4-character alphanumeric suffix (uppercase letters + numbers)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const code = `PROG-${datePart}-${suffix}`;
    
    // Check uniqueness
    const { data, error } = await this.client
      .from('class_containers')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    
    if (error) {
      console.error('[ContainerService] Code uniqueness check failed:', error);
      continue; // Try again
    }
    
    if (!data) {
      // Code is unique
      return code;
    }
    
    // Code exists, try again
  }
  
  throw new Error('Failed to generate unique container code after ' + maxAttempts + ' attempts');
}
```

**Collision Handling:**
- Probability: ~1 in 1.6M per day (36^4 combinations)
- Retry up to 5 times
- If all attempts fail, throw error and let user retry

**Why Not Sequential?**
- Sequential codes leak business information (volume, growth rate)
- Random codes are more secure
- Still human-readable for support

---

### 4. Display Name Generation Rules

**Format:** `{PackageName} - {InstructorName}` or `{PackageName} - Unassigned`

**Algorithm:**

```typescript
private async generateDisplayName(
  packageId: string,
  instructorId?: string | null
): Promise<string> {
  // Fetch package name
  const { data: pkg, error: pkgError } = await this.client
    .from('class_packages')
    .select('name')
    .eq('id', packageId)
    .single();
  
  if (pkgError || !pkg) {
    throw new Error('Package not found');
  }
  
  let instructorName = 'Unassigned';
  
  if (instructorId) {
    // Fetch instructor name from profiles
    const { data: instructor, error: instrError } = await this.client
      .from('profiles')
      .select('full_name, first_name, last_name')
      .eq('id', instructorId)
      .single();
    
    if (!instrError && instructor) {
      instructorName = instructor.full_name || 
                       `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
                       'Unknown Instructor';
    }
  }
  
  return `${pkg.name} - ${instructorName}`;
}
```

**Examples:**
- `Monthly 12-Class Yoga - Sarah Kumar`
- `4-Week Crash Course - Mike Chen`
- `Corporate Wellness - Unassigned`

**Manual Override:**
- User can provide custom `display_name` in form
- If provided, skip auto-generation
- Validate non-empty string

---

### 5. CREATE Container Logic

**Input Interface:**

```typescript
interface CreateContainerInput {
  package_id: string;  // Required
  instructor_id?: string | null;  // Optional
  display_name?: string | null;  // Optional (auto-generated if not provided)
  timezone?: string | null;  // Optional (defaults to instructor's or system default)
  start_date?: string | null;  // ISO date (YYYY-MM-DD)
  end_date?: string | null;  // ISO date
  capacity_total?: number | null;  // NULL for individual programs
  status?: ContainerStatus;  // Default: 'draft'
  created_by?: string | null;  // User ID from auth context
}
```

**Business Rules:**

1. **Package Validation:**
   - Package must exist and be active
   - Fetch package to verify

2. **Instructor Validation:**
   - If `instructor_id` provided, verify instructor exists and is active
   - If NULL, program is "Unassigned" (can be assigned later)

3. **Capacity Rules:**
   - If package type is 'Individual' → `capacity_total` MUST be NULL
   - If package type is 'Public Group' or 'Private Group' → `capacity_total` is REQUIRED
   - If package type is 'Crash Course' → `capacity_total` is OPTIONAL
   - `capacity_booked` always starts at 0

4. **Timezone:**
   - If not provided, fetch from instructor's `instructor_availability.timezone`
   - If instructor has no timezone, default to system timezone ('Asia/Kolkata')

5. **Date Validation:**
   - `start_date` < `end_date` (if both provided)
   - Dates must be in the future (optional business rule)

6. **Code and Display Name:**
   - Always auto-generate `code` (never accept from user)
   - Auto-generate `display_name` if not provided

**Algorithm:**

```typescript
public async createContainer(
  input: CreateContainerInput
): Promise<ServiceResult<Container>> {
  try {
    // 1. Validate package
    const pkgResult = await this.validatePackage(input.package_id);
    if (!pkgResult.success) {
      return { success: false, error: pkgResult.error };
    }
    const pkg = pkgResult.data!;
    
    // 2. Validate instructor (if provided)
    if (input.instructor_id) {
      const instrResult = await this.validateInstructor(input.instructor_id);
      if (!instrResult.success) {
        return { success: false, error: instrResult.error };
      }
    }
    
    // 3. Validate capacity rules
    const capacityResult = this.validateCapacity(pkg.type, input.capacity_total);
    if (!capacityResult.success) {
      return { success: false, error: capacityResult.error };
    }
    
    // 4. Validate dates
    if (input.start_date && input.end_date) {
      if (new Date(input.start_date) >= new Date(input.end_date)) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATES',
            message: 'Start date must be before end date',
          },
        };
      }
    }
    
    // 5. Generate container code
    const code = await this.generateContainerCode();
    
    // 6. Generate or use display name
    const displayName = input.display_name?.trim() || 
                        await this.generateDisplayName(input.package_id, input.instructor_id);
    
    // 7. Determine timezone
    let timezone = input.timezone;
    if (!timezone && input.instructor_id) {
      timezone = await this.getInstructorTimezone(input.instructor_id);
    }
    if (!timezone) {
      timezone = 'Asia/Kolkata'; // System default
    }
    
    // 8. Insert into database
    const { data, error } = await this.client
      .from('class_containers')
      .insert({
        code,
        package_id: input.package_id,
        display_name: displayName,
        instructor_id: input.instructor_id || null,
        timezone,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        capacity_total: input.capacity_total || null,
        capacity_booked: 0,
        status: input.status || 'draft',
        is_active: true,
        created_by: input.created_by || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[ContainerService] Create failed:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Failed to create program',
          details: error,
        },
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return this.handleError(error, 'createContainer');
  }
}
```

**Capacity Validation Helper:**

```typescript
private validateCapacity(
  packageType: string,
  capacityTotal?: number | null
): ServiceResult<void> {
  if (packageType === 'Individual') {
    if (capacityTotal !== null && capacityTotal !== undefined) {
      return {
        success: false,
        error: {
          code: 'INVALID_CAPACITY',
          message: 'Individual programs cannot have capacity',
        },
      };
    }
  } else if (packageType === 'Public Group' || packageType === 'Private Group') {
    if (!capacityTotal || capacityTotal <= 0) {
      return {
        success: false,
        error: {
          code: 'CAPACITY_REQUIRED',
          message: 'Group programs must have a capacity greater than 0',
        },
      };
    }
  }
  
  return { success: true };
}
```

---

### 6. UPDATE Container Logic

**Input Interface:**

```typescript
interface UpdateContainerInput {
  instructor_id?: string | null;  // Can change or unassign
  display_name?: string | null;  // Can update
  timezone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  capacity_total?: number | null;  // Can increase, but see rules
  status?: ContainerStatus;  // Can change lifecycle status
}
```

**Business Rules:**

1. **Immutable Fields:**
   - `code` - NEVER changeable
   - `package_id` - NEVER changeable (would break integrity)
   - `created_at`, `created_by` - NEVER changeable

2. **Instructor Change:**
   - Can change from one instructor to another
   - Can unassign (set to NULL)
   - Must validate new instructor exists and is active
   - Trigger display name regeneration if display_name not manually set

3. **Display Name:**
   - If user provides new `display_name`, use it
   - If user sets `display_name` to NULL, regenerate from package + instructor

4. **Capacity Changes:**
   - Can INCREASE capacity any time
   - Can DECREASE capacity ONLY if `capacity_booked <= new_capacity`
   - Cannot change NULL capacity to non-NULL (would break individual programs)
   - Cannot change non-NULL to NULL (would break group programs)

5. **Status Changes:**
   - `draft` → `active`: Allowed
   - `active` → `paused`: Allowed
   - `active` → `completed`: Allowed if all assignments completed
   - `active` → `cancelled`: Allowed if no active bookings (or confirm force-cancel)
   - Cannot reactivate `completed` or `cancelled` (business rule)

6. **Date Changes:**
   - Can update dates
   - Validate `start_date < end_date`
   - Warn if assignments exist outside new date range (optional validation)

**Algorithm:**

```typescript
public async updateContainer(
  id: string,
  input: UpdateContainerInput
): Promise<ServiceResult<Container>> {
  try {
    // 1. Fetch existing container
    const { data: existing, error: fetchError } = await this.client
      .from('class_containers')
      .select('*, class_packages!inner(type)')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Program not found',
        },
      };
    }
    
    // 2. Validate instructor change
    if (input.instructor_id !== undefined && input.instructor_id !== existing.instructor_id) {
      if (input.instructor_id) {
        const instrResult = await this.validateInstructor(input.instructor_id);
        if (!instrResult.success) {
          return { success: false, error: instrResult.error };
        }
      }
    }
    
    // 3. Validate capacity change
    if (input.capacity_total !== undefined) {
      const capacityResult = await this.validateCapacityChange(
        existing.capacity_total,
        input.capacity_total,
        existing.capacity_booked
      );
      if (!capacityResult.success) {
        return { success: false, error: capacityResult.error };
      }
    }
    
    // 4. Validate date changes
    const newStartDate = input.start_date !== undefined ? input.start_date : existing.start_date;
    const newEndDate = input.end_date !== undefined ? input.end_date : existing.end_date;
    
    if (newStartDate && newEndDate && new Date(newStartDate) >= new Date(newEndDate)) {
      return {
        success: false,
        error: {
          code: 'INVALID_DATES',
          message: 'Start date must be before end date',
        },
      };
    }
    
    // 5. Handle display name
    let displayName = existing.display_name;
    if (input.display_name !== undefined) {
      if (input.display_name === null || input.display_name.trim() === '') {
        // Regenerate display name
        const newInstructorId = input.instructor_id !== undefined ? input.instructor_id : existing.instructor_id;
        displayName = await this.generateDisplayName(existing.package_id, newInstructorId);
      } else {
        displayName = input.display_name.trim();
      }
    } else if (input.instructor_id !== undefined && input.instructor_id !== existing.instructor_id) {
      // Instructor changed but display_name not provided → regenerate
      displayName = await this.generateDisplayName(existing.package_id, input.instructor_id);
    }
    
    // 6. Build update payload (only changed fields)
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.instructor_id !== undefined) updates.instructor_id = input.instructor_id;
    if (displayName !== existing.display_name) updates.display_name = displayName;
    if (input.timezone !== undefined) updates.timezone = input.timezone;
    if (input.start_date !== undefined) updates.start_date = input.start_date;
    if (input.end_date !== undefined) updates.end_date = input.end_date;
    if (input.capacity_total !== undefined) updates.capacity_total = input.capacity_total;
    if (input.status !== undefined) updates.status = input.status;
    
    // 7. Update in database
    const { data, error } = await this.client
      .from('class_containers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[ContainerService] Update failed:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update program',
          details: error,
        },
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return this.handleError(error, 'updateContainer');
  }
}
```

**Capacity Change Validation:**

```typescript
private async validateCapacityChange(
  currentCapacity: number | null,
  newCapacity: number | null,
  currentBooked: number
): Promise<ServiceResult<void>> {
  // Cannot change NULL to non-NULL or vice versa (type change)
  if ((currentCapacity === null) !== (newCapacity === null)) {
    return {
      success: false,
      error: {
        code: 'CAPACITY_TYPE_CHANGE',
        message: 'Cannot change capacity type (individual ↔ group)',
      },
    };
  }
  
  // If decreasing capacity, check if new capacity >= booked
  if (newCapacity !== null && currentCapacity !== null && newCapacity < currentCapacity) {
    if (newCapacity < currentBooked) {
      return {
        success: false,
        error: {
          code: 'CAPACITY_BELOW_BOOKED',
          message: `Cannot reduce capacity to ${newCapacity}. Currently ${currentBooked} seats booked.`,
        },
      };
    }
  }
  
  return { success: true };
}
```

---

### 7. DELETE Container Logic (Soft Delete)

**Business Rules:**

1. **Soft Delete Only:**
   - Set `is_active = false`
   - Do NOT delete row (preserve historical data)
   - Cascade: Do NOT delete assignments or bookings

2. **Pre-Delete Checks:**
   - Check for active bookings
   - If active bookings exist → ERROR (prevent accidental deletion)
   - Allow force delete with confirmation (optional parameter)

3. **Status After Delete:**
   - Set `status = 'cancelled'`
   - Set `is_active = false`
   - Keep `updated_at` timestamp

4. **Restoration:**
   - Admin can restore by setting `is_active = true` and `status = 'active'`

**Algorithm:**

```typescript
public async deleteContainer(
  id: string,
  options?: { force?: boolean }
): Promise<ServiceResult<void>> {
  try {
    // 1. Fetch container
    const { data: container, error: fetchError } = await this.client
      .from('class_containers')
      .select('id, display_name, status, capacity_booked')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (fetchError || !container) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Program not found or already deleted',
        },
      };
    }
    
    // 2. Check for active bookings
    if (container.capacity_booked > 0 && !options?.force) {
      // Count active bookings
      const { count, error: countError } = await this.client
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('container_id', id)
        .in('booking_status', ['confirmed', 'pending']);
      
      if (countError) {
        console.error('[ContainerService] Booking check failed:', countError);
      }
      
      if (count && count > 0) {
        return {
          success: false,
          error: {
            code: 'HAS_ACTIVE_BOOKINGS',
            message: `Cannot delete program "${container.display_name}". ${count} active booking(s) exist.`,
            details: { activeBookings: count },
          },
        };
      }
    }
    
    // 3. Soft delete (set is_active = false, status = 'cancelled')
    const { error: deleteError } = await this.client
      .from('class_containers')
      .update({
        is_active: false,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (deleteError) {
      console.error('[ContainerService] Delete failed:', deleteError);
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete program',
          details: deleteError,
        },
      };
    }
    
    return { success: true };
  } catch (error) {
    return this.handleError(error, 'deleteContainer');
  }
}
```

**Force Delete:**

```typescript
// In component
const handleDelete = async (containerId: string) => {
  const result = await containerService.deleteContainer(containerId);
  
  if (!result.success && result.error?.code === 'HAS_ACTIVE_BOOKINGS') {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: 'Active Bookings Exist',
      message: result.error.message,
      confirmText: 'Force Delete',
      confirmVariant: 'danger',
    });
    
    if (confirmed) {
      // Retry with force flag
      const forceResult = await containerService.deleteContainer(containerId, { force: true });
      if (forceResult.success) {
        toast.success('Program deleted');
      } else {
        toast.error(forceResult.error?.message || 'Delete failed');
      }
    }
  } else if (!result.success) {
    toast.error(result.error?.message || 'Delete failed');
  } else {
    toast.success('Program deleted');
  }
};
```

---

### 8. LIST Containers Logic

**Input Interface:**

```typescript
interface ListContainersParams {
  instructorId?: string | null;  // Filter by instructor
  packageId?: string | null;  // Filter by package
  status?: ContainerStatus | ContainerStatus[];  // Filter by status(es)
  isActive?: boolean;  // Filter by soft delete flag (default: true)
  search?: string;  // Search in display_name or code
  limit?: number;  // Pagination
  offset?: number;  // Pagination
  sortBy?: 'created_at' | 'updated_at' | 'display_name' | 'start_date';
  sortOrder?: 'asc' | 'desc';
}
```

**Algorithm:**

```typescript
public async listContainers(
  params: ListContainersParams = {}
): Promise<ServiceResult<{ containers: Container[], total: number }>> {
  try {
    // Build query
    let query = this.client
      .from('class_containers')
      .select('*, class_packages!inner(name)', { count: 'exact' });
    
    // Apply filters
    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive);
    } else {
      query = query.eq('is_active', true); // Default: only active
    }
    
    if (params.instructorId) {
      query = query.eq('instructor_id', params.instructorId);
    }
    
    if (params.packageId) {
      query = query.eq('package_id', params.packageId);
    }
    
    if (params.status) {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    }
    
    if (params.search) {
      const search = `%${params.search}%`;
      query = query.or(`display_name.ilike.${search},code.ilike.${search}`);
    }
    
    // Sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }
    
    // Execute
    const { data, count, error } = await query;
    
    if (error) {
      console.error('[ContainerService] List failed:', error);
      return {
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: 'Failed to load programs',
          details: error,
        },
      };
    }
    
    return {
      success: true,
      data: {
        containers: data || [],
        total: count || 0,
      },
    };
  } catch (error) {
    return this.handleError(error, 'listContainers');
  }
}
```

---

### 9. GET Single Container Logic

**Algorithm:**

```typescript
public async getContainer(id: string): Promise<ServiceResult<Container>> {
  try {
    const { data, error } = await this.client
      .from('class_containers')
      .select(`
        *,
        class_packages!inner(id, name, code, class_count),
        profiles:instructor_id(id, full_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Program not found',
        },
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return this.handleError(error, 'getContainer');
  }
}
```

---

### 10. Transaction Handling

**Scenario 1: Create Container with Assignments (Bulk)**

```typescript
public async createContainerWithAssignments(
  containerInput: CreateContainerInput,
  assignmentInputs: CreateAssignmentInput[]
): Promise<ServiceResult<{ container: Container, assignments: Assignment[] }>> {
  // Supabase doesn't support transactions directly in client
  // Use RPC function or handle rollback manually
  
  try {
    // 1. Create container
    const containerResult = await this.createContainer(containerInput);
    if (!containerResult.success) {
      return { success: false, error: containerResult.error };
    }
    const container = containerResult.data!;
    
    // 2. Create assignments
    const assignments: Assignment[] = [];
    for (const assignmentInput of assignmentInputs) {
      const assignmentResult = await assignmentService.createAssignment({
        ...assignmentInput,
        container_id: container.id,
      });
      
      if (!assignmentResult.success) {
        // Rollback: Delete container
        await this.deleteContainer(container.id, { force: true });
        
        return {
          success: false,
          error: {
            code: 'ASSIGNMENT_CREATION_FAILED',
            message: 'Failed to create assignments. Container creation rolled back.',
            details: assignmentResult.error,
          },
        };
      }
      
      assignments.push(assignmentResult.data!);
    }
    
    return {
      success: true,
      data: { container, assignments },
    };
  } catch (error) {
    return this.handleError(error, 'createContainerWithAssignments');
  }
}
```

**Scenario 2: Database-Level Transaction (RPC)**

```sql
-- Create RPC function for atomic operations
CREATE OR REPLACE FUNCTION create_container_with_assignments(
  container_data JSONB,
  assignments_data JSONB[]
) RETURNS JSONB AS $$
DECLARE
  new_container class_containers;
  new_assignment class_assignments;
  result JSONB;
BEGIN
  -- Insert container
  INSERT INTO class_containers (
    code, package_id, display_name, instructor_id, timezone,
    start_date, end_date, capacity_total, capacity_booked, status, is_active
  )
  VALUES (
    (container_data->>'code')::TEXT,
    (container_data->>'package_id')::UUID,
    (container_data->>'display_name')::TEXT,
    (container_data->>'instructor_id')::UUID,
    (container_data->>'timezone')::TEXT,
    (container_data->>'start_date')::DATE,
    (container_data->>'end_date')::DATE,
    (container_data->>'capacity_total')::INTEGER,
    0,
    (container_data->>'status')::TEXT,
    true
  )
  RETURNING * INTO new_container;
  
  -- Insert assignments
  FOR i IN 1..array_length(assignments_data, 1) LOOP
    INSERT INTO class_assignments (
      container_id, instructor_id, class_date, start_time, end_time, timezone, status
    )
    VALUES (
      new_container.id,
      (assignments_data[i]->>'instructor_id')::UUID,
      (assignments_data[i]->>'class_date')::DATE,
      (assignments_data[i]->>'start_time')::TIME,
      (assignments_data[i]->>'end_time')::TIME,
      (assignments_data[i]->>'timezone')::TEXT,
      (assignments_data[i]->>'status')::TEXT
    );
  END LOOP;
  
  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'container_id', new_container.id
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Rollback handled automatically by Postgres
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;
```

**Call from Service:**

```typescript
const { data, error } = await this.client.rpc('create_container_with_assignments', {
  container_data: containerInput,
  assignments_data: assignmentInputs,
});
```

---

### 11. Helper Methods

**A. Validate Package:**

```typescript
private async validatePackage(packageId: string): Promise<ServiceResult<any>> {
  const { data, error } = await this.client
    .from('class_packages')
    .select('id, name, type, is_active')
    .eq('id', packageId)
    .single();
  
  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'PACKAGE_NOT_FOUND',
        message: 'Package not found',
      },
    };
  }
  
  if (!data.is_active) {
    return {
      success: false,
      error: {
        code: 'PACKAGE_INACTIVE',
        message: 'Package is not active',
      },
    };
  }
  
  return { success: true, data };
}
```

**B. Validate Instructor:**

```typescript
private async validateInstructor(instructorId: string): Promise<ServiceResult<any>> {
  const { data, error } = await this.client
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', instructorId)
    .single();
  
  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Instructor not found',
      },
    };
  }
  
  // Check if user has instructor role
  if (data.role !== 'instructor' && data.role !== 'admin' && data.role !== 'super_admin') {
    return {
      success: false,
      error: {
        code: 'INVALID_INSTRUCTOR',
        message: 'User is not an instructor',
      },
    };
  }
  
  return { success: true, data };
}
```

**C. Get Instructor Timezone:**

```typescript
private async getInstructorTimezone(instructorId: string): Promise<string | null> {
  const { data, error } = await this.client
    .from('instructor_availability')
    .select('timezone')
    .eq('instructor_id', instructorId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.timezone || null;
}
```

---

### 12. Error Codes Reference

| Code | Message | Action |
|------|---------|--------|
| `PACKAGE_NOT_FOUND` | Package not found | Check package ID |
| `PACKAGE_INACTIVE` | Package is not active | Select active package |
| `INSTRUCTOR_NOT_FOUND` | Instructor not found | Check instructor ID |
| `INVALID_INSTRUCTOR` | User is not an instructor | Assign valid instructor |
| `INVALID_CAPACITY` | Individual programs cannot have capacity | Set capacity to NULL |
| `CAPACITY_REQUIRED` | Group programs must have capacity | Provide capacity > 0 |
| `CAPACITY_TYPE_CHANGE` | Cannot change capacity type | Create new container |
| `CAPACITY_BELOW_BOOKED` | Cannot reduce capacity below booked | Cancel bookings first |
| `INVALID_DATES` | Start date must be before end date | Fix date range |
| `CREATE_FAILED` | Failed to create program | Retry or contact support |
| `UPDATE_FAILED` | Failed to update program | Retry or contact support |
| `NOT_FOUND` | Program not found | Check container ID |
| `HAS_ACTIVE_BOOKINGS` | Cannot delete program with active bookings | Cancel bookings or force delete |
| `DELETE_FAILED` | Failed to delete program | Retry or contact support |
| `LIST_FAILED` | Failed to load programs | Retry or contact support |

---

## 🎯 Summary for Task 2.4 (MINI)

**What to implement in ContainerService.createContainer():**

1. **Core Method:**
   - `createContainer(input: CreateContainerInput): Promise<ServiceResult<Container>>`

2. **Validation Steps:**
   - Validate package exists and is active
   - Validate instructor (if provided)
   - Validate capacity rules based on package type
   - Validate date range

3. **Generation Logic:**
   - Generate unique `code` using `PROG-{YYYYMMDD}-{RANDOM}` format
   - Generate `display_name` from package + instructor (or use manual)
   - Determine timezone (instructor → system default)

4. **Database Insert:**
   - Insert into `class_containers` with all fields
   - Handle Supabase errors
   - Return created container

5. **Helper Methods:**
   - `generateContainerCode()` - with uniqueness check
   - `generateDisplayName(packageId, instructorId?)` - fetch package and instructor names
   - `validatePackage(packageId)` - check existence and active status
   - `validateInstructor(instructorId)` - check existence and role
   - `validateCapacity(packageType, capacity)` - enforce capacity rules
   - `getInstructorTimezone(instructorId)` - fetch from instructor_availability

**File Location:** `src/features/dashboard/services/v2/container.service.ts`

**Testing Scenarios:**
- Create with manual display name
- Create with auto-generated display name
- Create with instructor
- Create without instructor (Unassigned)
- Create individual program (NULL capacity)
- Create group program (with capacity)
- Validate capacity rules
- Handle duplicate code collision
- Handle missing package
- Handle missing instructor

---

### Task 2.4: Implement ContainerService.createContainer()
- [x] **Model:** 🟢 MINI
- [x] **Priority:** Critical
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** Task 2.3 ✓
- [x] **Description:** Implement container creation
- [x] **Deliverable:** Working createContainer method
- [x] **Prompt:** "Implement ContainerService.createContainer() per Task 2.3 spec: Validation checks, container code generation, display name generation (with instructor or 'Unassigned'), Supabase insert, error handling, return typed result."
- [x] **Output Location:** src/features/dashboard/services/v2/container.service.ts
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Implemented createContainer with 8-step validation pipeline, code generation (PROG-YYYYMMDD-XXXX), display name generation, and 5 helper methods (validatePackage, validateInstructor, validateCapacity, getInstructorTimezone, generateContainerCode, generateDisplayName)

---

### Task 2.5: Validation Rules Strategy
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1.5 hours
- [x] **Dependencies:** None
- [x] **Description:** Design validation strategy for containers and assignments
- [x] **Deliverable:** Complete validation strategy
- [x] **Prompt:** "Review CLASS_ASSIGNMENT_V2_ARCHITECTURE.md validation section and design: Client-side validation for containers, assignments, timezone conflict checking, crash course validations. When to validate client vs server?"
- [x] **Output Location:** Comment for Tasks 2.6, 2.7
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Designed multi-layer validation with client/server split, timezone normalization, conflict detection, and comprehensive error patterns

---

## 📋 Task 2.5 Deliverable: Validation Rules Strategy

### 1. Overview

**Purpose:** Comprehensive validation strategy for container and assignment operations with clear client/server boundaries

**Key Requirements:**
- Fast client-side validation for immediate feedback
- Server-side enforcement for data integrity
- Timezone-aware conflict detection
- Graceful error handling with actionable messages
- Crash course-specific validations

**Validation Layers:**
1. **Client (Browser)** - Fast feedback, UX-focused
2. **Service (TypeScript)** - Pre-flight checks before API calls
3. **Database (Triggers)** - Final enforcement, data integrity

---

### 2. Client vs Server Validation Strategy

**Decision Matrix:**

| Validation Type | Client | Service | Database | Rationale |
|----------------|--------|---------|----------|-----------|
| **Required Fields** | ✅ Yes | ✅ Yes | ✅ Yes | Immediate feedback + enforcement |
| **Field Format** | ✅ Yes | ✅ Yes | ❌ No | Client prevents bad input |
| **Business Rules** | ✅ Yes | ✅ Yes | ✅ Yes | Triple validation for integrity |
| **Capacity Check** | ✅ Yes | ✅ Yes | ✅ Yes | Prevent overbooking |
| **Instructor Conflict** | ❌ No | ✅ Yes | ❌ No | Too expensive for real-time |
| **Timezone Conversion** | ❌ No | ✅ Yes | ❌ No | Complex logic, service layer |
| **Date/Time Logic** | ✅ Yes | ✅ Yes | ❌ No | Client catches typos early |
| **Uniqueness Checks** | ❌ No | ❌ No | ✅ Yes | Race conditions, DB-only |

**Why This Split?**

**Client Validation (Instant):**
- Synchronous checks (< 1ms)
- No network calls
- Prevents form submission with obvious errors
- Example: Empty fields, invalid email format, negative numbers

**Service Validation (Pre-Flight):**
- Async checks (< 500ms)
- Can query database
- Business logic enforcement
- Example: Instructor availability, capacity checks, date conflicts

**Database Validation (Final):**
- Triggered on INSERT/UPDATE
- Handles race conditions
- Last line of defense
- Example: UNIQUE constraints, FK integrity, capacity triggers

---

### 3. Container Validation Rules

**A. Create Container Validation**

```typescript
interface CreateContainerInput {
  package_id: string;           // Required
  instructor_id?: string;       // Optional (can be "Unassigned")
  display_name?: string;        // Optional (auto-generated if not provided)
  timezone?: string;            // Optional (defaults to instructor or 'Asia/Kolkata')
  start_date?: string;          // Optional (ISO date)
  end_date?: string;            // Optional (ISO date)
  capacity_total?: number;      // Required for group, NULL for individual
  status?: ContainerStatus;     // Optional (defaults to 'draft')
}

// Client-Side Validation
function validateContainerClientSide(input: CreateContainerInput): ValidationResult {
  const errors: string[] = [];
  
  // 1. Package required
  if (!input.package_id || input.package_id.trim() === '') {
    errors.push('Package selection is required');
  }
  
  // 2. Display name length (if provided)
  if (input.display_name && input.display_name.length > 200) {
    errors.push('Display name must be 200 characters or less');
  }
  
  // 3. Capacity format (if provided)
  if (input.capacity_total !== null && input.capacity_total !== undefined) {
    if (!Number.isInteger(input.capacity_total) || input.capacity_total < 1) {
      errors.push('Capacity must be a positive integer');
    }
    if (input.capacity_total > 50) {
      errors.push('Capacity cannot exceed 50');
    }
  }
  
  // 4. Date format and logic
  if (input.start_date && !isValidISODate(input.start_date)) {
    errors.push('Invalid start date format');
  }
  if (input.end_date && !isValidISODate(input.end_date)) {
    errors.push('Invalid end date format');
  }
  if (input.start_date && input.end_date) {
    if (new Date(input.start_date) >= new Date(input.end_date)) {
      errors.push('End date must be after start date');
    }
  }
  
  // 5. Timezone format (if provided)
  if (input.timezone && !isValidIANATimezone(input.timezone)) {
    errors.push('Invalid timezone format. Use IANA timezone (e.g., Asia/Kolkata)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// Service-Side Validation (Pre-Flight)
async function validateContainerServiceSide(input: CreateContainerInput): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Package exists and is active
  const pkg = await packageService.getPackage(input.package_id);
  if (!pkg.success || !pkg.data) {
    errors.push('Selected package does not exist');
    return { isValid: false, errors, warnings };
  }
  if (!pkg.data.is_active) {
    errors.push('Selected package is not active');
  }
  
  // 2. Instructor exists and is valid (if provided)
  if (input.instructor_id) {
    const instructor = await profileService.getProfile(input.instructor_id);
    if (!instructor.success || !instructor.data) {
      errors.push('Selected instructor does not exist');
    } else if (!['instructor', 'admin', 'super_admin'].includes(instructor.data.role)) {
      errors.push('Selected user is not an instructor');
    }
  } else {
    warnings.push('No instructor assigned. Program will be marked as "Unassigned"');
  }
  
  // 3. Capacity rules based on package type
  const packageType = pkg.data.type;
  if (packageType === 'Individual') {
    if (input.capacity_total !== null && input.capacity_total !== undefined) {
      errors.push('Individual programs cannot have capacity. Leave blank or set to NULL.');
    }
  } else if (packageType === 'Public Group' || packageType === 'Private Group') {
    if (!input.capacity_total || input.capacity_total <= 0) {
      errors.push(`${packageType} programs must have a capacity greater than 0`);
    }
  } else if (packageType === 'Crash Course') {
    if (input.capacity_total && input.capacity_total <= 0) {
      errors.push('Crash course capacity must be greater than 0 if provided');
    }
    // Optional for crash courses
  }
  
  // 4. Future date validation (optional - business decision)
  if (input.start_date && new Date(input.start_date) < new Date()) {
    warnings.push('Start date is in the past. This is allowed but unusual.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

**B. Update Container Validation**

```typescript
interface UpdateContainerInput {
  instructor_id?: string | null;
  display_name?: string | null;
  timezone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  capacity_total?: number | null;
  status?: ContainerStatus;
}

// Service-Side Validation
async function validateContainerUpdate(
  containerId: string,
  input: UpdateContainerInput
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Fetch existing container
  const existing = await containerService.getContainer(containerId);
  if (!existing.success) {
    errors.push('Container not found');
    return { isValid: false, errors, warnings };
  }
  
  const container = existing.data;
  
  // 2. Immutable field checks (client should hide these fields)
  // package_id, code, created_at, created_by - never editable
  
  // 3. Instructor change validation
  if (input.instructor_id !== undefined && input.instructor_id !== container.instructor_id) {
    if (input.instructor_id) {
      const instructor = await profileService.getProfile(input.instructor_id);
      if (!instructor.success) {
        errors.push('New instructor does not exist');
      } else if (!['instructor', 'admin', 'super_admin'].includes(instructor.data.role)) {
        errors.push('User is not an instructor');
      }
    }
    // Unassigning is allowed (setting to null)
  }
  
  // 4. Capacity change validation
  if (input.capacity_total !== undefined) {
    const currentCapacity = container.capacity_total;
    const newCapacity = input.capacity_total;
    const currentBooked = container.capacity_booked || 0;
    
    // Cannot change capacity type (NULL ↔ non-NULL)
    if ((currentCapacity === null) !== (newCapacity === null)) {
      errors.push('Cannot change capacity type (individual ↔ group). Create a new program instead.');
    }
    
    // Cannot reduce below booked
    if (newCapacity !== null && currentCapacity !== null && newCapacity < currentCapacity) {
      if (newCapacity < currentBooked) {
        errors.push(`Cannot reduce capacity to ${newCapacity}. Currently ${currentBooked} seats booked.`);
      } else {
        warnings.push(`Reducing capacity from ${currentCapacity} to ${newCapacity}. ${currentBooked} seats currently booked.`);
      }
    }
  }
  
  // 5. Date change validation
  const newStartDate = input.start_date !== undefined ? input.start_date : container.start_date;
  const newEndDate = input.end_date !== undefined ? input.end_date : container.end_date;
  
  if (newStartDate && newEndDate && new Date(newStartDate) >= new Date(newEndDate)) {
    errors.push('End date must be after start date');
  }
  
  // 6. Status change validation
  if (input.status && input.status !== container.status) {
    const validTransitions = {
      'draft': ['active', 'cancelled'],
      'active': ['paused', 'completed', 'cancelled'],
      'paused': ['active', 'cancelled'],
      'completed': [],  // Cannot reactivate
      'cancelled': [],  // Cannot reactivate
      'rescheduled': ['active']
    };
    
    if (!validTransitions[container.status]?.includes(input.status)) {
      errors.push(`Cannot transition from ${container.status} to ${input.status}`);
    }
    
    if (input.status === 'cancelled' && currentBooked > 0) {
      warnings.push(`This program has ${currentBooked} active booking(s). Consider notifying students before cancellation.`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

### 4. Assignment Validation Rules

**A. Create Assignment Validation**

```typescript
interface CreateAssignmentInput {
  container_id: string;         // Required
  instructor_id?: string;       // Optional if set at container level
  class_date: string;           // Required (ISO date)
  start_time: string;           // Required (HH:MM:SS or HH:MM)
  end_time: string;             // Required (HH:MM:SS or HH:MM)
  timezone?: string;            // Optional (defaults to container or 'Asia/Kolkata')
  class_status?: string;        // Optional (defaults to 'scheduled')
  meeting_link?: string;        // Optional (Zoom URL)
  notes?: string;               // Optional
}

// Client-Side Validation
function validateAssignmentClientSide(input: CreateAssignmentInput): ValidationResult {
  const errors: string[] = [];
  
  // 1. Required fields
  if (!input.container_id) errors.push('Program selection is required');
  if (!input.class_date) errors.push('Class date is required');
  if (!input.start_time) errors.push('Start time is required');
  if (!input.end_time) errors.push('End time is required');
  
  // 2. Date format
  if (input.class_date && !isValidISODate(input.class_date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD.');
  }
  
  // 3. Time format
  if (input.start_time && !isValidTimeFormat(input.start_time)) {
    errors.push('Invalid start time format. Use HH:MM.');
  }
  if (input.end_time && !isValidTimeFormat(input.end_time)) {
    errors.push('Invalid end time format. Use HH:MM.');
  }
  
  // 4. Time logic
  if (input.start_time && input.end_time) {
    const start = parseTime(input.start_time);
    const end = parseTime(input.end_time);
    if (start >= end) {
      errors.push('End time must be after start time');
    }
    const duration = end - start; // in minutes
    if (duration < 15) {
      errors.push('Class duration must be at least 15 minutes');
    }
    if (duration > 240) {
      errors.push('Class duration cannot exceed 4 hours');
    }
  }
  
  // 5. Date not too far in past
  if (input.class_date) {
    const date = new Date(input.class_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      errors.push('Cannot create assignment in the past');
    }
  }
  
  // 6. Meeting link format (if provided)
  if (input.meeting_link && !isValidURL(input.meeting_link)) {
    errors.push('Invalid meeting link URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// Service-Side Validation (Pre-Flight)
async function validateAssignmentServiceSide(input: CreateAssignmentInput): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Container exists and is active
  const container = await containerService.getContainer(input.container_id);
  if (!container.success || !container.data) {
    errors.push('Selected program does not exist');
    return { isValid: false, errors, warnings };
  }
  if (!container.data.is_active) {
    errors.push('Selected program is not active');
  }
  
  // 2. Instructor validation
  let effectiveInstructorId = input.instructor_id || container.data.instructor_id;
  
  if (!effectiveInstructorId) {
    errors.push('Instructor is required. Set at program level or provide here.');
  } else {
    const instructor = await profileService.getProfile(effectiveInstructorId);
    if (!instructor.success) {
      errors.push('Instructor does not exist');
    } else if (!['instructor', 'admin', 'super_admin'].includes(instructor.data.role)) {
      errors.push('Selected user is not an instructor');
    }
  }
  
  // 3. Date within container date range (if set)
  if (container.data.start_date || container.data.end_date) {
    const assignmentDate = new Date(input.class_date);
    if (container.data.start_date && assignmentDate < new Date(container.data.start_date)) {
      warnings.push(`Assignment date is before program start date (${container.data.start_date})`);
    }
    if (container.data.end_date && assignmentDate > new Date(container.data.end_date)) {
      warnings.push(`Assignment date is after program end date (${container.data.end_date})`);
    }
  }
  
  // 4. Instructor conflict check (CRITICAL)
  if (effectiveInstructorId) {
    const conflictResult = await validationService.checkInstructorConflict(
      effectiveInstructorId,
      input.class_date,
      input.start_time,
      input.end_time,
      input.timezone || container.data.timezone || 'Asia/Kolkata'
    );
    
    if (conflictResult.hasConflict) {
      const conflictDetails = conflictResult.conflictingAssignments.map(a => 
        `${a.class_date} ${a.start_time}-${a.end_time}`
      ).join(', ');
      errors.push(`Instructor conflict detected: ${conflictDetails}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

### 5. Timezone Conflict Detection Strategy

**Problem:** Instructors may be assigned classes in different timezones. Need to detect overlaps.

**Solution: Normalize to Instructor's Timezone**

```typescript
/**
 * Conflict Detection Algorithm:
 * 1. Get instructor's preferred timezone from instructor_availability table
 * 2. Convert all assignment times to instructor's timezone
 * 3. Compare normalized times for overlaps
 */

interface ConflictResult {
  hasConflict: boolean;
  conflictingAssignments: Assignment[];
}

async function checkInstructorConflict(
  instructorId: string,
  date: string,
  startTime: string,
  endTime: string,
  timezone: string = 'Asia/Kolkata'
): Promise<ConflictResult> {
  // Step 1: Get instructor's preferred timezone
  const { data: availability } = await supabase
    .from('instructor_availability')
    .select('timezone')
    .eq('instructor_id', instructorId)
    .maybeSingle();
  
  const instructorTz = availability?.timezone || 'Asia/Kolkata';
  
  // Step 2: Normalize input times to instructor timezone
  const normalizedStart = convertToTimezone(startTime, timezone, instructorTz, date);
  const normalizedEnd = convertToTimezone(endTime, timezone, instructorTz, date);
  
  // Step 3: Fetch existing assignments for the same date
  const { data: existingAssignments } = await supabase
    .from('class_assignments')
    .select('id, class_date, start_time, end_time, timezone')
    .eq('instructor_id', instructorId)
    .eq('class_date', date)  // Same calendar date
    .in('class_status', ['scheduled', 'confirmed', 'ongoing']);
  
  // Step 4: Check for overlaps
  const conflicts = (existingAssignments || []).filter(existing => {
    // Normalize existing assignment times to instructor timezone
    const existingStart = convertToTimezone(
      existing.start_time,
      existing.timezone || 'Asia/Kolkata',
      instructorTz,
      existing.class_date
    );
    const existingEnd = convertToTimezone(
      existing.end_time,
      existing.timezone || 'Asia/Kolkata',
      instructorTz,
      existing.class_date
    );
    
    // Check overlap: [start1, end1) overlaps [start2, end2) if start1 < end2 AND end1 > start2
    return normalizedStart < existingEnd && normalizedEnd > existingStart;
  });
  
  return {
    hasConflict: conflicts.length > 0,
    conflictingAssignments: conflicts
  };
}

/**
 * Timezone Conversion Helper
 * Uses date-fns-tz for reliability
 */
function convertToTimezone(
  time: string,              // HH:MM or HH:MM:SS
  fromTz: string,            // Source timezone
  toTz: string,              // Target timezone
  date: string               // YYYY-MM-DD (needed for DST handling)
): string {
  const { zonedTimeToUtc, utcToZonedTime, format } = require('date-fns-tz');
  
  // Combine date and time
  const dateTimeString = `${date}T${time}`;
  
  // Convert to UTC from source timezone
  const utcDate = zonedTimeToUtc(dateTimeString, fromTz);
  
  // Convert from UTC to target timezone
  const targetDate = utcToZonedTime(utcDate, toTz);
  
  // Return as HH:MM:SS
  return format(targetDate, 'HH:mm:ss', { timeZone: toTz });
}
```

**Edge Cases:**

1. **Daylight Saving Time (DST):**
   - `date-fns-tz` handles DST automatically
   - Always include date in conversion (DST transitions happen on specific dates)

2. **Date Boundary Crossing:**
   - Example: 11:00 PM IST = 5:30 PM UTC (same day)
   - But: 1:00 AM IST = 7:30 PM UTC (previous day)
   - Solution: Always use full `date + time + timezone` for conversion

3. **Multiple Assignments Same Day:**
   - Query all assignments for instructor on same calendar date
   - Normalize each to instructor's timezone
   - Check all pairwise overlaps

---

### 6. Crash Course Specific Validations

**Crash Course Rules:**
- All assignments must be created upfront (no monthly accumulation)
- Total assignments must match package `class_count`
- All assignments within course duration (e.g., 4 weeks)
- Higher capacity validation (10-30 students)

```typescript
async function validateCrashCourseCreation(
  containerInput: CreateContainerInput,
  assignmentInputs: CreateAssignmentInput[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Fetch package details
  const pkg = await packageService.getPackage(containerInput.package_id);
  if (!pkg.success) {
    errors.push('Package not found');
    return { isValid: false, errors, warnings };
  }
  
  // 2. Verify it's a crash course
  if (pkg.data.course_type !== 'crash') {
    errors.push('This validation is for crash courses only');
    return { isValid: false, errors, warnings };
  }
  
  // 3. All assignments created upfront
  if (assignmentInputs.length === 0) {
    errors.push('Crash course must have all assignments created upfront');
  }
  
  // 4. Assignment count matches package
  const expectedCount = pkg.data.class_count;
  if (assignmentInputs.length !== expectedCount) {
    errors.push(`Package requires ${expectedCount} classes, but ${assignmentInputs.length} provided`);
  }
  
  // 5. All assignments within course duration
  if (assignmentInputs.length > 0) {
    const dates = assignmentInputs.map(a => new Date(a.class_date)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    const durationDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedDuration = parseDuration(pkg.data.metadata?.duration || '4 weeks'); // e.g., "4 weeks" → 28 days
    
    if (durationDays > expectedDuration) {
      errors.push(`Assignments span ${durationDays} days, but course duration is ${expectedDuration} days`);
    }
  }
  
  // 6. Capacity validation (crash courses typically 10-30)
  if (containerInput.capacity_total) {
    if (containerInput.capacity_total < 10) {
      warnings.push('Crash courses typically have at least 10 students');
    }
    if (containerInput.capacity_total > 30) {
      warnings.push('Crash courses typically have at most 30 students');
    }
  }
  
  // 7. All assignments have same instructor
  const instructors = new Set(assignmentInputs.map(a => a.instructor_id || containerInput.instructor_id));
  if (instructors.size > 1) {
    warnings.push('All crash course assignments typically have the same instructor');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function parseDuration(duration: string): number {
  // Parse "4 weeks", "30 days", "1 month" to days
  const match = duration.match(/(\d+)\s*(week|day|month)/i);
  if (!match) return 30; // Default
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'day': return value;
    case 'week': return value * 7;
    case 'month': return value * 30;
    default: return 30;
  }
}
```

---

### 7. Error Handling & User Feedback

**A. Error Display Strategy**

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];      // Blocking errors (prevent submission)
  warnings: string[];    // Non-blocking warnings (allow submission with confirmation)
}

// In Form Component
function ContainerForm() {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  
  const handleSubmit = async (data: CreateContainerInput) => {
    // Step 1: Client-side validation
    const clientResult = validateContainerClientSide(data);
    if (!clientResult.isValid) {
      setValidationResult(clientResult);
      return; // Block submission
    }
    
    // Step 2: Service-side validation
    const serviceResult = await validateContainerServiceSide(data);
    if (!serviceResult.isValid) {
      setValidationResult(serviceResult);
      return; // Block submission
    }
    
    // Step 3: Show warnings (if any) with confirmation
    if (serviceResult.warnings.length > 0) {
      const confirmed = await showConfirmDialog({
        title: 'Warning',
        message: serviceResult.warnings.join('\n'),
        confirmText: 'Continue Anyway',
        cancelText: 'Go Back'
      });
      
      if (!confirmed) return; // User cancelled
    }
    
    // Step 4: Submit to API
    const result = await containerService.createContainer(data);
    if (!result.success) {
      // Server error
      setValidationResult({
        isValid: false,
        errors: [result.error?.message || 'Failed to create program'],
        warnings: []
      });
      return;
    }
    
    // Success
    toast.success('Program created successfully');
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Error Display */}
      {validationResult.errors.length > 0 && (
        <div className="error-banner">
          <h4>Please fix the following errors:</h4>
          <ul>
            {validationResult.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Warning Display */}
      {validationResult.warnings.length > 0 && (
        <div className="warning-banner">
          <h4>Warnings:</h4>
          <ul>
            {validationResult.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Form fields... */}
    </form>
  );
}
```

**B. Real-Time Validation (Optional)**

```typescript
// Debounced validation for better UX
import { useDebouncedCallback } from 'use-debounce';

function AssignmentForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Debounce conflict check (500ms after user stops typing)
  const checkConflicts = useDebouncedCallback(
    async (instructorId: string, date: string, startTime: string, endTime: string, timezone: string) => {
      const result = await validationService.checkInstructorConflict(
        instructorId,
        date,
        startTime,
        endTime,
        timezone
      );
      
      if (result.hasConflict) {
        setFieldErrors(prev => ({
          ...prev,
          time: `Instructor conflict: ${result.conflictingAssignments[0].start_time}-${result.conflictingAssignments[0].end_time}`
        }));
      } else {
        setFieldErrors(prev => {
          const { time, ...rest } = prev;
          return rest;
        });
      }
    },
    500
  );
  
  // Trigger on field change
  useEffect(() => {
    if (instructorId && date && startTime && endTime) {
      checkConflicts(instructorId, date, startTime, endTime, timezone);
    }
  }, [instructorId, date, startTime, endTime, timezone]);
  
  return (
    <form>
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      {fieldErrors.time && (
        <span className="error-text">{fieldErrors.time}</span>
      )}
    </form>
  );
}
```

---

### 8. Validation Service API

**Complete ValidationService Interface:**

```typescript
// src/features/dashboard/services/v2/validation.service.ts

export class ValidationService extends BaseService {
  
  /**
   * Container Validation
   */
  public validateContainerCreation(input: CreateContainerInput): ValidationResult {
    // Client-side synchronous validation
  }
  
  public async validateContainerCreationAsync(input: CreateContainerInput): Promise<ValidationResult> {
    // Service-side async validation (pre-flight)
  }
  
  public async validateContainerUpdate(
    containerId: string,
    input: UpdateContainerInput
  ): Promise<ValidationResult> {
    // Service-side update validation
  }
  
  /**
   * Assignment Validation
   */
  public validateAssignmentCreation(input: CreateAssignmentInput): ValidationResult {
    // Client-side synchronous validation
  }
  
  public async validateAssignmentCreationAsync(input: CreateAssignmentInput): Promise<ValidationResult> {
    // Service-side async validation (pre-flight)
  }
  
  /**
   * Instructor Conflict Detection
   */
  public async checkInstructorConflict(
    instructorId: string,
    date: string,
    startTime: string,
    endTime: string,
    timezone?: string
  ): Promise<ConflictResult> {
    // Timezone-aware conflict detection
  }
  
  /**
   * Crash Course Validation
   */
  public async validateCrashCourseCreation(
    containerInput: CreateContainerInput,
    assignmentInputs: CreateAssignmentInput[]
  ): Promise<ValidationResult> {
    // Crash course-specific rules
  }
  
  /**
   * Helper Methods
   */
  private isValidISODate(date: string): boolean;
  private isValidTimeFormat(time: string): boolean;
  private isValidIANATimezone(tz: string): boolean;
  private isValidURL(url: string): boolean;
  private parseTime(time: string): number; // Returns minutes since midnight
  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean;
}
```

---

### 9. Testing Strategy

**Unit Tests:**

```typescript
// validation.service.test.ts

describe('ValidationService', () => {
  describe('validateContainerCreation', () => {
    it('should reject empty package_id', () => {
      const result = ValidationService.validateContainerCreation({ package_id: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Package selection is required');
    });
    
    it('should reject negative capacity', () => {
      const result = ValidationService.validateContainerCreation({
        package_id: 'valid-id',
        capacity_total: -5
      });
      expect(result.isValid).toBe(false);
    });
    
    it('should reject end_date before start_date', () => {
      const result = ValidationService.validateContainerCreation({
        package_id: 'valid-id',
        start_date: '2026-02-01',
        end_date: '2026-01-01'
      });
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('checkInstructorConflict', () => {
    it('should detect overlapping assignments', async () => {
      // Mock existing assignment: 2026-01-15 10:00-11:00 IST
      const result = await ValidationService.checkInstructorConflict(
        'instructor-1',
        '2026-01-15',
        '10:30', // Overlaps with 10:00-11:00
        '11:30',
        'Asia/Kolkata'
      );
      expect(result.hasConflict).toBe(true);
    });
    
    it('should handle timezone conversion', async () => {
      // Mock existing: 10:00-11:00 IST
      // New: 04:30-05:30 UTC (same as 10:00-11:00 IST)
      const result = await ValidationService.checkInstructorConflict(
        'instructor-1',
        '2026-01-15',
        '04:30',
        '05:30',
        'UTC'
      );
      expect(result.hasConflict).toBe(true);
    });
  });
});
```

---

## 🎯 Summary for Tasks 2.6 & 2.7 (MINI)

**Task 2.6: Implement ValidationService (Container)**

1. **Methods to Implement:**
   - `validateContainerCreation(input)` - Synchronous client-side checks
   - `validateContainerCreationAsync(input)` - Async service-side checks
   - `validateContainerUpdate(id, input)` - Update-specific validations

2. **Validation Checks:**
   - Required: package_id
   - Optional: instructor_id (validate if provided)
   - Capacity: Enforce rules based on package type
   - Dates: start_date < end_date
   - Format: Timezone, display_name length

3. **Return Type:**
   ```typescript
   interface ValidationResult {
     isValid: boolean;
     errors: string[];
     warnings: string[];
   }
   ```

**Task 2.7: Implement ValidationService (Assignment)**

1. **Methods to Implement:**
   - `validateAssignmentCreation(input)` - Synchronous checks
   - `validateAssignmentCreationAsync(input)` - Async checks with conflict detection
   - `checkInstructorConflict(instructorId, date, startTime, endTime, timezone)` - Core conflict logic

2. **Validation Checks:**
   - Required: container_id, class_date, start_time, end_time
   - Instructor: Required at assignment or container level
   - Time: end_time > start_time, 15min-4hr duration
   - Date: Not in past
   - Conflicts: Timezone-aware instructor overlap check

3. **Timezone Handling:**
   - Use `date-fns-tz` library
   - Normalize all times to instructor's timezone
   - Include date for DST handling

**File Location:** `src/features/dashboard/services/v2/validation.service.ts`

**Dependencies:**
- `date-fns-tz` for timezone conversion
- `use-debounce` for real-time conflict checks (UI)
- BaseService for error handling

---

### Task 2.6: Implement ValidationService (Container)
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** Task 2.5 ✓
- [ ] **Description:** Implement container validation
- [ ] **Deliverable:** Container validation method
- [ ] **Prompt:** "Implement ValidationService.validateContainerCreation() per Task 2.5: Return { isValid: boolean, errors: string[] }. Check type, instructor (optional), package, capacity rules."
- [ ] **Output Location:** src/features/dashboard/services/v2/validation.service.ts
- [ ] **Notes:**

---

### Task 2.7: Implement ValidationService (Assignment)
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 2.5 ✓
- [ ] **Description:** Implement assignment validation
- [ ] **Deliverable:** Assignment validation method
- [ ] **Prompt:** "Implement ValidationService.validateAssignmentCreation() per Task 2.5: Include timezone handling, instructor check (required if not at program level), date validation."
- [ ] **Output Location:** src/features/dashboard/services/v2/validation.service.ts
- [ ] **Notes:**

---

### Task 2.8: Timezone Conversion Logic Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design timezone handling for instructor conflicts
- [ ] **Deliverable:** Timezone handling specification
- [ ] **Prompt:** "Design timezone conversion for instructor conflict checking: Which library (date-fns-tz vs luxon vs moment-timezone)? Algorithm to convert times to instructor timezone. Fetch instructor timezone from instructor_availability. Fallback if no timezone. Edge cases (DST)?"
- [ ] **Output Location:** Comment for Task 2.9
- [ ] **Notes:**

---

### Task 2.9: Implement Timezone Helpers
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 2.8 ✓
- [ ] **Description:** Create timezone utility functions
- [ ] **Deliverable:** Timezone helper functions
- [ ] **Prompt:** "Create timezoneHelpers.ts per Task 2.8: Implement convertToTimezone(time, fromTz, toTz), getInstructorTimezone(instructorId), normalizeTimeForComparison(time, timezone). Use [library from Task 2.8]."
- [ ] **Output Location:** src/features/dashboard/utils/v2/timezoneHelpers.ts
- [ ] **Notes:**

---

### Task 2.10: Implement checkInstructorConflict()
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 2.9 ✓
- [ ] **Description:** Implement instructor conflict detection
- [ ] **Deliverable:** Conflict checking method
- [ ] **Prompt:** "Implement ValidationService.checkInstructorConflict(): 1. Fetch instructor timezone, 2. Normalize input times, 3. Query existing assignments, 4. Normalize existing times, 5. Check overlaps, 6. Return ConflictResult."
- [ ] **Output Location:** src/features/dashboard/services/v2/validation.service.ts
- [ ] **Notes:**

---

## 📋 Phase 3: UI Components (Week 3-4)

**Goal:** Build all UI components for desktop view

### Task 3.1: Component Design System Review
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Review existing components and design V2 components
- [ ] **Deliverable:** UI component design system
- [ ] **Prompt:** "Review existing shared components and design V2: Can we reuse Button, Modal, LoadingSpinner? CapacityIndicator design (progress bar vs circular)? ContainerCard layout? Touch target sizes? Color scheme for capacity? Animation strategy?"
- [ ] **Output Location:** Comment for subsequent tasks
- [ ] **Notes:**

---

### Task 3.2: Create ContainerCard Component
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 3.1 ✓
- [ ] **Description:** Create container card component
- [ ] **Deliverable:** ContainerCard component
- [ ] **Prompt:** "Create ContainerCard.tsx per Task 3.1 design and architecture doc mockup: Display program name, instructor, capacity, assignment count. Include hover effects. Use CapacityIndicator (placeholder). Add onClick handler prop. TypeScript with Container type."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/ContainerCard.tsx
- [ ] **Notes:**

---

### Task 3.3: CapacityIndicator Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 3.1 ✓
- [ ] **Description:** Design capacity indicator component
- [ ] **Deliverable:** CapacityIndicator specification
- [ ] **Prompt:** "Design CapacityIndicator: Progress bar or circular? Color transitions (smooth or stepped)? Accessibility (ARIA labels, screen reader)? Size variants? Animation on value change?"
- [ ] **Output Location:** Comment for Task 3.4
- [ ] **Notes:**

---

### Task 3.4: Create CapacityIndicator Component
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 3.3 ✓
- [ ] **Description:** Implement capacity indicator
- [ ] **Deliverable:** CapacityIndicator component
- [ ] **Prompt:** "Create CapacityIndicator.tsx per Task 3.3 spec: Include size prop, percentage calculation, color logic based on thresholds."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/CapacityIndicator.tsx
- [ ] **Notes:**

---

### Task 3.5: Modal Management Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design modal state management
- [ ] **Deliverable:** Modal management architecture
- [ ] **Prompt:** "Design modal management: Single modal manager or individual? State (useState vs useReducer vs Context)? Multiple modals open? Backdrop click behavior? Keyboard escape? Focus trap? Animation enter/exit?"
- [ ] **Output Location:** Comment for Task 3.6
- [ ] **Notes:**

---

### Task 3.6: Create Modal Components (Skeletons)
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 3.5 ✓
- [ ] **Description:** Create modal skeleton components
- [ ] **Deliverable:** Modal skeleton components
- [ ] **Prompt:** "Create modal skeletons per Task 3.5: CreateContainerModal, EditContainerModal, CreateAssignmentModal, DeleteConfirmModal. Each with Props interface (isOpen, onClose, onSubmit), basic modal wrapper, placeholder content, Cancel/Submit buttons."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/modals/
- [ ] **Notes:**

---

### Task 3.7: Container Form Logic Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design container form logic
- [ ] **Deliverable:** Form design specification
- [ ] **Prompt:** "Design ContainerForm logic: Form state management (controlled vs uncontrolled)? Package selection dropdown population. Instructor selection (optional handling). Capacity field (when to disable). Display name (auto-generate or manual). Validation timing. Error display."
- [ ] **Output Location:** Comment for Task 3.8
- [ ] **Notes:**

---

### Task 3.8: Implement ContainerForm Component
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 3.7 ✓
- [ ] **Description:** Create container form component
- [ ] **Deliverable:** ContainerForm component
- [ ] **Prompt:** "Create ContainerForm.tsx per Task 3.7: Package dropdown with usePackages, Instructor dropdown (optional), Capacity input (conditional disable), Display name (auto-generated), Validation display, Submit handler."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/forms/ContainerForm.tsx
- [ ] **Notes:**

---

### Task 3.9: Drawer Component Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design drawer slide-out component
- [ ] **Deliverable:** Drawer specification
- [ ] **Prompt:** "Design ContainerDrawer: Slide from right (desktop) vs bottom sheet (mobile)? Animation library or CSS? Backdrop behavior? Scroll handling? Width on desktop? Keyboard navigation (Tab trap)? Close on route change?"
- [ ] **Output Location:** Comment for Task 3.10
- [ ] **Notes:**

---

### Task 3.10: Create ContainerDrawer Component
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 3.9 ✓
- [ ] **Description:** Implement drawer component
- [ ] **Deliverable:** ContainerDrawer component
- [ ] **Prompt:** "Create ContainerDrawer.tsx per Task 3.9: Slide animation from right, Backdrop with click-to-close, Header with close button, Container details section, Assignment list section (placeholder), Footer actions. Props: isOpen, container, onClose."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/ContainerDrawer.tsx
- [ ] **Notes:**

---

## 📋 Phase 4: Integration & Wiring (Week 5)

**Goal:** Connect all components, add routing, implement permissions

### Task 4.1: ClassesDashboard State Management Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Phase 3 completion
- [ ] **Description:** Design main component state management
- [ ] **Deliverable:** State management architecture
- [ ] **Prompt:** "Design state management for ClassesDashboard: Which modals/drawer can be open simultaneously? How to pass data (selected container)? Optimistic updates or wait? Error handling (toast vs inline)? Loading states? Polling strategy?"
- [ ] **Output Location:** Comment for Task 4.2
- [ ] **Notes:**

---

### Task 4.2: Wire Up ClassesDashboard
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 4.1 ✓, Phase 3 ✓
- [ ] **Description:** Complete main dashboard wiring
- [ ] **Deliverable:** Fully wired ClassesDashboard
- [ ] **Prompt:** "Complete ClassesDashboard.tsx per Task 4.1: Add state variables, integrate useContainers hook, wire up ContainerCard grid, wire up ContainerDrawer, wire up modals, connect all event handlers, add loading/error states, add success notifications."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx
- [ ] **Notes:**

---

### Task 4.3: Routing Integration Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** None
- [ ] **Description:** Design routing integration
- [ ] **Deliverable:** Routing integration plan
- [ ] **Prompt:** "Design routing: Lazy load ClassesDashboard or preload? Route guards for permissions? Deep linking support (e.g., ?container=123)? Suspense fallback? Error boundary at route level?"
- [ ] **Output Location:** Comment for Task 4.4
- [ ] **Notes:**

---

### Task 4.4: Add Route to App
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** Task 4.3 ✓
- [ ] **Description:** Integrate route into app
- [ ] **Deliverable:** Route integrated
- [ ] **Prompt:** "Update routing in UniversalDashboard.tsx per Task 4.3: Add lazy import for ClassesDashboard, add to component map, ensure role-based access works, test navigation to route."
- [ ] **Output Location:** src/features/dashboard/components/UniversalDashboard.tsx
- [ ] **Notes:**

---

### Task 4.5: Permission System Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design permission checks
- [ ] **Deliverable:** Permission system design
- [ ] **Prompt:** "Review BOOKING_ASSIGNMENT_ROLES_MODULES.md and design: Where to check permissions (component/hook/both)? Create permissions.ts helper? Hide vs disable vs tooltip? Admin vs super_admin differences? How to test?"
- [ ] **Output Location:** Comment for Task 4.6
- [ ] **Notes:**

---

### Task 4.6: Implement Permission Utilities
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 4.5 ✓
- [ ] **Description:** Create permission utility functions
- [ ] **Deliverable:** Permission utility functions
- [ ] **Prompt:** "Create permissions.ts per Task 4.5: Implement getUserPermissions(role), hasPermission(user, action, resource), usePermissions() hook. Permission check for each action (view, create, edit, delete, assign)."
- [ ] **Output Location:** src/shared/utils/permissions.ts
- [ ] **Notes:**

---

### Task 4.7: Add Permission Checks to Components
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 4.6 ✓
- [ ] **Description:** Integrate permissions into components
- [ ] **Deliverable:** Permission-aware components
- [ ] **Prompt:** "Update ClassesDashboard and subcomponents: Import usePermissions, conditionally render based on permissions ([+ Create] if canCreate, Edit if canUpdate, Delete if canDelete, Assign Students if canAssign). Show disabled state with tooltip if no permission."
- [ ] **Output Location:** Various component files
- [ ] **Notes:**

---

## 📋 Phase 5: Assignment Management (Week 6)

**Goal:** Build assignment list, form, and creation workflow

### Task 5.1: Assignment List Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design assignment list component
- [ ] **Deliverable:** AssignmentList specification
- [ ] **Prompt:** "Design AssignmentList: Display format (table vs cards vs timeline)? Default sort (date asc/desc)? Grouping by week/month or flat? Inline actions or menu? Virtual scrolling for long lists? Mobile vs desktop differences?"
- [ ] **Output Location:** Comment for Task 5.2
- [ ] **Notes:**

---

### Task 5.2: Create AssignmentList Component
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** Task 5.1 ✓
- [ ] **Description:** Implement assignment list
- [ ] **Deliverable:** AssignmentList component
- [ ] **Prompt:** "Create AssignmentList.tsx per Task 5.1: Display assignments with date/time, status badge, meeting link, quick actions (Edit, Delete), empty state, loading skeleton. Props: assignments[], onEdit, onDelete, onCreate."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/AssignmentList.tsx
- [ ] **Notes:**

---

### Task 5.3: Assignment Form Logic Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design assignment form logic
- [ ] **Deliverable:** AssignmentForm specification
- [ ] **Prompt:** "Design AssignmentForm: Date/time pickers (native HTML5 or library)? Timezone dropdown (all or common)? Instructor field (how to indicate required if not at program level)? Meeting link (manual or auto-generate indicator)? Validation timing (real-time conflicts or on submit)? Optimistic update?"
- [ ] **Output Location:** Comment for Task 5.4
- [ ] **Notes:**

---

### Task 5.4: Create AssignmentForm Component
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 5.3 ✓
- [ ] **Description:** Implement assignment form
- [ ] **Deliverable:** AssignmentForm component
- [ ] **Prompt:** "Create AssignmentForm.tsx per Task 5.3: Date picker with validation, Start/End time pickers, Timezone dropdown, Instructor selector (if not set at program level), Class status dropdown, Meeting link (optional), Notes textarea, Submit handler with validation. Show validation errors inline."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/forms/AssignmentForm.tsx
- [ ] **Notes:**

---

### Task 5.5: Create Assignment Modal Integration
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 5.4 ✓
- [ ] **Description:** Wire up assignment creation modal
- [ ] **Deliverable:** Working CreateAssignmentModal
- [ ] **Prompt:** "Complete CreateAssignmentModal.tsx: Integrate AssignmentForm, pre-fill container_id from props, call AssignmentService.createAssignment on submit, show loading state, handle success (close modal, notification), handle errors (display in modal), call validation before submit."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/modals/CreateAssignmentModal.tsx
- [ ] **Notes:**

---

### Task 5.6: Instructor Conflict Checking UI Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design conflict checking UX
- [ ] **Deliverable:** Conflict checking UX spec
- [ ] **Prompt:** "Design conflict checking UX: Check on blur or onChange? Show as error or warning (allow override)? Display conflict details? Debounce checks (how long)? Loading indicator? Suggest alternative times?"
- [ ] **Output Location:** Comment for Task 5.7
- [ ] **Notes:**

---

### Task 5.7: Implement Conflict Checking UI
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** Task 5.6 ✓
- [ ] **Description:** Add conflict checking to form
- [ ] **Deliverable:** Conflict checking integrated
- [ ] **Prompt:** "Add conflict checking to AssignmentForm per Task 5.6: Add useDebounce hook for date/time changes, call ValidationService.checkInstructorConflict, display conflict warning/error, show conflicting assignment details, add loading state, allow form submission per Pro's decision."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/forms/AssignmentForm.tsx
- [ ] **Notes:**

---

## 📋 Phase 6: Booking Assignment (Week 7)

**Goal:** Implement booking-to-program linking functionality

### Task 6.1: Booking Assignment UI Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design booking assignment UX
- [ ] **Deliverable:** Booking assignment UX specification
- [ ] **Prompt:** "Review BOOKING_ASSIGNMENT_ROLES_MODULES.md and design: 'Assign Students' button placement (drawer header or footer)? Modal vs side panel? Multi-select or one-at-a-time? Filter bookings (by package match only)? Show already-assigned? Capacity check (block or warn)? Success feedback?"
- [ ] **Output Location:** Comment for Task 6.2
- [ ] **Notes:**

---

### Task 6.2: Create AssignmentBookingsService
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Implement booking assignment service
- [ ] **Deliverable:** AssignmentBookingsService
- [ ] **Prompt:** "Create assignment-bookings.service.ts from BOOKING_ASSIGNMENT_ROLES_MODULES.md: Implement assignBookingToProgram, getBookingsForProgram, getProgramsForBooking, unassignBookingFromProgram, getAvailableBookings. Include error handling and type safety."
- [ ] **Output Location:** src/features/dashboard/services/v2/assignment-bookings.service.ts
- [ ] **Notes:**

---

### Task 6.3: Create Student Assignment Modal
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 6.1 ✓, Task 6.2 ✓
- [ ] **Description:** Build student assignment modal
- [ ] **Deliverable:** AssignStudentsModal component
- [ ] **Prompt:** "Create AssignStudentsModal.tsx per Task 6.1: Search/filter bookings, display available bookings list, multi-select checkboxes, show booking details (student, package, status), filter by package match and not-assigned, capacity warning, submit handler calls AssignmentBookingsService, success/error handling."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/modals/AssignStudentsModal.tsx
- [ ] **Notes:**

---

### Task 6.4: Integrate into ContainerDrawer
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 6.3 ✓
- [ ] **Description:** Add assignment feature to drawer
- [ ] **Deliverable:** ContainerDrawer with booking assignment
- [ ] **Prompt:** "Update ContainerDrawer.tsx: Add [+ Assign Students] button per Task 6.1 placement, add state for AssignStudentsModal (isOpen), display enrolled students list (from assignment_bookings), add unassign action for each student, refresh student list after assignment, update capacity display."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/ContainerDrawer.tsx
- [ ] **Notes:**

---

### Task 6.5: Extend BookingManagement Module Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Plan BookingManagement enhancements
- [ ] **Deliverable:** BookingManagement enhancement plan
- [ ] **Prompt:** "Review existing BookingManagement.tsx and plan: Where to add 'Assign to Program' button? Refactor component structure? Show program assignment status? Add tab or inline? Permission checks for roles? Mobile responsive considerations?"
- [ ] **Output Location:** Comment for Task 6.6
- [ ] **Notes:**

---

### Task 6.6: Add Assignment Feature to BookingManagement
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 6.5 ✓, Task 6.2 ✓
- [ ] **Description:** Enhance BookingManagement module
- [ ] **Deliverable:** BookingManagement with assignment
- [ ] **Prompt:** "Update BookingManagement.tsx per Task 6.5: Add 'Program Assignment' section to booking details, add [Assign to Program] button, fetch available programs (matching package), add program selection modal, call AssignmentBookingsService on assign, display assigned program name, add [Unassign] button, refresh on assignment change."
- [ ] **Output Location:** src/features/dashboard/components/Modules/BookingManagement.tsx
- [ ] **Notes:**

---

## 📋 Phase 7: Mobile & PWA (Week 8)

**Goal:** Implement mobile-optimized UI and PWA features

### Task 7.1: Mobile Strategy Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design mobile experience
- [ ] **Deliverable:** Mobile strategy document
- [ ] **Prompt:** "Design mobile experience for V2: Bottom sheet vs full-screen modals? Navigation (tab bar or drawer)? Touch gesture priorities (swipe to delete vs scroll)? Offline support (which data to cache)? Pull-to-refresh implementation? FAB placement? Screen breakpoints?"
- [ ] **Output Location:** Comment for subsequent mobile tasks
- [ ] **Notes:**

---

### Task 7.2: Create MobileDetect Hook
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** None
- [ ] **Description:** Implement mobile detection
- [ ] **Deliverable:** useMobileDetect hook
- [ ] **Prompt:** "Implement useMobileDetect.ts: Detect mobile based on user agent, screen width (< 768px), touch capability. Return: { isMobile, isTablet, isDesktop }. Listen for resize events. Memoize result."
- [ ] **Output Location:** src/features/dashboard/hooks/v2/useMobileDetect.ts
- [ ] **Notes:**

---

### Task 7.3: Create Mobile-Specific Components
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 3 hours
- [ ] **Dependencies:** Task 7.1 ✓, Task 7.2 ✓
- [ ] **Description:** Build mobile components
- [ ] **Deliverable:** Mobile components
- [ ] **Prompt:** "Create mobile components per Task 7.1: 1. MobileContainerCard.tsx (compact, expandable inline, swipe gestures if decided), 2. MobileContainerList.tsx (vertical scroll, pull-to-refresh, FAB), 3. BottomSheet.tsx (slide up, backdrop, drag handle, snap points)."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/components/mobile/
- [ ] **Notes:**

---

### Task 7.4: Implement Swipe Gestures
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 7.1 ✓
- [ ] **Description:** Create swipe gesture hook
- [ ] **Deliverable:** useSwipeGestures hook
- [ ] **Prompt:** "Create useSwipeGestures.ts: Implement touch handlers (onTouchStart, onTouchMove, onTouchEnd), calculate swipe direction and distance, minimum distance threshold (50px), callbacks (onSwipeLeft, onSwipeRight), haptic feedback if available. Return event handlers object."
- [ ] **Output Location:** src/features/dashboard/hooks/v2/useSwipeGestures.ts
- [ ] **Notes:**

---

### Task 7.5: PWA Manifest & Service Worker Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design PWA strategy
- [ ] **Deliverable:** PWA strategy document
- [ ] **Prompt:** "Design PWA strategy: Which routes to cache? Cache strategy (network-first or cache-first)? Offline fallback behavior? Update notification strategy? Icon sizes and splash screens? Start URL and scope?"
- [ ] **Output Location:** Comment for Tasks 7.6, 7.7
- [ ] **Notes:**

---

### Task 7.6: Update PWA Manifest
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** Task 7.5 ✓
- [ ] **Description:** Update manifest.json
- [ ] **Deliverable:** Updated manifest.json
- [ ] **Prompt:** "Update public/manifest.json per Task 7.5: Add V2 routes to start_url, ensure icon sizes correct, set display standalone, add description, set theme color, add shortcuts for quick actions."
- [ ] **Output Location:** public/manifest.json
- [ ] **Notes:**

---

### Task 7.7: Configure Service Worker
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Medium
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 7.5 ✓
- [ ] **Description:** Update service worker
- [ ] **Deliverable:** Service worker configured
- [ ] **Prompt:** "Update public/sw.js per Task 7.5: Add caching for V2 route, V2 component bundles, API responses (with expiry), implement Pro's cache strategy, add offline fallback page."
- [ ] **Output Location:** public/sw.js
- [ ] **Notes:**

---

## 📋 Phase 8: Testing & Polish (Week 9)

**Goal:** Test, optimize, and finalize for production

### Task 8.1: Testing Strategy Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design testing approach
- [ ] **Deliverable:** Testing strategy document
- [ ] **Prompt:** "Design testing strategy: Unit tests (which services/utils critical)? Integration tests (user workflows to cover)? E2E tests (critical paths)? Mock strategy for Supabase? Test data setup? CI/CD integration?"
- [ ] **Output Location:** Comment for Task 8.2
- [ ] **Notes:**

---

### Task 8.2: Write Service Unit Tests
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 3 hours
- [ ] **Dependencies:** Task 8.1 ✓
- [ ] **Description:** Create unit tests for services
- [ ] **Deliverable:** Service unit tests
- [ ] **Prompt:** "Create tests per Task 8.1: __tests__/container.service.test.ts, __tests__/validation.service.test.ts, __tests__/capacity.service.test.ts. Use Jest + React Testing Library. Mock Supabase responses. Cover happy path + error cases."
- [ ] **Output Location:** src/features/dashboard/services/v2/__tests__/
- [ ] **Notes:**

---

### Task 8.3: Performance Optimization Review
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Phase 1-7 completion
- [ ] **Description:** Analyze and plan optimizations
- [ ] **Deliverable:** Performance optimization plan
- [ ] **Prompt:** "Review V2 for performance: React.memo opportunities? useCallback/useMemo needed? Query optimization (too many joins)? Bundle size analysis? Lazy loading opportunities? Image optimization? Code splitting strategy?"
- [ ] **Output Location:** Comment for Task 8.4
- [ ] **Notes:**

---

### Task 8.4: Apply Performance Optimizations
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 8.3 ✓
- [ ] **Description:** Implement optimizations
- [ ] **Deliverable:** Optimized components
- [ ] **Prompt:** "Apply optimizations per Task 8.3: Wrap expensive components in React.memo, add useCallback to event handlers, optimize query in ContainerService, lazy load modals, add loading skeletons, implement virtual scrolling if needed, code split by route."
- [ ] **Output Location:** Various files
- [ ] **Notes:**

---

### Task 8.5: Accessibility Audit Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Plan accessibility audit
- [ ] **Deliverable:** Accessibility audit report
- [ ] **Prompt:** "Audit V2 for accessibility: ARIA labels needed? Keyboard navigation issues? Focus management in modals? Color contrast ratios? Screen reader testing? WCAG 2.1 Level AA compliance checklist?"
- [ ] **Output Location:** Comment for Task 8.6
- [ ] **Notes:**

---

### Task 8.6: Fix Accessibility Issues
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** Task 8.5 ✓
- [ ] **Description:** Implement accessibility fixes
- [ ] **Deliverable:** Accessible components
- [ ] **Prompt:** "Fix accessibility issues per Task 8.5: Add ARIA labels, fix keyboard navigation, add focus trap to modals, adjust colors for contrast, add skip links, add alt text to icons, test with screen reader."
- [ ] **Output Location:** Various files
- [ ] **Notes:**

---

## 📊 Task Summary

### By Model
- **🟣 PRO Tasks:** 19 (Design, Strategy, Architecture)
- **🟢 MINI Tasks:** 46 (Implementation, Coding)

### By Priority
- **Critical:** 12 tasks
- **High:** 43 tasks
- **Medium:** 10 tasks

### By Phase
- **Phase 1 (Foundation):** 12 tasks
- **Phase 2 (Services):** 10 tasks
- **Phase 3 (UI Components):** 10 tasks
- **Phase 4 (Integration):** 7 tasks
- **Phase 5 (Assignments):** 7 tasks
- **Phase 6 (Bookings):** 6 tasks
- **Phase 7 (Mobile/PWA):** 7 tasks
- **Phase 8 (Testing):** 6 tasks

---

## 📝 How to Use This Document

1. **Mark tasks as complete** by changing `[ ]` to `[x]`
2. **Add notes** in the Notes section of each task
3. **Track blockers** in task notes
4. **Update progress overview** at top
5. **Link to commits/PRs** in notes for reference

---

## 🎯 Current Sprint

**Week:** [Add current week number]  
**Phase:** [Add current phase]  
**Focus:** [Add current focus area]

**This Week's Tasks:**
- [ ] Task X.X
- [ ] Task X.X
- [ ] Task X.X

---

**Last Updated:** January 14, 2026  
**Next Review:** [Add date]
