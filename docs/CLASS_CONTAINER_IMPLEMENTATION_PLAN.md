# Class Container / Assignment Container - Implementation Plan

## 📋 Executive Summary

This plan implements a **Class Container** architecture to group assignments uniformly across all class types (Monthly Individual, Public Group, Private Group, Crash Course). The container becomes the single source of truth for grouping in UI and logic, with configurable booking capacity rules.

---

## 🎯 Current System Analysis

### Existing Tables
- `class_assignments` - Individual class records
- `assignment_bookings` - Junction table (assignment_id → booking_id)
- `bookings` - User bookings with booking_id (TEXT format: YOG-YYYYMMDD-XXXX)
- `class_packages` - Package definitions

### Current Grouping Logic (Problem)
**Location:** `ClassAssignmentManager.tsx:409-430`

Currently groups by:
- Crash courses: `instructor_id + package_id` 
- Monthly/Weekly: Complex logic with multiple booking IDs
- Falls back to "Unknown Class" when no clear grouping

**Issues:**
- No unified container concept
- Booking IDs used for grouping (incorrect)
- No capacity validation
- Auto-scheduled classes may not appear in correct groups

### Current Auto-Scheduling (T-5 Logic)
**Location:** `supabase/deploy/generate_t5_invoices.sql` + Edge Function

**How it works:**
1. Daily cron at 1 AM UTC checks all `is_recurring = true` bookings
2. At T-5 days before `billing_cycle_anchor`, generates:
   - Invoice for next month
   - All class assignments for that month
3. Classes created based on:
   - `preferred_days` array in bookings table
   - Package `class_count`
   - Month boundaries (natural calendar months)
4. Assigns `calendar_month = 'YYYY-MM'` to each class
5. Links via `assignment_bookings` junction table

**Must preserve:** This logic continues working as-is, but newly generated classes must automatically reference correct `class_container_id`.

---

## 🏗️ Architecture Design

### New Table: `class_containers`

```sql
CREATE TABLE public.class_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Container Identity
    container_code VARCHAR(32) UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
    display_name TEXT NOT NULL,
    
    -- Container Type (defines rules)
    container_type TEXT NOT NULL CHECK (container_type IN (
        'individual',
        'public_group',
        'private_group',
        'crash_course'
    )),
    
    -- Core References
    instructor_id UUID NOT NULL REFERENCES profiles(user_id),
    class_type_id UUID REFERENCES class_types(id),
    package_id UUID REFERENCES class_packages(id),
    
    -- Booking Capacity Management
    max_booking_count INTEGER NOT NULL DEFAULT 1,
    current_booking_count INTEGER NOT NULL DEFAULT 0,
    
    -- Validity: Computed as MAX(bookings.billing_cycle_end_date)
    -- Container active until last associated booking expires
    
    -- Metadata
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT chk_booking_count CHECK (current_booking_count >= 0),
    CONSTRAINT chk_booking_capacity CHECK (current_booking_count <= max_booking_count),
    CONSTRAINT chk_individual_single CHECK (
        container_type != 'individual' OR max_booking_count = 1
    )
);

-- Indexes
CREATE INDEX idx_class_containers_instructor ON class_containers(instructor_id);
CREATE INDEX idx_class_containers_type ON class_containers(container_type);
CREATE INDEX idx_class_containers_active ON class_containers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_class_containers_package ON class_containers(package_id);

-- Comments
COMMENT ON TABLE public.class_containers IS 'Unified container grouping for all assignment types. Single source of truth for UI grouping and capacity management.';
COMMENT ON COLUMN public.class_containers.container_type IS 'Defines capacity rules: individual (1 booking max), others (configurable max)';
COMMENT ON COLUMN public.class_containers.max_booking_count IS 'Maximum allowed bookings in this container. 1 for individual type, configurable for others.';
COMMENT ON COLUMN public.class_containers.current_booking_count IS 'Current number of bookings attached. Updated via triggers.';
```

### Modified Table: `class_assignments`

```sql
-- Add new column (NON-DESTRUCTIVE)
ALTER TABLE public.class_assignments
ADD COLUMN IF NOT EXISTS class_container_id UUID REFERENCES class_containers(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_class_assignments_container 
ON class_assignments(class_container_id);

-- Comment
COMMENT ON COLUMN public.class_assignments.class_container_id IS 
'Reference to parent container. ALL assignments must belong to a container. Defines grouping in UI.';
```

**Note:** Do NOT drop any existing columns (`package_id`, `class_package_id`, `scheduled_class_id`, etc.). These remain for backward compatibility and will be deprecated later.

### Modified Junction Table: `assignment_bookings`

```sql
-- Add container tracking (NON-DESTRUCTIVE)
ALTER TABLE public.assignment_bookings
ADD COLUMN IF NOT EXISTS class_container_id UUID REFERENCES class_containers(id);

CREATE INDEX IF NOT EXISTS idx_assignment_bookings_container 
ON assignment_bookings(class_container_id);

COMMENT ON COLUMN public.assignment_bookings.class_container_id IS 
'Denormalized container reference for fast lookups. Should match assignment.class_container_id.';
```

---

