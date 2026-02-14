import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../features/auth/contexts/AuthContext';
import { AttendanceTable } from '../../../../features/instructor/components/AttendanceTable';
import { useAssignmentRoster } from '../../../../features/instructor/hooks/useAssignmentRoster';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
import { AttendanceStatus } from '../../../../shared/types/attendance';

type ProgramGroup = {
    key: string;
    programName: string;
    instructorName: string;
    frequencyLabel: string;
    studentCount: number | null;
    classes: any[];
};

type ContainerInfo = {
    id: string;
    display_name?: string | null;
    instructor_id?: string | null;
    instructor_name?: string | null;
    capacity_booked?: number | null;
    current_booking_count?: number | null;
    capacity_total?: number | null;
    max_booking_count?: number | null;
};

const mergeAssignmentIds = (rows: any[], byId: Map<string, any>) => {
    return rows.map(r => {
        const id = r?.assignment_id;
        if (!id) return r;
        const extra = byId.get(id);
        if (!extra) return r;
        return { ...r, ...extra };
    });
};

const normalizeRel = <T,>(rel: T | T[] | null | undefined): T | null => {
    if (!rel) return null;
    return Array.isArray(rel) ? (rel[0] as any) : (rel as any);
};

const getClassType = (c: any) => normalizeRel<any>(c?.class_types);

const formatFrequency = (scheduleType?: string | null) => {
    if (!scheduleType) return '—';
    return scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1);
};

const getLikelyProgramKey = (c: any) => {
    // Prefer explicit program identifiers when present.
    const containerId = c?.class_container_id || c?.container_id;
    const pkg = c?.class_package_id;
    const sched = c?.scheduled_class_id;
    if (containerId) return `container:${containerId}`;
    if (pkg) return `package:${pkg}`;
    if (sched) return `schedule:${sched}`;

    // Fallback grouping: class type + instructor + schedule type.
    const ct = getClassType(c);
    const classTypeId = ct?.id || c?.class_type_id || ct?.name || 'unknown';
    const instructorId = c?.instructor_id || 'unknown';
    const scheduleType = c?.schedule_type || 'unknown';
    return `fallback:${classTypeId}|${instructorId}|${scheduleType}`;
};

const getProgramDisplayName = (
    c: any,
    containerById: Record<string, ContainerInfo>,
    packageNameById: Record<string, string>
) => {
    const containerId = c?.class_container_id || c?.container_id;
    if (containerId) {
        const name = containerById[containerId]?.display_name;
        // If it's a container-backed program, do not fall back to package name.
        // Show a clear loading placeholder until container data arrives.
        return (name && String(name).trim().length > 0) ? (name as string) : 'Loading program…';
    }

    // If we don't yet have the container id, avoid showing package/class-type names
    // (they are not the program name and are confusing).
    if (c?.assignment_id || c?.class_package_id || c?.scheduled_class_id) {
        return 'Loading program…';
    }

    // Last resort
    const ct = getClassType(c);
    if (ct?.name) return ct.name;
    const pkg = c?.class_package_id;
    if (pkg && packageNameById[pkg]) return packageNameById[pkg];
    return 'Unnamed program';
};

const getInstructorDisplayName = (c: any) => {
    return c?.instructor_name || c?.instructor_id || '—';
};

