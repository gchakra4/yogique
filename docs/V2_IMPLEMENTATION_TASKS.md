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
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 30 minutes
- [x] **Dependencies:** Task 2.5 ✓
- [x] **Description:** Implement container validation
- [x] **Deliverable:** Container validation method
- [x] **Prompt:** "Implement ValidationService.validateContainerCreation() per Task 2.5: Return { isValid: boolean, errors: string[] }. Check type, instructor (optional), package, capacity rules."
- [x] **Output Location:** src/features/dashboard/services/v2/validation.service.ts
- [x] **Notes:**

---

### Task 2.7: Implement ValidationService (Assignment)
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 45 minutes
- [x] **Dependencies:** Task 2.5 ✓
- [x] **Description:** Implement assignment validation
- [x] **Deliverable:** Assignment validation method
- [x] **Prompt:** "Implement ValidationService.validateAssignmentCreation() per Task 2.5: Include timezone handling, instructor check (required if not at program level), date validation."
- [x] **Output Location:** src/features/dashboard/services/v2/validation.service.ts
- [x] **Notes:**

---

### Task 2.8: Timezone Conversion Logic Design
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design timezone handling for instructor conflicts
- [x] **Deliverable:** Timezone handling specification
- [x] **Prompt:** "Design timezone conversion for instructor conflict checking: Which library (date-fns-tz vs luxon vs moment-timezone)? Algorithm to convert times to instructor timezone. Fetch instructor timezone from instructor_availability. Fallback if no timezone. Edge cases (DST)?"
- [x] **Output Location:** Comment for Task 2.9
- [x] **Notes:** ✅ Completed Jan 14, 2026 - Designed timezone conversion with date-fns-tz recommendation, conversion algorithm, instructor timezone fetching, fallback strategy, DST handling, and comprehensive edge cases

---

## 📋 Task 2.8 Deliverable: Timezone Conversion Logic Design

### 1. Library Comparison & Recommendation

**Evaluated Libraries:**

| Library | Pros | Cons | Verdict |
|---------|------|------|--------|
| **date-fns-tz** | ✅ Tree-shakeable (small bundle)<br>✅ Functional API (no mutation)<br>✅ Works with native Date<br>✅ Active maintenance<br>✅ Good TypeScript support | ⚠️ Requires date-fns as peer dep<br>⚠️ Less comprehensive than Luxon | ⭐ **RECOMMENDED** |
| **Luxon** | ✅ Comprehensive API<br>✅ Immutable<br>✅ Excellent documentation<br>✅ Built-in timezone support | ❌ Larger bundle size (~67KB)<br>❌ Learning curve for new API<br>❌ Wraps Date in custom object | 🟡 Good alternative |
| **moment-timezone** | ✅ Mature & battle-tested<br>✅ Large community | ❌ Deprecated (maintenance mode)<br>❌ Very large bundle (~70KB+)<br>❌ Mutable API (error-prone)<br>❌ Not recommended by Moment team | ❌ **AVOID** |

**Final Decision: date-fns-tz**

**Rationale:**
1. **Bundle size matters:** date-fns-tz adds only ~10-15KB when tree-shaken, vs 67KB+ for alternatives
2. **Already using date-fns:** Project likely already uses date-fns for date formatting
3. **Functional paradigm:** Immutable operations reduce bugs
4. **TypeScript-first:** Excellent type definitions out of the box
5. **Future-proof:** Active development, not deprecated

**Installation:**
```bash
npm install date-fns date-fns-tz
```

---

### 2. Core Conversion Algorithm

**Problem Statement:**
Instructor schedules assignments in their local timezone (e.g., IST), but system needs to detect conflicts when they might be in different timezones or when assignment is created in another timezone.

**Solution: Normalize to Instructor's Primary Timezone**

All time comparisons happen in the instructor's "home" timezone (from `instructor_availability.timezone`).

**Algorithm Steps:**

```typescript
/**
 * Convert a time from one timezone to another
 * @param time - HH:MM or HH:MM:SS
 * @param date - YYYY-MM-DD (required for DST)
 * @param fromTz - Source timezone (IANA format)
 * @param toTz - Target timezone (IANA format)
 * @returns Converted time as HH:MM:SS
 */
function convertToTimezone(
  time: string,
  date: string,
  fromTz: string,
  toTz: string
): string {
  // Step 1: Combine date + time into ISO string
  const dateTimeString = `${date}T${time}`;
  
  // Step 2: Parse as zoned time in source timezone
  // zonedTimeToUtc treats the string as being IN the specified timezone
  const utcDate = zonedTimeToUtc(dateTimeString, fromTz);
  
  // Step 3: Convert UTC to target timezone
  const targetDate = utcToZonedTime(utcDate, toTz);
  
  // Step 4: Format as HH:MM:SS
  return format(targetDate, 'HH:mm:ss', { timeZone: toTz });
}
```

**Example:**
```typescript
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

// Convert 10:00 AM IST to EST on Jan 15, 2026
const result = convertToTimezone(
  '10:00',
  '2026-01-15',
  'Asia/Kolkata',  // IST (UTC+5:30)
  'America/New_York' // EST (UTC-5)
);
// Result: '23:30:00' (previous day in EST)
```

**Why Date is Required:**
DST transitions happen on specific dates. Without the date:
- Cannot determine if DST is active
- Conversion may be off by 1 hour
- Example: "14:00" in March vs November in US has different UTC offsets

---

### 3. Instructor Timezone Fetching Strategy

**Database Schema:**
```sql
-- instructor_availability table
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY,
  instructor_id UUID REFERENCES profiles(id),
  timezone TEXT, -- IANA timezone (e.g., 'Asia/Kolkata')
  -- other availability fields...
);
```

**Fetching Logic:**

```typescript
/**
 * Get instructor's primary timezone from instructor_availability
 * @param instructorId - UUID of instructor
 * @returns Timezone string or null
 */
async function getInstructorTimezone(
  instructorId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('instructor_availability')
    .select('timezone')
    .eq('instructor_id', instructorId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching instructor timezone:', error);
    return null;
  }
  
  return data?.timezone || null;
}
```

**Caching Strategy:**

Since instructor timezone rarely changes, implement in-memory cache:

```typescript
class TimezoneCache {
  private cache = new Map<string, { timezone: string | null; expires: number }>();
  private TTL = 3600000; // 1 hour in milliseconds
  
  async get(instructorId: string): Promise<string | null> {
    const cached = this.cache.get(instructorId);
    if (cached && cached.expires > Date.now()) {
      return cached.timezone;
    }
    
    const timezone = await getInstructorTimezone(instructorId);
    this.cache.set(instructorId, {
      timezone,
      expires: Date.now() + this.TTL
    });
    
    return timezone;
  }
  
  invalidate(instructorId: string) {
    this.cache.delete(instructorId);
  }
}

const timezoneCache = new TimezoneCache();
```

---

### 4. Fallback Strategy

**Decision Tree:**

```
Instructor Timezone?
├─ YES (from instructor_availability)
│  └─ Use instructor's timezone
│
├─ NO (null/undefined)
│  ├─ Check user profile timezone?
│  │  ├─ YES → Use profile timezone
│  │  └─ NO → Use system default
│  │
│  └─ System Default: 'Asia/Kolkata'
```

**Implementation:**

```typescript
async function getEffectiveTimezone(instructorId: string): Promise<string> {
  const DEFAULT_TIMEZONE = 'Asia/Kolkata';
  
  // 1. Try instructor_availability
  const instructorTz = await timezoneCache.get(instructorId);
  if (instructorTz) {
    return instructorTz;
  }
  
  // 2. Try user profile (if profile has timezone field)
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', instructorId)
    .maybeSingle();
  
  if (profile?.timezone) {
    return profile.timezone;
  }
  
  // 3. Fallback to system default
  console.warn(
    `No timezone found for instructor ${instructorId}, using default: ${DEFAULT_TIMEZONE}`
  );
  return DEFAULT_TIMEZONE;
}
```

**Why 'Asia/Kolkata' as Default?**
- Primary business location (assumed from context)
- Better than UTC (respects local business hours)
- Can be configured via environment variable:

```typescript
const DEFAULT_TIMEZONE = process.env.SYSTEM_DEFAULT_TIMEZONE || 'Asia/Kolkata';
```

---

### 5. DST (Daylight Saving Time) Handling

**Challenge:**
DST transitions cause timezone offsets to change on specific dates.

**Example:**
- `America/New_York` in January: UTC-5 (EST)
- `America/New_York` in July: UTC-4 (EDT)

**How date-fns-tz Handles DST:**

✅ **Automatic:** date-fns-tz uses the IANA timezone database, which includes all DST rules.

```typescript
import { zonedTimeToUtc, format } from 'date-fns-tz';

// Winter (EST, UTC-5)
const winter = zonedTimeToUtc('2026-01-15T14:00', 'America/New_York');
format(winter, "yyyy-MM-dd HH:mm:ss 'UTC'XXX", { timeZone: 'UTC' });
// "2026-01-15 19:00:00 UTC+00:00" (14:00 EST + 5 hours)

// Summer (EDT, UTC-4)
const summer = zonedTimeToUtc('2026-07-15T14:00', 'America/New_York');
format(summer, "yyyy-MM-dd HH:mm:ss 'UTC'XXX", { timeZone: 'UTC' });
// "2026-07-15 18:00:00 UTC+00:00" (14:00 EDT + 4 hours)
```

**DST Transition Edge Case:**

During "spring forward" (2 AM → 3 AM), times like 2:30 AM don't exist.

**date-fns-tz behavior:**
- Interprets as earliest valid time (3:00 AM)
- No error thrown
- Predictable behavior

**Recommendation:** Accept default behavior. Don't try to validate/prevent these times—let the library handle it.

---

### 6. Edge Cases & Solutions

#### **A. Date Boundary Crossing**

**Problem:** Time conversion can shift the date.

**Solution:**
Always return both date and time:

```typescript
function convertToTimezoneWithDate(
  time: string,
  date: string,
  fromTz: string,
  toTz: string
): { date: string; time: string } {
  const dateTimeString = `${date}T${time}`;
  const utcDate = zonedTimeToUtc(dateTimeString, fromTz);
  const targetDate = utcToZonedTime(utcDate, toTz);
  
  return {
    date: format(targetDate, 'yyyy-MM-dd', { timeZone: toTz }),
    time: format(targetDate, 'HH:mm:ss', { timeZone: toTz })
  };
}
```

---

## 🎯 Summary for Task 2.9 (MINI Implementation)

**What to Implement:**

1. **File:** `src/features/dashboard/utils/v2/timezoneHelpers.ts`

2. **Core Functions:**
   ```typescript
   export function convertToTimezone(time, date, fromTz, toTz): string;
   export function convertToTimezoneWithDate(time, date, fromTz, toTz): { date, time };
   export async function getInstructorTimezone(instructorId): Promise<string | null>;
   export async function getEffectiveTimezone(instructorId): Promise<string>;
   export function isValidIANATimezone(tz): boolean;
   export function parseTime(time): number;
   ```

3. **Dependencies:**
   ```json
   {
     "dependencies": {
       "date-fns": "^3.0.0",
       "date-fns-tz": "^2.0.0"
     }
   }
   ```

---

### Task 2.9: Implement Timezone Helpers
- [x] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 2.8 ✓
- [ ] **Description:** Create timezone utility functions
- [ ] **Deliverable:** Timezone helper functions
- [ ] **Prompt:** "Create timezoneHelpers.ts per Task 2.8: Implement convertToTimezone(time, fromTz, toTz), getInstructorTimezone(instructorId), normalizeTimeForComparison(time, timezone). Use [library from Task 2.8]."
- [x] **Output Location:** src/features/dashboard/utils/v2/timezoneHelpers.ts
- [x] **Notes:** Implemented timezone helpers (`convertToTimezone`, `convertToTimezoneWithDate`, `normalizeTimeForComparison`, `getInstructorTimezone`, `isValidIANATimezone`, `parseTimeToMinutes`) in src/features/dashboard/utils/v2/timezoneHelpers.ts — Completed Jan 14, 2026.

---

### Task 2.10: Implement checkInstructorConflict()
- [x] **Model:** 🟢 MINI
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** Task 2.9 ✓
- [x] **Description:** Implement instructor conflict detection
- [x] **Deliverable:** Conflict checking method
- [x] **Prompt:** "Implement ValidationService.checkInstructorConflict(): 1. Fetch instructor timezone, 2. Normalize input times, 3. Query existing assignments, 4. Normalize existing times, 5. Check overlaps, 6. Return ConflictResult."
- [x] **Output Location:** src/features/dashboard/services/v2/validation.service.ts
- [x] **Notes:** Implemented `checkInstructorConflict` in src/features/dashboard/services/v2/validation.service.ts — timezone-aware overlap detection using `convertToTimezoneWithDate` and `normalizeTimeForComparison` (Completed Jan 14, 2026).

---

## 📋 Phase 3: UI Components (Week 3-4)

**Goal:** Build all UI components for desktop view

### Task 3.1: Component Design System Review ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1.5 hours
- [x] **Dependencies:** None
- [x] **Description:** Review existing components and design V2 components
- [x] **Deliverable:** UI component design system
- [x] **Prompt:** "Review existing shared components and design V2: Can we reuse Button, Modal, LoadingSpinner? CapacityIndicator design (progress bar vs circular)? ContainerCard layout? Touch target sizes? Color scheme for capacity? Animation strategy?"
- [x] **Output Location:** Comment for subsequent tasks
- [x] **Notes:** Completed Jan 14, 2026

#### 🎨 V2 Component Design System

**Component Inventory Assessment:**

**✅ Reusable Existing Components:**
1. **Button** (`src/shared/components/ui/Button.tsx`)
   - Fully implemented with variants (primary/secondary/outline), sizes (sm/md/lg), loading states
   - Color scheme: emerald-600 primary (matches V2 action color)
   - **Decision:** Reuse as-is for all V2 actions (Create, Submit, Cancel, Delete)

2. **LoadingSpinner** (`src/shared/components/ui/LoadingSpinner.tsx`)
   - Size variants (sm/md/lg), color prop support
   - **Decision:** Reuse for loading states in modals, drawers, and cards

**❌ Needs Implementation:**
3. **Modal/Dialog** (`src/shared/components/Dialog.tsx`)
   - File exists but empty
   - Existing patterns in codebase use ad-hoc backdrop + content divs
   - **Decision:** Create standardized Modal wrapper (see Modal Pattern below)

---

**🎨 Design Specifications:**

### 1. Modal Pattern
**Architecture:** Shared Modal wrapper + specific content components

```typescript
// src/shared/components/ui/Modal.tsx (NEW)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // sm=400px, md=600px, lg=800px, xl=1000px
  showCloseButton?: boolean;
}

// Design Pattern:
// - Fixed backdrop: z-[200], bg-black/40, backdrop-blur-sm
// - Content: white bg, rounded-xl, shadow-2xl, border gray-200
// - Header: px-6 py-4, border-b, title + close button
// - Body: px-6 py-4, scrollable if needed (max-h-[70vh])
// - Footer: Optional, passed as children or separate prop
// - Animations: fade-in backdrop (200ms), slide-up content (300ms) using Tailwind animate-fade-in
// - Accessibility: role="dialog", aria-modal="true", focus trap, Escape key closes
// - Backdrop click: Closes modal (configurable via closeOnBackdrop prop)
```

**Why this pattern:**
- Consistent modal behavior across V2 (vs ad-hoc patterns in V1)
- Follows existing AdminClassDrilldownModal structure (proven UX)
- Leverages Tailwind's fade-in/slide-up animations already configured
- Accessibility built-in (role, aria-modal, keyboard nav)

---

### 2. CapacityIndicator Design
**Choice:** Horizontal progress bar (NOT circular)

**Rationale:**
- Better space efficiency in compact ContainerCard layout
- Easier to scan multiple cards (vertical stacking)
- Clearer percentage visualization at small sizes
- Matches existing UI patterns (rating bars in AdminClassDrilldownModal)

**Specifications:**
```typescript
// src/features/dashboard/components/Modules/ClassesV2/components/CapacityIndicator.tsx
interface CapacityIndicatorProps {
  current: number;
  max: number;
  size?: 'sm' | 'md'; // sm: h-1.5, md: h-2
  showLabel?: boolean; // "X/Y enrolled"
}

// Color Thresholds (stepped, not gradients):
// 0-60%: emerald-500 (safe)
// 61-85%: amber-500 (warning)
// 86-100%: rose-500 (critical)

// Layout:
// <div className="w-full">
//   {showLabel && <div className="text-xs text-gray-600 mb-1">X/Y enrolled</div>}
//   <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
//     <div className={`h-full ${colorClass} transition-all duration-300`} style={{width: `${pct}%`}} />
//   </div>
// </div>

// Accessibility:
// - aria-label="Capacity: X of Y enrolled (Z% full)"
// - role="progressbar"
// - aria-valuenow={current}, aria-valuemin={0}, aria-valuemax={max}
```

**Why horizontal bar:**
- ContainerCard shows multiple indicators (capacity, assignment count) → vertical layout natural
- Progress bars familiar pattern (less cognitive load than circular)
- Responsive-friendly (scales width easily)
- Animation smoother for width transitions

---

### 3. ContainerCard Layout
**Desktop Layout (250px × 180px card):**

```
┌────────────────────────────────────┐
│ [Program Name]            [•••]    │ ← Header (p-4)
│ Instructor: [Name]                 │ ← Subtitle (text-sm)
├────────────────────────────────────┤
│ Capacity: 12/20 enrolled           │ ← Capacity section
│ ███████████░░░░░░░░ 60%           │ ← CapacityIndicator
│                                    │
│ 🕐 8 assignments                   │ ← Stats
│ 📅 Next: Jan 15, 6pm              │
└────────────────────────────────────┘

Hover State: scale-[1.02], shadow-xl (300ms transition)
Click: Opens ContainerDrawer
```

**Key Design Decisions:**
- **Card Size:** 250px width (fits 3-4 per row on 1080p desktop)
- **Touch Targets:** Menu button min 44x44px (WCAG AAA), entire card clickable
- **Hover Effects:** Subtle scale + shadow (existing pattern from Button component)
- **Color Scheme:** 
  - Background: white (dark: slate-900)
  - Border: gray-200 (dark: slate-700)
  - Primary text: gray-900 (dark: white)
  - Secondary text: gray-600 (dark: slate-400)
  - Accent: emerald-600 for capacity bar (safe state)
- **Typography:**
  - Program name: text-base font-semibold (Poppins heading)
  - Instructor: text-sm font-medium
  - Stats: text-xs (Inter body)

**Component Structure:**
```typescript
// src/features/dashboard/components/Modules/ClassesV2/components/ContainerCard.tsx
interface ContainerCardProps {
  container: Container; // From types
  onClick: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Uses:
// - CapacityIndicator for enrollment bar
// - Button (icon variant) for menu dropdown
// - Dropdown menu for Edit/Delete actions
```

---

### 4. Touch Target Sizes (WCAG 2.1 AAA Compliance)
**Standard:** Minimum 44×44px for all interactive elements

**Implementation:**
- Buttons: Already compliant (Button.tsx uses `py-2 px-4` → ~44px height in md size)
- Card menu button: `p-2.5` with `w-5 h-5` icon → 44×44px clickable area
- Close buttons (modals/drawer): `p-2.5` → 44×44px
- Entire ContainerCard: Clickable (large target, accessible)
- Dropdown items: `py-2 px-3` → min 44px height

**Mobile considerations** (Phase 7):
- Increase padding to `p-3` for 48×48px targets
- Bottom sheet instead of drawer (thumb-friendly)

---

### 5. Color Scheme for Capacity States
**Decision:** Use existing emerald primary + semantic colors

**Color Mapping:**
```typescript
const getCapacityColor = (percentage: number): string => {
  if (percentage < 61) return 'bg-emerald-500'; // Safe: matches primary brand
  if (percentage < 86) return 'bg-amber-500';   // Warning: attention needed
  return 'bg-rose-500';                          // Critical: almost/fully booked
};

// Dark mode equivalents: emerald-400, amber-400, rose-400 (lighter for contrast)
```

**Rationale:**
- Emerald-600 already primary action color (buttons, links) → consistent brand
- Amber/Rose semantic meanings universal (traffic light pattern)
- Sufficient contrast ratios for accessibility (WCAG AA compliant)
- Matches existing Tailwind config (primary/secondary scales already defined)

---

### 6. Animation Strategy
**Principle:** Subtle, purposeful animations (not decorative)

**Animation Inventory (from tailwind.config.js):**
- `fade-in`: Opacity 0→1, translate 0→-10px (200ms)
- `slide-up`: Transform translateY(10px)→0 (300ms)
- `float`: Subtle bounce (3s loop) → NOT USED in V2 (too playful)
- `pulse-slow`: Scale 1→1.05 (3s) → NOT USED (distracting)

**V2 Animation Rules:**
1. **Modal/Drawer Entry:** 
   - Backdrop: `animate-fade-in` (200ms)
   - Content: `animate-slide-up` (300ms)
   - Exit: Reverse with `transition-opacity duration-200`

2. **Card Hover:** 
   - `transition-all duration-300`
   - `hover:scale-[1.02]`
   - `hover:shadow-xl`

3. **Capacity Bar Changes:**
   - `transition-all duration-300` (smooth width/color change)

4. **Button Loading State:**
   - Existing spinner animation in Button.tsx (no change needed)

5. **NO animations for:**
   - Form inputs (immediate feedback priority)
   - Error messages (instant visibility critical)
   - Data loading (use static LoadingSpinner, not skeleton shimmers)

**Why minimal animations:**
- Accessibility: Respects `prefers-reduced-motion` (can add later)
- Performance: Fewer reflows/repaints
- Professional tone: Not a consumer app
- Faster perceived load times

---

### 7. Responsive Breakpoints (Phase 7 consideration)
**Desktop-first approach (Phase 3-6):**
- Design for 1920×1080 (most common studio/admin setup)
- Minimum viable: 1366×768
- Cards: 3 per row (1920px), 2 per row (1366px)

**Mobile adaptations (Phase 7):**
- Single column card list
- Bottom sheet instead of right drawer
- Touch targets 48×48px minimum
- Sticky headers for modals

---

### 8. Dark Mode Strategy
**Implementation:** Tailwind's `dark:` variants throughout

**Tested in existing components:**
- Button.tsx: ✅ Full dark mode support
- AdminClassDrilldownModal: ✅ Uses `dark:bg-slate-900`, `dark:text-white` patterns

**V2 Dark Mode Palette:**
```
Backgrounds: 
- Primary: dark:bg-slate-900
- Secondary: dark:bg-slate-800
- Tertiary: dark:bg-slate-700

Text:
- Primary: dark:text-white
- Secondary: dark:text-slate-400
- Tertiary: dark:text-slate-500

Borders:
- dark:border-slate-700

Capacity colors (lighter for contrast):
- dark:bg-emerald-400, dark:bg-amber-400, dark:bg-rose-400
```

---

### 📋 Implementation Checklist for Subsequent Tasks:

**Task 3.2 (ContainerCard):**
- Use CapacityIndicator (placeholder OK until 3.4)
- 250px × 180px dimensions
- Hover: scale-[1.02], shadow-xl, duration-300
- Touch targets: 44×44px menu button
- onClick prop for drawer opening

**Task 3.4 (CapacityIndicator):**
- Horizontal progress bar (h-2 default)
- Color thresholds: <61% emerald, <86% amber, ≥86% rose
- Accessibility: role="progressbar", aria-label, aria-valuenow/min/max
- Animation: transition-all duration-300

**Task 3.6 (Modal Skeletons):**
- Create shared Modal.tsx wrapper first
- Size variants: sm/md/lg/xl
- Backdrop: z-[200], bg-black/40, backdrop-blur-sm
- Animations: animate-fade-in (backdrop), animate-slide-up (content)
- Keyboard: Escape closes, focus trap

**Task 3.10 (ContainerDrawer):**
- Desktop: Slide from right (400px width)
- Mobile (Phase 7): Bottom sheet
- Backdrop: Same as Modal
- Animation: translateX(100%)→0 (300ms)
- Sticky header with close button (44×44px)

---

**Design Sign-off:** Ready for implementation (Tasks 3.2-3.10) ✅

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

### Task 3.3: CapacityIndicator Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Medium
- [x] **Estimated Time:** 45 minutes
- [x] **Dependencies:** Task 3.1 ✓
- [x] **Description:** Design capacity indicator component
- [x] **Deliverable:** CapacityIndicator specification
- [x] **Prompt:** "Design CapacityIndicator: Progress bar or circular? Color transitions (smooth or stepped)? Accessibility (ARIA labels, screen reader)? Size variants? Animation on value change?"
- [x] **Output Location:** Comment for Task 3.4
- [x] **Notes:** Design completed in Task 3.1 deliverable — horizontal progress bar (h-2 default), stepped color transitions (<61% emerald-500, <86% amber-500, ≥86% rose-500), full ARIA accessibility (role="progressbar", aria-label, aria-valuenow/min/max), size variants (sm: h-1.5, md: h-2), transition-all duration-300 animation (Completed Jan 14, 2026).

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

### Task 3.5: Modal Management Strategy ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design modal state management
- [x] **Deliverable:** Modal management architecture
- [x] **Prompt:** "Design modal management: Single modal manager or individual? State (useState vs useReducer vs Context)? Multiple modals open? Backdrop click behavior? Keyboard escape? Focus trap? Animation enter/exit?"
- [x] **Output Location:** Comment for Task 3.6
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 3.5 Deliverable: Modal Management Strategy

### 1. Overview

**Purpose:** Standardized modal management for ClassesV2 with consistent UX, accessibility, and maintainability

**Key Requirements:**
- Simple state management (avoid over-engineering)
- Accessibility-first (WCAG 2.1 AA compliance minimum)
- Smooth animations without jank
- Mobile-friendly (responsive behavior)
- Developer-friendly API (easy to add new modals)

**Design Principle:** Keep it simple. Individual modal state > complex global manager for this use case.

---

### 2. State Management Decision: Individual useState (NOT Context)

**Decision:** Each parent component manages its own modal state with `useState`

**Rationale:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Individual useState** | ✅ Simple to understand<br>✅ No prop drilling within feature<br>✅ Easy to debug<br>✅ No context re-render issues<br>✅ Colocated with usage | ⚠️ Requires passing isOpen/onClose as props<br>⚠️ Multiple state variables for multiple modals | ⭐ **RECOMMENDED** |
| **useReducer** | ✅ Single state object<br>✅ Predictable state transitions | ❌ Overkill for simple boolean state<br>❌ More boilerplate<br>❌ Harder to read for simple cases | ❌ Not needed |
| **Context API** | ✅ No prop drilling<br>✅ Global access | ❌ Unnecessary re-renders<br>❌ Over-engineering for modals<br>❌ Harder to track modal ownership<br>❌ Difficult to manage multiple modal states | ❌ Avoid |

**Why Individual useState Wins:**
- ClassesV2 modals are **always triggered from parent component** (ClassesDashboard or ContainerDrawer)
- No deep prop drilling (max 2 levels: Dashboard → Modal)
- Clear ownership: "ClassesDashboard owns CreateContainerModal state"
- React best practice: colocate state with nearest common ancestor
- Easier to test: just pass isOpen/onClose props in tests

**Example Pattern:**
```typescript
// ClassesDashboard.tsx
function ClassesDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  
  return (
    <>
      <Button onClick={() => setIsCreateModalOpen(true)}>+ Create</Button>
      
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(container) => {
          setIsCreateModalOpen(false);
          // Handle success
        }}
      />
      
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        container={selectedContainer}
        onConfirm={handleDelete}
      />
    </>
  );
}
```

---

### 3. Multiple Modals Strategy

**Decision:** Only ONE modal open at a time (strict enforcement)

**Rationale:**
- **UX:** Multiple overlapping modals confuse users (which backdrop to click?)
- **Accessibility:** Screen readers struggle with nested dialogs
- **Mobile:** Limited screen space makes stacking impractical
- **Simplicity:** Easier to manage focus trap and z-index

**Implementation:**
```typescript
// Close any open modal before opening another
const openCreateModal = () => {
  setIsDeleteModalOpen(false); // Close other modals first
  setIsEditModalOpen(false);
  setIsCreateModalOpen(true);  // Open target modal
};
```

**Edge Case Handling:**
- **Confirmation Dialogs:** If user clicks "Delete" in EditModal, close EditModal first, then open DeleteConfirmModal
- **Form Cancellation:** Warn if form has unsaved changes before closing
- **Sequential Modals:** Use onClose callback to trigger next modal if needed

**Exception (Phase 5+):** Drawer + Modal can coexist (different z-indexes, different purposes)
- Drawer: z-[100] (container details, persistent)
- Modal: z-[200] (forms, confirmations, temporary)

---

### 4. Backdrop Click Behavior

**Decision:** Backdrop click closes modal by default, but configurable

**API:**
```typescript
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnBackdropClick?: boolean; // Default: true
  closeOnEscape?: boolean;        // Default: true
}
```

**When to Disable Backdrop Close:**
1. **Forms with unsaved changes:** Prevent accidental data loss
   ```typescript
   <CreateContainerModal
     closeOnBackdropClick={hasUnsavedChanges ? false : true}
   />
   ```

2. **Critical confirmations:** Force user to click Cancel/Confirm
   ```typescript
   <DeleteConfirmModal
     closeOnBackdropClick={false} // Must click Cancel or Delete
   />
   ```

3. **Loading states:** Prevent close while async operation in progress
   ```typescript
   <CreateContainerModal
     closeOnBackdropClick={!isSubmitting}
   />
   ```

**Implementation:**
```typescript
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget && closeOnBackdropClick && !isSubmitting) {
    onClose();
  }
};

return (
  <div className="fixed inset-0 z-[200]" onClick={handleBackdropClick}>
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
    
    {/* Modal content (stop propagation) */}
    <div onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);
```

---

### 5. Keyboard Escape Handling

**Decision:** Escape key closes modal by default (unless disabled)

**Implementation:**
```typescript
useEffect(() => {
  if (!isOpen || !closeOnEscape) return;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      e.preventDefault();
      onClose();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, closeOnEscape, isSubmitting, onClose]);
```

**Priority Handling (if multiple modals exist):**
- Only the **topmost modal** (highest z-index) should respond to Escape
- Use z-index + event.stopPropagation() to prevent parent modal from closing

**Edge Cases:**
- **Form inputs:** Don't close if user is typing in textarea and hits Escape (check `e.target`)
- **Dropdown open:** Close dropdown first, modal second (requires nested escape handling)
- **Loading state:** Disable Escape during async operations

---

### 6. Focus Trap Implementation

**Decision:** Use `focus-trap-react` library (proven, accessible, 4KB gzipped)

**Why not manual implementation:**
- Complex edge cases (multiple tabbable elements, dynamic content, nested traps)
- WCAG 2.1 compliance requires proper focus management
- Tested across browsers and assistive technologies
- Handles Tab, Shift+Tab, focus return on close

**Installation:**
```bash
npm install focus-trap-react
```

**Implementation:**
```typescript
import FocusTrap from 'focus-trap-react';

function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,           // Let modal decide first focus
        allowOutsideClick: true,       // Allow backdrop click
        escapeDeactivates: false,      // We handle Escape ourselves
        returnFocusOnDeactivate: true, // Return focus to trigger button
      }}
    >
      <div className="fixed inset-0 z-[200]">
        {/* Modal content */}
      </div>
    </FocusTrap>
  );
}
```

**Focus Order:**
1. Modal opens → Focus first focusable element (usually close button or first input)
2. Tab cycles through modal elements only (button → input → submit → close → button...)
3. Modal closes → Focus returns to element that opened modal

**Accessibility Notes:**
- Add `role="dialog"` to modal container
- Add `aria-modal="true"` to prevent screen readers from accessing background
- Add `aria-labelledby` pointing to modal title ID
- Add `aria-describedby` if modal has description text

---

### 7. Animation Strategy

**Decision:** CSS-based animations (Tailwind classes), no JS animation libraries

**Entry Animation:**
```typescript
// Backdrop: fade-in (200ms)
<div className="animate-fade-in bg-black/40" />

// Content: slide-up (300ms) with slight delay
<div className="animate-slide-up animation-delay-100">
  {/* Modal content */}
</div>
```

**Exit Animation:**
Use state + setTimeout for smooth exit:
```typescript
const [isClosing, setIsClosing] = useState(false);

const handleClose = () => {
  setIsClosing(true);
  setTimeout(() => {
    setIsClosing(false);
    onClose(); // Actually close modal after animation
  }, 300); // Match animation duration
};

return (
  <div className={isClosing ? 'animate-fade-out' : 'animate-fade-in'}>
    {/* Modal */}
  </div>
);
```

**Why CSS over JS:**
- Hardware-accelerated (GPU) transforms
- Respects `prefers-reduced-motion` media query
- Simpler code (no library needed)
- Already defined in tailwind.config.js

**Tailwind Config (already exists):**
```js
// tailwind.config.js
animation: {
  'fade-in': 'fadeIn 200ms ease-out',
  'fade-out': 'fadeOut 200ms ease-in',
  'slide-up': 'slideUp 300ms ease-out',
}
```

---

### 8. Modal Component Architecture

**Shared Components:**

```
src/shared/components/ui/Modal.tsx          // Base modal wrapper
src/shared/components/ui/ModalHeader.tsx    // Reusable header with close button
src/shared/components/ui/ModalBody.tsx      // Scrollable content area
src/shared/components/ui/ModalFooter.tsx    // Action buttons
```

**Feature-Specific Modals:**

```
src/features/dashboard/components/Modules/ClassesV2/components/modals/
├── CreateContainerModal.tsx        // Uses ContainerForm
├── EditContainerModal.tsx          // Uses ContainerForm (pre-filled)
├── CreateAssignmentModal.tsx       // Uses AssignmentForm
├── EditAssignmentModal.tsx         // Uses AssignmentForm (pre-filled)
├── DeleteConfirmModal.tsx          // Simple confirmation
└── AssignStudentsModal.tsx         // Custom layout (list + search)
```

**Base Modal API:**
```typescript
// src/shared/components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';     // sm=400px, md=600px, lg=800px, xl=1000px
  closeOnBackdropClick?: boolean;       // Default: true
  closeOnEscape?: boolean;              // Default: true
  showCloseButton?: boolean;            // Default: true
  footer?: React.ReactNode;             // Optional custom footer
  isSubmitting?: boolean;               // Disable close during submit
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  isSubmitting = false,
}: ModalProps) {
  // Implementation with FocusTrap, animations, keyboard handling
}
```

**Feature Modal Example:**
```typescript
// CreateContainerModal.tsx
interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (container: Container) => void;
}

export function CreateContainerModal({ isOpen, onClose, onSuccess }: CreateContainerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: CreateContainerInput) => {
    setIsSubmitting(true);
    try {
      const result = await ContainerService.createContainer(data);
      onSuccess(result.data);
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Container"
      size="lg"
      isSubmitting={isSubmitting}
      closeOnBackdropClick={!isSubmitting}
    >
      <ContainerForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}
```

---

### 9. Mobile Considerations

**Responsive Behavior:**
- **Desktop (≥768px):** Modal centered, max-width based on size prop
- **Mobile (<768px):** Modal full-width, slide up from bottom

**Implementation:**
```typescript
<div className={`
  fixed inset-x-0 
  md:inset-x-auto md:left-1/2 md:-translate-x-1/2
  bottom-0 md:top-1/2 md:-translate-y-1/2
  ${getSizeClass(size)}
  bg-white dark:bg-slate-900 
  rounded-t-2xl md:rounded-xl
  shadow-2xl
`}>
```

**Mobile-Specific Features:**
- Drag-to-close handle (Phase 7)
- Snap-to-top on scroll (avoid keyboard overlap)
- Touch-friendly close button (48×48px)

---

### 10. Error Handling & Loading States

**Principles:**
- Show loading spinner in modal footer during async operations
- Disable backdrop/escape close during submit
- Keep modal open on error (display error inline)

**Implementation:**
```typescript
<Modal isOpen={isOpen} onClose={onClose} isSubmitting={isSubmitting}>
  <ContainerForm onSubmit={handleSubmit} />
  
  {error && (
    <div className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400">
      {error.message}
    </div>
  )}
  
  <ModalFooter>
    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
      Create Container
    </Button>
  </ModalFooter>
</Modal>
```

---

### 11. Testing Strategy

