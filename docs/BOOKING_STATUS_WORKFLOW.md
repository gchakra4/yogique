# Booking Status Workflow Implementation

## Overview
Comprehensive booking status management system with clear lifecycle states and transitions.

## Booking Status States

### 1. **pending** (Initial State)
- **When**: Booking is first created
- **Description**: Awaiting admin confirmation
- **Actions Available**: Confirm, Cancel
- **Color**: Yellow/Amber

### 2. **confirmed** (Ready for Assignment)
- **When**: Admin confirms the booking
- **Description**: Confirmed and pending class assignment
- **Actions Available**: Assign to Classes, Cancel, Discontinue
- **Color**: Blue

### 3. **classes_assigned** (Classes Created)
- **When**: Classes/assignments are created for this booking
- **Description**: Classes have been scheduled and assigned
- **Actions Available**: View Classes, Mark Active, Cancel, Discontinue
- **Color**: Purple

### 4. **active** (Ongoing Classes)
- **When**: Student has started attending classes
- **Description**: Booking is active with ongoing attendance
- **Actions Available**: Suspend, Complete, Discontinue
- **Color**: Green

### 5. **user_cancelled** (User Initiated Cancellation)
- **When**: User cancels via email link or dashboard
- **Description**: User cancelled the booking
- **Actions Available**: View Details
- **Color**: Red
- **Tracks**: `cancelled_reason`, `cancelled_at`

### 6. **admin_cancelled** (Admin Initiated Cancellation)
- **When**: Admin or system cancels the booking
- **Description**: Admin cancelled the booking
- **Actions Available**: View Details, Reactivate (if needed)
- **Color**: Orange/Red
- **Tracks**: `cancelled_reason`, `cancelled_at`, `cancelled_by`

### 7. **suspended** (Payment Issues)
- **When**: Classes discontinued due to non-payment
- **Description**: Temporarily suspended, can be reactivated upon payment
- **Actions Available**: Reactivate, Complete
- **Color**: Dark Yellow/Warning
- **Note**: Instructors are freed from suspended booking assignments

### 8. **discontinued** (Permanently Stopped)
- **When**: User or admin permanently discontinues
- **Description**: Booking ended early but wasn't cancelled
- **Actions Available**: View Details
- **Color**: Grey
- **Tracks**: `discontinued_reason`

### 9. **completed** (Finished Successfully)
- **When**: All scheduled classes finished
- **Description**: Booking completed successfully
- **Actions Available**: View History
- **Color**: Dark Green

## Status Transitions

```
pending → confirmed → classes_assigned → active → completed
            ↓              ↓              ↓
      admin_cancelled  user_cancelled  suspended → active (on payment)
                                         ↓
                                    discontinued
```

## Database Schema

### Migration File
`supabase/migrations/20260128000001_add_booking_status_enum.sql`

### New Columns
- `status` - booking_status ENUM (replaces old text status)
- `cancelled_reason` - TEXT (why it was cancelled)
- `discontinued_reason` - TEXT (why it was discontinued)
- `cancelled_at` - TIMESTAMPTZ (when it was cancelled - already exists)
- `cancelled_by` - UUID (who cancelled it - already exists)

### Functions Created
1. `update_booking_status(booking_id, new_status, reason)` - Update with validation
2. `confirm_booking(booking_id)` - Quick confirm helper
3. `mark_booking_classes_assigned(booking_id)` - Mark classes assigned

## Implementation Steps

### 1. Apply Migration
```sql
-- Run the migration in Supabase SQL Editor
-- Or use Supabase CLI:
supabase db push
```

### 2. Update UI Components

#### A. BookingManagement.tsx
Add status management buttons:
- **Confirm Booking** button for `pending` bookings
- **Mark Classes Assigned** button (auto-triggered when assigning)
- **Suspend** button for `active` bookings with payment issues
- **Discontinue** button for manual discontinuation
- Status badge with appropriate colors
- Status filter in the filter dropdown

#### B. Assignment Flow
Update `AssignToProgram.tsx` or booking assignment modals to:
- Auto-update booking status to `classes_assigned` when assignments are created
- Call: `await supabase.rpc('mark_booking_classes_assigned', { p_booking_id: booking.id })`

#### C. User Profile/Cancellation
Update `user-cancel-booking` edge function to:
- Set status to `user_cancelled` instead of just `cancelled`
- The existing `cancelled_at`, `user_cancelled`, and `cancel_token` logic remains

### 3. Update Booking Selector
Update `BookingSelector.tsx` to exclude multiple statuses:
```typescript
// Old: .neq('status', 'completed')
// New:
.not('status', 'in', '(user_cancelled,admin_cancelled,completed,discontinued)')
```

## Benefits

1. **Clear Lifecycle** - Easy to understand booking progression
2. **Better Filtering** - Filter by specific states
3. **Audit Trail** - Track why and when status changed
4. **User vs Admin** - Distinguish between user and admin cancellations
5. **Payment Issues** - Separate `suspended` state for non-payment
6. **Analytics** - Better reporting on booking outcomes

## Status Colors (Recommended)

```typescript
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  classes_assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  user_cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  admin_cancelled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  discontinued: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};
```

## Example Usage

```typescript
// Confirm a booking
const { data, error } = await supabase.rpc('confirm_booking', {
  p_booking_id: booking.id
});

// Mark classes assigned (called after creating assignments)
await supabase.rpc('mark_booking_classes_assigned', {
  p_booking_id: booking.id
});

// Suspend for non-payment
await supabase.rpc('update_booking_status', {
  p_booking_id: booking.id,
  p_new_status: 'suspended',
  p_reason: 'Payment overdue by 7 days'
});

// Discontinue booking
await supabase.rpc('update_booking_status', {
  p_booking_id: booking.id,
  p_new_status: 'discontinued',
  p_reason: 'User requested to stop classes early'
});
```

## Next Steps

1. ✅ Migration created
2. ⏳ Apply migration to database
3. ⏳ Update BookingManagement UI
4. ⏳ Update assignment flow to auto-update status
5. ⏳ Update user cancellation edge function
6. ⏳ Update booking filters across the app
