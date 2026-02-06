import {
    BarChart2,
    Calendar,
    Download,
    Filter,
    RefreshCw,
    Search,
    Users
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useInstructorsList } from '../../../instructor-rates/hooks/useInstructorsList';
import { AdminClassFilters, useAdminClassOverview } from '../../hooks/useAdminClassOverview';
import { AdminClassDrilldownModal } from './AdminClassDrilldownModal';

/**
 * Admin / Super Admin Classes Overview Module
 * Features:
 * - Filters: date range, instructor, class_status, payment_status, search
 * - Aggregates cards (attendance, rating)
 * - Rating distribution (global for filtered set)
 * - Table of classes (paginated client-side)
 * - CSV export (overview data)
 * - Drill-down modal (roster + rating distribution per class)
 */

const statusOptions = ['all', 'scheduled', 'completed', 'canceled', 'not_conducted', 'rescheduled'];
const paymentStatusOptions = ['all', 'pending', 'paid', 'approved', 'withheld', 'reversed'];

const PAGE_SIZE = 25;

export const AdminClassesOverview: React.FC = () => {
    // Filters state
    const [filters, setFilters] = useState<AdminClassFilters>({
        from: null,
        to: null,
        instructor_id: 'all',
        class_status: 'all',
        payment_status: 'all',
        search: ''
    });

    // Local UI
    const [page, setPage] = useState(1);
    const [showRatingDist, setShowRatingDist] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<{
        id: string;
        meta: any;
    } | null>(null);

    // Data
    const { rows, loading, error, aggregates, ratingDistribution, refetch } = useAdminClassOverview(filters, { autoReloadMs: 60000 });
    const { instructors } = useInstructorsList();
    const instructorMap = useMemo(() => {
        const m = new Map<string, any>();
        instructors.forEach((i: any) => m.set(i.user_id, i));
        return m;
    }, [instructors]);

    // Derived paging
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return rows.slice(start, start + PAGE_SIZE);
    }, [page, rows]);

    const handleFilterChange = <K extends keyof AdminClassFilters>(key: K, value: AdminClassFilters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const exportOverviewCsv = useCallback(() => {
        if (!rows.length) return;
        const headers = [
            'assignment_id',
            'instructor_id',
            'date',
            'start_time',
            'end_time',
            'class_status',
            'payment_status',
            'final_payment_amount',
            'attended_count',
            'absent_count',
            'no_show_count',
            'avg_rating',
            'ratings_submitted'
        ];
        const lines = [headers.join(',')];
        rows.forEach(r => {
            const row = [
                r.assignment_id,
                r.instructor_id,
                r.date,
                r.start_time,
                r.end_time,
                r.class_status,
                r.payment_status || '',
                (r.final_payment_amount ?? '').toString(),
                (r.attended_count ?? 0).toString(),
                (r.absent_count ?? 0).toString(),
                (r.no_show_count ?? 0).toString(),
                (r.avg_rating ?? 0).toFixed(2),
                r.ratings_submitted.toString()
            ];
            lines.push(row.map(v => typeof v === 'string' && v.includes(',') ? JSON.stringify(v) : v).join(','));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_classes_overview.csv';
        a.click();
        URL.revokeObjectURL(url);
    }, [rows]);

    const ratingDistBars = useMemo(() => {
        const total = ratingDistribution.reduce((acc, r) => acc + r.count, 0);
        if (total === 0) {
            return <p className="text-xs text-gray-500 dark:text-slate-500">No ratings in dataset.</p>;
        }
        return ratingDistribution.map(rd => {
            const pct = total === 0 ? 0 : (rd.count / total) * 100;
            return (
                <div key={rd.rating} className="flex items-center gap-2 text-xs">
                    <span className="w-5 font-medium">{rd.rating}★</span>
                    <div className="flex-1 h-2 rounded bg-gray-200 dark:bg-slate-700 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 dark:bg-indigo-400"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="w-8 text-right">{rd.count}</span>
                </div>
            );
        });
    }, [ratingDistribution]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes Overview</h1>
                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                    Administrative visibility: attendance, payments, ratings.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => refetch()}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            <button
                                onClick={exportOverviewCsv}
                                disabled={!rows.length}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                onClick={() => setShowRatingDist(v => !v)}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Ratings {showRatingDist ? '−' : '+'}
                            </button>
                        </div>
                    </div>

                    {/* Aggregates */}
                    <div className="grid gap-4 md:grid-cols-5">
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Total Classes</span>
                            <span className="text-xl font-semibold text-gray-900 dark:text-white">{aggregates.total_classes}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Attended</span>
                            <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{aggregates.attended_total}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-slate-400">No Show</span>
                            <span className="text-xl font-semibold text-amber-600 dark:text-amber-400">{aggregates.no_show_total}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Absent</span>
                            <span className="text-xl font-semibold text-red-600 dark:text-red-400">{aggregates.absent_total}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Avg Rating</span>
                            <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                                {aggregates.avg_rating_overall.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-8">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {/* Date From */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">From</label>
                            <input
                                type="date"
                                value={filters.from ? filters.from.toISOString().split('T')[0] : ''}
                                onChange={e => handleFilterChange('from', e.target.value ? new Date(e.target.value) : null)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                        {/* Date To */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">To</label>
                            <input
                                type="date"
                                value={filters.to ? filters.to.toISOString().split('T')[0] : ''}
                                onChange={e => handleFilterChange('to', e.target.value ? new Date(e.target.value) : null)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                        {/* Instructor */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Instructor
                            </label>
                            <select
                                value={filters.instructor_id}
                                onChange={e => handleFilterChange('instructor_id', e.target.value as any)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            >
                                <option value="all">All</option>
                                {instructors.map((inst: any) => (
                                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                                ))}
                            </select>
                        </div>
                        {/* Class Status */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Class Status</label>
                            <select
                                value={filters.class_status}
                                onChange={e => handleFilterChange('class_status', e.target.value as any)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            >
                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {/* Payment Status */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">Payment Status</label>
                            <select
                                value={filters.payment_status}
                                onChange={e => handleFilterChange('payment_status', e.target.value as any)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            >
                                {paymentStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {/* Search */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1">
                                <Search className="w-3 h-3" /> Search
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={e => handleFilterChange('search', e.target.value)}
                                placeholder="ID or status..."
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Rating Distribution (global) */}
                {showRatingDist && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-indigo-500" />
                                Rating Distribution (Filtered Set)
                            </h2>
                            <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                Weighted Avg: {aggregates.avg_rating_overall.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {ratingDistBars}
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Classes ({rows.length})
                        </h2>
                        {loading && <span className="text-[11px] text-gray-500 dark:text-slate-400">Loading…</span>}
                        {error && (
                            <span className="text-[11px] text-red-600 dark:text-red-400">
                                {error}
                            </span>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-800/60">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Class</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">When</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Assignment</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Instructor</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Status</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Payment</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-slate-300">Attendance</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-slate-300">Rating</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                {pagedRows.map(r => {
                                    const attendanceStr = `P:${r.attended_count ?? 0} N:${r.no_show_count ?? 0} A:${r.absent_count ?? 0}`;
                                    return (
                                        <tr
                                            key={r.assignment_id}
                                            className="hover:bg-gray-50 dark:hover:bg-slate-800/60"
                                        >
                                            <td className="px-3 py-2 text-gray-900 dark:text-white">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{r.class_type_name || '—'}</span>
                                                    {r.class_type_difficulty && (
                                                        <span className="text-xs text-gray-500 dark:text-slate-400">{r.class_type_difficulty}</span>
                                                    )}
                                                    {r.class_type_duration && (
                                                        <span className="text-xs text-gray-500 dark:text-slate-400">{r.class_type_duration} min</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700 dark:text-slate-300">
                                                <span>
                                                    {r.date} • {r.start_time}-{r.end_time}
                                                    {r.timezone && (
                                                        <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">{r.timezone}</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-blue-600 dark:text-blue-400 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <code title={r.assignment_id}>
                                                        {r.assignment_id.slice(0, 8)}…
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(r.assignment_id)}
                                                        className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300"
                                                        title="Copy full ID"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700 dark:text-slate-300">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {instructorMap.get(r.instructor_id)?.name || r.instructor_id.slice(0, 8) + '…'}
                                                    </span>
                                                    {instructorMap.get(r.instructor_id)?.email && (
                                                        <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                                            {instructorMap.get(r.instructor_id).email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-xs">
                                                    {r.class_status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                                                {r.payment_status || '—'} • ₹{(r.final_payment_amount ?? 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-center text-xs text-gray-700 dark:text-slate-300">
                                                {attendanceStr}
                                            </td>
                                            <td className="px-3 py-2 text-center text-xs text-gray-700 dark:text-slate-300">
                                                {(r.avg_rating ?? 0).toFixed(2)} ({r.ratings_submitted})
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    onClick={() => setSelectedAssignment({ id: r.assignment_id, meta: r })}
                                                    className="text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!loading && pagedRows.length === 0) && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-500">
                                            No classes for current filter set.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {rows.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 text-xs">
                            <span className="text-gray-500 dark:text-slate-400">
                                Page {page} of {totalPages} • {rows.length} rows
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-40 text-gray-700 dark:text-slate-200"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-40 text-gray-700 dark:text-slate-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Drilldown Modal */}
            <AdminClassDrilldownModal
                open={!!selectedAssignment}
                onClose={() => setSelectedAssignment(null)}
                assignmentId={selectedAssignment?.id || null}
                meta={selectedAssignment?.meta}
            />
        </div>
    );
};

export default AdminClassesOverview;
