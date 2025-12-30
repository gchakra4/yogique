import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateCourseClasses, calculateCourseEndDate, calculateWeeklyClasses, minutesToTime, timeToMinutes } from '../utils';
// Configuration constants
const DEFAULT_YEAR_END = `${new Date().getFullYear()}-12-31`;
const WEEKS_PER_MONTH = 4;
const MIN_DURATION = 15; // Minimum class duration in minutes
const MAX_DURATION = 480; // Maximum class duration in minutes (8 hours)
const initialFormData = {
    // Assignment type selection
    assignment_type: 'adhoc',
    // Basic fields
    class_type_id: '',
    instructor_id: '',
    payment_amount: 0,
    payment_type: 'per_class',
    notes: '',
    // Date/Time fields (varies by type)
    date: '',
    start_time: '',
    end_time: '',
    duration: 60,
    // Course fields
    start_date: '',
    end_date: '',
    day_of_week: 0,
    day_of_month: 1,
    // Course duration
    course_duration_value: 1,
    course_duration_unit: 'weeks',
    class_frequency: 'weekly',
    specific_days: [],
    // Recurrence metadata
    recurrence_type: 'single',
    recurrence_interval: 1,
    // Package fields
    package_id: '',
    booking_type: 'individual',
    // Generated/calculated fields
    timeline_description: '',
    total_classes: 1,
    // Timezone support
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Assignment method fields
    monthly_assignment_method: 'weekly_recurrence',
    // Weekly recurrence fields
    weekly_days: [],
    // Manual calendar selections
    manual_selections: [],
    // Booking reference fields
    booking_id: '',
    client_name: '',
    client_email: '',
    // Multiple booking support
    booking_ids: [],
    // UI flag to indicate whether booking linking is enabled
    link_booking: false,
    // Weekly template assignment
    selected_template_id: '',
    // Package validity constraint
    validity_end_date: ''
};
// Assignment type to booking type mapping
const ASSIGNMENT_BOOKING_MAP = {
    crash_course: 'corporate',
    weekly: 'public_group',
    adhoc: 'individual',
    monthly: 'individual',
    package: 'individual'
};
export const useFormHandler = ({ conflictCheckCallback, packages = [], onFormChange, debounceMs = 300 } = {}) => {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [conflictWarning, setConflictWarning] = useState(null);
    // Memoized selected package
    const selectedPackage = useMemo(() => packages.find(p => p.id === formData.package_id), [packages, formData.package_id]);
    // Debounced form change callback
    const debouncedOnFormChange = useCallback(debounce((data) => onFormChange?.(data), debounceMs), [onFormChange, debounceMs]);
    // Auto-calculate end dates and timeline descriptions when relevant fields change
    useEffect(() => {
        updateTimelineInfo();
    }, [
        formData.assignment_type,
        formData.start_date,
        formData.course_duration_value,
        formData.course_duration_unit,
        formData.day_of_week,
        formData.day_of_month,
        formData.date,
        formData.package_id,
        formData.monthly_assignment_method,
        formData.weekly_days.length,
        selectedPackage
    ]);
    // Reset payment_type when switching away from weekly
    useEffect(() => {
        if (formData.assignment_type !== 'weekly' &&
            (formData.payment_type === 'monthly' || formData.payment_type === 'per_member')) {
            handleInputChange('payment_type', 'per_class');
        }
    }, [formData.assignment_type]);
    // Call form change callback
    useEffect(() => {
        debouncedOnFormChange(formData);
    }, [formData, debouncedOnFormChange]);
    const calculateTimelineInfo = useCallback(() => {
        let description = '';
        let calculatedEndDate = '';
        let totalClasses = 0;
        switch (formData.assignment_type) {
            case 'weekly':
                if (formData.start_date) {
                    calculatedEndDate = formData.end_date || DEFAULT_YEAR_END;
                    totalClasses = calculateWeeklyClasses(formData.start_date, calculatedEndDate);
                    const isTemplate = formData.monthly_assignment_method === 'weekly_recurrence';
                    description = isTemplate
                        ? `Weekly class assignment using existing template until ${formatDate(calculatedEndDate)} (${totalClasses} classes)`
                        : `Weekly classes until ${formatDate(calculatedEndDate)} (${totalClasses} classes)`;
                }
                else {
                    description = 'Weekly class assignment - please set start date';
                    totalClasses = 1;
                }
                break;
            case 'monthly':
                if (formData.start_date) {
                    if (selectedPackage?.class_count && selectedPackage?.validity_days) {
                        totalClasses = selectedPackage.class_count;
                        calculatedEndDate = calculateValidityEndDate(formData.start_date, selectedPackage.validity_days);
                        description = `Monthly package: ${selectedPackage.name} (${totalClasses} classes within ${selectedPackage.validity_days} days)`;
                    }
                    else if (formData.course_duration_value && formData.course_duration_unit) {
                        calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
                        totalClasses = calculateTotalClassesForRecurrence(formData.course_duration_value, formData.course_duration_unit, formData.monthly_assignment_method, formData.weekly_days.length);
                        description = `Monthly classes for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
                    }
                }
                break;
            case 'crash_course':
                if (formData.start_date) {
                    if (selectedPackage?.class_count) {
                        totalClasses = selectedPackage.class_count;
                        if (selectedPackage.validity_days) {
                            calculatedEndDate = calculateValidityEndDate(formData.start_date, selectedPackage.validity_days);
                            description = `Crash course package: ${selectedPackage.name} (${totalClasses} classes within ${selectedPackage.validity_days} days)`;
                        }
                        else {
                            calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value || 2, formData.course_duration_unit || 'weeks');
                            description = `Crash course package: ${selectedPackage.name} (${totalClasses} classes)`;
                        }
                    }
                    else {
                        // Fallback calculation
                        const { endDate, classes, desc } = calculateCrashCourseInfo(formData);
                        calculatedEndDate = endDate;
                        totalClasses = classes;
                        description = desc;
                    }
                }
                break;
            case 'package':
                if (formData.start_date) {
                    if (selectedPackage?.class_count) {
                        totalClasses = selectedPackage.class_count;
                        if (selectedPackage.validity_days) {
                            calculatedEndDate = calculateValidityEndDate(formData.start_date, selectedPackage.validity_days);
                            description = `Package assignment: ${selectedPackage.name} (${totalClasses} classes within ${selectedPackage.validity_days} days)`;
                        }
                        else {
                            calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value || 4, formData.course_duration_unit || 'weeks');
                            description = `Package assignment: ${selectedPackage.name} (${totalClasses} classes)`;
                        }
                    }
                    else {
                        // Fallback calculation
                        const { endDate, classes, desc } = calculatePackageInfo(formData);
                        calculatedEndDate = endDate;
                        totalClasses = classes;
                        description = desc;
                    }
                }
                break;
            case 'adhoc':
            default:
                if (formData.date) {
                    description = `Single class on ${formatDate(formData.date)}`;
                    totalClasses = 1;
                }
                break;
        }
        return { description, calculatedEndDate, totalClasses };
    }, [formData, selectedPackage]);
    const updateTimelineInfo = useCallback(() => {
        const { description, calculatedEndDate, totalClasses } = calculateTimelineInfo();
        setFormData(prev => ({
            ...prev,
            end_date: calculatedEndDate,
            timeline_description: description,
            total_classes: totalClasses,
            validity_end_date: calculatedEndDate
        }));
    }, [calculateTimelineInfo]);
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            // Auto-set booking type and clear booking selection when assignment type changes
            if (field === 'assignment_type') {
                // Clear booking-related fields
                newData.booking_id = '';
                newData.client_name = '';
                newData.client_email = '';
                newData.booking_ids = [];
                // Auto-set booking type based on assignment type
                newData.booking_type = ASSIGNMENT_BOOKING_MAP[value] || 'individual';
            }
            return newData;
        });
        // Clear related errors when field is updated
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    }, [errors]);
    const handleTimeChange = useCallback((field, time) => {
        handleInputChange(field, time);
        if (field === 'start_time' && formData.duration) {
            // Calculate end time from start time and duration
            const startMinutes = timeToMinutes(time);
            const endMinutes = startMinutes + formData.duration;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
        else if (field === 'end_time' && formData.start_time) {
            // Calculate duration from start and end time
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = timeToMinutes(time);
            const duration = Math.max(0, endMinutes - startMinutes);
            handleInputChange('duration', duration);
        }
    }, [formData.duration, formData.start_time, handleInputChange]);
    const handleDurationChange = useCallback((durationMinutes) => {
        // Clamp duration to valid range
        const clampedDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, durationMinutes));
        handleInputChange('duration', clampedDuration);
        if (formData.start_time) {
            // Calculate end time from start time and new duration
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = startMinutes + clampedDuration;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    }, [formData.start_time, handleInputChange]);
    const validateForm = useCallback(() => {
        const newErrors = {};
        // Common validations
        if (!formData.instructor_id) {
            newErrors.instructor_id = 'Instructor is required';
        }
        // Class type validation - only required for adhoc assignments
        if (formData.assignment_type === 'adhoc' && !formData.class_type_id) {
            newErrors.class_type_id = 'Class type is required';
        }
        // Time validations - not required when using templates
        const usingTemplate = formData.assignment_type === 'weekly' &&
            formData.monthly_assignment_method === 'weekly_recurrence' &&
            formData.selected_template_id;
        if (!usingTemplate) {
            if (!formData.start_time) {
                newErrors.start_time = 'Start time is required';
            }
            if (!formData.end_time) {
                newErrors.end_time = 'End time is required';
            }
            // Validate time logic
            if (formData.start_time && formData.end_time) {
                const startMinutes = timeToMinutes(formData.start_time);
                const endMinutes = timeToMinutes(formData.end_time);
                if (endMinutes <= startMinutes) {
                    newErrors.end_time = 'End time must be after start time';
                }
                const duration = endMinutes - startMinutes;
                if (duration < MIN_DURATION) {
                    newErrors.duration = `Minimum duration is ${MIN_DURATION} minutes`;
                }
                if (duration > MAX_DURATION) {
                    newErrors.duration = `Maximum duration is ${MAX_DURATION} minutes`;
                }
            }
        }
        // Payment validation
        if (formData.payment_amount <= 0) {
            newErrors.payment_amount = 'Payment amount must be greater than 0';
        }
        // Assignment type specific validations
        const typeSpecificErrors = validateByAssignmentType(formData);
        Object.assign(newErrors, typeSpecificErrors);
        // Check for conflicts
        if (formData.assignment_type === 'adhoc' && conflictCheckCallback) {
            conflictCheckCallback(formData);
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, selectedPackage, conflictCheckCallback]);
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setErrors({});
        setConflictWarning(null);
    }, []);
    // Expose computed values
    const computedValues = useMemo(() => ({
        selectedPackage,
        isValid: Object.keys(errors).length === 0,
        hasConflicts: conflictWarning !== null,
        usingTemplate: formData.assignment_type === 'weekly' &&
            formData.monthly_assignment_method === 'weekly_recurrence' &&
            formData.selected_template_id
    }), [selectedPackage, errors, conflictWarning, formData]);
    return {
        formData,
        setFormData,
        errors,
        setErrors,
        conflictWarning,
        setConflictWarning,
        handleInputChange,
        handleTimeChange,
        handleDurationChange,
        validateForm,
        resetForm,
        updateTimelineInfo,
        computedValues
    };
};
// Helper functions
function debounce(func, wait) {
    let timeout;
    return ((...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    });
}
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}
function calculateValidityEndDate(startDate, validityDays) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityDays);
    return endDate.toISOString().split('T')[0];
}
function calculateTotalClassesForRecurrence(durationValue, durationUnit, method, weeklyDaysCount) {
    if (method === 'weekly_recurrence' && weeklyDaysCount > 0) {
        const totalWeeks = durationUnit === 'months'
            ? durationValue * WEEKS_PER_MONTH
            : durationValue;
        return Math.ceil(totalWeeks * weeklyDaysCount);
    }
    return Math.ceil(durationValue * (durationUnit === 'months' ? WEEKS_PER_MONTH : 1));
}
function calculateCrashCourseInfo(formData) {
    if (formData.course_duration_value && formData.course_duration_unit) {
        const calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
        let totalClasses;
        let description;
        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.weekly_days.length > 0) {
            totalClasses = calculateTotalClassesForRecurrence(formData.course_duration_value, formData.course_duration_unit, formData.monthly_assignment_method, formData.weekly_days.length);
            description = `Crash course with weekly recurrence for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
        }
        else if (formData.class_frequency) {
            totalClasses = calculateCourseClasses(formData.course_duration_value, formData.course_duration_unit, formData.class_frequency);
            description = `${capitalize(formData.class_frequency)} crash course for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
        }
        else {
            totalClasses = Math.ceil(formData.course_duration_value * (formData.course_duration_unit === 'months' ? WEEKS_PER_MONTH : 1));
            description = `Crash course for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
        }
        return { endDate: calculatedEndDate, classes: totalClasses, desc: description };
    }
    return { endDate: '', classes: 0, desc: '' };
}
function calculatePackageInfo(formData) {
    if (formData.course_duration_value && formData.course_duration_unit) {
        const calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
        const totalClasses = calculateTotalClassesForRecurrence(formData.course_duration_value, formData.course_duration_unit, formData.monthly_assignment_method, formData.weekly_days.length);
        const description = `Package assignment for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
        return { endDate: calculatedEndDate, classes: totalClasses, desc: description };
    }
    return { endDate: '', classes: 0, desc: 'Package-based class assignment' };
}
function validateByAssignmentType(formData) {
    const errors = {};
    switch (formData.assignment_type) {
        case 'adhoc':
            if (!formData.date)
                errors.date = 'Date is required';
            break;
        case 'weekly':
            if (formData.monthly_assignment_method === 'weekly_recurrence') {
                if (!formData.selected_template_id) {
                    errors.selected_template_id = 'Please select a template';
                }
            }
            else {
                if (!formData.start_date)
                    errors.start_date = 'Start date is required';
                if (!formData.course_duration_value)
                    errors.course_duration_value = 'Duration is required';
                if (formData.course_duration_value <= 0)
                    errors.course_duration_value = 'Duration must be greater than 0';
                if (!formData.day_of_week && formData.day_of_week !== 0)
                    errors.day_of_week = 'Day of week is required';
            }
            break;
        case 'monthly':
            if (!formData.start_date)
                errors.start_date = 'Start date is required';
            if (!formData.course_duration_value)
                errors.course_duration_value = 'Duration is required';
            if (formData.course_duration_value <= 0)
                errors.course_duration_value = 'Duration must be greater than 0';
            if (formData.monthly_assignment_method === 'weekly_recurrence') {
                if (!formData.weekly_days || formData.weekly_days.length === 0) {
                    errors.weekly_days = 'Please select at least one day of the week';
                }
            }
            else if (formData.monthly_assignment_method === 'manual_calendar') {
                if (!formData.manual_selections || formData.manual_selections.length === 0) {
                    errors.manual_selections = 'Please select at least one class date and time';
                }
            }
            break;
        case 'package':
            if (!formData.package_id)
                errors.package_id = 'Package is required';
            if (!formData.start_date)
                errors.start_date = 'Start date is required';
            break;
        case 'crash_course':
            if (!formData.package_id)
                errors.package_id = 'Package is required';
            if (!formData.start_date)
                errors.start_date = 'Start date is required';
            if (!formData.class_frequency)
                errors.class_frequency = 'Class frequency is required';
            if (formData.day_of_month < 1 || formData.day_of_month > 31) {
                errors.day_of_month = 'Day of month must be between 1 and 31';
            }
            break;
    }
    return errors;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