**Unit Tests (Jest + React Testing Library):**
```typescript
describe('Modal', () => {
  it('should open and close', () => {
    const onClose = jest.fn();
    const { rerender } = render(<Modal isOpen={false} onClose={onClose} title="Test" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    rerender(<Modal isOpen={true} onClose={onClose} title="Test" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  
  it('should close on Escape key', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  
  it('should trap focus inside modal', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test">
      <input data-testid="input1" />
      <button data-testid="button1">Submit</button>
    </Modal>);
    
    const input = screen.getByTestId('input1');
    const button = screen.getByTestId('button1');
    
    input.focus();
    userEvent.tab(); // Should focus button
    expect(button).toHaveFocus();
    
    userEvent.tab(); // Should wrap to close button
    expect(screen.getByLabelText('Close')).toHaveFocus();
  });
  
  it('should not close on backdrop click when disabled', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} closeOnBackdropClick={false} title="Test" />);
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

---

## 🎯 Summary for Task 3.6 (Implementation)

**What to Implement:**

1. **Shared Components** (create first):
   - `src/shared/components/ui/Modal.tsx` (base wrapper with FocusTrap, keyboard, animations)
   - `src/shared/components/ui/ModalHeader.tsx` (title + close button)
   - `src/shared/components/ui/ModalFooter.tsx` (Cancel/Submit buttons)

2. **Feature Modals** (skeletons with placeholder forms):
   - `CreateContainerModal.tsx` (isOpen, onClose, onSuccess props)
   - `EditContainerModal.tsx` (+ container prop)
   - `CreateAssignmentModal.tsx` (+ containerId prop)
   - `DeleteConfirmModal.tsx` (+ container prop, onConfirm)

3. **Dependencies to Install:**
   ```bash
   npm install focus-trap-react
   ```

4. **Usage Pattern in ClassesDashboard:**
   ```typescript
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   
   <CreateContainerModal
     isOpen={isCreateModalOpen}
     onClose={() => setIsCreateModalOpen(false)}
     onSuccess={(container) => {
       setIsCreateModalOpen(false);
       showNotification('Container created successfully');
     }}
   />
   ```

5. **Design Decisions to Follow:**
   - Individual useState (no Context)
   - One modal at a time
   - Backdrop click closes (configurable)
   - Escape closes (configurable)
   - FocusTrap for accessibility
   - CSS animations (Tailwind classes)
   - Mobile: full-width, slide up from bottom

**File Locations:**
- Base: `src/shared/components/ui/Modal.tsx`
- Feature: `src/features/dashboard/components/Modules/ClassesV2/components/modals/`

---

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

### Task 3.7: Container Form Logic Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1.5 hours
- [x] **Dependencies:** None
- [x] **Description:** Design container form logic
- [x] **Deliverable:** Form design specification
- [x] **Prompt:** "Design ContainerForm logic: Form state management (controlled vs uncontrolled)? Package selection dropdown population. Instructor selection (optional handling). Capacity field (when to disable). Display name (auto-generate or manual). Validation timing. Error display."
- [x] **Output Location:** Comment for Task 3.8
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 3.7 Deliverable: Container Form Logic Design

### 1. Overview

**Purpose:** Design a reusable, accessible form component for creating/editing containers with smart defaults and comprehensive validation

**Key Requirements:**
- Support both Create and Edit modes (single component)
- Auto-populate fields from package selection
- Optional instructor assignment
- Conditional capacity handling (individual vs group programs)
- Auto-generate display name with manual override
- Real-time validation with clear error messages
- Accessible form controls (labels, ARIA, error announcements)

**Design Principles:**
- Controlled components (React state manages all inputs)
- Progressive disclosure (show advanced options only when needed)
- Fail-fast validation (immediate feedback on blur)
- Optimistic UX (pre-fill smart defaults)

---

### 2. Form State Management: Controlled Components

**Decision:** Fully controlled form with React state (NOT uncontrolled refs)

**Rationale:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Controlled (useState)** | ✅ Single source of truth<br>✅ Easy validation<br>✅ Conditional logic simple<br>✅ Can populate from props<br>✅ Predictable behavior | ⚠️ More code<br>⚠️ Re-renders on each keystroke | ⭐ **RECOMMENDED** |
| **Uncontrolled (refs)** | ✅ Less code<br>✅ Better performance | ❌ Harder to validate<br>❌ Can't conditionally disable/populate<br>❌ Harder to test<br>❌ No real-time updates | ❌ Avoid |
| **Form Library (React Hook Form)** | ✅ Less boilerplate<br>✅ Built-in validation | ❌ Additional dependency<br>❌ Learning curve<br>❌ Overkill for simple forms | 🟡 Future consideration |

**Why Controlled Wins:**
- Need to auto-populate capacity from package selection → requires state access
- Need to conditionally disable capacity for individual programs → requires state
- Need to auto-generate display name from instructor + package → requires state
- Validation logic needs current values → easier with state
- Edit mode needs to pre-fill values → controlled components handle this naturally

**State Structure:**
```typescript
interface ContainerFormState {
  package_id: string;
  instructor_id: string | null;
  capacity_total: number | null;
  display_name: string;
  start_date: string;
  end_date: string;
  timezone: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  
  // UI-only state
  isAutoGeneratingName: boolean;
  packageDetails: Package | null;
  instructorDetails: Instructor | null;
}

interface FormErrors {
  package_id?: string;
  instructor_id?: string;
  capacity_total?: string;
  display_name?: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  _form?: string; // General form error
}
```

**Implementation Pattern:**
```typescript
function ContainerForm({ 
  container, // undefined for create, populated for edit
  onSubmit, 
  onCancel 
}: ContainerFormProps) {
  const [formData, setFormData] = useState<ContainerFormState>(() => ({
    package_id: container?.package_id || '',
    instructor_id: container?.instructor_id || null,
    capacity_total: container?.capacity_total || null,
    display_name: container?.display_name || '',
    start_date: container?.start_date || '',
    end_date: container?.end_date || '',
    timezone: container?.timezone || 'Asia/Kolkata',
    status: container?.status || 'draft',
    isAutoGeneratingName: !container?.display_name, // Auto mode if no existing name
    packageDetails: null,
    instructorDetails: null,
  }));
  
  const [errors, setErrors] = useState<FormErrors>({});
  
  const updateField = <K extends keyof ContainerFormState>(
    field: K, 
    value: ContainerFormState[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

### 3. Package Selection Dropdown

**Data Source:** `usePackages()` hook (already exists from architecture docs)

**Population Strategy:**

```typescript
const { data: packages, isLoading } = usePackages({
  status: 'active', // Only show active packages
  orderBy: 'name',
});

// Filter packages by type for better UX (optional)
const groupedPackages = useMemo(() => {
  if (!packages) return { individual: [], group: [], crash: [] };
  return {
    individual: packages.filter(p => p.type === 'individual'),
    group: packages.filter(p => p.type === 'group'),
    crash: packages.filter(p => p.type === 'crash_course'),
  };
}, [packages]);
```

**Dropdown Component:**
```typescript
<div>
  <label htmlFor="package_id" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
    Package <span className="text-rose-500">*</span>
  </label>
  
  <select
    id="package_id"
    value={formData.package_id}
    onChange={(e) => handlePackageChange(e.target.value)}
    className={`w-full rounded-md border ${errors.package_id ? 'border-rose-500' : 'border-gray-300'} px-3 py-2 text-sm`}
    disabled={isLoading || !!container} // Disable in edit mode (can't change package)
    aria-invalid={!!errors.package_id}
    aria-describedby={errors.package_id ? 'package-error' : undefined}
  >
    <option value="">Select a package...</option>
    
    {groupedPackages.individual.length > 0 && (
      <optgroup label="Individual Programs">
        {groupedPackages.individual.map(pkg => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.name} ({pkg.class_count} classes)
          </option>
        ))}
      </optgroup>
    )}
    
    {groupedPackages.group.length > 0 && (
      <optgroup label="Group Programs">
        {groupedPackages.group.map(pkg => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.name} ({pkg.class_count} classes, {pkg.capacity_default} max)
          </option>
        ))}
      </optgroup>
    )}
    
    {groupedPackages.crash.length > 0 && (
      <optgroup label="Crash Courses">
        {groupedPackages.crash.map(pkg => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.name} ({pkg.duration}, {pkg.class_count} classes)
          </option>
        ))}
      </optgroup>
    )}
  </select>
  
  {errors.package_id && (
    <p id="package-error" className="mt-1 text-xs text-rose-600" role="alert">
      {errors.package_id}
    </p>
  )}
</div>
```

**Package Change Handler (Key Logic):**
```typescript
const handlePackageChange = async (packageId: string) => {
  updateField('package_id', packageId);
  
  if (!packageId) {
    updateField('packageDetails', null);
    updateField('capacity_total', null);
    return;
  }
  
  // Fetch full package details
  const pkg = packages?.find(p => p.id === packageId);
  if (!pkg) return;
  
  updateField('packageDetails', pkg);
  
  // Auto-populate capacity from package default (if group program)
  if (pkg.type === 'group' || pkg.type === 'crash_course') {
    updateField('capacity_total', pkg.capacity_default || null);
  } else {
    // Individual program: NULL capacity
    updateField('capacity_total', null);
  }
  
  // Auto-generate display name if in auto mode
  if (formData.isAutoGeneratingName) {
    updateField('display_name', generateDisplayName(pkg, formData.instructorDetails));
  }
  
  // Set duration-based dates for crash courses (optional)
  if (pkg.type === 'crash_course' && pkg.duration) {
    const startDate = formData.start_date || new Date().toISOString().split('T')[0];
    const endDate = calculateEndDate(startDate, pkg.duration);
    updateField('start_date', startDate);
    updateField('end_date', endDate);
  }
};
```

---

### 4. Instructor Selection (Optional Handling)

**Design Decision:** Instructor is **optional** at program level (can assign per-class)

**Dropdown Component:**
```typescript
const { data: instructors, isLoading: loadingInstructors } = useInstructors({ status: 'active' });

<div>
  <label htmlFor="instructor_id" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
    Instructor <span className="text-gray-400">(optional)</span>
  </label>
  
  <select
    id="instructor_id"
    value={formData.instructor_id || ''}
    onChange={(e) => handleInstructorChange(e.target.value || null)}
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
    disabled={loadingInstructors}
  >
    <option value="">Unassigned (assign per class later)</option>
    {instructors?.map(instructor => (
      <option key={instructor.id} value={instructor.id}>
        {instructor.name}
      </option>
    ))}
  </select>
  
  {formData.instructor_id === null && (
    <p className="mt-1 text-xs text-amber-600">
      ℹ️ You'll need to assign an instructor for each class individually
    </p>
  )}
</div>
```

**Instructor Change Handler:**
```typescript
const handleInstructorChange = async (instructorId: string | null) => {
  updateField('instructor_id', instructorId);
  
  if (!instructorId) {
    updateField('instructorDetails', null);
    updateField('timezone', 'Asia/Kolkata'); // Reset to system default
    if (formData.isAutoGeneratingName) {
      updateField('display_name', generateDisplayName(formData.packageDetails, null));
    }
    return;
  }
  
  // Fetch instructor details (for timezone and name)
  const instructor = instructors?.find(i => i.id === instructorId);
  if (!instructor) return;
  
  updateField('instructorDetails', instructor);
  
  // Update timezone from instructor's availability
  const timezone = await getInstructorTimezone(instructorId);
  if (timezone) {
    updateField('timezone', timezone);
  }
  
  // Auto-generate display name
  if (formData.isAutoGeneratingName) {
    updateField('display_name', generateDisplayName(formData.packageDetails, instructor));
  }
};
```

---

### 5. Capacity Field Logic (Conditional Disable)

**Rules:**
- **Individual Programs:** Capacity = NULL (disabled, not shown or grayed out)
- **Group Programs:** Capacity required, default from package
- **Crash Courses:** Capacity required, typically 10-30

**Implementation:**
```typescript
const isCapacityDisabled = formData.packageDetails?.type === 'individual';
const isCapacityRequired = !isCapacityDisabled;

<div>
  <label htmlFor="capacity_total" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
    Capacity {isCapacityRequired && <span className="text-rose-500">*</span>}
  </label>
  
  {isCapacityDisabled ? (
    <div className="w-full rounded-md border border-gray-200 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm text-gray-500">
      N/A (Individual Program)
    </div>
  ) : (
    <>
      <input
        id="capacity_total"
        type="number"
        min="1"
        max="100"
        value={formData.capacity_total || ''}
        onChange={(e) => updateField('capacity_total', e.target.value ? parseInt(e.target.value) : null)}
        onBlur={() => validateCapacity()}
        className={`w-full rounded-md border ${errors.capacity_total ? 'border-rose-500' : 'border-gray-300'} px-3 py-2 text-sm`}
        placeholder="Max students"
        aria-invalid={!!errors.capacity_total}
        aria-describedby={errors.capacity_total ? 'capacity-error' : undefined}
      />
      
      {errors.capacity_total && (
        <p id="capacity-error" className="mt-1 text-xs text-rose-600" role="alert">
          {errors.capacity_total}
        </p>
      )}
      
      {formData.packageDetails?.capacity_default && (
        <p className="mt-1 text-xs text-gray-500">
          Recommended: {formData.packageDetails.capacity_default} students
        </p>
      )}
    </>
  )}
</div>
```

**Capacity Validation:**
```typescript
const validateCapacity = () => {
  if (!formData.packageDetails) return;
  
  const errors: string[] = [];
  
  if (formData.packageDetails.type !== 'individual') {
    if (!formData.capacity_total || formData.capacity_total < 1) {
      errors.push('Capacity is required for group programs');
    }
    
    if (formData.capacity_total && formData.capacity_total > 100) {
      errors.push('Capacity cannot exceed 100 students');
    }
    
    // Crash course specific validation
    if (formData.packageDetails.type === 'crash_course') {
      if (formData.capacity_total && formData.capacity_total < 10) {
        errors.push('Crash courses typically have 10+ students');
      }
    }
  }
  
  setErrors(prev => ({ ...prev, capacity_total: errors[0] }));
};
```

---

### 6. Display Name Logic (Auto-Generate vs Manual)

**Strategy:** Auto-generate by default, allow manual override with toggle

**Auto-Generation Rules:**
```typescript
function generateDisplayName(pkg: Package | null, instructor: Instructor | null): string {
  if (!pkg) return '';
  
  // Format: "{Package Name} - {Instructor Name or 'Unassigned'}"
  const instructorPart = instructor ? instructor.name : 'Unassigned';
  return `${pkg.name} - ${instructorPart}`;
}

// Examples:
// "Yoga Beginners 8-Class - John Doe"
// "Power Yoga Group - Unassigned"
// "4-Week Crash Course - Sarah Smith"
```

**UI Component:**
```typescript
<div>
  <div className="flex items-center justify-between mb-1">
    <label htmlFor="display_name" className="block text-xs font-medium text-gray-700 dark:text-slate-300">
      Display Name <span className="text-rose-500">*</span>
    </label>
    
    <button
      type="button"
      onClick={() => {
        const newAutoMode = !formData.isAutoGeneratingName;
        updateField('isAutoGeneratingName', newAutoMode);
        if (newAutoMode) {
          // Re-generate name when switching to auto mode
          updateField('display_name', generateDisplayName(formData.packageDetails, formData.instructorDetails));
        }
      }}
      className="text-xs text-emerald-600 hover:text-emerald-700"
    >
      {formData.isAutoGeneratingName ? '✓ Auto' : 'Enable Auto'}
    </button>
  </div>
  
  <input
    id="display_name"
    type="text"
    value={formData.display_name}
    onChange={(e) => {
      updateField('display_name', e.target.value);
      // Switching to manual mode when user types
      if (formData.isAutoGeneratingName) {
        updateField('isAutoGeneratingName', false);
      }
    }}
    onBlur={() => validateDisplayName()}
    className={`w-full rounded-md border ${errors.display_name ? 'border-rose-500' : 'border-gray-300'} px-3 py-2 text-sm ${formData.isAutoGeneratingName ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    placeholder="e.g., Yoga Beginners - John Doe"
    maxLength={100}
    aria-invalid={!!errors.display_name}
    aria-describedby={errors.display_name ? 'displayname-error' : 'displayname-hint'}
  />
  
  {formData.isAutoGeneratingName && (
    <p id="displayname-hint" className="mt-1 text-xs text-blue-600">
      Auto-generated from package and instructor. Click "Enable Auto" to customize.
    </p>
  )}
  
  {errors.display_name && (
    <p id="displayname-error" className="mt-1 text-xs text-rose-600" role="alert">
      {errors.display_name}
    </p>
  )}
</div>
```

**Display Name Validation:**
```typescript
const validateDisplayName = () => {
  const errors: string[] = [];
  
  if (!formData.display_name.trim()) {
    errors.push('Display name is required');
  }
  
  if (formData.display_name.length > 100) {
    errors.push('Display name must be 100 characters or less');
  }
  
  setErrors(prev => ({ ...prev, display_name: errors[0] }));
};
```

---

### 7. Validation Timing Strategy

**Multi-Layer Validation:**

| Event | Validation Type | When | Why |
|-------|----------------|------|-----|
| **onChange** | None (clear errors only) | Every keystroke | Don't interrupt user mid-typing |
| **onBlur** | Field-specific sync validation | User leaves field | Immediate feedback without being annoying |
| **onSubmit** | Full form validation (sync + async) | Form submission | Final check before API call |
| **Real-time** | Async conflict checks (debounced) | 500ms after typing stops | Check instructor availability |

**Implementation:**

```typescript
// 1. Clear error on change
const updateField = <K extends keyof ContainerFormState>(field: K, value: ContainerFormState[K]) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (errors[field as keyof FormErrors]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }
};

// 2. Validate on blur
<input
  value={formData.display_name}
  onChange={(e) => updateField('display_name', e.target.value)}
  onBlur={() => validateDisplayName()} // Triggered when focus leaves
/>

// 3. Full validation on submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Step 1: Client-side sync validation
  const syncErrors = validateForm(formData);
  if (Object.keys(syncErrors).length > 0) {
    setErrors(syncErrors);
    // Focus first error field
    const firstErrorField = Object.keys(syncErrors)[0];
    document.getElementById(firstErrorField)?.focus();
    return;
  }
  
  // Step 2: Service-side async validation (pre-flight)
  try {
    const asyncResult = await ValidationService.validateContainerCreationAsync(formData);
    if (!asyncResult.isValid) {
      setErrors({ _form: asyncResult.errors.join(', ') });
      return;
    }
  } catch (err) {
    setErrors({ _form: 'Validation failed. Please try again.' });
    return;
  }
  
  // Step 3: Submit to API
  try {
    const result = await ContainerService.createContainer(formData);
    onSubmit(result.data);
  } catch (err: any) {
    setErrors({ _form: err.message || 'Failed to create container' });
  }
};

// Sync validation function
function validateForm(data: ContainerFormState): FormErrors {
  const errors: FormErrors = {};
  
  if (!data.package_id) errors.package_id = 'Package is required';
  if (!data.display_name.trim()) errors.display_name = 'Display name is required';
  
  if (data.packageDetails?.type !== 'individual') {
    if (!data.capacity_total || data.capacity_total < 1) {
      errors.capacity_total = 'Capacity is required for group programs';
    }
  }
  
  if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
    errors.end_date = 'End date must be after start date';
  }
  
  return errors;
}
```

---

### 8. Error Display Strategy

**Design Principles:**
- **Inline errors:** Show below each field (red text, icon)
- **Form-level errors:** Show at top (e.g., network errors, general failures)
- **Accessible:** Use `aria-invalid`, `aria-describedby`, `role="alert"`
- **Dismissible:** Clear errors when user interacts with field

**Inline Field Error:**
```typescript
{errors.package_id && (
  <div className="flex items-start gap-1 mt-1" role="alert">
    <svg className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
    <p className="text-xs text-rose-600">{errors.package_id}</p>
  </div>
)}
```

**Form-Level Error (Top of Form):**
```typescript
{errors._form && (
  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md" role="alert">
    <div className="flex items-start gap-2">
      <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-rose-800 dark:text-rose-400">Error</h4>
        <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">{errors._form}</p>
      </div>
      <button
        type="button"
        onClick={() => setErrors(prev => ({ ...prev, _form: undefined }))}
        className="text-rose-500 hover:text-rose-700"
        aria-label="Dismiss error"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
)}
```

**Success Message (Optional):**
```typescript
{successMessage && (
  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md" role="status">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
    </div>
  </div>
)}
```

---

### 9. Form Layout & Accessibility

**Complete Form Structure:**

```typescript
<form onSubmit={handleSubmit} noValidate className="space-y-4">
  {/* Form-level error */}
  {errors._form && <FormError message={errors._form} onDismiss={() => setErrors(prev => ({ ...prev, _form: undefined }))} />}
  
  {/* Package Selection */}
  <FormField
    label="Package"
    required
    error={errors.package_id}
    htmlFor="package_id"
  >
    <select id="package_id" {...packageProps} />
  </FormField>
  
  {/* Instructor Selection */}
  <FormField
    label="Instructor"
    optional
    error={errors.instructor_id}
    htmlFor="instructor_id"
  >
    <select id="instructor_id" {...instructorProps} />
  </FormField>
  
  {/* Capacity */}
  {!isCapacityDisabled && (
    <FormField
      label="Capacity"
      required={isCapacityRequired}
      error={errors.capacity_total}
      htmlFor="capacity_total"
      hint={formData.packageDetails?.capacity_default ? `Recommended: ${formData.packageDetails.capacity_default}` : undefined}
    >
      <input id="capacity_total" type="number" {...capacityProps} />
    </FormField>
  )}
  
  {/* Display Name */}
  <FormField
    label="Display Name"
    required
    error={errors.display_name}
    htmlFor="display_name"
    hint={formData.isAutoGeneratingName ? 'Auto-generated from package and instructor' : undefined}
  >
    <input id="display_name" {...displayNameProps} />
  </FormField>
  
  {/* Start/End Dates (2-column grid) */}
  <div className="grid grid-cols-2 gap-4">
    <FormField label="Start Date" error={errors.start_date} htmlFor="start_date">
      <input id="start_date" type="date" {...startDateProps} />
    </FormField>
    
    <FormField label="End Date" error={errors.end_date} htmlFor="end_date">
      <input id="end_date" type="date" {...endDateProps} />
    </FormField>
  </div>
  
  {/* Timezone */}
  <FormField label="Timezone" required error={errors.timezone} htmlFor="timezone">
    <select id="timezone" {...timezoneProps}>
      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
      <option value="America/New_York">America/New_York (EST)</option>
      {/* More timezones */}
    </select>
  </FormField>
  
  {/* Status (Edit mode only) */}
  {container && (
    <FormField label="Status" required htmlFor="status">
      <select id="status" {...statusProps}>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </FormField>
  )}
  
  {/* Form Actions */}
  <div className="flex justify-end gap-3 pt-4">
    <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-4 py-2 rounded-md border border-gray-300 text-sm">
      Cancel
    </button>
    <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm">
      {isSubmitting ? 'Saving...' : container ? 'Save Changes' : 'Create Container'}
    </button>
  </div>
</form>
```

**Reusable FormField Component:**
```typescript
interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, required, optional, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
        {label} 
        {required && <span className="text-rose-500 ml-0.5">*</span>}
        {optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
      </label>
      
      {children}
      
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      
      {error && (
        <div className="flex items-start gap-1 mt-1" role="alert">
          <svg className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-rose-600">{error}</p>
        </div>
      )}
    </div>
  );
}
```

---

### 10. Edit Mode vs Create Mode

**Single Component Strategy:** Use same `ContainerForm` for both create and edit

**Differentiation:**
```typescript
interface ContainerFormProps {
  container?: Container; // undefined = create mode, populated = edit mode
  onSubmit: (data: Container) => void;
  onCancel: () => void;
}

const isEditMode = !!container;

// Edit mode differences:
// 1. Package dropdown disabled (can't change package once created)
// 2. Pre-fill all fields from container prop
// 3. Show "Status" field (not shown in create mode)
// 4. Submit button text: "Save Changes" vs "Create Container"
// 5. Don't auto-generate display name (preserve existing)
```

---

## 🎯 Summary for Task 3.8 (Implementation)

**Component to Implement:** `ContainerForm.tsx`

**Props Interface:**
```typescript
interface ContainerFormProps {
  container?: Container;           // undefined = create, populated = edit
  onSubmit: (data: Container) => void;
  onCancel: () => void;
  isSubmitting?: boolean;          // External loading state
}
```

**State Management:**
- Controlled components with `useState`
- Separate `formData` and `errors` state objects
- Real-time error clearing on field change
- Validation on blur and submit

**Key Features to Implement:**
1. **Package dropdown** with optgroups, auto-populate capacity
2. **Instructor dropdown** with "Unassigned" option, fetch timezone
3. **Capacity field** conditionally disabled for individual programs
4. **Display name** with auto-generate toggle
5. **Date fields** with start < end validation
6. **Timezone dropdown** populated from instructor or default
7. **Status dropdown** (edit mode only)
8. **Inline error messages** with ARIA attributes
9. **Form-level error** display at top
10. **Submit handler** with 3-layer validation (sync → async → API)

**Dependencies:**
- `usePackages()` hook
- `useInstructors()` hook
- `ValidationService.validateContainerCreationAsync()`
- `ContainerService.createContainer()` / `updateContainer()`
- `getInstructorTimezone()` helper

**File Location:** `src/features/dashboard/components/Modules/ClassesV2/forms/ContainerForm.tsx`

---

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

### Task 3.9: Drawer Component Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design drawer slide-out component
- [x] **Deliverable:** Drawer specification
- [x] **Prompt:** "Design ContainerDrawer: Slide from right (desktop) vs bottom sheet (mobile)? Animation library or CSS? Backdrop behavior? Scroll handling? Width on desktop? Keyboard navigation (Tab trap)? Close on route change?"
- [x] **Output Location:** Comment for Task 3.10
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 3.9 Deliverable: Drawer Component Design

### 1. Overview

**Purpose:** Design a slide-out drawer for displaying container details, assignments, and enrolled students with desktop/mobile responsive patterns

**Key Requirements:**
- Desktop: Slide from right (persistent side panel)
- Mobile: Bottom sheet (thumb-friendly)
- Smooth animations without jank
- Accessible keyboard navigation and focus management
- Scroll handling for long content
- Coexist with modals (different z-indexes)

**Design Principle:** Drawer is for **browsing/viewing** (persistent context), Modal is for **actions/forms** (temporary, focused task)

---

### 2. Desktop vs Mobile Behavior

**Decision:** Adaptive component that changes layout based on viewport

| Aspect | Desktop (≥768px) | Mobile (<768px) | Rationale |
|--------|------------------|-----------------|-----------|
| **Direction** | Slide from right | Slide from bottom | Desktop: natural reading direction; Mobile: thumb reach zone |
| **Width/Height** | 400-500px fixed width | Full width, 60-90vh height | Desktop: don't cover entire screen; Mobile: maximize content |
| **Backdrop** | Semi-transparent (bg-black/30) | Semi-transparent (bg-black/40) | Both allow context awareness |
| **Drag to close** | No (desktop mouse paradigm) | Yes (mobile gesture paradigm) | Mobile: natural swipe-down gesture |
| **Snap points** | N/A | Half-height (40vh), Full-height (90vh) | Mobile: progressive disclosure |
| **Close button** | Top-right (44×44px) | Top-center drag handle + X button | Mobile: both gesture and explicit button |

**Implementation Strategy:**
```typescript
const { isMobile } = useMobileDetect();

return (
  <div className={`fixed inset-0 z-[100] ${isOpen ? '' : 'pointer-events-none'}`}>
    {/* Backdrop */}
    <div className={`absolute inset-0 bg-black/30 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
    
    {/* Drawer */}
    <div className={`
      absolute bg-white dark:bg-slate-900 shadow-2xl
      ${isMobile 
        ? 'inset-x-0 bottom-0 rounded-t-2xl' // Mobile: bottom sheet
        : 'top-0 right-0 bottom-0 w-[400px]'  // Desktop: right panel
      }
      transform transition-transform duration-300
      ${isOpen 
        ? 'translate-x-0 translate-y-0' 
        : isMobile ? 'translate-y-full' : 'translate-x-full'
      }
    `}>
      {/* Content */}
    </div>
  </div>
);
```

---

### 3. Animation Strategy: CSS-Only (No Library)

**Decision:** Pure CSS transitions with Tailwind classes (consistent with Modal approach)

**Rationale:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **CSS Transitions** | ✅ Simple<br>✅ Hardware-accelerated<br>✅ No dependencies<br>✅ Tailwind utilities | ⚠️ No spring physics<br>⚠️ Manual timing | ⭐ **RECOMMENDED** |
| **Framer Motion** | ✅ Spring animations<br>✅ Drag gestures built-in<br>✅ Rich API | ❌ 50KB+ bundle<br>❌ Overkill for simple slide<br>❌ Learning curve | 🟡 Phase 7 (if needed) |
| **React Spring** | ✅ Physics-based<br>✅ Performant | ❌ 30KB bundle<br>❌ Complex API<br>❌ Not needed for simple slide | ❌ Avoid |

**Animation Timings:**
```typescript
// Entry (opening)
const entryDuration = 300; // ms
const entryEasing = 'ease-out'; // Natural acceleration

// Exit (closing)
const exitDuration = 250; // ms (slightly faster)
const exitEasing = 'ease-in'; // Natural deceleration

// Backdrop
const backdropDuration = 200; // ms (fade faster than slide)
```

**CSS Classes:**
```css
/* Desktop: Slide from right */
.drawer-enter-desktop {
  transform: translateX(100%);
}
.drawer-enter-active-desktop {
  transform: translateX(0);
  transition: transform 300ms ease-out;
}
.drawer-exit-desktop {
  transform: translateX(0);
}
.drawer-exit-active-desktop {
  transform: translateX(100%);
  transition: transform 250ms ease-in;
}

/* Mobile: Slide from bottom */
.drawer-enter-mobile {
  transform: translateY(100%);
}
.drawer-enter-active-mobile {
  transform: translateY(0);
  transition: transform 300ms ease-out;
}
.drawer-exit-mobile {
  transform: translateY(0);
}
.drawer-exit-active-mobile {
  transform: translateY(100%);
  transition: transform 250ms ease-in;
}
```

**Tailwind Implementation:**
```typescript
const slideClass = isOpen 
  ? 'translate-x-0 translate-y-0' 
  : isMobile ? 'translate-y-full' : 'translate-x-full';

<div className={`transform transition-transform duration-300 ${slideClass}`}>
```

---

### 4. Backdrop Behavior

**Decision:** Same pattern as Modal (configurable close-on-click)

**Default Behavior:**
- Backdrop click closes drawer (closeOnBackdrop=true by default)
- Backdrop visible to indicate drawer is "on top" of main content
- Slightly lighter than modal backdrop (30% vs 40% opacity) → drawer is less "blocking" than modal

**Configuration:**
```typescript
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnBackdropClick?: boolean; // Default: true
  closeOnEscape?: boolean;        // Default: true
}

// Disable backdrop close when form has unsaved changes
<Drawer
  isOpen={isDrawerOpen}
  onClose={handleClose}
  closeOnBackdropClick={!hasUnsavedChanges}
/>
```

**Implementation:**
```typescript
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget && closeOnBackdropClick) {
    onClose();
  }
};

return (
  <div onClick={handleBackdropClick}>
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    <div onClick={(e) => e.stopPropagation()}>
      {/* Drawer content */}
    </div>
  </div>
);
```

---

### 5. Scroll Handling

**Challenge:** Drawer content may be long (many assignments, enrolled students list)

**Strategy: Segmented Scrolling**

**Desktop Layout (400px width):**
```
┌─────────────────────────────┐
│ Header (fixed)              │ ← Sticky, always visible
│ [Container Name]       [×]  │
├─────────────────────────────┤
│                             │
│ Details Section (static)    │ ← Always visible (120px)
│ - Instructor: John          │
│ - Capacity: 12/20           │
│ - Status: Active            │
│                             │
├─────────────────────────────┤
│                             │
│ Assignments (scrollable)    │ ← Scroll independently
│ ├ Jan 15, 6pm              │    (max-h-[40vh])
│ ├ Jan 18, 6pm              │
│ ├ Jan 22, 6pm              │
│ └ ...                       │
│                             │
├─────────────────────────────┤
│                             │
│ Students (scrollable)       │ ← Scroll independently
│ ├ Sarah Smith              │    (max-h-[30vh])
│ ├ Mike Johnson             │
│ └ ...                       │
│                             │
├─────────────────────────────┤
│ Footer (fixed)              │ ← Sticky actions
│ [Edit] [Assign Students]    │
└─────────────────────────────┘
```

**Implementation:**
```typescript
<div className="flex flex-col h-full">
  {/* Header - Fixed */}
  <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
    <h2 className="text-lg font-semibold">{container.display_name}</h2>
    <button onClick={onClose} className="absolute top-4 right-4 p-2">×</button>
  </header>
  
  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto">
    {/* Details - Always visible, no scroll */}
    <section className="p-4 border-b">
      <h3>Details</h3>
      {/* ... */}
    </section>
    
    {/* Assignments - Scroll within section */}
    <section className="p-4 border-b">
      <h3>Assignments</h3>
      <div className="max-h-[40vh] overflow-y-auto">
        {assignments.map(a => <AssignmentItem key={a.id} assignment={a} />)}
      </div>
    </section>
    
    {/* Students - Scroll within section */}
    <section className="p-4">
      <h3>Enrolled Students</h3>
      <div className="max-h-[30vh] overflow-y-auto">
        {students.map(s => <StudentItem key={s.id} student={s} />)}
      </div>
    </section>
  </div>
  
  {/* Footer - Fixed */}
  <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700">
    <button>Edit</button>
    <button>Assign Students</button>
  </footer>
</div>
```

**Scroll Behavior:**
- Entire drawer content scrolls as one unit
- Individual sections (Assignments, Students) have their own scroll if content exceeds max-height
- Sticky header/footer always visible
- Mobile: Consider snap-to-top when scrolling (avoid keyboard overlap)

---

### 6. Width on Desktop

**Decision:** 400px default, configurable via prop

**Rationale:**

| Width | Use Case | Screen Coverage (1920px) |
|-------|----------|--------------------------|
| **400px** | Default (container details) | ~21% |
| **500px** | Wide content (tables, forms) | ~26% |
| **600px** | Maximum (rare, detailed data) | ~31% |

**Why 400px default:**
- Enough space for comfortable reading (60-80 characters per line)
- Leaves 1520px for main content (3-4 cards visible)
- Matches common drawer patterns (Gmail, Trello, Notion)
- Mobile-friendly mental model (similar to iPhone width)

**Configuration:**
```typescript
interface DrawerProps {
  width?: 'default' | 'wide' | 'full'; // 400px | 500px | 600px
}

const widthClass = {
  default: 'w-[400px]',
  wide: 'w-[500px]',
  full: 'w-[600px]',
}[width || 'default'];

<div className={`${widthClass} ${isMobile && 'w-full'}`}>
```

---

### 7. Keyboard Navigation & Focus Trap

**Decision:** Use focus-trap-react (same as Modal for consistency)

**Focus Management Rules:**

| Event | Behavior |
|-------|----------|
| **Drawer opens** | Focus first focusable element (close button or first action) |
| **Tab** | Cycle through drawer elements only (trap focus) |
| **Shift+Tab** | Reverse cycle |
| **Escape** | Close drawer (if closeOnEscape=true) |
| **Drawer closes** | Return focus to trigger element (card that opened drawer) |

**Implementation:**
```typescript
import FocusTrap from 'focus-trap-react';

function Drawer({ isOpen, onClose, children }: DrawerProps) {
  if (!isOpen) return null;
  
  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        allowOutsideClick: true,
        escapeDeactivates: false, // Handle Escape ourselves
        returnFocusOnDeactivate: true,
      }}
    >
      <div className="drawer-container">
        {children}
      </div>
    </FocusTrap>
  );
}
```

**Accessibility Attributes:**
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="drawer-title"
  aria-describedby="drawer-description"
>
  <h2 id="drawer-title">{container.display_name}</h2>
  <div id="drawer-description">Container details and assignments</div>
  {/* Content */}
</div>
```

**Keyboard Shortcuts (Optional Enhancement):**
- `Ctrl+E`: Open edit modal from drawer
- `Ctrl+A`: Open assign students modal
- `Ctrl+N`: Create new assignment
- `Escape`: Close drawer

---

### 8. Close on Route Change

**Decision:** Yes, close drawer automatically on route change

**Rationale:**
- User navigating away indicates intent to switch context
- Prevents stale drawer content if route changes underlying data
- Matches user expectation (drawer is tied to current view)
- Prevents confusion on back button press

**Implementation:**
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ContainerDrawer({ isOpen, onClose }: DrawerProps) {
  const location = useLocation();
  
  // Close drawer when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);
  
  return (/* ... */);
}
```

**Alternative (Phase 5+): Deep Linking**
```typescript
// Open drawer based on URL query param
// Example: /classes-v2?container=abc123

const { containerId } = useQueryParams();
const [selectedContainer, setSelectedContainer] = useState<string | null>(containerId);

useEffect(() => {
  if (containerId) {
    setSelectedContainer(containerId);
  }
}, [containerId]);

const handleCloseDrawer = () => {
  setSelectedContainer(null);
  // Clear query param
  navigate('/classes-v2', { replace: true });
};
```

---

### 9. Drawer vs Modal Coexistence

**Z-Index Strategy:**
- **Main Content:** z-0
- **Drawer:** z-[100]
- **Modal:** z-[200]

**Interaction Rules:**
1. Drawer can be open while modal is closed → User browsing container
2. Modal can open while drawer is open → User edits container or creates assignment
3. Modal backdrop covers drawer → Clear focus on modal action
4. Modal closes → Drawer remains open (return to browsing)
5. Drawer closes → Any open modals also close (cleanup)

**Example Flow:**
```
User clicks ContainerCard 
  → Drawer opens (z-100)
  → User clicks [Edit] in drawer
    → EditContainerModal opens (z-200, covers drawer)
    → User saves changes
    → Modal closes
  → Drawer still open, now shows updated data
```

**Implementation:**
```typescript
// In ClassesDashboard
const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);

const handleOpenEditModal = () => {
  setIsEditModalOpen(true);
  // Drawer stays open
};

const handleCloseDrawer = () => {
  setSelectedContainer(null);
  setIsEditModalOpen(false); // Close any open modals
};

return (
  <>
    <ContainerDrawer
      isOpen={!!selectedContainer}
      container={selectedContainer}
      onClose={handleCloseDrawer}
      onEdit={handleOpenEditModal}
    />
    
    <EditContainerModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      container={selectedContainer}
    />
  </>
);
```

---

### 10. Mobile Bottom Sheet Enhancements (Phase 7)

**Drag Gesture Implementation:**
```typescript
import { useSwipeGestures } from '@/hooks/useSwipeGestures';

function MobileBottomSheet({ isOpen, onClose }: DrawerProps) {
  const [dragOffset, setDragOffset] = useState(0);
  
  const swipeHandlers = useSwipeGestures({
    onSwipeDown: () => {
      if (dragOffset > 100) {
        onClose(); // Close if dragged down > 100px
      }
    },
    onSwipeMove: (distance) => {
      setDragOffset(Math.max(0, distance)); // Only allow downward drag
    },
  });
  
  return (
    <div
      {...swipeHandlers}
      className="bottom-sheet"
      style={{ transform: `translateY(${dragOffset}px)` }}
    >
      {/* Drag handle */}
      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2" />
      {/* Content */}
    </div>
  );
}
```

**Snap Points:**
```typescript
enum SnapPoint {
  Closed = 0,     // translateY(100%)
  Half = 40,      // 40vh height
  Full = 90,      // 90vh height
}

// Snap to nearest point on drag end
const handleDragEnd = (offset: number) => {
  const closestSnap = getClosestSnapPoint(offset);
  animateToSnap(closestSnap);
};
```

---

### 11. Performance Optimizations

**Lazy Load Drawer Content:**
```typescript
function ContainerDrawer({ isOpen, container }: DrawerProps) {
  // Don't render content until drawer opens
  if (!isOpen) return null;
  
  return (
    <Drawer isOpen={isOpen}>
      <Suspense fallback={<LoadingSkeleton />}>
        <DrawerContent container={container} />
      </Suspense>
    </Drawer>
  );
}
```

**Virtualized Lists (if many students/assignments):**
```typescript
import { FixedSizeList } from 'react-window';

function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={assignments.length}
      itemSize={60}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <AssignmentItem assignment={assignments[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

### 12. Error Handling & Empty States

**Empty States:**
```typescript
// No assignments yet
{assignments.length === 0 && (
  <div className="py-8 text-center text-gray-500">
    <p>No assignments created yet</p>
    <button onClick={onCreateAssignment} className="mt-2 text-emerald-600">
      + Create First Assignment
    </button>
  </div>
)}

// No students enrolled
{students.length === 0 && (
  <div className="py-8 text-center text-gray-500">
    <p>No students enrolled yet</p>
    <button onClick={onAssignStudents} className="mt-2 text-emerald-600">
      + Assign Students
    </button>
  </div>
)}
```

**Loading State:**
```typescript
{isLoadingAssignments && (
  <div className="py-4 flex justify-center">
    <LoadingSpinner />
  </div>
)}
```

**Error State:**
```typescript
{assignmentError && (
  <div className="p-3 bg-rose-50 text-rose-700 rounded-md">
    Failed to load assignments. <button onClick={retry}>Retry</button>
  </div>
)}
```

---

## 🎯 Summary for Task 3.10 (Implementation)

**Component to Implement:** `ContainerDrawer.tsx`

**Props Interface:**
```typescript
interface ContainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  container: Container | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreateAssignment?: () => void;
  onAssignStudents?: () => void;
  width?: 'default' | 'wide' | 'full'; // Desktop only
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}
```

**Key Features to Implement:**
1. **Responsive layout:** Desktop (slide right, 400px) vs Mobile (bottom sheet, full-width)
2. **CSS animations:** translateX/translateY with 300ms duration
3. **Backdrop:** Semi-transparent, click-to-close
4. **Sticky header/footer:** Fixed position with scrollable content
5. **Focus trap:** Using focus-trap-react
6. **Keyboard:** Escape closes, Tab cycles
7. **Sections:** Details (static), Assignments (scrollable list), Students (scrollable list)
8. **Actions:** Edit, Delete, Create Assignment, Assign Students buttons
9. **Empty states:** No assignments, No students enrolled
10. **Close on route change:** useEffect + useLocation

**Layout Structure:**
```typescript
<div className="fixed inset-0 z-[100]">
  {/* Backdrop */}
  <div className="bg-black/30 backdrop-blur-sm" onClick={handleBackdropClick} />
  
  {/* Drawer */}
  <FocusTrap>
    <div className="drawer-panel">
      {/* Header (sticky) */}
      <header>
        <h2>{container.display_name}</h2>
        <button onClick={onClose}>×</button>
      </header>
      
      {/* Content (scrollable) */}
      <div className="overflow-y-auto">
        <section>{/* Details */}</section>
        <section>{/* Assignments */}</section>
        <section>{/* Students */}</section>
      </div>
      
      {/* Footer (sticky) */}
      <footer>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onAssignStudents}>Assign Students</button>
      </footer>
    </div>
  </FocusTrap>
