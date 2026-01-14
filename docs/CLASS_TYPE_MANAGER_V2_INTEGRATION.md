# Class Type Manager ↔ V2 Integration Guide

**Date:** January 14, 2026  
**Purpose:** How existing Class Type Manager feeds into V2 Program creation

---

## 🎯 Overview

**Class Type Manager** (`/dashboard/class_type_manager`) is the **source of truth** for packages.  
**V2 Programs** (`/dashboard/programs-v2`) creates **instances** of these packages.

```
Class Type Manager              V2 Programs Dashboard
(Package Templates)             (Package Instances)
       │                               │
       │  Package: "Monthly 12-Class"  │
       ├──────────────────────────────→│  Program: "Monthly Yoga - Sarah"
       │                               │  (instance of Monthly 12-Class)
       │                               │
       │  Package: "4-Week Crash"      │
       ├──────────────────────────────→│  Program: "Beginner Crash - Mike"
       │                               │  (instance of 4-Week Crash)
```

**No modifications needed to Class Type Manager!** V2 simply reads from `class_packages` table.

---

## 📊 Data Flow

### 1. Package Creation (Class Type Manager)

Admin creates package in Class Type Manager:

```sql
INSERT INTO class_packages (
  id,
  name,
  description,
  class_count,
  price,
  validity_days,
  type,  -- 'Individual', 'Corporate', 'Private group'
  course_type,  -- 'regular', 'crash'
  duration,  -- e.g., '4 weeks' (for crash courses)
  is_active
) VALUES (
  gen_random_uuid(),
  'Monthly 12-Class Yoga',
  'Perfect for regular practitioners',
  12,
  800.00,
  30,
  'Individual',
  'regular',
  NULL,  -- Not needed for regular
  true
);
```

### 2. V2 Reads Packages

V2 queries active packages:

```typescript
// In V2 CreateProgramModal component
const { data: packages, error } = await supabase
  .from('class_packages')
  .select(`
    id,
    name,
    description,
    class_count,
    price,
    type,
    course_type,
    duration,
    validity_days
  `)
  .eq('is_active', true)
  .order('name');

// Display in dropdown
<select onChange={handlePackageSelect}>
  {packages.map(pkg => (
    <option value={pkg.id} key={pkg.id}>
      {pkg.name} - {pkg.class_count} classes 
      ({pkg.course_type === 'crash' ? `${pkg.duration} crash` : 'regular'})
      - ₹{pkg.price}
    </option>
  ))}
</select>
```

### 3. Program Creation (V2)

Admin selects package and creates program:

```sql
INSERT INTO class_containers (
  id,
  container_code,
  container_type,  -- Derived from package.type
  display_name,
  instructor_id,  -- OPTIONAL
  package_id,  -- Links to class_packages
  max_booking_count,
  current_booking_count,
  is_active
) VALUES (
  gen_random_uuid(),
  'usr_123-pkg_456-individual-20260115',
  'individual',  -- From package.type
  'Monthly 12-Class Yoga - Sarah Johnson',  -- OR '(Unassigned)' if no instructor
  'usr_123',  -- Can be NULL
  'pkg_456',  -- Selected package
  1,  -- 1 for individual, else admin sets
  0,  -- Auto-updated by trigger
  true
);
```

---

## 🔄 Package Types → Container Types Mapping

| Package Type (class_packages) | Container Type (class_containers) | Capacity |
|-------------------------------|-----------------------------------|----------|
| `Individual` | `individual` | 1 (locked) |
| `Private group` | `private_group` | 1-30 (editable) |
| `Corporate` | `private_group` OR `public_group` | 1-50 (editable) |

**Note:** "Public Group" is a container type, not a package type in Class Type Manager. Admin selects it during program creation.

---

## 📋 UI Integration: Step-by-Step

### V2 Create Program Modal

```jsx
// Step 1: Select Package
<div className="form-step">
  <label>Select Class Package *</label>
  <select 
    value={selectedPackageId} 
    onChange={handlePackageChange}
  >
    <option value="">-- Choose Package --</option>
    {packages.map(pkg => (
      <option value={pkg.id} key={pkg.id}>
        {pkg.name} ({pkg.type}) - {pkg.class_count} classes - ₹{pkg.price}
      </option>
    ))}
  </select>
  
  {selectedPackage && (
    <div className="package-preview">
      <h4>{selectedPackage.name}</h4>
      <p>{selectedPackage.description}</p>
      <ul>
        <li>Class Count: {selectedPackage.class_count}</li>
        <li>Type: {selectedPackage.type}</li>
        <li>Course Type: {selectedPackage.course_type}</li>
        {selectedPackage.course_type === 'crash' && (
          <li>Duration: {selectedPackage.duration}</li>
        )}
        <li>Price: ₹{selectedPackage.price}</li>
      </ul>
    </div>
  )}
</div>

// Step 2: Instructor (Optional)
<div className="form-step">
  <label>Assign Instructor (Optional)</label>
  <select 
    value={instructorId} 
    onChange={handleInstructorChange}
  >
    <option value="">-- Assign Later --</option>
    {instructors.map(instructor => (
      <option value={instructor.id} key={instructor.id}>
        {instructor.full_name}
      </option>
    ))}
  </select>
  <p className="help-text">
    Can be assigned or changed anytime after creation
  </p>
</div>

// Step 3: Program Type & Capacity
<div className="form-step">
  <label>Program Type</label>
  {selectedPackage?.type === 'Individual' ? (
    <div>
      <input type="text" value="Individual (1-on-1)" disabled />
      <input type="number" value={1} disabled />
      <p className="help-text">Individual programs always have capacity of 1</p>
    </div>
  ) : (
    <>
      <select value={containerType} onChange={handleTypeChange}>
        <option value="private_group">Private Group (Closed)</option>
        <option value="public_group">Public Group (Open Enrollment)</option>
        {selectedPackage?.course_type === 'crash' && (
          <option value="crash_course">Crash Course</option>
        )}
      </select>
      
      <label>Max Capacity</label>
      <input 
        type="number" 
        min="1" 
        max="50" 
        value={maxCapacity}
        onChange={handleCapacityChange}
      />
    </>
  )}
</div>

// Step 4: Display Name
<div className="form-step">
  <label>Program Display Name</label>
  <input 
    type="text" 
    value={displayName}
    onChange={handleNameChange}
    placeholder={generateAutoName()}
  />
  <p className="help-text">
    Auto-generated: {generateAutoName()}
  </p>
</div>

// Function to auto-generate name
function generateAutoName() {
  if (!selectedPackage) return '';
  
  const packageName = selectedPackage.name;
  const instructorName = selectedInstructor?.full_name || '(Unassigned)';
  
  return `${packageName} - ${instructorName}`;
}
```

