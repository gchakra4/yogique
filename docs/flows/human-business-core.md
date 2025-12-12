# Core Business Flow (Human Readable)

## Client Booking Journey
- **Entry Points:** Individual clients use `/book/individual` (BookOneOnOne), corporate leads use `/book/corporate` (BookCorporate). Both are gated by AuthContext; unauthenticated users are prompted to log in and form state is cached in `localStorage` for recovery.
- **Wizard Steps:** Personal/company info → package/program selection → schedule/logistics → confirmation. Each step runs `validateStep` guards and surfaces inline errors before allowing progress.
- **Class Package Discovery:** Pages query `class_packages` (filtered for `is_active`/`is_archived=false`) and expose search, course-type toggles (regular vs. crash), expandable descriptions, price-per-class, and duration/validity metadata.
- **Submission Workflow:** On submit the form builds a `bookingData` payload (timezone, goals/objectives, preferred days/times, emergency contacts, corporate metadata, etc.), enforces idempotency via payload hashes + `bookings` table lookups, inserts into `bookings`, logs events (`recordLog`) and, for corporate, broadcasts `booking-created` with `BroadcastChannel`.
- **Post-Booking Communications:** `BookOneOnOne` triggers `generateCancelToken`, renders an HTML confirmation (inline logo attachment, action URL `/profile#my-bookings`, cancel link, policy), and fire-and-forgets through `EmailService.sendTransactionalEmail`.

## Admin Booking Operations
- **BookingManagement Module:** `src/features/dashboard/components/Modules/BookingManagement.tsx` lists all bookings with search, status (pending/confirmed/completed/cancelled/rescheduled/user_cancelled) and date filters (today/upcoming/past). Admins can view/edit details, change status (auto-setting `cancelled_by`), update linked packages, delete rows, or send notifications.
- **Cancellation Tokens:** Admins may revoke tokens via the `revoke-cancel-token` edge function, clearing `cancel_token` / `cancel_token_expires_at` to prevent client reuse.

## Class Assignment Lifecycle
- **Manager Console:** `ClassAssignmentManager/ClassAssignmentManager.tsx` provides list/calendar/analytics views, advanced filters, multi-select deletion, and per-assignment detail/edit popups. Search spans class types, instructors, and linked client names.
- **Data Fetching:** `useClassAssignmentData` loads class types, packages, roles, user profiles, bookings, class schedules, and assignments (with `assignment_bookings` junction data) in parallel, enriching them with profile/class metadata.
- **Assignment Creation Form:** `components/AssignmentForm.tsx` supports five assignment types (`adhoc`, `weekly`, `monthly`, `crash_course`, `package`). It guides admins through booking type (individual/corporate/private_group/public_group), booking selection (`AdaptiveBookingSelector`), class type or package pickers, recurrence templates, manual calendars, and timeline previews while auto-suggesting rates via `useRateForAssignment`.
- **Conflict Checks:** For adhoc classes, `ClassAssignmentManager` runs `checkForConflicts` against existing assignments, weekly schedules, duration limits (<30 or >180 min), off-hours, and weekends, tagging severity (`error`/`warning`).

## Assignment Persistence & Payments
- **Service Layer:** `AssignmentCreationService` validates UUIDs/dates/times, normalizes data, ensures instructor rates exist (`ensureInstructorRateIfMissing`), computes pay (`calculatePaymentAmount`) per `payment_type` (`per_class`, `per_student_per_class`, `per_class_total`, `per_member`, `monthly`, `total_duration`), and generates schedules:
  - **Adhoc:** Single class; enforces date not past and start < end; updates linked bookings to `completed`.
  - **Weekly:** Either updates an existing template or creates a new `class_schedules` row, then expands occurrences through `generateWeeklyAssignments` until end date.
  - **Monthly / Package:** Requires a package; supports weekly recurrence (weekly days, total classes, validity) or manual calendar selections.
  - **Crash Course:** Similar to monthly but flagged `schedule_type='crash'`, using package class counts and optional manual calendars.
- **Booking Linkage:** `assignment_bookings` relates each assignment to one or many bookings (rules restrict multiples for individual/private group). Linked bookings have statuses updated to `completed`.
- **Instructor Payments:** `EditAssignmentModal` allows recalculating payment totals when student counts change. Payment and instructor statuses start as `pending` and transition through Transaction Management.

## Financial Tracking
- **Transactions Dashboard:** `TransactionManagement.tsx` fetches `transactions_with_user`, resolves missing profile names, applies income/expense/category filters, computes totals, and listens to Supabase realtime updates. Admins can add manual entries via `record-transaction` (edge function), select billing plan types (`one_time`, `monthly`, `crash_course`), and generate branded PDF invoices (`pdf-lib`) using `business_settings` metadata.
- **Payout Metrics:** Shared types in `src/shared/types/assignments.ts` define `final_payment_amount`, `payment_status`, and aggregated payout/attendance structures for downstream reporting.

## Supporting Mechanics
- `generateCancelToken` powers secure self-service cancellation links referenced in emails and profile views.
- Local logging (`recordLog` + `localStorage` buffers) and BroadcastChannel listeners help diagnose duplicate submissions across browser tabs.
- Realtime Supabase channels refresh booking and transaction grids whenever rows change.