</div>
```

**Dependencies:**
- `focus-trap-react`
- `useMobileDetect()` hook (Phase 7 or use simple `window.innerWidth`)
- `useLocation()` from react-router-dom
- `CapacityIndicator` component (already implemented)
- `AssignmentList` component (placeholder for now, Phase 5)

**File Location:** `src/features/dashboard/components/Modules/ClassesV2/components/ContainerDrawer.tsx`

**Testing Scenarios:**
- Open/close animation smooth
- Backdrop click closes drawer
- Escape key closes drawer
- Tab cycles through drawer elements only
- Focus returns to trigger card on close
- Route change closes drawer
- Drawer + Modal can coexist
- Scrolling works independently for each section
- Empty states display correctly
- Mobile: bottom sheet layout instead of right panel

---

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

### Task 4.1: ClassesDashboard State Management Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Critical
- [x] **Estimated Time:** 2 hours
- [x] **Dependencies:** Phase 3 completion
- [x] **Description:** Design main component state management
- [x] **Deliverable:** State management architecture
- [x] **Prompt:** "Design state management for ClassesDashboard: Which modals/drawer can be open simultaneously? How to pass data (selected container)? Optimistic updates or wait? Error handling (toast vs inline)? Loading states? Polling strategy?"
- [x] **Output Location:** Comment for Task 4.2
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 4.1 Deliverable: ClassesDashboard State Management Design

### 1. Overview

**Purpose:** Design centralized state management for ClassesDashboard to coordinate containers, modals, drawer, and user interactions

**Key Requirements:**
- Manage multiple UI states (modals, drawer) without conflicts
- Pass selected container data efficiently
- Handle async operations with proper loading/error states
- Provide responsive user feedback (optimistic updates, notifications)
- Keep data fresh with smart polling
- Support undo/redo for destructive actions

**Design Principle:** **Simple, predictable state with clear ownership** — each piece of state has one source of truth, mutations happen through clear event handlers

---

### 2. Modal & Drawer Simultaneous Opening Rules

**Decision:** Drawer + ONE modal can be open simultaneously (no modal stacking)

**Allowed Combinations:**

| State | Drawer | Create Modal | Edit Modal | Delete Modal | Assign Modal | Rationale |
|-------|--------|--------------|------------|--------------|--------------|-----------|
| **Viewing** | ✅ Open | ❌ Closed | ❌ Closed | ❌ Closed | ❌ Closed | User browsing container |
| **Creating** | ❌ Closed | ✅ Open | ❌ Closed | ❌ Closed | ❌ Closed | Full focus on creation |
| **Editing** | ✅ Open | ❌ Closed | ✅ Open | ❌ Closed | ❌ Closed | Context visible, edit focused |
| **Deleting** | ✅ Open | ❌ Closed | ❌ Closed | ✅ Open | ❌ Closed | Context visible, confirm focused |
| **Assigning** | ✅ Open | ❌ Closed | ❌ Closed | ❌ Closed | ✅ Open | Context visible, assign focused |

**Why This Pattern:**
- Drawer provides **context** (what container am I working with?)
- Modal provides **focus** (what action am I performing?)
- No modal stacking = simpler z-index management, clearer UX
- Create modal closes drawer = full screen for complex form

**State Structure:**
```typescript
interface UIState {
  // Drawer state
  selectedContainer: Container | null;
  isDrawerOpen: boolean;
  
  // Modal states (only ONE can be true at a time)
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isAssignStudentsModalOpen: boolean;
  isCreateAssignmentModalOpen: boolean;
}
```

**State Transitions:**
```typescript
// Open drawer (closes all modals)
const handleOpenDrawer = (container: Container) => {
  setSelectedContainer(container);
  setIsDrawerOpen(true);
  closeAllModals();
};

// Open modal from drawer (drawer stays open for Edit/Delete/Assign)
const handleOpenEditModal = () => {
  setIsEditModalOpen(true);
  // Drawer stays open (provides context)
};

// Open create modal (closes drawer)
const handleOpenCreateModal = () => {
  setIsCreateModalOpen(true);
  setIsDrawerOpen(false);
  setSelectedContainer(null);
};

// Close drawer (closes all modals)
const handleCloseDrawer = () => {
  setIsDrawerOpen(false);
  setSelectedContainer(null);
  closeAllModals();
};

// Close modal (drawer stays open if it was open)
const handleCloseModal = () => {
  closeAllModals();
  // Drawer state unchanged
};
```

---

### 3. Data Passing Strategy: Props Drilling (No Context)

**Decision:** Pass `selectedContainer` via props (NOT Context API)

**Rationale:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Props drilling** | ✅ Explicit<br>✅ Easy to debug<br>✅ No re-render issues<br>✅ TypeScript-friendly | ⚠️ More verbose (3 levels deep) | ⭐ **RECOMMENDED** |
| **Context API** | ✅ Less props<br>✅ Global access | ❌ Re-render all consumers<br>❌ Harder to optimize<br>❌ Overkill for 3 levels | ❌ Avoid |
| **Redux/Zustand** | ✅ Global state<br>✅ DevTools | ❌ Boilerplate<br>❌ Learning curve<br>❌ Overkill for local UI | ❌ Avoid |

**Why Props Win:**
- Only 3 levels: `ClassesDashboard` → `ContainerDrawer` → `EditContainerModal`
- Container data only needed by drawer and modals (not siblings)
- Clear data flow: parent owns state, children receive via props
- Easy to trace: "Where is this container coming from?" → Look at props

**Implementation:**
```typescript
function ClassesDashboard() {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  return (
    <>
      {/* Container grid */}
      <div className="grid">
        {containers.map(c => (
          <ContainerCard
            key={c.id}
            container={c}
            onClick={() => handleOpenDrawer(c)}
          />
        ))}
      </div>
      
      {/* Drawer (receives selectedContainer) */}
      <ContainerDrawer
        isOpen={isDrawerOpen}
        container={selectedContainer}
        onClose={handleCloseDrawer}
        onEdit={() => setIsEditModalOpen(true)}
      />
      
      {/* Edit Modal (receives selectedContainer) */}
      <EditContainerModal
        isOpen={isEditModalOpen}
        container={selectedContainer}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
```

---

### 4. Optimistic Updates vs Wait Strategy

**Decision:** Hybrid approach — optimistic for UI feedback, wait for critical actions

**Strategy by Action:**

| Action | Strategy | Rationale |
|--------|----------|-----------|
| **Create Container** | ⏳ Wait | Critical, needs server validation, conflicts possible |
| **Edit Container** | ⚡ Optimistic | Fast feedback, easy to rollback, low conflict risk |
| **Delete Container** | ⏳ Wait | Destructive, needs confirmation, show spinner |
| **Assign Students** | ⚡ Optimistic | Frequent action, instant feedback expected |
| **Create Assignment** | ⏳ Wait | Needs validation (conflicts), show loading |
| **Refresh/Refetch** | 🔄 Background | Silent update, merge new data |

**Optimistic Update Pattern:**
```typescript
const handleEditContainer = async (updatedData: Container) => {
  // 1. Optimistically update local state
  const previousContainer = selectedContainer;
  setSelectedContainer(updatedData);
  updateContainerInList(updatedData); // Update grid immediately
  
  // 2. Close modal immediately (feels instant)
  setIsEditModalOpen(false);
  showToast('Saving changes...', 'info');
  
  try {
    // 3. Send to server in background
    const result = await ContainerService.updateContainer(updatedData.id, updatedData);
    
    // 4. Replace optimistic data with server response
    setSelectedContainer(result.data);
    updateContainerInList(result.data);
    showToast('Container updated!', 'success');
  } catch (err) {
    // 5. Rollback on error
    setSelectedContainer(previousContainer);
    updateContainerInList(previousContainer);
    showToast('Failed to update. Changes reverted.', 'error');
    
    // 6. Reopen modal with previous data
    setIsEditModalOpen(true);
  }
};
```

**Wait Pattern:**
```typescript
const handleCreateContainer = async (newData: Container) => {
  setIsSubmitting(true);
  
  try {
    const result = await ContainerService.createContainer(newData);
    
    // Only update state after success
    addContainerToList(result.data);
    setIsCreateModalOpen(false);
    showToast('Container created!', 'success');
  } catch (err) {
    // Keep modal open, show error inline
    setFormError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

**Rollback Helper:**
```typescript
function useOptimisticUpdate<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const previousValueRef = useRef<T>(initialValue);
  
  const update = (newValue: T) => {
    previousValueRef.current = value;
    setValue(newValue);
  };
  
  const rollback = () => {
    setValue(previousValueRef.current);
  };
  
  return { value, update, rollback };
}
```

---

### 5. Error Handling: Toast vs Inline

**Decision:** Use **both** — inline for forms, toast for actions

**Error Display Matrix:**

| Context | Error Type | Display Method | Auto-Dismiss | Rationale |
|---------|-----------|----------------|--------------|-----------|
| **Form validation** | Sync validation error | Inline (below field) | No | User needs to fix before submit |
| **Form submission** | API error (400) | Inline (top of form) | No | User needs to fix data |
| **Create action** | Network error (500) | Toast (bottom-right) | 5s | Transient, not user's fault |
| **Edit action** | Conflict error | Toast + rollback | 7s | Show what happened |
| **Delete action** | Permission error | Toast (error) | 5s | Inform user |
| **Background refetch** | Silent failure | Console only | N/A | Don't interrupt user |
| **Assign students** | Capacity exceeded | Toast (warning) | 8s | Inform, but allow retry |

**Toast Implementation:**
```typescript
interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // ms, default 5000
  action?: { label: string; onClick: () => void }; // Undo button
}

function showToast(options: ToastOptions) {
  // Use existing toast system or create simple one
  toast({
    ...options,
    position: 'bottom-right',
    dismissible: true,
  });
}

// Usage examples
showToast({ message: 'Container created!', type: 'success' });
showToast({ message: 'Failed to delete', type: 'error', duration: 7000 });
showToast({ 
  message: 'Container updated', 
  type: 'success',
  action: { label: 'Undo', onClick: handleUndo }
});
```

**Inline Error (Form):**
```typescript
{errors._form && (
  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md" role="alert">
    <div className="flex items-start gap-2">
      <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-rose-700">{errors._form}</p>
        {errors._details && <p className="text-xs text-rose-600 mt-1">{errors._details}</p>}
      </div>
      <button onClick={() => setErrors({})} className="text-rose-400 hover:text-rose-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
)}
```

**Error Boundary (Top Level):**
```typescript
// Catch React errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <ClassesDashboard />
</ErrorBoundary>
```

---

### 6. Loading States Strategy

**Decision:** Granular loading states per action (not global)

**Loading State Locations:**

| Loading State | Where Displayed | Component | Blocks Interaction |
|---------------|----------------|-----------|-------------------|
| **Initial fetch** | Skeleton cards | ClassesDashboard | No (shows skeletons) |
| **Creating container** | Modal submit button | CreateContainerModal | Yes (button disabled) |
| **Editing container** | Modal submit button | EditContainerModal | Partially (can cancel) |
| **Deleting container** | Delete button + backdrop | DeleteConfirmModal | Yes (full modal) |
| **Opening drawer** | Drawer content | ContainerDrawer | No (shows immediately) |
| **Fetching assignments** | Section spinner | ContainerDrawer | No (other sections visible) |
| **Background refetch** | Small indicator (top-right) | ClassesDashboard | No (silent) |

**State Structure:**
```typescript
interface LoadingState {
  isLoadingContainers: boolean;    // Initial fetch
  isCreating: boolean;              // Creating new container
  isUpdating: string | null;        // ID of container being updated
  isDeleting: string | null;        // ID of container being deleted
  isRefreshing: boolean;            // Background refresh
  assignmentLoadingStates: Record<string, boolean>; // Per-container assignment loading
}
```

**Implementation:**
```typescript
function ClassesDashboard() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoadingContainers: true,
    isCreating: false,
    isUpdating: null,
    isDeleting: null,
    isRefreshing: false,
    assignmentLoadingStates: {},
  });
  
  // Initial fetch
  useEffect(() => {
    fetchContainers().finally(() => {
      setLoadingState(prev => ({ ...prev, isLoadingContainers: false }));
    });
  }, []);
  
  // Delete action
  const handleDelete = async (id: string) => {
    setLoadingState(prev => ({ ...prev, isDeleting: id }));
    try {
      await ContainerService.deleteContainer(id);
      removeContainerFromList(id);
      showToast({ message: 'Container deleted', type: 'success' });
    } catch (err) {
      showToast({ message: 'Failed to delete', type: 'error' });
    } finally {
      setLoadingState(prev => ({ ...prev, isDeleting: null }));
    }
  };
  
  return (
    <>
      {loadingState.isLoadingContainers ? (
        <ContainerGridSkeleton />
      ) : (
        <div className="grid">
          {containers.map(c => (
            <ContainerCard
              key={c.id}
              container={c}
              isDeleting={loadingState.isDeleting === c.id}
            />
          ))}
        </div>
      )}
    </>
  );
}
```

**Skeleton Component:**
```typescript
function ContainerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48" />
      ))}
    </div>
  );
}
```

---

### 7. Polling Strategy: Smart Intervals

**Decision:** Adaptive polling based on user activity (not constant)

**Polling Rules:**

| Scenario | Interval | Enabled When | Rationale |
|----------|----------|--------------|-----------|
| **Dashboard active** | 30s | Tab visible, no modal open | Keep data fresh |
| **Modal open** | None | Any modal open | User is focused, don't interrupt |
| **Drawer open** | 15s | Drawer open, no modal | Update assignments/students |
| **Tab hidden** | None | Tab not visible | Conserve resources |
| **After mutation** | 2s delay then 30s | After create/edit/delete | Immediate sync, then resume |
| **Network error** | Exponential backoff | After failed fetch | 5s → 10s → 30s → 60s |

**Implementation:**
```typescript
function useSmartPolling(
  fetchFn: () => Promise<void>,
  options: {
    interval: number;
    enabledWhen: () => boolean;
  }
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const poll = () => {
      if (options.enabledWhen()) {
        fetchFn();
      }
    };
    
    // Start polling
    intervalRef.current = setInterval(poll, options.interval);
    
    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [options.interval, options.enabledWhen, fetchFn]);
  
  // Pause when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!document.hidden) {
        fetchFn(); // Immediate fetch when tab becomes visible
        intervalRef.current = setInterval(
          () => options.enabledWhen() && fetchFn(),
          options.interval
        );
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}

// Usage
function ClassesDashboard() {
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  
  useSmartPolling(
    () => refetchContainers(),
    {
      interval: 30000, // 30s
      enabledWhen: () => !isAnyModalOpen,
    }
  );
}
```

**Exponential Backoff (Error Recovery):**
```typescript
function usePollingWithBackoff(fetchFn: () => Promise<void>) {
  const [retryDelay, setRetryDelay] = useState(5000); // Start at 5s
  
  const fetchWithBackoff = async () => {
    try {
      await fetchFn();
      setRetryDelay(5000); // Reset on success
    } catch (err) {
      console.error('Polling failed, backing off...', err);
      setRetryDelay(prev => Math.min(prev * 2, 60000)); // Double, max 60s
    }
  };
  
  useEffect(() => {
    const interval = setInterval(fetchWithBackoff, retryDelay);
    return () => clearInterval(interval);
  }, [retryDelay]);
}
```

---

### 8. State Update Patterns

**Container List Management:**
```typescript
function ClassesDashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  
  // Add new container (optimistic)
  const addContainer = (container: Container) => {
    setContainers(prev => [container, ...prev]); // Prepend (newest first)
  };
  
  // Update container (optimistic)
  const updateContainer = (id: string, updates: Partial<Container>) => {
    setContainers(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };
  
  // Remove container (optimistic)
  const removeContainer = (id: string) => {
    setContainers(prev => prev.filter(c => c.id !== id));
  };
  
  // Replace entire list (refetch)
  const replaceContainers = (newContainers: Container[]) => {
    setContainers(newContainers);
  };
  
  // Merge updates (polling) - preserve local optimistic changes
  const mergeContainers = (serverContainers: Container[]) => {
    setContainers(prev => {
      const localIds = new Set(prev.map(c => c.id));
      const merged = [...prev];
      
      serverContainers.forEach(serverContainer => {
        const index = merged.findIndex(c => c.id === serverContainer.id);
        if (index >= 0) {
          // Update existing (prefer server data)
          merged[index] = serverContainer;
        } else {
          // Add new from server
          merged.push(serverContainer);
        }
      });
      
      return merged;
    });
  };
}
```

---

### 9. Undo/Redo for Destructive Actions

**Decision:** Undo for delete only (not edit/create)

**Undo Pattern:**
```typescript
interface UndoState {
  action: 'delete' | 'bulk-delete';
  data: Container | Container[];
  timestamp: number;
}

function ClassesDashboard() {
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  
  const handleDelete = async (container: Container) => {
    // 1. Remove from UI immediately
    removeContainer(container.id);
    
    // 2. Show toast with undo button
    showToast({
      message: 'Container deleted',
      type: 'info',
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => handleUndo(container),
      },
    });
    
    // 3. Push to undo stack
    setUndoStack(prev => [...prev, {
      action: 'delete',
      data: container,
      timestamp: Date.now(),
    }]);
    
    // 4. Delete on server after delay (allows undo window)
    setTimeout(async () => {
      try {
        await ContainerService.deleteContainer(container.id);
        // Remove from undo stack after successful deletion
        setUndoStack(prev => prev.filter(u => u.data !== container));
      } catch (err) {
        // Restore on error
        addContainer(container);
        showToast({ message: 'Failed to delete. Restored.', type: 'error' });
      }
    }, 8000); // Match toast duration
  };
  
  const handleUndo = (container: Container) => {
    addContainer(container);
    showToast({ message: 'Delete canceled', type: 'info' });
    setUndoStack(prev => prev.filter(u => u.data !== container));
  };
}
```

---

### 10. Complete State Interface

```typescript
interface ClassesDashboardState {
  // Data
  containers: Container[];
  selectedContainer: Container | null;
  
  // UI State
  isDrawerOpen: boolean;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isAssignStudentsModalOpen: boolean;
  isCreateAssignmentModalOpen: boolean;
  
  // Loading State
  isLoadingContainers: boolean;
  isCreating: boolean;
  isUpdating: string | null;
  isDeleting: string | null;
  isRefreshing: boolean;
  
  // Error State
  fetchError: string | null;
  
  // Undo State
  undoStack: UndoState[];
  
  // Filter/Sort State (Phase 5+)
  filters: {
    status: 'all' | 'active' | 'completed' | 'cancelled';
    instructor: string | null;
    packageType: 'all' | 'individual' | 'group' | 'crash';
  };
  sortBy: 'created_at' | 'start_date' | 'name';
  sortOrder: 'asc' | 'desc';
}
```

---

### 11. Event Handler Patterns

**Naming Convention:** `handle<Action><Target>`

```typescript
function ClassesDashboard() {
  // Drawer handlers
  const handleOpenDrawer = (container: Container) => { /* ... */ };
  const handleCloseDrawer = () => { /* ... */ };
  
  // Modal handlers
  const handleOpenCreateModal = () => { /* ... */ };
  const handleCloseCreateModal = () => { /* ... */ };
  const handleOpenEditModal = () => { /* ... */ };
  const handleCloseEditModal = () => { /* ... */ };
  
  // CRUD handlers
  const handleCreateContainer = async (data: Container) => { /* ... */ };
  const handleEditContainer = async (data: Container) => { /* ... */ };
  const handleDeleteContainer = async (id: string) => { /* ... */ };
  
  // Success handlers (called by modals)
  const handleCreateSuccess = (container: Container) => {
    addContainer(container);
    handleCloseCreateModal();
    showToast({ message: 'Container created!', type: 'success' });
  };
  
  const handleEditSuccess = (container: Container) => {
    updateContainer(container.id, container);
    setSelectedContainer(container);
    handleCloseEditModal();
    showToast({ message: 'Container updated!', type: 'success' });
  };
  
  const handleDeleteSuccess = () => {
    removeContainer(selectedContainer!.id);
    handleCloseDrawer();
    showToast({ message: 'Container deleted', type: 'success' });
  };
}
```

---

## 🎯 Summary for Task 4.2 (Implementation)

**State Management Implementation Checklist:**

1. **State Variables (useState):**
   - `containers: Container[]`
   - `selectedContainer: Container | null`
   - `isDrawerOpen: boolean`
   - 5 modal states (create, edit, delete, assign students, create assignment)
   - Loading states object
   - `fetchError: string | null`

2. **Data Fetching (useEffect):**
   - Initial fetch with `useContainers()` hook
   - Smart polling with `useSmartPolling()` hook (30s interval)
   - Pause polling when modal open or tab hidden

3. **Event Handlers:**
   - 10+ handlers for open/close drawer/modals
   - CRUD handlers with optimistic updates (edit, delete)
   - Success/error handlers with toast notifications

4. **Helper Functions:**
   - `addContainer()`, `updateContainer()`, `removeContainer()`
   - `closeAllModals()`
   - `showToast()` for notifications

5. **Component Wiring:**
   - Pass handlers to `ContainerCard` (onClick → open drawer)
   - Pass handlers to `ContainerDrawer` (onEdit, onDelete, onAssign)
   - Pass handlers to modals (onClose, onSuccess)

6. **Error Handling:**
   - Try-catch in all async handlers
   - Inline errors in forms
   - Toast errors for actions
   - Rollback optimistic updates on failure

7. **Loading States:**
   - Skeleton during initial fetch
   - Button spinners during submit
   - Disabled states during operations

8. **Polish:**
   - Undo for delete (8s window)
   - Smooth animations (CSS transitions)
   - Keyboard shortcuts (Escape closes, Ctrl+N creates)

**File Location:** `src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx`

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

### Task 4.3: Routing Integration Strategy ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 45 minutes
- [x] **Dependencies:** None
- [x] **Description:** Design routing integration
- [x] **Deliverable:** Routing integration plan
- [x] **Prompt:** "Design routing: Lazy load ClassesDashboard or preload? Route guards for permissions? Deep linking support (e.g., ?container=123)? Suspense fallback? Error boundary at route level?"
- [x] **Output Location:** Comment for Task 4.4
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 4.3 Deliverable: Routing Integration Strategy

### 1. Overview

**Purpose:** Design URL routing, lazy loading, permission guards, and deep linking for ClassesV2 dashboard integration into UniversalDashboard

**Key Requirements:**
- Seamless integration with existing UniversalDashboard module system
- Role-based access control (admin, super_admin)
- Lazy loading for optimal bundle size
- Deep linking support for sharing specific containers/modals
- Robust error handling with fallback UI
- Browser history management with drawer/modal state

**Design Principle:** **Progressive enhancement** — start with basic route, add deep linking and advanced features incrementally

---

### 2. Lazy Loading vs Preloading Strategy

**Decision:** **Lazy load with intelligent preloading** for admin/super_admin users

**Comparison:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Always lazy load** | ✅ Smaller initial bundle<br>✅ Faster app start<br>✅ Standard pattern | ⚠️ Loading delay on first visit<br>⚠️ Network request required | 🟡 Good baseline |
| **Always preload** | ✅ Instant access<br>✅ No loading state | ❌ Larger initial bundle<br>❌ Unused code for non-admins<br>❌ Slower app start | ❌ Wasteful |
| **Conditional preload** | ✅ Instant for power users<br>✅ Optimized for others<br>✅ Best UX | ⚠️ More complex logic | ⭐ **RECOMMENDED** |

**Implementation Strategy:**

```typescript
// 1. Lazy load as default (in UniversalDashboard.tsx)
const ClassesDashboard = React.lazy(() => import('./Modules/ClassesV2/ClassesDashboard'));

// 2. Preload for admin/super_admin after login
const preloadClassesV2 = () => {
  import('./Modules/ClassesV2/ClassesDashboard');
};

// 3. Trigger preload intelligently
useEffect(() => {
  const shouldPreload = 
    (user.role === 'admin' || user.role === 'super_admin') && 
    hasModuleAccess(user.role, 'ClassesDashboard');
  
  if (shouldPreload) {
    // Preload after 2 seconds (let initial render complete)
    const timer = setTimeout(preloadClassesV2, 2000);
    return () => clearTimeout(timer);
  }
}, [user.role]);

// 4. Preload on hover over navigation item (advanced)
<button
  onMouseEnter={() => preloadClassesV2()}
  onClick={() => handleTabChange('ClassesDashboard')}
>
  Classes V2
</button>
```

**Why This Works:**
- Non-admin users: Never load V2 code (smallest bundle)
- Admin users: Preloaded in background after 2s → instant access when clicked
- Power users: Hover preload → even faster perceived performance
- All users: Lazy load as fallback if preload fails

**Bundle Impact Analysis:**
```
Estimated ClassesV2 bundle size: ~45KB gzipped
- ClassesDashboard: 8KB
- ContainerCard + Grid: 5KB
- ContainerDrawer: 7KB
- Modals (4 components): 12KB
- Forms (ContainerForm): 10KB
- Shared components: 3KB

Impact:
- Without lazy load: +45KB to main bundle (ALL users pay)
- With lazy load: +45KB only when accessed (ONLY V2 users pay)
- With preload: +45KB background load for admins (BEST UX)
```

---

### 3. Route Guards for Permissions

**Decision:** **Multi-layer permission checks** — route + component + action level

**Route Guard Hierarchy:**

```
Layer 1: URL Access Control (Route Guard)
  ↓ Block unauthorized users from reaching route
Layer 2: Component Visibility (Component Mount)
  ↓ Hide/show features based on permissions
Layer 3: Action Authorization (Event Handler)
  ↓ Validate before executing create/edit/delete
```

**Route Guard Implementation:**

```typescript
// In UniversalDashboard.tsx
const getActiveComponent = () => {
  const activeModule = userModules.find(module => module.id === activeTab);
  
  if (!activeModule) {
    console.warn(`Module with id ${activeTab} not found`);
    return null;
  }
  
  // ⭐ Permission check (existing pattern)
  if (!roles.some(r => hasModuleAccess(r, activeTab as DashboardModule))) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to view this module.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const Component = componentMap[activeModule.component];
  if (!Component) {
    console.warn(`Component ${activeModule.component} not found`);
    return <div className="error">Component not found</div>;
  }
  
  return <Component />;
};
```

**Adding ClassesV2 to roleConfig.ts:**

```typescript
// In src/shared/config/roleConfig.ts

export type DashboardModule = 
  | 'overview'
  // ...existing modules...
  | 'ClassesDashboard'; // ⭐ Add new module

export const MODULES_CONFIG: Record<DashboardModule, ModuleConfig> = {
  // ...existing modules...
  
  ClassesDashboard: {
    id: 'ClassesDashboard',
    title: 'Classes V2',
    component: 'ClassesDashboard',
    roles: ['admin', 'super_admin'], // ⭐ Only admins
    order: 25, // After existing class modules
  },
};
```

**Component-Level Permission Checks (Phase 4, Task 4.7):**

```typescript
// In ClassesDashboard.tsx (future implementation)
import { usePermissions } from '@/shared/hooks/usePermissions';

function ClassesDashboard() {
  const { canCreate, canUpdate, canDelete, canAssign } = usePermissions('containers');
  
  return (
    <div>
      {/* Conditionally render based on permissions */}
      {canCreate && (
        <button onClick={handleOpenCreateModal}>+ Create Container</button>
      )}
      
      {/* Disable actions if no permission */}
      <button 
        onClick={handleEdit} 
        disabled={!canUpdate}
        title={!canUpdate ? "You don't have permission to edit" : "Edit container"}
      >
        Edit
      </button>
    </div>
  );
}
```

**Permission Check Timing:**

| Location | When | Purpose | Example |
|----------|------|---------|---------|
| **Route Guard** | URL navigation | Block unauthorized access | Redirect to 403 or dashboard |
| **Component Mount** | useEffect + user change | Hide UI elements | Don't show Create button |
| **Event Handler** | Button click | Prevent action | API returns 403, show toast |
| **API Layer** | Every request | Server-side validation | Backend verifies JWT role |

**Why Multi-Layer:**
- Route guard: First line of defense (UX: prevent confusion)
- Component: Fine-grained control (UX: clean UI)
- Action: Last resort + audit trail (Security: actual enforcement)
- API: Ultimate authority (Security: never trust frontend)

---

### 4. Deep Linking Support

**Decision:** **Query parameter-based deep linking** with state synchronization

**Deep Link Patterns:**

| URL Pattern | Opens | Use Case |
|-------------|-------|----------|
| `/dashboard/ClassesDashboard` | Dashboard (empty) | Default view |
| `/dashboard/ClassesDashboard?container=abc123` | Drawer with container | Share specific container |
| `/dashboard/ClassesDashboard?container=abc123&action=edit` | Drawer + Edit modal | Quick edit link |
| `/dashboard/ClassesDashboard?container=abc123&action=delete` | Drawer + Delete modal | Admin review link |
| `/dashboard/ClassesDashboard?container=abc123&assignment=xyz789` | Drawer + Assignment expanded | Assignment detail link |
| `/dashboard/ClassesDashboard?create=true` | Create modal open | Quick create action |

**Implementation:**

```typescript
// Custom hook: useDeepLink
import { useSearchParams } from 'react-router-dom';

function useDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getParam = (key: string) => searchParams.get(key);
  const setParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams, { replace: true });
  };
  
  const clearParams = () => setSearchParams({}, { replace: true });
  
  return { getParam, setParam, clearParams };
}

// In ClassesDashboard.tsx
function ClassesDashboard() {
  const { getParam, setParam, clearParams } = useDeepLink();
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // 1. Handle deep link on mount
  useEffect(() => {
    const containerId = getParam('container');
    const action = getParam('action');
    const createFlag = getParam('create');
    
    if (containerId) {
      // Fetch container by ID and open drawer
      const fetchAndOpen = async () => {
        try {
          const container = await ContainerService.getById(containerId);
          setSelectedContainer(container);
          setIsDrawerOpen(true);
          
          // Open modal based on action
          if (action === 'edit') {
            setIsEditModalOpen(true);
          } else if (action === 'delete') {
            setIsDeleteModalOpen(true);
          }
        } catch (err) {
          console.error('Container not found:', containerId);
          clearParams(); // Remove invalid params
          showToast({ message: 'Container not found', type: 'error' });
        }
      };
      
      fetchAndOpen();
    } else if (createFlag === 'true') {
      setIsCreateModalOpen(true);
    }
  }, []); // Run once on mount
  
  // 2. Update URL when drawer opens
  const handleOpenDrawer = (container: Container) => {
    setSelectedContainer(container);
    setIsDrawerOpen(true);
    setParam('container', container.id); // ⭐ Update URL
  };
  
  // 3. Update URL when modal opens
  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
    setParam('action', 'edit'); // ⭐ Add action param
  };
  
  // 4. Clear URL when closing
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedContainer(null);
    setIsEditModalOpen(false);
    clearParams(); // ⭐ Clean URL
  };
  
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setParam('action', null); // ⭐ Remove action, keep container
  };
  
  // 5. Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const containerId = getParam('container');
      if (!containerId) {
        // User pressed back, no container in URL → close drawer
        setIsDrawerOpen(false);
        setSelectedContainer(null);
        setIsEditModalOpen(false);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getParam]);
  
  return (/* ... */);
}
```

**URL State Synchronization:**

```
Action Flow:
1. User clicks ContainerCard
   → handleOpenDrawer(container)
   → setParam('container', id)
   → URL: ?container=abc123

2. User clicks Edit button
   → handleOpenEditModal()
   → setParam('action', 'edit')
   → URL: ?container=abc123&action=edit

3. User closes modal (X button)
   → handleCloseModal()
   → setParam('action', null)
   → URL: ?container=abc123 (drawer still open)

4. User closes drawer (X button)
   → handleCloseDrawer()
   → clearParams()
   → URL: /dashboard/ClassesDashboard (clean)

5. User presses browser back button
   → popstate event
   → Read URL params → sync UI state
```

**Shareable Link Examples:**

```typescript
// Admin shares container with colleague
const shareLink = `${window.location.origin}/dashboard/ClassesDashboard?container=${container.id}`;
navigator.clipboard.writeText(shareLink);
showToast({ message: 'Link copied to clipboard', type: 'success' });

// Quick edit link for admin tasks
const editLink = `${window.location.origin}/dashboard/ClassesDashboard?container=${container.id}&action=edit`;

// Quick create link (e.g., in notifications)
const createLink = `${window.location.origin}/dashboard/ClassesDashboard?create=true`;
```

**Benefits:**
- Shareable URLs for collaboration
- Browser back/forward works correctly
- Bookmarkable states
- Deep linking from emails/notifications
- SEO-friendly (query params preserved)
- State restoration on refresh

---

### 5. Suspense Fallback Strategy

**Decision:** **Contextual loading states** — skeleton for initial load, spinner for lazy load

**Loading State Hierarchy:**

| Context | Fallback | Duration | UX Goal |
|---------|----------|----------|---------|
| **Lazy component load** | Centered spinner | 100-500ms | Indicate loading, don't distract |
| **Initial data fetch** | Skeleton grid | 500-2000ms | Show structure, reduce perceived wait |
| **Modal open** | Button spinner | 100-300ms | Local feedback, don't block view |
| **Refetch/polling** | Small badge | 50-200ms | Silent, non-intrusive |

**Suspense Fallback Implementation:**

```typescript
// In UniversalDashboard.tsx
<Suspense fallback={<ModuleLoadingFallback />}>
  {getActiveComponent()}
</Suspense>

// ModuleLoadingFallback component
function ModuleLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading module...</p>
      </div>
    </div>
  );
}
```

**ClassesDashboard Internal Loading States:**

```typescript
// In ClassesDashboard.tsx
function ClassesDashboard() {
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState<Container[]>([]);
  
  if (loading) {
    return <ContainerGridSkeleton />; // ⭐ Skeleton for data load
  }
  
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }
  
  return (
    <div>
      {/* Main content */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">
          Updating...
        </div>
      )}
    </div>
  );
}

// Skeleton component (from Task 4.2)
function ContainerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
      ))}
    </div>
  );
}
```

**Progressive Loading Strategy:**

```typescript
// Show content incrementally (advanced)
function ClassesDashboard() {
  const [firstBatch, setFirstBatch] = useState<Container[]>([]);
  const [remainingBatches, setRemainingBatches] = useState<Container[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      // Load first 6 containers immediately
      const first = await ContainerService.getContainers({ limit: 6 });
      setFirstBatch(first);
      setLoading(false); // ⭐ Stop loading, show first batch
      
      // Load remaining containers in background
      const remaining = await ContainerService.getContainers({ offset: 6 });
      setRemainingBatches(remaining);
    };
    
    loadData();
  }, []);
  
  return (
    <div className="grid">
      {firstBatch.map(c => <ContainerCard key={c.id} container={c} />)}
      
      {/* Show remaining after first render */}
      {remainingBatches.map(c => <ContainerCard key={c.id} container={c} />)}
    </div>
  );
}
```

**Why Contextual Loading:**
- Lazy load: User knows they navigated, spinner OK
- Data load: User expects content structure, skeleton better
- Refetch: User already has content, subtle indicator best
- Incremental: Show first results immediately, load rest in background

---

### 6. Error Boundary at Route Level

**Decision:** **Nested error boundaries** — route level + component level

**Error Boundary Hierarchy:**

```
App Error Boundary (Top Level)
  ↓ Catches fatal errors (app crash)
UniversalDashboard Error Boundary (Route Level)
  ↓ Catches module errors (navigation still works)
ClassesDashboard Error Boundary (Component Level)
  ↓ Catches component errors (other modules unaffected)
```

**Route-Level Error Boundary Implementation:**

```typescript
// Create: src/shared/components/error/ModuleErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Module Error:', error, errorInfo);
    
    // Log to error tracking service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          module: this.props.moduleName || 'unknown',
        },
      });
    }
    
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Something Went Wrong
              </h2>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {this.props.moduleName 
                ? `The ${this.props.moduleName} module encountered an error.`
                : 'This module encountered an unexpected error.'
              }
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;
```

**Integration in UniversalDashboard:**

```typescript
// In UniversalDashboard.tsx
import ModuleErrorBoundary from '@/shared/components/error/ModuleErrorBoundary';

function UniversalDashboard({ user }: UniversalDashboardProps) {
  // ...existing code...
  
  return (
    <div className="universal-dashboard">
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-main">
          <div className="dashboard-sidebar">
            <RoleBasedNavigation user={user} />
          </div>
          <div className="dashboard-content">
            {/* ...tabs... */}
            <div className="dashboard-tab-content">
              <Suspense fallback={<ModuleLoadingFallback />}>
                <ModuleErrorBoundary 
                  moduleName={activeTab}
                  onReset={() => setActiveTab(defaultModule)}
                >
                  {getActiveComponent()}
                </ModuleErrorBoundary>
              </Suspense>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
```

**ClassesDashboard Internal Error Boundary:**

```typescript
// Optional: Component-specific error boundary for sub-features
function ClassesDashboard() {
  return (
    <ModuleErrorBoundary moduleName="ClassesDashboard" onReset={handleReload}>
      <div>
        {/* Main content */}
        
        {/* Drawer with its own error boundary */}
        <ErrorBoundary 
          fallback={<DrawerErrorFallback />}
          onReset={handleCloseDrawer}
        >
          <ContainerDrawer {...drawerProps} />
        </ErrorBoundary>
        
        {/* Modals with error boundaries */}
        <ErrorBoundary fallback={<ModalErrorFallback />}>
          <CreateContainerModal {...createProps} />
        </ErrorBoundary>
      </div>
    </ModuleErrorBoundary>
  );
}
```

**Error Recovery Strategies:**

| Error Type | Recovery Action | User Impact |
|------------|-----------------|-------------|
| **Lazy load failure** | Retry lazy import 3x with exponential backoff | Loading indicator persists, then error |
| **Data fetch failure** | Show retry button, keep UI intact | Empty state with retry |
| **Component render error** | Error boundary fallback, keep route accessible | Module unavailable, nav works |
| **Modal error** | Close modal, show toast, keep drawer open | Action fails, user can retry |
| **Network error** | Queue action, retry when online | Optimistic UI + background retry |

---

### 7. Browser History Management

**Challenge:** Drawer/modal state vs browser back button expectations

**User Expectations:**

| Scenario | User Action | Expected Behavior |
|----------|-------------|-------------------|
| **Drawer open** | Press back button | Close drawer, stay on page |
| **Modal open** | Press back button | Close modal, drawer stays open |
| **Deep linked** | Press back button | Go to previous page (not close drawer) |
| **Fresh load** | Press back button | Go to previous route |

**Implementation Strategy:**

```typescript
// Option 1: URL-based (RECOMMENDED for deep linking)
// Drawer/modal state in URL query params → back button works naturally

const handleOpenDrawer = (container: Container) => {
  setSelectedContainer(container);
  setIsDrawerOpen(true);
  setParam('container', container.id); // URL updated
};

// Browser back → URL changes → useEffect reads params → closes drawer
useEffect(() => {
  const containerId = getParam('container');
  if (!containerId && isDrawerOpen) {
    // URL cleared (back button) but drawer still open → close it
    setIsDrawerOpen(false);
    setSelectedContainer(null);
  }
}, [searchParams]);

// Option 2: History API manipulation (for non-deep-link approach)
const handleOpenDrawer = (container: Container) => {
  setSelectedContainer(container);
  setIsDrawerOpen(true);
  
  // Push dummy history state (back button will trigger popstate)
  window.history.pushState({ drawer: true }, '');
};

useEffect(() => {
  const handlePopState = (e: PopStateEvent) => {
    if (e.state?.drawer && isDrawerOpen) {
      // User pressed back, close drawer
      setIsDrawerOpen(false);
      setSelectedContainer(null);
    }
  };
  
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [isDrawerOpen]);
```

**Recommendation:** Use URL-based approach (Option 1) for ClassesV2
- ✅ Deep linking support (primary requirement)
- ✅ State restoration on refresh
- ✅ Shareable URLs
- ✅ Browser back works naturally
- ⚠️ URL may look "busy" with many params (acceptable trade-off)

---

### 8. Route Structure & Module Registration

**Route Pattern:** `/dashboard/ClassesDashboard`

**Why This Pattern:**
- Consistent with existing UniversalDashboard modules
- Module ID matches component name (easy to debug)
- No nesting required (flat structure)
- Role-based access already handled by UniversalDashboard

**Module Registration Checklist:**

```typescript
// 1. Add to roleConfig.ts (DashboardModule type)
export type DashboardModule = 
  | 'overview'
  | 'ClassAssignmentManager'
  // ...other modules...
  | 'ClassesDashboard'; // ⭐ NEW

// 2. Add to MODULES_CONFIG
export const MODULES_CONFIG: Record<DashboardModule, ModuleConfig> = {
  // ...existing modules...
  ClassesDashboard: {
    id: 'ClassesDashboard',
    title: 'Classes V2',
    component: 'ClassesDashboard', // Must match componentMap key
    roles: ['admin', 'super_admin'],
    order: 25,
  },
};

// 3. Add lazy import in UniversalDashboard.tsx
const ClassesDashboard = React.lazy(() => 
  import('./Modules/ClassesV2/ClassesDashboard')
);

// 4. Add to componentMap
const componentMap = {
  ClassAssignmentManager,
  // ...other components...
  ClassesDashboard, // ⭐ NEW
};

// 5. (Optional) Add preload for admin users
useEffect(() => {
  if (user.role === 'admin' || user.role === 'super_admin') {
    const timer = setTimeout(() => {
      import('./Modules/ClassesV2/ClassesDashboard');
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [user.role]);
```

**Navigation UI:**
- Module appears in RoleBasedNavigation sidebar automatically (via roleConfig)
- Tab appears in UniversalDashboard tabs automatically (via userModules)
- No additional routing config needed (UniversalDashboard handles it)

---

### 9. SEO & PWA Considerations

**Meta Tags (for PWA):**

```typescript
// In ClassesDashboard.tsx
useEffect(() => {
  // Update document title
  document.title = 'Classes V2 - Dashboard';
  
  // Update meta description (for PWA share preview)
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 'Manage class containers, assignments, and student enrollments');
  }
  
  // Update theme color (optional, for mobile browser chrome)
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', '#1e40af'); // Blue theme
  }
  
  // Cleanup on unmount
  return () => {
    document.title = 'Dashboard';
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Yogique Dashboard');
    }
  };
}, []);
```

**PWA Manifest Updates:**

```json
// In public/manifest.json
{
  "name": "Yogique Dashboard",
  "short_name": "Dashboard",
  "start_url": "/dashboard",
  "scope": "/",
  "shortcuts": [
    {
      "name": "Classes V2",
      "short_name": "Classes",
      "description": "Manage class containers",
      "url": "/dashboard/ClassesDashboard",
      "icons": [{ "src": "/icons/classes-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

**Cache Strategy (Service Worker):**

```javascript
// In public/sw.js (Phase 7, Task 7.7)

// Cache ClassesV2 route and components
const CACHE_NAME = 'dashboard-v2';
const urlsToCache = [
  '/dashboard/ClassesDashboard',
  // Component bundles (generated by Vite)
  '/assets/ClassesDashboard-*.js',
  '/assets/ContainerCard-*.js',
  // API responses (cache with expiry)
];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache ClassesV2 API responses for 5 minutes
  if (url.pathname.startsWith('/api/v2/containers')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        
        return cachedResponse || fetchPromise;
      })
    );
  }
});
```

---

### 10. Migration Plan (If Replacing V1)

**If ClassesV2 replaces existing ClassAssignmentManager:**

```typescript
// Step 1: Run both V1 and V2 in parallel (A/B test)
const componentMap = {
  ClassAssignmentManager, // V1 (keep for now)
  ClassesDashboard,       // V2 (new)
};

