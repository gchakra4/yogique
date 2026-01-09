import { AlertTriangle, Save, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../../shared/lib/supabase'
import { Booking, ClassAssignment, UserProfile } from '../types'
import { MultipleBookingSelector } from './MultipleBookingSelector'

interface EditAssignmentModalProps {
    assignment: ClassAssignment | null
    isVisible: boolean
    bookings: Booking[]
    userProfiles: UserProfile[]
    onClose: () => void
    onSave: (assignmentId: string, updates: Partial<ClassAssignment>) => Promise<void>
    onRefresh?: () => Promise<void>
}

export const EditAssignmentModal = ({
    assignment,
    isVisible,
    bookings,
    onClose,
    onSave,
    onRefresh
}: EditAssignmentModalProps) => {
    const [formData, setFormData] = useState({
        class_status: '',
        payment_amount: 0,
        payment_status: '',
        notes: '',
        booking_ids: [] as string[],
        payment_type: 'per_class',
        total_classes: 1,
        weekly_days: [] as number[],
        monthly_assignment_method: 'weekly_recurrence',
        manual_selections: []
    })
    const [basePaymentAmount, setBasePaymentAmount] = useState(0) // Store the original base amount
    const [saving, setSaving] = useState(false)
    const [studentCount, setStudentCount] = useState(1)

    useEffect(() => {
        if (assignment) {
            // Get booking IDs from the new junction table structure
            let bookingIds: string[] = []
            if (assignment.assignment_bookings && assignment.assignment_bookings.length > 0) {
                bookingIds = assignment.assignment_bookings.map(ab => ab.booking_id)
            }

            setFormData({
                class_status: assignment.class_status || 'scheduled',
                payment_amount: assignment.payment_amount || 0,
                payment_status: assignment.payment_status || 'pending',
                notes: assignment.notes || '',
                booking_ids: bookingIds,
                payment_type: (assignment as any).payment_type || 'per_class',
                total_classes: (assignment as any).total_classes || 1,
                weekly_days: (assignment as any).weekly_days || [],
                monthly_assignment_method: (assignment as any).monthly_assignment_method || 'weekly_recurrence',
                manual_selections: (assignment as any).manual_selections || []
            })

            // Determine base payment amount based on payment type and original student count
            const originalStudentCount = bookingIds.length > 0 ? bookingIds.length : 1
            const paymentType = (assignment as any).payment_type || 'per_class'

            let baseAmount = assignment.payment_amount || 0
            if (paymentType === 'per_student_per_class') {
                // If it's per student, the stored amount is the total, so calculate per-student rate
                baseAmount = originalStudentCount > 0 ? (assignment.payment_amount || 0) / originalStudentCount : (assignment.payment_amount || 0)
            }

            setBasePaymentAmount(baseAmount)
            setStudentCount(originalStudentCount)
        }
    }, [assignment, bookings])

    if (!isVisible || !assignment) return null

    // Calculate payment amount based on current student count and payment type
    const calculateCurrentPaymentAmount = (currentStudentCount: number): number => {
        const paymentType = formData.payment_type || (assignment as any).payment_type || 'per_class'

        switch (paymentType) {
            case 'per_student_per_class':
                // Base amount × current student count
                return basePaymentAmount * currentStudentCount
            case 'per_class':
            case 'per_class_total':
            case 'monthly':
            case 'total_duration':
            default:
                // Fixed amount regardless of student count
                return basePaymentAmount
        }
    }

    const handleInputChange = (field: string, value: any) => {
        if (field === 'payment_amount') {
            // User manually changed payment amount - update base amount
            const paymentType = formData.payment_type || (assignment as any).payment_type || 'per_class'
            if (paymentType === 'per_student_per_class') {
                setBasePaymentAmount(studentCount > 0 ? value / studentCount : value)
            } else {
                setBasePaymentAmount(value)
            }
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleBookingSelectionChange = (bookingIds: string[]) => {
        const newStudentCount = bookingIds.length > 0 ? bookingIds.length : 1
        setStudentCount(newStudentCount)

        // Recalculate payment amount based on payment type and new student count
        const newPaymentAmount = calculateCurrentPaymentAmount(newStudentCount)

        setFormData(prev => ({
            ...prev,
            booking_ids: bookingIds,
            payment_amount: newPaymentAmount
        }))
    }


    const handleSave = async () => {
        if (!assignment) return

        try {
            setSaving(true)

            // For existing assignments, keep the payment amount stable
            // Only recalculate if user manually changed the payment amount
            const finalPaymentAmount = formData.payment_amount

            // Check if bookings have changed and if this assignment is part of a series
            const originalBookingIds = assignment.assignment_bookings?.map(ab => ab.booking_id).sort() || []
            const newBookingIds = formData.booking_ids.filter(id => id && id.trim() !== '').sort()
            const bookingsChanged = JSON.stringify(originalBookingIds) !== JSON.stringify(newBookingIds)

            // Determine if this is a series assignment (not adhoc)
            const isSeriesAssignment = assignment.schedule_type !== 'adhoc'

            // If booking IDs have changed and this is a series assignment, update all future classes
            if (bookingsChanged && isSeriesAssignment) {
                // Find all future classes in the same series
                const currentAssignmentDate = assignment.date

                let query = supabase
                    .from('class_assignments')
                    .select('id, date, schedule_type')
                    .eq('instructor_id', assignment.instructor_id)
                    .eq('schedule_type', assignment.schedule_type)
                    .gte('date', currentAssignmentDate) // Include current date and future
                    .order('date', { ascending: true })

                // Add additional filters based on assignment type
                if (assignment.package_id) {
                    // For package-based assignments, match by package
                    query = query.eq('package_id', assignment.package_id)
                } else if (assignment.class_type_id) {
                    // For non-package assignments, match by class type, time, and duration
                    query = query
                        .eq('class_type_id', assignment.class_type_id)
                        .eq('start_time', assignment.start_time)

                    // Handle NULL end_time properly
                    if (assignment.end_time === null) {
                        query = query.is('end_time', null)
                    } else {
                        query = query.eq('end_time', assignment.end_time)
                    }
                }

                const { data: futureClasses, error: fetchError } = await query

                if (fetchError) {
                    throw new Error(`Failed to fetch future classes: ${fetchError.message}`)
                }

                // Update all future classes in the series (including current class)
                const classesToUpdate = futureClasses || []

                console.log(`Found ${classesToUpdate.length} classes in series to update with new booking associations`)

                if (classesToUpdate.length === 0) {
                    console.log('No future classes found to update')
                } else {
                    // Show user confirmation for significant changes
                    const classCount = classesToUpdate.length
                    const userConfirmed = confirm(
                        `This will update booking assignments for ${classCount} class${classCount !== 1 ? 'es' : ''} in this series.\n\n` +
                        `New students will be added to all remaining classes.\n\n` +
                        `Do you want to continue?`
                    )

                    if (!userConfirmed) {
                        setSaving(false)
                        return
                    }
                }

                // Update booking associations for all matching future classes
                for (const futureClass of classesToUpdate) {
                    // First, delete existing associations for this class
                    const { error: deleteError } = await supabase
                        .from('assignment_bookings')
                        .delete()
                        .eq('assignment_id', futureClass.id)

                    if (deleteError) {
                        console.error('Failed to delete existing booking associations for class:', futureClass.id, deleteError)
                        continue // Skip this class and continue with others
                    }

                    // Then, insert new associations if any bookings are selected
                    if (formData.booking_ids.length > 0) {
                        const associations = formData.booking_ids
                            .filter(bookingId => bookingId && bookingId.trim() !== '')
                            .map(bookingId => ({
                                assignment_id: futureClass.id,
                                booking_id: bookingId.trim()
                            }))

                        if (associations.length > 0) {
                            const { error: insertError } = await supabase
                                .from('assignment_bookings')
                                .insert(associations)

                            if (insertError) {
                                console.error('Failed to create new booking associations for class:', futureClass.id, insertError)
                                continue // Skip this class and continue with others
                            }
                        }
                    }

                    // Update the assignment with other form data
                    const classUpdates: Partial<ClassAssignment> = {
                        payment_amount: finalPaymentAmount,
                        notes: formData.notes || undefined
                    }

                    await onSave(futureClass.id, classUpdates)
                }

                console.log(`Successfully updated ${classesToUpdate.length} future classes with new booking associations`)

                if (onRefresh) {
                    await onRefresh()
                }
                onClose()
                setSaving(false)
                return
            }

            // Default: single assignment update

            // 1. Save assignment updates
            const updates: Partial<ClassAssignment> = {
                class_status: formData.class_status as any,
                payment_amount: finalPaymentAmount,
                payment_status: formData.payment_status as any,
                notes: formData.notes || undefined
            }

            await onSave(assignment.id, updates)

            // 2. Update booking associations in junction table
            // First, delete existing associations
            const { error: deleteError } = await supabase
                .from('assignment_bookings')
                .delete()
                .eq('assignment_id', assignment.id)

            if (deleteError) {
                console.error('Failed to delete existing booking associations:', deleteError)
                throw new Error(`Failed to update booking associations: ${deleteError.message}`)
            }

            // Then, insert new associations if any bookings are selected
            if (formData.booking_ids.length > 0) {
                const associations = formData.booking_ids
                    .filter(bookingId => bookingId && bookingId.trim() !== '')
                    .map(bookingId => ({
                        assignment_id: assignment.id,
                        booking_id: bookingId.trim()
                    }))

                if (associations.length > 0) {
                    const { error: insertError } = await supabase
                        .from('assignment_bookings')
                        .insert(associations)

                    if (insertError) {
                        console.error('Failed to create new booking associations:', insertError)
                        throw new Error(`Failed to link bookings to assignment: ${insertError.message}`)
                    }

                    console.log(`Successfully updated ${associations.length} booking association(s)`)
                }
            }

            // Refresh data to show updated booking associations
            if (onRefresh) {
                await onRefresh()
            }

            onClose()
        } catch (error) {
            console.error('Error saving assignment:', error)
            const errorMessage = error.message || 'Failed to save changes. Please try again.'
            alert(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    const canCancel = formData.class_status !== 'cancelled'
    const canReactivate = formData.class_status === 'cancelled'

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Edit Assignment</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Assignment Overview */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Assignment Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Class Type:</p>
                                    <p className="font-medium">{assignment.class_type?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Date & Time:</p>
                                    <p className="font-medium">{assignment.date} at {assignment.start_time}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Instructor:</p>
                                    <p className="font-medium">{assignment.instructor_profile?.full_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Invalid Booking Warning - Check if any assignment bookings reference non-existent bookings */}
                        {assignment.assignment_bookings && assignment.assignment_bookings.some(ab => !bookings.find(b => b.booking_id === ab.booking_id)) && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Invalid Booking Reference</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            This assignment has booking references that no longer exist. Those bookings have been cleared from the selection.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Form */}
                        <div className="space-y-6">
                            {/* Class Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class Status
                                </label>
                                <select
                                    value={formData.class_status}
                                    onChange={(e) => handleInputChange('class_status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>

                                {formData.class_status === 'cancelled' && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-center">
                                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                                            <p className="text-sm text-red-700">
                                                This class will be marked as cancelled.
                                                {formData.booking_ids.length > 0 && ` Notification emails will be sent to ${formData.booking_ids.length} linked booking${formData.booking_ids.length !== 1 ? 's' : ''}.`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Booking Selection */}
                            <div>
                                <MultipleBookingSelector
                                    bookings={bookings}
                                    selectedBookingIds={formData.booking_ids}
                                    onBookingSelectionChange={handleBookingSelectionChange}
                                    assignmentType={assignment.schedule_type}
                                    bookingTypeFilter={assignment.booking_type}
                                />

                                {/* Student Count Display */}
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-blue-500 mr-2" />
                                        <p className="text-sm text-blue-700">
                                            Students: <span className="font-medium">{studentCount}</span>
                                            {formData.booking_ids.length > 0 ? ` (from ${formData.booking_ids.length} selected booking${formData.booking_ids.length !== 1 ? 's' : ''})` : ' (manual entry)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Series Update Notice */}
                            {assignment.schedule_type !== 'adhoc' && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Series Assignment</p>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Changes to booking assignments will be applied to all remaining classes in this series.
                                                New students will automatically join all future classes.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Information - Hidden from UI but preserved in backend */}
                            <div className="hidden">
                                <div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.payment_amount}
                                        onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <select
                                        value={formData.payment_status}
                                        onChange={(e) => handleInputChange('payment_status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>


                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            {/* Payment Summary - Hidden from UI */}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                            {canCancel && formData.class_status !== 'cancelled' && (
                                <button
                                    onClick={() => handleInputChange('class_status', 'cancelled')}
                                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Cancel Class
                                </button>
                            )}
                            {canReactivate && formData.class_status === 'cancelled' && (
                                <button
                                    onClick={() => handleInputChange('class_status', 'scheduled')}
                                    className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Reactivate Class
                                </button>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