const ProgramAttendanceClassPanel: React.FC<{
    assignment: any;
    onLiveCounts?: (assignmentId: string, payload: {
        totalMarked: number;
        totalAttendees: number;
        counts: Record<AttendanceStatus, number>;
    }) => void;
}> = ({ assignment, onLiveCounts }) => {
    const assignmentId = assignment?.assignment_id as string | undefined;
    const { attendees, loading, error } = useAssignmentRoster(assignmentId, { enabled: true, autoReloadMs: 20000 });

    const lockEditing = useMemo(() => {
        // Rely on backend/RLS to enforce locking rules.
        // We only honor an explicit lock flag returned with the assignment.
        if (!assignment) return true;
        return Boolean(assignment.attendance_locked);
    }, [assignment]);

    if (!assignmentId) {
        return (
            <div className="text-sm text-red-600 dark:text-red-400">
                Missing assignment id.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900/40 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg mb-3">
                    {error}
                </div>
            )}
            {loading && attendees.length === 0 && (
                <div className="py-6 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            )}
            <AttendanceTable
                assignmentId={assignmentId}
                attendees={attendees}
                lockEditing={lockEditing}
                compact
                hideHeader
                autoReloadIntervalMs={15000}
                onCountsChange={(payload) => {
                    if (!assignmentId) return;
                    onLiveCounts?.(assignmentId, payload);
                }}
            />
        </div>
    );
};

export const AttendanceRegister: React.FC = () => {
    const { user, userRoles } = useAuth();
    const role = user?.role;

    // Auto-range: default to the earliest assigned class date → latest assigned class date
    // for the current scope/instructor filter. Users can manually override.
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [autoRange, setAutoRange] = useState<boolean>(true);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [packageNameById, setPackageNameById] = useState<Record<string, string>>({});
    const [containerById, setContainerById] = useState<Record<string, ContainerInfo>>({});
    const [openProgramKey, setOpenProgramKey] = useState<string | null>(null);
    const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
    const [liveCountsByAssignment, setLiveCountsByAssignment] = useState<Record<string, {
        totalMarked: number;
        totalAttendees: number;
        counts: Record<AttendanceStatus, number>;
    }>>({});

    const roleSet = useMemo(() => {
        const roles = new Set<string>();
        if (role) roles.add(role);
        (userRoles || []).forEach(r => { if (r) roles.add(r); });
        return roles;
    }, [role, userRoles]);

    const isElevated = useMemo(
        () => roleSet.has('admin') || roleSet.has('super_admin') || roleSet.has('yoga_acharya'),
        [roleSet]
    );

    const isInstructor = useMemo(() => roleSet.has('instructor'), [roleSet]);

    const [scope, setScope] = useState<'all' | 'mine'>('all');
    const [instructorFilter, setInstructorFilter] = useState<string>('');
    const [scheduleTypeFilter, setScheduleTypeFilter] = useState<string>('');
    const [needsMarkingOnly, setNeedsMarkingOnly] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    // Keep scope/instructor filter consistent with role.
    useEffect(() => {
        if (!user?.id) return;
        if (isInstructor && !isElevated) {
            setScope('mine');
            setInstructorFilter(user.id);
            return;
        }

        // Elevated users can pick; default to all.
        setScope('all');
        setInstructorFilter('');
    }, [user?.id, isInstructor, isElevated]);

    useEffect(() => {
        if (!user?.id) return;
        if (scope === 'mine') setInstructorFilter(user.id);
        if (scope === 'all') setInstructorFilter('');
    }, [scope, user?.id]);

    // Derive default date window from assigned classes.
    // This ensures historical classes and future assigned classes are included by default.
    useEffect(() => {
        if (!user?.id) return;
        if (!autoRange) return;
        if (from && to) return;

        const mustScopeToUser = Boolean(user?.id && isInstructor && !isElevated);
        let canceled = false;

        (async () => {
            try {
                // Query class_assignments because some views are named "upcoming" and may not include history.
                // Using two small indexed queries (min/max) keeps it fast.
                let baseMin = supabase
                    .from('class_assignments')
                    .select('date')
                    .order('date', { ascending: true })
                    .limit(1);

                let baseMax = supabase
                    .from('class_assignments')
                    .select('date')
                    .order('date', { ascending: false })
                    .limit(1);

                if (mustScopeToUser && user?.id) {
                    baseMin = baseMin.eq('instructor_id', user.id);
                    baseMax = baseMax.eq('instructor_id', user.id);
                } else if (instructorFilter) {
                    baseMin = baseMin.eq('instructor_id', instructorFilter);
                    baseMax = baseMax.eq('instructor_id', instructorFilter);
                }

                const [{ data: minRows, error: minErr }, { data: maxRows, error: maxErr }] = await Promise.all([
                    baseMin,
                    baseMax
                ]);

                if (canceled) return;
                if (minErr || maxErr) return;

                const minDate = (minRows as any[] | null)?.[0]?.date as string | undefined;
                const maxDate = (maxRows as any[] | null)?.[0]?.date as string | undefined;
                if (!minDate || !maxDate) {
                    // No assignments visible; default to today → today + 14 days.
                    const today = new Date().toISOString().split('T')[0];
                    const plus14 = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0];
                    setFrom(today);
                    setTo(plus14);
                    return;
                }

                setFrom(minDate);
                setTo(maxDate);
            } catch {
                // ignore
            }
        })();

        return () => {
            canceled = true;
        };
    }, [user?.id, autoRange, from, to, isInstructor, isElevated, instructorFilter]);

    const availableInstructors = useMemo(() => {
        const map = new Map<string, string>();
        (classes || []).forEach((c: any) => {
            const id = c?.instructor_id;
            if (!id) return;
            const name = c?.instructor_name || id;
            if (!map.has(id)) map.set(id, name);
        });
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [classes]);

    const filteredClasses = useMemo(() => {
        const q = (search || '').trim().toLowerCase();
        return (classes || []).filter((c: any) => {
            if (instructorFilter) {
                if (c?.instructor_id !== instructorFilter) return false;
            }

            if (scheduleTypeFilter) {
                if ((c?.schedule_type || '') !== scheduleTypeFilter) return false;
            }

            if (q) {
                const hay = [
                    c?.class_types?.name,
                    c?.schedule_type,
                    c?.date,
                    c?.start_time,
                    c?.end_time,
                    c?.instructor_name,
                    c?.instructor_id,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }

            if (needsMarkingOnly) {
                const participantCount = Number(c?.participant_count ?? 0);
                const marked = Number(c?.present_count ?? 0) + Number(c?.no_show_count ?? 0);
                if (participantCount > 0) {
                    if (marked >= participantCount) return false;
                } else {
                    if (marked > 0) return false;
                }
            }

            return true;
        });
    }, [classes, instructorFilter, scheduleTypeFilter, search, needsMarkingOnly]);

    const programGroups = useMemo<ProgramGroup[]>(() => {
        const grouped = new Map<string, any[]>();
        (filteredClasses || []).forEach(c => {
            const key = getLikelyProgramKey(c);
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(c);
        });

        const groups: ProgramGroup[] = Array.from(grouped.entries()).map(([key, groupClasses]) => {
            const first = groupClasses[0];

            const firstContainerId = first?.class_container_id || first?.container_id;
            const containerInfo = firstContainerId ? containerById[firstContainerId] : undefined;

            // Derive a stable student count representative of the program.
            // We use max participant_count across the visible classes (avoids summing and double-counting).
            const fallbackStudentCount = groupClasses.reduce((acc: number | null, c: any) => {
                const n = c?.participant_count;
                const v = (n === null || n === undefined) ? null : Number(n);
                if (v === null || Number.isNaN(v)) return acc;
                if (acc === null) return v;
                return Math.max(acc, v);
            }, null);

            const containerStudentCountRaw = containerInfo?.capacity_booked ?? containerInfo?.current_booking_count ?? null;
            const containerStudentCount = (containerStudentCountRaw === null || containerStudentCountRaw === undefined)
                ? null
                : Number(containerStudentCountRaw);

            const studentCount = (containerStudentCount !== null && !Number.isNaN(containerStudentCount))
                ? containerStudentCount
                : fallbackStudentCount;

            const scheduleType = first?.schedule_type || '';
            return {
                key,
                programName: getProgramDisplayName(first, containerById, packageNameById),
                instructorName: containerInfo?.instructor_name || getInstructorDisplayName(first),
                frequencyLabel: formatFrequency(scheduleType),
                studentCount,
                classes: [...groupClasses].sort((a: any, b: any) => {
                    const ad = `${a?.date || ''}T${a?.start_time || ''}`;
                    const bd = `${b?.date || ''}T${b?.start_time || ''}`;
                    return ad.localeCompare(bd);
                })
            };
        });

        return groups.sort((a, b) => a.programName.localeCompare(b.programName));
    }, [filteredClasses, packageNameById]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            setInfo(null);

            const mustScopeToUser = Boolean(user?.id && isInstructor && !isElevated);
            // Prefer the convenient view; fallback to querying class_assignments directly if view missing
            try {
                let q = supabase.from('instructor_upcoming_classes_v').select('*');
                if (from) q = q.gte('date', from);
                if (to) q = q.lte('date', to);
                q = q.order('date', { ascending: true }).order('start_time', { ascending: true });
                // Hard requirement: instructors see only their classes.
                // Elevated roles can optionally filter by instructor.
                if (mustScopeToUser && user?.id) q = q.eq('instructor_id', user.id);
                const { data, error: err } = await q;
                if (err) throw err;
                // Ensure relational shape is consistent for render
                let rows = ((data as any[]) || []).map((r: any) => ({
                    ...r,
                    class_types: normalizeRel<any>(r?.class_types)
                }));

                // Deterministically enrich with container ids (and other program identifiers) so grouping is stable.
                const assignmentIds = Array.from(new Set(rows.map(r => r?.assignment_id).filter(Boolean)));
                const missingProgramInfoIds = assignmentIds.filter(id => {
                    const row = rows.find(r => r?.assignment_id === id);
                    return row && !row?.class_container_id && !row?.container_id;
                });

                if (missingProgramInfoIds.length > 0) {
                    const extraByAssignmentId = new Map<string, any>();

                    // Try class_assignments first (authoritative)
                    const { data: aData, error: aErr } = await supabase
                        .from('class_assignments')
                        .select('id, class_container_id, class_package_id, scheduled_class_id')
                        .in('id', missingProgramInfoIds);

                    if (!aErr) {
                        (aData || []).forEach((r: any) => {
                            if (!r?.id) return;
                            extraByAssignmentId.set(r.id, {
                                ...(r.class_container_id ? { class_container_id: r.class_container_id } : {}),
                                ...(r.class_package_id ? { class_package_id: r.class_package_id } : {}),
                                ...(r.scheduled_class_id ? { scheduled_class_id: r.scheduled_class_id } : {})
                            });
                        });
                    }

                    // Fallback to assignment_bookings when class_assignments is blocked by RLS.
                    const stillMissing = missingProgramInfoIds.filter(id => {
                        const extra = extraByAssignmentId.get(id);
                        return !extra?.class_container_id;
                    });

                    if (stillMissing.length > 0) {
                        const { data: bData, error: bErr } = await supabase
                            .from('assignment_bookings')
                            .select('assignment_id, class_container_id')
                            .in('assignment_id', stillMissing)
                            .not('class_container_id', 'is', null);

                        if (!bErr) {
                            (bData || []).forEach((r: any) => {
                                const id = r?.assignment_id;
                                const cid = r?.class_container_id;
                                if (!id || !cid) return;
                                const prev = extraByAssignmentId.get(id) || {};
                                if (!prev.class_container_id) {
                                    extraByAssignmentId.set(id, { ...prev, class_container_id: cid });
                                }
                            });
                        }
                    }

                    if (extraByAssignmentId.size > 0) {
                        rows = mergeAssignmentIds(rows, extraByAssignmentId);
                    }
                }

                // Prefetch program (container) names so title doesn't require manual refresh.
                const containerIds = Array.from(new Set(rows
                    .map(r => r?.class_container_id || r?.container_id)
                    .filter(Boolean)));

                if (containerIds.length > 0) {
                    const missingContainerIds = containerIds.filter(id => !containerById[id]);
                    if (missingContainerIds.length > 0) {
                        const { data: cData, error: cErr } = await supabase
                            .from('class_containers')
                            .select('id, display_name, instructor_id, capacity_booked, current_booking_count, capacity_total, max_booking_count')
                            .in('id', missingContainerIds);

                        if (!cErr) {
                            const next: Record<string, ContainerInfo> = {};
                            (cData || []).forEach((r: any) => {
                                if (!r?.id) return;
                                next[r.id] = {
                                    id: r.id,
                                    display_name: r.display_name ?? null,
                                    instructor_id: r.instructor_id ?? null,
                                    instructor_name: null,
                                    capacity_booked: r.capacity_booked ?? null,
                                    current_booking_count: r.current_booking_count ?? null,
                                    capacity_total: r.capacity_total ?? null,
                                    max_booking_count: r.max_booking_count ?? null
                                };
                            });
                            if (Object.keys(next).length > 0) {
                                setContainerById(prev => ({ ...prev, ...next }));
                            }
                        }
                    }
                }

                setClasses(rows);
                return;
            } catch (viewErr: any) {
                // If the view does not exist, fall back to querying class_assignments
                if (!viewErr.message || !/relation ".*instructor_upcoming_classes_v" does not exist/i.test(viewErr.message)) {
                    // Not the specific missing-view error — surface it
                    throw viewErr;
                }

                // Fallback: pull from class_assignments with basic relational expansions
                let fb = supabase
                    .from('class_assignments')
                    .select(`
                        id,
                        class_container_id,
                        class_package_id,
                        scheduled_class_id,
                        date,
                        start_time,
                        end_time,
                        instructor_id,
                        class_status,
                        schedule_type,
                        class_types(id,name,description)
                    `)
                    .gte('date', from || '1900-01-01')
                    .lte('date', to || '2999-12-31')
                    .order('date', { ascending: true })
                    .order('start_time', { ascending: true });

                if (mustScopeToUser && user?.id) fb = fb.eq('instructor_id', user.id);

                const { data: fbData, error: fbErr } = await fb;

                if (fbErr) throw fbErr;
                const mapped = (fbData || []).map((r: any) => ({
                    assignment_id: r.id,
                    class_container_id: r.class_container_id ?? null,
                    class_package_id: r.class_package_id ?? null,
                    scheduled_class_id: r.scheduled_class_id ?? null,
                    date: r.date,
                    start_time: r.start_time,
                    end_time: r.end_time,
                    instructor_id: r.instructor_id,
                    instructor_name: r.instructor_name || null,
                    participant_count: null,
                    present_count: 0,
                    no_show_count: 0,
                    class_status: r.class_status,
                    class_types: normalizeRel<any>(r.class_types) || null,
                    schedule_type: r.schedule_type || null,
                }));
                setClasses(mapped);
                setInfo('Using fallback data from `class_assignments` because view `instructor_upcoming_classes_v` is unavailable.');
                return;
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    // Best-effort: resolve program/package names for nicer program cards.
    useEffect(() => {
        const packageIds = Array.from(new Set((classes || []).map(c => c?.class_package_id).filter(Boolean)));
        if (packageIds.length === 0) return;

        let canceled = false;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('class_packages')
                    .select('id,name')
                    .in('id', packageIds);
                if (error) return;
                if (canceled) return;
                const next: Record<string, string> = {};
                (data || []).forEach((r: any) => {
                    if (r?.id && r?.name) next[r.id] = r.name;
                });
                setPackageNameById(prev => ({ ...prev, ...next }));
            } catch {
                // ignore; fallback to class_types.name
            }
        })();

        return () => {
            canceled = true;
        };
    }, [classes]);

    useEffect(() => {
        load();
        const id = window.setInterval(load, 60000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, user?.id, role, isInstructor, isElevated]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Register</h1>
                        <p className="text-sm text-gray-600 dark:text-slate-400">Mark or approve attendance for upcoming classes.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={load} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm">Refresh</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-slate-400">From</label>
                                <input
                                    type="date"
                                    value={from}
                                    onChange={e => { setAutoRange(false); setFrom(e.target.value); }}
                                    className="px-2 py-1 border rounded"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-slate-400">To</label>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={e => { setAutoRange(false); setTo(e.target.value); }}
                                    className="px-2 py-1 border rounded"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                {isElevated && user?.id && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-600 dark:text-slate-400">Scope</label>
                                        <select
                                            value={scope}
                                            onChange={e => setScope(e.target.value as any)}
                                            className="px-2 py-1 border rounded bg-white dark:bg-slate-800"
                                        >
                                            <option value="all">All instructors</option>
                                            <option value="mine">Only mine</option>
                                        </select>
                                    </div>
                                )}

                                {isElevated && scope === 'all' && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-600 dark:text-slate-400">Instructor</label>
                                        <select
                                            value={instructorFilter}
                                            onChange={e => setInstructorFilter(e.target.value)}
                                            className="px-2 py-1 border rounded bg-white dark:bg-slate-800 min-w-[240px]"
                                        >
                                            <option value="">All</option>
                                            {availableInstructors.map(i => (
                                                <option key={i.id} value={i.id}>{i.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600 dark:text-slate-400">Schedule</label>
                                    <select
                                        value={scheduleTypeFilter}
                                        onChange={e => setScheduleTypeFilter(e.target.value)}
                                        className="px-2 py-1 border rounded bg-white dark:bg-slate-800"
                                    >
                                        <option value="">Any</option>
                                        <option value="weekly">weekly</option>
                                        <option value="monthly">monthly</option>
                                        <option value="adhoc">adhoc</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                                    <input type="checkbox" checked={needsMarkingOnly} onChange={e => setNeedsMarkingOnly(e.target.checked)} />
                                    Needs marking
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-slate-400">Search</label>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Class type / instructor / date"
                                    className="px-2 py-1 border rounded w-full sm:w-[260px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    {loading && !classes.length ? (
                        <div className="p-8 text-center">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-4 text-red-600 bg-red-50 rounded mb-4">Error: {error}</div>
                            )}
                            {info && (
                                <div className="p-4 text-blue-700 bg-blue-50 rounded mb-4">{info}</div>
                            )}

                            <div className="grid gap-4">
                                {programGroups.map(group => (
                                    <details
                                        key={group.key}
                                        open={openProgramKey === group.key}
                                        onToggle={(e) => {
                                            const el = e.currentTarget;
                                            if (el.open) {
                                                setOpenProgramKey(group.key);
                                            } else if (openProgramKey === group.key) {
                                                setOpenProgramKey(null);
                                                setOpenAssignmentId(null);
                                            }
                                        }}
                                        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700"
                                    >
                                        <summary className="list-none cursor-pointer p-4 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                    {group.programName}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                                                    <span>Instructor: {group.instructorName}</span>
                                                    <span>Frequency: {group.frequencyLabel}</span>
                                                    <span>Students: {group.studentCount ?? '—'}</span>
                                                    <span>Classes: {group.classes.length}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-gray-500 dark:text-slate-400">Open</span>
                                                <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </summary>

                                        <div className="px-4 pb-4">
                                            <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                                                <div className="bg-gray-50 dark:bg-slate-900/40 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-300">
                                                    Classes
                                                </div>
                                                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                                    {group.classes.map((c: any) => {
                                                        const assignmentId = c?.assignment_id as string;
                                                        const live = assignmentId ? liveCountsByAssignment[assignmentId] : undefined;

                                                        const participantCount = live
                                                            ? live.totalAttendees
                                                            : ((c?.participant_count === null || c?.participant_count === undefined)
                                                                ? null
                                                                : Number(c.participant_count));

                                                        const presentCount = live
                                                            ? Number(live.counts.present ?? 0)
                                                            : Number(c?.present_count ?? 0);

                                                        const noShowCount = live
                                                            ? Number(live.counts.no_show ?? 0)
                                                            : Number(c?.no_show_count ?? 0);

                                                        const markedApprox = live
                                                            ? live.totalMarked
                                                            : (presentCount + noShowCount);

                                                        const needsMarking = (participantCount && !Number.isNaN(participantCount) && participantCount > 0)
                                                            ? markedApprox < participantCount
                                                            : false;

                                                        return (
                                                            <details
                                                                key={assignmentId}
                                                                open={openAssignmentId === assignmentId}
                                                                onToggle={(e) => {
                                                                    const el = e.currentTarget;
                                                                    if (el.open) {
                                                                        setOpenAssignmentId(assignmentId);
                                                                    } else if (openAssignmentId === assignmentId) {
                                                                        setOpenAssignmentId(null);
                                                                    }
                                                                }}
                                                                className="bg-white dark:bg-slate-800"
                                                            >
                                                                <summary className="list-none cursor-pointer px-3 py-3 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/40">
                                                                    <div className="min-w-0">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {c.date} • {c.start_time} - {c.end_time}
                                                                        </div>
                                                                        <div className="mt-0.5 text-[11px] text-gray-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                                                                            <span>Participants: {participantCount === null || Number.isNaN(participantCount) ? '—' : participantCount}</span>
                                                                            <span>Present: {presentCount}</span>
                                                                            <span>No Show: {noShowCount}</span>
                                                                            {needsMarking && (
                                                                                <span className="text-amber-700 dark:text-amber-300">Needs marking</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className="text-xs text-gray-500 dark:text-slate-400">Mark</span>
                                                                        <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </summary>

                                                                <div className="px-3 pb-3">
                                                                    {openAssignmentId === assignmentId && (
                                                                        <ProgramAttendanceClassPanel
                                                                            assignment={c}
                                                                            onLiveCounts={(id, payload) => {
                                                                                setLiveCountsByAssignment(prev => ({
                                                                                    ...prev,
                                                                                    [id]: payload
                                                                                }));
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </details>
                                                        );
                                                    })}
                                                    {group.classes.length === 0 && (
                                                        <div className="p-6 text-center text-sm text-gray-500 dark:text-slate-400">
                                                            No classes found.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                                {programGroups.length === 0 && (
                                    <div className="p-8 text-center text-gray-500 dark:text-slate-400">No programs/classes found in the selected range.</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceRegister;