// Step 2: Add feature flag
const useClassesV2 = user.role === 'super_admin' || 
                     user.email.includes('@yogique.com');

// Step 3: Conditional rendering
const getActiveComponent = () => {
  if (activeTab === 'ClassAssignmentManager' && useClassesV2) {
    // Redirect V1 users to V2
    return <ClassesDashboard />;
  }
  // ...normal logic...
};

// Step 4: After validation, deprecate V1
// - Update MODULES_CONFIG to replace ClassAssignmentManager with ClassesDashboard
// - Remove old module
// - Update navigation labels
```

**Redirect Strategy:**

```typescript
// Redirect old URLs to new route
useEffect(() => {
  if (location.pathname === '/dashboard/ClassAssignmentManager') {
    navigate('/dashboard/ClassesDashboard', { replace: true });
  }
}, [location.pathname]);
```

---

## 🎯 Summary for Task 4.4 (Implementation)

**Implementation Checklist for UniversalDashboard Integration:**

1. **Update roleConfig.ts:**
   - Add `'ClassesDashboard'` to `DashboardModule` type
   - Add `ClassesDashboard` entry to `MODULES_CONFIG` with roles: `['admin', 'super_admin']`, order: 25

2. **Update UniversalDashboard.tsx:**
   - Add lazy import: `const ClassesDashboard = React.lazy(() => import('./Modules/ClassesV2/ClassesDashboard'));`
   - Add to `componentMap`: `ClassesDashboard`
   - (Optional) Add preload logic for admin users (2s delay)

3. **Create ModuleErrorBoundary.tsx:**
   - Implement error boundary component with fallback UI
   - Wrap module loading in UniversalDashboard
   - Add error logging (Sentry integration if available)

4. **Update ClassesDashboard.tsx:**
   - Implement `useDeepLink` hook for query param management
   - Add deep linking logic in `useEffect` (handle `?container=` and `?action=`)
   - Update event handlers to sync URL (setParam on open, clearParams on close)
   - Add browser back button handler (popstate event)
   - Add document title update

5. **Create Loading Components:**
   - `ModuleLoadingFallback` (Suspense fallback)
   - `ContainerGridSkeleton` (data loading state) — already exists from Task 4.2
   - Small loading indicators for refetch/polling

6. **Test Scenarios:**
   - ✅ Lazy load works (network tab shows async chunk load)
   - ✅ Permission guard blocks non-admin users
   - ✅ Deep link opens correct container/modal
   - ✅ Browser back button closes drawer/modal correctly
   - ✅ Error boundary catches component errors
   - ✅ Suspense fallback shows during lazy load
   - ✅ URL updates when opening drawer/modal
   - ✅ Shareable links work (copy URL, open in new tab)

**Key Design Decisions Summary:**

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Loading** | Lazy load + preload for admins | Optimal bundle size + UX |
| **Permissions** | Multi-layer (route + component + action) | Defense in depth |
| **Deep Linking** | Query params (`?container=`, `?action=`) | Shareable, SEO-friendly |
| **Suspense** | Contextual (spinner → skeleton → indicator) | Appropriate feedback |
| **Error Boundary** | Route level + component level | Isolated failures |
| **History** | URL-based state management | Natural back button behavior |
| **Route** | `/dashboard/ClassesDashboard` | Consistent with existing modules |

**File Locations:**
- Module config: `src/shared/config/roleConfig.ts`
- Dashboard integration: `src/features/dashboard/components/UniversalDashboard.tsx`
- Error boundary: `src/shared/components/error/ModuleErrorBoundary.tsx` (new file)
- Deep linking hook: `src/features/dashboard/hooks/v2/useDeepLink.ts` (new file)
- Main component: `src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx` (update)

---

### Task 4.4: Add Route to App

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

### Task 4.5: Permission System Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design permission checks
- [x] **Deliverable:** Permission system design
- [x] **Prompt:** "Review BOOKING_ASSIGNMENT_ROLES_MODULES.md and design: Where to check permissions (component/hook/both)? Create permissions.ts helper? Hide vs disable vs tooltip? Admin vs super_admin differences? How to test?"
- [x] **Output Location:** Comment for Task 4.6
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 4.5 Deliverable: Permission System Design

### 1. Overview

**Purpose:** Design granular permission checks for ClassesV2 operations (view, create, edit, delete, assign) with role-based access control

**Key Requirements:**
- Multi-layer permission checks (module → component → action)
- Support for admin vs super_admin role differences
- Graceful UX degradation (hide vs disable vs tooltip)
- Easy to test and maintain
- Reusable across modules

**Design Principle:** **Secure by default, progressive enhancement** — deny access unless explicitly granted, show context when blocked

---

### 2. Permission Check Strategy: Multi-Layer Defense

**Decision:** **3-Layer permission architecture** — module access + component visibility + action authorization

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Module Access (Route Guard)               │
│ ✅ Already implemented in roleConfig.ts            │
│ Prevents unauthorized users from loading module    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: Component Visibility (usePermissions)     │
│ 🆕 NEW - Hide/disable UI elements per role         │
│ Shows tooltips when user lacks permission          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Action Authorization (Service Layer)      │
│ 🆕 NEW - Validate before API calls                 │
│ Backend enforces permissions (ultimate authority)  │
└─────────────────────────────────────────────────────┘
```

**Why 3 Layers:**
- **Layer 1 (Module):** Coarse-grained, prevents wasted renders
- **Layer 2 (Component):** Fine-grained UX control, clean interface
- **Layer 3 (Action):** Security enforcement, audit trail

**Where to Check:**

| Location | What to Check | When | Tool |
|----------|---------------|------|------|
| **UniversalDashboard** | Module access | Navigation | `hasModuleAccess()` (existing) |
| **ClassesDashboard** | Component mount | useEffect | `usePermissions()` hook (new) |
| **Event handlers** | Before action | onClick, onSubmit | `canPerform()` helper (new) |
| **API Service** | Every request | HTTP call | Backend role check |

---

### 3. Create permissions.ts Helper: YES

**Decision:** Create centralized permission utilities in `src/shared/utils/permissions.ts`

**Rationale:**
- ✅ Single source of truth for permission logic
- ✅ Easy to test (pure functions)
- ✅ Reusable across all modules (not just V2)
- ✅ Clear separation of concerns
- ✅ TypeScript type safety

**Permission Structure:**

```typescript
// src/shared/utils/permissions.ts

import { UserRole } from '../config/roleConfig';

// Permission actions (CRUD + custom)
export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'unassign'
  | 'export'
  | 'import';

// Resources that can have permissions
export type PermissionResource =
  | 'containers'
  | 'assignments'
  | 'bookings'
  | 'students'
  | 'instructors'
  | 'packages'
  | 'invoices'
  | 'reports';

// Permission matrix: [role][resource][action] = boolean
type PermissionMatrix = Record<
  UserRole,
  Partial<Record<PermissionResource, Partial<Record<PermissionAction, boolean>>>>
>;

// Define permissions
export const PERMISSIONS: PermissionMatrix = {
  super_admin: {
    containers: {
      view: true,
      create: true,
      update: true,
      delete: true,
      assign: true,
      unassign: true,
      export: true,
      import: true,
    },
    assignments: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    bookings: {
      view: true,
      create: true,
      update: true,
      delete: true,
      assign: true,
      unassign: true,
    },
    students: {
      view: true,
      update: true,
    },
  },

  admin: {
    containers: {
      view: true,
      create: true,
      update: true,
      delete: false, // ⚠️ Cannot delete (super_admin only)
      assign: true,
      unassign: true,
      export: true,
      import: false, // ⚠️ Cannot import (super_admin only)
    },
    assignments: {
      view: true,
      create: true,
      update: true,
      delete: false, // ⚠️ Cannot delete assignments
    },
    bookings: {
      view: true,
      create: true,
      update: true,
      delete: false,
      assign: true,
      unassign: false, // ⚠️ Cannot unassign (super_admin only)
    },
    students: {
      view: true,
      update: false, // ⚠️ Cannot edit student data
    },
  },

  yoga_acharya: {
    containers: {
      view: true,
      create: false, // ⚠️ Cannot create containers
      update: false,
      delete: false,
      assign: true, // ✅ Can assign students to existing containers
      unassign: false,
      export: false,
      import: false,
    },
    assignments: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    bookings: {
      view: true, // View only their assigned containers
      create: false,
      update: false,
      delete: false,
      assign: true,
      unassign: false,
    },
    students: {
      view: true,
      update: false,
    },
  },

  instructor: {
    containers: {
      view: true, // View only their assigned containers
      create: false,
      update: false,
      delete: false,
      assign: false,
      unassign: false,
      export: false,
      import: false,
    },
    assignments: {
      view: true, // View only their assignments
      create: false,
      update: false,
      delete: false,
    },
    bookings: {
      view: true, // View students in their classes
      create: false,
      update: false,
      delete: false,
      assign: false,
      unassign: false,
    },
    students: {
      view: true, // View students in their classes
      update: false,
    },
  },

  // Other roles have no access to V2 module
  energy_exchange_lead: {},
  sangha_guide: {},
  user: {},
};

// Helper: Check if role has permission for action on resource
export function hasPermission(
  role: UserRole,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  return PERMISSIONS[role]?.[resource]?.[action] ?? false;
}

// Helper: Get all permissions for a role on a resource
export function getResourcePermissions(
  role: UserRole,
  resource: PermissionResource
) {
  const permissions = PERMISSIONS[role]?.[resource] ?? {};
  return {
    canView: permissions.view ?? false,
    canCreate: permissions.create ?? false,
    canUpdate: permissions.update ?? false,
    canDelete: permissions.delete ?? false,
    canAssign: permissions.assign ?? false,
    canUnassign: permissions.unassign ?? false,
    canExport: permissions.export ?? false,
    canImport: permissions.import ?? false,
  };
}

// Helper: Get reason for denied permission (for tooltips)
export function getPermissionDenialReason(
  role: UserRole,
  resource: PermissionResource,
  action: PermissionAction
): string {
  const hasAccess = hasPermission(role, resource, action);
  if (hasAccess) return '';

  // Provide contextual messages
  const roleLabel = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

  const messages: Record<string, Record<string, string>> = {
    admin: {
      delete: 'Only Super Admins can delete containers to prevent accidental data loss.',
      unassign: 'Only Super Admins can unassign students. Contact your administrator.',
      import: 'Bulk import is restricted to Super Admins for data integrity.',
    },
    yoga_acharya: {
      create: 'You can assign students but cannot create containers. Contact an Admin.',
      update: 'You cannot edit containers. Contact an Admin for changes.',
      delete: 'You cannot delete containers. Contact a Super Admin.',
    },
    instructor: {
      create: 'Instructors have read-only access. Contact an Admin for changes.',
      update: 'Instructors have read-only access. Contact an Admin for changes.',
      assign: 'Only Admins can assign students to programs.',
    },
  };

  return (
    messages[role]?.[action] ??
    `${roleLabel} role does not have permission to ${actionLabel.toLowerCase()} ${resource}.`
  );
}

// Helper: Check multiple permissions at once (for complex UI logic)
export function checkPermissions(
  role: UserRole,
  resource: PermissionResource,
  actions: PermissionAction[]
): Record<PermissionAction, boolean> {
  const result: Partial<Record<PermissionAction, boolean>> = {};
  actions.forEach(action => {
    result[action] = hasPermission(role, resource, action);
  });
  return result as Record<PermissionAction, boolean>;
}
```

**Design Decisions:**
- **Explicit deny by default:** Missing permission = false
- **Role-specific messages:** Contextual tooltips explain *why* action is blocked
- **Pure functions:** Easy to test, no side effects
- **TypeScript enums:** Compile-time safety for actions/resources

---

### 4. Hide vs Disable vs Tooltip Strategy

**Decision:** **Contextual UX degradation** based on action criticality

**UX Degradation Matrix:**

| Action Criticality | Primary Action? | UX Treatment | Rationale |
|-------------------|-----------------|--------------|-----------|
| **Critical (Create/Delete)** | Yes | **Hide** | Don't show if unavailable, reduces clutter |
| **Common (Edit/Assign)** | Yes | **Disable + Tooltip** | Show feature exists, explain why unavailable |
| **Rare (Export/Import)** | No | **Hide** | Power user features, hide if no access |
| **View/Navigate** | N/A | **Filter data** | Only show what user can access |

**Implementation Patterns:**

```typescript
// Pattern 1: HIDE critical actions (create container)
{canCreate && (
  <button onClick={handleCreate}>
    + Create Container
  </button>
)}

// Pattern 2: DISABLE + TOOLTIP common actions (edit container)
<Tooltip 
  content={canUpdate ? '' : getPermissionDenialReason(role, 'containers', 'update')}
  disabled={canUpdate}
>
  <button 
    onClick={handleEdit} 
    disabled={!canUpdate}
    className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
  >
    Edit
  </button>
</Tooltip>

// Pattern 3: HIDE + ALTERNATIVE rare actions (delete)
{canDelete ? (
  <button onClick={handleDelete} className="text-red-600">
    Delete
  </button>
) : (
  <span className="text-sm text-gray-500 italic">
    Contact admin to delete
  </span>
)}

// Pattern 4: FILTER data (view only assigned containers)
const visibleContainers = containers.filter(c => 
  canViewAll || c.instructor_id === currentUserId
);
```

**Visual Design:**

```css
/* Disabled state styling */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none; /* Prevent clicks */
}

/* Tooltip for disabled elements */
.tooltip-wrapper {
  /* Wrap disabled elements to allow tooltip */
  display: inline-block;
}

/* Alternative action hint */
.permission-hint {
  font-size: 0.875rem;
  color: #6b7280; /* gray-500 */
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

**Accessibility:**
```typescript
// Disabled button with ARIA
<button 
  onClick={handleEdit} 
  disabled={!canUpdate}
  aria-disabled={!canUpdate}
  aria-label={canUpdate ? 'Edit container' : `Edit disabled: ${denialReason}`}
  title={!canUpdate ? denialReason : ''}
>
  Edit
</button>
```

---

### 5. Admin vs Super Admin Differences

**Role Comparison:**

| Feature | Super Admin | Admin | Yoga Acharya | Instructor | Rationale |
|---------|-------------|-------|--------------|------------|-----------|
| **View Containers** | All | All | All | Own only | Super Admin = full visibility |
| **Create Container** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | Program setup is admin task |
| **Edit Container** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | Capacity/schedule changes = admin |
| **Delete Container** | ✅ Yes | ❌ No | ❌ No | ❌ No | Destructive, super_admin only |
| **Create Assignment** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | Schedule management = admin |
| **Edit Assignment** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | Reschedule = admin |
| **Delete Assignment** | ✅ Yes | ❌ No | ❌ No | ❌ No | Destructive, super_admin only |
| **Assign Student** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Acharya can assign to existing |
| **Unassign Student** | ✅ Yes | ❌ No | ❌ No | ❌ No | Critical, super_admin only |
| **Export Data** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | Reports = admin level |
| **Import Bulk Data** | ✅ Yes | ❌ No | ❌ No | ❌ No | Data integrity = super_admin |
| **View All Bookings** | ✅ Yes | ✅ Yes | Own only | Own only | Privacy = restrict to assigned |
| **Edit Student Data** | ✅ Yes | ❌ No | ❌ No | ❌ No | PII changes = super_admin |

**Key Differences Explained:**

**1. Deletion Rights (Super Admin Only)**
```typescript
// Why: Prevent accidental data loss from admin actions
// Alternative: Admin can "Archive" instead of "Delete"

const handleDelete = async (id: string) => {
  if (!canDelete) {
    showToast({
      message: 'Only Super Admins can delete containers. You can archive instead.',
      type: 'warning',
      action: { label: 'Archive', onClick: () => handleArchive(id) }
    });
    return;
  }
  // Proceed with delete
};
```

**2. Unassign Rights (Super Admin Only)**
```typescript
// Why: Student reassignment has billing/refund implications
// Alternative: Admin can request unassignment via notification

const handleUnassign = async (bookingId: string) => {
  if (!canUnassign) {
    showToast({
      message: 'Contact a Super Admin to unassign students (billing implications).',
      type: 'warning',
      action: { label: 'Request', onClick: () => sendRequestToAdmin(bookingId) }
    });
    return;
  }
  // Proceed with unassignment
};
```

**3. Data Scope (View Filtering)**
```typescript
// Super Admin: See all containers
// Admin: See all containers
// Yoga Acharya: See containers they're assigned to
// Instructor: See containers they teach

function useFilteredContainers(
  containers: Container[],
  role: UserRole,
  userId: string
) {
  return useMemo(() => {
    if (role === 'super_admin' || role === 'admin') {
      return containers; // See all
    }

    if (role === 'yoga_acharya' || role === 'instructor') {
      // Filter to assigned containers only
      return containers.filter(c => 
        c.instructor_id === userId || 
        c.created_by === userId
      );
    }

    return []; // No access
  }, [containers, role, userId]);
}
```

**4. Import/Export (Super Admin Only)**
```typescript
// Why: Bulk operations can corrupt data if misused
// Alternative: Admin can export individual reports

{canImport && (
  <button onClick={handleBulkImport}>
    Import CSV
  </button>
)}

{canExport && (
  <button onClick={handleExport}>
    {canImport ? 'Export All Data' : 'Export Report'}
  </button>
)}
```

---

### 6. Custom Hook: usePermissions()

**Decision:** Create React hook for component-level permission checks

```typescript
// src/shared/hooks/usePermissions.ts

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Or your auth context
import { getResourcePermissions, getPermissionDenialReason } from '@/shared/utils/permissions';
import type { PermissionResource, PermissionAction } from '@/shared/utils/permissions';

interface UsePermissionsResult {
  // Boolean checks
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  canExport: boolean;
  canImport: boolean;

  // Helper functions
  can: (action: PermissionAction) => boolean;
  cannot: (action: PermissionAction) => boolean;
  getDenialReason: (action: PermissionAction) => string;
  
