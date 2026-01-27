# ClassesV2 Bulk Monthly Assignment Creation

## Overview

ClassesV2 now supports **bulk monthly assignment creation** with automatic package detection and weekly recurrence scheduling.

## Features Implemented

### 1. Enhanced AssignmentService (`assignment.service.ts`)

**Key Capabilities:**
- ✅ Single assignment creation (adhoc mode)
- ✅ Bulk monthly generation with `assignment_type: 'monthly'`
- ✅ Automatic `package.class_count` detection when `total_classes` not provided
- ✅ Weekly recurrence scheduling (select days like Mon/Wed/Fri)
- ✅ Manual calendar selection mode
- ✅ Calendar month boundary enforcement (first-month proration)
- ✅ Automatic booking link creation for ALL assignments

**Usage Example:**
```typescript
// Bulk monthly creation
await assignmentService.createAssignment({
  assignment_type: 'monthly',
  monthly_assignment_method: 'weekly_recurrence',
  container_id: 'program-id',
  package_id: 'package-id', // Will auto-detect class_count
  total_classes: 12, // Optional if package has class_count
  weekly_days: [1, 3, 5], // Mon, Wed, Fri
  start_date: '2026-01-27',
  start_time: '09:00',
  end_time: '10:00',
  instructor_id: 'instructor-id',
  booking_type: 'individual'
})

// Result: Creates up to 12 classes on Mon/Wed/Fri starting Jan 27
// within the current calendar month (Jan 1-31)
```

### 2. Enhanced AssignmentForm UI (`AssignmentForm.tsx`)

**New UI Elements:**
- ✅ **Bulk Mode Toggle**: Checkbox to enable bulk monthly creation
- ✅ **Package Selector**: Dropdown with auto-fetch from `class_packages`
- ✅ **Total Classes**: Auto-populated from package.class_count
- ✅ **Weekly Days Selector**: Checkbox grid for Sun-Sat
- ✅ **Preview**: Shows how many classes on which days
- ✅ **Conditional Labels**: "Start Date" in bulk mode, "Class Date" otherwise

**User Workflow:**
1. Open "+ Create Assignment" modal in ClassesV2
2. Check "Bulk Monthly Creation" checkbox
3. Select package (e.g., "Monthly Yoga - 12 Classes")
4. Total classes auto-fills to 12
5. Select days: Mon ✓, Wed ✓, Fri ✓
6. Set start date: Jan 27, 2026
7. Set time: 9:00 AM - 10:00 AM
8. Click "Create"
9. **Result**: System generates 12 assignments for Mon/Wed/Fri from Jan 27

## Architecture Alignment

### From Documentation (CLASS_ASSIGNMENT_V2_ARCHITECTURE.md)

**Monthly Subscriptions (Lines 122-145):**
- Package has `class_count` field (e.g., 12 classes)
- Admin creates program → System generates assignments based on schedule
- **Monthly Accumulation**: T-5 automation creates NEXT month's classes (future enhancement)

**Container-First Design:**
- All assignments linked to `class_container_id`
- Bookings linked via `assignment_bookings` junction table
- One booking → Many assignments (all sessions in program)

## Key Differences from Old System

| Feature | Old (ClassAssignmentManager) | New (ClassesV2) |
|---------|------------------------------|-----------------|
| Service | `AssignmentCreationService` | `AssignmentService` |
| Package Detection | Manual `total_classes` required | Auto-detects from `package.class_count` |
| UI Toggle | Always in complex mode | Simple toggle for bulk |
| Booking Links | Manual loop | Automatic for all assignments |
| Container | Optional | Always required |
| Calendar Enforcement | Manual | Automatic month boundaries |

## Database Operations

### Bulk Creation Flow:
1. **Validate** package_id, weekly_days, start_date
2. **Fetch** package.class_count if total_classes not provided
3. **Generate** assignments array with date calculations
4. **Enforce** calendar month boundaries (Jan 1-31, Feb 1-28, etc.)
5. **Insert** all assignments in single batch
6. **Create** `assignment_bookings` entries for ALL assignments

### Example Database Result:
```sql
-- Program created with 2 students, 12 classes on Mon/Wed/Fri
-- Results in:
class_assignments: 12 rows (one per class session)
assignment_bookings: 24 rows (12 assignments × 2 students)
```

## Testing Checklist

- [ ] Create program with package (12 classes)
- [ ] Enable bulk mode in "+ Create Assignment"
- [ ] Select Mon/Wed/Fri
- [ ] Verify total_classes auto-fills to 12
- [ ] Set start date: Jan 27, 2026
- [ ] Click "Create"
- [ ] **Expected**: 12 assignments created
- [ ] **Verify**: All assignments have same container_id
- [ ] **Verify**: All students appear in each assignment's roster (EditAssignmentModal)
- [ ] **Verify**: Capacity shows correct unique student count

## Future Enhancements

1. **T-5 Automation Integration**: Auto-generate next month's classes
2. **Manual Calendar Mode UI**: Visual date picker for custom schedules
3. **Crash Course Support**: Fixed-duration packages with validity windows
4. **Package Type Detection**: Auto-select bulk mode for monthly packages
5. **Conflict Detection**: Check instructor availability across generated dates

## Migration Notes

**Decommissioning Old System:**
- Old: `/dashboard/class-assignments` (ClassAssignmentManager)
- New: `/dashboard/classes-v2` (ClassesV2)
- **Action**: Gradually migrate users to ClassesV2 UI
- **Data**: Both systems use same `class_assignments` table
- **No breaking changes**: Existing assignments remain accessible

## API Reference

### AssignmentService.createAssignment()

**Single Mode:**
```typescript
{
  container_id: string,
  date: string,
  start_time: string,
  end_time: string,
  instructor_id: string
}
```

**Bulk Mode:**
```typescript
{
  assignment_type: 'monthly',
  monthly_assignment_method: 'weekly_recurrence',
  container_id: string,
  package_id: string, // Auto-detects class_count
  total_classes?: number, // Optional
  weekly_days: number[], // 0=Sun, 6=Sat
  start_date: string,
  start_time: string,
  end_time: string,
  instructor_id: string
}
```

**Returns:**
```typescript
{
  success: true,
  count: number, // Assignments created
  data: Assignment[],
  message: string
}
```

---

**Implementation Date**: January 27, 2026  
**Author**: AI Assistant (GitHub Copilot)  
**Related Docs**: CLASS_ASSIGNMENT_V2_ARCHITECTURE.md, PHASE_6_FRONTEND_COMPLETION.md