---

## 🔗 Database Relationships

```
class_packages (managed in Class Type Manager)
    ↓ (read-only from V2)
    │
    ├─→ class_containers (V2 programs)
    │       ↓
    │       ├─→ class_assignments (individual sessions)
    │       │       ↓
    │       │       └─→ assignment_bookings (junction)
    │       │               ↓
    │       │               └─→ bookings (students)
    │       │
    │       └─→ instructor (profiles table)
```

**Key Points:**
- `class_containers.package_id` → `class_packages.id` (FK)
- Package never deleted if containers reference it
- Package changes (price, etc.) don't affect existing containers
- Containers are snapshots at creation time

---

## 📦 Package Types in Class Type Manager

### Current Package Fields (No Changes Needed)

```typescript
interface ClassPackage {
  id: string;
  name: string;
  description?: string;
  class_count: number;
  price: number;
  validity_days?: number;  // For regular courses
  class_type_restrictions?: string[];
  is_active: boolean;
  
  // Package type
  type: 'Individual' | 'Corporate' | 'Private group';
  
  // Course type
  course_type: 'regular' | 'crash';
  
  // Duration (only for crash courses)
  duration?: string;  // e.g., "4 weeks", "30 days"
  
  // Audit
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  archived_at?: Date;
}
```

### How V2 Uses These Fields

| Package Field | V2 Usage |
|---------------|----------|
| `id` | Stored in `class_containers.package_id` |
| `name` | Used in display name generation |
| `class_count` | Referenced for monthly generation count |
| `price` | Passed to invoice generation (not shown in V2 UI) |
| `type` | Determines default `container_type` |
| `course_type` | Determines if T-5 automation applies |
| `duration` | Validates crash course assignment dates |
| `validity_days` | Used for booking expiration (not in V2) |

---

## 🚀 Implementation Checklist

### Phase 1: Foundation

- [ ] Create V2 service to fetch packages
```typescript
// src/features/dashboard/services/v2/package.service.ts
export class PackageService {
  static async fetchActivePackages() {
    const { data, error } = await supabase
      .from('class_packages')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  }
  
  static async getPackageById(id: string) {
    const { data, error } = await supabase
      .from('class_packages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

- [ ] Create dropdown component
```typescript
// src/features/dashboard/components/Modules/ClassesV2/forms/PackageSelector.tsx
export const PackageSelector: React.FC<Props> = ({ 
  value, 
  onChange, 
  error 
}) => {
  const { packages, loading } = usePackages();
  
  return (
    <div className="form-group">
      <label>Select Package *</label>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <select value={value} onChange={onChange}>
          <option value="">-- Choose Package --</option>
          {packages.map(pkg => (
            <option value={pkg.id} key={pkg.id}>
              {pkg.name} - {pkg.class_count} classes - ₹{pkg.price}
            </option>
          ))}
        </select>
      )}
      {error && <span className="error">{error}</span>}
    </div>
  );
};
```

- [ ] Test integration
  - Fetch packages from Class Type Manager
  - Display in V2 modal
  - Create program with selected package
  - Verify `package_id` link in database

### Phase 2: Validation

- [ ] Validate crash course duration
- [ ] Validate capacity based on package type
- [ ] Prevent program creation if package is inactive

---

## 🎯 Benefits of This Approach

✅ **Single Source of Truth:** Class Type Manager owns package definitions  
✅ **No Duplication:** V2 doesn't redefine packages  
✅ **Backward Compatible:** Existing packages work immediately  
✅ **Admin Simplicity:** Manage packages in one place  
✅ **Flexibility:** Programs can customize display name, instructor, capacity  
✅ **Audit Trail:** Package changes don't affect existing programs  

---

## ❓ FAQ

**Q: What if admin changes package price in Class Type Manager?**  
A: Existing programs unaffected. New programs use updated price. Invoice generation looks at package price at booking time.

**Q: Can admin create program without package?**  
A: No, package is required. Ensures consistency and links to billing system.

**Q: What if package is archived?**  
A: Existing programs continue working. Can't create new programs from archived packages.

**Q: Can instructor teach classes from different packages in same program?**  
A: No, one program = one package. Different packages need different programs.

**Q: How does crash course detection work?**  
A: Check `package.course_type === 'crash'`. Disables T-5 automation, enables duration validation.

---

**Next:** Review and proceed with V2 implementation! 🚀