  // Metadata
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function usePermissions(resource: PermissionResource): UsePermissionsResult {
  const { user } = useAuth(); // Get current user from context
  const role = user?.role || 'user';

  const permissions = useMemo(() => {
    return getResourcePermissions(role, resource);
  }, [role, resource]);

  const can = (action: PermissionAction) => {
    return permissions[`can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof typeof permissions] as boolean;
  };

  const cannot = (action: PermissionAction) => !can(action);

  const getDenialReason = (action: PermissionAction) => {
    return getPermissionDenialReason(role, resource, action);
  };

  return {
    ...permissions,
    can,
    cannot,
    getDenialReason,
    role,
    isAdmin: role === 'admin',
    isSuperAdmin: role === 'super_admin',
  };
}

// Usage in components:
function ClassesDashboard() {
  const { canCreate, canDelete, canExport, getDenialReason } = usePermissions('containers');
  
  return (
    <div>
      {/* Hide create button if no permission */}
      {canCreate && (
        <button onClick={handleCreate}>+ Create Container</button>
      )}
      
      {/* Disable delete with tooltip */}
      <Tooltip content={getDenialReason('delete')} disabled={canDelete}>
        <button disabled={!canDelete}>Delete</button>
      </Tooltip>
      
      {/* Show export only if permitted */}
      {canExport && (
        <button onClick={handleExport}>Export CSV</button>
      )}
    </div>
  );
}
```

---

### 7. Testing Strategy

**Unit Tests (Jest):**

```typescript
// __tests__/permissions.test.ts

import { 
  hasPermission, 
  getResourcePermissions, 
  getPermissionDenialReason 
} from '@/shared/utils/permissions';

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('super_admin has all permissions on containers', () => {
      expect(hasPermission('super_admin', 'containers', 'view')).toBe(true);
      expect(hasPermission('super_admin', 'containers', 'create')).toBe(true);
      expect(hasPermission('super_admin', 'containers', 'delete')).toBe(true);
    });

    it('admin cannot delete containers', () => {
      expect(hasPermission('admin', 'containers', 'delete')).toBe(false);
    });

    it('yoga_acharya can assign but not create', () => {
      expect(hasPermission('yoga_acharya', 'containers', 'assign')).toBe(true);
      expect(hasPermission('yoga_acharya', 'containers', 'create')).toBe(false);
    });

    it('instructor has read-only access', () => {
      expect(hasPermission('instructor', 'containers', 'view')).toBe(true);
      expect(hasPermission('instructor', 'containers', 'create')).toBe(false);
      expect(hasPermission('instructor', 'containers', 'assign')).toBe(false);
    });

    it('unknown role defaults to no permissions', () => {
      expect(hasPermission('user', 'containers', 'view')).toBe(false);
    });
  });

  describe('getResourcePermissions', () => {
    it('returns all permission flags for admin', () => {
      const perms = getResourcePermissions('admin', 'containers');
      expect(perms).toEqual({
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: false,
        canAssign: true,
        canUnassign: false,
        canExport: true,
        canImport: false,
      });
    });
  });

  describe('getPermissionDenialReason', () => {
    it('returns contextual message for admin delete', () => {
      const reason = getPermissionDenialReason('admin', 'containers', 'delete');
      expect(reason).toContain('Super Admin');
      expect(reason).toContain('delete');
    });

    it('returns empty string if permission granted', () => {
      const reason = getPermissionDenialReason('super_admin', 'containers', 'delete');
      expect(reason).toBe('');
    });
  });
});
```

**Integration Tests (React Testing Library):**

```typescript
// __tests__/ClassesDashboard.test.tsx

import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import ClassesDashboard from '@/features/dashboard/components/Modules/ClassesV2/ClassesDashboard';

const mockUser = (role: string) => ({
  id: '123',
  role,
  email: 'test@example.com',
  name: 'Test User',
});

describe('ClassesDashboard Permissions', () => {
  it('super_admin sees create and delete buttons', () => {
    render(
      <AuthProvider value={{ user: mockUser('super_admin') }}>
        <ClassesDashboard />
      </AuthProvider>
    );

    expect(screen.getByText('+ Create Container')).toBeInTheDocument();
    expect(screen.getByText('Delete')).not.toBeDisabled();
  });

  it('admin sees create but delete is disabled', () => {
    render(
      <AuthProvider value={{ user: mockUser('admin') }}>
        <ClassesDashboard />
      </AuthProvider>
    );

    expect(screen.getByText('+ Create Container')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('yoga_acharya does not see create button', () => {
    render(
      <AuthProvider value={{ user: mockUser('yoga_acharya') }}>
        <ClassesDashboard />
      </AuthProvider>
    );

    expect(screen.queryByText('+ Create Container')).not.toBeInTheDocument();
    expect(screen.getByText('Assign Students')).toBeInTheDocument();
  });

  it('instructor sees read-only view', () => {
    render(
      <AuthProvider value={{ user: mockUser('instructor') }}>
        <ClassesDashboard />
      </AuthProvider>
    );

    expect(screen.queryByText('+ Create Container')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Assign Students')).not.toBeInTheDocument();
  });
});
```

**Manual Testing Checklist:**

```markdown
## Permission Testing Checklist

### Super Admin
- [ ] Can view all containers
- [ ] Can create container
- [ ] Can edit any container
- [ ] Can delete container (with confirmation)
- [ ] Can assign students
- [ ] Can unassign students
- [ ] Can create assignments
- [ ] Can delete assignments
- [ ] Can export data
- [ ] Can import CSV

### Admin
- [ ] Can view all containers
- [ ] Can create container
- [ ] Can edit any container
- [ ] Delete button is disabled with tooltip explaining why
- [ ] Can assign students
- [ ] Unassign button is disabled with tooltip
- [ ] Can create assignments
- [ ] Delete assignment button is disabled
- [ ] Can export data
- [ ] Import button is hidden

### Yoga Acharya
- [ ] Can view assigned containers only
- [ ] Create button is hidden
- [ ] Edit button is hidden
- [ ] Delete button is hidden
- [ ] Can assign students to existing containers
- [ ] Cannot unassign students
- [ ] Cannot create/edit/delete assignments
- [ ] Export button is hidden

### Instructor
- [ ] Can view assigned containers only
- [ ] All action buttons are hidden (read-only)
- [ ] Can see student list but not edit
- [ ] Can see assignment details but not modify
- [ ] No create/edit/delete options available

### Edge Cases
- [ ] User with no role defaults to no permissions
- [ ] Changing role refreshes permissions immediately
- [ ] Tooltips show helpful messages for disabled actions
- [ ] API calls fail gracefully if frontend check bypassed
- [ ] Audit log records permission-denied attempts
```

---

### 8. Implementation Summary for Task 4.6

**Files to Create:**

1. **src/shared/utils/permissions.ts** (250 lines)
   - PERMISSIONS matrix
   - hasPermission() function
   - getResourcePermissions() function
   - getPermissionDenialReason() function
   - checkPermissions() function

2. **src/shared/hooks/usePermissions.ts** (60 lines)
   - usePermissions() hook
   - Returns: canView, canCreate, canUpdate, canDelete, canAssign, canUnassign, canExport, canImport
   - Returns: can(), cannot(), getDenialReason() helpers

3. **src/shared/components/ui/PermissionTooltip.tsx** (40 lines)
   - Wrapper component for disabled elements with tooltips
   - Handles pointer-events for disabled buttons

**Files to Update:**

1. **src/shared/config/roleConfig.ts**
   - Add 'ClassesDashboard' to DashboardModule type
   - Add ClassesDashboard to MODULES_CONFIG for super_admin and admin roles

2. **src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx** (Task 4.7)
   - Import usePermissions('containers')
   - Conditionally render create button
   - Disable/hide edit/delete buttons based on permissions

**Key Design Principles:**
- ✅ Deny by default (missing permission = false)
- ✅ Context-aware tooltips (explain why blocked)
- ✅ Progressive disclosure (hide rare features, disable common ones)
- ✅ TypeScript safety (enums for actions/resources)
- ✅ Easy to test (pure functions + hook testing)
- ✅ Audit-friendly (log permission denials)

---

### Task 4.6: Implement Permission Utilities

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

### Task 5.1: Assignment List Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design assignment list component
- [x] **Deliverable:** AssignmentList specification
- [x] **Prompt:** "Design AssignmentList: Display format (table vs cards vs timeline)? Default sort (date asc/desc)? Grouping by week/month or flat? Inline actions or menu? Virtual scrolling for long lists? Mobile vs desktop differences?"
- [x] **Output Location:** Comment for Task 5.2
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 5.1 Deliverable: AssignmentList Design Specification

### 1. Overview

**Purpose:** Display and manage class assignments (scheduled sessions) within a container/program

**Key Requirements:**
- Show all assignments for a container with date/time/instructor
- Support sorting, filtering, and grouping
- Provide quick actions (edit, delete, view details)
- Handle large lists efficiently (100+ assignments)
- Responsive design for mobile and desktop
- Accessibility compliant

**Design Principle:** **Clarity first, density second** — prioritize readability over cramming info

---

### 2. Display Format Decision: Hybrid (Cards on Mobile, Table on Desktop)

**Comparison:**

| Format | Pros | Cons | Best For |
|--------|------|------|----------|
| **Table** | ✅ Dense, scannable<br>✅ Good for sorting columns<br>✅ Familiar pattern | ❌ Poor on mobile<br>❌ Less visual hierarchy<br>❌ Harder to show status colors | Desktop, power users |
| **Cards** | ✅ Mobile-friendly<br>✅ Visual hierarchy<br>✅ Status colors prominent | ❌ Less dense<br>❌ Harder to compare rows<br>❌ Takes more vertical space | Mobile, visual focus |
| **Timeline** | ✅ Chronological clarity<br>✅ Great for scheduling<br>✅ Shows gaps/overlaps | ❌ Complex to implement<br>❌ Hard to scan long lists<br>❌ Requires horizontal scroll | Calendar view (future) |

**Decision:** **Responsive hybrid** — Table on desktop (≥768px), Cards on mobile

**Rationale:**
- Desktop users benefit from table density and sorting
- Mobile users need touch-friendly cards
- Timeline view can be added later as optional "Calendar" mode

---

### 3. Display Format Implementation

#### Desktop Table View (≥768px)

```tsx
<table className="assignment-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Time</th>
      <th>Instructor</th>
      <th>Status</th>
      <th>Enrolled</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Mon, Jan 20, 2026</td>
      <td>10:00 AM - 11:30 AM IST</td>
      <td>Priya Sharma</td>
      <td><Badge variant="success">Scheduled</Badge></td>
      <td>12 / 20</td>
      <td>
        <ActionMenu>
          <MenuItem onClick={handleEdit}>Edit</MenuItem>
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
          <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
        </ActionMenu>
      </td>
    </tr>
  </tbody>
</table>
```

**Columns:**
1. **Date** (sortable) — Full date with day name
2. **Time** (sortable) — Start-End with timezone
3. **Instructor** (filterable) — Name with avatar (optional)
4. **Status** (filterable) — Badge (Scheduled, Completed, Cancelled, Rescheduled)
5. **Enrolled** (sortable) — Current / Capacity
6. **Actions** — Dropdown menu (Edit, Delete, View)

#### Mobile Card View (<768px)

```tsx
<div className="assignment-card">
  <div className="card-header">
    <Badge variant="success">Scheduled</Badge>
    <ActionMenu />
  </div>
  <div className="card-body">
    <h3>Mon, Jan 20, 2026</h3>
    <p className="time">10:00 AM - 11:30 AM IST</p>
    <div className="instructor">
      <Avatar src="..." />
      <span>Priya Sharma</span>
    </div>
    <div className="enrollment">
      <ProgressBar value={12} max={20} />
      <span>12 / 20 enrolled</span>
    </div>
  </div>
  <div className="card-footer">
    <button onClick={handleEdit}>Edit</button>
    <button onClick={handleViewDetails}>Details</button>
  </div>
</div>
```

**Card Layout:**
- Header: Status badge + action menu
- Body: Date (prominent), Time, Instructor, Enrollment progress
- Footer: Primary actions (Edit, Details)

---

### 4. Default Sort: Date Ascending (Chronological)

**Decision:** Sort by **class_date ASC, start_time ASC** by default

**Rationale:**
- Most common use case: "What's the next class?"
- Chronological order matches mental model
- Aligns with calendar/schedule thinking

**Sort Options:**
1. **Date (Upcoming First)** — Default, shows next classes first
2. **Date (Recent First)** — For reviewing past classes
3. **Instructor (A-Z)** — Group by instructor
4. **Enrollment (High-Low)** — Find full classes
5. **Status (Scheduled → Completed → Cancelled)** — By lifecycle

**Implementation:**
```tsx
const [sortBy, setSortBy] = useState<'date' | 'instructor' | 'enrollment' | 'status'>('date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

const sortedAssignments = useMemo(() => {
  return [...assignments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const dateCompare = new Date(a.class_date).getTime() - new Date(b.class_date).getTime();
        if (dateCompare !== 0) return sortOrder === 'asc' ? dateCompare : -dateCompare;
        // Tie-breaker: start time
        return sortOrder === 'asc' 
          ? a.start_time.localeCompare(b.start_time)
          : b.start_time.localeCompare(a.start_time);
      case 'instructor':
        return sortOrder === 'asc'
          ? a.instructor_name.localeCompare(b.instructor_name)
          : b.instructor_name.localeCompare(a.instructor_name);
      case 'enrollment':
        const aEnrolled = a.enrolled_count / a.capacity;
        const bEnrolled = b.enrolled_count / b.capacity;
        return sortOrder === 'asc' ? aEnrolled - bEnrolled : bEnrolled - aEnrolled;
      case 'status':
        const statusOrder = { scheduled: 1, completed: 2, cancelled: 3, rescheduled: 4 };
        return sortOrder === 'asc'
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      default:
        return 0;
    }
  });
}, [assignments, sortBy, sortOrder]);
```

---

### 5. Grouping Strategy: Optional Week/Month Grouping

**Decision:** **Flat list by default, optional grouping toggle**

**Rationale:**
- Flat list is simpler, faster to scan
- Grouping adds visual hierarchy but more complexity
- Let users choose based on preference

**Grouping Options:**
1. **None (Flat)** — Default, shows all assignments in one list
2. **By Week** — Group by ISO week (Mon-Sun)
3. **By Month** — Group by calendar month
4. **By Instructor** — Group by instructor name

**Grouped Display:**

```tsx
<div className="assignment-list-grouped">
  <section className="week-group">
    <h3 className="group-header">
      Week of Jan 20 - Jan 26, 2026
      <span className="count">(8 classes)</span>
    </h3>
    <div className="group-items">
      {/* Assignment cards/rows */}
    </div>
  </section>
  
  <section className="week-group">
    <h3 className="group-header">
      Week of Jan 27 - Feb 2, 2026
      <span className="count">(7 classes)</span>
    </h3>
    <div className="group-items">
      {/* Assignment cards/rows */}
    </div>
  </section>
</div>
```

**Group Header Features:**
- Collapse/expand toggle (save state in localStorage)
- Assignment count per group
- Quick actions per group (e.g., "Mark all complete")

**Implementation:**
```tsx
const [groupBy, setGroupBy] = useState<'none' | 'week' | 'month' | 'instructor'>('none');
const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

const groupedAssignments = useMemo(() => {
  if (groupBy === 'none') return { 'all': sortedAssignments };
  
  return sortedAssignments.reduce((groups, assignment) => {
    let key: string;
    switch (groupBy) {
      case 'week':
        const weekStart = startOfWeek(parseISO(assignment.class_date));
        key = format(weekStart, 'yyyy-MM-dd');
        break;
      case 'month':
        key = format(parseISO(assignment.class_date), 'yyyy-MM');
        break;
      case 'instructor':
        key = assignment.instructor_id;
        break;
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(assignment);
    return groups;
  }, {} as Record<string, Assignment[]>);
}, [sortedAssignments, groupBy]);
```

---

### 6. Actions: Inline Quick Actions + Overflow Menu

**Decision:** **Hybrid approach** — common actions inline, less common in menu

**Desktop Table Actions:**
- **Inline:** Edit icon, Delete icon (for super_admin)
- **Menu (3 dots):** View Details, Duplicate, Mark Complete, Cancel, Reschedule

**Mobile Card Actions:**
- **Inline:** Edit button, Details button
- **Menu (3 dots):** Delete, Duplicate, Mark Complete, Cancel, Reschedule

**Action Patterns:**

```tsx
// Desktop table row actions
<td className="actions">
  {canUpdate && (
    <IconButton icon={Edit} onClick={() => handleEdit(assignment)} title="Edit" />
  )}
  {canDelete && (
    <IconButton icon={Trash} onClick={() => handleDelete(assignment)} title="Delete" />
  )}
  <ActionMenu>
    <MenuItem onClick={() => handleViewDetails(assignment)}>View Details</MenuItem>
    {canCreate && <MenuItem onClick={() => handleDuplicate(assignment)}>Duplicate</MenuItem>}
    {assignment.status === 'scheduled' && (
      <>
        <MenuItem onClick={() => handleMarkComplete(assignment)}>Mark Complete</MenuItem>
        <MenuItem onClick={() => handleCancel(assignment)}>Cancel</MenuItem>
        <MenuItem onClick={() => handleReschedule(assignment)}>Reschedule</MenuItem>
      </>
    )}
  </ActionMenu>
</td>

// Mobile card actions
<div className="card-footer">
  <Button variant="outline" onClick={() => handleEdit(assignment)}>Edit</Button>
  <Button variant="outline" onClick={() => handleViewDetails(assignment)}>Details</Button>
  <ActionMenu>
    {/* Same menu items as desktop */}
  </ActionMenu>
</div>
```

**Permission-Based Actions:**
- **Edit:** canUpdate (admin, super_admin)
- **Delete:** canDelete (super_admin only)
- **Duplicate:** canCreate (admin, super_admin)
- **Mark Complete:** canUpdate (admin, super_admin)
- **Cancel/Reschedule:** canUpdate (admin, super_admin)

---

### 7. Virtual Scrolling: Use for 100+ Items

**Decision:** Implement virtual scrolling for lists with **50+ assignments**

**Rationale:**
- Most containers have <50 assignments → no virtualization needed
- 100+ assignments (e.g., year-long programs) benefit from virtualization
- Use react-window or react-virtual for efficient rendering

**Threshold Logic:**
```tsx
const VIRTUALIZATION_THRESHOLD = 50;

const shouldVirtualize = sortedAssignments.length > VIRTUALIZATION_THRESHOLD;

return shouldVirtualize ? (
  <VirtualizedList
    items={sortedAssignments}
    itemHeight={isMobile ? 160 : 60}
    height={600}
    renderItem={(assignment) => <AssignmentRow assignment={assignment} />}
  />
) : (
  <div className="assignment-list">
    {sortedAssignments.map(assignment => (
      <AssignmentRow key={assignment.id} assignment={assignment} />
    ))}
  </div>
);
```

**Virtual Scrolling Implementation (react-window):**

```tsx
import { FixedSizeList as List } from 'react-window';

function VirtualizedAssignmentList({ assignments }: Props) {
  const { isMobile } = useMobileDetect();
  const itemHeight = isMobile ? 160 : 60;
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const assignment = assignments[index];
    return (
      <div style={style}>
        <AssignmentRow assignment={assignment} />
      </div>
    );
  };
  
  return (
    <List
      height={600}
      itemCount={assignments.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

**Performance Benefits:**
- Only render visible items (~10-15 rows)
- Smooth scrolling even with 1000+ assignments
- Reduced memory usage

**Trade-offs:**
- Slightly more complex code
- Need fixed item heights (or use react-virtual for dynamic heights)
- Search (Ctrl+F) doesn't work on non-rendered items

**Alternative:** If list rarely exceeds 100 items, skip virtualization and use pagination instead.

---

### 8. Mobile vs Desktop Differences

**Summary Table:**

| Feature | Desktop (≥768px) | Mobile (<768px) |
|---------|-----------------|-----------------|
| **Layout** | Table | Cards |
| **Density** | High (60px rows) | Medium (160px cards) |
| **Actions** | Inline icons + menu | Buttons + menu |
| **Sorting** | Column headers (clickable) | Dropdown select |
| **Grouping** | Optional sections | Optional sections |
| **Filters** | Sidebar or top bar | Bottom sheet or modal |
| **Empty State** | Centered message + button | Centered message + FAB |
| **Virtualization** | 50+ items | 50+ items |

**Mobile-Specific Optimizations:**

1. **Touch Targets:** Minimum 44x44px for buttons/links
2. **Swipe Gestures:** Swipe left on card → quick delete (super_admin only)
3. **Pull-to-Refresh:** Refresh assignment list
4. **FAB (Floating Action Button):** Quick "Create Assignment" at bottom-right
5. **Bottom Sheet:** Filters and sort options slide up from bottom

**Desktop-Specific Features:**

1. **Keyboard Shortcuts:**
   - `↑`/`↓` — Navigate rows
   - `Enter` — Open details
   - `E` — Edit selected
   - `D` — Delete selected (with confirmation)
2. **Multi-Select:** Checkbox column for bulk actions
3. **Column Resize:** Drag column borders to adjust width
4. **Hover States:** Show actions on row hover

**Responsive Breakpoints:**
- **Mobile:** < 768px (cards)
- **Tablet:** 768px - 1024px (table with reduced columns)
- **Desktop:** ≥1024px (full table)

---

### 9. Additional Features

#### Search & Filters

```tsx
<div className="list-controls">
  <SearchInput
    placeholder="Search by instructor, date..."
    value={searchQuery}
    onChange={setSearchQuery}
  />
  
  <FilterBar>
    <FilterSelect
      label="Instructor"
      options={instructorOptions}
      value={instructorFilter}
      onChange={setInstructorFilter}
    />
    <FilterSelect
      label="Status"
      options={statusOptions}
      value={statusFilter}
      onChange={setStatusFilter}
    />
    <FilterDateRange
      label="Date Range"
      startDate={startDate}
      endDate={endDate}
      onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
    />
  </FilterBar>
</div>
```

#### Empty States

```tsx
// No assignments exist
<EmptyState
  icon={Calendar}
  title="No classes scheduled"
  description="Create your first class to get started."
  action={
    canCreate ? (
      <Button onClick={handleCreate}>Create Class</Button>
    ) : null
  }
/>

// Filtered results empty
<EmptyState
  icon={Search}
  title="No classes match your filters"
  description="Try adjusting your search or filters."
  action={<Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>}
/>
```

#### Loading States

```tsx
// Initial load
<div className="assignment-list-skeleton">
  {Array.from({ length: 5 }).map((_, i) => (
    <SkeletonRow key={i} />
  ))}
</div>

// Refetch/pagination
<div className="loading-indicator">
  <Spinner size="sm" /> Updating...
</div>
```

---

### 10. Component Structure

```tsx
// Main component
interface AssignmentListProps {
  containerId: string;
  assignments: Assignment[];
  loading?: boolean;
  error?: string | null;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  onCreate: () => void;
  onRefresh?: () => void;
}

function AssignmentList({
  containerId,
  assignments,
  loading,
  error,
  onEdit,
  onDelete,
  onCreate,
  onRefresh
}: AssignmentListProps) {
  const { isMobile } = useMobileDetect();
  const { canCreate, canUpdate, canDelete } = usePermissions('assignments');
  
  // State
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [instructorFilter, setInstructorFilter] = useState<string | null>(null);
  
  // Computed
  const filteredAssignments = useFilteredAssignments(assignments, { searchQuery, statusFilter, instructorFilter });
  const sortedAssignments = useSortedAssignments(filteredAssignments, { sortBy, sortOrder });
  const groupedAssignments = useGroupedAssignments(sortedAssignments, { groupBy });
  
  // Render
  if (loading && assignments.length === 0) return <AssignmentListSkeleton />;
  if (error) return <ErrorState error={error} onRetry={onRefresh} />;
  if (filteredAssignments.length === 0) {
    return searchQuery || statusFilter || instructorFilter
      ? <EmptyFilteredState onClearFilters={handleClearFilters} />
      : <EmptyState onCreate={canCreate ? onCreate : undefined} />;
  }
  
  return (
    <div className="assignment-list">
      <ListControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={setSortOrder}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        instructorFilter={instructorFilter}
        onInstructorFilterChange={setInstructorFilter}
      />
      
      {isMobile ? (
        <AssignmentCardList
          assignments={groupedAssignments}
          onEdit={canUpdate ? onEdit : undefined}
          onDelete={canDelete ? onDelete : undefined}
        />
      ) : (
        <AssignmentTable
          assignments={groupedAssignments}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(field) => {
            if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            else { setSortBy(field); setSortOrder('asc'); }
          }}
          onEdit={canUpdate ? onEdit : undefined}
          onDelete={canDelete ? onDelete : undefined}
        />
      )}
      
      {isMobile && canCreate && (
        <FAB onClick={onCreate} icon={Plus} label="Create Class" />
      )}
    </div>
  );
}
```

---

## 🎯 Summary for Task 5.2 (Implementation)

**Implementation Checklist:**

1. **Create Main Component:**
   - `AssignmentList.tsx` — Main container with controls
   - Props: `assignments[]`, `onEdit`, `onDelete`, `onCreate`, `onRefresh`

2. **Create Subcomponents:**
   - `AssignmentTable.tsx` — Desktop table view
   - `AssignmentCardList.tsx` — Mobile card list
   - `AssignmentRow.tsx` — Single table row
   - `AssignmentCard.tsx` — Single mobile card
   - `ListControls.tsx` — Search, sort, filter, group controls
   - `AssignmentListSkeleton.tsx` — Loading skeleton

3. **Custom Hooks:**
   - `useFilteredAssignments()` — Apply search and filters
   - `useSortedAssignments()` — Apply sorting
   - `useGroupedAssignments()` — Apply grouping

4. **Implement Features:**
   - ✅ Search by instructor/date
   - ✅ Sort by date/instructor/enrollment/status
   - ✅ Filter by status/instructor/date range
   - ✅ Group by none/week/month/instructor
   - ✅ Virtual scrolling for 50+ items
   - ✅ Responsive (table on desktop, cards on mobile)
   - ✅ Permission-based actions
   - ✅ Empty states (no data, no filtered results)
   - ✅ Loading states (skeleton, spinner)
   - ✅ Error states (retry button)

5. **Styling:**
   - Tailwind classes for layout
   - Status badge colors (Scheduled: green, Completed: blue, Cancelled: red, Rescheduled: yellow)
   - Hover states for desktop
   - Touch-friendly sizes for mobile
   - Focus states for accessibility

6. **Accessibility:**
   - ARIA labels for sort buttons
   - Keyboard navigation (arrow keys)
   - Screen reader announcements for state changes
   - Focus trap in action menu

**Key Design Decisions:**
- **Display:** Hybrid (table on desktop, cards on mobile)
- **Sort:** Date ascending by default
- **Grouping:** Optional (none by default)
- **Actions:** Inline quick actions + overflow menu
- **Virtual Scrolling:** Yes, for 50+ items
- **Mobile:** Cards with FAB, swipe gestures optional

**File Locations:**
- Main: `src/features/dashboard/components/Modules/ClassesV2/components/AssignmentList.tsx`
- Subcomponents: `src/features/dashboard/components/Modules/ClassesV2/components/assignment/`
- Hooks: `src/features/dashboard/components/Modules/ClassesV2/hooks/`

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

### Task 5.3: Assignment Form Logic Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1.5 hours
- [x] **Dependencies:** None
- [x] **Description:** Design assignment form logic
- [x] **Deliverable:** AssignmentForm specification
- [x] **Prompt:** "Design AssignmentForm: Date/time pickers (native HTML5 or library)? Timezone dropdown (all or common)? Instructor field (how to indicate required if not at program level)? Meeting link (manual or auto-generate indicator)? Validation timing (real-time conflicts or on submit)? Optimistic update?"
- [x] **Output Location:** Comment for Task 5.4
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 5.3 Deliverable: AssignmentForm Design Specification

### 1. Overview

**Purpose:** Create/edit class assignments (scheduled sessions) within a container/program

**Key Requirements:**
- Support both create and edit modes
- Validate instructor availability (conflict checking)
- Handle timezone-aware scheduling
- Manage meeting link generation/storage
- Provide real-time validation feedback
- Support optimistic UI updates
- Accessible and mobile-responsive

**Design Principle:** **Progressive disclosure with smart defaults** — minimize cognitive load, guide users with contextual help

---

### 2. Form Fields & Implementation

#### 2.1 Date Picker

**Decision:** **Native HTML5 `<input type="date">`** with fallback library for older browsers

**Rationale:**
- ✅ Native mobile keyboard optimized for date entry
- ✅ Consistent with OS date picker UX
- ✅ No external library dependency (smaller bundle)
- ✅ Accessible by default
- ⚠️ Fallback needed for Safari < 14.1 (use date-fns + custom input)

**Implementation:**

```tsx
interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  error?: string;
}

function DatePicker({ value, onChange, minDate, maxDate, disabled, error }: DatePickerProps) {
  const supportsDateInput = useSupportsDateInput();
  
  return (
    <div className="form-field">
      <label htmlFor="class-date" className="form-label">
        Class Date <span className="text-red-500">*</span>
      </label>
      {supportsDateInput ? (
        <input
          type="date"
          id="class-date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={minDate || format(new Date(), 'yyyy-MM-dd')} // Default: today
          max={maxDate}
          disabled={disabled}
          className={`form-input ${error ? 'border-red-500' : ''}`}
          required
        />
      ) : (
        <CustomDatePicker
          value={value}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
        />
      )}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <p className="text-sm text-gray-500 mt-1">
        Select the date for this class session
      </p>
    </div>
  );
}
```

**Smart Defaults:**
- Create mode: Default to next available weekday (skip weekends if program is weekday-only)
- Edit mode: Pre-fill with existing date
- Min date: Today (cannot schedule in past)
- Max date: Container end_date (if defined)

---

#### 2.2 Time Pickers (Start/End)

**Decision:** **Native HTML5 `<input type="time">`** with 15-minute increments

**Rationale:**
- ✅ Native mobile keyboard with time wheel
- ✅ Consistent UX across platforms
- ✅ Automatic AM/PM formatting per locale
- ✅ No library needed
- ⚠️ Fallback for older browsers (use select dropdowns)

**Implementation:**

```tsx
function TimePicker({ 
  label, 
  value, 
  onChange, 
  disabled, 
  error 
}: TimePickerProps) {
  return (
    <div className="form-field">
      <label htmlFor={`time-${label}`} className="form-label">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type="time"
        id={`time-${label}`}
        value={value} // HH:MM format (24-hour)
        onChange={(e) => onChange(e.target.value)}
        step="900" // 15-minute increments (900 seconds)
        disabled={disabled}
        className={`form-input ${error ? 'border-red-500' : ''}`}
        required
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// Usage in form
function AssignmentForm() {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    // Auto-adjust end time if invalid
    if (time >= endTime) {
      const newEndTime = addMinutes(parseTime(time), 60);
      setEndTime(format(newEndTime, 'HH:mm'));
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <TimePicker 
        label="Start Time" 
        value={startTime} 
        onChange={handleStartTimeChange} 
      />
      <TimePicker 
        label="End Time" 
        value={endTime} 
        onChange={setEndTime}
        error={endTime <= startTime ? 'End time must be after start time' : undefined}
      />
    </div>
  );
}
```

**Smart Defaults:**
- Create mode: Use container default times (if set), else 9:00 AM - 10:00 AM
- Edit mode: Pre-fill with existing times
- Auto-adjust: If user sets start time after end time, add 1 hour to start time for new end time
- Validation: End time must be > start time + 15 minutes (minimum class duration)

---

#### 2.3 Timezone Dropdown

**Decision:** **Common timezones (top 20)** with "All Timezones" expandable option

**Rationale:**
- ✅ 95% of users use 10-15 common timezones (US, Europe, Asia major cities)
- ✅ Reduces choice overload (600+ timezones globally)
- ✅ Faster selection with grouped list
- ✅ Search/filter available for power users
- ⚠️ Must store IANA timezone ID (e.g., 'America/New_York'), not abbreviation (EST ambiguous)

**Implementation:**

```tsx
const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: 'UTC-10' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: 'UTC+11' },
];

function TimezoneSelect({ value, onChange, disabled }: TimezoneSelectProps) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const filteredTimezones = showAll
    ? ALL_TIMEZONES.filter(tz => 
        tz.label.toLowerCase().includes(search.toLowerCase())
      )
    : COMMON_TIMEZONES;
  
  return (
    <div className="form-field">
      <label htmlFor="timezone" className="form-label">
        Timezone <span className="text-red-500">*</span>
      </label>
      
      {showAll && (
        <input
          type="text"
          placeholder="Search timezones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input mb-2"
        />
      )}
      
      <select
        id="timezone"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="form-input"
        required
      >
        <option value="">Select timezone</option>
        {!showAll && (
          <option value={userTimezone} className="font-semibold">
            {userTimezone} (Your timezone)
          </option>
        )}
        {filteredTimezones.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label} - {tz.offset}
          </option>
        ))}
      </select>
      
      <button
        type="button"
        onClick={() => setShowAll(!showAll)}
        className="text-sm text-blue-600 hover:underline mt-1"
      >
        {showAll ? 'Show common only' : 'Show all timezones'}
      </button>
      
      <p className="text-sm text-gray-500 mt-1">
        Class time will be shown in this timezone
      </p>
    </div>
  );
}
```

**Smart Defaults:**
- Create mode: Default to container timezone (if set), else user's browser timezone
- Edit mode: Pre-fill with existing timezone
- Highlight user's current timezone at top of list
- Show current time in selected timezone (live preview)

---

#### 2.4 Instructor Field

**Decision:** **Conditional required** — Required if not set at container level, pre-filled if set

**Rationale:**
- ✅ Containers can have a default instructor (program taught by one person)
- ✅ Multi-instructor programs need per-assignment instructor selection
- ✅ Clear visual indicator when field is pre-filled vs required input
- ✅ Support instructor override even when default is set

**Implementation:**

```tsx
interface InstructorSelectProps {
  value: string | null;
  onChange: (instructorId: string) => void;
  containerInstructor?: { id: string; name: string } | null;
  disabled?: boolean;
  error?: string;
}

function InstructorSelect({ 
  value, 
  onChange, 
  containerInstructor, 
  disabled, 
  error 
}: InstructorSelectProps) {
  const { data: instructors } = useInstructors(); // Fetch all instructors
  const isRequired = !containerInstructor;
  
  return (
    <div className="form-field">
      <label htmlFor="instructor" className="form-label">
        Instructor {isRequired && <span className="text-red-500">*</span>}
      </label>
      
      {containerInstructor && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-900">
              Default instructor: <strong>{containerInstructor.name}</strong>
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Change below to assign a different instructor for this class
          </p>
        </div>
      )}
      
      <select
        id="instructor"
        value={value || containerInstructor?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`form-input ${error ? 'border-red-500' : ''}`}
        required={isRequired}
      >
        <option value="">
          {isRequired ? 'Select instructor' : 'Use program default'}
        </option>
        {instructors?.map(instructor => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.name}
            {instructor.id === containerInstructor?.id && ' (Default)'}
          </option>
        ))}
      </select>
      
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
```

**Visual Indicators:**
- Blue info box when container has default instructor
- "(Default)" tag next to default instructor in dropdown
- Gray placeholder "Use program default" when default exists
- Red asterisk only when field is required (no container default)

---

#### 2.5 Meeting Link

**Decision:** **Manual entry with auto-generate helper** — Show button to generate, allow override

**Rationale:**
- ✅ Some instructors use consistent Zoom/Meet links (personal room)
- ✅ Some generate unique links per class (security/analytics)
- ✅ Flexibility to paste external links (YouTube Live, etc.)
- ✅ Auto-generate reduces friction for most common case
- ⚠️ Backend integration needed for Zoom API (future enhancement)

**Implementation:**

```tsx
function MeetingLinkField({ value, onChange, disabled }: MeetingLinkFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateMeetingLink } = useMeetingLinkGenerator(); // Hook for Zoom/Meet API
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const link = await generateMeetingLink({
        topic: `Class on ${format(new Date(), 'MMM d, yyyy')}`,
        duration: 60, // minutes
        start_time: new Date(), // Assignment date/time
      });
      onChange(link);
    } catch (error) {
      console.error('Failed to generate link:', error);
      // Show error toast
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="form-field">
      <label htmlFor="meeting-link" className="form-label">
        Meeting Link (Optional)
      </label>
      
      <div className="flex gap-2">
        <input
          type="url"
          id="meeting-link"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://zoom.us/j/..."
          disabled={disabled}
          className="form-input flex-1"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <Spinner className="w-4 h-4 inline mr-2" />
              Generating...
            </>
          ) : (
            '+ Generate'
          )}
        </button>
      </div>
      
      {value && isValidUrl(value) && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <CheckCircleIcon className="w-4 h-4" />
          <span>Valid meeting link</span>
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Test link
          </a>
        </div>
      )}
      
      <p className="text-sm text-gray-500 mt-1">
        Zoom, Google Meet, or any video conferencing URL
      </p>
    </div>
  );
}
```

**Auto-Generate Logic:**
- **Phase 1 (MVP):** Button disabled, show "Coming soon" tooltip
- **Phase 2:** Integrate with Zoom API (requires OAuth setup)
- **Phase 3:** Support multiple providers (Meet, Teams, etc.)

**Validation:**
- Must be valid URL format (https://)
- Optional field (can be added later)
- Show visual confirmation when valid URL entered

---

#### 2.6 Status Field

**Decision:** **Dropdown with contextual options** — Show only valid state transitions

**Implementation:**

```tsx
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'blue' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'yellow' },
] as const;

