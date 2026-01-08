import { supabase } from '../../../../../../shared/lib/supabase';
import { getShortfallWithRecommendations } from './adjustmentClassService';
import { checkAdhocConflicts, extractDatesFromAssignments, validateAdhocClass, validateCrashCourseAssignment } from './crashCourseAdhocService';
import { createFirstMonthInvoice, getPackageMonthlyPrice, setBillingCycleAnchor } from './monthlyInvoiceService';
import { getCalendarMonthBoundaries, validateAllDatesWithinMonth } from './monthlySchedulingService';
// Helper function to validate UUID format
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
// Helper function to validate date is actually valid (not just format)
const isValidDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString))
        return false;
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date instanceof Date && !isNaN(date.getTime()) &&
        date.toISOString().split('T')[0] === dateString;
};
// Helper function to validate time format
const isValidTime = (timeString) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(timeString);
};
// Parse date string "YYYY-MM-DD" to a Date at UTC midnight (avoids timezone shifts)
const parseDateToUTC = (dateString) => {
    const parts = dateString.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
};
// Format a Date to IST "YYYY-MM-DD" (for display / DB in IST)
const formatDateIST = (date) => {
    // IST is UTC+5:30 => 5.5 hours in milliseconds
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(date.getTime() + istOffsetMs);
    return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
};
// Helper function to validate booking exists in database
const validateBookingExists = async (bookingId) => {
    if (!bookingId || bookingId.trim() === '' || bookingId.trim() === 'null' || bookingId.trim() === 'undefined') {
        return true; // No booking to validate
    }
    try {
        console.log('Validating booking ID:', bookingId.trim());
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('booking_id')
            .eq('booking_id', bookingId.trim())
            .limit(1);
        if (bookingError) {
            console.error('Booking validation failed:', {
                bookingId: bookingId.trim(),
                error: bookingError,
                data: bookings
            });
            return false;
        }
        if (!bookings || bookings.length === 0) {
            console.error('Booking validation failed - no booking found:', {
                bookingId: bookingId.trim(),
                data: bookings
            });
            return false;
        }
        console.log('Booking validation successful for ID:', bookingId.trim());
        return true;
    }
    catch (error) {
        console.error('Exception during booking validation:', error);
        return false;
    }
};
// Helper function to validate booking IDs based on assignment type
const validateBookingsForAssignmentType = async (bookingIds, assignmentType, bookingType) => {
    if (!bookingIds || bookingIds.length === 0) {
        return; // No bookings to validate
    }
    // Filter out empty/null booking IDs for validation count
    const validBookingIds = bookingIds.filter(id => id && id.trim() !== '' && id.trim() !== 'null' && id.trim() !== 'undefined');
    // Validate booking count based on assignment type and booking type
    const shouldAllowMultiple = shouldAllowMultipleBookings(assignmentType, bookingType);
    if (!shouldAllowMultiple && validBookingIds.length > 1) {
        throw new Error(`Individual and private group classes can only have one booking. You have selected ${validBookingIds.length} bookings.`);
    }
    // Validate each booking exists
    for (const bookingId of validBookingIds) {
        console.log('VALIDATION DEBUG - About to validate booking_id:', bookingId);
        const bookingExists = await validateBookingExists(bookingId);
        console.log('VALIDATION DEBUG - Booking validation result:', bookingExists);
        if (!bookingExists) {
            console.error('Invalid booking_id found - booking does not exist in database:', bookingId);
            throw new Error(`Selected booking "${bookingId}" is invalid or has been deleted. Please select a different booking or remove the booking selection.`);
        }
        console.log('VALIDATION DEBUG - Booking validation passed for:', bookingId);
    }
};
// Helper function to determine if assignment type allows multiple bookings
const shouldAllowMultipleBookings = (assignmentType, bookingType) => {
    // Individual booking type: single booking only regardless of assignment type
    if (bookingType === 'individual') {
        return false;
    }
    // Private group classes: single booking only (for adhoc assignments)
    if (assignmentType === 'adhoc' && bookingType === 'private_group') {
        return false;
    }
    // All other cases: multiple bookings allowed
    // - Weekly classes (public_group)
    // - Corporate bookings
    // - Monthly packages (corporate, private_group, public_group)
    // - Crash courses (corporate, private_group, public_group)
    return true;
};
// Helper function to create assignment-booking associations with error handling
export const createAssignmentBookings = async (assignmentId, bookingIds) => {
    if (!assignmentId || !isValidUUID(assignmentId)) {
        throw new Error('Invalid assignment ID for booking association');
    }
    if (!bookingIds || bookingIds.length === 0) {
        return; // No bookings to associate
    }
    const associations = bookingIds
        .filter(id => id && id.trim() !== '' && id.trim() !== 'null' && id.trim() !== 'undefined')
        .map(bookingId => ({
        assignment_id: assignmentId,
        booking_id: bookingId.trim()
    }));
    if (associations.length > 0) {
        const { error } = await supabase
            .from('assignment_bookings')
            .insert(associations);
        if (error) {
            console.error('Failed to create assignment-booking associations:', error);
            throw new Error(`Failed to link bookings to assignment: ${error.message}`);
        }
        console.log(`Successfully created ${associations.length} assignment-booking associations`);
    }
};
// Helper function to clean assignment data - removes empty UUID fields that would cause 22P02 errors
const cleanAssignmentData = async (data) => {
    const cleaned = { ...data };
    // List of ALL UUID fields that could be empty (removed booking_id since we use junction table now)
    const uuidFields = ['class_type_id', 'package_id', 'instructor_id', 'assigned_by'];
    // Remove booking-related fields (now handled via junction table)
    delete cleaned.booking_id;
    delete cleaned.client_name;
    delete cleaned.client_email;
    uuidFields.forEach(field => {
        const value = cleaned[field];
        const isEmpty = value === '' || value === null || value === undefined ||
            value === 'null' || value === 'undefined' ||
            (typeof value === 'string' && value.trim() === '');
        if (isEmpty) {
            if (field === 'class_type_id') {
                // class_type_id is only required for adhoc assignments
                // For package-based assignments, it can be null/empty
                delete cleaned[field];
            }
            else if (field === 'package_id') {
                // package_id is only required for package-based assignments
                // For adhoc assignments, it can be null/empty
                delete cleaned[field];
            }
            else if (field === 'instructor_id') {
                throw new Error('Please select an instructor before creating the assignment');
            }
            else if (field === 'assigned_by') {
                throw new Error('Authentication error - please log out and log in again');
            }
            else {
                delete cleaned[field];
            }
        }
        else if (typeof value === 'string' && value.trim() !== '' && !isValidUUID(value.trim())) {
            throw new Error(`Invalid ${field.replace('_', ' ')} format. Please refresh the page and try again.`);
        }
    });
    // Remove fields not present in the DB schema to avoid client-side schema cache errors
    if ('calendar_month' in cleaned)
        delete cleaned.calendar_month;
    if ('is_adjustment' in cleaned)
        delete cleaned.is_adjustment;
    console.log('Original data:', JSON.stringify(data, null, 2));
    console.log('Cleaned data:', JSON.stringify(cleaned, null, 2));
    return cleaned;
};
// Helper function to clean multiple assignments with booking validation
const cleanAssignmentsBatch = async (assignments, bookingIds = [], assignmentType = '', bookingType = '') => {
    if (!assignments || assignments.length === 0)
        return [];
    // Validate all booking IDs once with assignment type rules
    await validateBookingsForAssignmentType(bookingIds, assignmentType, bookingType);
    // Clean all assignments (booking fields will be removed since we use junction table)
    return await Promise.all(assignments.map(assignment => cleanAssignmentData(assignment)));
};
// Helper function to get current user ID - requires authentication
const getCurrentUserId = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Auth error getting current user:', error);
            throw new Error('Authentication failed. Please log in to create assignments.');
        }
        if (!user || !user.id) {
            console.error('No authenticated user found');
            throw new Error('You must be logged in to create assignments. Please log in and try again.');
        }
        // Check if user.id is a valid UUID (not empty string)
        if (typeof user.id !== 'string' || user.id.trim() === '' || !isValidUUID(user.id)) {
            console.error('Invalid user ID:', user.id);
            throw new Error('Invalid authentication state. Please log out and log in again.');
        }
        console.log('Current user ID:', user.id);
        return user.id;
    }
    catch (error) {
        if (error instanceof Error && error.message && error.message.includes('log in')) {
            throw error; // Re-throw authentication errors as-is
        }
        console.error('Failed to get current user:', error);
        throw new Error('Authentication failed. Please log in to create assignments.');
    }
};
/**
 * Rate helpers to read/write instructor_rates as per rules:
 * - For all types except "package" (custom), try to pull rate from instructor_rates.
 * - If not available and user enters an amount, insert a new row (do NOT update if one exists).
 */
