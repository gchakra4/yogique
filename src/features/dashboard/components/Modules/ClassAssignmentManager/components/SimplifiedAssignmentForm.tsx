import { IndianRupee, Plus, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Booking, ClassType, Package, UserProfile } from '../types'
import { AssignUserModal } from './AssignUserModal'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { QuickBookingForm } from './QuickBookingForm'

interface SimplifiedAssignmentFormProps {
    isVisible: boolean
    classTypes: ClassType[]  // Not used in current simplified UI
    packages: Package[]
    instructors: UserProfile[]
    bookings: Booking[]
    saving: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    onBookingCreated?: () => Promise<void> // Callback to refresh bookings list
    initialSelectedBookingId?: string
}

export const SimplifiedAssignmentForm = ({
    isVisible,
    // classTypes not used in simplified form
    packages,
    instructors,
    bookings,
    saving,
    onClose,
    onSubmit,
    onBookingCreated
    ,
    initialSelectedBookingId
}: SimplifiedAssignmentFormProps) => {
    // Step 1: Booking selection (MANDATORY)
    const [selectedBookingId, setSelectedBookingId] = useState(initialSelectedBookingId || '')
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [showQuickBooking, setShowQuickBooking] = useState(false)
    const [showAssignUserModal, setShowAssignUserModal] = useState(false)

    // ⚡ PHASE 2: Booking access status tracking
    const [bookingAccessStatus, setBookingAccessStatus] = useState<'active' | 'overdue_grace' | 'overdue_locked' | null>(null)
    const [accessWarning, setAccessWarning] = useState<string | null>(null)

    // Step 2: Assignment type (defaults to monthly)
    const [assignmentType, setAssignmentType] = useState<'monthly' | 'crash_course' | 'adhoc'>('monthly')

    // Step 3: Package (auto-filtered, auto-selected)
    const [selectedPackageId, setSelectedPackageId] = useState('')

    // Step 4: Scheduling
    const [startDate, setStartDate] = useState('')
    const [selectedDays, setSelectedDays] = useState<number[]>([]) // 0=Sun, 1=Mon, etc
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')

    // Step 5: Instructor & Payment
    const [instructorId, setInstructorId] = useState('')
    const [paymentAmount, setPaymentAmount] = useState(0)

    // Advanced options
    const [useManualCalendar, setUseManualCalendar] = useState(false)
    const [notes, setNotes] = useState('')

    // Validation & errors
    const [errors, setErrors] = useState<any>({})

    // When booking selected, load booking details and check access status
    useEffect(() => {
        if (initialSelectedBookingId) {
            setSelectedBookingId(initialSelectedBookingId)
        }
    }, [initialSelectedBookingId])

    useEffect(() => {
        if (selectedBookingId) {
            const booking = bookings.find(b => b.booking_id === selectedBookingId)
            setSelectedBooking(booking || null)

            // ⚡ PHASE 2: Check booking access status
            if (booking) {
                const accessStatus = (booking as any).access_status || 'active'
                setBookingAccessStatus(accessStatus)

                if (accessStatus === 'overdue_locked') {
                    setAccessWarning('⛔ BLOCKED: Payment overdue. Cannot schedule new classes until payment is cleared.')
                } else if (accessStatus === 'overdue_grace') {
                    setAccessWarning('⚠️ WARNING: Payment approaching overdue. Please settle dues soon to avoid service interruption.')
                } else {
                    setAccessWarning(null)
                }
            }

            // Auto-suggest assignment type based on booking
            if (booking?.class_package_id) {
                const pkg = packages.find(p => p.id === booking.class_package_id)
                if (pkg?.course_type === 'crash') {
                    setAssignmentType('crash_course')
                } else {
                    setAssignmentType('monthly')
                }
            }
        } else {
            setBookingAccessStatus(null)
            setAccessWarning(null)
        }
    }, [selectedBookingId, bookings, packages])

    // Auto-filter packages based on assignment type and booking type
    const filteredPackages = packages.filter(pkg => {
        if (assignmentType === 'monthly') {
            return pkg.course_type === 'regular' && pkg.is_active
        } else if (assignmentType === 'crash_course') {
            return pkg.course_type === 'crash' && pkg.is_active
        }
        return false
    })

    // Auto-select package if only one match
    useEffect(() => {
        if (filteredPackages.length === 1 && !selectedPackageId) {
            setSelectedPackageId(filteredPackages[0].id)
        }
    }, [filteredPackages])

    // Auto-fill payment from package
    useEffect(() => {
        if (selectedPackageId) {
            const pkg = packages.find(p => p.id === selectedPackageId)
            if (pkg) {
                setPaymentAmount(pkg.price)
            }
        }
    }, [selectedPackageId, packages])

    const handleQuickBookingCreated = async (bookingId: string) => {
        // Refresh bookings list from parent
        if (onBookingCreated) {
            await onBookingCreated()
        }
        // Now select the newly created booking
        setSelectedBookingId(bookingId)
        setShowQuickBooking(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        const newErrors: any = {}
        if (!selectedBookingId) newErrors.booking = 'Booking is required'
        if (!instructorId) newErrors.instructor = 'Instructor is required'
        if (!startDate) newErrors.startDate = 'Start date is required'

        if (assignmentType !== 'adhoc') {
            if (!selectedPackageId) newErrors.package = 'Package is required'
            if (selectedDays.length === 0) newErrors.days = 'Select at least one day'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        // Prepare submission data
        const submissionData = {
            booking_id: selectedBookingId,
            assignment_type: assignmentType,
            package_id: selectedPackageId,
            instructor_id: instructorId,
            start_date: startDate,
            start_time: startTime,
            end_time: endTime,
            weekly_days: selectedDays,
            payment_amount: paymentAmount,
            booking_type: selectedBooking?.booking_type || 'individual',
            notes,
            // Mark booking as recurring for monthly/crash
            mark_recurring: assignmentType !== 'adhoc'
        }

        onSubmit(submissionData)
    }

    if (!isVisible) return null

    console.log('SimplifiedAssignmentForm rendering with:', { isVisible, bookingsCount: bookings.length, packagesCount: packages.length })

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Create Class Assignment</h2>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Monthly classes are the default. Select booking first to continue.</p>
                        </div>

                        <div className="px-6 py-4 space-y-6">
                            {/* STEP 1: BOOKING SELECTION (MANDATORY) */}
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
                                    Select Booking (Required)
                                </h3>

                                {!showQuickBooking ? (
                                    <div className="space-y-3">
                                        <select
                                            value={selectedBookingId}
                                            onChange={(e) => setSelectedBookingId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                        >
                                            <option value="">-- Select existing booking --</option>
                                            {bookings
                                                .filter(b => ['pending', 'confirmed'].includes(b.status))
                                                .map(booking => (
                                                    <option key={booking.id} value={booking.booking_id}>
                                                        {booking.first_name} {booking.last_name} - {booking.email} ({booking.booking_type})
                                                    </option>
                                                ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => setShowQuickBooking(true)}
                                            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Or create new quick booking
                                        </button>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowAssignUserModal(true)}
                                                className="text-sm text-green-600 hover:text-green-800 inline-flex items-center"
                                            >
                                                Assign User to Group
                                            </button>
                                        </div>

                                        {errors.booking && <p className="text-red-600 text-sm">{errors.booking}</p>}
                                    </div>
                                ) : (
                                    <QuickBookingForm
                                        onBookingCreated={handleQuickBookingCreated}
                                        onCancel={() => setShowQuickBooking(false)}
                                    />
                                )}

                                {/* Show booking details when selected */}
                                {selectedBooking && !showQuickBooking && (
                                    <div className="mt-3 space-y-2">
                                        {/* ⚡ PHASE 2: Access Status Warning */}
                                        {accessWarning && (
                                            <div className={`p-3 rounded border ${bookingAccessStatus === 'overdue_locked'
                                                ? 'bg-red-50 border-red-300 text-red-800'
                                                : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                                                }`}>
                                                <p className="text-sm font-medium">{accessWarning}</p>
                                                {bookingAccessStatus === 'overdue_locked' && (
                                                    <p className="text-xs mt-1">Existing scheduled classes will remain, but no new classes can be created.</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-3 bg-white rounded border">
                                            <div className="text-sm space-y-1">
                                                <p><strong>Customer:</strong> {selectedBooking.first_name} {selectedBooking.last_name}</p>
                                                <p><strong>Email:</strong> {selectedBooking.email}</p>
                                                <p><strong>Type:</strong> {selectedBooking.booking_type}</p>
                                                {selectedBooking.class_packages && (
                                                    <p><strong>Package:</strong> {selectedBooking.class_packages.name}</p>
                                                )}
                                                {bookingAccessStatus && bookingAccessStatus === 'active' && (
                                                    <p className="text-green-600 text-xs mt-2">✓ Payment status: Active</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: ASSIGNMENT TYPE (only if booking selected) */}
                            {selectedBookingId && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
                                        Assignment Type
                                    </h3>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: 'monthly', label: 'Monthly Package', desc: 'Regular recurring classes' },
                                            { value: 'crash_course', label: 'Crash Course', desc: 'Intensive short-term' },
                                            { value: 'adhoc', label: 'Single Class', desc: 'One-time only' }
                                        ].map(type => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setAssignmentType(type.value as any)}
                                                className={`p-3 border rounded-lg text-left transition-colors ${assignmentType === type.value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="font-medium text-sm">{type.label}</div>
                                                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PACKAGE (auto-filtered, only for monthly/crash) */}
                            {selectedBookingId && assignmentType !== 'adhoc' && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                                        Package
                                    </h3>

                                    {filteredPackages.length === 0 ? (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                            No packages available for {assignmentType}. Please create a package first.
                                        </div>
                                    ) : filteredPackages.length === 1 ? (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                                            <p className="text-sm text-green-800">
                                                <strong>Auto-selected:</strong> {filteredPackages[0].name}
                                            </p>
                                            <p className="text-xs text-green-600 mt-1">
                                                {filteredPackages[0].class_count} classes • ₹{filteredPackages[0].price}
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedPackageId}
                                            onChange={(e) => setSelectedPackageId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">-- Select package --</option>
                                            {filteredPackages.map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name} - {pkg.class_count} classes (₹{pkg.price})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.package && <p className="text-red-600 text-sm mt-1">{errors.package}</p>}
                                </div>
                            )}

                            {/* STEP 4: SCHEDULING */}
                            {selectedBookingId && (assignmentType !== 'adhoc' ? selectedPackageId : true) && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
                                        Schedule Classes
                                    </h3>

                                    {/* Start Date */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                        {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
                                    </div>

                                    {/* Day selection (monthly/crash only) */}
                                    {assignmentType !== 'adhoc' && !useManualCalendar && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Days of Week <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-7 gap-2">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedDays(prev =>
                                                                prev.includes(index)
                                                                    ? prev.filter(d => d !== index)
                                                                    : [...prev, index].sort()
                                                            )
                                                        }}
                                                        className={`p-2 rounded-lg text-sm font-medium border transition-colors ${selectedDays.includes(index)
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.days && <p className="text-red-600 text-sm mt-1">{errors.days}</p>}

                                            <button
                                                type="button"
                                                onClick={() => setUseManualCalendar(!useManualCalendar)}
                                                className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                                            >
                                                Advanced: Use manual calendar instead
                                            </button>
                                        </div>
                                    )}

                                    {/* Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Time <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Time <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: INSTRUCTOR & PAYMENT */}
                            {selectedBookingId && (assignmentType !== 'adhoc' ? selectedPackageId : true) && startDate && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
                                        Instructor & Payment
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Instructor <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={instructorId}
                                                onChange={(e) => setInstructorId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            >
                                                <option value="">-- Select instructor --</option>
                                                {instructors.map(inst => (
                                                    <option key={inst.user_id} value={inst.user_id}>
                                                        {inst.full_name} ({inst.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.instructor && <p className="text-red-600 text-sm mt-1">{errors.instructor}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <IndianRupee className="w-4 h-4 inline mr-1" />
                                                Payment Amount (INR)
                                            </label>
                                            <input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                min="0"
                                                step="0.01"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Auto-filled from package. Adjust if needed.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Notes (Optional)
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="Any additional notes..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving || !selectedBookingId || bookingAccessStatus === 'overdue_locked'}
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
                    {showAssignUserModal && (
                        <AssignUserModal
                            isOpen={showAssignUserModal}
                            onClose={() => setShowAssignUserModal(false)}
                            defaultPackageId={selectedPackageId || undefined}
                            onAssigned={(bookingId: string) => {
                                setSelectedBookingId(bookingId)
                                setShowAssignUserModal(false)
                                if (onBookingCreated) onBookingCreated()
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
