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
- **Completed:** 0 / 65
- **In Progress:** 0 / 65
- **Blocked:** 0 / 65

---

## 📋 Phase 1: Foundation Setup (Week 1)

**Goal:** Project structure, types, services skeleton, basic routing

### Task 1.1: Project Structure Planning
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Review existing src/ structure and validate V2 folder structure from architecture doc
- [ ] **Deliverable:** Approved folder structure list
- [ ] **Prompt:** "Review existing src/ structure in this workspace and confirm the V2 folder structure from CLASS_ASSIGNMENT_V2_ARCHITECTURE.md (File Structure section). Check for naming conflicts with existing modules."
- [ ] **Output Location:** Comment or separate doc
- [ ] **Notes:**

---

### Task 1.2: Create Folder Structure
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 15 minutes
- [ ] **Dependencies:** Task 1.1 ✓
- [ ] **Description:** Create all folders under src/features/dashboard/components/Modules/ClassesV2/
- [ ] **Deliverable:** Complete folder structure with .gitkeep files
- [ ] **Prompt:** "Create the following folder structure under src/features/dashboard/components/Modules/: ClassesV2/ ├── components/ │ ├── modals/ │ ├── mobile/ │ └── [other folders from Task 1.1] ├── forms/ ├── services/ ├── hooks/ ├── types/ └── utils/. Add .gitkeep to empty folders."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/
- [ ] **Notes:**

---

### Task 1.3: TypeScript Type Definitions Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design TypeScript interfaces based on database schema and business rules
- [ ] **Deliverable:** Complete type definitions with JSDoc comments
- [ ] **Prompt:** "Based on CLASS_ASSIGNMENT_V2_ARCHITECTURE.md database schema and CLASS_TYPE_MANAGER_V2_INTEGRATION.md, design TypeScript interfaces for: Container (Program), Assignment, Package, Booking. Consider: Optional vs required fields, Instructor optional at program level, Timezone handling, Readonly fields from database."
- [ ] **Output Location:** Comment for Task 1.4
- [ ] **Notes:**

---

### Task 1.4: Create Type Files
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** Task 1.3 ✓
- [ ] **Description:** Create type definition files from Pro's design
- [ ] **Deliverable:** Type files with interfaces and exports
- [ ] **Prompt:** "Create these type definition files using interfaces from Task 1.3: 1. src/features/dashboard/types/v2/container.types.ts 2. src/features/dashboard/types/v2/assignment.types.ts 3. src/features/dashboard/types/v2/capacity.types.ts"
- [ ] **Output Location:** src/features/dashboard/types/v2/
- [ ] **Notes:**

---

### Task 1.5: Route Configuration Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Decide on route naming, permission levels, avoid V1 conflicts
- [ ] **Deliverable:** Route configuration strategy document
- [ ] **Prompt:** "Review roleConfig.ts and BOOKING_ASSIGNMENT_ROLES_MODULES.md. Decide: Best route name (/programs-v2 or /classes-v2)? Which roles get access initially? How to avoid conflicts with existing class_assignment route? Should we use feature flags?"
- [ ] **Output Location:** Comment for Task 1.6
- [ ] **Notes:**

---

### Task 1.6: Update roleConfig.ts
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 15 minutes
- [ ] **Dependencies:** Task 1.5 ✓
- [ ] **Description:** Add V2 module to role configuration
- [ ] **Deliverable:** Updated roleConfig.ts with new module
- [ ] **Prompt:** "Update src/shared/config/roleConfig.ts: Add to super_admin and admin modules per Task 1.5 decision. Update DashboardModule type to include new module ID."
- [ ] **Output Location:** src/shared/config/roleConfig.ts
- [ ] **Notes:**

---

### Task 1.7: Service Layer Architecture Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design service layer with error handling, caching, query patterns
- [ ] **Deliverable:** Service architecture design document
- [ ] **Prompt:** "Design the service layer architecture for V2: ContainerService methods, PackageService integration, AssignmentService structure. Decide: Class-based or functional? Error handling patterns? Query optimization (joins vs multiple)? Caching strategy?"
- [ ] **Output Location:** Comment for Task 1.8
- [ ] **Notes:**

---

### Task 1.8: Create Service Skeleton
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 1.7 ✓
- [ ] **Description:** Create service files with method signatures and JSDoc
- [ ] **Deliverable:** Service skeleton files
- [ ] **Prompt:** "Create skeleton files per Task 1.7 design: 1. container.service.ts 2. package.service.ts 3. assignment.service.ts 4. capacity.service.ts 5. validation.service.ts. Include method signatures, type imports, TODO comments, error handling structure."
- [ ] **Output Location:** src/features/dashboard/services/v2/
- [ ] **Notes:**

---