## 📊 Container Type Rules

| Container Type | Max Bookings | Auto-Schedule (T-5) | Notes |
|----------------|--------------|---------------------|-------|
| `individual` | **Exactly 1** (enforced) | ✅ If recurring booking | 1:1 student, can be recurring monthly OR one-time |
| `public_group` | Configurable (1-50) | ❌ No (manual) | Open enrollment, can be recurring OR one-time |
| `private_group` | Configurable (1-30) | ❌ No (manual) | Closed group, can be recurring OR one-time |
| `crash_course` | Configurable (1-50) | ❌ No (manual) | Fixed duration program (always one-time) |

**Key Clarification:**
- Container type = **Participation model** (individual vs group) and **capacity rules**
- Recurring vs one-time = **Property of the booking/assignment**, NOT the container
- T-5 auto-scheduling triggers ONLY for `individual` containers with `is_recurring=true` bookings
- Private groups CAN be monthly recurring (admin creates container, schedules recurring classes)

---

## 🔄 Database Migration Strategy

### Phase 1: Schema Addition (Non-Destructive)
**File:** `supabase/migrations/20260108000000_create_class_containers.sql`

✅ Create `class_containers` table  
✅ Add `class_container_id` to `class_assignments` (nullable initially)  
✅ Add `class_container_id` to `assignment_bookings` (nullable initially)  
✅ Create all indexes  
✅ Add check constraints

### Phase 2: Data Migration
**File:** `supabase/migrations/20260108000001_migrate_to_containers.sql`

**2.1 Migrate Crash Courses**
```sql
-- Create containers for crash courses (grouped by instructor + package)
INSERT INTO class_containers (
    display_name, container_type, instructor_id, package_id,
    max_booking_count, current_booking_count, created_by
)
SELECT DISTINCT
    cp.name || ' - ' || p.full_name AS display_name,
    'crash_course' AS container_type,
    ca.instructor_id,
    ca.package_id,
    5 AS max_booking_count, -- Default, can be adjusted
    COUNT(DISTINCT ab.booking_id) AS current_booking_count,
    ca.assigned_by AS created_by
FROM class_assignments ca
JOIN class_packages cp ON cp.id = ca.package_id
JOIN profiles p ON p.user_id = ca.instructor_id
LEFT JOIN assignment_bookings ab ON ab.assignment_id = ca.id
WHERE ca.schedule_type = 'crash'
  AND ca.package_id IS NOT NULL
GROUP BY ca.instructor_id, ca.package_id, cp.name, p.full_name, ca.assigned_by;
```

**2.2 Migrate Individual Classes (Recurring)**
```sql
-- Create containers for recurring individual classes (1 booking = 1 container)
INSERT INTO class_containers (
    display_name, container_type, instructor_id, class_type_id, package_id,
    max_booking_count, current_booking_count, created_by
)
SELECT DISTINCT
    b.first_name || ' ' || b.last_name || ' - ' || 
    COALESCE(cp.name, ct.name) AS display_name,
    'individual' AS container_type,
    ca.instructor_id,
    ca.class_type_id,
    ca.class_package_id,
    1 AS max_booking_count, -- ENFORCED for individual type
    1 AS current_booking_count,
    ca.assigned_by AS created_by
FROM class_assignments ca
JOIN assignment_bookings ab ON ab.assignment_id = ca.id
JOIN bookings b ON b.booking_id = ab.booking_id
LEFT JOIN class_packages cp ON cp.id = ca.class_package_id
LEFT JOIN class_types ct ON ct.id = ca.class_type_id
WHERE b.is_recurring = TRUE
  AND ca.booking_type = 'individual';
```

**2.2b Migrate Individual Classes (One-Time)**
```sql
-- Create containers for one-time individual classes
-- These were manually created by admin, not T-5 generated
INSERT INTO class_containers (
    display_name, container_type, instructor_id, class_type_id, package_id,
    max_booking_count, current_booking_count, created_by
)
SELECT DISTINCT
    b.first_name || ' ' || b.last_name || ' - One-time' AS display_name,
    'individual' AS container_type,
    ca.instructor_id,
    ca.class_type_id,
    ca.class_package_id,
    1 AS max_booking_count,
    1 AS current_booking_count,
    ca.assigned_by AS created_by
FROM class_assignments ca
JOIN assignment_bookings ab ON ab.assignment_id = ca.id
JOIN bookings b ON b.booking_id = ab.booking_id
LEFT JOIN class_packages cp ON cp.id = ca.class_package_id
LEFT JOIN class_types ct ON ct.id = ca.class_type_id
WHERE (b.is_recurring = FALSE OR b.is_recurring IS NULL)
  AND ca.booking_type = 'individual';
```

