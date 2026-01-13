import { Calendar, ChevronDown, ChevronRight, Clock, MapPin, Package, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { ClassAssignment, getPrimaryClientDisplay } from '../types'
import { formatDate, formatTime, getStatusStyle } from '../utils'
import { ClientDisplay } from './ClientDisplay'
import { LoadingSpinner } from './LoadingSpinner'

interface AssignmentGroup {
    key: string
    type: string
    containerId: string | null
    containerCode: string | null
    assignments: ClassAssignment[]
    groupInfo: {
        instructor_name: string
        class_type_name: string
        total_revenue: number
        assignment_count: number
        client_names?: string
        pattern_description?: string
    }
}

interface AssignmentListViewProps {
    loading: boolean
    groupedAssignments: AssignmentGroup[]
    isSelectMode: boolean
    selectedAssignments: Set<string>
    onToggleSelection: (assignmentId: string) => void
    onDeleteAssignment: (assignmentId: string, assignmentTitle: string) => void
    onOpenClassDetails: (assignment: ClassAssignment) => void
}

export const AssignmentListView = ({
    loading,
    groupedAssignments,
    isSelectMode,
    selectedAssignments,
    onToggleSelection,
    onDeleteAssignment,
    onOpenClassDetails
}: AssignmentListViewProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groupedAssignments.map(g => g.key)))

    const toggleGroupExpansion = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups)
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey)
        } else {
            newExpanded.add(groupKey)
        }
        setExpandedGroups(newExpanded)
    }
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (groupedAssignments.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new class assignment.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-hidden">
            <div className="space-y-2">
                {groupedAssignments.map(group => (
                    <div key={group.key} className="bg-white border-b border-gray-200 overflow-hidden min-w-0">
                        {/* Group Header */}
                        <div
                            className="bg-white px-3 py-3 border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
                            onClick={() => toggleGroupExpansion(group.key)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                        {/* Expand/Contract Button */}
                                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                                            {expandedGroups.has(group.key) ? (
                                                <ChevronDown className="w-5 h-5 text-gray-600" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-600" />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {group.groupInfo.class_type_name}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${group.type === 'weekly' ? 'bg-blue-100 text-blue-800' :
                                                    group.type === 'monthly' ? 'bg-green-100 text-green-800' :
                                                        group.type === 'crash_course' ? 'bg-red-100 text-red-800' :
                                                            group.type === 'package' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {group.type === 'crash_course' ? 'Crash Course' :
                                                        group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                                                </span>
                                                {/* Container Code Badge */}
                                                {group.containerCode && (
                                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 border border-indigo-300 rounded text-xs font-medium bg-indigo-50 text-indigo-800">
                                                        <Package size={12} />
                                                        <span>{group.containerCode}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center mt-1 text-sm text-gray-600 space-x-4">
                                                <span className="flex items-center">
                                                    <User className="w-4 h-4 mr-1" />
                                                    {group.groupInfo.instructor_name}
                                                </span>
                                                {group.groupInfo.client_names && (
                                                    <span className="flex items-center">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        {group.groupInfo.client_names}
                                                    </span>
                                                )}
                                                {group.groupInfo.pattern_description && (
                                                    <span className="text-blue-600">
                                                        {group.groupInfo.pattern_description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Remaining/Total classes for Group */}
                                {(() => {
                                    const today = new Date()
                                    const yyyyMm = today.toISOString().slice(0, 7)

                                    // Compute the set of assignments that define the "period" for counting
                                    // - monthly: only classes within the current month
                                    // - crash_course: full duration (all assignments in the group)
                                    // - others: full group's assignments
                                    let inPeriod: typeof group.assignments = []
                                    if (group.type === 'monthly') {
                                        inPeriod = group.assignments.filter(a => (a.date || '').startsWith(yyyyMm))
                                    } else if (group.type === 'crash_course') {
                                        inPeriod = group.assignments
                                    } else {
                                        inPeriod = group.assignments
                                    }

                                    const total = inPeriod.length

                                    // Remaining = classes that are scheduled for today or later and not completed/cancelled
                                    const todayDateOnly = new Date(today.toISOString().slice(0,10))
                                    const remaining = inPeriod.filter(a => {
                                        if (!a.date) return false
                                        const d = new Date(a.date)
                                        const futureOrToday = d >= todayDateOnly
                                        const notCompleted = a.class_status !== 'completed' && a.class_status !== 'cancelled'
                                        return futureOrToday && notCompleted
                                    }).length

                                    return (
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">Remaining / Total</div>
                                            <div className="text-lg font-semibold text-gray-900">{remaining} / {total} classes</div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>

                        {/* Group Assignments - Collapsible */}
                        {expandedGroups.has(group.key) && (
                            <div className="divide-y divide-gray-100">
                                {group.assignments.map((assignment) => {
                                    const statusStyle = getStatusStyle(assignment)
                                    return (
                                        <div
                                            key={assignment.id}
                                            className="px-3 py-3 active:bg-gray-50 transition-colors cursor-pointer min-w-0 border-b border-gray-50 last:border-b-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!isSelectMode) {
                                                    onOpenClassDetails(assignment)
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 flex-1 min-w-0">
                                                    {/* Checkbox for multi-select */}
                                                    {isSelectMode && (
                                                        <div
                                                            className="flex-shrink-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onToggleSelection(assignment.id)
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAssignments.has(assignment.id)}
                                                                onChange={() => onToggleSelection(assignment.id)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Status Indicator */}
                                                    <div className="flex-shrink-0">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bgColor} ${statusStyle.borderColor} ${statusStyle.textColor}`}>
                                                            {statusStyle.label}
                                                        </span>
                                                    </div>

                                                    {/* Class Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-600">
                                                            <div className="flex items-center mb-1 sm:mb-0">
                                                                <Calendar className="w-4 h-4 mr-1" />
                                                                {formatDate(assignment.date)}
                                                            </div>
                                                            <div className="flex items-center mb-1 sm:mb-0">
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}
                                                            </div>
                                                            {/* Client info - only show if different from group */}
                                                            {getPrimaryClientDisplay(assignment) && getPrimaryClientDisplay(assignment) !== group.groupInfo.client_names && (
                                                                <ClientDisplay
                                                                    assignment={assignment}
                                                                    className="mt-1 sm:mt-0"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                                                    {!isSelectMode && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onDeleteAssignment(
                                                                    assignment.id,
                                                                    `${assignment.class_type?.name || 'Class'} on ${formatDate(assignment.date)}`
                                                                )
                                                            }}
                                                            className="p-1 text-red-600 hover:text-red-800 transition-all"
                                                            title="Delete assignment"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {assignment.notes && (
                                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                    {assignment.notes}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}