### Task 1.9: Hook Design Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design React hooks with polling, caching, state management
- [ ] **Deliverable:** Hook design patterns document
- [ ] **Prompt:** "Design React hooks for V2: useContainers (with polling) strategy, usePackages caching approach, useMobileDetect implementation. Decide: Context for shared state or prop drilling? Error boundary strategy?"
- [ ] **Output Location:** Comment for Task 1.10
- [ ] **Notes:**

---

### Task 1.10: Create Hook Skeletons
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** Task 1.9 ✓
- [ ] **Description:** Create hook files with basic structure
- [ ] **Deliverable:** Hook skeleton files
- [ ] **Prompt:** "Create hook skeleton files per Task 1.9: 1. useContainers.ts 2. usePackages.ts 3. useAssignments.ts 4. useMobileDetect.ts 5. useCapacity.ts. Include hook signatures, return types, TODO comments, useState/useEffect placeholders."
- [ ] **Output Location:** src/features/dashboard/hooks/v2/
- [ ] **Notes:**

---

### Task 1.11: Main Dashboard Component Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design ClassesDashboard state management and component composition
- [ ] **Deliverable:** Component architecture document
- [ ] **Prompt:** "Design ClassesDashboard main component: State management (local vs context)? Component composition? Mobile vs Desktop rendering? Loading states? Modal management? Drawer state?"
- [ ] **Output Location:** Comment for Task 1.12
- [ ] **Notes:**

---

### Task 1.12: Create Main Dashboard Component (Skeleton)
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 45 minutes
- [ ] **Dependencies:** Task 1.11 ✓
- [ ] **Description:** Create ClassesDashboard component skeleton
- [ ] **Deliverable:** ClassesDashboard.tsx skeleton
- [ ] **Prompt:** "Create ClassesDashboard.tsx per Task 1.11 design: Component shell with TypeScript, state declarations (empty), return JSX skeleton with div placeholders, import statements, TODO comments."
- [ ] **Output Location:** src/features/dashboard/components/Modules/ClassesV2/ClassesDashboard.tsx
- [ ] **Notes:**

---

## 📋 Phase 2: Container Service Implementation (Week 2)

**Goal:** Complete service layer with validation, CRUD operations

### Task 2.1: Package Fetching Logic Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** None
- [ ] **Description:** Design package fetching with filtering, error handling
- [ ] **Deliverable:** Package fetching specification
- [ ] **Prompt:** "Design package fetching logic: Filter active only? Which fields needed? Join with class_types? Error handling for corrupted data? Caching strategy?"
- [ ] **Output Location:** Comment for Task 2.2
- [ ] **Notes:**

---

### Task 2.2: Implement PackageService.fetchPackages()
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** High
- [ ] **Estimated Time:** 30 minutes
- [ ] **Dependencies:** Task 2.1 ✓
- [ ] **Description:** Implement package fetching method
- [ ] **Deliverable:** Working fetchPackages method
- [ ] **Prompt:** "Implement PackageService.fetchPackages() per Task 2.1 spec. Use Supabase client, include error handling, return typed result."
- [ ] **Output Location:** src/features/dashboard/services/v2/package.service.ts
- [ ] **Notes:**

---

### Task 2.3: Container CRUD Logic Design
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 2 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design container CRUD with business rules and validation
- [ ] **Deliverable:** Container CRUD specification
- [ ] **Prompt:** "Design ContainerService CRUD: CreateContainer with instructor_id=null handling, display name generation. UpdateContainer validations. DeleteContainer soft delete rules. Capacity validation. Container code generation algorithm. Transaction handling."
- [ ] **Output Location:** Comment for Task 2.4
- [ ] **Notes:**

---

### Task 2.4: Implement ContainerService.createContainer()
- [ ] **Model:** 🟢 MINI
- [ ] **Priority:** Critical
- [ ] **Estimated Time:** 1 hour
- [ ] **Dependencies:** Task 2.3 ✓
- [ ] **Description:** Implement container creation
- [ ] **Deliverable:** Working createContainer method
- [ ] **Prompt:** "Implement ContainerService.createContainer() per Task 2.3 spec: Validation checks, container code generation, display name generation (with instructor or 'Unassigned'), Supabase insert, error handling, return typed result."
- [ ] **Output Location:** src/features/dashboard/services/v2/container.service.ts
- [ ] **Notes:**

---

### Task 2.5: Validation Rules Strategy
- [ ] **Model:** 🟣 PRO
- [ ] **Priority:** High
- [ ] **Estimated Time:** 1.5 hours
- [ ] **Dependencies:** None
- [ ] **Description:** Design validation strategy for containers and assignments
- [ ] **Deliverable:** Complete validation strategy
- [ ] **Prompt:** "Review CLASS_ASSIGNMENT_V2_ARCHITECTURE.md validation section and design: Client-side validation for containers, assignments, timezone conflict checking, crash course validations. When to validate client vs server?"
- [ ] **Output Location:** Comment for Tasks 2.6, 2.7
- [ ] **Notes:**

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
