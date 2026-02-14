import React, { useEffect, useMemo } from 'react';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { STATUS_METADATA } from '../../../shared/constants/attendanceStatus';
import { AttendanceRecord, AttendanceStatus } from '../../../shared/types/attendance';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceStatusSelector } from './AttendanceStatusSelector';

export interface AttendeeInfo {
    member_id: string;
    name?: string | null;
    email?: string | null;
    // Extend with any other profile fields you may have
}

interface AttendanceTableProps {
    assignmentId: string;
    attendees: AttendeeInfo[];              // List of expected attendees
    lockEditing?: boolean;                  // When true disable status changes
    className?: string;
    onStatusChange?: (memberId: string, status: AttendanceStatus, record: AttendanceRecord) => void;
    onCountsChange?: (payload: {
        totalMarked: number;
        totalAttendees: number;
        counts: Record<AttendanceStatus, number>;
    }) => void;
    compact?: boolean;
    showNotes?: boolean;
    hideHeader?: boolean;
    autoReloadIntervalMs?: number;
}

/**
 * AttendanceTable
 * - Merges provided attendees with attendance records
 * - Allows updating status via useAttendance() hook (optimistic)
 * - Displays counts summary
 *
 * NOTE: For notes editing you can extend later with an inline textarea / dialog.
 */
export const AttendanceTable: React.FC<AttendanceTableProps> = ({
    assignmentId,
    attendees,
    lockEditing = false,
    className = '',
    onStatusChange,
    onCountsChange,
    compact = false,
    showNotes = false,
    hideHeader = false,
    autoReloadIntervalMs
}) => {
    const {
        records,
        loading,
        error,
        upsert,
        optimisticUpdating,
        lastUpdatedAt
    } = useAttendance(assignmentId, { autoReloadIntervalMs });

    // Map attendance records by member_id for quick lookup
    const recordMap = useMemo(() => {
        const m = new Map<string, AttendanceRecord>();
        records.forEach(r => m.set(r.member_id, r));
        return m;
    }, [records]);

    // Derived merged rows
    const rows = useMemo(() => {
        return attendees.map(att => {
            const record = recordMap.get(att.member_id);
            return {
                ...att,
                record,
                status: record?.status as AttendanceStatus | undefined
            };
        });
    }, [attendees, recordMap]);

    const counts = useMemo(() => {
        const c: Record<AttendanceStatus, number> = Object.keys(STATUS_METADATA).reduce((acc, k) => {
            acc[k as AttendanceStatus] = 0;
            return acc;
        }, {} as Record<AttendanceStatus, number>);
        records.forEach(r => {
            if (c[r.status] !== undefined) c[r.status] += 1;
        });
        return c;
    }, [records]);

    const totalMarked = records.length;
    const totalAttendees = attendees.length;

    useEffect(() => {
        if (!onCountsChange) return;
        onCountsChange({ totalMarked, totalAttendees, counts });
    }, [counts, onCountsChange, totalAttendees, totalMarked]);

    const handleChange = async (memberId: string, status: AttendanceStatus) => {
        if (lockEditing) return;
        try {
            await upsert({ member_id: memberId, status });
            if (onStatusChange) {
                const nowIso = new Date().toISOString();
                const prev = recordMap.get(memberId);
                const optimistic: AttendanceRecord = prev
                    ? { ...prev, status, updated_at: nowIso, marked_at: nowIso }
                    : {
                        id: 'optimistic-' + crypto.randomUUID(),
                        assignment_id: assignmentId,
                        member_id: memberId,
                        status,
                        notes: null,
                        marked_by: 'optimistic',
                        marked_at: nowIso,
                        updated_at: nowIso,
                        makeup_of_assignment_id: null
                    };
                onStatusChange(memberId, status, optimistic);
            }
        } catch {
            // error surfaced in hook
        }
    };

    return (
        <div className={`flex flex-col gap-4 ${className}`} data-assignment-id={assignmentId}>
            {!hideHeader && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance</h3>
                    <div className="flex flex-wrap gap-3 items-center text-xs text-gray-600 dark:text-slate-400">
                        <span className="font-medium">Marked: {totalMarked}/{totalAttendees}</span>
                        <span>Last Updated: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : '—'}</span>
                        {optimisticUpdating && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <LoadingSpinner size="sm" /> Saving...
                            </span>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg">
                    Error: {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">#</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Student</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Status</th>
                            {showNotes && (
                                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Notes</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900/50 divide-y divide-gray-100 dark:divide-slate-800">
                        {loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={showNotes ? 4 : 3} className="px-4 py-8 text-center">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        )}
                        {rows.map((r, idx) => {
                            const status = r.status || 'present'; // default suggestion
                            return (
                                <tr key={r.member_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                                    <td className="px-3 py-2 text-gray-500 dark:text-slate-400 w-px">{idx + 1}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">{r.name || r.member_id}</span>
                                            {r.email && (
                                                <span className="text-xs text-gray-500 dark:text-slate-400">{r.email}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <AttendanceStatusSelector
                                            value={status as AttendanceStatus}
                                            disabled={lockEditing || optimisticUpdating}
                                            onChange={next => handleChange(r.member_id, next)}
                                            size={compact ? 'sm' : 'md'}
                                        />
                                    </td>
                                    {showNotes && (
                                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-slate-400">
                                            {r.record?.notes || '—'}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {rows.length === 0 && !loading && (
                            <tr>
                                <td colSpan={showNotes ? 4 : 3} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                                    No attendees provided.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary counts */}
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-600 dark:text-slate-400">
                {Object.entries(counts).map(([k, v]) => {
                    if (v === 0) return null;
                    return (
                        <span
                            key={k}
                            className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600"
                            title={STATUS_METADATA[k as AttendanceStatus].description}
                        >
                            {STATUS_METADATA[k as AttendanceStatus].label}: {v}
                        </span>
                    );
                })}
                {(totalMarked < totalAttendees) && (
                    <span className="px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                        Unmarked: {totalAttendees - totalMarked}
                    </span>
                )}
            </div>
        </div>
    );
};