**2.3 Migrate Group Classes (Public/Private)**
```sql
-- Create containers for group classes
INSERT INTO class_containers (
    display_name, container_type, instructor_id, class_type_id, package_id,
    max_booking_count, current_booking_count, created_by
)
SELECT DISTINCT
    ct.name || ' - ' || p.full_name || ' (' || ca.booking_type || ')' AS display_name,
    CASE 
        WHEN ca.booking_type = 'public_group' THEN 'public_group'
        WHEN ca.booking_type = 'private_group' THEN 'private_group'
    END AS container_type,
    ca.instructor_id,
    ca.class_type_id,
    ca.class_package_id,
    20 AS max_booking_count, -- Default, can be adjusted
    COUNT(DISTINCT ab.booking_id) AS current_booking_count,
    ca.assigned_by AS created_by
FROM class_assignments ca
JOIN class_types ct ON ct.id = ca.class_type_id
JOIN profiles p ON p.user_id = ca.instructor_id
LEFT JOIN assignment_bookings ab ON ab.assignment_id = ca.id
WHERE ca.booking_type IN ('public_group', 'private_group')
  AND ca.schedule_type != 'crash'
GROUP BY ca.instructor_id, ca.class_type_id, ca.class_package_id, 
         ct.name, p.full_name, ca.booking_type, ca.assigned_by;
```

**2.4 Link Assignments to Containers**
```sql
-- Update class_assignments with container references
UPDATE class_assignments ca
SET class_container_id = cc.id
FROM class_containers cc
WHERE ca.schedule_type = 'crash'
  AND ca.instructor_id = cc.instructor_id
  AND ca.package_id = cc.package_id
  AND cc.container_type = 'crash_course';

UPDATE class_assignments ca
SET class_container_id = cc.id
FROM class_containers cc
JOIN assignment_bookings ab ON ab.assignment_id = ca.id
WHERE ca.schedule_type = 'monthly'
  AND ca.booking_type = 'individual'
  AND ab.booking_id IN (
      SELECT ab2.booking_id 
      FROM assignment_bookings ab2
      JOIN class_assignments ca2 ON ca2.id = ab2.assignment_id
      WHERE ca2.class_container_id = cc.id
      LIMIT 1
  );

-- (Similar for group classes)
```

**2.5 Populate Junction Table**
```sql
-- Update assignment_bookings with container IDs
UPDATE assignment_bookings ab
SET class_container_id = ca.class_container_id
FROM class_assignments ca
WHERE ca.id = ab.assignment_id;
```

### Phase 3: Triggers & Functions
**File:** `supabase/migrations/20260108000002_container_triggers.sql`

**3.1 Auto-update Container Booking Count**
```sql
CREATE OR REPLACE FUNCTION update_container_booking_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE class_containers
        SET current_booking_count = current_booking_count + 1,
            updated_at = NOW()
        WHERE id = NEW.class_container_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE class_containers
        SET current_booking_count = GREATEST(0, current_booking_count - 1),
            updated_at = NOW()
        WHERE id = OLD.class_container_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.class_container_id != OLD.class_container_id THEN
        -- Moving booking to different container
        UPDATE class_containers
        SET current_booking_count = GREATEST(0, current_booking_count - 1),
            updated_at = NOW()
        WHERE id = OLD.class_container_id;
        
        UPDATE class_containers
        SET current_booking_count = current_booking_count + 1,
            updated_at = NOW()
        WHERE id = NEW.class_container_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_container_booking_count
AFTER INSERT OR UPDATE OR DELETE ON assignment_bookings
FOR EACH ROW
EXECUTE FUNCTION update_container_booking_count();
```

**3.2 Validate Container Capacity**
```sql
CREATE OR REPLACE FUNCTION validate_container_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_count INTEGER;
    v_current_count INTEGER;
    v_container_type TEXT;
BEGIN
    -- Get container info
    SELECT max_booking_count, current_booking_count, container_type
    INTO v_max_count, v_current_count, v_container_type
    FROM class_containers
    WHERE id = NEW.class_container_id;
    
    -- Check if container exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Container % does not exist', NEW.class_container_id;
    END IF;
    
    -- For INSERT, check if adding would exceed capacity
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.class_container_id != OLD.class_container_id) THEN
        IF v_current_count >= v_max_count THEN
            RAISE EXCEPTION 'Container is at full capacity (% / %)', v_current_count, v_max_count;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_container_capacity
BEFORE INSERT OR UPDATE ON assignment_bookings
FOR EACH ROW
EXECUTE FUNCTION validate_container_capacity();
```

**3.3 Enforce Individual Type = 1 Booking**
```sql
CREATE OR REPLACE FUNCTION enforce_individual_single_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Individual containers MUST have max_booking_count = 1
    IF NEW.container_type = 'individual' AND NEW.max_booking_count != 1 THEN
        RAISE EXCEPTION 'Individual containers must have max_booking_count = 1';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_individual_rule
BEFORE INSERT OR UPDATE ON class_containers
FOR EACH ROW
EXECUTE FUNCTION enforce_individual_single_booking();
```

### Phase 4: Update T-5 Auto-Scheduling
**File:** `supabase/migrations/20260108000003_update_t5_container_logic.sql`

**Modify:** `generate_t5_invoices()` function

**Key Changes:**
1. When generating classes (monthly/quarterly/half-yearly/annual), look up or create container
2. Set `class_container_id` on new assignments
3. Ensure container type is `individual`
4. Respect booking validity dates - only generate classes for active bookings
5. Container remains active until ALL bookings expire

