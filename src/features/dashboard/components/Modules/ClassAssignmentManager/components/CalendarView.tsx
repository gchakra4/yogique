import { Calendar, ChevronLeft, ChevronRight, IndianRupee, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { ClassAssignment, getPrimaryClientDisplay } from '../types'
import { formatDate, formatTime, getStatusStyle } from '../utils'
import { Button } from './Button'
import { ClientDisplay } from './ClientDisplay'

interface CalendarViewProps {
    assignments: ClassAssignment[]
    isSelectMode: boolean
    selectedAssignments: Set<string>
    onToggleSelection: (assignmentId: string) => void
    onDeleteAssignment: (assignmentId: string, assignmentTitle: string) => void
    onOpenClassDetails: (assignment: ClassAssignment) => void
}

export const CalendarView = ({
    assignments,
    isSelectMode,
    selectedAssignments,
    onToggleSelection,
    onDeleteAssignment,
    onOpenClassDetails
}: CalendarViewProps) => {
    const [currentWeek, setCurrentWeek] = useState(() => {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay()) // Start on Sunday
        return startOfWeek
    })

    // Generate week dates
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeek)
        date.setDate(currentWeek.getDate() + i)
        return date
    })

    // Generate hours (24-hour format)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    // Navigation functions
    const goToPreviousWeek = () => {
        const prevWeek = new Date(currentWeek)
        prevWeek.setDate(currentWeek.getDate() - 7)
        setCurrentWeek(prevWeek)
    }

    const goToNextWeek = () => {
        const nextWeek = new Date(currentWeek)
        nextWeek.setDate(currentWeek.getDate() + 7)
        setCurrentWeek(nextWeek)
    }

    const goToToday = () => {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        setCurrentWeek(startOfWeek)
    }

    // Filter assignments for current week
    const weekAssignments = assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.date)
        return assignmentDate >= weekDates[0] && assignmentDate <= weekDates[6]
    })

    // Get assignments for a specific day and hour
    const getAssignmentsForTimeSlot = (date: Date, hour: number) => {
        const dateStr = date.toISOString().split('T')[0]
        return weekAssignments.filter(assignment => {
            if (assignment.date !== dateStr) return false
            if (!assignment.start_time) return false

            const startHour = parseInt(assignment.start_time.split(':')[0])
            const startMinute = parseInt(assignment.start_time.split(':')[1])
            const endHour = assignment.end_time ? parseInt(assignment.end_time.split(':')[0]) : startHour + 1
            const endMinute = assignment.end_time ? parseInt(assignment.end_time.split(':')[1]) : 0

            // Check if the time slot overlaps with the assignment time
            const slotStart = hour * 60
            const slotEnd = (hour + 1) * 60
            const assignmentStart = startHour * 60 + startMinute
            const assignmentEnd = endHour * 60 + endMinute

            return slotStart < assignmentEnd && slotEnd > assignmentStart
        })
    }

    // Calculate assignment height based on duration
    const getAssignmentHeight = (assignment: ClassAssignment) => {
        if (!assignment.start_time || !assignment.end_time) return 60 // Default 1 hour

        const startTime = assignment.start_time.split(':').map(Number)
        const endTime = assignment.end_time.split(':').map(Number)
        const startMinutes = startTime[0] * 60 + startTime[1]
        const endMinutes = endTime[0] * 60 + endTime[1]
        const durationMinutes = endMinutes - startMinutes

        return Math.max(30, durationMinutes) // Minimum 30px height
    }

    // Calculate assignment position within the hour
    const getAssignmentPosition = (assignment: ClassAssignment, hour: number) => {
        if (!assignment.start_time) return 0

        const startTime = assignment.start_time.split(':').map(Number)
        const startMinutes = startTime[0] * 60 + startTime[1]
        const hourStartMinutes = hour * 60

        if (startMinutes < hourStartMinutes) return 0

        const minutesIntoHour = startMinutes - hourStartMinutes
        return (minutesIntoHour / 60) * 60 // Convert to pixels (60px per hour)
    }

    const today = new Date()
    const isToday = (date: Date) => {
        return date.toDateString() === today.toDateString()
    }

    return (
        <div className="h-full flex flex-col">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Weekly Calendar
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-600">
                        {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
                        {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 text-xs sm:text-sm"
                        onClick={goToToday}
                    >
                        Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-full">
                    {/* Day Headers */}
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 text-xs sm:text-sm">
                        <div className="p-2 sm:p-3 font-medium text-gray-500">Time</div>
                        {weekDates.map((date, index) => (
                            <div key={index} className={`p-2 sm:p-3 text-center ${isToday(date) ? 'bg-blue-50' : ''}`}>
                                <div className="font-medium text-gray-900">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                                </div>
                                <div className={`text-sm sm:text-lg font-semibold mt-0.5 sm:mt-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-900'
                                    }`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Body - Full 24-hour view */}
                    <div className="relative">
                        {hours.map(hour => (
                            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[40px] sm:min-h-[60px]">
                                {/* Time column */}
                                <div className="p-1.5 sm:p-2 text-xs sm:text-sm text-gray-500 border-r border-gray-100 bg-gray-50">
                                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </div>

                                {/* Day columns */}
                                {weekDates.map((date, dayIndex) => {
                                    const timeSlotAssignments = getAssignmentsForTimeSlot(date, hour)

                                    return (
                                        <div key={dayIndex} className={`relative border-r border-gray-100 min-h-[40px] sm:min-h-[60px] p-0.5 sm:p-1 ${isToday(date) ? 'bg-blue-25' : ''
                                            }`}>
                                            {/* Find assignments for this day and time slot */}
                                            {timeSlotAssignments.map(assignment => {
                                                const statusStyle = getStatusStyle(assignment)
                                                const height = getAssignmentHeight(assignment)
                                                const position = getAssignmentPosition(assignment, hour)

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className={`absolute left-1 right-1 rounded p-1 text-[10px] sm:text-xs cursor-pointer transition-all hover:shadow-md group ${statusStyle.bgColor} ${statusStyle.borderColor} border-l-2`}
                                                        style={{
                                                            top: `${position}px`,
                                                            height: `${Math.min(height, 60 - position)}px`,
                                                            minHeight: '20px'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (!isSelectMode) {
                                                                onOpenClassDetails(assignment)
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between h-full">
                                                            <div className="flex-1 min-w-0">
                                                                {/* Checkbox for multi-select */}
                                                                {isSelectMode && (
                                                                    <div
                                                                        className="float-left mr-1"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            onToggleSelection(assignment.id)
                                                                        }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedAssignments.has(assignment.id)}
                                                                            onChange={() => onToggleSelection(assignment.id)}
                                                                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Delete button - appears on hover */}
                                                                {!isSelectMode && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            onDeleteAssignment(
                                                                                assignment.id,
                                                                                `${assignment.class_type?.name || 'Class'} on ${formatDate(assignment.date)}`
                                                                            )
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 p-0.5 text-red-600 hover:text-red-800 transition-all"
                                                                        title="Delete assignment"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                )}

                                                                {/* Class Type - Prominent */}
                                                                <div className={`font-medium truncate text-xs sm:text-sm ${statusStyle.textColor}`}>
                                                                    {assignment.class_type?.name || 'Class'}
                                                                </div>

                                                                {/* Time */}
                                                                <div className="text-[10px] sm:text-xs opacity-75 truncate">
                                                                    {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}
                                                                </div>

                                                                {/* Instructor Name */}
                                                                <div className="text-[10px] sm:text-xs opacity-75 truncate flex items-center">
                                                                    <User className="w-3 h-3 mr-1" />
                                                                    {assignment.instructor_profile?.full_name || 'Instructor'}
                                                                </div>

                                                                {/* Payment Amount */}
                                                                <div className="text-[10px] sm:text-xs opacity-75 truncate flex items-center">
                                                                    <IndianRupee className="w-3 h-3 mr-1" />
                                                                    ₹{assignment.payment_amount.toFixed(0)}
                                                                </div>

                                                                {/* Client Name if available */}
                                                                {getPrimaryClientDisplay(assignment) && (
                                                                    <div className="text-[10px] sm:text-xs opacity-75 truncate">
                                                                        <ClientDisplay
                                                                            assignment={assignment}
                                                                            compact={true}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Instructor Status Badge */}
                                                                <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor}`}>
                                                                    {statusStyle.label}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Legend */}
            <div className="border-t border-gray-200 px-3 py-2 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded"></div>
                            <span className="text-sm text-gray-600">Accepted</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-100 border-l-2 border-yellow-500 rounded"></div>
                            <span className="text-sm text-gray-600">Pending</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded"></div>
                            <span className="text-sm text-gray-600">Rejected</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gray-100 border-l-2 border-gray-500 rounded"></div>
                            <span className="text-sm text-gray-600">Completed</span>
                        </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                        {weekAssignments.length} assignment{weekAssignments.length !== 1 ? 's' : ''} this week
                    </div>
                </div>
            </div>
        </div>
    )
}