import { Calendar, Clock, User, X } from 'lucide-react'
import { ClassAssignment, getBookingIds, getPrimaryClientDisplay } from '../types'
import { formatDate, formatTime, getStatusStyle } from '../utils'
import { ClientDisplay } from './ClientDisplay'

interface ClassDetailsPopupProps {
    assignment: ClassAssignment | null
    isVisible: boolean
    onClose: () => void
    onEdit?: (assignment: ClassAssignment) => void
}

export const ClassDetailsPopup = ({ assignment, isVisible, onClose, onEdit }: ClassDetailsPopupProps) => {
    if (!isVisible || !assignment) return null

    const statusStyle = getStatusStyle(assignment)

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal: edge-to-edge on small screens, centered with max-width on larger */}
            <div className="flex min-h-full items-center justify-center sm:p-4 p-0">
                <div className="relative bg-white sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Class Details</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        {/* Class Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Class Type</h3>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {assignment.class_type?.name || 'N/A'}
                                    </p>
                                    {assignment.class_type?.difficulty_level && (
                                        <p className="text-sm text-gray-600">
                                            Difficulty: {assignment.class_type.difficulty_level}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Instructor</h3>
                                    <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <p className="text-gray-900">
                                            {assignment.instructor_profile?.full_name || 'N/A'}
                                        </p>
                                    </div>
                                    {assignment.instructor_profile?.email && (
                                        <p className="text-sm text-gray-600 ml-6">
                                            {assignment.instructor_profile.email}
                                        </p>
                                    )}
                                </div>

                                {getPrimaryClientDisplay(assignment) && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Client Information</h3>
                                        <ClientDisplay
                                            assignment={assignment}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Schedule & Status */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Schedule</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="text-gray-900">{formatDate(assignment.date)}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <p className="text-gray-900">
                                                {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                    <div className="space-y-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyle.bgColor} ${statusStyle.borderColor} ${statusStyle.textColor}`}>
                                            {statusStyle.label}
                                        </span>

                                        {assignment.class_status && (
                                            <p className="text-sm text-gray-600">
                                                Class Status: {assignment.class_status}
                                            </p>
                                        )}

                                        {assignment.instructor_response_at && (
                                            <p className="text-sm text-gray-600">
                                                Response: {new Date(assignment.instructor_response_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Assignment Type</h3>
                                    <p className="text-gray-900 capitalize">
                                        {assignment.schedule_type || 'adhoc'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment information intentionally hidden in mobile/app view */}

                        {/* Additional Information */}
                        <div className="mt-6 space-y-4">
                            {getBookingIds(assignment).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Booking Reference{getBookingIds(assignment).length > 1 ? 's' : ''}</h3>
                                    <div className="space-y-1">
                                        {getBookingIds(assignment).map((bookingId, index) => (
                                            <p key={index} className="text-gray-900 font-mono text-sm">{bookingId}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {assignment.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-gray-900">{assignment.notes}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Assignment Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Created:</p>
                                        <p className="text-gray-900">
                                            {new Date(assignment.assigned_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">ID:</p>
                                        <p className="text-gray-900 font-mono">{assignment.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 px-4 sm:px-6 py-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Close
                        </button>
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onEdit(assignment)
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Edit Assignment
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}