```sql
-- Pseudo-code addition to T-5 function
-- Note: T-5 runs for monthly, quarterly, half-yearly, annual billing cycles
FOR booking_record IN (SELECT * FROM bookings WHERE is_recurring 
                       AND billing_cycle_end_date >= CURRENT_DATE...) LOOP
    -- Find or create container for this booking
    SELECT id INTO v_container_id
    FROM class_containers
    WHERE instructor_id = booking_record.instructor_id
      AND container_type = 'individual'
      AND current_booking_count < max_booking_count
      AND package_id = booking_record.class_package_id;
    
    IF v_container_id IS NULL THEN
        -- Create new container
        INSERT INTO class_containers (
            display_name, container_type, instructor_id,
            class_type_id, package_id,
            max_booking_count, current_booking_count, created_by
        ) VALUES (
            booking_record.first_name || ' ' || booking_record.last_name,
            'individual',
            booking_record.instructor_id,
            (SELECT id FROM class_types WHERE name = booking_record.class_name LIMIT 1),
            booking_record.class_package_id,
            1, -- Individual type = always 1
            0,
            NULL -- system generated
        ) RETURNING id INTO v_container_id;
    END IF;
    
    -- Generate classes with container reference
    INSERT INTO class_assignments (
        ...,
        class_container_id,
        ...
    ) VALUES (
        ...,
        v_container_id,
        ...
    );
END LOOP;
```

### Phase 5: Validation & Enforcement
**File:** `supabase/migrations/20260108000004_container_constraints.sql`

```sql
-- Make class_container_id required (after data migration)
-- Run this AFTER confirming all assignments have containers
ALTER TABLE class_assignments
ALTER COLUMN class_container_id SET NOT NULL;

-- Add check to prevent orphaned assignments
ALTER TABLE class_assignments
ADD CONSTRAINT chk_assignment_has_container
CHECK (class_container_id IS NOT NULL);
```

### 📅 Container Validity & Lifecycle Management

**Key Concept:** Container remains active until the LAST associated booking expires.

**Business Rules:**
1. **Multiple Bookings with Different End Dates:**
   - Container has Booking A (ends March 31, 2026) + Booking B (ends Dec 31, 2026)
   - Container active until Dec 31, 2026
   - After March 31: Classes continue ONLY for Booking B

2. **Billing Cycles Supported:**
   - Monthly: `billing_cycle_end_date` = +1 month from anchor
   - Quarterly: `billing_cycle_end_date` = +3 months from anchor
   - Half-yearly: `billing_cycle_end_date` = +6 months from anchor
   - Annually: `billing_cycle_end_date` = +12 months from anchor

3. **T-5 Automation Behavior:**
   - Generates classes only for bookings where `billing_cycle_end_date >= CURRENT_DATE`
   - Skips expired bookings automatically
   - Container persists until ALL bookings expire

**Query: Check Container Validity Status**
```sql
-- Get active/inactive containers with validity dates
SELECT 
    cc.id,
    cc.display_name,
    cc.container_type,
    cc.current_booking_count,
    MAX(b.billing_cycle_end_date) as active_until,
    COUNT(DISTINCT ab.booking_id) as total_bookings,
    COUNT(DISTINCT CASE 
        WHEN b.billing_cycle_end_date >= CURRENT_DATE 
        THEN ab.booking_id 
    END) as active_bookings,
    CASE 
        WHEN MAX(b.billing_cycle_end_date) >= CURRENT_DATE THEN 'Active'
        ELSE 'Expired'
    END as status
FROM class_containers cc
LEFT JOIN assignment_bookings ab ON ab.class_container_id = cc.id
LEFT JOIN bookings b ON b.booking_id = ab.booking_id
GROUP BY cc.id, cc.display_name, cc.container_type, cc.current_booking_count
ORDER BY active_until DESC NULLS LAST;
```

**Query: Find Containers with Partial Expiration**
```sql
-- Containers where some bookings expired but others still active
SELECT 
    cc.id,
    cc.display_name,
    COUNT(DISTINCT ab.booking_id) as total_bookings,
    COUNT(DISTINCT CASE 
        WHEN b.billing_cycle_end_date >= CURRENT_DATE 
        THEN ab.booking_id 
    END) as active_bookings,
    COUNT(DISTINCT CASE 
        WHEN b.billing_cycle_end_date < CURRENT_DATE 
        THEN ab.booking_id 
    END) as expired_bookings,
    MAX(b.billing_cycle_end_date) as container_active_until
FROM class_containers cc
JOIN assignment_bookings ab ON ab.class_container_id = cc.id
JOIN bookings b ON b.booking_id = ab.booking_id
GROUP BY cc.id, cc.display_name
HAVING COUNT(DISTINCT CASE 
    WHEN b.billing_cycle_end_date < CURRENT_DATE 
    THEN ab.booking_id 
END) > 0
AND MAX(b.billing_cycle_end_date) >= CURRENT_DATE;
```

---

## 💻 Frontend Implementation

### Module Structure

