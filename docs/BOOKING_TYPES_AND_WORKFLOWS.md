# 📚 Complete Booking Types & Workflows Guide

## 📋 Table of Contents
1. [Booking Types Overview](#booking-types-overview)
2. [User Booking Journeys](#user-booking-journeys)
3. [Admin Workflows](#admin-workflows)
4. [Notification System](#notification-system)
5. [Navigation Guide](#navigation-guide)
6. [Container Architecture](#container-architecture)

---

## 🎯 Booking Types Overview

### **1. Individual Booking (1:1 Classes)**

**Characteristics:**
- **Booking Type:** `individual`
- **Container Type:** `individual`
- **Capacity:** Exactly 1 student (locked, cannot be changed)
- **Billing:** Can be recurring (monthly/quarterly/half-yearly/annual) OR one-time
- **Use Case:** Private 1:1 yoga sessions with dedicated instructor

**Navigation:** 
- Public: [/book/individual](/book/individual) → BookClass page
- Admin: [/dashboard/class-assignments](/dashboard/class-assignments) → Create Individual Assignment

**Booking Flow:**
```
User → /book/individual
  ├─ Step 1: Personal Information (name, email, phone, experience level)
  ├─ Step 2: Select Class Package (browse active packages, filter by course_type)
  ├─ Step 3: Select Date & Time (calendar view with available slots)
  ├─ Step 4: Confirmation
  └─ Booking Created → Confirmation Email Sent
```

**What Happens:**
1. User submits booking form
2. Database creates booking record with `booking_type = 'individual'`
3. System generates unique `booking_id` (format: `YOG-YYYYMMDD-XXXX`)
4. Notification queued to `notifications_queue` table
5. Email sent with booking details, payment instructions
6. Admin sees booking in [/dashboard/booking-management](/dashboard/booking-management)

**Admin Actions:**
- View booking details in Booking Management
- Link to class package if not already linked
- Set `billing_cycle_anchor` (date when monthly billing starts)
- Create manual class assignments for first month
- Generate first invoice manually
- After first month: T-5 automation takes over

**Recurring vs One-Time:**
- **Recurring:** Set `is_recurring = true`, `billing_cycle_anchor = date` → T-5 creates classes automatically every month
- **One-Time:** `is_recurring = false` → Admin creates classes manually only

---

### **2. Private Group Booking (Closed Group)**

**Characteristics:**
- **Booking Type:** `private_group`
- **Container Type:** `private_group`
- **Capacity:** 1-30 students (editable by admin)
- **Billing:** Can be recurring OR one-time
- **Use Case:** Families, friends, closed corporate teams

**Navigation:**
- Public: [/book/private-group](/book/private-group) → BookClass page (same as individual)
- Admin: [/dashboard/class-assignments](/dashboard/class-assignments) → Select Private Group

**Booking Flow:**
```
User → /book/private-group (or /book/individual with group option)
  ├─ Step 1: Primary Contact Info + Group Details (# of participants)
  ├─ Step 2: Select Class Package
  ├─ Step 3: Schedule Preferences
  ├─ Step 4: Confirmation
  └─ Multiple Bookings Created (one per participant)
```

**What Happens:**
1. **First participant** creates booking with `booking_type = 'private_group'`
2. **Admin** creates class container:
   - Container code: `{instructorId}-{packageId}-{YYYY-MM}`
   - Container type: `private_group`
   - Capacity: Set by admin (e.g., 15)
3. **Additional participants** book separately with same instructor/package
4. **Admin links all bookings** to same container:
   - Each booking gets entry in `assignment_bookings` table
   - All share same `class_container_id`
5. **T-5 automation** (if recurring) creates monthly classes for entire group
6. **Invoice generated** for each participant individually

**Admin Actions:**
- Create container with appropriate capacity
- Link multiple bookings to container
- Monitor capacity: current vs max
- Create class assignments (adhoc or monthly)
- Generate invoices for each participant

**Container Sharing:**
- One container per month per group
- Multiple bookings (students) share same container
- Classes created once, visible to all participants

---

### **3. Public Group Booking (Open Enrollment)**

**Characteristics:**
- **Booking Type:** `public_group`
- **Container Type:** `public_group`
- **Capacity:** 1-50 students (editable by admin)
- **Billing:** Typically recurring (monthly memberships)
- **Use Case:** Regular group yoga classes, workshops

**Navigation:**
- Public: [/schedule](/schedule) → Weekly Schedule → Book specific time slot
- Admin: [/dashboard/class-assignments](/dashboard/class-assignments) → Weekly Assignment

**Booking Flow:**
```
User → /schedule (WeeklySchedule page)
  ├─ Browse Available Classes (filter by day, time, instructor)
  ├─ Click "Book Now" on specific time slot
  ├─ Login/Register if not authenticated
  ├─ Fill booking form (auto-populated with class details)
  ├─ Select package or pay per class
  ├─ Confirmation
  └─ Booking Created + Email Sent
```

**What Happens:**
1. **Admin creates weekly recurring class:**
   - Assignment type: `weekly`
   - Booking type: `public_group`
   - Instructor + package selected
   - Day of week + time set (e.g., "Every Monday 6:00 PM")
2. **Container created automatically:**
   - Container code: `{instructorId}-{packageId}-WEEKLY-MON-1800`
   - Container type: `public_group`
   - Capacity: Set by admin (e.g., 30)
3. **Users book slots:**
   - Each booking linked to same container
   - Capacity tracked: `current_booking_count` vs `max_booking_count`
4. **Classes appear on public schedule:**
   - Users see available slots
   - Can book if capacity available
5. **Full capacity:**
   - System prevents new bookings when `current_booking_count >= max_booking_count`
   - Shows "Full" on schedule

**Admin Actions:**
- Create weekly recurring class assignments
- Set capacity for each time slot
- Monitor enrollments
- Manage waitlists (if implemented)
- Create additional sections if full

**Notifications:**
- Booking confirmation (immediate)
- Class reminder (24-48 hours before)
- Payment reminders (if recurring)

---

### **4. Corporate Booking (Wellness Programs)**

**Characteristics:**
- **Booking Type:** `corporate`
- **Container Type:** Can be `private_group` or `public_group` depending on setup
- **Capacity:** Configurable (typically 10-50)
- **Billing:** Usually monthly/quarterly contracts
- **Use Case:** Employee wellness programs, team building

**Navigation:**
- Public: [/book/corporate](/book/corporate) → BookCorporate page
- Admin: [/dashboard/booking-management](/dashboard/booking-management) → Corporate Bookings

**Booking Flow:**
```
Corporate HR → /book/corporate
  ├─ Step 1: Company Information
  │   ├─ Company name, industry, size
  │   ├─ Contact person details
  │   └─ Wellness goals
  ├─ Step 2: Program Selection
  │   ├─ Browse packages (can be regular or crash courses)
  │   ├─ Filter by course type
  │   └─ Expandable descriptions
  ├─ Step 3: Logistics
  │   ├─ Number of participants
  │   ├─ Preferred days/times
  │   ├─ Location (on-site vs studio)
  │   └─ Duration and frequency
  ├─ Step 4: Confirmation
  └─ Lead Generated → Admin Follow-up
```

**What Happens:**
1. **Corporate contact** submits booking request
2. **Admin reviews** and creates formal booking:
   - Can create private group (closed to company only)
   - Or add to public group slots
3. **Container created:**
   - If private: `{instructorId}-{packageId}-{YYYY-MM}`
   - Capacity set based on participant count
4. **Employee enrollment:**
   - Option A: Admin creates bookings for each employee
   - Option B: Employees self-book using corporate code
5. **Bulk billing:**
   - Single invoice to company OR
   - Individual invoices if company pays per employee

**Admin Actions:**
- Review corporate leads
- Create master booking/contract
- Set up dedicated time slots
- Enroll employees (bulk or individual)
- Generate corporate invoices
- Monitor attendance/engagement

**Special Features:**
- Custom pricing for corporate contracts
- Reporting dashboards for company
- Attendance tracking
- Wellness metrics

---

### **5. Crash Course Booking (Fixed Duration Programs)**

**Characteristics:**
- **Booking Type:** Any (`individual`, `corporate`, `private_group`, `public_group`)
- **Container Type:** `crash_course`
- **Capacity:** 1-50 (configurable)
- **Billing:** One-time payment OR installments
- **Use Case:** Workshops, certification programs, themed series (e.g., "30-Day Mindfulness")

**Navigation:**
- Public: [/book/individual](/book/individual) OR [/book/corporate](/book/corporate) → Filter for Crash Courses
- Admin: [/dashboard/class-assignments](/dashboard/class-assignments) → Crash Course Assignment

**Booking Flow:**
```
User → /book/* (any booking page)
  ├─ Filter Packages by "Crash Course"
  ├─ View program details:
  │   ├─ Fixed duration (e.g., "4 weeks")
  │   ├─ Total classes (e.g., "12 sessions")
  │   ├─ Schedule preview
  │   └─ Full price upfront
  ├─ Select program
  ├─ Choose start date
  ├─ Complete booking
  └─ Enrolled in Crash Course
```

**What Happens:**
1. **Package must have:**
   - `course_type = 'crash'`
   - `duration` and `validity_days` set
   - Fixed `class_count`
2. **Admin creates crash course assignment:**
   - Assignment type: `crash_course`
   - Booking type: Selected (individual/group)
   - Start and end dates specified
3. **Container created:**
   - Container type: `crash_course`
   - Container code: `{instructorId}-{packageId}-{YYYY-MM}`
   - Capacity based on enrollment model
4. **Classes generated:**
   - Admin creates specific class schedule
   - Can be weekly recurrence or manual calendar selection
   - NO T-5 automation (crash courses don't auto-renew)
5. **Payment:**
   - Full amount due upfront OR
   - Payment plan with installments
   - Invoice generated immediately

**Admin Actions:**
- Create crash course package (one-time setup)
- Schedule specific class dates
- Enroll participants (individual or bulk)
- Monitor progress/completion
- Issue completion certificates (if applicable)

**Key Difference from Regular:**
- **One-time only:** No monthly renewal
- **Fixed duration:** Start and end dates set
- **No T-5 automation:** All classes created upfront
- **Completion tracking:** Program has defined end

---

## 👥 User Booking Journeys

### **Journey 1: Individual User Books Private Class**

**Actor:** Sarah (End User)

**Steps:**
1. **Discovery:** 
   - Visits website homepage
   - Clicks "Book a Class" → Redirected to [/book/individual](/book/individual)

2. **Package Selection:**
   - Views available packages
   - Filters by "Regular" courses
   - Expands package to read description
   - Sees: "Pravaha - 8 classes/month - ₹3,000"
   - Clicks "Select Package"

3. **Booking Form:**
   - Fills personal details:
     - Full name: "Sarah Kumar"
     - Email: "sarah@example.com"
     - Phone: "+91 98765 43210"
     - Experience level: "Beginner"
   - Selects preferred start date: "Feb 1, 2026"
   - Chooses timezone: "Asia/Kolkata"
   - Special requests: "Morning classes preferred"

4. **Confirmation:**
   - Reviews booking summary
   - Clicks "Confirm Booking"
   - Sees success message with `booking_id: YOG-20260108-0042`

5. **Post-Booking:**
   - Receives confirmation email immediately
   - Email contains:
     - Booking reference number
     - Package details
     - Next steps (admin will contact for scheduling)
     - Payment instructions
   - Also receives WhatsApp confirmation (if phone valid)

6. **Admin Contact:**
   - Admin sees booking in [/dashboard/booking-management](/dashboard/booking-management)
   - Admin calls/emails Sarah
   - Discusses preferred days/times
   - Sets up payment details
   - Creates first month's class schedule

7. **First Month:**
   - Admin creates individual classes (adhoc assignments)
   - Sarah receives class reminders 24 hours before each class
   - Admin generates first invoice manually

8. **Automated Months:**
   - Admin sets `is_recurring = true`, `billing_cycle_anchor = 2026-02-01`
   - On Jan 26 (T-5), system auto-generates Feb classes
   - Sarah receives invoice for Feb automatically
   - Classes continue monthly without admin intervention

**Notifications Received:**
- ✅ Booking confirmation email (immediate)
- ✅ Booking confirmation WhatsApp (immediate)
- ✅ Invoice email (first month: manual, subsequent: T-5)
- ✅ Payment reminder email (T-3, T-1, due date)
- ✅ Payment reminder WhatsApp (T-3, T-1)
- ✅ Class reminder email (24h before each class)
- ✅ Class reminder with Zoom link (1h before if virtual)
- ✅ Payment success confirmation
- ⚠️ Overdue payment warnings (if unpaid)
- 🔒 Access suspended notification (if payment very overdue)

---

### **Journey 2: Corporate HR Books Wellness Program**

**Actor:** Priya (HR Manager at Tech Corp)

**Steps:**
1. **Research:**
   - Visits [/corporate-solutions](/corporate-solutions) → Learns about offerings
   - Clicks "Get Started" → Goes to [/book/corporate](/book/corporate)

2. **Company Details:**
   - Fills company information:
     - Company: "Tech Corp India"
     - Industry: "Technology"
     - Size: "100-500 employees"
     - Contact: "Priya Sharma"
     - Email: "priya@techcorp.com"
     - Phone: "+91 98765 11111"

3. **Program Selection:**
   - Browses corporate packages
   - Finds: "Corporate Wellness - Monthly Program"
   - Details: 16 classes/month, ₹25,000/month, 20 employees
   - Selects package

4. **Logistics:**
   - Participants: 20
   - Preferred days: Tuesday, Thursday
   - Preferred times: 6:00-7:00 PM
   - Location: "Company premises"
   - Duration: 6 months initially
   - Budget: ₹150,000 for 6 months

5. **Submission:**
   - Submits request
   - Receives "Thank you" message
   - Admin will contact to finalize

6. **Admin Follow-up:**
   - Admin reviews request in [/dashboard/booking-management](/dashboard/booking-management)
   - Calls Priya to discuss details
   - Creates custom package if needed
   - Assigns dedicated instructor

7. **Setup Process:**
   - **Admin creates container:**
     - Type: `private_group`
     - Capacity: 20
     - Instructor: Assigned
     - Package: Corporate Wellness

   - **Admin schedules classes:**
     - Weekly recurring: Tue & Thu, 6:00 PM
     - Creates monthly assignments
     - Links to corporate container

8. **Employee Enrollment:**
   - **Option A:** Admin creates 20 bookings manually
     - Priya provides employee list
     - Admin creates booking for each
     - Each linked to same container

   - **Option B:** Self-enrollment
     - Priya shares unique corporate code
     - Employees self-book using code
     - System auto-links to corporate container

9. **Ongoing:**
   - Classes run twice weekly
   - All 20 employees share same container
   - Attendance tracked per class
   - Monthly invoices sent to company
   - HR dashboard shows participation metrics

**Notifications Received (Company):**
- ✅ Booking confirmation email to Priya
- ✅ Invoice emails (monthly) to billing@techcorp.com
- ✅ Payment reminders if overdue
- 📊 Monthly participation report

**Notifications Received (Employees):**
- ✅ Welcome email with schedule
- ✅ Class reminders (24h before)
- ✅ Zoom links (if virtual)
- 🎉 Milestone achievements (e.g., "10 classes completed!")

---

### **Journey 3: User Joins Public Group Class**

**Actor:** Raj (Student)

**Steps:**
1. **Discovery:**
   - Visits [/schedule](/schedule) → Weekly Schedule page
   - Views classes available this week

2. **Browse Schedule:**
   - Filters by:
     - Day: Monday
     - Instructor: "Anjali Mehta"
     - Class type: "Vinyasa Flow"
   - Sees: Monday 7:00 AM - Vinyasa Flow with Anjali (12/30 spots filled)

3. **Select Class:**
   - Clicks "Book Now" on Monday 7 AM slot
   - If not logged in: Redirected to login
   - After login: Returns to booking flow

4. **Booking Form:**
   - Pre-filled with class details:
     - Class: Vinyasa Flow
     - Instructor: Anjali Mehta
     - Date: Monday, Feb 10, 2026
     - Time: 7:00 AM
   - Raj fills:
     - Package: "Monthly Unlimited - ₹4,500"
     - Payment method: Monthly recurring

5. **Confirmation:**
   - Booking created with `booking_type = 'public_group'`
   - Linked to existing Monday 7 AM container
   - Container capacity: 13/30 now

6. **Post-Booking:**
   - Receives confirmation email
   - Email shows:
     - Class schedule (every Monday 7 AM)
     - Location/Zoom link
     - Instructor bio
     - Cancellation policy
   - WhatsApp reminder sent 1 day before first class

7. **Recurring Experience:**
   - Raj shows up Monday 7 AM each week
   - Gets reminder 24h before each class
   - Attendance marked after each class
   - Invoice generated monthly automatically

**Notifications Received:**
- ✅ Booking confirmation (immediate)
- ✅ First class reminder (24h before)
- ✅ Weekly class reminders (24h before each Monday)
- ✅ Monthly invoice (T-5 automation)
- ✅ Payment reminders if needed
- 🎯 Progress updates (e.g., "You've attended 12 classes this month!")

---

## 🔧 Admin Workflows

### **Admin Dashboard Navigation**

**Main Dashboard:** [/dashboard](/dashboard)

**Available Modules:**

| Module | Path | Purpose |
|--------|------|---------|
| Overview | `/dashboard` | Key metrics, recent activity |
| Booking Management | `/dashboard/booking-management` | View/edit all bookings |
| Class Assignments | `/dashboard/class-assignments` | Create & manage class schedule |
| Invoice Management | `/dashboard/invoice-management` | View/generate invoices |
| Transaction Management | `/dashboard/transaction-management` | Record payments, send invoices |
| Payment Links | `/dashboard/payment-links` | Monitor Razorpay payment links |
| User Management | `/dashboard/user-management` | Manage user accounts |
| Instructor Management | `/dashboard/instructor-management` | Add/edit instructors |
| Class Types | `/dashboard/class-types` | Manage class type catalog |
| Packages | `/dashboard/packages` | Create/edit class packages |
| Business Settings | `/dashboard/business-settings` | Configure company info, branding |
| Audit Logs | `/dashboard/audit-logs` | System activity tracking |

---

### **Workflow 1: Admin Creates Individual Recurring Class**

**Scenario:** Sarah books individual class, admin sets up monthly automation

**Steps:**

1. **View Booking:**
   - Go to [/dashboard/booking-management](/dashboard/booking-management)
   - Search for "Sarah Kumar"
   - Click to view booking details

2. **Link Package:**
   - In booking details drawer:
     - Click "Edit Package"
     - Select: "Pravaha - 8 classes/month"
     - Save
   - Booking now has `class_package_id` set

3. **Set Billing Cycle:**
   - In same drawer:
     - Set "Billing Cycle Anchor": Feb 1, 2026
     - Toggle "Is Recurring": ON
     - Set "Access Status": Active
     - Save
   - Database updates: `is_recurring = true`, `billing_cycle_anchor = '2026-02-01'`

4. **Create First Month Classes:**
   - Go to [/dashboard/class-assignments](/dashboard/class-assignments)
   - Click "New Assignment" → Opens assignment form
   - Select:
     - Assignment Type: `adhoc` (for first month manual creation)
     - Booking: Sarah Kumar (search and select)
     - Booking Type: `individual`
     - Instructor: Anjali Mehta
     - Package: Pravaha
   - Set schedule:
     - Date: Feb 3, 2026
     - Time: 7:00 AM - 8:00 AM
   - Create assignment
   - Repeat 7 more times for 8 classes total

5. **Generate First Invoice:**
   - Click "Generate Invoices" button (purple, top right)
   - Select month: "2026-02"
   - Click "Generate"
   - System calls `generate_monthly_invoices` RPC
   - Invoice created for Sarah, status: pending

6. **Automated Future:**
   - **Jan 26, 2026 (T-5 for Feb):**
     - Already handled manually above ✓
   
   - **Feb 23, 2026 (T-5 for Mar):**
     - Cron runs `generate_t5_invoices`
     - Finds Sarah's booking (recurring, anchor = Feb 1)
     - Generates March 1-31 classes automatically
     - Creates container: `YOG-20260108-0042-2026-03`
     - Generates March invoice
     - Sarah receives invoice email

   - **Every Month After:**
     - T-5 automation continues
     - No admin action needed ✅

**Admin Monitoring:**
- Check [/dashboard/class-assignments](/dashboard/class-assignments) weekly
- Monitor attendance (mark present/absent)
- Handle rescheduling requests
- Review payment status in [/dashboard/invoice-management](/dashboard/invoice-management)

---

### **Workflow 2: Admin Sets Up Private Group**

**Scenario:** Tech Corp wants private yoga for 15 employees

**Steps:**

1. **Review Corporate Lead:**
   - Go to [/dashboard/booking-management](/dashboard/booking-management)
   - Filter: Booking Type = "corporate"
   - Find: Tech Corp request from Priya

2. **Create Master Container:**
   - Go to [/dashboard/class-assignments](/dashboard/class-assignments)
   - Click "Container Management" tab (if implemented) OR
   - Will create during first assignment

3. **Create Weekly Schedule:**
   - Click "New Assignment"
   - Select:
     - Assignment Type: `weekly`
     - Booking Type: `private_group`
     - Instructor: Anjali Mehta
     - Package: Corporate Wellness
   - Schedule:
     - Day: Tuesday
     - Time: 6:00 PM - 7:00 PM
     - Recurrence: Weekly
   - Set capacity: 15
   - Create assignment
   - **Container auto-created:**
     - Code: `{anjali-id}-{corporate-pkg-id}-WEEKLY-TUE-1800`
     - Type: `private_group`
     - Max capacity: 15

4. **Create Thursday Class:**
   - Repeat above for Thursday 6 PM
   - Uses SAME container (links via instructor + package)

5. **Enroll Employees:**
   
   **Option A: Manual Creation**
   - Priya emails employee list (15 people)
   - For each employee:
     - Go to [/dashboard/booking-management](/dashboard/booking-management)
     - Click "Quick Booking" button
     - Fill:
       - Name: Employee name
       - Email: Employee email
       - Phone: Employee phone
       - Booking Type: `private_group`
       - Package: Corporate Wellness
       - Status: confirmed
     - Create booking
   - System auto-links bookings to corporate container

   **Option B: Bulk Import (if implemented)**
   - Upload CSV with employee details
   - System creates all bookings at once
   - All linked to corporate container

6. **Monitor & Manage:**
   - View container in Class Assignments
   - See all 15 employees listed
   - Track attendance per class
   - View capacity: 15/15 filled

7. **Generate Corporate Invoice:**
   - Go to [/dashboard/invoice-management](/dashboard/invoice-management)
   - Click "Generate Invoices"
   - Select month: "2026-02"
   - System generates 15 individual invoices (one per employee)
   - OR single corporate invoice (depending on billing setup)

**Ongoing Management:**
- **Add New Employee:**
  - Create new booking
  - System auto-links to container (if capacity available)
  - If full: Admin increases container capacity first

- **Remove Employee:**
  - Go to booking, change status to "cancelled"
  - Container capacity updates: 14/15

- **Change Schedule:**
  - Edit assignment in Class Assignments
  - All participants automatically updated

---

### **Workflow 3: Admin Sets Up Public Weekly Class**

**Scenario:** Create regular Monday morning Vinyasa class open to all

**Steps:**

1. **Create Weekly Assignment:**
   - Go to [/dashboard/class-assignments](/dashboard/class-assignments)
   - Click "New Assignment"
   - Select:
     - Assignment Type: `weekly`
     - Booking Type: `public_group`
     - Instructor: Anjali Mehta
     - Package: Drop-in or Monthly Unlimited
   - Schedule:
     - Day: Monday
     - Time: 7:00 AM - 8:00 AM
     - Recurrence: Every week
   - Set capacity: 30
   - Create

2. **Container Auto-Created:**
   - Code: `{anjali-id}-{package-id}-WEEKLY-MON-0700`
   - Type: `public_group`
   - Max capacity: 30
   - Current: 0

3. **Class Appears on Schedule:**
   - Public can view at [/schedule](/schedule)
   - Shows: "Monday 7:00 AM - Vinyasa Flow - Anjali - 0/30 spots"

4. **Users Book:**
   - Raj books from schedule (as shown in Journey 3)
   - Booking auto-linked to Monday container
   - Capacity updates: 1/30

5. **Monitor Enrollment:**
   - Admin checks Class Assignments weekly
   - Sees current enrollment: 13/30
   - Can view all 13 enrolled students
   - Can send bulk notifications to class

6. **Manage Full Class:**
   - When 30/30:
     - Schedule shows "Full"
     - New bookings prevented
     - Admin options:
       - Increase capacity (if space available)
       - Create second section (Monday 8 AM)
       - Start waitlist

---

### **Workflow 4: Admin Creates Crash Course**

**Scenario:** "30-Day Yoga Foundation" workshop

**Steps:**

1. **Create Crash Course Package:**
   - Go to [/dashboard/packages](/dashboard/packages)
   - Click "Add Package"
   - Fill:
     - Name: "30-Day Yoga Foundation"
     - Course Type: `crash` ← IMPORTANT
     - Duration: 4 weeks
     - Class Count: 12 (3x/week)
     - Price: ₹5,000
     - Description: Fixed 30-day program...
   - Save

2. **Create Crash Course Assignment:**
   - Go to [/dashboard/class-assignments](/dashboard/class-assignments)
   - Click "New Assignment"
   - Select:
     - Assignment Type: `crash_course`
     - Booking Type: Choose based on model:
       - `individual` if 1:1
       - `private_group` if closed group
       - `public_group` if open enrollment
   - Select crash course package
   - Set dates:
     - Start: Mar 1, 2026
     - End: Mar 30, 2026
   - Schedule: Manual calendar selection
     - Pick 12 specific dates (e.g., Mon/Wed/Fri for 4 weeks)

3. **Container Created:**
   - Code: `{instructor-id}-{package-id}-2026-03`
   - Type: `crash_course`
   - Capacity: Set by booking type (1 for individual, 10+ for groups)

4. **Enroll Participants:**
   - Participants book via:
     - [/book/individual](/book/individual) (for individual)
     - [/book/corporate](/book/corporate) (for groups)
   - Filter packages by "Crash Course"
   - Select "30-Day Yoga Foundation"
   - Complete booking
   - Bookings auto-linked to crash course container

5. **Generate Invoice:**
   - Full amount due upfront
   - Invoice generated immediately after booking
   - Payment required before course starts

6. **Run Program:**
   - Classes happen on scheduled dates
   - No monthly renewal (one-time only)
   - After 12 classes: Program complete
   - Optional: Issue completion certificate

**Key Difference:**
- **No T-5 automation** for crash courses
- All classes created upfront
- Does not auto-renew monthly

---

## 📧 Notification System

### **Notification Channels**

1. **Email** - Primary channel for all notifications
2. **WhatsApp** - High-priority reminders and confirmations
3. **SMS** - Optional, used sparingly

### **Notification Types**

#### **1. Booking Confirmations**

**Trigger:** User completes booking
**Channel:** Email + WhatsApp
**Timing:** Immediate (within 1 minute)

**Email Template:** `booking_confirmation`

**Contains:**
- Booking reference number
- Package details (name, duration, class count)
- Instructor information
- Next steps
- Payment instructions
- Contact information

**WhatsApp Template:** `yogique_booking_confirmation`

**Variables:**
- Customer name
- Booking ID
- Class package name
- Start date

**Example:**
```
Namaste Sarah! 🙏

Your booking is confirmed!

📝 Booking ID: YOG-20260108-0042
📦 Package: Pravaha (8 classes/month)
📅 Start Date: Feb 1, 2026

Our team will contact you within 24 hours to schedule your classes.

Questions? Reply to this message.

- Team Yogique
```

---

#### **2. Class Reminders**

**Trigger:** 24 hours before scheduled class
**Channel:** Email + WhatsApp
**Timing:** Daily cron at 12 PM (checks next day's classes)

**Email Template:** `class_reminder`

**Contains:**
- Class date, time, timezone
- Instructor name
- Location or Zoom link
- What to bring
- Cancellation policy

**WhatsApp Template:** `yogique_next_class_alerts`

**Variables:**
- Customer name
- Class type
- Date & time
- Location/Zoom link

**Example WhatsApp:**
```
Namaste Sarah! 🧘‍♀️

Reminder: You have class tomorrow!

Class: Vinyasa Flow
Date: Feb 3, 2026
Time: 7:00 AM IST
Instructor: Anjali Mehta
Location: Studio A

See you on the mat! 🙏
```

**For Virtual Classes:**
- **1 hour before class:** Zoom link sent via email
- WhatsApp template: `class_reminder_zoom`
- Contains: Meeting ID, Password, Join URL

---

#### **3. Invoice Notifications**

**Trigger:** Invoice generated (manual or T-5)
**Channel:** Email
**Timing:** Immediate when invoice created

**Email Template:** `invoice_generated`

**Contains:**
- Invoice number (e.g., YG-202602-0042)
- Billing period
- Amount breakdown (base + tax)
- Due date
- Payment link (Razorpay)
- PDF attachment

**Example:**
```
Subject: Invoice YG-202602-0042 for February 2026

Dear Sarah,

Your invoice for February 2026 is ready.

Invoice Details:
- Invoice Number: YG-202602-0042
- Billing Period: Feb 1 - Feb 28, 2026
- Base Amount: ₹2,542.37
- GST (18%): ₹457.63
- Total Amount: ₹3,000.00
- Due Date: Mar 5, 2026

Pay Now: [Razorpay Payment Link]

Invoice PDF is attached.

Thank you!
Yogique Team
```

---

#### **4. Payment Reminders**

**Schedule:**
- **T-3:** 3 days before due date
- **T-1:** 1 day before due date
- **T+0:** On due date
- **T+3:** 3 days after due date (grace period)
- **T+7:** 7 days overdue (final warning)

**Channel:** Email + WhatsApp
**Timing:** Daily cron at 1 AM UTC

**Email Templates:**
- T-3: `payment_reminder` (friendly)
- T-1: `payment_due_tomorrow` (urgent)
- T+3: `payment_overdue` (warning)
- T+7: `access_suspension` (final)

**WhatsApp Templates:**
- `yogique_payment_due_reminder` (T-3, T-1)
- `payment_overdue_reminder` (T+3, T+7)

**Example T-3 Email:**
```
Subject: ⏰ Payment Reminder - Invoice YG-202602-0042

Dear Sarah,

This is a friendly reminder that your invoice YG-202602-0042 is due in 3 days.

Amount Due: ₹3,000.00
Due Date: Mar 5, 2026

Pay Now: [Payment Link]

If you've already paid, please disregard this message.

Thank you!
```

**Example T+7 WhatsApp:**
```
🔔 Important: Payment Overdue

Dear Sarah,

Your payment for Invoice YG-202602-0042 is now 7 days overdue.

Amount: ₹3,000.00
Due Date: Mar 5, 2026 (passed)

⚠️ Your access will be suspended if payment is not received within 24 hours.

Pay Now: [Link]

Questions? Reply to this message.
```

---

#### **5. Payment Success Confirmation**

**Trigger:** Razorpay payment webhook (successful payment)
**Channel:** Email + WhatsApp
**Timing:** Immediate (real-time)

**Email Template:** `payment_success`

**Contains:**
- Payment amount
- Transaction ID
- Invoice number
- Payment method
- Receipt PDF

**WhatsApp Template:** `yogique_payment_success`

**Variables:**
- Customer name
- Amount
- Plan name
- Transaction ID

**Example WhatsApp:**
```
🎉 Payment Received Successfully!

Dear Sarah,

Amount: ₹3,000.00
Plan: Pravaha - Monthly
Transaction ID: pay_ABC123XYZ
Date: Mar 2, 2026

A detailed invoice has been sent to your email.

Thank you for choosing Yogique! 🙏
```

---

#### **6. Access Status Notifications**

**Access Status Flow:**
```
active → overdue_grace (T+3) → overdue_locked (T+7)
```

**When Status Changes:**

**T+3: Grace Period**
- Email: "Payment overdue, grace period active"
- Can still book classes
- Warning: Access will be suspended soon

**T+7: Access Locked**
- Email: "Access suspended - payment required"
- Cannot book new classes
- Existing classes still visible but marked as "Payment Required"
- All actions blocked until payment

**Payment Received (Restoration):**
- Email: "Access restored - thank you for your payment"
- Status changes: `overdue_locked → active`
- Can book classes again immediately

---

### **Notification Queue System**

**Table:** `notifications_queue`

**Fields:**
- `channel`: email | whatsapp | sms
- `recipient`: Email address or phone number
- `subject`: Email subject line
- `html`: Email body HTML
- `metadata`: JSON with booking/invoice details
- `status`: pending | sent | failed | skipped
- `attempts`: Retry count (max 3)
- `run_after`: Schedule for future sending
- `created_at`, `updated_at`

**Processing:**
- Edge function: `process-notifications-queue`
- Runs every 5 minutes
- Picks up `status = 'pending'` and `run_after <= NOW()`
- Sends via appropriate channel
- Updates status to `sent` or `failed`
- Retries failed notifications (max 3 attempts)

**Monitoring:**
- Admin can view queue status in [/dashboard/message-monitor](/dashboard/message-monitor)
- See pending, sent, failed notifications
- Retry failed notifications manually

---

## 🗺️ Navigation Guide

### **Public-Facing URLs**

| Page | URL | Purpose | Auth Required |
|------|-----|---------|--------------|
| Homepage | `/` | Landing page | No |
| Schedule | `/schedule` | View weekly classes | No |
| Book Individual | `/book/individual` | Individual booking | Yes |
| Book Private Group | `/book/private-group` | Private group booking | Yes |
| Book Corporate | `/book/corporate` | Corporate booking | Yes |
| Instructor Profile | `/instructor/:id` | View instructor details | No |
| Learning Center | `/learning` | Articles & resources | No |
| User Profile | `/profile` | User account settings | Yes |
| Payment Success | `/payment/success` | Payment confirmation | Yes |
| Payment Failed | `/payment/failed` | Payment error | Yes |

### **Admin Dashboard URLs**

**Base:** `/dashboard`

| Module | URL | Purpose | Role Required |
|--------|-----|---------|--------------|
| Overview | `/dashboard` | Dashboard home | Admin/Instructor |
| Bookings | `/dashboard/booking-management` | Manage bookings | Admin |
| Class Assignments | `/dashboard/class-assignments` | Schedule classes | Admin |
| Invoices | `/dashboard/invoice-management` | View/generate invoices | Admin |
| Transactions | `/dashboard/transaction-management` | Record payments | Admin |
| Payment Links | `/dashboard/payment-links` | Monitor payments | Admin |
| Users | `/dashboard/user-management` | Manage users | Admin |
| Instructors | `/dashboard/instructor-rates` | Manage instructors | Admin |
| Class Types | `/dashboard/class-types` | Manage class catalog | Admin |
| Packages | `/dashboard/packages` | Manage packages | Admin |
| Business Settings | `/dashboard/business-settings` | Configure company | Admin |
| Audit Logs | `/dashboard/audit-logs` | System logs | Admin |
| Message Monitor | `/dashboard/message-monitor` | Notification queue | Admin |

### **Authentication Flow**

```
User visits protected page (e.g., /book/individual)
  ↓
Not logged in?
  ↓
Redirect to Supabase Auth UI
  ├─ Sign in with Email/Password
  ├─ Sign in with Google
  └─ Sign in with Phone (OTP)
  ↓
After login: Redirect back to original page
  ↓
Form state restored from localStorage (if existed)
```

---

## 🏗️ Container Architecture

### **What is a Container?**

A **container** is a logical grouping mechanism that links multiple students to the same set of classes.

**Think of it as:**
- A classroom that multiple students attend
- A section or batch
- A monthly billing group

### **Container Properties**

| Property | Description | Example |
|----------|-------------|---------|
| `id` | Unique identifier | `uuid` |
| `container_code` | Human-readable code | `YOG-20260108-0042-2026-02` |
| `display_name` | Friendly name | `Sarah Kumar (Feb 2026)` |
| `container_type` | Type of container | `individual` |
| `instructor_id` | Assigned instructor | `uuid` |
| `package_id` | Linked package | `uuid` |
| `max_booking_count` | Capacity | `1` (for individual), `30` (for groups) |
| `current_booking_count` | Current enrollment | `0` → `1` → `13` etc. |

### **Container Types**

| Type | Capacity | Editable | Use Case |
|------|----------|----------|----------|
| `individual` | 1 (locked) | ❌ No | 1:1 private classes |
| `public_group` | 1-50 | ✅ Yes | Open enrollment classes |
| `private_group` | 1-30 | ✅ Yes | Closed group classes |
| `crash_course` | 1-50 | ✅ Yes | Fixed duration programs |

### **Container Code Patterns**

**Individual:**
```
{bookingId}-{YYYY-MM}
Example: YOG-20260108-0042-2026-02
```

**Groups:**
```
{instructorId}-{packageId}-{YYYY-MM}
Example: a1b2c3d4-e5f6g7h8-2026-02
```

**Why Different?**
- Individual: One booking = one container (bookingId is unique)
- Groups: Multiple bookings share one container (need stable identifier)

### **Container Lifecycle**

```
1. Container Created
   ├─ Admin creates assignment OR
   └─ T-5 automation creates container

2. Bookings Linked
   ├─ Manual: Admin links bookings
   └─ Automatic: System links during T-5

3. Classes Generated
   ├─ All classes reference container_id
   └─ Students see shared schedule

4. Capacity Management
   ├─ System tracks current vs max
   └─ Prevents overbooking

5. Container Reused (Next Month)
   ├─ Same bookingId/instructor+package
   └─ New month = new container
```

### **Container Reuse Logic**

**Month 1:**
- Container created: `YOG-20260108-0042-2026-02`
- Sarah's 8 classes for February

**Month 2:**
- T-5 checks: Does container `YOG-20260108-0042-2026-03` exist?
- Not found → Creates new container
- Links Sarah's booking
- Generates March classes

**Month 3+:**
- Same pattern repeats
- Each month gets fresh container
- Container codes predictable and deterministic

---

## 📊 Summary Table

### Booking Types Comparison

| Feature | Individual | Private Group | Public Group | Corporate | Crash Course |
|---------|-----------|--------------|--------------|-----------|--------------|
| **Booking Type** | `individual` | `private_group` | `public_group` | `corporate` | Any |
| **Container Type** | `individual` | `private_group` | `public_group` | `private_group` | `crash_course` |
| **Capacity** | 1 (fixed) | 1-30 (editable) | 1-50 (editable) | 10-50 (editable) | 1-50 (editable) |
| **Billing** | Individual | Individual or bulk | Individual | Bulk to company | Upfront |
| **T-5 Automation** | ✅ If recurring | ✅ If recurring | ✅ If recurring | ✅ If recurring | ❌ No (one-time) |
| **Public Schedule** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Use Case** | 1:1 private | Friends/family | Open classes | Employee wellness | Workshops |

### Admin Action Matrix

| Action | Individual | Private Group | Public Group | Corporate | Crash Course |
|--------|-----------|--------------|--------------|-----------|--------------|
| **Create Container** | Auto | Manual | Manual | Manual | Manual |
| **Link Bookings** | Auto | Manual | Auto | Manual | Manual |
| **Set Capacity** | N/A (locked at 1) | Yes | Yes | Yes | Yes |
| **Generate Invoices** | Manual first, then T-5 | Manual first, then T-5 | Manual first, then T-5 | Manual or bulk | Immediate |
| **Schedule Classes** | Adhoc then T-5 | Weekly or T-5 | Weekly or T-5 | Weekly or T-5 | Manual calendar |

---

## 🎓 Next Steps

### For Users:
1. **Book a class:** Start at [/book/individual](/book/individual)
2. **View schedule:** Browse classes at [/schedule](/schedule)
3. **Manage account:** Update details at [/profile](/profile)

### For Admins:
1. **Review guide:** Read this document thoroughly
2. **Practice workflows:** Try creating each booking type in staging
3. **Monitor notifications:** Check [/dashboard/message-monitor](/dashboard/message-monitor)
4. **Set up automation:** Enable T-5 for recurring bookings

### For Developers:
1. **Notification templates:** Review WhatsApp templates in `wa_templates.json`
2. **Container logic:** Study [INVOICE_GENERATION_WORKFLOW.md](./INVOICE_GENERATION_WORKFLOW.md)
3. **T-5 automation:** See [T5_DEPLOYMENT_GUIDE.md](./T5_DEPLOYMENT_GUIDE.md)

---

## 📚 Related Documentation

- [INVOICE_GENERATION_WORKFLOW.md](./INVOICE_GENERATION_WORKFLOW.md) - Invoice & T-5 automation
- [T5_DEPLOYMENT_GUIDE.md](./T5_DEPLOYMENT_GUIDE.md) - Deployment steps
- [CONTAINER_INDEX.md](./CONTAINER_INDEX.md) - Container architecture details
- [QUICK_REFERENCE_CARD.md](./QUICK_REFERENCE_CARD.md) - Quick reference for containers

---

**Last Updated:** January 8, 2026  
**Version:** 1.0  
**Status:** ✅ Complete