const getScheduleTypeForRate = (assignmentType) => {
    switch (assignmentType) {
        case 'adhoc':
        case 'weekly':
        case 'monthly':
            return assignmentType;
        case 'crash_course':
            return 'crash'; // Fixed: return 'crash' to match database constraint
        case 'package':
            return undefined; // custom: skip
        default:
            return assignmentType;
    }
};
const findExistingRate = async ({ scheduleType, category, classTypeId, packageId }) => {
    console.log('🔍 NEW findExistingRate function called:', { scheduleType, category, classTypeId, packageId });
    const today = new Date().toISOString().split('T')[0];
    // Helper function to find rates without using .or()
    const findRateWithFilters = async (additionalFilters) => {
        // First, try to find rates with no expiration date (effective_until is null)
        const { data: permanentRates } = await supabase
            .from('instructor_rates')
            .select('*')
            .eq('schedule_type', scheduleType)
            .eq('category', category)
            .eq('is_active', true)
            .lte('effective_from', today)
            .is('effective_until', null)
            .match(additionalFilters)
            .order('created_at', { ascending: false })
            .limit(1);
        if (permanentRates && permanentRates.length > 0) {
            return permanentRates[0];
        }
        // Second, try to find rates that haven't expired yet
        const { data: activeRates } = await supabase
            .from('instructor_rates')
            .select('*')
            .eq('schedule_type', scheduleType)
            .eq('category', category)
            .eq('is_active', true)
            .lte('effective_from', today)
            .gte('effective_until', today)
            .match(additionalFilters)
            .order('created_at', { ascending: false })
            .limit(1);
        return activeRates && activeRates.length > 0 ? activeRates[0] : null;
    };
    try {
        // 1. Look for a class-type-specific rate
        if (classTypeId && isValidUUID(classTypeId)) {
            const rate = await findRateWithFilters({
                class_type_id: classTypeId,
                package_id: null
            });
            if (rate)
                return rate;
        }
        // 2. Look for a package-specific rate
        if (packageId && isValidUUID(packageId)) {
            const rate = await findRateWithFilters({
                package_id: packageId,
                class_type_id: null
            });
            if (rate)
                return rate;
        }
        // 3. Look for a generic rate
        const rate = await findRateWithFilters({
            class_type_id: null,
            package_id: null
        });
        return rate;
    }
    catch (error) {
        console.error('Error finding existing rate:', error);
        return null;
    }
};
const ensureInstructorRateIfMissing = async (assignmentType, category, amount, classTypeId, packageId) => {
    const scheduleType = getScheduleTypeForRate(assignmentType);
    if (!scheduleType)
        return; // skip custom package type
    if (!amount || amount <= 0)
        return;
    try {
        const existing = await findExistingRate({ scheduleType, category, classTypeId, packageId });
        if (existing)
            return; // do not update existing as per requirement
        const created_by = await getCurrentUserId();
        const payload = {
            schedule_type: scheduleType,
            category,
            rate_amount: amount,
            created_by,
            is_active: true,
            effective_from: new Date().toISOString().split('T')[0]
        };
        if (classTypeId && isValidUUID(classTypeId))
            payload.class_type_id = classTypeId;
        if (packageId && isValidUUID(packageId))
            payload.package_id = packageId;
        const { error } = await supabase.from('instructor_rates').insert([payload]);
        // Ignore unique violation if concurrent insert happened, but throw for other errors
        if (error && error.code !== '23505') {
            console.error('Failed to insert instructor rate:', error);
            throw new Error(`Could not create instructor rate: ${error.message}`);
        }
        else if (!error) {
            console.log('Successfully created instructor rate for', scheduleType, category);
        }
    }
    catch (error) {
        console.warn('Exception in ensureInstructorRateIfMissing:', error);
        // Don't throw - this is not critical to assignment creation
    }
};
// Helper function to get fallback scheduled class ID with proper error handling
const getFallbackScheduledClassId = async () => {
    try {
        const { data: schedules, error } = await supabase
            .from('class_schedules')
            .select('id')
            .eq('is_active', true)
            .limit(1);
        if (error) {
            console.warn('Failed to fetch fallback scheduled class ID:', error);
            return null;
        }
        if (!schedules || schedules.length === 0) {
            console.warn('No active class schedules found for fallback');
            return null;
        }
        return schedules[0].id;
    }
    catch (error) {
        console.warn('Exception getting fallback scheduled class ID:', error);
        return null;
    }
};
/**
 * Check booking access status to determine if new scheduling is allowed
 * Returns: { allowed: boolean, reason?: string, status: string }
 */