```
src/features/class-assignment/
├── types/
│   └── container.types.ts              (New - Container interfaces)
├── hooks/
│   ├── useContainers.ts                (New - Fetch/manage containers)
│   └── useContainerValidation.ts       (New - Capacity validation)
├── services/
│   ├── containerService.ts             (New - Container CRUD)
│   └── containerCapacityService.ts     (New - Capacity logic)
├── components/
│   ├── ContainerCreationModal/         (New - Create container UI)
│   │   ├── index.tsx
│   │   ├── ContainerTypeSelector.tsx
│   │   ├── CapacityConfigPanel.tsx
│   │   └── ContainerPreview.tsx
│   ├── ContainerListView/              (Modified - Group by container)
│   └── ContainerCapacityIndicator/     (New - Visual capacity display)
└── utils/
    └── containerUtils.ts                (New - Helper functions)
```

### 1. TypeScript Types
**File:** `src/features/class-assignment/types/container.types.ts`

```typescript
export type ContainerType = 
    | 'individual'
    | 'public_group'
    | 'private_group'
    | 'crash_course';

export interface ClassContainer {
    id: string;
    container_code: string;
    display_name: string;
    container_type: ContainerType;
    
    instructor_id: string;
    class_type_id: string | null;
    package_id: string | null;
    
    max_booking_count: number;
    current_booking_count: number;
    
    created_by: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    notes: string | null;
    
    // Computed from associated bookings
    active_until?: string | null; // MAX(booking_end_dates)
    active_booking_count?: number; // Count of non-expired bookings
    
    // Populated joins
    instructor?: {
        user_id: string;
        full_name: string;
        email: string;
    };
    class_type?: {
        id: string;
        name: string;
        difficulty_level: string;
    };
    package?: {
        id: string;
        name: string;
        class_count: number;
    };
}

export interface ContainerCapacityInfo {
    container_id: string;
    max_count: number;
    current_count: number;
    available_count: number;
    is_full: boolean;
    utilization_percent: number;
}

export interface ContainerCreationFormData {
    container_type: ContainerType;
    instructor_id: string;
    class_type_id?: string;
    package_id?: string;
    max_booking_count: number;
    display_name: string;
    notes?: string;
}
```

### 2. Container Service
**File:** `src/features/class-assignment/services/containerService.ts`

