import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, ChevronDown, ChevronRight, Clock, IndianRupee, MapPin, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { getPrimaryClientDisplay } from '../types';
import { formatDate, formatTime, getStatusStyle } from '../utils';
import { ClientDisplay } from './ClientDisplay';
import { LoadingSpinner } from './LoadingSpinner';
export const AssignmentListView = ({ loading, groupedAssignments, isSelectMode, selectedAssignments, onToggleSelection, onDeleteAssignment, onOpenClassDetails }) => {
    const [expandedGroups, setExpandedGroups] = useState(new Set(groupedAssignments.map(g => g.key)));
    const toggleGroupExpansion = (groupKey) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        }
        else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (groupedAssignments.length === 0) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No assignments found" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Get started by creating a new class assignment." })] }));
    }
    return (_jsx("div", { className: "overflow-x-hidden", children: _jsx("div", { className: "space-y-6", children: groupedAssignments.map(group => (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg overflow-hidden min-w-0", children: [_jsx("div", { className: "bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => toggleGroupExpansion(group.key), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { className: "p-1 hover:bg-gray-200 rounded transition-colors", children: expandedGroups.has(group.key) ? (_jsx(ChevronDown, { className: "w-5 h-5 text-gray-600" })) : (_jsx(ChevronRight, { className: "w-5 h-5 text-gray-600" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 truncate", children: group.groupInfo.class_type_name }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${group.type === 'weekly' ? 'bg-blue-100 text-blue-800' :
                                                                    group.type === 'monthly' ? 'bg-green-100 text-green-800' :
                                                                        group.type === 'crash_course' ? 'bg-red-100 text-red-800' :
                                                                            group.type === 'package' ? 'bg-purple-100 text-purple-800' :
                                                                                'bg-gray-100 text-gray-800'}`, children: group.type === 'crash_course' ? 'Crash Course' :
                                                                    group.type.charAt(0).toUpperCase() + group.type.slice(1) })] }), _jsxs("div", { className: "flex items-center mt-1 text-sm text-gray-600 space-x-4", children: [_jsxs("span", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-1" }), group.groupInfo.instructor_name] }), group.groupInfo.client_names && (_jsxs("span", { className: "flex items-center", children: [_jsx(MapPin, { className: "w-4 h-4 mr-1" }), group.groupInfo.client_names] })), group.groupInfo.pattern_description && (_jsx("span", { className: "text-blue-600", children: group.groupInfo.pattern_description }))] })] })] }) }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-lg font-semibold text-green-600", children: ["\u20B9", group.groupInfo.total_revenue.toFixed(2)] }), _jsxs("div", { className: "text-sm text-gray-500", children: [group.groupInfo.assignment_count, " class", group.groupInfo.assignment_count !== 1 ? 'es' : ''] })] })] }) }), expandedGroups.has(group.key) && (_jsx("div", { className: "divide-y divide-gray-100", children: group.assignments.map((assignment) => {
                            const statusStyle = getStatusStyle(assignment);
                            return (_jsxs("div", { className: "px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer min-w-0", onClick: (e) => {
                                    e.stopPropagation();
                                    if (!isSelectMode) {
                                        onOpenClassDetails(assignment);
                                    }
                                }, children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 flex-1 min-w-0", children: [isSelectMode && (_jsx("div", { className: "flex-shrink-0", onClick: (e) => {
                                                            e.stopPropagation();
                                                            onToggleSelection(assignment.id);
                                                        }, children: _jsx("input", { type: "checkbox", checked: selectedAssignments.has(assignment.id), onChange: () => onToggleSelection(assignment.id), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }) })), _jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bgColor} ${statusStyle.borderColor} ${statusStyle.textColor}`, children: statusStyle.label }) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center mb-1 sm:mb-0", children: [_jsx(Calendar, { className: "w-4 h-4 mr-1" }), formatDate(assignment.date)] }), _jsxs("div", { className: "flex items-center mb-1 sm:mb-0", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), formatTime(assignment.start_time), " - ", formatTime(assignment.end_time)] }), getPrimaryClientDisplay(assignment) && getPrimaryClientDisplay(assignment) !== group.groupInfo.client_names && (_jsx(ClientDisplay, { assignment: assignment, className: "mt-1 sm:mt-0" }))] }) })] }), _jsxs("div", { className: "mt-2 sm:mt-0 flex items-center space-x-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "flex items-center text-lg font-semibold text-green-600", children: [_jsx(IndianRupee, { className: "w-4 h-4" }), "\u20B9", assignment.payment_amount.toFixed(2)] }), assignment.payment_status && (_jsx("div", { className: `text-xs ${assignment.payment_status === 'paid' ? 'text-green-600' :
                                                                    assignment.payment_status === 'pending' ? 'text-yellow-600' :
                                                                        'text-red-600'}`, children: assignment.payment_status }))] }), !isSelectMode && (_jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            onDeleteAssignment(assignment.id, `${assignment.class_type?.name || 'Class'} on ${formatDate(assignment.date)}`);
                                                        }, className: "opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 transition-all", title: "Delete assignment", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] })] }), assignment.notes && (_jsx("div", { className: "mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded", children: assignment.notes }))] }, assignment.id));
                        }) }))] }, group.key))) }) }));
};
