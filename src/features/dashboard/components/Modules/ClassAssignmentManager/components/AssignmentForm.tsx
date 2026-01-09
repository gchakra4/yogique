import { AlertTriangle, Calendar, IndianRupee, Save, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRateForAssignment } from '../../../../../instructor-rates/hooks/useRateForAssignment'
import { Booking, ClassType, ConflictDetails, FormData, Package, UserProfile, ValidationErrors } from '../types'
import { getDurationOptions } from '../utils'
import { AdaptiveBookingSelector } from './AdaptiveBookingSelector'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { ManualCalendarSelector } from './ManualCalendarSelector'

interface AssignmentFormProps {
    isVisible: boolean
    formData: FormData
    errors: ValidationErrors
    conflictWarning: ConflictDetails | null
    classTypes: ClassType[]
    packages: Package[]
    instructors: UserProfile[]
    scheduleTemplates: any[]
    bookings: Booking[]
    saving: boolean
    onClose: () => void
    onSubmit: () => void
    onInputChange: (field: string, value: any) => void
    onTimeChange: (field: 'start_time' | 'end_time', time: string) => void
    onDurationChange: (duration: number) => void
}

export const AssignmentForm = ({
    isVisible,
    formData,
    errors,
    conflictWarning,
    classTypes,
    packages,
    instructors,
    scheduleTemplates,
    bookings,
    saving,
    onClose,
    onSubmit,
    onInputChange,
    onTimeChange,
    onDurationChange
}: AssignmentFormProps) => {

    // Calculate student count based on selected booking(s)
    const calculateStudentCount = () => {
        // If no booking is selected, default to 1 student
        if (!formData.booking_id || formData.booking_id.trim() === '') {
            return 1;
        }

        // Find the selected booking
        const selectedBooking = bookings.find(booking => booking.id === formData.booking_id);
        if (!selectedBooking) {
            return 1; // Fallback if booking not found
        }

        // For group bookings, check if there's any participant-related field
        // Note: Currently each booking represents 1 student
        // In the future, if group bookings need multiple participants,
        // a participants_count field can be added to the Booking interface

        // For now, each booking = 1 student
        return 1;
    };

    const studentCount = calculateStudentCount();

    // Derive instructor rate lookup parameters (exclude custom "package" type)
    const scheduleTypeForRate =
        formData.assignment_type === 'crash_course'
            ? 'crash'
            : (formData.assignment_type === 'package' ? undefined : formData.assignment_type)

    const categoryForRate = formData.booking_type as any
    const classTypeIdForRate =
        (formData.assignment_type === 'adhoc' || formData.assignment_type === 'weekly')
            ? formData.class_type_id
            : undefined
    const packageIdForRate =
        (formData.assignment_type === 'monthly' || formData.assignment_type === 'crash_course')
            ? formData.package_id
            : undefined

    const { rate, loading: rateLoading } = useRateForAssignment(
        scheduleTypeForRate as any,
        categoryForRate,
        classTypeIdForRate,
        packageIdForRate
    )

    // Auto-fill from instructor_rates when available and user hasn't entered any amount yet
    useEffect(() => {
        if (rate && (!formData.payment_amount || formData.payment_amount <= 0)) {
            onInputChange('payment_amount', rate.rate_amount)
        }
    }, [rate])

    // Ensure recurrence and duration defaults when assignment type changes
    useEffect(() => {
        if (formData.assignment_type === 'monthly') {
            if (formData.course_duration_unit !== 'months') {
                onInputChange('course_duration_unit', 'months')
            }
            if (formData.recurrence_type !== 'monthly') {
                onInputChange('recurrence_type', 'monthly')
            }
        } else if (formData.assignment_type === 'weekly') {
            if (formData.recurrence_type !== 'weekly') {
                onInputChange('recurrence_type', 'weekly')
            }
        } else {
            if (formData.recurrence_type !== 'single') {
                onInputChange('recurrence_type', 'single')
            }
        }
    }, [formData.assignment_type])

    if (!isVisible) return null

    const getFilteredPackages = () => {
        switch (formData.assignment_type) {
            case 'crash_course':
                return packages.filter(p => p.course_type === 'crash')
            case 'monthly':
            case 'package':
                return packages.filter(p => p.course_type === 'regular')
            default:
                return packages
        }
    }

    const showPackageSelector = ['crash_course', 'monthly', 'package'].includes(formData.assignment_type)
    const showClassTypeSelector = !showPackageSelector && formData.assignment_type !== 'weekly'
    const showBookingTypeSelector = ['adhoc', 'monthly', 'crash_course', 'package'].includes(formData.assignment_type)
    const usingTemplate = formData.assignment_type === 'weekly' && formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Create New Assignment</h2>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-6">
                            {/* Assignment Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Assignment Type</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {[
                                        { value: 'adhoc', label: 'Single Class', desc: 'One-time class' },
                                        { value: 'weekly', label: 'Weekly Classes', desc: 'Recurring weekly' },
                                        { value: 'monthly', label: 'Monthly Package', desc: 'Regular package' },
                                        { value: 'crash_course', label: 'Crash Course', desc: 'Intensive course' },
                                        { value: 'package', label: 'Package Assignment', desc: 'Custom package' }
                                    ].map(type => (
                                        <div key={type.value} className="relative">
                                            <input
                                                type="radio"
                                                id={type.value}
                                                name="assignment_type"
                                                value={type.value}
                                                checked={formData.assignment_type === type.value}
                                                onChange={(e) => onInputChange('assignment_type', e.target.value)}
                                                className="sr-only"
                                            />
                                            <label
                                                htmlFor={type.value}
                                                className={`block p-3 border rounded-lg cursor-pointer transition-colors ${formData.assignment_type === type.value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="font-medium text-sm">{type.label}</div>
                                                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.assignment_type && (
                                    <p className="text-red-500 text-sm mt-1">{errors.assignment_type}</p>
                                )}
                            </div>

                            {/* Booking Type Selector for Monthly/Crash/Package */}
                            {showBookingTypeSelector && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Booking Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.booking_type}
                                        onChange={(e) => onInputChange('booking_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select booking type</option>
                                        <option value="individual">Individual</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="private_group">Private Group</option>
                                    </select>
                                    {errors.booking_type && <p className="text-red-500 text-sm mt-1">{errors.booking_type}</p>}
                                </div>
                            )}

                            {/* Booking Reference Selector */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Link booking (optional)</label>
                                        <p className="text-xs text-gray-500">Link an existing booking to this assignment to auto-complete client info and optionally mark it recurring for billing.</p>
                                    </div>
                                    <div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!formData.link_booking}
                                                onChange={(e) => {
                                                    const enabled = e.target.checked
                                                    onInputChange('link_booking', enabled)
                                                    if (!enabled) {
                                                        // Clear any selected bookings when turning off
                                                        onInputChange('booking_ids', [])
                                                        onInputChange('booking_id', '')
                                                        onInputChange('client_name', '')
                                                        onInputChange('client_email', '')
                                                    }
                                                }}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Enable</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Show booking selector only when link_booking is enabled */}
                                {formData.link_booking ? (
                                    <AdaptiveBookingSelector
                                        bookings={bookings}
                                        assignmentType={formData.assignment_type}
                                        bookingType={formData.booking_type as any}
                                        selectedBookingId={formData.booking_id || ''}
                                        onBookingSelect={(bookingId, clientName, clientEmail) => {
                                            onInputChange('booking_id', bookingId)
                                            onInputChange('client_name', clientName)
                                            onInputChange('client_email', clientEmail)
                                        }}
                                        selectedBookingIds={formData.booking_ids || []}
                                        onBookingSelectionChange={(bookingIds) => {
                                            onInputChange('booking_ids', bookingIds)
                                        }}
                                        bookingTypeFilter={formData.booking_type as any}
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded text-sm text-gray-600">
                                        Linking is disabled. Toggle "Enable" to link an existing booking.
                                    </div>
                                )}
                            </div>

                            {/* Timeline Description Display */}
                            {formData.timeline_description && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-start">
                                        <Calendar className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                                        <div>
                                            <h4 className="font-medium text-blue-900">Assignment Overview</h4>
                                            <p className="text-sm text-blue-700 mt-1">{formData.timeline_description}</p>
                                            {formData.total_classes > 1 && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    <strong>Total Classes to Create: {formData.total_classes}</strong>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Weekly Assignment Date Notice */}
                            {formData.assignment_type === 'weekly' && !formData.timeline_description && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="flex items-start">
                                        <Calendar className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
                                        <div>
                                            <h4 className="font-medium text-yellow-900">Start Date Required</h4>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                Please fill in the Start Date to see how many recurring classes will be created. Leave "Effective Until" empty to continue until end of {new Date().getFullYear()}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Class Type / Package Selection */}
                            {!usingTemplate && (showPackageSelector || showClassTypeSelector) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {showPackageSelector ?
                                            (formData.assignment_type === 'crash_course' ? 'Crash Course Package' :
                                                formData.assignment_type === 'monthly' ? 'Regular Package' : 'Package') :
                                            'Class Type'
                                        }
                                        <span className="text-red-500"> *</span>
                                    </label>

                                    {showClassTypeSelector && (
                                        <select
                                            value={formData.class_type_id}
                                            onChange={(e) => {
                                                onInputChange('class_type_id', e.target.value)
                                                onInputChange('package_id', '')
                                            }}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Class Type</option>
                                            {classTypes.map(classType => (
                                                <option key={classType.id} value={classType.id}>
                                                    {classType.name} ({classType.difficulty_level})
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {showPackageSelector && (
                                        <select
                                            value={formData.package_id}
                                            onChange={(e) => {
                                                onInputChange('package_id', e.target.value)
                                                onInputChange('class_type_id', '')
                                            }}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Package</option>
                                            {getFilteredPackages().map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name} - {pkg.class_count} classes (₹{pkg.price})
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {errors.class_type_id && <p className="text-red-500 text-sm mt-1">{errors.class_type_id}</p>}
                                    {errors.package_id && <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>}

                                    {/* Show selected package details */}
                                    {formData.package_id && showPackageSelector && (
                                        <div className="mt-2 p-3 bg-blue-50 rounded border">
                                            {(() => {
                                                const selectedPackage = packages.find(p => p.id === formData.package_id)
                                                if (!selectedPackage) return null
                                                return (
                                                    <div className="text-sm text-blue-800">
                                                        <p><strong>{selectedPackage.name}</strong></p>
                                                        <p>{selectedPackage.description}</p>
                                                        <p>Duration: {selectedPackage.duration}</p>
                                                        <p>Classes: {selectedPackage.class_count}</p>
                                                        <p>Price: ₹{selectedPackage.price}</p>
                                                        {selectedPackage.validity_days && (
                                                            <p>Valid for: {selectedPackage.validity_days} days</p>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Dynamic Date/Time Fields Based on Assignment Type */}
                            {formData.assignment_type === 'adhoc' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Class Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => onInputChange('date', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                                </div>
                            )}

                            {/* Weekly Assignment Date Fields */}
                            {formData.assignment_type === 'weekly' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => onInputChange('start_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Effective Until
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => onInputChange('end_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Leave empty for end of year"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Leave empty to continue until end of {new Date().getFullYear()}
                                        </p>
                                        {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Other Recurring Assignment Fields */}
                            {['monthly', 'crash_course', 'package'].includes(formData.assignment_type) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => onInputChange('start_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Course Duration
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.course_duration_value}
                                                onChange={(e) => onInputChange('course_duration_value', parseInt(e.target.value) || 1)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <select
                                                value={formData.course_duration_unit}
                                                onChange={(e) => onInputChange('course_duration_unit', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                            </select>
                                        </div>
                                        {errors.course_duration_value && <p className="text-red-500 text-sm mt-1">{errors.course_duration_value}</p>}

                                        {/* Recurrence Selector (persisted in formData) */}
                                        <div className="mt-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence</label>
                                            <select
                                                value={formData.recurrence_type || (formData.assignment_type === 'monthly' ? 'monthly' : 'single')}
                                                onChange={(e) => onInputChange('recurrence_type', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="single">Single / None</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Weekly Assignment Options */}
                            {formData.assignment_type === 'weekly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Weekly Assignment Method</label>
                                    <div className="space-y-4">
                                        {/* Template Selection Option */}
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="template-method"
                                                    name="weekly_method"
                                                    checked={formData.monthly_assignment_method === 'weekly_recurrence'}
                                                    onChange={() => onInputChange('monthly_assignment_method', 'weekly_recurrence')}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="template-method" className="ml-3 text-sm font-medium text-gray-700">
                                                    Use Existing Weekly Template
                                                </label>
                                            </div>

                                            {formData.monthly_assignment_method === 'weekly_recurrence' && (
                                                <div className="mt-3">
                                                    <select
                                                        value={formData.selected_template_id}
                                                        onChange={(e) => {
                                                            onInputChange('selected_template_id', e.target.value)
                                                            // Clear class type and day selection when using template
                                                            if (e.target.value) {
                                                                onInputChange('class_type_id', '')
                                                                onInputChange('day_of_week', 0)
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select a weekly template</option>
                                                        {scheduleTemplates.map(template => (
                                                            <option key={template.id} value={template.id}>
                                                                {template.class_type?.name} - {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][template.day_of_week]} at {template.start_time}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.selected_template_id && <p className="text-red-500 text-sm mt-1">{errors.selected_template_id}</p>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Option to create new recurring schedule */}
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="new-schedule-method"
                                                    name="weekly_method"
                                                    checked={formData.monthly_assignment_method === 'manual_calendar'}
                                                    onChange={() => onInputChange('monthly_assignment_method', 'manual_calendar')}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="new-schedule-method" className="ml-3 text-sm font-medium text-gray-700">
                                                    Create New Recurring Schedule
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Day Selection for New Schedule */}
                                    {formData.monthly_assignment_method === 'manual_calendar' && !formData.selected_template_id && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Day of Week <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.day_of_week}
                                                onChange={(e) => onInputChange('day_of_week', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value={0}>Sunday</option>
                                                <option value={1}>Monday</option>
                                                <option value={2}>Tuesday</option>
                                                <option value={3}>Wednesday</option>
                                                <option value={4}>Thursday</option>
                                                <option value={5}>Friday</option>
                                                <option value={6}>Saturday</option>
                                            </select>
                                            {errors.day_of_week && <p className="text-red-500 text-sm mt-1">{errors.day_of_week}</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Day of Month removed from monthly flow — monthly recurrence uses start_date + recurrence logic */}


                            {/* Instructor Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instructor <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.instructor_id}
                                    onChange={(e) => onInputChange('instructor_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Instructor</option>
                                    {instructors.map(instructor => (
                                        <option key={instructor.user_id} value={instructor.user_id}>
                                            {instructor.full_name} ({instructor.email})
                                        </option>
                                    ))}
                                </select>
                                {errors.instructor_id && <p className="text-red-500 text-sm mt-1">{errors.instructor_id}</p>}
                            </div>

                            {/* Time/Duration Selection */}
                            {!usingTemplate && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => onTimeChange('start_time', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => onTimeChange('end_time', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Class Duration (Minutes)
                                        </label>
                                        <select
                                            value={formData.duration}
                                            onChange={(e) => onDurationChange(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {getDurationOptions().map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Conflict Warning */}
                            {conflictWarning && (
                                <div className={`p-4 rounded-md border ${conflictWarning.severity === 'error'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-yellow-50 border-yellow-200'
                                    }`}>
                                    <div className="flex items-start">
                                        <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${conflictWarning.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                                            }`} />
                                        <div className="flex-1">
                                            <h4 className={`font-medium ${conflictWarning.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                                                }`}>
                                                {conflictWarning.severity === 'error' ? 'Scheduling Conflict' : 'Warning'}
                                            </h4>
                                            <p className={`mt-1 text-sm ${conflictWarning.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                                                }`}>
                                                {conflictWarning.message}
                                            </p>
                                            {conflictWarning.suggestions && conflictWarning.suggestions.length > 0 && (
                                                <ul className={`mt-2 text-sm list-disc list-inside ${conflictWarning.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                                                    }`}>
                                                    {conflictWarning.suggestions.map((suggestion, index) => (
                                                        <li key={index}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Type
                                    </label>
                                    <select
                                        value={formData.payment_type}
                                        onChange={(e) => onInputChange('payment_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="per_class">Per Class - Amount charged per individual class</option>
                                        {formData.assignment_type === 'weekly' && (
                                            <>
                                                <option value="monthly">Monthly Rate - Fixed amount per month</option>
                                                <option value="per_member">Per Member Monthly - Monthly amount per student</option>
                                            </>
                                        )}
                                        {['monthly', 'crash_course', 'package'].includes(formData.assignment_type) && (
                                            <option value="total_duration">Total Duration - Total amount for entire course</option>
                                        )}
                                        <option value="per_class_total">Per Class Total - Total amount for all students per class</option>
                                        <option value="per_student_per_class">Per Student Per Class - Amount per student per class</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <IndianRupee className="w-4 h-4 inline mr-1" />
                                        Payment Amount (INR) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.payment_amount}
                                        onChange={(e) => onInputChange('payment_amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                    {errors.payment_amount && <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>}
                                    {formData.assignment_type !== 'package' && (
                                        <p className="text-xs mt-1">
                                            {rateLoading
                                                ? 'Checking instructor rate...'
                                                : (rate
                                                    ? <span className="text-green-600">Auto-filled from instructor rates. You may override for this assignment; the rate table will not be updated.</span>
                                                    : <span className="text-amber-600">No instructor rate found; the entered amount will be saved as a new rate for this combination.</span>
                                                )
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>


                            {/* Payment Summary */}
                            {formData.payment_amount > 0 && formData.total_classes > 1 && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                    <h4 className="font-medium text-green-900 mb-2">Payment Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-green-700">Total Amount:</span>
                                            <span className="font-medium ml-2">
                                                ₹{(() => {
                                                    const { payment_type, payment_amount, total_classes } = formData;
                                                    switch (payment_type) {
                                                        case 'per_class':
                                                            // Amount per class × total classes
                                                            return (payment_amount * total_classes).toFixed(2);
                                                        case 'per_student_per_class':
                                                            // Amount per student per class × students × total classes
                                                            return (payment_amount * studentCount * total_classes).toFixed(2);
                                                        case 'per_member':
                                                            // Monthly amount per member × students × months
                                                            const months = Math.ceil(total_classes / 4); // Assuming ~4 classes per month
                                                            return (payment_amount * studentCount * months).toFixed(2);
                                                        case 'monthly':
                                                            // Fixed monthly rate × months
                                                            const totalMonths = Math.ceil(total_classes / 4);
                                                            return (payment_amount * totalMonths).toFixed(2);
                                                        case 'per_class_total':
                                                            // Total amount for all students per class × total classes
                                                            return (payment_amount * total_classes).toFixed(2);
                                                        case 'total_duration':
                                                            // Total amount for entire duration (fixed)
                                                            return payment_amount.toFixed(2);
                                                        default:
                                                            return payment_amount.toFixed(2);
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-green-700">Per Class:</span>
                                            <span className="font-medium ml-2">
                                                ₹{(() => {
                                                    const { payment_type, payment_amount, total_classes } = formData;
                                                    switch (payment_type) {
                                                        case 'per_class':
                                                            // Amount per class (as entered)
                                                            return payment_amount.toFixed(2);
                                                        case 'per_student_per_class':
                                                            // Amount per student per class × students
                                                            return (payment_amount * studentCount).toFixed(2);
                                                        case 'per_member':
                                                            // Monthly amount per member × students ÷ classes per month
                                                            const classesPerMonth = total_classes / Math.ceil(total_classes / 4);
                                                            return (payment_amount * studentCount / classesPerMonth).toFixed(2);
                                                        case 'monthly':
                                                            // Fixed monthly rate ÷ classes per month
                                                            const avgClassesPerMonth = total_classes / Math.ceil(total_classes / 4);
                                                            return (payment_amount / avgClassesPerMonth).toFixed(2);
                                                        case 'per_class_total':
                                                            // Total amount for all students per class (as entered)
                                                            return payment_amount.toFixed(2);
                                                        case 'total_duration':
                                                            // Total duration amount ÷ total classes
                                                            return (payment_amount / total_classes).toFixed(2);
                                                        default:
                                                            return (payment_amount / total_classes).toFixed(2);
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-green-700">Total Classes:</span>
                                            <span className="font-medium ml-2">{formData.total_classes}</span>
                                        </div>
                                        {(formData.payment_type === 'per_student_per_class' || formData.payment_type === 'per_member' || formData.payment_type === 'per_class_total') && (
                                            <div>
                                                <span className="text-green-700">Students:</span>
                                                <span className="font-medium ml-2">{studentCount}</span>
                                                <span className="text-xs text-gray-500 ml-1">
                                                    {formData.booking_id ? '(from selected booking)' : '(default)'}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-green-700">Duration:</span>
                                            <span className="font-medium ml-2">
                                                {formData.assignment_type === 'weekly'
                                                    ? `Until ${formData.end_date ? new Date(formData.end_date).toLocaleDateString() : 'end of year'}`
                                                    : `${formData.course_duration_value} ${formData.course_duration_unit}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Client Info Display */}
                            {(formData.client_name || formData.client_email) && (
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                                    {formData.client_name && (
                                        <p className="text-sm text-gray-700">Name: {formData.client_name}</p>
                                    )}
                                    {formData.client_email && (
                                        <p className="text-sm text-gray-700">Email: {formData.client_email}</p>
                                    )}
                                </div>
                            )}

                            {/* Timezone Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => onInputChange('timezone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select your timezone</option>
                                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                                    <option value="UTC-7">Mountain Time (UTC-7)</option>
                                    <option value="UTC-6">Central Time (UTC-6)</option>
                                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                                    <option value="UTC+0">GMT (UTC+0)</option>
                                    <option value="UTC+1">Central European Time (UTC+1)</option>
                                    <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
                                    <option value="UTC+8">Singapore Time (UTC+8)</option>
                                    <option value="UTC+9">Japan Time (UTC+9)</option>
                                </select>
                            </div>

                            {/* Package Assignment Method Selection */}
                            {['package', 'monthly', 'crash_course'].includes(formData.assignment_type) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        {formData.assignment_type === 'monthly' ? 'Monthly Package Assignment Method' :
                                            formData.assignment_type === 'crash_course' ? 'Crash Course Assignment Method' :
                                                'Package Assignment Method'}
                                    </label>
                                    <div className="space-y-4">
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="weekly-recurrence"
                                                    name="package_method"
                                                    checked={formData.monthly_assignment_method === 'weekly_recurrence'}
                                                    onChange={() => onInputChange('monthly_assignment_method', 'weekly_recurrence')}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="weekly-recurrence" className="ml-3 text-sm font-medium text-gray-700">
                                                    Weekly Recurrence
                                                </label>
                                            </div>
                                            <p className="ml-7 text-sm text-gray-500 mt-1">
                                                {formData.assignment_type === 'monthly'
                                                    ? 'Select days of the week and time, auto-generate monthly package classes'
                                                    : formData.assignment_type === 'crash_course'
                                                        ? 'Select days of the week and time, auto-generate crash course classes'
                                                        : 'Select days of the week and time, auto-generate until package classes are complete'
                                                }
                                            </p>

                                            {/* Weekly Recurrence Configuration */}
                                            {formData.monthly_assignment_method === 'weekly_recurrence' && (
                                                <div className="ml-7 mt-3 space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Select Days of Week
                                                        </label>
                                                        <div className="grid grid-cols-7 gap-2">
                                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                                <label key={day} className="flex items-center justify-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.weekly_days.includes(index)}
                                                                        onChange={(e) => {
                                                                            const newDays = e.target.checked
                                                                                ? [...formData.weekly_days, index]
                                                                                : formData.weekly_days.filter(d => d !== index)
                                                                            onInputChange('weekly_days', newDays)
                                                                        }}
                                                                        className="sr-only"
                                                                    />
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border ${formData.weekly_days.includes(index)
                                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                                        }`}>
                                                                        {day}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        {errors.weekly_days && <p className="text-red-500 text-sm mt-1">{errors.weekly_days}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="manual-calendar"
                                                    name="package_method"
                                                    checked={formData.monthly_assignment_method === 'manual_calendar'}
                                                    onChange={() => onInputChange('monthly_assignment_method', 'manual_calendar')}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="manual-calendar" className="ml-3 text-sm font-medium text-gray-700">
                                                    Manual Calendar Selection
                                                </label>
                                            </div>
                                            <p className="ml-7 text-sm text-gray-500 mt-1">
                                                {formData.assignment_type === 'monthly'
                                                    ? 'Manually pick each monthly package class date and time from calendar'
                                                    : formData.assignment_type === 'crash_course'
                                                        ? 'Manually pick each crash course class date and time from calendar'
                                                        : 'Manually pick each class date and time from calendar'
                                                }
                                            </p>

                                            {/* Manual Calendar Configuration */}
                                            {formData.monthly_assignment_method === 'manual_calendar' && (
                                                <div className="ml-7 mt-3">
                                                    <ManualCalendarSelector
                                                        selections={formData.manual_selections || []}
                                                        onSelectionsChange={(selections) => onInputChange('manual_selections', selections)}
                                                        totalClasses={formData.total_classes}
                                                    />
                                                    {errors.manual_selections && <p className="text-red-500 text-sm mt-1">{errors.manual_selections}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => onInputChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Additional notes or instructions..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving || (conflictWarning?.severity === 'error')}
                            >
                                {saving ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Create Assignment
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