```typescript
import { supabase } from '@/shared/lib/supabase';
import { ClassContainer, ContainerCreationFormData } from '../types/container.types';

export class ContainerService {
    /**
     * Fetch all active containers
     */
    static async fetchContainers(): Promise<ClassContainer[]> {
        const { data, error } = await supabase
            .from('class_containers')
            .select(`
                *,
                instructor:profiles!instructor_id(user_id, full_name, email),
                class_type:class_types(id, name, difficulty_level),
                package:class_packages(id, name, class_count)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as ClassContainer[];
    }
    
    /**
     * Create a new container
     */
    static async createContainer(formData: ContainerCreationFormData): Promise<ClassContainer> {
        // Validation
        if (formData.container_type === 'individual' && formData.max_booking_count !== 1) {
            throw new Error('Individual containers must have max_booking_count = 1');
        }
        
        const { data, error } = await supabase
            .from('class_containers')
            .insert({
                container_type: formData.container_type,
                instructor_id: formData.instructor_id,
                class_type_id: formData.class_type_id,
                package_id: formData.package_id,
                max_booking_count: formData.max_booking_count,
                display_name: formData.display_name,
                notes: formData.notes,
                current_booking_count: 0
            })
            .select()
            .single();
        
        if (error) throw error;
        return data as ClassContainer;
    }
    
    /**
     * Update container capacity
     */
    static async updateContainerCapacity(
        containerId: string, 
        newMaxCount: number
    ): Promise<void> {
        // Fetch current state
        const { data: container, error: fetchError } = await supabase
            .from('class_containers')
            .select('current_booking_count, container_type')
            .eq('id', containerId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Validate: cannot reduce below current count
        if (newMaxCount < container.current_booking_count) {
            throw new Error(
                `Cannot reduce capacity to ${newMaxCount}. ` +
                `Current assigned bookings: ${container.current_booking_count}. ` +
                `Remove bookings first or increase capacity.`
            );
        }
        
        // Enforce individual type rule
        if (container.container_type === 'individual' && newMaxCount !== 1) {
            throw new Error('Individual containers must have max_booking_count = 1');
        }
        
        // Update
        const { error: updateError } = await supabase
            .from('class_containers')
            .update({ max_booking_count: newMaxCount })
            .eq('id', containerId);
        
        if (updateError) throw updateError;
    }
    
    /**
     * Attach booking to container
     */
    static async attachBookingToContainer(
        assignmentId: string,
        bookingId: string,
        containerId: string
    ): Promise<void> {
        // Fetch container to validate capacity
        const { data: container, error: fetchError } = await supabase
            .from('class_containers')
            .select('max_booking_count, current_booking_count')
            .eq('id', containerId)
            .single();
        
        if (fetchError) throw fetchError;
        
        if (container.current_booking_count >= container.max_booking_count) {
            throw new Error(
                `Container is at full capacity (${container.current_booking_count}/${container.max_booking_count})`
            );
        }
        
        // Insert into junction table (trigger will update count)
        const { error: insertError } = await supabase
            .from('assignment_bookings')
            .insert({
                assignment_id: assignmentId,
                booking_id: bookingId,
                class_container_id: containerId
            });
        
        if (insertError) throw insertError;
    }
}
```

### 3. Container Creation Modal
**File:** `src/features/class-assignment/components/ContainerCreationModal/index.tsx`

```typescript
import { useState } from 'react';
import { ContainerType, ContainerCreationFormData } from '../../types/container.types';
import { ContainerService } from '../../services/containerService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ContainerCreationModal = ({ isOpen, onClose, onSuccess }: Props) => {
    const [formData, setFormData] = useState<ContainerCreationFormData>({
        container_type: 'individual',
        instructor_id: '',
        max_booking_count: 1,
        display_name: ''
    });
    
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleContainerTypeChange = (type: ContainerType) => {
        setFormData(prev => ({
            ...prev,
            container_type: type,
            // Auto-set max_booking_count based on type
            max_booking_count: type === 'individual' ? 1 : 20
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        
        try {
            await ContainerService.createContainer(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create container');
        } finally {
            setSaving(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="modal">
            <h2>Create New Class Container</h2>
            
            <form onSubmit={handleSubmit}>
                {/* Container Type Selection */}
                <div>
                    <label>Container Type</label>
                    <select 
                        value={formData.container_type}
                        onChange={(e) => handleContainerTypeChange(e.target.value as ContainerType)}
                    >
                        <option value="individual">Individual Class (1:1)</option>
                        <option value="public_group">Public Group Class</option>
                        <option value="private_group">Private Group Class</option>
                        <option value="crash_course">Crash Course</option>
                    </select>
                </div>
                
                {/* Instructor Selection */}
                <div>
                    <label>Instructor</label>
                    <select 
                        value={formData.instructor_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, instructor_id: e.target.value }))}
                        required
                    >
                        <option value="">Select Instructor</option>
                        {/* Populate from instructors list */}
                    </select>
                </div>
                
                {/* Capacity Configuration */}
                {formData.container_type === 'individual' ? (
                    <div className="bg-blue-50 p-4 rounded">
                        <p>Individual classes allow exactly <strong>1 booking</strong> per container.</p>
                        <p className="text-sm text-gray-600">
                            Each 1:1 student session (recurring or one-time) gets its own container.
                        </p>
                    </div>
                ) : (
                    <div>
                        <label>Max Allowed Bookings / Participants</label>
                        <input 
                            type="number"
                            min="1"
                            max="50"
                            value={formData.max_booking_count}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                max_booking_count: parseInt(e.target.value) 
                            }))}
                            required
                        />
                        <p className="text-sm text-gray-500">
                            You can modify this later as needed.
                        </p>
                    </div>
                )}
                
                {/* Display Name */}
                <div>
                    <label>Display Name</label>
                    <input 
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="e.g., Morning Yoga - John Smith"
                        required
                    />
                </div>
                
                {error && <div className="error">{error}</div>}
                
                <div className="actions">
                    <button type="button" onClick={onClose}>Cancel</button>
                    <button type="submit" disabled={saving}>
                        {saving ? 'Creating...' : 'Create Container'}
                    </button>
                </div>
            </form>
        </div>
    );
};
```

### 4. Modified Assignment List View
**File:** `src/features/dashboard/components/Modules/ClassAssignmentManager/components/AssignmentListView.tsx`

**Changes:**
- Replace existing grouping logic with container-based grouping
- Display container name and capacity indicator
- Show all assignments within each container

```typescript
// Inside ClassAssignmentManager.tsx - grouping logic

