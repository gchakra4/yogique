import { useInstructors } from '@/features/dashboard/hooks/useInstructors';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { supabase } from '@/shared/lib/supabase';
import { addMinutes, format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';

// Minimal types for the form
type AssignmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

interface Assignment {
    id?: string;
    container_id?: string;
    class_date: string; // YYYY-MM-DD
    start_time: string; // HH:mm
    end_time: string; // HH:mm
    timezone: string; // IANA
    instructor_id?: string | null;
    instructor_name?: string;
    status: AssignmentStatus;
    meeting_link?: string;
    notes?: string;
}

interface AssignmentFormProps {
    assignment?: Partial<Assignment>;
    containerId: string;
    containerInstructor?: { id: string; name: string } | null;
    containerTimezone?: string | null;
    onSubmit: (data: Assignment) => Promise<void> | void;
    onCancel?: () => void;
}

const COMMON_TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
];

export default function AssignmentForm({
    assignment,
    containerId,
    containerInstructor = null,
    containerTimezone = null,
    onSubmit,
    onCancel,
}: AssignmentFormProps) {
    const { canCreate, canUpdate } = usePermissions('assignments');

    const isEdit = Boolean(assignment?.id);

    const initial: Assignment = {
        container_id: containerId,
        class_date: assignment?.class_date || format(new Date(), 'yyyy-MM-dd'),
        start_time: assignment?.start_time || '09:00',
        end_time: assignment?.end_time || '10:00',
        timezone: assignment?.timezone || containerTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        instructor_id: assignment?.instructor_id ?? containerInstructor?.id ?? null,
        instructor_name: assignment?.instructor_name ?? containerInstructor?.name ?? '',
        status: (assignment?.status as AssignmentStatus) || 'scheduled',
        meeting_link: assignment?.meeting_link || '',
        notes: assignment?.notes || '',
    };

    const [form, setForm] = useState<Assignment>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    // Conflict checking state
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    const [conflictError, setConflictError] = useState<string | null>(null);
    const conflictTimer = useRef<number | null>(null);
    const conflictAbort = useRef<AbortController | null>(null);

    // Bulk mode state
    const [bulkMode, setBulkMode] = useState(false);
    const [packageId, setPackageId] = useState<string>('');
    const [totalClasses, setTotalClasses] = useState<number>(0);
    const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
    const [packages, setPackages] = useState<any[]>([]);

    useEffect(() => {
        setForm(initial);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignment?.id, containerId]);

    const { instructors, loading: instructorsLoading, error: instructorsError } = useInstructors();

    // Fetch packages for bulk mode
    useEffect(() => {
        async function fetchPackages() {
            const { data, error } = await supabase.from('class_packages').select('id, name, class_count').eq('is_active', true);
            if (!error && data) setPackages(data);
        }
        fetchPackages();
    }, []);

    // Auto-populate total_classes when package selected
    useEffect(() => {
        if (packageId && packages.length > 0) {
            const pkg = packages.find(p => p.id === packageId);
            if (pkg && pkg.class_count) {
                setTotalClasses(Number(pkg.class_count));
            }
        }
    }, [packageId, packages]);

    function setField<K extends keyof Assignment>(key: K, value: Assignment[K]) {
        setForm((s) => ({ ...s, [key]: value }));
        setErrors((e) => ({ ...e, [String(key)]: '' }));
    }

    function validateField(key: keyof Assignment, value: any): string | null {
        if (key === 'class_date') {
            if (!value) return 'Date is required';
            const today = format(new Date(), 'yyyy-MM-dd');
            if (value < today) return 'Date cannot be in the past';
        }
        if (key === 'start_time') {
            if (!value) return 'Start time is required';
        }
        if (key === 'end_time') {
            if (!value) return 'End time is required';
            if (form.start_time && value <= form.start_time) return 'End time must be after start time';
        }
        if (key === 'instructor_id') {
            if (!value && !containerInstructor) return 'Instructor is required';
        }
        return null;
    }

    function validateForm(): boolean {
        const nextErrors: Record<string, string> = {};
        (['class_date', 'start_time', 'end_time', 'instructor_id'] as (keyof Assignment)[]).forEach((k) => {
            const err = validateField(k, (form as any)[k]);
            if (err) nextErrors[k] = err;
        });
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!isEdit && !canCreate) return;
        if (isEdit && !canUpdate) return;

        if (!validateForm()) return;

        // Bulk mode validation
        if (bulkMode) {
            if (!packageId) {
                setErrors(prev => ({ ...prev, package: 'Package is required for bulk creation' }));
                return;
            }
            if (!totalClasses || totalClasses <= 0) {
                setErrors(prev => ({ ...prev, totalClasses: 'Total classes must be greater than 0' }));
                return;
            }
            if (weeklyDays.length === 0) {
                setErrors(prev => ({ ...prev, weeklyDays: 'Select at least one day of the week' }));
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (bulkMode) {
                // Build bulk creation payload
                const bulkData = {
                    assignment_type: 'monthly',
                    monthly_assignment_method: 'weekly_recurrence',
                    container_id: containerId,
                    package_id: packageId,
                    total_classes: totalClasses,
                    weekly_days: weeklyDays,
                    start_date: form.class_date,
                    start_time: form.start_time,
                    end_time: form.end_time,
                    instructor_id: form.instructor_id,
                    timezone: form.timezone,
                    notes: form.notes,
                    booking_type: 'individual' // Default, can be made configurable
                };
                await onSubmit(bulkData as any);
            } else {
                await onSubmit(form);
            }
        } catch (err: any) {
            setErrors((prev) => ({ ...prev, form: err?.message || 'Submission failed' }));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGenerateLink() {
        // Placeholder generator: in real app, call server or provider
        setIsGenerating(true);
        try {
            await new Promise((r) => setTimeout(r, 700));
            const generated = `https://meet.example.com/${Math.random().toString(36).slice(2, 9)}`;
            setField('meeting_link', generated);
        } finally {
            setIsGenerating(false);
        }
    }

    // Auto-adjust end time if start >= end
    useEffect(() => {
        if (form.start_time && form.end_time && form.end_time <= form.start_time) {
            const [h, m] = form.start_time.split(':').map(Number);
            const dt = addMinutes(new Date(1970, 0, 1, h, m), 60);
            const hh = String(dt.getHours()).padStart(2, '0');
            const mm = String(dt.getMinutes()).padStart(2, '0');
            setForm((s) => ({ ...s, end_time: `${hh}:${mm}` }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.start_time]);

    // Debounced conflict check when relevant fields change
    useEffect(() => {
        // clear any pending timer
        if (conflictTimer.current) {
            clearTimeout(conflictTimer.current);
            conflictTimer.current = null;
        }
        // abort any in-flight request
        if (conflictAbort.current) {
            conflictAbort.current.abort();
            conflictAbort.current = null;
        }

        const date = form.class_date;
        const start = form.start_time;
        const end = form.end_time;
        const instructor = form.instructor_id;
        const tz = form.timezone;

        // Skip check if required fields missing
        if (!date || !start || !end || !instructor) {
            setConflicts([]);
            setConflictError(null);
            setIsCheckingConflicts(false);
            return;
        }

        // Debounce the request
        // @ts-ignore setTimeout id typing
        conflictTimer.current = window.setTimeout(async () => {
            setIsCheckingConflicts(true);
            setConflictError(null);
            try {
                // Query assignments for the same instructor and date
                const { data: rows, error } = await supabase
                    .from('class_assignments')
                    .select(`id, class_container_id, date, start_time, end_time, timezone, class_status, instructor_id`)
                    .eq('instructor_id', instructor)
                    .eq('date', date)
                    .neq('class_status', 'cancelled')
                    .neq('class_status', 'rescheduled');

                if (error) throw error;

                // Simple overlap check using HH:MM strings
                const newStart = start;
                const newEnd = end;

                const toMinutes = (t: string | null | undefined) => {
                    if (!t) return 0;
                    // accept formats like HH:MM or HH:MM:SS
                    const parts = t.split(':');
                    const hh = Number(parts[0] || 0);
                    const mm = Number(parts[1] || 0);
                    return hh * 60 + mm;
                };

                const conflictsFound = (rows || []).filter((r: any) => {
                    // exclude the same assignment when editing
                    if (assignment?.id && r.id === assignment.id) return false;
                    const existingStart = r.start_time;
                    const existingEnd = r.end_time;
                    return (existingStart || '') < newEnd && (existingEnd || '') > newStart;
                }).map((r: any) => {
                    const exStartMin = toMinutes(r.start_time);
                    const exEndMin = toMinutes(r.end_time);
                    const newStartMin = toMinutes(newStart);
                    const newEndMin = toMinutes(newEnd);
                    const overlap = Math.max(0, Math.min(exEndMin, newEndMin) - Math.max(exStartMin, newStartMin));
                    return { assignment: r, overlap_minutes: overlap };
                });

                setConflicts(conflictsFound || []);
            } catch (err: any) {
                console.error('Conflict check failed', err);
                setConflictError(err?.message || 'Unable to check conflicts.');
                setConflicts([]);
            } finally {
                setIsCheckingConflicts(false);
            }
        }, 500);

        return () => {
            if (conflictTimer.current) {
                clearTimeout(conflictTimer.current);
                conflictTimer.current = null;
            }
            if (conflictAbort.current) {
                conflictAbort.current.abort();
                conflictAbort.current = null;
            }
        };
    }, [form.class_date, form.start_time, form.end_time, form.instructor_id, form.timezone, assignment?.id]);

    // Helper UI components for conflicts
    function Spinner({ className = '' }: { className?: string }) {
        return (
            <svg className={`animate-spin w-5 h-5 ${className}`} viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        );
    }

    function ConflictDetails({ conflict }: { conflict: any }) {
        const a = conflict.assignment;
        return (
            <div className="bg-white border border-yellow-200 rounded-md p-3 text-sm">
                <div className="font-medium text-gray-900">{a.container_name}</div>
                <div className="text-gray-600 text-sm mt-1">{a.class_date} • {a.start_time} - {a.end_time}</div>
                <div className="text-yellow-700 text-xs mt-1">Overlap: {conflict.overlap_minutes} minutes</div>
                {a.meeting_link && (
                    <div className="mt-2"><a href={a.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open meeting</a></div>
                )}
            </div>
        );
    }

    function ConflictList({ items }: { items: any[] }) {
        const [expanded, setExpanded] = useState(false);
        const visible = expanded ? items : items.slice(0, 2);
        return (
            <div className="space-y-2">
                {visible.map((c) => <ConflictDetails key={c.assignment.id} conflict={c} />)}
                {items.length > 2 && (
                    <button type="button" onClick={() => setExpanded((s) => !s)} className="text-sm text-orange-700 underline">
                        {expanded ? 'Show less' : `Show ${items.length - 2} more`}
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
                <div role="alert" className="text-red-700 bg-red-100 p-2 rounded">{errors.form}</div>
            )}

            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isCheckingConflicts && 'Checking for scheduling conflicts'}
                {!isCheckingConflicts && conflicts.length === 0 && form.instructor_id && 'No conflicts detected'}
                {!isCheckingConflicts && conflicts.length > 0 && `${conflicts.length} scheduling conflict${conflicts.length > 1 ? 's' : ''} detected`}
                {conflictError && 'Unable to check conflicts.'}
            </div>

            {/* Conflict UI area */}
            {isCheckingConflicts && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 flex items-center gap-2">
                    <Spinner className="text-blue-600" />
                    <span className="text-sm text-blue-900">Checking for conflicts…</span>
                </div>
            )}
            {/* Bulk Mode Toggle */}
            {!isEdit && (
                <div className="bg-gray-50 p-4 rounded border">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={bulkMode}
                            onChange={(e) => setBulkMode(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="font-medium">Bulk Monthly Creation</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                        Create multiple classes automatically based on weekly schedule and package class count
                    </p>
                </div>
            )}

            {/* Bulk Mode Fields */}
            {bulkMode && !isEdit && (
                <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Package <span className="text-red-500">*</span></label>
                        <select
                            value={packageId}
                            onChange={(e) => setPackageId(e.target.value)}
                            className={`mt-1 block w-full p-2 border ${errors.package ? 'border-red-500' : 'border-gray-300'} rounded`}
                        >
                            <option value="">Select package</option>
                            {packages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                    {pkg.name} ({pkg.class_count} classes)
                                </option>
                            ))}
                        </select>
                        {errors.package && <p className="text-sm text-red-600">{errors.package}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Total Classes <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={totalClasses || ''}
                            onChange={(e) => setTotalClasses(Number(e.target.value))}
                            className={`mt-1 block w-full p-2 border ${errors.totalClasses ? 'border-red-500' : 'border-gray-300'} rounded`}
                            placeholder="Auto-filled from package"
                        />
                        {errors.totalClasses && <p className="text-sm text-red-600">{errors.totalClasses}</p>}
                        <p className="text-xs text-gray-600 mt-1">Will generate up to this many classes within the first calendar month</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Weekly Days <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: 'Sun', value: 0 },
                                { label: 'Mon', value: 1 },
                                { label: 'Tue', value: 2 },
                                { label: 'Wed', value: 3 },
                                { label: 'Thu', value: 4 },
                                { label: 'Fri', value: 5 },
                                { label: 'Sat', value: 6 },
                            ].map((day) => (
                                <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={weeklyDays.includes(day.value)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setWeeklyDays([...weeklyDays, day.value].sort((a, b) => a - b));
                                            } else {
                                                setWeeklyDays(weeklyDays.filter((d) => d !== day.value));
                                            }
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">{day.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.weeklyDays && <p className="text-sm text-red-600 mt-1">{errors.weeklyDays}</p>}
                    </div>

                    <div className="bg-white p-3 rounded border">
                        <p className="text-sm font-medium text-gray-700">Preview:</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {weeklyDays.length > 0 && totalClasses > 0
                                ? `Will generate up to ${totalClasses} classes on ${weeklyDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')} from ${form.class_date}`
                                : 'Select days and package to preview'}
                        </p>
                    </div>
                </div>
            )}


            {!isCheckingConflicts && conflictError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-red-900 mb-1">Unable to check conflicts</h4>
                            <p className="text-sm text-red-800">{conflictError}. You can still submit; please verify manually.</p>
                        </div>
                    </div>
                </div>
            )}

            {!isCheckingConflicts && !conflictError && form.instructor_id && conflicts.length === 0 && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-900">No scheduling conflicts detected</span>
                </div>
            )}

            {!isCheckingConflicts && !conflictError && conflicts.length > 0 && (
                <div className={`${conflicts.length > 1 ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 mb-4`}>
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className={`text-sm font-medium ${conflicts.length > 1 ? 'text-orange-900' : 'text-yellow-900'}`}>
                                {conflicts.length > 1 ? `${conflicts.length} Scheduling Conflicts` : 'Potential Scheduling Conflict'}
                            </h4>
                            <p className={`text-sm ${conflicts.length > 1 ? 'text-orange-800' : 'text-yellow-800'} mt-2`}>Please review the overlapping classes below.</p>
                            <div className="mt-3">
                                <ConflictList items={conflicts} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">
                        {bulkMode ? 'Start Date' : 'Class Date'} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={form.class_date}
                        onChange={(e) => setField('class_date', e.target.value)}
                        className={`mt-1 block w-full p-2 border ${errors.class_date ? 'border-red-500' : 'border-gray-300'} rounded`}
                        aria-invalid={!!errors.class_date}
                    />
                    {errors.class_date && <p className="text-sm text-red-600">{errors.class_date}</p>}
                    {bulkMode && <p className="text-xs text-gray-600 mt-1">First class will be on or after this date</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium">Start Time <span className="text-red-500">*</span></label>
                        <input
                            type="time"
                            step={900}
                            value={form.start_time}
                            onChange={(e) => setField('start_time', e.target.value)}
                            className={`mt-1 block w-full p-2 border ${errors.start_time ? 'border-red-500' : 'border-gray-300'} rounded`}
                            aria-invalid={!!errors.start_time}
                        />
                        {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">End Time <span className="text-red-500">*</span></label>
                        <input
                            type="time"
                            step={900}
                            value={form.end_time}
                            onChange={(e) => setField('end_time', e.target.value)}
                            className={`mt-1 block w-full p-2 border ${errors.end_time ? 'border-red-500' : 'border-gray-300'} rounded`}
                            aria-invalid={!!errors.end_time}
                        />
                        {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Timezone <span className="text-red-500">*</span></label>
                    <select
                        value={form.timezone}
                        onChange={(e) => setField('timezone', e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        aria-label="Timezone"
                    >
                        <option value="">Select timezone</option>
                        <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Your timezone</option>
                        {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Instructor {containerInstructor ? '(Default available)' : <span className="text-red-500">*</span>}</label>
                    {containerInstructor && (
                        <div className="bg-blue-50 p-2 rounded mb-2 text-sm">Default: {containerInstructor.name}</div>
                    )}
                    <select
                        value={form.instructor_id || ''}
                        onChange={(e) => setField('instructor_id', e.target.value || null)}
                        className={`mt-1 block w-full p-2 border ${errors.instructor_id ? 'border-red-500' : 'border-gray-300'} rounded`}
                        required={!containerInstructor}
                        aria-invalid={!!errors.instructor_id}
                    >
                        <option value="">{containerInstructor ? 'Use program default' : 'Select instructor'}</option>
                        {instructors.map((ins) => (
                            <option key={ins.id} value={ins.id}>{ins.name}{ins.id === containerInstructor?.id ? ' (Default)' : ''}</option>
                        ))}
                    </select>
                    {errors.instructor_id && <p className="text-sm text-red-600">{errors.instructor_id}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Meeting Link (optional)</label>
                <div className="flex gap-2 mt-1">
                    <input
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        value={form.meeting_link || ''}
                        onChange={(e) => setField('meeting_link', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded"
                    />
                    <button
                        type="button"
                        onClick={handleGenerateLink}
                        disabled={isGenerating}
                        className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {isGenerating ? 'Generating…' : 'Generate'}
                    </button>
                </div>
                {form.meeting_link && (
                    <p className="text-sm text-green-600 mt-1">Link looks good — <a href={form.meeting_link} target="_blank" rel="noreferrer" className="underline">test</a></p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value as AssignmentStatus)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    disabled={isEdit && form.status === 'completed'}
                >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                </select>
                {isEdit && form.status === 'completed' && <p className="text-sm text-gray-500 mt-1">Completed classes are read-only.</p>}
            </div>

            <div>
                <label className="block text-sm font-medium">Notes (optional)</label>
                <textarea
                    value={form.notes || ''}
                    onChange={(e) => setField('notes', e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    placeholder="Notes for instructor"
                />
                <p className="text-xs text-gray-500 mt-1">{(form.notes || '').length}/500</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white rounded">
                    {isSubmitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
                </button>
            </div>
        </form>
    );
}
