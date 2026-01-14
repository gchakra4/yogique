import { usePermissions } from '@/shared/hooks/usePermissions';
import { format, parseISO, startOfWeek } from 'date-fns';
import React, { useMemo, useState } from 'react';

// Types
interface Assignment {
    id: string;
    container_id: string;
    class_date: string;
    start_time: string;
    end_time: string;
    timezone: string;
    instructor_id: string;
    instructor_name: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    enrolled_count: number;
    capacity: number;
    meeting_link?: string;
    notes?: string;
}

interface AssignmentListProps {
    containerId: string;
    assignments: Assignment[];
    loading?: boolean;
    error?: string | null;
    onEdit: (assignment: Assignment) => void;
    onDelete: (assignment: Assignment) => void;
    onCreate: () => void;
    onRefresh?: () => void;
}

type SortBy = 'date' | 'instructor' | 'enrollment' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'week' | 'month' | 'instructor';

const VIRTUALIZATION_THRESHOLD = 50;

export default function AssignmentList({
    containerId,
    assignments,
    loading = false,
    error = null,
    onEdit,
    onDelete,
    onCreate,
    onRefresh,
}: AssignmentListProps) {
    const { canCreate, canUpdate, canDelete } = usePermissions('assignments');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // State
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [instructorFilter, setInstructorFilter] = useState<string | null>(null);

    // Responsive listener
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filtered assignments
    const filteredAssignments = useMemo(() => {
        let result = [...assignments];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (a) =>
                    a.instructor_name.toLowerCase().includes(query) ||
                    format(parseISO(a.class_date), 'MMM d, yyyy').toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter) {
            result = result.filter((a) => a.status === statusFilter);
        }

        // Instructor filter
        if (instructorFilter) {
            result = result.filter((a) => a.instructor_id === instructorFilter);
        }

        return result;
    }, [assignments, searchQuery, statusFilter, instructorFilter]);

    // Sorted assignments
    const sortedAssignments = useMemo(() => {
        return [...filteredAssignments].sort((a, b) => {
            switch (sortBy) {
                case 'date': {
                    const dateCompare =
                        new Date(a.class_date).getTime() - new Date(b.class_date).getTime();
                    if (dateCompare !== 0) return sortOrder === 'asc' ? dateCompare : -dateCompare;
                    return sortOrder === 'asc'
                        ? a.start_time.localeCompare(b.start_time)
                        : b.start_time.localeCompare(a.start_time);
                }
                case 'instructor':
                    return sortOrder === 'asc'
                        ? a.instructor_name.localeCompare(b.instructor_name)
                        : b.instructor_name.localeCompare(a.instructor_name);
                case 'enrollment': {
                    const aEnrolled = a.enrolled_count / a.capacity;
                    const bEnrolled = b.enrolled_count / b.capacity;
                    return sortOrder === 'asc' ? aEnrolled - bEnrolled : bEnrolled - aEnrolled;
                }
                case 'status': {
                    const statusOrder = { scheduled: 1, completed: 2, cancelled: 3, rescheduled: 4 };
                    return sortOrder === 'asc'
                        ? statusOrder[a.status] - statusOrder[b.status]
                        : statusOrder[b.status] - statusOrder[a.status];
                }
                default:
                    return 0;
            }
        });
    }, [filteredAssignments, sortBy, sortOrder]);

    // Grouped assignments
    const groupedAssignments = useMemo(() => {
        if (groupBy === 'none') return { all: sortedAssignments };

        return sortedAssignments.reduce((groups, assignment) => {
            let key: string;
            switch (groupBy) {
                case 'week': {
                    const weekStart = startOfWeek(parseISO(assignment.class_date));
                    key = format(weekStart, 'yyyy-MM-dd');
                    break;
                }
                case 'month':
                    key = format(parseISO(assignment.class_date), 'yyyy-MM');
                    break;
                case 'instructor':
                    key = assignment.instructor_id;
                    break;
                default:
                    key = 'all';
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(assignment);
            return groups;
        }, {} as Record<string, Assignment[]>);
    }, [sortedAssignments, groupBy]);

    const handleSort = (field: SortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter(null);
        setInstructorFilter(null);
    };

    // Render loading state
    if (loading && assignments.length === 0) {
        return <AssignmentListSkeleton isMobile={isMobile} />;
    }

    // Render error state
    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-600 mb-4">{error}</div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    // Render empty state
    if (filteredAssignments.length === 0) {
        const hasFilters = searchQuery || statusFilter || instructorFilter;
        return (
            <div className="p-8 text-center">
                <div className="text-gray-500 mb-4">
                    {hasFilters ? 'No classes match your filters' : 'No classes scheduled'}
                </div>
                {hasFilters ? (
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Clear Filters
                    </button>
                ) : canCreate ? (
                    <button
                        onClick={onCreate}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                        Create Class
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="assignment-list space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <input
                    type="text"
                    placeholder="Search by instructor, date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-64"
                />

                <div className="flex gap-2 flex-wrap">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="instructor">Sort by Instructor</option>
                        <option value="enrollment">Sort by Enrollment</option>
                        <option value="status">Sort by Status</option>
                    </select>

                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="none">No Grouping</option>
                        <option value="week">Group by Week</option>
                        <option value="month">Group by Month</option>
                        <option value="instructor">Group by Instructor</option>
                    </select>

                    {canCreate && !isMobile && (
                        <button
                            onClick={onCreate}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                            + Create Class
                        </button>
                    )}
                </div>
            </div>

            {/* Assignment List */}
            {isMobile ? (
                <AssignmentCardList
                    groupedAssignments={groupedAssignments}
                    groupBy={groupBy}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ) : (
                <AssignmentTable
                    groupedAssignments={groupedAssignments}
                    groupBy={groupBy}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}

            {/* Mobile FAB */}
            {isMobile && canCreate && (
                <button
                    onClick={onCreate}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center"
                    aria-label="Create Class"
                >
                    <span className="text-2xl">+</span>
                </button>
            )}
        </div>
    );
}

// Skeleton loader
function AssignmentListSkeleton({ isMobile }: { isMobile: boolean }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-gray-200 rounded-lg ${isMobile ? 'h-40' : 'h-16'
                        }`}
                />
            ))}
        </div>
    );
}

// Desktop Table View
interface TableProps {
    groupedAssignments: Record<string, Assignment[]>;
    groupBy: GroupBy;
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSort: (field: SortBy) => void;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (assignment: Assignment) => void;
    onDelete: (assignment: Assignment) => void;
}

function AssignmentTable({
    groupedAssignments,
    groupBy,
    sortBy,
    sortOrder,
    onSort,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
}: TableProps) {
    return (
        <div className="overflow-x-auto">
            {Object.entries(groupedAssignments).map(([groupKey, assignments]) => (
                <div key={groupKey} className="mb-6">
                    {groupBy !== 'none' && (
                        <h3 className="text-lg font-semibold mb-3">
                            {getGroupLabel(groupKey, groupBy)} ({assignments.length})
                        </h3>
                    )}
                    <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSort('date')}
                                >
                                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                    Time
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSort('instructor')}
                                >
                                    Instructor {sortBy === 'instructor' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSort('status')}
                                >
                                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSort('enrollment')}
                                >
                                    Enrolled {sortBy === 'enrollment' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((assignment) => (
                                <tr key={assignment.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        {format(parseISO(assignment.class_date), 'EEE, MMM d, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {assignment.start_time} - {assignment.end_time} {assignment.timezone}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{assignment.instructor_name}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={assignment.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {assignment.enrolled_count} / {assignment.capacity}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {canUpdate && (
                                                <button
                                                    onClick={() => onEdit(assignment)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => onDelete(assignment)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

// Mobile Card List
interface CardListProps {
    groupedAssignments: Record<string, Assignment[]>;
    groupBy: GroupBy;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (assignment: Assignment) => void;
    onDelete: (assignment: Assignment) => void;
}

function AssignmentCardList({
    groupedAssignments,
    groupBy,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
}: CardListProps) {
    return (
        <div className="space-y-6">
            {Object.entries(groupedAssignments).map(([groupKey, assignments]) => (
                <div key={groupKey}>
                    {groupBy !== 'none' && (
                        <h3 className="text-lg font-semibold mb-3">
                            {getGroupLabel(groupKey, groupBy)} ({assignments.length})
                        </h3>
                    )}
                    <div className="space-y-3">
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="border border-gray-200 rounded-lg p-4 space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <StatusBadge status={assignment.status} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold">
                                        {format(parseISO(assignment.class_date), 'EEE, MMM d, yyyy')}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {assignment.start_time} - {assignment.end_time} {assignment.timezone}
                                    </p>
                                </div>
                                <div className="text-sm text-gray-700">{assignment.instructor_name}</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-emerald-600 h-2 rounded-full"
                                            style={{
                                                width: `${(assignment.enrolled_count / assignment.capacity) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {assignment.enrolled_count} / {assignment.capacity}
                                    </span>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    {canUpdate && (
                                        <button
                                            onClick={() => onEdit(assignment)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete(assignment)}
                                            className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: Assignment['status'] }) {
    const colors = {
        scheduled: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-red-100 text-red-800',
        rescheduled: 'bg-yellow-100 text-yellow-800',
    };

    return (
        <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

// Helper to get group label
function getGroupLabel(key: string, groupBy: GroupBy): string {
    switch (groupBy) {
        case 'week': {
            const weekStart = parseISO(key);
            return `Week of ${format(weekStart, 'MMM d, yyyy')}`;
        }
        case 'month':
            return format(parseISO(`${key}-01`), 'MMMM yyyy');
        case 'instructor':
            return key;
        default:
            return 'All';
    }
}