function StatusSelect({ value, onChange, isEdit }: StatusSelectProps) {
  const validTransitions = useMemo(() => {
    if (!isEdit) return ['scheduled']; // Create only allows scheduled
    
    // Edit mode: allow state transitions based on current status
    switch (value) {
      case 'scheduled':
        return ['scheduled', 'completed', 'cancelled', 'rescheduled'];
      case 'completed':
        return ['completed']; // Cannot change from completed
      case 'cancelled':
        return ['cancelled', 'rescheduled']; // Can reschedule cancelled class
      case 'rescheduled':
        return ['scheduled', 'rescheduled']; // Can finalize rescheduled
      default:
        return ['scheduled'];
    }
  }, [value, isEdit]);
  
  return (
    <div className="form-field">
      <label htmlFor="status" className="form-label">
        Status
      </label>
      <select
        id="status"
        value={value}
        onChange={(e) => onChange(e.target.value as AssignmentStatus)}
        className="form-input"
        disabled={!isEdit || value === 'completed'} // Completed is immutable
      >
        {STATUS_OPTIONS
          .filter(opt => validTransitions.includes(opt.value))
          .map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        }
      </select>
      
      {value === 'completed' && (
        <p className="text-sm text-gray-500 mt-1">
          Completed classes cannot be edited
        </p>
      )}
    </div>
  );
}
```

**Smart Defaults:**
- Create mode: Always 'scheduled' (no choice)
- Edit mode: Pre-fill with current status, allow valid transitions
- Completed classes: Disable entire form (read-only mode)

---

#### 2.7 Notes/Description Field

**Decision:** **Optional textarea** with 500-character limit

**Implementation:**

```tsx
function NotesField({ value, onChange, disabled }: NotesFieldProps) {
  const maxLength = 500;
  const remaining = maxLength - value.length;
  
  return (
    <div className="form-field">
      <label htmlFor="notes" className="form-label">
        Notes (Optional)
      </label>
      <textarea
        id="notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={3}
        disabled={disabled}
        placeholder="Add any special instructions or notes for this class..."
        className="form-input resize-none"
      />
      <div className="flex justify-between mt-1">
        <p className="text-sm text-gray-500">
          For instructor reference only
        </p>
        <p className={`text-sm ${remaining < 50 ? 'text-orange-600' : 'text-gray-500'}`}>
          {remaining} characters remaining
        </p>
      </div>
    </div>
  );
}
```

---

### 3. Validation Strategy

#### 3.1 Validation Timing

**Decision:** **Hybrid approach** — Field-level on blur + form-level on submit + async conflict check on date/time change

**Rationale:**
- ✅ Immediate feedback prevents frustration (don't wait until submit)
- ✅ On-blur validation doesn't interrupt typing
- ✅ Conflict checking debounced to avoid excessive API calls
- ✅ Final validation on submit catches edge cases

**Validation Layers:**

| Validation Type | When | What | User Feedback |
|-----------------|------|------|---------------|
| **Field-level (sync)** | onBlur | Format, required, range | Inline error below field |
| **Form-level (sync)** | onSubmit | Cross-field (end > start) | Error summary at top |
| **Conflict check (async)** | onChange (debounced 500ms) | Instructor availability | Warning banner (non-blocking) |
| **Server-side** | onSubmit (final) | Business rules, auth | Error modal or inline |

**Implementation:**

```tsx
function AssignmentForm({ assignment, onSubmit }: AssignmentFormProps) {
  const [formData, setFormData] = useState(getInitialValues(assignment));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  
  // Field-level validation (sync)
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'class_date':
        if (!value) return 'Date is required';
        if (new Date(value) < new Date()) return 'Cannot schedule in the past';
        return null;
      case 'start_time':
        if (!value) return 'Start time is required';
        return null;
      case 'end_time':
        if (!value) return 'End time is required';
        if (value <= formData.start_time) return 'End time must be after start time';
        return null;
      case 'instructor_id':
        if (!value && !containerInstructor) return 'Instructor is required';
        return null;
      default:
        return null;
    }
  };
  
  const handleBlur = (field: string) => {
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  // Conflict checking (async, debounced)
  const checkConflicts = useMemo(
    () =>
      debounce(async (date: string, startTime: string, endTime: string, instructorId: string) => {
        if (!date || !startTime || !endTime || !instructorId) return;
        
        setIsCheckingConflicts(true);
        try {
          const result = await ValidationService.checkInstructorConflict({
            instructor_id: instructorId,
            class_date: date,
            start_time: startTime,
            end_time: endTime,
            exclude_assignment_id: assignment?.id, // Don't conflict with self
          });
          setConflicts(result.conflicts || []);
        } catch (error) {
          console.error('Conflict check failed:', error);
        } finally {
          setIsCheckingConflicts(false);
        }
      }, 500),
    [assignment?.id]
  );
  
  useEffect(() => {
    checkConflicts(
      formData.class_date,
      formData.start_time,
      formData.end_time,
      formData.instructor_id
    );
  }, [formData.class_date, formData.start_time, formData.end_time, formData.instructor_id]);
  
  // Form-level validation (sync)
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show error summary
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    // Show conflict warning (non-blocking)
    if (conflicts.length > 0) {
      const confirmed = await showConfirmDialog({
        title: 'Instructor Conflict Detected',
        message: `${formData.instructor_name} has ${conflicts.length} conflicting class(es). Continue anyway?`,
        confirmText: 'Yes, Create Anyway',
        cancelText: 'Go Back',
      });
      if (!confirmed) return;
    }
    
    try {
      await onSubmit(formData);
      toast.success('Class created successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to create class');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Conflict Warning Banner */}
      {conflicts.length > 0 && (
        <ConflictWarningBanner conflicts={conflicts} />
      )}
      
      {/* Form fields... */}
      
      <button type="submit" disabled={isCheckingConflicts}>
        {isCheckingConflicts ? 'Checking availability...' : 'Create Class'}
      </button>
    </form>
  );
}
```

#### 3.2 Conflict Checking UX

**Decision:** **Warning (non-blocking)** — Show conflict details, allow override with confirmation

**Rationale:**
- ✅ Instructors may teach multiple classes simultaneously (co-teaching, backup instructor)
- ✅ Admins should have final authority to override
- ✅ Conflict info helps user make informed decision
- ⚠️ Should log override for audit trail

**Conflict Warning Banner:**

```tsx
function ConflictWarningBanner({ conflicts }: { conflicts: Conflict[] }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Instructor Conflict Detected
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>The selected instructor has {conflicts.length} overlapping class(es):</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {conflicts.map(conflict => (
                <li key={conflict.id}>
                  {format(parseISO(conflict.class_date), 'MMM d')} at{' '}
                  {conflict.start_time} - {conflict.end_time} ({conflict.container_name})
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-sm text-yellow-700">
            You can still create this class, but please verify with the instructor.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Optimistic Updates

**Decision:** **Optimistic UI for edits, pessimistic for creates** — Update UI immediately on edit, wait for server on create

**Rationale:**
- ✅ Edits are low-risk (can rollback), creates can have conflicts
- ✅ Edit feedback feels instant (better UX)
- ✅ Create needs server validation (capacity, conflicts, auth)
- ⚠️ Must handle rollback on edit failure

**Implementation:**

```tsx
// Optimistic update on edit
const handleUpdateAssignment = async (id: string, updates: Partial<Assignment>) => {
  // 1. Optimistically update local state
  setAssignments(prev =>
    prev.map(a => (a.id === id ? { ...a, ...updates } : a))
  );
  
  // 2. Close modal immediately (feels instant)
  setIsEditModalOpen(false);
  
  // 3. Show success toast
  toast.success('Class updated');
  
  try {
    // 4. Send to server in background
    await AssignmentService.updateAssignment(id, updates);
  } catch (error) {
    // 5. Rollback on failure
    setAssignments(prev =>
      prev.map(a => (a.id === id ? originalAssignment : a))
    );
    toast.error('Update failed. Changes reverted.');
  }
};

// Pessimistic create (wait for server)
const handleCreateAssignment = async (data: CreateAssignmentData) => {
  setIsCreating(true);
  
  try {
    // 1. Wait for server response
    const newAssignment = await AssignmentService.createAssignment(data);
    
    // 2. Add to local state after success
    setAssignments(prev => [...prev, newAssignment]);
    
    // 3. Close modal and show success
    setIsCreateModalOpen(false);
    toast.success('Class created successfully');
  } catch (error) {
    // 4. Show error in modal (keep open for user to fix)
    toast.error(error.message || 'Failed to create class');
  } finally {
    setIsCreating(false);
  }
};
```

---

### 5. Form Modes & Layouts

#### 5.1 Create Mode

**Layout:** Two-column on desktop, single-column on mobile

```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Left Column */}
    <div className="space-y-4">
      <DatePicker {...dateProps} />
      <div className="grid grid-cols-2 gap-4">
        <TimePicker label="Start Time" {...startTimeProps} />
        <TimePicker label="End Time" {...endTimeProps} />
      </div>
      <TimezoneSelect {...timezoneProps} />
    </div>
    
    {/* Right Column */}
    <div className="space-y-4">
      <InstructorSelect {...instructorProps} />
      <MeetingLinkField {...meetingLinkProps} />
      <StatusSelect {...statusProps} />
    </div>
  </div>
  
  {/* Full Width */}
  <NotesField {...notesProps} />
  
  {/* Actions */}
  <div className="flex justify-end gap-3 pt-4 border-t">
    <button type="button" onClick={onCancel}>Cancel</button>
    <button type="submit">Create Class</button>
  </div>
</form>
```

#### 5.2 Edit Mode

**Differences from Create:**
- Pre-fill all fields with existing data
- Show "Last updated" timestamp
- Disable fields if class is completed
- Add "Delete" button (super_admin only)

```tsx
{assignment.status === 'completed' && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
    <p className="text-sm text-blue-900">
      This class has been completed. Editing is disabled.
    </p>
  </div>
)}

<form className={assignment.status === 'completed' ? 'opacity-50 pointer-events-none' : ''}>
  {/* Same fields as create, but pre-filled */}
</form>
```

---

### 6. Accessibility

**WCAG 2.1 Level AA Compliance:**

```tsx
// 1. Proper labeling
<label htmlFor="class-date" className="form-label">
  Class Date <span className="text-red-500" aria-label="required">*</span>
</label>

// 2. Error announcements
<div role="alert" aria-live="polite">
  {errors.class_date && <p>{errors.class_date}</p>}
</div>

// 3. Field descriptions
<p id="date-help" className="text-sm text-gray-500">
  Select the date for this class session
</p>
<input
  type="date"
  aria-describedby="date-help"
  aria-invalid={!!errors.class_date}
  aria-errormessage="date-error"
/>

// 4. Keyboard navigation
<button type="button" onKeyDown={handleKeyDown}>
  Generate Link
</button>

// 5. Focus management
useEffect(() => {
  if (isOpen) {
    firstFieldRef.current?.focus();
  }
}, [isOpen]);
```

---

### 7. Mobile Optimizations

**Responsive Adjustments:**

```tsx
// 1. Single column layout
<div className="grid grid-cols-1 gap-4">
  {/* All fields stacked vertically */}
</div>

// 2. Larger touch targets (min 44x44px)
<button className="min-h-[44px] px-6">Create Class</button>

// 3. Native inputs for better UX
<input type="date" /> {/* Opens native date picker wheel */}
<input type="time" /> {/* Opens native time picker wheel */}

// 4. Full-screen modal on mobile
<Modal 
  isOpen={isOpen} 
  className="md:max-w-2xl md:mx-auto h-full md:h-auto"
>
  {/* Content */}
</Modal>
```

---

## 🎯 Summary for Task 5.4 (Implementation)

**Implementation Checklist:**

1. **Create Main Form Component:**
   - `AssignmentForm.tsx` — Main form with all fields
   - Props: `assignment?` (edit mode), `containerId`, `containerInstructor?`, `containerTimezone?`, `onSubmit`, `onCancel`

2. **Form Fields:**
   - ✅ DatePicker (native HTML5 with fallback)
   - ✅ TimePicker (start/end, native HTML5)
   - ✅ TimezoneSelect (common + all option)
   - ✅ InstructorSelect (conditional required)
   - ✅ MeetingLinkField (manual + generate button)
   - ✅ StatusSelect (contextual options)
   - ✅ NotesField (optional textarea)

3. **Validation:**
   - ✅ Field-level on blur (sync)
   - ✅ Form-level on submit (sync)
   - ✅ Conflict checking (async, debounced)
   - ✅ Server-side validation (final)

4. **UX Features:**
   - ✅ Smart defaults (date, time, timezone, instructor)
   - ✅ Auto-adjust end time when start changes
   - ✅ Conflict warning banner (non-blocking)
   - ✅ Inline error messages
   - ✅ Loading states (generating link, checking conflicts, submitting)

5. **Optimistic Updates:**
   - ✅ Edits: Optimistic (instant feedback)
   - ✅ Creates: Pessimistic (wait for server)
   - ✅ Rollback on failure

6. **Accessibility:**
   - ✅ ARIA labels and descriptions
   - ✅ Error announcements
   - ✅ Keyboard navigation
   - ✅ Focus management

**Key Design Decisions:**
- **Date/Time:** Native HTML5 inputs (mobile-optimized)
- **Timezone:** Common list (20) + show all option
- **Instructor:** Conditional required (based on container default)
- **Meeting Link:** Manual entry + generate helper
- **Validation:** Hybrid (blur + submit + async conflicts)
- **Conflicts:** Warning (non-blocking), allow override
- **Optimistic:** Edit yes, create no

**File Locations:**
- Main: `src/features/dashboard/components/Modules/ClassesV2/forms/AssignmentForm.tsx`
- Hooks: `src/features/dashboard/hooks/v2/useSupportsDateInput.ts`, `useMeetingLinkGenerator.ts`
- Services: `src/features/dashboard/services/v2/validation.service.ts` (conflict checking)

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

### Task 5.6: Instructor Conflict Checking UI Strategy ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Medium
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design conflict checking UX
- [x] **Deliverable:** Conflict checking UX spec
- [x] **Prompt:** "Design conflict checking UX: Check on blur or onChange? Show as error or warning (allow override)? Display conflict details? Debounce checks (how long)? Loading indicator? Suggest alternative times?"
- [x] **Output Location:** Comment for Task 5.7
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 5.6 Deliverable: Instructor Conflict Checking UI Strategy

### 1. Overview

**Purpose:** Prevent double-booking instructors while allowing admin flexibility for valid exceptions

**Key Requirements:**
- Real-time conflict detection without blocking user input
- Clear visual feedback on conflict status
- Detailed conflict information for informed decision-making
- Performance optimization to avoid excessive API calls
- Graceful handling of network delays/errors
- Accessibility compliant (screen reader announcements)

**Design Principle:** **Inform, don't block** — Show warnings, allow overrides, log decisions

---

### 2. When to Check: onChange (Debounced)

**Decision:** Check conflicts **on field change (onChange)** with **500ms debounce**

**Comparison:**

| Trigger | Pros | Cons | Best For |
|---------|------|------|----------|
| **onBlur** | ✅ Fewer API calls<br>✅ Less distracting | ❌ Delayed feedback<br>❌ User must leave field<br>❌ Miss multi-field conflicts | Simple validation |
| **onChange** | ✅ Real-time feedback<br>✅ Immediate awareness<br>✅ Better UX flow | ❌ More API calls<br>❌ Can be distracting | Complex validation |
| **onSubmit** | ✅ Minimal API calls<br>✅ Final check | ❌ Too late to fix easily<br>❌ Bad UX (must go back) | Final validation |

**Rationale:**
- ✅ Real-time feedback reduces frustration (don't wait until submit)
- ✅ User can adjust time immediately without filling entire form
- ✅ Debouncing prevents excessive API calls while typing
- ✅ Checks automatically when any conflict-relevant field changes (date, time, instructor)

**Implementation Strategy:**

```tsx
// Conflict-relevant fields
const conflictFields = {
  class_date: formData.class_date,
  start_time: formData.start_time,
  end_time: formData.end_time,
  instructor_id: formData.instructor_id,
  timezone: formData.timezone,
};

// Debounced conflict check (500ms)
const checkConflicts = useMemo(
  () =>
    debounce(async (date, startTime, endTime, instructorId, timezone, assignmentId?) => {
      // Skip if required fields missing
      if (!date || !startTime || !endTime || !instructorId) {
        setConflicts([]);
        return;
      }

      setIsCheckingConflicts(true);
      setConflictError(null);

      try {
        const result = await ValidationService.checkInstructorConflict({
          class_date: date,
          start_time: startTime,
          end_time: endTime,
          instructor_id: instructorId,
          timezone: timezone,
          exclude_assignment_id: assignmentId, // Don't conflict with self in edit mode
        });

        setConflicts(result.conflicts || []);
      } catch (error) {
        console.error('Conflict check failed:', error);
        setConflictError('Unable to check conflicts. Please verify manually.');
      } finally {
        setIsCheckingConflicts(false);
      }
    }, 500),
  []
);

// Trigger on field changes
useEffect(() => {
  checkConflicts(
    conflictFields.class_date,
    conflictFields.start_time,
    conflictFields.end_time,
    conflictFields.instructor_id,
    conflictFields.timezone,
    assignment?.id
  );

  // Cleanup: Cancel pending checks on unmount
  return () => checkConflicts.cancel();
}, [
  conflictFields.class_date,
  conflictFields.start_time,
  conflictFields.end_time,
  conflictFields.instructor_id,
  conflictFields.timezone,
  assignment?.id,
  checkConflicts,
]);
```

**Debounce Timing:**
- **500ms** — Sweet spot between responsiveness and API efficiency
- Too short (<300ms): Excessive API calls, server load
- Too long (>1000ms): Feels unresponsive, user might submit before check completes

---

### 3. Error vs Warning: Warning (Non-Blocking)

**Decision:** Display as **warning** (yellow/amber) with **allow override** capability

**Rationale:**
- ✅ Valid scenarios exist: Co-teaching, backup instructor, emergency substitution
- ✅ Admins should have final authority (trust but verify)
- ✅ Blocking creates support burden ("I need to schedule this!")
- ✅ Audit log captures overrides for accountability
- ⚠️ Must make warning prominent enough to not be ignored

**Warning Hierarchy:**

| Severity | Trigger | Visual | Allow Submit? | Log Override? |
|----------|---------|--------|---------------|---------------|
| **Info** | No conflict | Green checkmark, "No conflicts" | ✅ Yes | No |
| **Warning** | 1 conflict | Yellow banner, "Potential conflict" | ✅ Yes | Yes |
| **Caution** | 2+ conflicts | Orange banner, "Multiple conflicts" | ✅ Yes | Yes |
| **Error** | API failure | Red banner, "Cannot verify" | ✅ Yes (with disclaimer) | Yes |

**Visual Treatment:**

```tsx
// Info: No conflicts
<div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 flex items-center gap-2">
  <CheckCircleIcon className="w-5 h-5 text-green-600" />
  <span className="text-sm text-green-900">No scheduling conflicts detected</span>
</div>

// Warning: Single conflict
<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
  <div className="flex items-start gap-3">
    <AlertTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm font-medium text-yellow-900 mb-2">
        Potential Scheduling Conflict
      </h4>
      <p className="text-sm text-yellow-800 mb-3">
        {instructor.name} is already scheduled at this time:
      </p>
      {/* Conflict details component */}
      <ConflictDetails conflict={conflicts[0]} />
      <p className="text-xs text-yellow-700 mt-3">
        You can still create this class if this is intentional (e.g., co-teaching).
      </p>
    </div>
  </div>
</div>

// Caution: Multiple conflicts
<div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
  <div className="flex items-start gap-3">
    <AlertTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm font-medium text-orange-900 mb-2">
        Multiple Scheduling Conflicts ({conflicts.length})
      </h4>
      <p className="text-sm text-orange-800 mb-3">
        {instructor.name} has {conflicts.length} overlapping classes:
      </p>
      {/* Expandable conflict list */}
      <ConflictList conflicts={conflicts} maxVisible={2} />
      <p className="text-xs text-orange-700 mt-3">
        ⚠️ Please review carefully before proceeding.
      </p>
    </div>
  </div>
</div>

// Error: Check failed
<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
  <div className="flex items-start gap-3">
    <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm font-medium text-red-900 mb-2">
        Unable to Check Conflicts
      </h4>
      <p className="text-sm text-red-800 mb-2">
        {conflictError || 'Network error. Please verify manually.'}
      </p>
      <button
        type="button"
        onClick={() => checkConflicts(...conflictFields)}
        className="text-xs text-red-700 underline hover:text-red-900"
      >
        Retry Check
      </button>
    </div>
  </div>
</div>
```

**Submit Behavior:**
- **No conflicts:** Submit as normal
- **With conflicts:** Submit allowed, but log override in audit trail
- **Check failed:** Submit allowed, show "Conflict status: Unknown" in confirmation

---

### 4. Display Conflict Details: Yes, with Expandable View

**Decision:** Show **essential details inline**, with **expand option** for full context

**Conflict Detail Components:**

#### 4.1 Minimal Conflict Card (Default View)

```tsx
interface ConflictDetailsProps {
  conflict: InstructorConflict;
  onExpand?: () => void;
}

function ConflictDetails({ conflict, onExpand }: ConflictDetailsProps) {
  const { assignment, overlap_minutes } = conflict;

  return (
    <div className="bg-white border border-yellow-300 rounded-md p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1">
            {assignment.container_name}
          </div>
          <div className="text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{formatDate(assignment.class_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span>
                {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}
              </span>
              <span className="text-yellow-700 font-medium">
                ({overlap_minutes} min overlap)
              </span>
            </div>
            {assignment.meeting_link && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                <a
                  href={assignment.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Meeting Link
                </a>
              </div>
            )}
          </div>
        </div>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className="text-yellow-700 hover:text-yellow-900 text-xs underline"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
}
```

#### 4.2 Conflict List (Multiple Conflicts)

```tsx
interface ConflictListProps {
  conflicts: InstructorConflict[];
  maxVisible?: number;
}

function ConflictList({ conflicts, maxVisible = 2 }: ConflictListProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleConflicts = expanded ? conflicts : conflicts.slice(0, maxVisible);
  const hiddenCount = conflicts.length - maxVisible;

  return (
    <div className="space-y-2">
      {visibleConflicts.map((conflict, index) => (
        <ConflictDetails key={conflict.assignment.id} conflict={conflict} />
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-orange-700 hover:text-orange-900 underline"
        >
          Show {hiddenCount} more conflict{hiddenCount > 1 ? 's' : ''}
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm text-orange-700 hover:text-orange-900 underline"
        >
          Show Less
        </button>
      )}
    </div>
  );
}
```

#### 4.3 Expanded Conflict Modal (Optional)

```tsx
// For very detailed conflict information
function ConflictDetailsModal({ conflict, onClose }: ConflictDetailsModalProps) {
  return (
    <Modal isOpen onClose={onClose} title="Conflict Details">
      <div className="space-y-4">
        {/* Container Info */}
        <section>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Program</h4>
          <p className="text-sm text-gray-700">{conflict.assignment.container_name}</p>
        </section>

        {/* Schedule Info */}
        <section>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule</h4>
          <dl className="text-sm space-y-1">
            <div className="flex gap-2">
              <dt className="text-gray-600">Date:</dt>
              <dd className="text-gray-900">{formatDate(conflict.assignment.class_date)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-600">Time:</dt>
              <dd className="text-gray-900">
                {formatTime(conflict.assignment.start_time)} - {formatTime(conflict.assignment.end_time)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-600">Timezone:</dt>
              <dd className="text-gray-900">{conflict.assignment.timezone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-600 font-medium">Overlap:</dt>
              <dd className="text-yellow-700 font-medium">{conflict.overlap_minutes} minutes</dd>
            </div>
          </dl>
        </section>

        {/* Enrollment Info */}
        <section>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Enrollment</h4>
          <p className="text-sm text-gray-700">
            {conflict.assignment.enrolled_count} / {conflict.assignment.capacity} students
          </p>
        </section>

        {/* Meeting Link */}
        {conflict.assignment.meeting_link && (
          <section>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Meeting Link</h4>
            <a
              href={conflict.assignment.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {conflict.assignment.meeting_link}
            </a>
          </section>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

**Information Hierarchy:**
1. **Essential (always show):** Container name, date, time, overlap duration
2. **Contextual (inline):** Meeting link, enrolled count
3. **Detailed (modal):** Full timezone, capacity, notes, status

---

### 5. Debounce Duration: 500ms

**Decision:** **500ms debounce** for optimal balance

**Rationale:**
- ✅ Feels responsive (< 1 second)
- ✅ Prevents excessive API calls while user types
- ✅ Allows time for multi-field changes (e.g., adjusting both start and end time)
- ✅ Typical typing speed: 40-60 WPM = ~200-300ms between words
- ✅ User pauses naturally after entering time/date = triggers check

**Alternative Scenarios:**

| Duration | Pros | Cons | Use Case |
|----------|------|------|----------|
| **300ms** | Faster feedback | More API calls, might trigger mid-edit | High-priority validation |
| **500ms** | Balanced | - | **Recommended (default)** |
| **1000ms** | Fewer API calls | Feels sluggish | Low-priority checks |

**Implementation:**

```tsx
import { debounce } from 'lodash-es'; // Or custom implementation

const CONFLICT_CHECK_DEBOUNCE_MS = 500;

const checkConflicts = useMemo(
  () =>
    debounce(async (...args) => {
      // Conflict check logic
    }, CONFLICT_CHECK_DEBOUNCE_MS),
  []
);

// Cleanup on unmount (prevent memory leaks)
useEffect(() => {
  return () => {
    checkConflicts.cancel();
  };
}, [checkConflicts]);
```

**Optimization:**
- **Skip check if fields incomplete:** Don't call API if date/time/instructor missing
- **Cancel pending requests:** Abort previous API call if new one triggered
- **Cache recent results:** Store last 10 checks in memory (avoid duplicate calls)

---

### 6. Loading Indicator: Yes, Inline & Subtle

**Decision:** Show **subtle inline spinner** near affected fields + **badge in warning area**

**Rationale:**
- ✅ User needs feedback that check is in progress
- ✅ Inline indicator shows which fields trigger check
- ✅ Avoid blocking entire form (no overlay spinner)
- ✅ Subtle enough to not distract from form entry

**Visual Indicators:**

#### 6.1 Inline Field Indicator

```tsx
<div className="form-field">
  <label htmlFor="instructor" className="form-label">
    Instructor {!containerInstructor && <span className="text-red-500">*</span>}
  </label>
  <div className="relative">
    <select
      id="instructor"
      value={formData.instructor_id || ''}
      onChange={(e) => setField('instructor_id', e.target.value)}
      className="form-select"
      required={!containerInstructor}
    >
      <option value="">Select instructor...</option>
      {instructors.map((inst) => (
        <option key={inst.id} value={inst.id}>
          {inst.name}
        </option>
      ))}
    </select>
    {isCheckingConflicts && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <Spinner size="sm" className="text-yellow-500" />
      </div>
    )}
  </div>
</div>
```

#### 6.2 Warning Area Badge

```tsx
{isCheckingConflicts && (
  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 flex items-center gap-2">
    <Spinner size="sm" className="text-blue-600" />
    <span className="text-sm text-blue-900">Checking for conflicts...</span>
  </div>
)}

{!isCheckingConflicts && conflicts.length === 0 && formData.instructor_id && (
  <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 flex items-center gap-2">
    <CheckCircleIcon className="w-5 h-5 text-green-600" />
    <span className="text-sm text-green-900">No conflicts detected</span>
  </div>
)}

{!isCheckingConflicts && conflicts.length > 0 && (
  // Show conflict warning banner
)}
```

**Spinner Component:**

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <svg
      className={`animate-spin ${sizeClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
```

**Loading States:**
- **Initial:** No indicator (no check started)
- **Checking:** Blue spinner + "Checking for conflicts..."
- **Success (no conflicts):** Green checkmark + "No conflicts"
- **Success (conflicts found):** Yellow/orange warning banner
- **Error:** Red banner + "Unable to check conflicts" + Retry button

---

### 7. Suggest Alternative Times: Phase 2 Feature

**Decision:** **Not in MVP** — Implement in Phase 2 as enhancement

**Rationale:**
- ⚠️ Complex logic (find gaps in instructor schedule)
- ⚠️ Requires full instructor calendar (additional API calls)
- ⚠️ UX complexity (where to display suggestions?)
- ✅ Manual adjustment is sufficient for MVP
- ✅ Can be added later without breaking changes

**Future Implementation Plan:**

#### Phase 2 Enhancement: Smart Suggestions

**When to Suggest:**
- Conflict detected + user clicks "Suggest Times" button

**Suggestion Algorithm:**
1. Fetch instructor's full schedule for the day
2. Find available time slots (≥ class duration)
3. Prioritize slots closest to requested time
4. Show top 3 suggestions

**UI Mockup:**

```tsx
{conflicts.length > 0 && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
    {/* Conflict details */}
    <ConflictDetails conflict={conflicts[0]} />

    {/* Suggestion trigger */}
    <button
      type="button"
      onClick={handleFindAlternatives}
      disabled={isFindingAlternatives}
      className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 underline"
    >
      {isFindingAlternatives ? 'Finding alternatives...' : 'Suggest alternative times'}
    </button>

    {/* Suggestions */}
    {alternatives.length > 0 && (
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-yellow-900">Available time slots:</p>
        {alternatives.map((alt, index) => (
          <button
            key={index}
            type="button"
            onClick={() => applyAlternative(alt)}
            className="w-full text-left p-3 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 text-sm"
          >
            <div className="font-medium text-gray-900">
              {formatTime(alt.start_time)} - {formatTime(alt.end_time)}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {alt.distance_from_original > 0
                ? `${alt.distance_from_original} min later`
                : `${Math.abs(alt.distance_from_original)} min earlier`}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

**Service Implementation (Future):**

```tsx
// ValidationService.findAlternativeTimes()
async function findAlternativeTimes({
  instructor_id,
  class_date,
  duration_minutes,
  preferred_start_time,
  timezone,
}: FindAlternativesParams): Promise<AlternativeTime[]> {
  // 1. Fetch all assignments for instructor on that date
  const { data: assignments } = await supabase
    .from('assignments')
    .select('start_time, end_time')
    .eq('instructor_id', instructor_id)
    .eq('class_date', class_date)
    .order('start_time');

  // 2. Convert times to minutes since midnight
  const busySlots = assignments.map((a) => ({
    start: timeToMinutes(a.start_time),
    end: timeToMinutes(a.end_time),
  }));

  // 3. Find gaps of sufficient duration
  const alternatives: AlternativeTime[] = [];
  let currentTime = 0; // Start of day (midnight)

  for (const slot of busySlots) {
    const gapDuration = slot.start - currentTime;
    if (gapDuration >= duration_minutes) {
      // Found a gap, suggest time closest to preferred time
      const suggestedStart = findClosestTime(currentTime, slot.start, duration_minutes, preferred_start_time);
      alternatives.push({
        start_time: minutesToTime(suggestedStart),
        end_time: minutesToTime(suggestedStart + duration_minutes),
        distance_from_original: suggestedStart - timeToMinutes(preferred_start_time),
      });
    }
    currentTime = slot.end;
  }

  // 4. Sort by distance from preferred time
  return alternatives.sort((a, b) => 
    Math.abs(a.distance_from_original) - Math.abs(b.distance_from_original)
  ).slice(0, 3); // Top 3
}
```

**Why Defer to Phase 2:**
- MVP focuses on conflict awareness, not automatic resolution
- Gives users time to provide feedback on conflict UX before adding complexity
- Allows backend optimization (caching instructor schedules)
- Can be A/B tested for effectiveness

---

### 8. Accessibility Considerations

**ARIA Announcements:**

```tsx
// Announce conflict status changes
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {isCheckingConflicts && 'Checking for scheduling conflicts'}
  {!isCheckingConflicts && conflicts.length === 0 && 'No conflicts detected'}
  {!isCheckingConflicts && conflicts.length > 0 && 
    `${conflicts.length} scheduling conflict${conflicts.length > 1 ? 's' : ''} detected`}
  {conflictError && 'Unable to check conflicts. Please verify manually.'}
</div>

// Conflict details for screen readers
<div className="sr-only">
  {conflicts.map((conflict, index) => (
    <p key={conflict.assignment.id}>
      Conflict {index + 1}: {conflict.assignment.container_name} on{' '}
      {formatDate(conflict.assignment.class_date)} from{' '}
      {formatTime(conflict.assignment.start_time)} to{' '}
      {formatTime(conflict.assignment.end_time)}, {conflict.overlap_minutes} minutes overlap
    </p>
  ))}
</div>
```

**Keyboard Navigation:**
- Conflict details should be keyboard-accessible (Tab navigation)
- "Show more" button for expanded conflicts should be focusable
- Screen reader announces loading state changes

---

### 9. Error Handling

**Scenarios:**

| Error Type | User Experience | Technical Handling |
|------------|-----------------|-------------------|
| **Network timeout** | "Unable to check conflicts. Retry?" | Show retry button, allow submit |
| **API error** | "Conflict check failed. Please verify manually." | Log error, allow submit with warning |
| **Validation error** | "Invalid date/time format" | Show inline error, block submit |
| **No instructor selected** | No check triggered | Skip conflict check silently |

**Implementation:**

```tsx
try {
  const result = await ValidationService.checkInstructorConflict(...);
  setConflicts(result.conflicts || []);
  setConflictError(null);
} catch (error) {
  console.error('Conflict check failed:', error);
  
  if (error.code === 'NETWORK_ERROR') {
    setConflictError('Network connection lost. Please retry or verify manually.');
  } else if (error.code === 'TIMEOUT') {
    setConflictError('Request timed out. Please try again.');
  } else {
    setConflictError('Unable to check conflicts. Please verify manually before submitting.');
  }
  
  // Clear conflicts to avoid showing stale data
  setConflicts([]);
} finally {
  setIsCheckingConflicts(false);
}
```

---

### 10. Backend API Contract

**Endpoint:** `POST /api/v2/assignments/check-conflict`

**Request Payload:**

```typescript
interface CheckConflictRequest {
  class_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24-hour)
  end_time: string; // HH:MM (24-hour)
  instructor_id: string; // UUID
  timezone: string; // IANA timezone (e.g., 'America/New_York')
  exclude_assignment_id?: string; // UUID (for edit mode, don't conflict with self)
}
```

**Response:**

```typescript
interface CheckConflictResponse {
  has_conflict: boolean;
  conflicts: InstructorConflict[];
}

interface InstructorConflict {
  assignment: {
    id: string;
    container_id: string;
    container_name: string;
    class_date: string;
    start_time: string;
    end_time: string;
    timezone: string;
    meeting_link?: string;
    enrolled_count: number;
    capacity: number;
  };
  overlap_minutes: number; // How many minutes overlap
  overlap_type: 'exact' | 'partial_start' | 'partial_end' | 'contained'; // Type of overlap
}
```

**Backend Logic:**

```sql
-- Check for overlapping assignments
SELECT 
  a.id,
  a.container_id,
  c.name as container_name,
  a.class_date,
  a.start_time,
  a.end_time,
  a.timezone,
  a.meeting_link,
  COUNT(ab.booking_id) as enrolled_count,
  c.capacity
FROM assignments a
JOIN containers c ON a.container_id = c.id
LEFT JOIN assignment_bookings ab ON a.id = ab.assignment_id
WHERE a.instructor_id = $1
  AND a.class_date = $2
  AND a.timezone = $3
  AND a.id != COALESCE($4, '00000000-0000-0000-0000-000000000000')
  AND (
    -- Check for time overlap (convert to UTC for accurate comparison)
    (a.start_time, a.end_time) OVERLAPS ($5::time, $6::time)
  )
GROUP BY a.id, c.id
ORDER BY a.start_time;
```

---

## 🎯 Summary for Task 5.7 (Implementation)

**Implementation Checklist:**

1. **Add Conflict State to AssignmentForm:**
   - `conflicts: InstructorConflict[]`
   - `isCheckingConflicts: boolean`
   - `conflictError: string | null`

2. **Implement Debounced Check:**
   - Use `useMemo` + `debounce` (500ms)
   - Trigger on date/time/instructor/timezone change
   - Skip if required fields missing
   - Cancel on unmount

3. **Create Conflict UI Components:**
   - `ConflictWarningBanner` — Main warning display
   - `ConflictDetails` — Single conflict card
   - `ConflictList` — Multiple conflicts with expand
   - `Spinner` — Loading indicator

4. **Add Loading Indicator:**
   - Inline spinner near instructor field
   - Blue badge "Checking for conflicts..."
   - Green checkmark "No conflicts"

5. **Display Conflict Warnings:**
   - Yellow banner for single conflict
   - Orange banner for multiple conflicts
   - Red banner for API error
   - Allow submit in all cases (non-blocking)

6. **Accessibility:**
   - ARIA live region for status announcements
   - Screen reader-friendly conflict details
   - Keyboard navigation support

7. **Error Handling:**
   - Network timeout → Retry button
   - API error → Manual verification warning
   - Stale data → Clear conflicts on error

8. **Backend Integration:**
   - Create `ValidationService.checkInstructorConflict()`
   - Implement conflict detection query
   - Return typed `CheckConflictResponse`

**Key Design Decisions:**
- **Timing:** onChange with 500ms debounce
- **Severity:** Warning (non-blocking), allow override
- **Details:** Show essential info inline, full details on expand
- **Loading:** Inline spinner + status badge
- **Alternatives:** Phase 2 feature (not MVP)
- **Accessibility:** ARIA live regions, screen reader support

**File Locations:**
- Form: `src/features/dashboard/components/Modules/ClassesV2/forms/AssignmentForm.tsx`
- Components: `src/features/dashboard/components/Modules/ClassesV2/components/conflict/`
- Service: `src/features/dashboard/services/v2/validation.service.ts`
- Types: `src/features/dashboard/types/v2/conflict.types.ts`

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

### Task 6.1: Booking Assignment UI Strategy ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 1.5 hours
- [x] **Dependencies:** None
- [x] **Description:** Design booking assignment UX
- [x] **Deliverable:** Booking assignment UX specification
- [x] **Prompt:** "Review BOOKING_ASSIGNMENT_ROLES_MODULES.md and design: 'Assign Students' button placement (drawer header or footer)? Modal vs side panel? Multi-select or one-at-a-time? Filter bookings (by package match only)? Show already-assigned? Capacity check (block or warn)? Success feedback?"
- [x] **Output Location:** Comment for Task 6.2
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 6.1 Deliverable: Booking Assignment UI Strategy

### 1. Overview

**Purpose:** Enable admins to assign student bookings to program containers, linking students to scheduled class sessions

**Key Requirements:**
- Support both directions: assign booking→program AND assign program→bookings
- Multi-select for batch assignment (group classes)
- Smart filtering by package match and availability
- Real-time capacity validation
- Clear success/error feedback
- Permission-aware UI (super_admin, admin, yoga_acharya)

**Design Principle:** **Clarity + Safety** — Make capacity limits clear, prevent mistakes, enable bulk operations

---

### 2. Button Placement: Drawer Header (Primary Position)

**Decision:** **Place [+ Assign Students] button in ContainerDrawer header**, next to container actions

**Placement Options Comparison:**

| Location | Pros | Cons | Best For |
|----------|------|------|----------|
| **Header (right side)** | ✅ Always visible<br>✅ Primary action prominence<br>✅ Consistent with create patterns | ❌ May crowd header on mobile | **Recommended** |
| **Footer (sticky)** | ✅ Doesn't crowd header<br>✅ Always accessible when scrolling | ❌ Less prominent<br>❌ May be missed | Secondary actions |
| **Inline with student list** | ✅ Contextual placement | ❌ Only visible when scrolling<br>❌ Feels like secondary action | Add-ons |
| **Floating Action Button** | ✅ Mobile-friendly<br>✅ Always accessible | ❌ Covers content<br>❌ Desktop feels out of place | Mobile-first apps |

**Recommended Layout:**

```tsx
<ContainerDrawer>
  <DrawerHeader>
    <div className="flex items-center justify-between">
      <div>
        <h2>Monthly Yoga - Sarah Johnson</h2>
        <p className="text-sm text-gray-600">CONT-001 • Individual</p>
      </div>
      <div className="flex gap-2">
        {canUpdate && <button onClick={onEdit}>Edit</button>}
        {canAssign && (
          <button 
            onClick={handleOpenAssignModal}
            className="bg-emerald-600 text-white"
            disabled={isAtCapacity}
          >
            + Assign Students
          </button>
        )}
        {canDelete && <button onClick={onDelete}>Delete</button>}
      </div>
    </div>
  </DrawerHeader>

  <DrawerBody>
    {/* Capacity indicator */}
    <CapacityBadge current={enrolled} max={capacity} />

    {/* Student list */}
    <StudentList students={enrolledStudents} />

    {/* Assignments list */}
    <AssignmentList assignments={assignments} />
  </DrawerBody>
</ContainerDrawer>
```

**Capacity-Aware Button States:**

```tsx
// Full capacity
<button disabled className="opacity-50">
  + Assign Students (Full)
</button>

// Near capacity (warn)
<button className="bg-yellow-600">
  + Assign Students (2 slots left)
</button>

// Normal
<button className="bg-emerald-600">
  + Assign Students
</button>
```

---

### 3. Modal vs Side Panel: Modal (Centered, Focused)

**Decision:** **Use centered modal** for assignment flow

**Rationale:**
- ✅ Full focus on assignment task (critical operation)
- ✅ Better for multi-step workflow (search → select → confirm)
- ✅ Mobile-friendly (full-screen on small devices)
- ✅ Clear start/end boundaries
- ⚠️ Modal blocks access to drawer details (acceptable trade-off)

**Modal Design:**

```tsx
<Modal isOpen={isAssignModalOpen} onClose={handleClose} size="lg">
  <ModalHeader>
    <h3>Assign Students to Program</h3>
    <p className="text-sm text-gray-600">
      Monthly Yoga - Sarah Johnson • {enrolled}/{capacity} enrolled
    </p>
  </ModalHeader>

  <ModalBody>
    {/* Search & Filters */}
    <SearchAndFilters />

    {/* Available bookings list */}
    <BookingsList />

    {/* Capacity warning */}
    {selectedCount + enrolled > capacity && (
      <CapacityWarning />
    )}
  </ModalBody>

  <ModalFooter>
    <div className="flex justify-between items-center w-full">
      <span className="text-sm text-gray-600">
        {selectedCount} selected
      </span>
      <div className="flex gap-2">
        <button onClick={handleClose}>Cancel</button>
        <button 
          onClick={handleAssign}
          disabled={selectedCount === 0 || willExceedCapacity}
          className="bg-emerald-600 text-white"
        >
          Assign {selectedCount} Student{selectedCount > 1 ? 's' : ''}
        </button>
      </div>
    </div>
  </ModalFooter>
</Modal>
```

**Alternative Considered: Side Panel**
- ❌ Less focus (user can still interact with drawer)
- ❌ Horizontal space constraints on desktop
- ✅ Better for quick reference to program details
- **Verdict:** Modal wins for focused, critical task

---

### 4. Multi-Select: Yes, with Bulk Assignment

**Decision:** **Support multi-select with checkboxes** for group classes

**Rationale:**
- ✅ Group classes need bulk enrollment (10-30 students)
- ✅ Faster workflow (select all, assign once)
- ✅ Single student assignment still easy (select one, assign)
- ⚠️ Need clear capacity feedback during selection

**Multi-Select Implementation:**

```tsx
function AssignStudentsModal({ container, onClose, onSuccess }: Props) {
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(true);

  const availableSlots = container.capacity - container.enrolled_count;
  const selectedCount = selectedBookings.size;
  const willExceedCapacity = selectedCount > availableSlots;

  const toggleBooking = (bookingId: string) => {
    setSelectedBookings(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
    }
  };

  return (
    <Modal>
      <ModalHeader>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedBookings.size === filteredBookings.length}
            onChange={toggleAll}
            aria-label="Select all bookings"
          />
          <span>Select All ({filteredBookings.length})</span>
        </div>
      </ModalHeader>

      <ModalBody>
        {filteredBookings.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            selected={selectedBookings.has(booking.id)}
            onToggle={() => toggleBooking(booking.id)}
          />
        ))}
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <div>
            <span className="font-medium">{selectedCount} selected</span>
            {willExceedCapacity && (
              <span className="text-red-600 ml-2">
                ⚠️ Exceeds capacity by {selectedCount - availableSlots}
              </span>
            )}
          </div>
          <button 
            onClick={handleAssign}
            disabled={selectedCount === 0 || willExceedCapacity}
          >
            Assign {selectedCount} Student{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
```

**Selection UX:**
- Checkbox on each booking card
- "Select All" checkbox in header
- Selected count badge
- Visual feedback (highlight selected cards)
- Keyboard support (Space to toggle, Shift+Click for range)

---

### 5. Filter Bookings: Smart Multi-Layer Filtering

**Decision:** **Auto-filter by package match + manual filters** for refinement

**Filter Layers:**

| Filter Level | Type | Default | Purpose |
|--------------|------|---------|---------|
| **Package Match** | Auto | ON | Only show bookings matching container's package |
| **Not Already Assigned** | Auto | ON | Exclude bookings already in this container |
| **Status** | Manual | Confirmed | Filter by booking status (pending, confirmed, cancelled) |
| **Recurring Only** | Manual | OFF | Show only recurring bookings |
| **Instructor Match** | Manual | OFF | Show only bookings preferring this instructor |
| **Search** | Manual | - | Search by student name, email, booking ID |

**Filter UI:**

```tsx
<div className="space-y-4">
  {/* Auto-filters (always on, shown as info) */}
  <div className="bg-blue-50 p-3 rounded text-sm">
    <span className="font-medium">Showing:</span> Bookings matching 
    <span className="font-semibold"> {container.package_name}</span> package,
    not yet assigned to this program
  </div>

  {/* Search */}
  <input
    type="search"
    placeholder="Search by student name, email, or booking ID..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full p-2 border rounded"
  />

  {/* Manual filters */}
  <div className="flex flex-wrap gap-2">
    <FilterChip
      label="Status"
      value={statusFilter}
      options={['All', 'Confirmed', 'Pending', 'Active']}
      onChange={setStatusFilter}
    />
    <FilterChip
      label="Type"
      value={typeFilter}
      options={['All', 'Recurring', 'One-time']}
      onChange={setTypeFilter}
    />
    {container.instructor_id && (
      <FilterToggle
        label="Prefers this instructor"
        checked={instructorMatchFilter}
        onChange={setInstructorMatchFilter}
      />
    )}
  </div>

  {/* Results count */}
  <div className="text-sm text-gray-600">
    {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} available
  </div>
</div>
```

**Smart Package Matching:**

```tsx
// Backend query
async function getAvailableBookings(containerId: string) {
  const { data: container } = await supabase
    .from('containers')
    .select('class_package_id, id')
    .eq('id', containerId)
    .single();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      student:students(*),
      package:class_packages(*)
    `)
    .eq('class_package_id', container.class_package_id)
    .in('booking_status', ['confirmed', 'active'])
    .not('id', 'in', `(
      SELECT booking_id 
      FROM assignment_bookings 
      WHERE class_container_id = '${containerId}'
    )`)
    .order('created_at', { ascending: false });

  return bookings;
}
```

---

### 6. Show Already-Assigned: Yes, with Visual Distinction

**Decision:** **Show already-assigned bookings in separate section** with option to toggle

**Rationale:**
- ✅ Transparency (admin sees who's already enrolled)
- ✅ Avoid accidental duplicate assignments
- ✅ Easy to unassign if needed
- ⚠️ Keep separate from "available" to avoid confusion

**UI Layout:**

```tsx
<ModalBody>
  {/* Available bookings (main section) */}
  <section>
    <h3 className="font-medium mb-2">Available Students ({availableCount})</h3>
    <BookingsList bookings={availableBookings} />
  </section>

  {/* Already assigned (collapsible) */}
  <section className="mt-6 pt-6 border-t">
    <button
      onClick={() => setShowAssigned(!showAssigned)}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
    >
      <span>{showAssigned ? '▼' : '▶'}</span>
      <span>Already Enrolled ({enrolledCount})</span>
    </button>
    {showAssigned && (
      <div className="mt-3 opacity-75">
        {enrolledBookings.map(booking => (
          <EnrolledBookingCard
            key={booking.id}
            booking={booking}
            onUnassign={() => handleUnassign(booking.id)}
          />
        ))}
      </div>
    )}
  </section>
</ModalBody>
```

**Visual Distinction:**

```tsx
// Available booking card
<div className="border-2 border-emerald-200 bg-white p-4 rounded-lg">
  <input type="checkbox" />
  <div>
    <h4>{student.name}</h4>
    <p className="text-sm text-gray-600">{booking.id}</p>
  </div>
</div>

// Already enrolled card (read-only)
<div className="border border-gray-300 bg-gray-50 p-4 rounded-lg opacity-75">
  <div className="flex justify-between">
    <div>
      <h4 className="text-gray-700">{student.name}</h4>
      <p className="text-xs text-gray-500">Enrolled on {enrolledDate}</p>
    </div>
    {canUnassign && (
      <button className="text-red-600 text-sm">Unassign</button>
    )}
  </div>
</div>
```

---

### 7. Capacity Check: Warn + Allow Override (Admin Decision)

**Decision:** **Warning (non-blocking)** with explicit override for admins

**Rationale:**
- ✅ Admins may need to exceed capacity temporarily (waitlist, backup)
- ✅ Warning prevents accidents but allows flexibility
- ✅ Override requires explicit confirmation
- ⚠️ Log overrides for audit trail

**Capacity States:**

| State | Visual | Allow Assignment? | Message |
|-------|--------|-------------------|---------|
| **< 80% full** | Green badge | ✅ Yes | "{available} slots available" |
| **80-99% full** | Yellow badge | ✅ Yes | "⚠️ Only {available} slots left" |
| **100% full** | Orange badge | ⚠️ Warn | "At capacity. Override to assign more." |
| **> 100%** | Red badge | ⚠️ Warn | "⚠️ {over} over capacity. Override required." |

**Warning UI:**

```tsx
{willExceedCapacity && (
  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-orange-600">...</svg>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-orange-900">
          Capacity Warning
        </h4>
        <p className="text-sm text-orange-800 mt-1">
          Assigning {selectedCount} student{selectedCount > 1 ? 's' : ''} will exceed 
          capacity by {selectedCount - availableSlots}. 
        </p>
        <div className="mt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowOverride}
              onChange={(e) => setAllowOverride(e.target.checked)}
            />
            <span className="text-sm text-orange-900">
              I understand and want to proceed anyway
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
)}

<button
  onClick={handleAssign}
  disabled={selectedCount === 0 || (willExceedCapacity && !allowOverride)}
  className="bg-emerald-600 text-white disabled:opacity-50"
>
  {willExceedCapacity ? 'Assign Anyway' : 'Assign Students'}
</button>
```

**Audit Logging:**

```typescript
// Log capacity override
await supabase.from('audit_logs').insert({
  action: 'booking_assignment_capacity_override',
  user_id: currentUser.id,
  resource_type: 'container',
  resource_id: containerId,
  metadata: {
    capacity: container.capacity,
    enrolled_before: container.enrolled_count,
    enrolled_after: container.enrolled_count + selectedCount,
    override_amount: selectedCount - availableSlots,
    booking_ids: Array.from(selectedBookings),
  },
});
```

---

### 8. Success Feedback: Multi-Channel Notification

**Decision:** **Toast + Inline confirmation + List update**

**Feedback Channels:**

1. **Toast Notification** (primary)
2. **Inline success message** (modal)
3. **Updated student list** (drawer)
4. **Capacity badge update** (drawer header)

**Success Flow:**

```tsx
async function handleAssign() {
  setIsSubmitting(true);
  setError(null);

  try {
    // 1. Call service
    const result = await AssignmentBookingsService.assignBookingsToContainer({
      container_id: containerId,
      booking_ids: Array.from(selectedBookings),
      override_capacity: allowOverride,
    });

    // 2. Toast notification
    toast.success(`Successfully assigned ${result.assigned_count} student${result.assigned_count > 1 ? 's' : ''} to program`, {
      duration: 4000,
      action: {
        label: 'View',
        onClick: () => setShowEnrolled(true),
      },
    });

    // 3. Inline success (modal)
    setSuccessMessage(`${result.assigned_count} student${result.assigned_count > 1 ? 's' : ''} enrolled successfully`);

    // 4. Update parent (drawer)
    onSuccess(result);

    // 5. Close modal after delay
    setTimeout(() => {
      onClose();
    }, 1500);
  } catch (err: any) {
    setError(err.message || 'Failed to assign students');
    toast.error('Assignment failed. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
}
```

**Success Toast Design:**

```tsx
// Using react-hot-toast or similar
<Toast>
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 text-green-600">✓</svg>
    <div>
      <p className="font-medium">Students Assigned</p>
      <p className="text-sm text-gray-600">
        {count} student{count > 1 ? 's' : ''} enrolled in {programName}
      </p>
    </div>
  </div>
  <button className="text-sm text-blue-600">View</button>
</Toast>
```

**Inline Success (Modal):**

```tsx
{successMessage && (
  <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-green-600">✓</svg>
      <span className="text-sm text-green-900">{successMessage}</span>
    </div>
  </div>
)}
```

**Drawer Update:**

```tsx
// Parent component (ContainerDrawer)
function handleAssignmentSuccess(result: AssignmentResult) {
  // Update local state
  setContainer(prev => ({
    ...prev,
    enrolled_count: prev.enrolled_count + result.assigned_count,
  }));

  // Refetch enrolled students
  refetchEnrolledStudents();

  // Update capacity badge
  // (automatically updates via enrolled_count change)
}
```

---

### 9. Booking Card Design

**Booking Card Components:**

```tsx
function BookingCard({ booking, selected, onToggle }: BookingCardProps) {
  return (
    <div
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all
        ${selected 
          ? 'border-emerald-500 bg-emerald-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          {/* Student info */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{booking.student.name}</h4>
            <StatusBadge status={booking.booking_status} />
          </div>

          {/* Booking details */}
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{booking.id}</span>
              <span>•</span>
              <span>{booking.package.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{booking.student.email}</span>
              <span>•</span>
              <span>{booking.student.phone}</span>
            </div>
            {booking.preferred_time && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>Prefers: {booking.preferred_time}</span>
              </div>
            )}
            {booking.preferred_instructor && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>Prefers: {booking.preferred_instructor.name}</span>
              </div>
            )}
          </div>

          {/* Booking metadata */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>Created: {formatDate(booking.created_at)}</span>
            {booking.is_recurring && (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <RepeatIcon className="w-3 h-3" />
                Recurring
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 10. Mobile Optimizations

**Responsive Adjustments:**

```tsx
// Modal full-screen on mobile
<Modal
  isOpen={isOpen}
  onClose={onClose}
  className="
    h-full w-full md:h-auto md:w-auto 
    md:max-w-2xl md:rounded-lg
  "
>
  {/* ... */}
</Modal>

// Booking cards stack on mobile
<div className="
  grid grid-cols-1 md:grid-cols-2 gap-3
">
  {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
</div>

// Filters collapse on mobile
<div className="md:flex md:items-center md:gap-4">
  <button className="md:hidden" onClick={toggleFilters}>
    Filters ({activeFilterCount})
  </button>
  <div className={`
    ${showFilters ? 'block' : 'hidden'} 
    md:flex md:gap-2
  `}>
    {/* Filter chips */}
  </div>
</div>
```

---

## 🎯 Summary for Task 6.2-6.4 (Implementation)

**Implementation Checklist:**

1. **AssignmentBookingsService (Task 6.2):**
   - `assignBookingsToContainer(container_id, booking_ids, override_capacity?)`
   - `getAvailableBookings(container_id, filters)`
   - `getEnrolledStudents(container_id)`
   - `unassignBookingFromContainer(container_id, booking_id)`
   - Capacity validation with override support

2. **AssignStudentsModal Component (Task 6.3):**
   - Search and filter UI
   - Multi-select booking list
   - Capacity warning banner
   - Already-enrolled section (collapsible)
   - Submit handler with loading/success/error states

3. **ContainerDrawer Integration (Task 6.4):**
   - [+ Assign Students] button in header
   - State: `isAssignModalOpen`
   - Enrolled students section
   - Capacity badge (current/max)
   - Refresh after successful assignment

**Key Design Decisions:**
- **Placement:** Header button (primary action)
- **UI:** Centered modal (focused, mobile-friendly)
- **Selection:** Multi-select checkboxes (bulk support)
- **Filtering:** Auto package match + manual refinement
- **Already-Assigned:** Show in separate collapsible section
- **Capacity:** Warn but allow override (admin decision)
- **Feedback:** Toast + inline + list update

**File Locations:**
- Service: `src/features/dashboard/services/v2/assignment-bookings.service.ts`
- Modal: `src/features/dashboard/components/Modules/ClassesV2/components/modals/AssignStudentsModal.tsx`
- Drawer: `src/features/dashboard/components/Modules/ClassesV2/components/ContainerDrawer.tsx` (update)

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
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Medium
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Plan BookingManagement enhancements
- [x] **Deliverable:** BookingManagement enhancement plan
- [x] **Prompt:** "Review existing BookingManagement.tsx and plan: Where to add 'Assign to Program' button? Refactor component structure? Show program assignment status? Add tab or inline? Permission checks for roles? Mobile responsive considerations?"
- [x] **Output Location:** Comment for Task 6.6
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 6.5 Deliverable: BookingManagement Module Enhancement Strategy

### 1. Current State Analysis

**File:** `src/features/dashboard/components/Modules/BookingManagement.tsx` (1133 lines)

**Component Structure:**
- **Main View:** Table listing all bookings with filters (search, status, date, booking number)
- **View Modal:** Full-screen modal showing booking details (customer info, class details, additional info)
- **Edit Modal:** Same modal with editable fields (class, instructor, date, time, status, package, special requests)
- **Package Details Modal:** Separate modal for viewing package information
- **Confirmation Dialogs:** Delete confirmation dialog

**Key Features:**
- ✅ Search/filter by name, email, class name
- ✅ Filter by status (all, pending, confirmed, cancelled, user_cancelled, completed, rescheduled)
- ✅ Filter by date (all, today, upcoming, past)
- ✅ Filter by booking number
- ✅ Sort by booking number (asc/desc)
- ✅ View booking details in modal (read-only)
- ✅ Edit booking (inline modal mode)
- ✅ Update booking status (pending→confirmed, confirmed→completed, cancel)
- ✅ Send notification to customer (email queue)
- ✅ Revoke cancellation token
- ✅ Delete booking with confirmation
- ✅ Deep-linking support (`?booking_id=xxx`)
- ✅ Package details view (separate modal)
- ✅ Access status badges (active, grace period, locked)
- ✅ Recurring booking indicator

**Missing Features:**
- ❌ Program assignment functionality
- ❌ List of assigned programs for a booking
- ❌ Unassign from program
- ❌ View program details from booking
- ❌ Capacity validation when assigning

---

### 2. Button Placement: Inline in Booking Details Modal

**Decision:** Add **[+ Assign to Program]** button in the **Booking Details Modal** action bar, alongside Edit/Notify/Delete buttons

**Rationale:**
- ✅ Contextual placement (assign action is specific to selected booking)
- ✅ Doesn't clutter table view
- ✅ Consistent with existing action pattern (Edit, Notify, Delete)
- ✅ Natural flow: View booking → Assign to program
- ⚠️ Requires booking to be opened first (acceptable trade-off for clarity)

**Placement:**

```tsx
// In Booking Details Modal (line ~975-1035)
<div className="border-t pt-4 flex flex-wrap gap-3 justify-end">
  {/* Existing buttons: Edit, Confirm, Cancel, Notify, Delete */}
  
  {/* NEW: Add before Edit button for prominence */}
  {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsAssignModalOpen(true)}
      className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100"
    >
      <PlusCircle className="w-4 h-4 mr-1" />
      Assign to Program
    </Button>
  )}

  <Button variant="outline" size="sm" onClick={() => handleEditBooking(selectedBooking)}>
    <Edit className="w-4 h-4 mr-1" />
    Edit
  </Button>

  {/* ... rest of existing buttons ... */}
</div>
```

**Alternative Considered:** Bulk assignment from table row actions
- ❌ Clutters table (already has 6 action buttons)
- ❌ Requires multi-select pattern (complex UX)
- ✅ Bookings are typically assigned individually, not in bulk
- **Verdict:** Inline modal placement wins

---

### 3. Component Structure: No Refactoring Needed, Extend Existing Pattern

**Decision:** **Keep existing structure**, add new modal and state similar to Package Details Modal

**Rationale:**
- ✅ Component is well-organized (1133 lines, but logical sections)
- ✅ Existing modal pattern is reusable (View/Edit/Package modals)
- ✅ Adding assignment modal follows established conventions
- ✅ No performance issues detected
- ⚠️ Component will grow to ~1400 lines (still maintainable with clear sections)

**Sections to Add:**

```tsx
// 1. State variables (add near line 70-90)
const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
const [assignedPrograms, setAssignedPrograms] = useState<AssignedProgram[]>([])
const [isLoadingPrograms, setIsLoadingPrograms] = useState(false)

// 2. Service instance (add near line 85)
const bookingsService = useMemo(() => new AssignmentBookingsService(), [])

// 3. Fetch assigned programs function (add near line 200)
const fetchAssignedPrograms = async (bookingId: string) => {
  setIsLoadingPrograms(true)
  try {
    const result = await bookingsService.getProgramsForBooking(bookingId)
    if (result.success) {
      setAssignedPrograms(result.data || [])
    }
  } catch (error) {
    console.error('Error fetching assigned programs:', error)
  } finally {
    setIsLoadingPrograms(false)
  }
}

// 4. useEffect to fetch when booking is selected (add near line 95)
useEffect(() => {
  if (selectedBooking) {
    fetchAssignedPrograms(selectedBooking.id)
  } else {
    setAssignedPrograms([])
  }
}, [selectedBooking])

// 5. Render assignment modal (add after Package Details Modal, line ~1130)
{isAssignModalOpen && selectedBooking && (
  <AssignToProgram
    booking={selectedBooking}
    isOpen={isAssignModalOpen}
    onClose={() => setIsAssignModalOpen(false)}
    onSuccess={() => {
      fetchAssignedPrograms(selectedBooking.id)
      setSuccessMessage('Booking assigned to program successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    }}
  />
)}
```

**Future Refactoring Consideration (Phase 8):**
- Extract modal components into separate files (`BookingDetailsModal.tsx`, `PackageDetailsModal.tsx`, etc.)
- Create custom hooks (`useBookingManagement.ts`, `useBookingAssignment.ts`)
- Split into feature folders (booking-list, booking-details, booking-assignment)
- **Not needed now:** Current structure is clear and maintainable

---

### 4. Show Program Assignment Status: Inline Section in Booking Details

**Decision:** Add **"Assigned Programs"** section in Booking Details Modal, after "Additional Information"

**Rationale:**
- ✅ Shows current assignments without opening separate modal
- ✅ Allows quick unassign action
- ✅ Consistent with existing sections (Customer Info, Class Details, Additional Info)
- ✅ Provides context when deciding to assign to another program

**UI Design:**

```tsx
// Add in Booking Details Modal (after Additional Information, line ~950)
{/* Assigned Programs Section */}
<div>
  <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2 flex items-center justify-between">
    <span>Assigned Programs</span>
    {isLoadingPrograms && <Spinner size="sm" />}
  </h4>
  
  {assignedPrograms.length === 0 ? (
    <div className="text-center py-6 bg-gray-50 rounded-lg">
      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Not assigned to any program yet</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAssignModalOpen(true)}
        className="mt-3"
      >
        <PlusCircle className="w-4 h-4 mr-1" />
        Assign to Program
      </Button>
    </div>
  ) : (
    <div className="space-y-3">
      {assignedPrograms.map((program) => (
        <div
          key={program.container_id}
          className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1">{program.container_name}</h5>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Package:</span> {program.package_name}
                </div>
                <div>
                  <span className="text-gray-500">Instructor:</span> {program.instructor_name || 'TBD'}
                </div>
                <div>
                  <span className="text-gray-500">Schedule:</span> {program.schedule}
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>{' '}
                  <span className={program.enrolled_count >= program.capacity ? 'text-red-600 font-medium' : ''}>
                    {program.enrolled_count}/{program.capacity}
                  </span>
                </div>
              </div>
              {program.next_class_date && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block">
                  Next class: {formatDate(program.next_class_date)} at {program.next_class_time}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnassignFromProgram(program.container_id)}
              className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

**Visual States:**
- **Empty state:** Show message + CTA button
- **Loading state:** Show spinner in section header
- **Populated state:** List of program cards with unassign button
- **Error state:** Show error message with retry button

---

### 5. Assignment Modal: Separate Modal vs Inline

**Decision:** **Separate centered modal** (reuse pattern from Task 6.3 `AssignStudentsModal`)

**Rationale:**
- ✅ Focuses user on assignment task
- ✅ Provides space for program search/filter
- ✅ Shows available programs with details (capacity, schedule, instructor)
- ✅ Allows capacity warning display
- ✅ Reuses existing modal pattern
- ⚠️ User loses sight of booking details (acceptable, can view after assignment)

**Modal Component:**

```tsx
// New component: AssignToProgram.tsx
interface AssignToProgramProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function AssignToProgram({ booking, isOpen, onClose, onSuccess }: AssignToProgramProps) {
  const [programs, setPrograms] = useState<Container[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [allowOverride, setAllowOverride] = useState(false)

  const bookingsService = useMemo(() => new AssignmentBookingsService(), [])

  useEffect(() => {
    if (isOpen) {
      fetchAvailablePrograms()
    }
  }, [isOpen, searchTerm])

  const fetchAvailablePrograms = async () => {
    setLoading(true)
    try {
      // Get programs matching booking's package
      const result = await bookingsService.getAvailableProgramsForBooking(booking.id, {
        search: searchTerm,
        status: ['active', 'upcoming'],
      })
      if (result.success) {
        setPrograms(result.data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedProgram) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await bookingsService.assignBookingsToContainer(
        selectedProgram,
        [booking.id],
        { allowCapacityOverride: allowOverride }
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Assignment failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign booking')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProgramData = programs.find(p => p.id === selectedProgram)
  const willExceedCapacity = selectedProgramData
    ? (selectedProgramData.capacity_booked || 0) >= (selectedProgramData.capacity || 0)
    : false

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <h3>Assign to Program</h3>
        <p className="text-sm text-gray-600 mt-1">
          Student: {booking.first_name} {booking.last_name} | Package: {getPackageName(booking)}
        </p>
      </ModalHeader>

      <ModalBody>
        {/* Search */}
        <div className="mb-4">
          <input
            type="search"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Capacity warning */}
        {willExceedCapacity && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900">Capacity Exceeded</p>
                <p className="text-sm text-orange-700 mt-1">
                  This program is at capacity ({selectedProgramData?.capacity_booked}/{selectedProgramData?.capacity}).
                  Override will be logged.
                </p>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={allowOverride}
                    onChange={(e) => setAllowOverride(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-orange-900">Allow capacity override</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Empty state */}
        {!loading && programs.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-600">
              No active programs match this booking's package.
            </p>
          </div>
        )}

        {/* Program list */}
        {!loading && programs.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {programs.map((program) => {
              const isSelected = selectedProgram === program.id
              const isAtCapacity = (program.capacity_booked || 0) >= (program.capacity || 0)

              return (
                <div
                  key={program.id}
                  onClick={() => setSelectedProgram(program.id)}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{program.name}</h4>
                        {isAtCapacity && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                            At Capacity
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                        <div>
                          <span className="text-gray-500">Instructor:</span> {program.instructor_name || 'TBD'}
                        </div>
                        <div>
                          <span className="text-gray-500">Capacity:</span>{' '}
                          <span className={isAtCapacity ? 'text-orange-600 font-medium' : ''}>
                            {program.capacity_booked || 0}/{program.capacity}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Schedule:</span> {program.schedule}
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>{' '}
                          <span className="capitalize">{program.status}</span>
                        </div>
                      </div>
                      {program.start_date && (
                        <div className="mt-2 text-xs text-gray-600">
                          Starts: {formatDate(program.start_date)}
                          {program.end_date && ` • Ends: ${formatDate(program.end_date)}`}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-600">
            {programs.length} program{programs.length !== 1 ? 's' : ''} available
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedProgram || submitting || (willExceedCapacity && !allowOverride)}
            >
              {submitting ? 'Assigning...' : 'Assign to Program'}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}
```

---

### 6. Permission Checks: Role-Based Actions

**Decision:** Implement **granular permission checks** using existing `permissions.ts` system

**Rationale:**
- ✅ Existing permission matrix supports `bookings` resource
- ✅ Actions: `view`, `assign`, `unassign` already defined
- ✅ Role hierarchy: super_admin (full), admin (assign only), yoga_acharya (assign only), instructor (no access)
- ⚠️ Need to add bookings resource to permission matrix if missing

**Permission Matrix Update:**

```typescript
// In src/shared/utils/permissions.ts
export const PERMISSIONS: PermissionMatrix = {
  super_admin: {
    bookings: {
      view: true,
      create: true,
      update: true,
      delete: true,
      assign: true,    // ✅ Assign to program
      unassign: true,  // ✅ Unassign from program
      export: true,
    },
  },

  admin: {
    bookings: {
      view: true,
      create: true,
      update: true,
      delete: false,
      assign: true,    // ✅ Assign to program
      unassign: false, // ❌ Cannot unassign (only super_admin)
      export: true,
    },
  },

  yoga_acharya: {
    bookings: {
      view: true,
      create: false,
      update: false,
      delete: false,
      assign: true,    // ✅ Assign to program
      unassign: false, // ❌ Cannot unassign
      export: false,
    },
  },

  instructor: {
    bookings: {
      view: false,     // ❌ No access to booking management
      assign: false,
      unassign: false,
    },
  },
};
```

**UI Permission Checks:**

```tsx
// In BookingManagement.tsx
import { hasPermission } from '../../shared/utils/permissions'
import { useUser } from '../../shared/contexts/UserContext'

function BookingManagement() {
  const { user } = useUser()

  const canAssignBookings = hasPermission(user, 'bookings', 'assign')
  const canUnassignBookings = hasPermission(user, 'bookings', 'unassign')

  // In Booking Details Modal
  {canAssignBookings && (selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsAssignModalOpen(true)}
      className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100"
    >
      <PlusCircle className="w-4 h-4 mr-1" />
      Assign to Program
    </Button>
  )}

  // In Assigned Programs Section
  {canUnassignBookings && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleUnassignFromProgram(program.container_id)}
      className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <X className="w-4 h-4" />
    </Button>
  )}
}
```

**Backend Permission Checks:**

```typescript
// In AssignmentBookingsService.assignBookingsToContainer
async assignBookingsToContainer(
  containerId: string,
  bookingIds: string[],
  options?: { allowCapacityOverride?: boolean }
): Promise<ServiceResult<AssignResult>> {
  try {
    // 1. Check user permission
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      return this.error('Unauthorized', 401)
    }

    // 2. Get user role from profiles table
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 3. Check permission
    if (!hasPermission({ role: profile?.role }, 'bookings', 'assign')) {
      return this.error('You do not have permission to assign bookings', 403)
    }

    // ... rest of assignment logic
  } catch (error: any) {
    return this.handleError(error)
  }
}
```

---

### 7. Mobile Responsive Considerations

**Decision:** Implement **progressive disclosure** with mobile-optimized layout

**Mobile Adaptations:**

```tsx
// 1. Table → Card list on mobile
{isMobile ? (
  // Mobile: Card layout
  <div className="space-y-3">
    {displayedBookings.map((booking) => (
      <div key={booking.id} className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium">{booking.first_name} {booking.last_name}</h3>
            <p className="text-sm text-gray-600">{booking.email}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>
        <div className="text-sm text-gray-700 mb-3">
          <p>{booking.class_name}</p>
          <p>{formatDate(booking.class_date)} at {booking.class_time}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleViewBooking(booking)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => handleEditBooking(booking)}>
            <Edit className="w-4 h-4" />
          </Button>
          {/* ... other actions ... */}
        </div>
      </div>
    ))}
  </div>
) : (
  // Desktop: Table layout
  <table>...</table>
)}

// 2. Modal full-screen on mobile
<Modal
  isOpen={isOpen}
  onClose={onClose}
  className="
    fixed inset-0 md:relative md:max-w-2xl
    h-full md:h-auto
    w-full md:w-auto
    md:rounded-xl
  "
>
  {/* ... modal content ... */}
</Modal>

// 3. Assigned Programs Section - Stack on mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {assignedPrograms.map((program) => (
    <div key={program.id} className="border rounded-lg p-3">
      {/* Program card content */}
    </div>
  ))}
</div>

// 4. Filters - Collapse on mobile
<div className="space-y-4 md:space-y-0 md:flex md:gap-4">
  {/* Search */}
  <div className="flex-1">
    <input type="search" placeholder="Search..." />
  </div>

  {/* Filters - Show button on mobile */}
  <div className="md:hidden">
    <Button onClick={() => setShowFilters(!showFilters)}>
      <Filter className="w-4 h-4 mr-1" />
      Filters ({activeFilterCount})
    </Button>
  </div>

  {/* Filter dropdowns - Collapsible on mobile */}
  <div className={`
    ${showFilters ? 'block' : 'hidden'} 
    md:flex md:gap-2
    space-y-2 md:space-y-0
  `}>
    <select>...</select>
    <select>...</select>
  </div>
</div>

// 5. Assignment modal - Adjust for mobile
<ModalBody className="p-4 md:p-6">
  {/* Program cards - Single column on mobile */}
  <div className="space-y-3">
    {programs.map((program) => (
      <div className="p-3 md:p-4 border rounded-lg">
        {/* Stack content vertically on mobile */}
        <div className="space-y-2">
          <h4 className="font-medium">{program.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {/* Details */}
          </div>
        </div>
      </div>
    ))}
  </div>
</ModalBody>
```

**Mobile UX Enhancements:**
- ✅ Larger touch targets (min 44x44px for buttons)
- ✅ Sticky header with filters toggle
- ✅ Pull-to-refresh (optional enhancement)
- ✅ Swipe gestures for actions (optional enhancement)
- ✅ Bottom action bar for primary actions
- ✅ Native date/time pickers (already using HTML5 inputs)

---

## 🎯 Summary for Task 6.6 (Implementation)

**Implementation Checklist:**

1. **Add State Variables (BookingManagement.tsx):**
   - `isAssignModalOpen: boolean`
   - `assignedPrograms: AssignedProgram[]`
   - `isLoadingPrograms: boolean`
   - `bookingsService` instance

2. **Add Fetch Function:**
   - `fetchAssignedPrograms(bookingId)` - Calls `AssignmentBookingsService.getProgramsForBooking`

3. **Add useEffect:**
   - Fetch assigned programs when `selectedBooking` changes

4. **Update Booking Details Modal:**
   - Add "Assigned Programs" section after "Additional Information"
   - Show empty state, loading state, or program cards
   - Add [+ Assign to Program] button in action bar
   - Add unassign button for each program (permission-gated)

5. **Create AssignToProgram Component:**
   - New file: `src/features/dashboard/components/Modules/ClassesV2/components/modals/AssignToProgram.tsx`
   - Search and filter programs
   - Single-select program cards
   - Capacity warning with override checkbox
   - Submit handler calling `AssignmentBookingsService.assignBookingsToContainer`

6. **Add Permission Checks:**
   - Import `hasPermission` utility
   - Gate [Assign] button with `canAssignBookings`
   - Gate [Unassign] button with `canUnassignBookings`
   - Backend permission check in service method

7. **Mobile Responsive:**
   - Use existing responsive patterns (grid-cols-1 md:grid-cols-2)
   - Full-screen modals on mobile
   - Stack filters vertically on mobile

8. **Update Permissions Matrix (if needed):**
   - Add `bookings` resource to `PERMISSIONS` in `permissions.ts`
   - Set `assign: true` for super_admin, admin, yoga_acharya
   - Set `unassign: true` for super_admin only

**Key Design Decisions:**
- **Button placement:** Booking Details Modal action bar (inline, contextual)
- **Structure:** Extend existing component (no refactoring needed)
- **Assignment display:** Inline section in modal (not separate tab)
- **Assignment modal:** Separate centered modal (focused flow)
- **Permissions:** Role-based with existing permission system
- **Mobile:** Progressive disclosure with responsive layouts

**File Locations:**
- Main component: `src/features/dashboard/components/Modules/BookingManagement.tsx`
- Assignment modal: `src/features/dashboard/components/Modules/ClassesV2/components/modals/AssignToProgram.tsx`
- Permissions: `src/shared/utils/permissions.ts` (update if needed)

**Estimated Lines of Code:**
- BookingManagement.tsx: +150 lines (total: ~1280 lines)
- AssignToProgram.tsx: +250 lines (new file)
- permissions.ts: +30 lines (if bookings resource missing)

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

### Task 7.1: Mobile Strategy Design ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** High
- [x] **Estimated Time:** 2 hours
- [x] **Dependencies:** None
- [x] **Description:** Design mobile experience
- [x] **Deliverable:** Mobile strategy document
- [x] **Prompt:** "Design mobile experience for V2: Bottom sheet vs full-screen modals? Navigation (tab bar or drawer)? Touch gesture priorities (swipe to delete vs scroll)? Offline support (which data to cache)? Pull-to-refresh implementation? FAB placement? Screen breakpoints?"
- [x] **Output Location:** Comment for subsequent mobile tasks
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 7.1 Deliverable: Mobile Strategy Design for Classes V2

### 1. Overview

**Purpose:** Create a mobile-first experience that makes program and booking management efficient on touch devices

**Key Requirements:**
- Native-feeling interactions (bottom sheets, swipe gestures, pull-to-refresh)
- Offline-capable for critical workflows (view schedules, check assignments)
- Performance-optimized (lazy loading, virtual scrolling)
- Touch-friendly (44px minimum targets, gesture support)
- Progressive enhancement (works on all devices, enhanced on mobile)

**Design Principle:** **Mobile-First, Desktop-Enhanced** — Optimize for touch, scale up for desktop

---

### 2. Bottom Sheet vs Full-Screen Modals

**Decision:** **Hybrid Approach** — Bottom sheets for quick actions, full-screen modals for complex forms

#### 2.1 Bottom Sheet Use Cases

**When to Use:**
- Quick views (program details, student info)
- List selections (assign students, select package)
- Confirmation dialogs (delete, cancel)
- Filter panels (search, sort options)

**Rationale:**
- ✅ Native mobile pattern (iOS Maps, Google Sheets)
- ✅ Maintains context (can see underlying content)
- ✅ One-handed operation (thumb-friendly)
- ✅ Dismissible with drag gesture
- ⚠️ Limited vertical space (not for long forms)

**Implementation:**

```tsx
interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  snapPoints?: number[] // [0.3, 0.6, 0.9] - % of screen height
  initialSnap?: number // Default snap point index
  children: React.ReactNode
  title?: string
  showHandle?: boolean // Drag handle at top
}

// Example: Quick program view
<BottomSheet
  isOpen={isProgramViewOpen}
  onClose={() => setIsProgramViewOpen(false)}
  snapPoints={[0.4, 0.8]}
  initialSnap={0}
  title="Program Details"
  showHandle={true}
>
  <ProgramQuickView program={selectedProgram} />
</BottomSheet>
```

**Bottom Sheet Variants:**

| Type | Height | Use Case | Example |
|------|--------|----------|---------|
| **Peek** | 30-40% | Quick info, list preview | Filter panel |
| **Half** | 50-60% | Details view, short forms | Program details |
| **Full** | 80-90% | Long lists, search | Student selection |

#### 2.2 Full-Screen Modal Use Cases

**When to Use:**
- Complex forms (create program, assignment form)
- Multi-step workflows (booking creation)
- Rich content (package details with images)
- Desktop-like views (calendar grid)

**Rationale:**
- ✅ Maximum space for complex UI
- ✅ Focus mode (no distractions)
- ✅ Better for keyboard input
- ✅ Supports scroll within form
- ⚠️ Loses underlying context

**Implementation:**

```tsx
// Mobile: Full screen with slide-up animation
<Modal
  isOpen={isCreateProgramOpen}
  onClose={() => setIsCreateProgramOpen(false)}
  className="
    fixed inset-0 
    md:relative md:max-w-4xl md:mx-auto
    bg-white md:rounded-xl
    slide-up md:fade-in
  "
  closeOnBackdrop={false} // Prevent accidental close with form data
>
  <ModalHeader className="sticky top-0 z-10 bg-white border-b">
    <button onClick={onClose}>Cancel</button>
    <h2>Create Program</h2>
    <button disabled={!isValid}>Save</button>
  </ModalHeader>
  <ModalBody className="p-4 overflow-y-auto">
    <CreateProgramForm />
  </ModalBody>
</Modal>
```

#### 2.3 Decision Matrix

| Scenario | Mobile | Desktop | Rationale |
|----------|--------|---------|-----------|
| **Program Details (read-only)** | Bottom Sheet (60%) | Drawer (side) | Quick view, maintain context |
| **Create Program Form** | Full-screen Modal | Centered Modal (lg) | Complex form, needs focus |
| **Assign Students** | Bottom Sheet → Full (80%) | Centered Modal (xl) | Start small, expand if needed |
| **Delete Confirmation** | Bottom Sheet (30%) | Small Modal | Quick action |
| **Filter Panel** | Bottom Sheet (40%) | Dropdown | Contextual filtering |
| **Booking Details** | Full-screen Modal | Drawer (side) | Lots of info, edit mode |

---

### 3. Navigation Strategy

**Decision:** **Contextual Navigation** — No global mobile nav, use in-context actions and back buttons

#### 3.1 Tab Bar vs Drawer: Neither (Use Module Switcher)

**Rationale:**
- ✅ ClassesV2 is a **module within dashboard**, not standalone app
- ✅ User already has main dashboard navigation
- ✅ Adding mobile nav creates redundancy
- ✅ Contextual actions (FABs, inline buttons) are clearer
- ⚠️ Must ensure easy exit back to dashboard

**Implementation:**

```tsx
// Mobile: Sticky header with back button
<div className="sticky top-0 z-20 bg-white border-b md:hidden">
  <div className="flex items-center gap-3 px-4 py-3">
    {/* Back to dashboard */}
    <button onClick={() => navigate('/dashboard')} className="p-2">
      <ArrowLeft className="w-5 h-5" />
    </button>
    
    {/* Current view title */}
    <h1 className="text-lg font-semibold flex-1">Programs</h1>
    
    {/* Context actions */}
    <button onClick={() => setIsSearchOpen(true)}>
      <Search className="w-5 h-5" />
    </button>
    <button onClick={openFilterSheet}>
      <Filter className="w-5 h-5" />
    </button>
  </div>
</div>
```

#### 3.2 View Hierarchy

**Navigation Flow:**

```
Dashboard → ClassesV2 Module → Container List
                                    ↓
                            Container Details (Bottom Sheet)
                                    ↓
                            Edit Program (Full Modal)
                                    ↓
                            [Save] → Back to Details
```

**Back Button Behavior:**
- Bottom Sheet: Swipe down or tap backdrop → Previous view
- Full Modal: Header back button → Previous view
- List View: Header back button → Dashboard

#### 3.3 Breadcrumb Strategy (Desktop Only)

```tsx
// Desktop: Breadcrumb in header
{!isMobile && (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <Link to="/dashboard">Dashboard</Link>
    <ChevronRight className="w-4 h-4" />
    <Link to="/dashboard/classes-v2">Programs</Link>
    {selectedContainer && (
      <>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">{selectedContainer.name}</span>
      </>
    )}
  </div>
)}
```

---

### 4. Touch Gesture Priorities

**Decision:** **Non-Destructive Gestures Only** — Swipe for navigation/dismiss, tap for actions

#### 4.1 Gesture Hierarchy

| Priority | Gesture | Action | Rationale |
|----------|---------|--------|-----------|
| **1** | Vertical Scroll | Scroll content | Most common, must always work |
| **2** | Swipe Down | Dismiss bottom sheet | Native pattern, intuitive |
| **3** | Swipe Right | Go back / Close modal | iOS pattern, safe |
| **4** | Pull Down | Pull-to-refresh | Standard pattern |
| **5** | Long Press | Context menu (not swipe-delete) | Prevents accidents |

**Swipe-to-Delete: NOT Recommended**

**Why Avoid:**
- ❌ High risk of accidental deletion (critical data)
- ❌ Conflicts with horizontal scroll (table views)
- ❌ Poor discoverability (hidden action)
- ❌ Undo is complex for server actions
- ✅ Better: Long press → Bottom sheet with Delete option

**Implementation:**

```tsx
// DON'T: Swipe-to-delete
<SwipeableCard onSwipeLeft={() => handleDelete(id)}>
  {/* Too risky! */}
</SwipeableCard>

// DO: Long press → Context menu
function useContextMenu(itemId: string) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const handleLongPress = useLongPress(() => {
    setIsMenuOpen(true)
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10)
  }, 500) // 500ms press

  return {
    ...handleLongPress,
    menu: (
      <BottomSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <MenuItem icon={Edit} onClick={() => handleEdit(itemId)}>
          Edit
        </MenuItem>
        <MenuItem icon={Trash2} onClick={() => handleDelete(itemId)} danger>
          Delete
        </MenuItem>
      </BottomSheet>
    )
  }
}

// Usage
function ProgramCard({ program }) {
  const contextMenu = useContextMenu(program.id)
  
  return (
    <div {...contextMenu} className="p-4 border rounded-lg">
      {/* Card content */}
      {contextMenu.menu}
    </div>
  )
}
```

#### 4.2 Gesture Implementation Guide

**Swipe Down to Dismiss (Bottom Sheet):**

```tsx
function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    // Only drag down, not up
    if (diff > 0) {
      setDragY(diff)
    }
  }

  const handleTouchEnd = () => {
    // Close if dragged more than 100px
    if (dragY > 100) {
      onClose()
    }
    setDragY(0)
  }

  return (
    <div
      className="bottom-sheet"
      style={{ transform: `translateY(${dragY}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="handle" /> {/* Drag indicator */}
      {children}
    </div>
  )
}
```

**Pull-to-Refresh:**

```tsx
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    // Only if scrolled to top
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY === 0 && startY.current > 0) {
      const diff = e.touches[0].clientY - startY.current
      if (diff > 0) {
        setPullDistance(Math.min(diff, 100)) // Max 100px
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 60) { // Threshold
      setIsPulling(true)
      await onRefresh()
      setIsPulling(false)
    }
    setPullDistance(0)
    startY.current = 0
  }

  return { isPulling, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd }
}
```

---

### 5. Offline Support Strategy

**Decision:** **Cache-First for Reads, Network-Only for Writes** with optimistic updates

#### 5.1 What to Cache

| Data Type | Cache Strategy | Max Age | Why |
|-----------|----------------|---------|-----|
| **Program List** | Cache-first, stale-while-revalidate | 5 min | Frequently viewed, slow-changing |
| **Program Details** | Cache-first, stale-while-revalidate | 5 min | High read frequency |
| **Enrolled Students** | Network-first, fallback cache | 2 min | Changes frequently |
| **Instructor List** | Cache-first | 30 min | Rarely changes |
| **Package List** | Cache-first | 1 hour | Static data |
| **Booking List** | Network-first, fallback cache | 1 min | Real-time critical |
| **Assignment Calendar** | Network-first, fallback cache | 5 min | Time-sensitive |
| **API Mutations** | Network-only, queue offline | - | Must be accurate |

#### 5.2 Service Worker Implementation

**Cache Strategy:**

```javascript
// sw.js
const CACHE_NAME = 'classes-v2-cache-v1'
const OFFLINE_PAGE = '/offline.html'

// Cache-first with network fallback
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  
  if (cached) {
    // Return cached, fetch in background to update
    const networkFetch = fetch(request).then(response => {
      cache.put(request, response.clone())
      return response
    })
    return cached
  }
  
  // Not in cache, fetch from network
  try {
    const response = await fetch(request)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    // Network failed, check if we have offline page
    if (request.mode === 'navigate') {
      return cache.match(OFFLINE_PAGE)
    }
    throw error
  }
}

// Network-first with cache fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests
  if (url.pathname.startsWith('/api/v2/containers')) {
    event.respondWith(cacheFirst(request))
  } else if (url.pathname.startsWith('/api/v2/assignments')) {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/api/v2/bookings')) {
    event.respondWith(networkFirst(request))
  }
})
```

#### 5.3 Offline Queue for Mutations

**Implementation:**

```typescript
// offline-queue.service.ts
interface QueuedAction {
  id: string
  type: 'create' | 'update' | 'delete'
  resource: 'container' | 'assignment' | 'booking'
  data: any
  timestamp: number
}

class OfflineQueueService {
  private queue: QueuedAction[] = []
  private readonly STORAGE_KEY = 'offline_queue'

  constructor() {
    this.loadQueue()
    this.setupNetworkListener()
  }

  async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    
    this.queue.push(queuedAction)
    this.saveQueue()
    
    // Show user feedback
    this.showOfflineToast()
  }

  async processQueue() {
    if (!navigator.onLine) return
    
    const toProcess = [...this.queue]
    this.queue = []
    
    for (const action of toProcess) {
      try {
        await this.executeAction(action)
      } catch (error) {
        // Re-queue on failure
        this.queue.push(action)
      }
    }
    
    this.saveQueue()
  }

  private setupNetworkListener() {
    window.addEventListener('online', () => {
      this.processQueue()
    })
  }

  private showOfflineToast() {
    toast.info('Action saved. Will sync when online.', {
      icon: '📡',
      duration: 3000,
    })
  }
}
```

#### 5.4 Offline UI Indicators

**Visual Feedback:**

```tsx
function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  if (isOnline) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-sm text-center">
      <WifiOff className="inline w-4 h-4 mr-2" />
      You're offline. Some features may be limited.
    </div>
  )
}

// In data displays
function ProgramCard({ program, isCached }: Props) {
  return (
    <div className="relative">
      {isCached && (
        <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
          <Database className="inline w-3 h-3 mr-1" />
          Cached
        </div>
      )}
      {/* Card content */}
    </div>
  )
}
```

---

### 6. Pull-to-Refresh Implementation

**Decision:** **Native-style PTR** with custom indicator, enabled on list views only

#### 6.1 When to Enable

**Enable PTR:**
- Container list view ✅
- Booking list view ✅
- Assignment calendar view ✅
- Enrolled students list ✅

**Disable PTR:**
- Modals/bottom sheets ❌ (conflicts with drag-to-dismiss)
- Form views ❌ (accidental triggers)
- Detail views ❌ (not list-based)

#### 6.2 Implementation

```tsx
function ContainerList() {
  const [refreshing, setRefreshing] = useState(false)
  const { refetch } = useContainers()
  
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
      // Haptic feedback on success
      if (navigator.vibrate) navigator.vibrate(20)
    } finally {
      setRefreshing(false)
    }
  }
  
  const pullToRefresh = usePullToRefresh(handleRefresh)
  
  return (
    <div 
      className="container-list"
      {...pullToRefresh}
    >
      {/* Pull indicator */}
      <div 
        className={`
          pull-indicator 
          transition-opacity duration-200
          ${pullToRefresh.pullDistance > 0 ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ height: pullToRefresh.pullDistance }}
      >
        {pullToRefresh.isPulling ? (
          <Loader className="animate-spin" />
        ) : (
          <ArrowDown 
            className={`
              transition-transform 
              ${pullToRefresh.pullDistance > 60 ? 'rotate-180' : ''}
            `}
          />
        )}
      </div>
      
      {/* List content */}
      {containers.map(c => <ContainerCard key={c.id} container={c} />)}
    </div>
  )
}
```

#### 6.3 Alternative: Manual Refresh Button

For users who prefer explicit actions:

```tsx
<div className="sticky top-0 z-10 bg-white border-b">
  <div className="flex items-center justify-between p-4">
    <h1>Programs</h1>
    <button 
      onClick={handleRefresh}
      disabled={refreshing}
      className="p-2"
    >
      <RefreshCw className={refreshing ? 'animate-spin' : ''} />
    </button>
  </div>
</div>
```

---

### 7. FAB (Floating Action Button) Placement

**Decision:** **Bottom-right FAB** for primary create actions on list views

#### 7.1 When to Show FAB

**Show FAB:**
- Container list → Create Program
- Booking list → Create Booking (if permissions)
- Empty states → Primary CTA

**Hide FAB:**
- Detail views (use inline buttons)
- Modals/bottom sheets (use header/footer buttons)
- Edit mode (conflicts with sticky footer)
- Desktop (use header button instead)

#### 7.2 Implementation

```tsx
function ContainerListView() {
  const { isMobile } = useMobileDetect()
  const { hasPermission } = usePermissions()
  
  const canCreateProgram = hasPermission('containers', 'create')
  
  return (
    <div className="container-list-view">
      {/* List content */}
      <ContainerList />
      
      {/* Mobile: FAB */}
      {isMobile && canCreateProgram && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="
            fixed bottom-6 right-6 z-30
            w-14 h-14 rounded-full
            bg-emerald-600 text-white shadow-lg
            flex items-center justify-center
            active:scale-95 transition-transform
          "
          aria-label="Create Program"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      
      {/* Desktop: Header button */}
      {!isMobile && canCreateProgram && (
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="header-action-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      )}
    </div>
  )
}
```

#### 7.3 FAB with Context Menu

For multiple create actions:

```tsx
function MultiFAB() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {/* Secondary actions (show when expanded) */}
      {isExpanded && (
        <>
          <button className="fab-secondary" onClick={handleCreateBooking}>
            <Calendar className="w-5 h-5" />
          </button>
          <button className="fab-secondary" onClick={handleCreateAssignment}>
            <Clock className="w-5 h-5" />
          </button>
        </>
      )}
      
      {/* Primary FAB */}
      <button
        className="fab-primary"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <X /> : <Plus />}
      </button>
    </div>
  )
}
```

---

### 8. Screen Breakpoints

**Decision:** **Tailwind-based breakpoints** with mobile-first approach

#### 8.1 Breakpoint Strategy

| Breakpoint | Width | Target Device | Layout Changes |
|------------|-------|---------------|----------------|
| **sm** | 640px | Large phone (landscape) | Single column → 2 columns for cards |
| **md** | 768px | Tablet (portrait) | Bottom sheets → Side drawers<br>FAB → Header buttons |
| **lg** | 1024px | Tablet (landscape) | 2 columns → 3 columns for cards<br>Full layout with sidebar |
| **xl** | 1280px | Desktop | Max content width, more padding |
| **2xl** | 1536px | Large desktop | Wider modals, more columns |

#### 8.2 Component Breakpoint Map

```tsx
// Container List
<div className="
  grid 
  grid-cols-1           /* Mobile: Stack */
  sm:grid-cols-2        /* Large phone: 2 columns */
  lg:grid-cols-3        /* Desktop: 3 columns */
  gap-4
">
  {containers.map(c => <ContainerCard key={c.id} container={c} />)}
</div>

// Modal Sizing
<Modal
  className="
    w-full h-full          /* Mobile: Full screen */
    md:w-auto md:h-auto    /* Tablet: Centered */
    md:max-w-2xl           /* Tablet: Max width */
    lg:max-w-4xl           /* Desktop: Wider */
  "
>
  {children}
</Modal>

// Sidebar Layout
<div className="
  flex flex-col          /* Mobile: Stack */
  lg:flex-row            /* Desktop: Side-by-side */
">
  <aside className="
    w-full                /* Mobile: Full width */
    lg:w-64               /* Desktop: Fixed sidebar */
  ">
    {/* Filters */}
  </aside>
  <main className="flex-1">
    {/* Content */}
  </main>
</div>

// Typography Scaling
<h1 className="
  text-xl               /* Mobile: Smaller */
  md:text-2xl           /* Tablet: Medium */
  lg:text-3xl           /* Desktop: Larger */
">
  Programs
</h1>

// Padding Scaling
<div className="
  p-4                   /* Mobile: Tight */
  md:p-6                /* Tablet: Medium */
  lg:p-8                /* Desktop: Spacious */
">
  {content}
</div>
```

#### 8.3 Touch Target Sizing

**Minimum Sizes:**

```tsx
// Buttons
<button className="
  min-h-[44px] min-w-[44px]   /* WCAG 2.1 Level AAA */
  px-4 py-2
  text-base                    /* 16px minimum for readability */
">
  Action
</button>

// Interactive cards
<div className="
  p-4                          /* Ample padding */
  min-h-[60px]                 /* Easy to tap */
  cursor-pointer
">
  {content}
</div>

// Checkboxes/Radio
<input 
  type="checkbox" 
  className="
    w-5 h-5                    /* Larger than default */
    cursor-pointer
  "
/>
```

---

### 9. Progressive Enhancement Strategy

**Decision:** **Core functionality works everywhere, enhanced on capable devices**

#### 9.1 Enhancement Layers

| Layer | Feature | Fallback |
|-------|---------|----------|
| **Base** | HTML, CSS, basic JS | Works on all browsers |
| **Enhanced** | React, Tailwind | Graceful degradation |
| **Touch** | Gestures, haptics | Click/tap events |
| **Offline** | Service worker, cache | Live-only mode |
| **Advanced** | Web Share, Notifications | Manual copy/no notifications |

#### 9.2 Feature Detection

```tsx
function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasTouch: false,
    hasHaptics: false,
    hasWebShare: false,
    hasNotifications: false,
    hasServiceWorker: false,
  })

  useEffect(() => {
    setCapabilities({
      hasTouch: 'ontouchstart' in window,
      hasHaptics: 'vibrate' in navigator,
      hasWebShare: 'share' in navigator,
      hasNotifications: 'Notification' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
    })
  }, [])

  return capabilities
}

// Usage
function ContainerCard({ container }) {
  const { hasWebShare, hasHaptics } = useDeviceCapabilities()
  
  const handleShare = async () => {
    if (hasWebShare) {
      await navigator.share({
        title: container.name,
        text: `Check out ${container.name}`,
        url: window.location.href,
      })
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
    
    // Haptic feedback if available
    if (hasHaptics) navigator.vibrate(10)
  }
  
  return <div>{/* Card content */}</div>
}
```

---

### 10. Performance Optimizations for Mobile

**Decision:** **Aggressive optimization** for smooth 60fps scrolling

#### 10.1 Virtual Scrolling

For lists > 50 items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function ContainerList({ containers }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: containers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 5, // Render 5 extra items above/below
  })
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ContainerCard container={containers[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### 10.2 Image Optimization

```tsx
// Lazy load images
<img
  src={program.image_url}
  alt={program.name}
  loading="lazy"
  className="w-full h-48 object-cover"
/>

// Use WebP with fallback
<picture>
  <source srcSet={`${imageUrl}.webp`} type="image/webp" />
  <source srcSet={`${imageUrl}.jpg`} type="image/jpeg" />
  <img src={`${imageUrl}.jpg`} alt="Program" />
</picture>

// Responsive images
<img
  src={imageUrl}
  srcSet={`
    ${imageUrl}?w=400 400w,
    ${imageUrl}?w=800 800w,
    ${imageUrl}?w=1200 1200w
  `}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Program"
/>
```

#### 10.3 Code Splitting

```tsx
// Lazy load heavy components
const CreateProgramForm = lazy(() => import('./forms/CreateProgramForm'))
const AssignmentCalendar = lazy(() => import('./components/AssignmentCalendar'))

function ClassesV2() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<ContainerList />} />
        <Route path="/create" element={<CreateProgramForm />} />
        <Route path="/calendar" element={<AssignmentCalendar />} />
      </Routes>
    </Suspense>
  )
}
```

---

## 🎯 Summary for Tasks 7.2-7.7 (Implementation)

**Implementation Checklist:**

1. **useMobileDetect Hook (Task 7.2):**
   - Detect screen width (< 768px = mobile)
   - Detect user agent
   - Detect touch capability
   - Return: `{ isMobile, isTablet, isDesktop }`

2. **Mobile Components (Task 7.3):**
   - `BottomSheet.tsx` — Draggable sheet with snap points
   - `MobileContainerCard.tsx` — Touch-optimized card
   - `MobileContainerList.tsx` — Virtual scroll, PTR, FAB
   - `MobileFilters.tsx` — Collapsible filter panel

3. **useSwipeGestures Hook (Task 7.4):**
   - Detect swipe direction (left, right, up, down)
   - Minimum distance threshold (50px)
   - Velocity calculation
   - Haptic feedback support

4. **PWA Updates (Tasks 7.5-7.7):**
   - Update `manifest.json` with V2 routes
   - Configure service worker caching
   - Add offline fallback page
   - Implement cache strategies

**Key Design Decisions:**
- **Modals:** Bottom sheets for quick actions, full-screen for forms
- **Navigation:** No global mobile nav, contextual actions only
- **Gestures:** Non-destructive only (no swipe-to-delete)
- **Offline:** Cache-first for reads, network-only for writes
- **PTR:** Enabled on list views only
- **FAB:** Bottom-right for primary create actions
- **Breakpoints:** Tailwind-based, mobile-first (sm: 640px, md: 768px, lg: 1024px)

**File Locations:**
- Hooks: `src/features/dashboard/hooks/v2/useMobileDetect.ts`, `useSwipeGestures.ts`, `usePullToRefresh.ts`
- Components: `src/features/dashboard/components/Modules/ClassesV2/components/mobile/`
- PWA: `public/manifest.json`, `public/sw.js`, `public/offline.html`

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

### Task 7.5: PWA Manifest & Service Worker Strategy ✅
- [x] **Model:** 🟣 PRO
- [x] **Priority:** Medium
- [x] **Estimated Time:** 1 hour
- [x] **Dependencies:** None
- [x] **Description:** Design PWA strategy
- [x] **Deliverable:** PWA strategy document
- [x] **Prompt:** "Design PWA strategy: Which routes to cache? Cache strategy (network-first or cache-first)? Offline fallback behavior? Update notification strategy? Icon sizes and splash screens? Start URL and scope?"
- [x] **Output Location:** Comment for Tasks 7.6, 7.7
- [x] **Notes:** Completed Jan 14, 2026

---

## 📋 Task 7.5 Deliverable: PWA Manifest & Service Worker Strategy

### 1. Overview

**Purpose:** Enable offline-first experience for yoga program management, allowing instructors and admins to work without constant connectivity

**Key Requirements:**
- Installable on mobile/desktop (Add to Home Screen)
- Fast load times via aggressive caching
- Offline access to critical data (schedules, student lists)
- Background sync for mutations when back online
- Update notifications without disrupting workflow
- Native app-like experience

**Design Principle:** **Offline-First, Sync-Smart** — Cache aggressively, sync intelligently, update gracefully

---

### 2. Routes to Cache

**Decision:** **Selective caching** based on route criticality and update frequency

#### 2.1 Cache Priority Levels

| Priority | Routes | Cache Strategy | Max Age | Rationale |
|----------|--------|----------------|---------|-----------|
| **Critical** | `/dashboard/classes-v2`<br>`/dashboard/classes-v2/containers` | Precache + Runtime update | ∞ | Core navigation, must work offline |
| **High** | `/dashboard/classes-v2/container/:id`<br>`/dashboard/classes-v2/assignments` | Cache-first, stale-while-revalidate | 5 min | Frequently accessed, acceptable stale data |
| **Medium** | `/dashboard/bookings`<br>`/dashboard/classes-v2/calendar` | Network-first, fallback cache | 2 min | Time-sensitive, prefer fresh |
| **Low** | `/dashboard/classes-v2/create`<br>`/dashboard/classes-v2/edit/:id` | Network-only, no cache | - | Always need fresh data for forms |
| **Static** | `/assets/*`<br>`/icons/*`<br>`/fonts/*` | Cache-first, immutable | 1 year | Never changes, long-lived cache |

#### 2.2 Route Configuration

```javascript
// sw.js - Route caching configuration
const ROUTES_CONFIG = {
  // Critical routes - Precache on install
  precache: [
    '/dashboard/classes-v2',
    '/dashboard/classes-v2/containers',
    '/offline.html',
    '/manifest.json'
  ],
  
  // Cache-first routes (offline-capable)
  cacheFirst: [
    '/dashboard/classes-v2/container/:id',
    '/dashboard/classes-v2/assignments',
    '/dashboard/classes-v2/students'
  ],
  
  // Network-first routes (prefer fresh)
  networkFirst: [
    '/dashboard/bookings',
    '/dashboard/classes-v2/calendar',
    '/dashboard/classes-v2/analytics'
  ],
  
  // Network-only routes (no offline)
  networkOnly: [
    '/dashboard/classes-v2/create',
    '/dashboard/classes-v2/edit/:id',
    '/dashboard/classes-v2/settings'
  ],
  
  // Static assets (long-lived cache)
  static: [
    '/assets/**',
    '/icons/**',
    '/fonts/**',
    '*.js',
    '*.css',
    '*.woff2'
  ]
}
```

#### 2.3 API Endpoint Caching

```javascript
// API caching rules
const API_CACHE_CONFIG = {
  // Read endpoints - Cache-first
  'GET /api/v2/containers': { strategy: 'cache-first', maxAge: 300 },
  'GET /api/v2/containers/:id': { strategy: 'cache-first', maxAge: 300 },
  'GET /api/v2/packages': { strategy: 'cache-first', maxAge: 3600 },
  'GET /api/v2/instructors': { strategy: 'cache-first', maxAge: 1800 },
  
  // Time-sensitive - Network-first
  'GET /api/v2/assignments': { strategy: 'network-first', maxAge: 120 },
  'GET /api/v2/bookings': { strategy: 'network-first', maxAge: 60 },
  'GET /api/v2/assignments/student/:id': { strategy: 'network-first', maxAge: 120 },
  
  // Mutations - Network-only, queue offline
  'POST /api/v2/containers': { strategy: 'network-only', queueOffline: true },
  'PUT /api/v2/containers/:id': { strategy: 'network-only', queueOffline: true },
  'DELETE /api/v2/containers/:id': { strategy: 'network-only', queueOffline: true },
  'POST /api/v2/assignments': { strategy: 'network-only', queueOffline: true },
  'DELETE /api/v2/assignments/:id': { strategy: 'network-only', queueOffline: true }
}
```

---

### 3. Cache Strategies

**Decision:** **Hybrid approach** — Different strategies for different resource types

#### 3.1 Strategy Definitions

##### Strategy 1: Cache-First (Offline Priority)

**Use For:** Program lists, instructor lists, package data, static assets

**Flow:**
1. Check cache → Return if found
2. If not in cache → Fetch from network
3. Store in cache → Return
4. **Background:** Update cache from network (stale-while-revalidate)

**Implementation:**

```javascript
async function cacheFirst(request, cacheName, maxAge = 300) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Return cached immediately
  if (cached) {
    const cacheDate = new Date(cached.headers.get('sw-cache-date'))
    const age = (Date.now() - cacheDate.getTime()) / 1000
    
    // If stale, update in background
    if (age > maxAge) {
      fetch(request)
        .then(response => {
          if (response.ok) {
            const cloned = response.clone()
            const headers = new Headers(cloned.headers)
            headers.set('sw-cache-date', new Date().toISOString())
            cache.put(request, new Response(cloned.body, { 
              status: cloned.status, 
              headers 
            }))
          }
        })
        .catch(() => {}) // Silent fail, already have cached
    }
    
    return cached
  }
  
  // Not in cache, fetch and cache
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cloned = response.clone()
      const headers = new Headers(cloned.headers)
      headers.set('sw-cache-date', new Date().toISOString())
      cache.put(request, new Response(cloned.body, { 
        status: cloned.status, 
        headers 
      }))
    }
    return response
  } catch (error) {
    // Network failed, no cache available
    return new Response('Offline and no cache available', { status: 503 })
  }
}
```

##### Strategy 2: Network-First (Fresh Priority)

**Use For:** Bookings, assignments, calendar, real-time data

**Flow:**
1. Fetch from network → Return if successful
2. Store in cache
3. If network fails → Return cached (if available)
4. If no cache → Return offline page

**Implementation:**

```javascript
async function networkFirst(request, cacheName, maxAge = 60) {
  const cache = await caches.open(cacheName)
  
  try {
    // Try network first
    const response = await fetch(request)
    
    if (response.ok) {
      // Cache successful response
      const cloned = response.clone()
      const headers = new Headers(cloned.headers)
      headers.set('sw-cache-date', new Date().toISOString())
      cache.put(request, new Response(cloned.body, { 
        status: cloned.status, 
        headers 
      }))
    }
    
    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request)
    
    if (cached) {
      // Add stale indicator header
      const headers = new Headers(cached.headers)
      headers.set('X-From-Cache', 'true')
      headers.set('X-Cache-Stale', 'true')
      
      return new Response(cached.body, {
        status: cached.status,
        headers
      })
    }
    
    // No cache available, return offline page
    return caches.match('/offline.html')
  }
}
```

##### Strategy 3: Network-Only (Always Fresh)

**Use For:** Forms, mutations, sensitive data

**Flow:**
1. Fetch from network → Return
2. If offline → Queue for later (Background Sync)

**Implementation:**

```javascript
async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch (error) {
    // If POST/PUT/DELETE, queue for background sync
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      await queueRequest(request)
      return new Response(
        JSON.stringify({ 
          queued: true, 
          message: 'Request queued. Will sync when online.' 
        }),
        { 
          status: 202, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // GET request offline
    return new Response('Network required', { status: 503 })
  }
}
```

##### Strategy 4: Stale-While-Revalidate (Best of Both)

**Use For:** Container details, assignment history

**Flow:**
1. Return cached immediately (instant load)
2. Fetch from network in background
3. Update cache for next time

**Implementation:**

```javascript
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Fetch in background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const cloned = response.clone()
        const headers = new Headers(cloned.headers)
        headers.set('sw-cache-date', new Date().toISOString())
        cache.put(request, new Response(cloned.body, { 
          status: cloned.status, 
          headers 
        }))
      }
      return response
    })
    .catch(() => {}) // Silent fail
  
  // Return cached immediately (or wait for fetch if no cache)
  return cached || fetchPromise
}
```

#### 3.2 Strategy Selection Matrix

```javascript
// Service Worker fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET for cache strategies
  if (request.method !== 'GET' && !['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return
  }
  
  // API requests
  if (url.pathname.startsWith('/api/v2/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }
  
  // Static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2|ttf)$/)) {
    event.respondWith(cacheFirst(request, 'static-v1', 31536000)) // 1 year
    return
  }
  
  // Navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }
})

async function handleAPIRequest(request) {
  const url = new URL(request.url)
  const endpoint = url.pathname
  const method = request.method
  
  const cacheKey = `${method} ${endpoint}`
  const config = API_CACHE_CONFIG[cacheKey] || { strategy: 'network-only' }
  
  switch (config.strategy) {
    case 'cache-first':
      return cacheFirst(request, 'api-v1', config.maxAge)
    case 'network-first':
      return networkFirst(request, 'api-v1', config.maxAge)
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, 'api-v1')
    default:
      return networkOnly(request)
  }
}

async function handleNavigation(request) {
  const url = new URL(request.url)
  
  // Critical routes - Cache-first
  if (ROUTES_CONFIG.cacheFirst.some(route => matchRoute(url.pathname, route))) {
    return cacheFirst(request, 'pages-v1', 300)
  }
  
  // Network-first routes
  if (ROUTES_CONFIG.networkFirst.some(route => matchRoute(url.pathname, route))) {
    return networkFirst(request, 'pages-v1', 120)
  }
  
  // Network-only routes
  if (ROUTES_CONFIG.networkOnly.some(route => matchRoute(url.pathname, route))) {
    return networkOnly(request)
  }
  
  // Default: Network-first
  return networkFirst(request, 'pages-v1', 300)
}
```

---

### 4. Offline Fallback Behavior

**Decision:** **Contextual fallbacks** — Different offline pages for different scenarios

#### 4.1 Fallback Types

| Scenario | Fallback | User Experience |
|----------|----------|-----------------|
| **Page not cached** | `/offline.html` | Generic offline page with retry button |
| **API read fails** | Cached data + stale badge | Show old data with "Offline" indicator |
| **API write fails** | Queue + notification | "Saved locally. Will sync when online." |
| **Asset fails** | Placeholder | Generic icon/image placeholder |
| **Critical error** | Error boundary | Graceful error page with refresh option |

#### 4.2 Offline Page Design

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Classes V2</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .offline-icon {
      width: 120px;
      height: 120px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 32px;
      margin: 0 0 16px 0;
    }
    p {
      font-size: 18px;
      opacity: 0.9;
      margin: 0 0 32px 0;
      max-width: 400px;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
    button:active {
      transform: scale(0.95);
    }
    .cached-notice {
      margin-top: 48px;
      padding: 16px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
  </svg>
  
  <h1>You're Offline</h1>
  <p>This page requires an internet connection. Please check your connection and try again.</p>
  
  <button onclick="location.reload()">Try Again</button>
  
  <div class="cached-notice">
    💡 Tip: Some pages work offline. Try navigating to Programs or Assignments.
  </div>
  
  <script>
    // Auto-retry when back online
    window.addEventListener('online', () => {
      location.reload()
    })
  </script>
</body>
</html>
```

#### 4.3 Stale Data Indicator

```tsx
// Component wrapper for offline/stale data
function OfflineDataBanner({ isStale, lastUpdated }: Props) {
  if (!isStale) return null
  
  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-orange-800">
            Viewing cached data
          </p>
          <p className="text-xs text-orange-700">
            Last updated: {formatRelativeTime(lastUpdated)}
          </p>
        </div>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        Refresh
      </button>
    </div>
  )
}
```

#### 4.4 Background Sync Queue

```typescript
// offline-queue.service.ts
interface QueuedRequest {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  timestamp: number
  retries: number
}

class OfflineQueueService {
  private readonly QUEUE_KEY = 'offline_request_queue'
  private readonly MAX_RETRIES = 3
  
  async enqueue(request: Request): Promise<void> {
    const queue = await this.getQueue()
    
    const queuedRequest: QueuedRequest = {
      id: crypto.randomUUID(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now(),
      retries: 0
    }
    
    queue.push(queuedRequest)
    await this.saveQueue(queue)
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in registration) {
      await registration.sync.register('sync-offline-queue')
    }
  }
  
  async processQueue(): Promise<void> {
    const queue = await this.getQueue()
    const processed: string[] = []
    const failed: QueuedRequest[] = []
    
    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        })
        
        if (response.ok) {
          processed.push(item.id)
          this.notifySuccess(item)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        item.retries++
        
        if (item.retries >= this.MAX_RETRIES) {
          processed.push(item.id) // Remove from queue
          this.notifyFailure(item, error)
        } else {
          failed.push(item)
        }
      }
    }
    
    // Update queue (keep only failed items that can retry)
    const newQueue = failed
    await this.saveQueue(newQueue)
  }
  
  private async getQueue(): Promise<QueuedRequest[]> {
    const stored = localStorage.getItem(this.QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  }
  
  private async saveQueue(queue: QueuedRequest[]): Promise<void> {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
  }
  
  private notifySuccess(item: QueuedRequest): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Action synced', {
        body: 'Your offline action has been saved.',
        icon: '/icons/icon-72x72.png'
      })
    }
  }
  
  private notifyFailure(item: QueuedRequest, error: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Sync failed', {
        body: 'Some offline actions could not be saved. Please try manually.',
        icon: '/icons/icon-72x72.png'
      })
    }
  }
}
```

---

### 5. Update Notification Strategy

**Decision:** **Non-intrusive updates** with manual activation option

#### 5.1 Update Detection

```javascript
// sw.js - Service Worker lifecycle
const VERSION = 'v1.2.0'
const CACHE_NAMES = {
  static: `static-${VERSION}`,
  pages: `pages-${VERSION}`,
  api: `api-${VERSION}`
}

// Install - Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll([
        '/dashboard/classes-v2',
        '/offline.html',
        '/assets/main.js',
        '/assets/main.css',
        '/icons/icon-192x192.png'
      ])
    })
  )
  
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old versions
            return !Object.values(CACHE_NAMES).includes(name)
          })
          .map((name) => caches.delete(name))
      )
    })
  )
  
  // Take control of all clients immediately
  return self.clients.claim()
})
```

#### 5.2 Update UI Component

```tsx
// UpdateNotification.tsx
function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)
        
        // Check for updates every 30 minutes
        setInterval(() => {
          reg.update()
        }, 30 * 60 * 1000)
      })
      
      // Listen for update available
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true)
      })
      
      // Check if waiting worker exists
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          setUpdateAvailable(true)
        }
      })
    }
  }, [])
  
  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell waiting SW to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload page to activate new SW
      window.location.reload()
    }
  }
  
  const handleDismiss = () => {
    setUpdateAvailable(false)
  }
  
  if (!updateAvailable) return null
  
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Update Available
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            A new version of Classes V2 is ready. Update now for the latest features.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
            >
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 5.3 Update Strategies

| Strategy | When to Use | User Experience |
|----------|-------------|-----------------|
| **Silent** | Bug fixes, small updates | No notification, auto-activate on next visit |
| **Prompt** | Feature updates | Toast notification with "Update" button |
| **Force** | Critical security patches | Full-screen modal, must update to continue |
| **Schedule** | Large updates | "Update available. Refresh when ready." |

```typescript
// Update strategy configuration
interface UpdateConfig {
  version: string
  type: 'silent' | 'prompt' | 'force' | 'schedule'
  message?: string
  minVersion?: string // Force if current < minVersion
}

const UPDATE_CONFIG: UpdateConfig = {
  version: '1.2.0',
  type: 'prompt',
  message: 'New mobile features and performance improvements',
  minVersion: '1.0.0' // Force update if below this
}
```

---

### 6. Icon Sizes and Splash Screens

**Decision:** **Complete icon set** for all platforms with high-quality assets

#### 6.1 Required Icon Sizes

```json
{
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

#### 6.2 Icon Design Guidelines

**Standard Icons (purpose: "any"):**
- Transparent background
- 10% safe zone padding
- Clear, recognizable symbol (lotus, yoga pose, or "C" monogram)
- Use brand colors (primary: #10b981, secondary: #667eea)

**Maskable Icons (purpose: "maskable"):**
- Opaque background (brand color)
- 40% safe zone padding (icon centered)
- Ensures icon not cropped on adaptive icons (Android)

#### 6.3 Splash Screen Configuration

```json
{
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "splash_pages": null
}
```

**Note:** Modern browsers (Chrome, Safari) auto-generate splash screens from:
- `background_color` → Background
- `theme_color` → Status bar
- Largest icon → Centered logo

#### 6.4 Apple-Specific Meta Tags

```html
<!-- public/index.html -->
<head>
  <!-- iOS splash screens -->
  <link rel="apple-touch-icon" href="/icons/icon-180x180.png">
  <link rel="apple-touch-startup-image" href="/splash/iphone5.png" media="(device-width: 320px) and (device-height: 568px)">
  <link rel="apple-touch-startup-image" href="/splash/iphone6.png" media="(device-width: 375px) and (device-height: 667px)">
  <link rel="apple-touch-startup-image" href="/splash/iphoneplus.png" media="(device-width: 414px) and (device-height: 736px)">
  <link rel="apple-touch-startup-image" href="/splash/iphonex.png" media="(device-width: 375px) and (device-height: 812px)">
  <link rel="apple-touch-startup-image" href="/splash/ipad.png" media="(device-width: 768px) and (device-height: 1024px)">
  
  <!-- iOS status bar style -->
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  
  <!-- iOS title -->
  <meta name="apple-mobile-web-app-title" content="Classes V2">
</head>
```

---

### 7. Start URL and Scope

**Decision:** **Specific to Classes V2 module** with dashboard fallback

#### 7.1 Manifest Configuration

```json
{
  "name": "Yogique Classes V2",
  "short_name": "Classes V2",
  "description": "Manage yoga programs, assignments, and bookings",
  "start_url": "/dashboard/classes-v2?source=pwa",
  "scope": "/dashboard/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "dir": "ltr",
  "lang": "en-US"
}
```

#### 7.2 Configuration Rationale

| Field | Value | Rationale |
|-------|-------|-----------|
| **start_url** | `/dashboard/classes-v2?source=pwa` | Opens directly to V2 module<br>Query param tracks PWA launches |
| **scope** | `/dashboard/` | Allows navigation to other dashboard modules<br>Prevents going outside dashboard |
| **display** | `standalone` | Full-screen, no browser UI<br>Native app-like experience |
| **orientation** | `portrait-primary` | Optimized for mobile portrait<br>Allows rotation if needed |

#### 7.3 Scope Behavior

**Inside Scope (`/dashboard/*`):**
- Stays in PWA mode
- No browser chrome
- Native-like experience

**Outside Scope (e.g., `/login`, `/public/*`):**
- Opens in browser tab
- Shows browser UI
- User can return to PWA

```javascript
// Handle navigation outside scope
window.addEventListener('click', (event) => {
  const target = event.target.closest('a')
  if (!target) return
  
  const url = new URL(target.href)
  const isOutsideScope = !url.pathname.startsWith('/dashboard/')
  
  if (isOutsideScope) {
    // Open in new tab/browser
    event.preventDefault()
    window.open(target.href, '_blank')
  }
})
```

#### 7.4 Deep Linking Support

```javascript
// Handle deep links
if ('launchQueue' in window) {
  window.launchQueue.setConsumer((launchParams) => {
    if (launchParams.targetURL) {
      const url = new URL(launchParams.targetURL)
      // Navigate to specific container or assignment
      if (url.pathname.includes('/container/')) {
        const containerId = url.pathname.split('/').pop()
        navigateToContainer(containerId)
      }
    }
  })
}
```

---

## 🎯 Summary for Tasks 7.6-7.7 (Implementation)

**Implementation Checklist:**

### Task 7.6: Update PWA Manifest

1. **Update `public/manifest.json`:**
   - Set `name: "Yogique Classes V2"`
   - Set `short_name: "Classes V2"`
   - Set `start_url: "/dashboard/classes-v2?source=pwa"`
   - Set `scope: "/dashboard/"`
   - Set `display: "standalone"`
   - Set `orientation: "portrait-primary"`
   - Set `theme_color: "#10b981"`
   - Set `background_color: "#ffffff"`
   - Add complete icons array (72px → 512px)
   - Add maskable icons (192px, 512px)

2. **Create Missing Icons:**
   - Generate icon sizes: 72, 96, 128, 144, 152, 192, 384, 512
   - Generate maskable icons: 192, 512 (with 40% padding)
   - Use brand colors and clear yoga-related symbol

3. **Add Apple Meta Tags to `index.html`:**
   - `<link rel="apple-touch-icon">`
   - `<meta name="apple-mobile-web-app-capable">`
   - `<meta name="apple-mobile-web-app-status-bar-style">`
   - `<meta name="apple-mobile-web-app-title">`

### Task 7.7: Configure Service Worker

1. **Update `public/sw.js`:**
   - Add version constant (`const VERSION = 'v1.0.0'`)
   - Define cache names (static, pages, api)
   - Implement `cacheFirst()` strategy
   - Implement `networkFirst()` strategy
   - Implement `networkOnly()` strategy
   - Implement `staleWhileRevalidate()` strategy
   - Add route configuration (`ROUTES_CONFIG`)
   - Add API cache configuration (`API_CACHE_CONFIG`)
   - Implement fetch event handler with strategy routing
   - Implement install event (precache critical assets)
   - Implement activate event (cleanup old caches)

2. **Create `offline.html`:**
   - Full-screen offline page with retry button
   - Auto-reload when back online
   - List cached routes available offline

3. **Create OfflineQueueService:**
   - `src/features/dashboard/services/v2/offline-queue.service.ts`
   - Implement `enqueue()` for failed mutations
   - Implement `processQueue()` for background sync
   - Implement Background Sync API integration
   - Add success/failure notifications

4. **Create UpdateNotification Component:**
   - `src/features/dashboard/components/common/UpdateNotification.tsx`
   - Detect service worker updates
   - Show toast notification with "Update Now" button
   - Handle `SKIP_WAITING` message
   - Auto-check for updates every 30 minutes

5. **Add Stale Data Indicators:**
   - `OfflineDataBanner` component
   - Check `X-From-Cache` and `X-Cache-Stale` headers
   - Display banner when viewing cached data
   - Show last updated timestamp

**Key Design Decisions:**
- **Routes:** Cache-first for programs, network-first for bookings
- **Strategies:** Hybrid approach based on data criticality
- **Offline:** Queue mutations, show stale data with indicators
- **Updates:** Non-intrusive toast with manual activation
- **Icons:** Complete set (72-512px) + maskable variants
- **Start URL:** `/dashboard/classes-v2?source=pwa`
- **Scope:** `/dashboard/` (allow dashboard navigation)

**File Locations:**
- Manifest: `public/manifest.json`
- Service Worker: `public/sw.js`
- Offline Page: `public/offline.html`
- Queue Service: `src/features/dashboard/services/v2/offline-queue.service.ts`
- Update Component: `src/features/dashboard/components/common/UpdateNotification.tsx`
- Icons: `public/icons/` (10 files)

**Testing Checklist:**
- [ ] Install PWA on mobile (Add to Home Screen)
- [ ] Test offline mode (disable network in DevTools)
- [ ] Verify cache strategies (Network tab, Application → Cache Storage)
- [ ] Test background sync (queue mutation while offline)
- [ ] Test update notification (change VERSION in sw.js)
- [ ] Verify deep links (open specific program from home screen)
- [ ] Test on iOS Safari (different PWA behavior)
- [ ] Test on Android Chrome (maskable icons)

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
