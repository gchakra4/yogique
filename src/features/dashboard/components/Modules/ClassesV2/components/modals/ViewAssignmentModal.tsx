import { supabase } from '@/shared/lib/supabase'
import { Calendar, Clock, FileText, Tag, User, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    assignment: any | null
    onEdit?: () => void
}

export default function ViewAssignmentModal({
    isOpen,
    onClose,
    assignment,
    onEdit,
}: Props) {
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)

    // Fetch enrolled students for this assignment
    useEffect(() => {
        async function fetchEnrolledStudents() {
            if (!isOpen || !assignment?.id) return

            setLoadingStudents(true)
            try {
                const { data, error } = await supabase
                    .from('assignment_bookings')
                    .select('booking_id, bookings:booking_id(booking_id, first_name, last_name, email, status)')
                    .eq('assignment_id', assignment.id)

                if (error) throw error

                setEnrolledStudents(data || [])
            } catch (err) {
                console.warn('Failed to fetch enrolled students:', err)
                setEnrolledStudents([])
            } finally {
                setLoadingStudents(false)
            }
        }

        fetchEnrolledStudents()
    }, [isOpen, assignment?.id])

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEnrolledStudents([])
        }
    }, [isOpen])

    if (!isOpen || !assignment) return null

    const date = assignment.date ? new Date(assignment.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '—'

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Class Details</h3>
                    <div className="flex gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                            >
                                Edit
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Class Information */}
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Date</div>
                                <div className="text-sm font-medium text-gray-900">{date}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Time</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {assignment.start_time || '—'} - {assignment.end_time || '—'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Instructor</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {assignment.instructor?.full_name || assignment.instructor_id || 'Unassigned'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Tag className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Status</div>
                                <div className="text-sm font-medium text-gray-900 capitalize">
                                    {assignment.class_status || 'scheduled'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {assignment.notes && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Notes</div>
                                <div className="text-sm text-gray-700">{assignment.notes}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Enrolled Students Section */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-gray-600" />
                        <h4 className="text-lg font-semibold text-gray-900">Enrolled Students</h4>
                        <span className="text-sm text-gray-500">({enrolledStudents.length})</span>
                    </div>

                    {loadingStudents ? (
                        <p className="text-sm text-gray-500">Loading students...</p>
                    ) : enrolledStudents.length === 0 ? (
                        <p className="text-sm text-gray-500">No students enrolled in this class yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {enrolledStudents.map((item: any, idx: number) => {
                                const booking = item.bookings
                                const studentName = (booking?.first_name || booking?.last_name)
                                    ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
                                    : booking?.booking_id || item.booking_id

                                return (
                                    <div key={`${item.booking_id}-${idx}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{studentName}</div>
                                            {booking?.email && (
                                                <div className="text-xs text-gray-500 mt-0.5">{booking.email}</div>
                                            )}
                                        </div>
                                        <div className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                                            {booking?.status || 'enrolled'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