const groupedAssignments = useMemo(() => {
    if (!assignments.length) return [];
    
    // Group by class_container_id ONLY
    const groups = new Map<string, ClassAssignment[]>();
    
    assignments.forEach(assignment => {
        const containerId = assignment.class_container_id || 'no-container';
        if (!groups.has(containerId)) {
            groups.set(containerId, []);
        }
        groups.get(containerId)!.push(assignment);
    });
    
    // Convert to array with container info
    return Array.from(groups.entries()).map(([containerId, assignments]) => {
        const firstAssignment = assignments[0];
        const container = containers.find(c => c.id === containerId);
        
        return {
            key: containerId,
            container_id: containerId,
            container_name: container?.display_name || 'Unknown Container',
            container_type: container?.container_type || 'unknown',
            capacity: {
                current: container?.current_booking_count || 0,
                max: container?.max_booking_count || 0
            },
            assignments: assignments.sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
            groupInfo: {
                instructor_name: firstAssignment.instructor_profile?.full_name || 'Unknown',
                class_type_name: firstAssignment.class_type?.name || 'Unknown',
                total_revenue: assignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0),
                assignment_count: assignments.length
            }
        };
    });
}, [assignments, containers]);
```

### 5. Capacity Edit Modal
**File:** `src/features/class-assignment/components/ContainerCapacityEditModal.tsx`

```typescript
interface Props {
    container: ClassContainer;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ContainerCapacityEditModal = ({ container, isOpen, onClose, onSuccess }: Props) => {
    const [newCapacity, setNewCapacity] = useState(container.max_booking_count);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    
    const canDecrease = newCapacity >= container.current_booking_count;
    const isIndividualType = container.container_type === 'individual';
    
    const handleSubmit = async () => {
        if (!canDecrease) {
            setError(
                `Cannot reduce capacity below current booking count (${container.current_booking_count}). ` +
                `Remove some bookings first.`
            );
            return;
        }
        
        if (isIndividualType && newCapacity !== 1) {
            setError('Individual containers must have capacity = 1');
            return;
        }
        
        setSaving(true);
        setError(null);
        
        try {
            await ContainerService.updateContainerCapacity(container.id, newCapacity);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="modal">
            <h2>Edit Container Capacity</h2>
            <p>Container: {container.display_name}</p>
            
            {isMonthlyIndividual ? (
                <div className="bg-blue-50 p-4 rounded">
                    <p>Monthly individual containers always have capacity = 1.</p>
                    <p>This cannot be changed.</p>
                </div>
            ) : (
                <div>
                    <label>Max Allowed Bookings</label>
                    <input 
                        type="number"
                        min={container.current_booking_count}
                        max="50"
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                    />
                    
                    <div className="capacity-info">
                        <p>Current bookings: <strong>{container.current_booking_count}</strong></p>
                        <p>Available slots after change: <strong>{newCapacity - container.current_booking_count}</strong></p>
                    </div>
                    
                    {!canDecrease && (
                        <div className="warning">
                            ⚠️ Cannot reduce below current booking count. 
                            Remove bookings first.
                        </div>
                    )}
                </div>
            )}
            
            {error && <div className="error">{error}</div>}
            
            <div className="actions">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving || isMonthlyIndividual}>
                    {saving ? 'Saving...' : 'Update Capacity'}
                </button>
            </div>
        </div>
    );
};
```

---

## 🔧 Implementation Checklist

### Database (Module: Class Assignment - Database Schema)

- [ ] **Migration 1:** Create `class_containers` table
- [ ] **Migration 2:** Add `class_container_id` to `class_assignments`
- [ ] **Migration 3:** Add `class_container_id` to `assignment_bookings`
- [ ] **Migration 4:** Migrate existing crash courses to containers
- [ ] **Migration 5:** Migrate existing monthly individual classes to containers
- [ ] **Migration 6:** Migrate existing group classes to containers
- [ ] **Migration 7:** Link all assignments to containers
- [ ] **Migration 8:** Create trigger: `update_container_booking_count()`
- [ ] **Migration 9:** Create trigger: `validate_container_capacity()`
- [ ] **Migration 10:** Create trigger: `enforce_individual_single_booking()`
- [ ] **Migration 11:** Update `generate_t5_invoices()` function to use containers
- [ ] **Migration 12:** Make `class_container_id` NOT NULL (after data migration validated)
- [ ] **Migration 13:** Create indexes on container columns

### Frontend - Type Definitions (Module: Class Assignment - Types)

- [ ] Create `container.types.ts` with all TypeScript interfaces
- [ ] Update `ClassAssignment` interface to include `class_container_id`
- [ ] Update `AssignmentBooking` interface to include `class_container_id`
- [ ] Add `ContainerCapacityInfo` type
- [ ] Add `ContainerCreationFormData` type

### Frontend - Services (Module: Class Assignment - Services)

- [ ] Create `containerService.ts` with CRUD operations
- [ ] Implement `fetchContainers()` method
- [ ] Implement `createContainer()` method with validation
- [ ] Implement `updateContainerCapacity()` method
- [ ] Implement `attachBookingToContainer()` method
- [ ] Create `containerCapacityService.ts` for capacity calculations
- [ ] Implement capacity validation logic
- [ ] Add error handling for all service methods

### Frontend - Hooks (Module: Class Assignment - Hooks)

- [ ] Create `useContainers()` hook to fetch container list
- [ ] Create `useContainerValidation()` hook for capacity checks
- [ ] Update `useClassAssignmentData()` to fetch containers
- [ ] Add container state management to existing hooks

### Frontend - Components (Module: Class Assignment - UI Components)

- [ ] Create `ContainerCreationModal` component
  - [ ] Container type selector
  - [ ] Capacity configuration panel
  - [ ] Conditional UI for individual type (read-only capacity = 1)
  - [ ] Form validation
- [ ] Create `ContainerCapacityEditModal` component
  - [ ] Capacity input with validation
  - [ ] Current vs new capacity comparison
  - [ ] Warning for invalid reductions
- [ ] Create `ContainerCapacityIndicator` component
  - [ ] Visual progress bar
  - [ ] Current / Max display
  - [ ] Color coding (green/yellow/red)
- [ ] Modify `AssignmentListView` component
  - [ ] Replace grouping logic with container-based groups
  - [ ] Display container name as group header
  - [ ] Show capacity indicator in group header
  - [ ] Remove "Unknown Class" fallback
- [ ] Modify `AssignmentForm` component
  - [ ] Add container selection dropdown
  - [ ] Show container capacity status
  - [ ] Disable submission if container full
- [ ] Create `ContainerTypeSelector` component
  - [ ] Radio buttons or dropdown for type selection
  - [ ] Show description for each type
  - [ ] Auto-update capacity field based on type

### Frontend - Integration (Module: Class Assignment - Integration)

- [ ] Update `ClassAssignmentManager.tsx` grouping logic
- [ ] Modify `createAssignment` workflow to include container
- [ ] Update assignment creation service to validate container capacity
- [ ] Add container filter to advanced filters
- [ ] Update assignment deletion to update container count
- [ ] Add container info to class details popup
- [ ] Update calendar view to show container grouping
- [ ] Add container column to analytics/reports

### Testing & Validation (Module: Class Assignment - Testing)

- [ ] **Test:** Create individual container (capacity = 1)
- [ ] **Test:** Create public_group container (capacity = 20)
- [ ] **Test:** Try to change individual container capacity (should fail)
- [ ] **Test:** Attach booking to container at capacity (should fail)
- [ ] **Test:** Reduce capacity below current count (should fail)
- [ ] **Test:** Increase capacity (should succeed)
- [ ] **Test:** Auto-scheduled classes appear in correct container
- [ ] **Test:** T-5 automation creates container for new bookings
- [ ] **Test:** Junction table updates container count correctly
- [ ] **Test:** Deleting assignment decrements container count

### Documentation (Module: Class Assignment - Documentation)

- [ ] Update README with container architecture
- [ ] Document container type rules
- [ ] Add migration runbook
- [ ] Create admin guide for container management
- [ ] Document T-5 automation changes
- [ ] Add troubleshooting guide for container issues

---

## 📝 SQL Queries for Manual Execution

### Query 1: Create class_containers table
**Run in Supabase SQL Editor**
```sql
-- See Phase 1 migration above
```

### Query 2: Migrate crash courses
**Run in Supabase SQL Editor**
```sql
-- See Phase 2.1 migration above
```

### Query 3: Migrate monthly individual classes
**Run in Supabase SQL Editor**
```sql
-- See Phase 2.2 migration above
```

### Query 4: Migrate group classes
**Run in Supabase SQL Editor**
```sql
-- See Phase 2.3 migration above
```

### Query 5: Link assignments to containers
**Run in Supabase SQL Editor**
```sql
-- See Phase 2.4 migration above
```

### Query 6: Create triggers
**Run in Supabase SQL Editor**
```sql
-- See Phase 3 migrations above
```

### Query 7: Update T-5 function
**Run in Supabase SQL Editor**
```sql
-- See Phase 4 migration above
```

### Query 8: Make container_id required
**Run in Supabase SQL Editor ONLY AFTER verifying all assignments have containers**
```sql
-- Validation query first
SELECT COUNT(*) FROM class_assignments WHERE class_container_id IS NULL;
-- If result is 0, proceed:

ALTER TABLE class_assignments
ALTER COLUMN class_container_id SET NOT NULL;
```

---

## 🚨 Critical Implementation Notes

### Do NOT Drop Columns
- Keep `package_id`, `class_package_id`, `scheduled_class_id` in `class_assignments`
- These will be deprecated later in a separate cleanup phase
- System must remain backward compatible during transition

### Auto-Scheduling Preservation
- T-5 automation MUST continue working
- Test thoroughly that generated classes get correct `class_container_id`
- Verify container is created if none exists for a booking
- Ensure `calendar_month` field still populated correctly

### Capacity Enforcement Order
1. Database triggers (primary enforcement)
2. Frontend validation (UX improvement)
3. Service layer validation (defense in depth)

### Backward Compatibility
- Existing assignments without containers should be migrated
- No assignment should have NULL `class_container_id` after migration
- UI must gracefully handle any edge cases during transition

### Performance Considerations
- Index on `class_container_id` in both tables
- Denormalize `class_container_id` in `assignment_bookings` for fast lookups
- Consider materialized view if container queries become slow

---

## 📊 Success Criteria

✅ All assignments grouped by container in UI  
✅ No "Unknown Class" groups appearing  
✅ Capacity validation working (cannot exceed max)  
✅ Monthly individual enforces 1 booking per container  
✅ Auto-scheduled classes appear in correct container group  
✅ T-5 automation continues working unchanged  
✅ Admins can edit capacity (with validation)  
✅ Container creation modal functional for all types  
✅ Existing data migrated successfully (zero NULL container_ids)  
✅ All tests passing  

---

## 🎯 Post-Implementation Tasks

1. Monitor container counts for discrepancies
2. Run validation queries weekly
3. Collect admin feedback on container UX
4. Plan phase 2: Cleanup deprecated columns
5. Consider container-level analytics dashboard
6. Evaluate auto-archive containers with zero assignments

---

## End of Plan

**Total Modules:** 7
1. Database Schema
2. Types
3. Services  
4. Hooks
5. UI Components
6. Integration
7. Testing

**Estimated Implementation Time:** 12-16 hours  
**Risk Level:** Medium (requires careful data migration)  
**Breaking Changes:** None (non-destructive approach)

---

**Prepared:** January 8, 2026  
**Status:** ⏳ Awaiting Approval  
**Version:** 1.0