const checkBookingAccessStatus = async (bookingIds) => {
    if (!bookingIds || bookingIds.length === 0) {
        return { allowed: false, reason: 'No booking provided', status: 'none' };
    }
    // Filter valid booking IDs
    const validBookingIds = bookingIds.filter(id => id && id.trim() !== '' && id.trim() !== 'null' && id.trim() !== 'undefined');
    if (validBookingIds.length === 0) {
        return { allowed: false, reason: 'No valid booking provided', status: 'none' };
    }
    try {
        // Check all bookings' access status
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('booking_id, access_status, status')
            .in('booking_id', validBookingIds);
        if (error) {
            console.error('Error checking booking access status:', error);
            throw new Error(`Failed to verify booking status: ${error.message}`);
        }
        if (!bookings || bookings.length === 0) {
            return { allowed: false, reason: 'Booking not found in database', status: 'not_found' };
        }
        // Check if any booking is locked
        const lockedBooking = bookings.find(b => b.access_status === 'overdue_locked');
        if (lockedBooking) {
            return {
                allowed: false,
                reason: 'Payment is overdue. Please clear outstanding dues before scheduling new classes.',
                status: 'overdue_locked'
            };
        }
        // Check if any booking is in grace period
        const graceBooking = bookings.find(b => b.access_status === 'overdue_grace');
        if (graceBooking) {
            return {
                allowed: true, // Allow but with warning
                reason: 'Warning: Payment is approaching overdue. Please settle dues soon to avoid service interruption.',
                status: 'overdue_grace'
            };
        }
        // All bookings are active
        return { allowed: true, status: 'active' };
    }
    catch (error) {
        console.error('Exception checking booking access status:', error);
        throw error;
    }
};
export class AssignmentCreationService {
    /**
     * Update the status of an assignment (class) by assignment ID.
     * @param assignmentId - The ID of the assignment to update.
     * @param status - The new status ('completed', 'canceled', 'rescheduled', etc).
     */
    static async updateAssignmentStatus(assignmentId, status) {
        if (!assignmentId || !isValidUUID(assignmentId)) {
            throw new Error('Invalid assignment ID format');
        }
        if (!status || status.trim() === '') {
            throw new Error('Status is required');
        }
        try {
            const { error } = await supabase
                .from('class_assignments')
                .update({ class_status: status.trim() })
                .eq('id', assignmentId);
            if (error) {
                console.error('Failed to update assignment status:', error);
                throw new Error(`Failed to update class status: ${error.message}`);
            }
            console.log(`Successfully updated assignment ${assignmentId} status to ${status}`);
        }
        catch (error) {
            console.error('Exception updating assignment status:', error);
            throw error;
        }
    }
    static async createAssignment(formData, packages, studentCount) {
        // ⚡ PHASE 2: MANDATORY BOOKING ENFORCEMENT
        // Validate that booking is provided - ALL assignments require a booking
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const validBookingIds = bookingIds.filter(id => id && id.trim() !== '' && id.trim() !== 'null' && id.trim() !== 'undefined');
        if (validBookingIds.length === 0) {
            throw new Error('⚠️ BOOKING REQUIRED: All class assignments must be linked to a booking. Please select an existing booking or create a Quick Booking first.');
        }
        // ⚡ PHASE 2: ACCESS STATUS CHECK
        // Check booking access status before allowing scheduling
        const accessCheck = await checkBookingAccessStatus(validBookingIds);
        if (!accessCheck.allowed) {
            throw new Error(`🚫 SCHEDULING BLOCKED: ${accessCheck.reason}`);
        }
        // Log warning if in grace period
        if (accessCheck.status === 'overdue_grace') {
            console.warn('⚠️ GRACE PERIOD WARNING:', accessCheck.reason);
        }
        // Validate student count
        const validatedStudentCount = studentCount && studentCount > 0 ? studentCount : 1;
        switch (formData.assignment_type) {
            case 'adhoc':
                return this.createAdhocAssignment(formData, validatedStudentCount);
            case 'weekly':
                return this.createWeeklyAssignment(formData, validatedStudentCount);
            case 'monthly':
                return this.createMonthlyAssignment(formData, validatedStudentCount);
            case 'crash_course':
                return this.createCrashCourseAssignment(formData, packages, validatedStudentCount);
            case 'package':
                return this.createPackageAssignment(formData, packages, validatedStudentCount);
            default:
                throw new Error(`Unknown assignment type: ${formData.assignment_type}`);
        }
    }
    static async createAdhocAssignment(formData, studentCount) {
        const currentUserId = await getCurrentUserId();
        // ⚡ PHASE 2: Validate booking is present for adhoc
        const adhocBookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const validBookingIds = adhocBookingIds.filter(id => id && id.trim() !== '' && id.trim() !== 'null' && id.trim() !== 'undefined');
        // 🆕 PHASE 6: Comprehensive adhoc validation
        const adhocValidation = validateAdhocClass({
            date: formData.date,
            classTypeId: formData.class_type_id,
            bookingIds: validBookingIds,
            instructorId: formData.instructor_id
        });
        if (!adhocValidation.valid) {
            throw new Error(adhocValidation.errors.join('\n'));
        }
        // 🆕 PHASE 6: Check for scheduling conflicts
        const conflictCheck = await checkAdhocConflicts(formData.instructor_id, formData.date, formData.start_time, formData.end_time);
        if (conflictCheck.hasConflict) {
            console.warn('⚠️ Adhoc scheduling conflict detected:', conflictCheck.conflictDetails);
            // Warning only - allow override for admin
        }
        // Validate required fields
        if (!formData.class_type_id || formData.class_type_id.trim() === '') {
            throw new Error('Class type is required');
        }
        if (!formData.instructor_id || formData.instructor_id.trim() === '') {
            throw new Error('Instructor is required');
        }
        // Validate UUID formats  
        if (!isValidUUID(formData.class_type_id.trim())) {
            throw new Error('Invalid class type selected. Please refresh the page and try again.');
        }
        if (!isValidUUID(formData.instructor_id.trim())) {
            throw new Error('Invalid instructor selected. Please refresh the page and try again.');
        }
        // Validate date and time
        if (!formData.date || formData.date.trim() === '') {
            throw new Error('Date is required');
        }
        if (!formData.start_time || formData.start_time.trim() === '') {
            throw new Error('Start time is required');
        }
        if (!formData.end_time || formData.end_time.trim() === '') {
            throw new Error('End time is required');
        }
        // Validate date format and validity
        if (!isValidDate(formData.date)) {
            throw new Error('Please enter a valid date in YYYY-MM-DD format');
        }
        // Validate time format
        if (!isValidTime(formData.start_time)) {
            throw new Error('Start time must be in HH:MM format');
        }
        if (!isValidTime(formData.end_time)) {
            throw new Error('End time must be in HH:MM format');
        }
        // Validate payment amount is a valid number
        if (isNaN(formData.payment_amount) || formData.payment_amount < 0) {
            throw new Error('Payment amount must be a valid positive number');
        }
        // Validate date is not in the past (use UTC to avoid local timezone shifting date)
        const classDate = parseDateToUTC(formData.date);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (classDate < today) {
            throw new Error('Class date cannot be in the past');
        }
        // Validate time logic
        const startTime = formData.start_time + ':00';
        const endTime = formData.end_time + ':00';
        if (startTime >= endTime) {
            throw new Error('End time must be after start time');
        }
        // Ensure baseline instructor rate exists when missing (non-custom)
        await ensureInstructorRateIfMissing('adhoc', formData.booking_type || 'individual', formData.payment_amount, formData.class_type_id, undefined);
        // Calculate payment amount using centralized logic
        const paymentAmount = this.calculatePaymentAmount(formData, 'adhoc', 1, studentCount);
        // Get fallback scheduled class ID
        const scheduledClassId = await getFallbackScheduledClassId();
        // Create assignment data with required fields only, add others conditionally
        const assignmentData = {
            class_type_id: formData.class_type_id.trim(),
            date: formData.date.trim(),
            start_time: formData.start_time.trim(),
            end_time: formData.end_time.trim(),
            instructor_id: formData.instructor_id.trim(),
            payment_amount: paymentAmount,
            payment_type: formData.payment_type,
            schedule_type: 'adhoc',
            assigned_by: currentUserId.trim(),
            booking_type: formData.booking_type || 'individual',
            scheduled_class_id: scheduledClassId,
            class_package_id: null,
            class_status: 'scheduled',
            payment_status: 'pending',
            instructor_status: 'pending'
        };
        // Add optional fields only if they have valid non-empty values
        if (formData.notes && formData.notes.trim() !== '') {
            assignmentData.notes = formData.notes.trim();
        }
        // Clean the assignment data to remove empty UUID fields
        const cleanedAssignmentData = await cleanAssignmentData(assignmentData);
        console.log('Assignment data being inserted:', JSON.stringify(cleanedAssignmentData, null, 2));
        // Use transaction for assignment creation and booking association
        const { data: insertedAssignment, error } = await supabase
            .from('class_assignments')
            .insert([cleanedAssignmentData])
            .select('id')
            .single();
        if (error) {
            console.error('Supabase insert error:', {
                error,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw new Error(`Database error: ${error.message || 'Unknown error occurred while creating assignment'}`);
        }
        // Create booking associations using the new multiple booking system
        const assignmentBookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        // Determine and attach a class_container_id for this assignment based on first linked booking + month
        let resolvedContainerId = null;
        if (assignmentBookingIds.length > 0) {
            const firstBookingId = assignmentBookingIds[0];
            try {
                const billingMonth = (formData.date && formData.date.length >= 7) ? formData.date.slice(0, 7) : new Date().toISOString().slice(0, 7);
                const containerCode = `T5-${firstBookingId}-${billingMonth}`;
                // Try to find existing container
                const { data: existingContainer, error: existingErr } = await supabase
                    .from('class_containers')
                    .select('id')
                    .eq('container_code', containerCode)
                    .limit(1)
                    .single();
                if (existingErr) {
                    // not fatal - we'll attempt to create below
                    console.warn('Error checking existing container:', existingErr);
                }
                if (existingContainer && existingContainer.id) {
                    resolvedContainerId = existingContainer.id;
                }
                else {
                    // Create a minimal container record (non-destructive)
                    const displayName = `${(formData.client_name && formData.client_name.trim() !== '') ? formData.client_name : firstBookingId} (${billingMonth})`;
                    const { data: newContainer, error: createErr } = await supabase
                        .from('class_containers')
                        .insert([{
                            container_code: containerCode,
                            display_name: displayName,
                            container_type: 'individual',
                            instructor_id: (formData.instructor_id && formData.instructor_id.trim() !== '') ? formData.instructor_id : null,
                            package_id: (formData.package_id && formData.package_id.trim() !== '') ? formData.package_id : null,
                            max_booking_count: 1,
                            created_by: currentUserId,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }])
                        .select('id')
                        .single();
                    if (createErr) {
                        console.warn('Failed to create container for assignment:', createErr);
                    }
                    else if (newContainer && newContainer.id) {
                        resolvedContainerId = newContainer.id;
                    }
                }
            }
            catch (err) {
                console.warn('Container resolution error:', err);
            }
        }
        // Attach container id to assignment row if resolved
        if (resolvedContainerId) {
            try {
                await supabase
                    .from('class_assignments')
                    .update({ class_container_id: resolvedContainerId })
                    .eq('id', insertedAssignment.id);
            }
            catch (err) {
                console.warn('Failed to attach class_container_id to assignment:', err);
            }
        }
        if (assignmentBookingIds.length > 0) {
            try {
                await createAssignmentBookings(insertedAssignment.id, assignmentBookingIds);
                // Update booking status for all linked bookings if needed
                for (const bookingId of assignmentBookingIds) {
                    if (bookingId && bookingId.trim() !== '') {
                        await this.updateBookingStatus(bookingId, 'completed');
                    }
                }
                // Populate assignment_bookings.class_container_id for the created links
                if (resolvedContainerId) {
                    try {
                        await supabase
                            .from('assignment_bookings')
                            .update({ class_container_id: resolvedContainerId })
                            .eq('assignment_id', insertedAssignment.id);
                    }
                    catch (abErr) {
                        console.warn('Failed to update assignment_bookings with class_container_id:', abErr);
                    }
                }
            }
            catch (bookingError) {
                console.error('Failed to associate bookings, but assignment created:', bookingError);
                // Could optionally delete the assignment here if booking association is critical
            }
        }
        return { success: true, count: 1 };
    }
    static async createWeeklyAssignment(formData, studentCount) {
        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id) {
            return this.createWeeklyFromTemplate(formData, studentCount);
        }
        else {
            return this.createNewWeeklySchedule(formData, studentCount);
        }
    }
    static async createWeeklyFromTemplate(formData, studentCount) {
        // Get template details
        const { data: template, error: templateError } = await supabase
            .from('class_schedules')
            .select('*')
            .eq('id', formData.selected_template_id)
            .single();
        if (templateError) {
            throw new Error(`Failed to load selected template: ${templateError.message}`);
        }
        if (!template) {
            throw new Error('Selected template not found');
        }
        // Update the template with the assigned instructor
        const { error: updateError } = await supabase
            .from('class_schedules')
            .update({
            instructor_id: formData.instructor_id,
            notes: formData.notes
        })
            .eq('id', formData.selected_template_id);
        if (updateError) {
            throw new Error(`Failed to update template: ${updateError.message}`);
        }
        // Ensure baseline instructor rate exists for weekly (template)
        await ensureInstructorRateIfMissing('weekly', formData.booking_type || 'public_group', formData.payment_amount, template.class_type_id, undefined);
        // Create weekly assignments based on the template
        const assignments = await this.generateWeeklyAssignments(formData, template.day_of_week, template.start_time, template.end_time, template.class_type_id, studentCount, formData.selected_template_id);
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'weekly', formData.booking_type || 'public_group');
        const { error: insertError } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments);
        if (insertError) {
            throw new Error(`Failed to create weekly assignments: ${insertError.message}`);
        }
        // Update booking status if linked
        if (bookingIds.length > 0) {
            for (const bookingId of bookingIds) {
                if (bookingId && bookingId.trim() !== '') {
                    await this.updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        return { success: true, count: assignments.length };
    }
    static async createNewWeeklySchedule(formData, studentCount) {
        // Validate required fields for new schedule
        if (!formData.class_type_id || !isValidUUID(formData.class_type_id)) {
            throw new Error('Valid class type is required');
        }
        if (!formData.instructor_id || !isValidUUID(formData.instructor_id)) {
            throw new Error('Valid instructor is required');
        }
        if (typeof formData.day_of_week !== 'number' || formData.day_of_week < 0 || formData.day_of_week > 6) {
            throw new Error('Valid day of week is required');
        }
        // Create new weekly schedule template
        const scheduleData = {
            class_type_id: formData.class_type_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            instructor_id: formData.instructor_id,
            duration_minutes: formData.duration || 60, // Default duration
            max_participants: 10, // Default value
            is_active: true,
            notes: formData.notes
        };
        const { error: scheduleError } = await supabase
            .from('class_schedules')
            .insert([scheduleData]);
        if (scheduleError) {
            throw new Error(`Failed to create schedule template: ${scheduleError.message}`);
        }
        // Ensure baseline instructor rate exists for weekly (new schedule)
        await ensureInstructorRateIfMissing('weekly', formData.booking_type || 'public_group', formData.payment_amount, formData.class_type_id, undefined);
        // Generate weekly assignments
        const assignments = await this.generateWeeklyAssignments(formData, formData.day_of_week, formData.start_time, formData.end_time, formData.class_type_id, studentCount);
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'weekly', formData.booking_type || 'public_group');
        const { error: assignmentError } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments);
        if (assignmentError) {
            throw new Error(`Failed to create weekly assignments: ${assignmentError.message}`);
        }
        // Update booking status if linked
        if (bookingIds.length > 0) {
            for (const bookingId of bookingIds) {
                if (bookingId && bookingId.trim() !== '') {
                    await this.updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        return { success: true, count: assignments.length };
    }
    static async generateWeeklyAssignments(formData, dayOfWeek, startTime, endTime, classTypeId, studentCount, scheduledClassId) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        if (!formData.start_date || !isValidDate(formData.start_date)) {
            throw new Error('Valid start date is required');
        }
        const startDate = parseDateToUTC(formData.start_date);
        // Use end_date if provided and valid, otherwise default to end of current year
        let endDate;
        if (formData.end_date && isValidDate(formData.end_date)) {
            endDate = parseDateToUTC(formData.end_date);
        }
        else {
            endDate = parseDateToUTC(`${new Date().getFullYear()}-12-31`);
        }
        // Validate date range
        if (startDate >= endDate) {
            throw new Error('End date must be after start date');
        }
        // Find the first occurrence of the specified day (UTC-safe)
        const currentDate = new Date(startDate);
        while (currentDate.getUTCDay() !== dayOfWeek && currentDate <= endDate) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        if (currentDate > endDate) {
            throw new Error(`No occurrences of the selected day found between ${formData.start_date} and ${endDate.toISOString().split('T')[0]}`);
        }
        // Create assignments for each occurrence until end date
        while (currentDate <= endDate) {
            const assignment = {
                class_type_id: classTypeId,
                date: formatDateIST(currentDate),
                start_time: startTime,
                end_time: endTime,
                instructor_id: formData.instructor_id,
                payment_amount: this.calculatePaymentAmount(formData, 'weekly', undefined, studentCount),
                payment_type: formData.payment_type,
                schedule_type: 'weekly',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'public_group',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending',
                scheduled_class_id: scheduledClassId || null,
                class_package_id: null
            };
            // Add optional fields only if they have values
            if (formData.notes)
                assignment.notes = formData.notes;
            assignments.push(assignment);
            // Move to next week (UTC-safe)
            currentDate.setUTCDate(currentDate.getUTCDate() + 7);
        }
        return assignments;
    }
    static async createMonthlyAssignment(formData, studentCount) {
        const assignments = [];
        let perClassAmount;
        // Validate package ID for monthly assignments
        if (!formData.package_id || !isValidUUID(formData.package_id)) {
            throw new Error('Valid package selection is required for monthly assignments');
        }
        // Calculate per-class amount based on payment type
        perClassAmount = this.calculatePaymentAmount(formData, 'monthly', undefined, studentCount);
        // Ensure baseline instructor rate exists for monthly (package-based)
        await ensureInstructorRateIfMissing('monthly', formData.booking_type || 'individual', formData.payment_amount, undefined, formData.package_id);
        // 🆕 PHASE 3: Calendar Month Boundary Validation
        // Get calendar month boundaries from start_date
        const startDate = new Date(formData.start_date + 'T00:00:00.000Z');
        const monthBoundaries = getCalendarMonthBoundaries(startDate);
        const calendarMonth = monthBoundaries.monthKey;
        console.log('📅 Monthly Assignment - Calendar Month:', calendarMonth);
        console.log('📅 Month Boundaries:', {
            start: monthBoundaries.startDate.toISOString().split('T')[0],
            end: monthBoundaries.endDate.toISOString().split('T')[0],
            days: monthBoundaries.daysInMonth
        });
        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            assignments.push(...await this.generateWeeklyRecurrenceAssignments(formData, perClassAmount, calendarMonth));
        }
        else {
            assignments.push(...await this.generateManualCalendarAssignments(formData, perClassAmount, calendarMonth));
        }
        // 🆕 PHASE 3: Validate all dates are within same calendar month
        const assignmentDates = assignments.map(a => new Date(a.date + 'T00:00:00.000Z'));
        try {
            validateAllDatesWithinMonth(assignmentDates, calendarMonth);
            console.log('✅ All assignment dates validated within calendar month:', calendarMonth);
        }
        catch (error) {
            throw new Error(`Calendar Month Violation: ${error instanceof Error ? error.message : String(error)}\n\n` +
                `Monthly subscriptions must stay within calendar month boundaries (${monthBoundaries.startDate.toISOString().split('T')[0]} to ${monthBoundaries.endDate.toISOString().split('T')[0]}).`);
        }
        // Get booking IDs (support both new and old format)
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'monthly', formData.booking_type || 'individual');
        const { data: insertedAssignments, error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)
            .select('id');
        if (error) {
            throw new Error(`Failed to create monthly assignments: ${error.message}`);
        }
        // Create booking associations for all assignments using the new junction table system
        if (bookingIds.length > 0 && insertedAssignments) {
            try {
                for (const assignment of insertedAssignments) {
                    await createAssignmentBookings(assignment.id, bookingIds);
                }
                // Update booking status for all linked bookings
                for (const bookingId of bookingIds) {
                    if (bookingId && bookingId.trim() !== '') {
                        await this.updateBookingStatus(bookingId, 'completed');
                    }
                }
                // Mark linked bookings as recurring so invoice generator can pick them up
                try {
                    await this.markBookingsAsRecurring(bookingIds, formData.start_date, formData.package_id);
                }
                catch (recErr) {
                    console.warn('Failed to mark bookings as recurring:', recErr);
                }
                // 🆕 PHASE 4: Generate first month invoice automatically
                try {
                    await this.generateFirstMonthInvoices(bookingIds, formData.start_date, formData.package_id);
                }
                catch (invoiceErr) {
                    console.error('Failed to generate first month invoices:', invoiceErr);
                    // Don't fail the entire operation - invoice can be generated later
                }
            }
            catch (bookingError) {
                console.error('Failed to associate bookings with monthly assignments:', bookingError);
                // Assignments are created, but booking association failed
                throw new Error('Assignments created but failed to link bookings. Please contact support.');
            }
        }
        // 🆕 PHASE 5: Detect and warn about scheduling shortfalls
        try {
            await this.detectAndWarnShortfall(formData.instructor_id, calendarMonth, formData.total_classes || assignments.length, formData.weekly_days || []);
        }
        catch (shortfallErr) {
            console.warn('Shortfall detection failed:', shortfallErr);
            // Don't fail - this is informational only
        }
        return { success: true, count: assignments.length };
    }
    // Helper: mark bookings as recurring and set billing anchor
    static async markBookingsAsRecurring(bookingIds, billingAnchorDate, packageId) {
        if (!bookingIds || bookingIds.length === 0)
            return;
        const payload = { is_recurring: true };
        if (billingAnchorDate)
            payload.billing_cycle_anchor = billingAnchorDate;
        if (packageId)
            payload.class_package_id = packageId;
        // Update by booking_id (external code) rather than internal id
        for (const bookingCode of bookingIds) {
            if (!bookingCode || bookingCode.trim() === '')
                continue;
            try {
                const { error } = await supabase
                    .from('bookings')
                    .update(payload)
                    .eq('booking_id', bookingCode.trim());
                if (error) {
                    console.warn('Failed to update booking recurrence for', bookingCode, error);
                }
                else {
                    console.log('Marked booking as recurring:', bookingCode);
                }
            }
            catch (err) {
                console.warn('Exception while updating booking recurrence for', bookingCode, err);
            }
        }
    }
    // 🆕 PHASE 5: Detect scheduling shortfalls and log warnings/recommendations
    static async detectAndWarnShortfall(instructorId, calendarMonth, requiredClasses, preferredDays) {
        try {
            if (preferredDays.length === 0) {
                console.log('ℹ️ No preferred days specified - skipping shortfall detection');
                return;
            }
            const analysis = await getShortfallWithRecommendations(instructorId, calendarMonth, requiredClasses, preferredDays);
            console.log('📊 Monthly Shortfall Analysis:', {
                month: calendarMonth,
                required: requiredClasses,
                scheduled: analysis.scheduledClasses,
                adjustments: analysis.adjustmentClasses,
                total: analysis.scheduledClasses + analysis.adjustmentClasses,
                shortfall: analysis.shortfall
            });
            if (analysis.hasShortfall) {
                console.warn(`⚠️ SHORTFALL DETECTED: Need ${Math.abs(analysis.shortfall)} more class(es) for ${calendarMonth}`);
                if (analysis.recommendations.length > 0) {
                    console.log('💡 Adjustment Recommendations:');
                    analysis.recommendations.forEach((rec, idx) => {
                        console.log(`   ${idx + 1}. ${rec.dateString} (${rec.reason})`);
                    });
                    console.log(`ℹ️ Use the Adjustment Class feature to fill this shortfall`);
                }
                else {
                    console.warn(`❌ No alternative dates available in ${calendarMonth} - cannot fill shortfall`);
                }
            }
            else if (analysis.shortfall === 0) {
                console.log(`✅ Perfect match: Exactly ${requiredClasses} class(es) scheduled for ${calendarMonth}`);
            }
            else {
                console.log(`✅ No shortfall: ${analysis.scheduledClasses + analysis.adjustmentClasses} class(es) scheduled (${analysis.shortfall} more than required)`);
            }
        }
        catch (error) {
            console.error('Error in shortfall detection:', error);
            // Don't throw - this is non-critical
        }
    }
    // 🆕 PHASE 4: Generate first month invoices for monthly bookings
    static async generateFirstMonthInvoices(bookingIds, startDate, packageId) {
        if (!bookingIds || bookingIds.length === 0 || !packageId)
            return;
        try {
            // Get package monthly price
            const monthlyPrice = await getPackageMonthlyPrice(packageId);
            console.log('💰 Generating first month invoices for', bookingIds.length, 'booking(s) - Monthly price:', monthlyPrice);
            // Generate invoice for each booking
            for (const bookingCode of bookingIds) {
                if (!bookingCode || bookingCode.trim() === '')
                    continue;
                try {
                    // Get booking user_id
                    const { data: booking, error: bookingError } = await supabase
                        .from('bookings')
                        .select('user_id')
                        .eq('booking_id', bookingCode.trim())
                        .single();
                    if (bookingError || !booking) {
                        console.warn('Could not fetch booking for invoice generation:', bookingCode);
                        continue;
                    }
                    // Set billing cycle anchor first
                    await setBillingCycleAnchor(bookingCode.trim(), startDate);
                    // Generate first month invoice (with proration)
                    const result = await createFirstMonthInvoice(bookingCode.trim(), booking.user_id, startDate, monthlyPrice, packageId);
                    if (result.success) {
                        console.log('✅ First month invoice created for booking:', bookingCode.trim());
                    }
                    else {
                        console.warn('Failed to create invoice for', bookingCode, ':', result.error);
                    }
                }
                catch (err) {
                    console.error('Exception generating invoice for', bookingCode, ':', err);
                }
            }
            console.log('✅ Invoice generation complete');
        }
        catch (error) {
            console.error('Error in generateFirstMonthInvoices:', error);
            throw error;
        }
    }
    static async generateWeeklyRecurrenceAssignments(formData, perClassAmount, calendarMonth) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week');
        }
        // Validate total classes
        if (!formData.total_classes || formData.total_classes <= 0) {
            throw new Error('Total classes must be greater than 0');
        }
        // Validate start date
        if (!formData.start_date || !isValidDate(formData.start_date)) {
            throw new Error('Valid start date is required');
        }
        // Sort selected days to ensure proper chronological order
        const sortedWeeklyDays = [...formData.weekly_days].sort((a, b) => a - b);
        // Continue creating assignments until we hit the class count or end date
        const startDate = parseDateToUTC(formData.start_date);
        const validityEndDate = formData.validity_end_date && isValidDate(formData.validity_end_date)
            ? parseDateToUTC(formData.validity_end_date)
            : null;
        let classesCreated = 0;
        let currentWeekStart = new Date(startDate);
        // Find the start of the week (Sunday)
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay());
        while (classesCreated < formData.total_classes) {
            // For each week, create classes for all selected days
            for (const dayOfWeek of sortedWeeklyDays) {
                if (classesCreated >= formData.total_classes) {
                    break;
                }
                const classDate = new Date(currentWeekStart);
                classDate.setUTCDate(currentWeekStart.getUTCDate() + dayOfWeek);
                // Skip if the class date is before the start date
                if (classDate < startDate) {
                    continue;
                }
                // Check if we've exceeded the validity period
                if (validityEndDate && classDate > validityEndDate) {
                    console.warn(`Reached validity end date (${formData.validity_end_date}). Created ${classesCreated} classes out of requested ${formData.total_classes}.`);
                    return assignments;
                }
                const assignment = {
                    package_id: formData.package_id,
                    class_package_id: formData.package_id,
                    scheduled_class_id: null,
                    date: formatDateIST(classDate),
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'monthly', // Use 'monthly' for package assignments
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending',
                    calendar_month: calendarMonth, // 🆕 Phase 3: Calendar month tracking
                    is_adjustment: false // 🆕 Phase 3: Regular scheduled class
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                assignments.push(assignment);
                classesCreated++;
            }
            // Move to next week
            currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
            // Safety check to prevent infinite loops
            if (assignments.length > 1000) {
                throw new Error('Assignment generation exceeded maximum limit. Please check your date range and settings.');
            }
        }
        return assignments;
    }
    static async generateManualCalendarAssignments(formData, perClassAmount, calendarMonth) {
        const currentUserId = await getCurrentUserId();
        // Validate manual selections
        if (!formData.manual_selections || formData.manual_selections.length === 0) {
            throw new Error('Please select at least one class date and time');
        }
        // Validate each manual selection
        for (let i = 0; i < formData.manual_selections.length; i++) {
            const selection = formData.manual_selections[i];
            if (!selection.date || !isValidDate(selection.date)) {
                throw new Error(`Invalid date in selection ${i + 1}`);
            }
            if (!selection.start_time || !isValidTime(selection.start_time)) {
                throw new Error(`Invalid start time in selection ${i + 1}`);
            }
            if (!selection.end_time || !isValidTime(selection.end_time)) {
                throw new Error(`Invalid end time in selection ${i + 1}`);
            }
            if (selection.start_time >= selection.end_time) {
                throw new Error(`End time must be after start time in selection ${i + 1}`);
            }
        }
        // Create assignments from manual selections
        return formData.manual_selections.map(selection => {
            const assignment = {
                package_id: formData.package_id,
                class_package_id: formData.package_id,
                date: selection.date,
                start_time: selection.start_time,
                end_time: selection.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: perClassAmount,
                schedule_type: 'monthly',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'individual',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending',
                calendar_month: calendarMonth, // 🆕 Phase 3: Calendar month tracking
                is_adjustment: false // 🆕 Phase 3: Regular scheduled class
            };
            // Add optional fields only if they have values
            if (formData.notes)
                assignment.notes = formData.notes;
            return assignment;
        });
    }
    static async createCrashCourseAssignment(formData, packages, studentCount) {
        const selectedPackage = packages.find(p => p.id === formData.package_id);
        if (!selectedPackage) {
            throw new Error('Selected package not found');
        }
        if (!selectedPackage.class_count || selectedPackage.class_count <= 0) {
            throw new Error('Selected package has invalid class count');
        }
        const assignments = [];
        let crashCourseValidation = null; // Store for later validation
        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'crash_course', selectedPackage.class_count, studentCount);
        // Ensure baseline instructor rate exists for crash course (package-based)
        await ensureInstructorRateIfMissing('crash_course', formData.booking_type || 'individual', formData.payment_amount, undefined, formData.package_id);
        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            // Use crash course specific weekly recurrence method
            assignments.push(...await this.generateCrashCourseWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount));
        }
        else if (formData.monthly_assignment_method === 'manual_calendar') {
            // Use manual calendar selection method (same as monthly/package)
            assignments.push(...await this.generateManualCalendarAssignmentsForCrash(formData, perClassAmount));
        }
        else {
            // Fallback to the original weekly generation for backward compatibility
            const classDates = this.generateCrashCourseDates(formData.start_date, selectedPackage.class_count, 'weekly');
            const currentUserId = await getCurrentUserId();
            assignments.push(...classDates.map(date => {
                const assignment = {
                    package_id: formData.package_id,
                    class_package_id: formData.package_id,
                    date: date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'crash', // Fixed: use 'crash' to match database constraint
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                return assignment;
            }));
        }
        // 🆕 PHASE 6: Validate crash course dates are within validity window
        const crashCourseDates = extractDatesFromAssignments(assignments);
        crashCourseValidation = await validateCrashCourseAssignment(formData.package_id, formData.start_date, crashCourseDates);
        if (!crashCourseValidation.valid) {
            throw new Error(crashCourseValidation.error || 'Crash course validation failed');
        }
        if (crashCourseValidation.details?.warnings?.length > 0) {
            console.warn('⚠️ Crash Course Warnings:', crashCourseValidation.details.warnings);
        }
        // Get booking IDs (support both new and old format)
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'crash', formData.booking_type || 'individual');
        const { data: insertedAssignments, error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)
            .select('id');
        if (error) {
            throw new Error(`Failed to create crash course assignments: ${error.message}`);
        }
        // Create booking associations for all assignments using the new junction table system
        if (bookingIds.length > 0 && insertedAssignments) {
            try {
                for (const assignment of insertedAssignments) {
                    await createAssignmentBookings(assignment.id, bookingIds);
                }
                // Update booking status for all linked bookings
                for (const bookingId of bookingIds) {
                    if (bookingId && bookingId.trim() !== '') {
                        await this.updateBookingStatus(bookingId, 'completed');
                    }
                }
            }
            catch (bookingError) {
                console.error('Failed to associate bookings with crash course assignments:', bookingError);
                throw new Error('Assignments created but failed to link bookings. Please contact support.');
            }
        }
        return { success: true, count: assignments.length };
    }
    static generateCrashCourseDates(startDate, classCount, frequency) {
        if (!startDate || !isValidDate(startDate)) {
            throw new Error('Valid start date is required');
        }
        if (!classCount || classCount <= 0) {
            throw new Error('Class count must be greater than 0');
        }
        const dates = [];
        const currentDate = parseDateToUTC(startDate);
        for (let i = 0; i < classCount; i++) {
            dates.push(formatDateIST(currentDate));
            switch (frequency) {
                case 'daily':
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                    break;
                case 'specific':
                    // TODO: Implement specific days logic based on formData.specific_days
                    currentDate.setUTCDate(currentDate.getUTCDate() + 7); // Default to weekly for now
                    break;
                default:
                    currentDate.setUTCDate(currentDate.getUTCDate() + 7); // Default to weekly
            }
        }
        return dates;
    }
    static async generateManualCalendarAssignmentsForCrash(formData, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        // Validate manual selections
        if (!formData.manual_selections || formData.manual_selections.length === 0) {
            throw new Error('Please select at least one class date and time');
        }
        // Validate each manual selection
        for (let i = 0; i < formData.manual_selections.length; i++) {
            const selection = formData.manual_selections[i];
            if (!selection.date || !isValidDate(selection.date)) {
                throw new Error(`Invalid date in selection ${i + 1}`);
            }
            if (!selection.start_time || !isValidTime(selection.start_time)) {
                throw new Error(`Invalid start time in selection ${i + 1}`);
            }
            if (!selection.end_time || !isValidTime(selection.end_time)) {
                throw new Error(`Invalid end time in selection ${i + 1}`);
            }
            if (selection.start_time >= selection.end_time) {
                throw new Error(`End time must be after start time in selection ${i + 1}`);
            }
        }
        // Create assignments from manual selections
        return formData.manual_selections.map(selection => {
            const assignment = {
                package_id: formData.package_id,
                class_package_id: formData.package_id,
                date: selection.date,
                start_time: selection.start_time,
                end_time: selection.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: perClassAmount,
                schedule_type: 'crash',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'individual',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending'
            };
            // Add optional fields only if they have values
            if (formData.notes)
                assignment.notes = formData.notes;
            return assignment;
        });
    }
    static async createPackageAssignment(formData, packages, studentCount) {
        const selectedPackage = packages.find(p => p.id === formData.package_id);
        if (!selectedPackage) {
            throw new Error('Selected package not found');
        }
        if (!selectedPackage.class_count || selectedPackage.class_count <= 0) {
            throw new Error('Selected package has invalid class count');
        }
        const assignments = [];
        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'package', selectedPackage.class_count, studentCount);
        // Get calendar month from start_date
        const startDate = new Date(formData.start_date + 'T00:00:00.000Z');
        const monthBoundaries = getCalendarMonthBoundaries(startDate);
        const calendarMonth = monthBoundaries.monthKey;
        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            // Weekly recurrence method - use package-specific logic
            assignments.push(...await this.generatePackageWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount));
        }
        else {
            // Manual calendar selection method
            assignments.push(...await this.generateManualCalendarAssignments(formData, perClassAmount, calendarMonth));
        }
        // Get booking IDs (support both new and old format)
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'package', formData.booking_type || 'individual');
        const { data: insertedAssignments, error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)
            .select('id');
        if (error) {
            throw new Error(`Failed to create package assignments: ${error.message}`);
        }
        // Create booking associations for all assignments using the new junction table system
        if (bookingIds.length > 0 && insertedAssignments) {
            try {
                for (const assignment of insertedAssignments) {
                    await createAssignmentBookings(assignment.id, bookingIds);
                }
                // Update booking status for all linked bookings
                for (const bookingId of bookingIds) {
                    if (bookingId && bookingId.trim() !== '') {
                        await this.updateBookingStatus(bookingId, 'completed');
                    }
                }
            }
            catch (bookingError) {
                console.error('Failed to associate bookings with package assignments:', bookingError);
                throw new Error('Assignments created but failed to link bookings. Please contact support.');
            }
        }
        return { success: true, count: assignments.length };
    }
    static async generatePackageWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week');
        }
        // Validate start date
        if (!formData.start_date || !isValidDate(formData.start_date)) {
            throw new Error('Valid start date is required');
        }
        // Use package class count, not formData.total_classes
        const targetClassCount = selectedPackage.class_count;
        // Calculate validity end date from start date + validity days
        let validityEndDate = null;
        if (selectedPackage.validity_days && selectedPackage.validity_days > 0) {
            validityEndDate = parseDateToUTC(formData.start_date);
            validityEndDate.setUTCDate(validityEndDate.getUTCDate() + selectedPackage.validity_days);
        }
        // Sort selected days to ensure proper chronological order
        const sortedWeeklyDays = [...formData.weekly_days].sort((a, b) => a - b);
        console.log(`Package assignment: Target ${targetClassCount} classes for days: ${sortedWeeklyDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`);
        // Continue creating assignments until we hit the package class count or end date
        const startDate = parseDateToUTC(formData.start_date);
        let classesCreated = 0;
        let currentWeekStart = new Date(startDate);
        // Find the start of the week (Sunday)
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay());
        while (classesCreated < targetClassCount) {
            // For each week, create classes for all selected days
            for (const dayOfWeek of sortedWeeklyDays) {
                if (classesCreated >= targetClassCount) {
                    break;
                }
                const classDate = new Date(currentWeekStart);
                classDate.setDate(currentWeekStart.getDate() + dayOfWeek);
                // Skip if the class date is before the start date
                if (classDate < startDate) {
                    continue;
                }
                // Check if we've exceeded the validity period
                if (validityEndDate && classDate > validityEndDate) {
                    console.warn(`Reached validity end date (${validityEndDate.toISOString().split('T')[0]}). Created ${classesCreated} classes out of package requirement ${targetClassCount}.`);
                    return assignments;
                }
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
                console.log(`Creating class on ${formatDateIST(classDate)} (${dayName}) - Class ${classesCreated + 1}/${targetClassCount}`);
                const assignment = {
                    package_id: formData.package_id,
                    class_package_id: formData.package_id,
                    date: formatDateIST(classDate),
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'monthly', // Use 'monthly' for package assignments
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                assignments.push(assignment);
                classesCreated++;
            }
            // Move to next week
            currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
            // Safety check to prevent infinite loops
            if (assignments.length > 1000) {
                throw new Error('Assignment generation exceeded maximum limit. Please check your date range and settings.');
            }
        }
        console.log(`Package assignment: Created ${assignments.length} classes for package "${selectedPackage.name}" (target: ${targetClassCount})`);
        return assignments;
    }
    static async generateCrashCourseWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week');
        }
        // Validate start date
        if (!formData.start_date || !isValidDate(formData.start_date)) {
            throw new Error('Valid start date is required');
        }
        // Use package class count, not formData.total_classes
        const targetClassCount = selectedPackage.class_count;
        // Calculate validity end date from start date + validity days
        let validityEndDate = null;
        if (selectedPackage.validity_days && selectedPackage.validity_days > 0) {
            validityEndDate = parseDateToUTC(formData.start_date);
            validityEndDate.setUTCDate(validityEndDate.getUTCDate() + selectedPackage.validity_days);
        }
        // Sort selected days to ensure proper chronological order
        const sortedWeeklyDays = [...formData.weekly_days].sort((a, b) => a - b);
        // Continue creating assignments until we hit the package class count or end date
        const startDate = parseDateToUTC(formData.start_date);
        let classesCreated = 0;
        let currentWeekStart = new Date(startDate);
        // Find the start of the week (Sunday)
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay());
        while (classesCreated < targetClassCount) {
            // For each week, create classes for all selected days
            for (const dayOfWeek of sortedWeeklyDays) {
                if (classesCreated >= targetClassCount) {
                    break;
                }
                const classDate = new Date(currentWeekStart);
                classDate.setUTCDate(currentWeekStart.getUTCDate() + dayOfWeek);
                // Skip if the class date is before the start date
                if (classDate < startDate) {
                    continue;
                }
                // Check if we've exceeded the validity period
                if (validityEndDate && classDate > validityEndDate) {
                    console.warn(`Reached validity end date (${validityEndDate.toISOString().split('T')[0]}). Created ${classesCreated} classes out of package requirement ${targetClassCount}.`);
                    return assignments;
                }
                const assignment = {
                    package_id: formData.package_id,
                    class_package_id: formData.package_id,
                    scheduled_class_id: null,
                    date: formatDateIST(classDate),
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'crash',
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                assignments.push(assignment);
                classesCreated++;
            }
            // Move to next week
            currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
            // Safety check to prevent infinite loops
            if (assignments.length > 1000) {
                throw new Error('Assignment generation exceeded maximum limit. Please check your date range and settings.');
            }
        }
        console.log(`Crash course assignment: Created ${assignments.length} classes for package "${selectedPackage.name}" (target: ${targetClassCount})`);
        return assignments;
    }
    static calculatePaymentAmount(formData, _assignmentType, classCount, studentCount) {
        const totalClasses = classCount || formData.total_classes || 1;
        const actualStudentCount = studentCount || 1;
        // Validate inputs
        if (isNaN(formData.payment_amount) || formData.payment_amount < 0) {
            throw new Error('Payment amount must be a valid positive number');
        }
        switch (formData.payment_type) {
            case 'per_class':
                // Amount per class (as entered)
                return formData.payment_amount;
            case 'per_student_per_class':
                // Amount per student per class × students
                return formData.payment_amount * actualStudentCount;
            case 'per_member':
                // Monthly amount per member × students ÷ classes per month
                const classesPerMonth = Math.max(1, Math.ceil(totalClasses / 4));
                return (formData.payment_amount * actualStudentCount) / classesPerMonth;
            case 'monthly':
                // Fixed monthly rate ÷ classes per month
                const avgClassesPerMonth = Math.max(1, Math.ceil(totalClasses / 4));
                return formData.payment_amount / avgClassesPerMonth;
            case 'per_class_total':
                // Total amount for all students per class (as entered)
                return formData.payment_amount;
            case 'total_duration':
                // Total duration amount ÷ total classes
                return totalClasses > 0 ? formData.payment_amount / totalClasses : formData.payment_amount;
            default:
                return formData.payment_amount;
        }
    }
    static async updateBookingStatus(bookingId, status) {
        if (!bookingId || bookingId.trim() === '') {
            return; // No booking ID to update
        }
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: status })
                .eq('booking_id', bookingId.trim())
                .select(); // Ensure data is returned for validation
            if (error) {
                console.warn('Failed to update booking status:', {
                    bookingId: bookingId.trim(),
                    status,
                    error
                });
                // Don't throw error for booking status update failure
            }
            else {
                console.log(`Successfully updated booking ${bookingId} status to ${status}`);
            }
        }
        catch (error) {
            console.warn('Failed to update booking status:', {
                bookingId: bookingId.trim(),
                status,
                error
            });
        }
    }
}
