import AssignmentBookingsService from '@/features/dashboard/services/v2/assignment-bookings.service';
import { supabase } from '@/shared/lib/supabase';
import FocusTrap from 'focus-trap-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CapacityIndicator } from './CapacityIndicator';
import AssignStudentsModal from './modals/AssignStudentsModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import EditAssignmentModal from './modals/EditAssignmentModal';
import FillShortfallModal from './modals/FillShortfallModal';

interface ContainerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    container: any | null;
    onEdit?: () => void;
    onDelete?: () => void;
    onArchive?: () => void;
    onCreateAssignment?: () => void;
    onEditAssignment?: (assignmentId: string) => void;
    onAssignStudents?: () => void;
    width?: 'default' | 'wide' | 'full';
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
}

export const ContainerDrawer: React.FC<ContainerDrawerProps> = ({
    isOpen,
    onClose,
    container,
    onEdit,
    onDelete,
    onArchive,
    onCreateAssignment,
    onEditAssignment,
    onAssignStudents,
    width = 'default',
    closeOnBackdropClick = true,
    closeOnEscape = true,
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
    const [unassignTarget, setUnassignTarget] = useState<any | null>(null);
    const [isEditAssignmentModalOpen, setIsEditAssignmentModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
    const [isFillShortfallModalOpen, setIsFillShortfallModalOpen] = useState(false);
    const location = useLocation();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const ANIM_MS = 300;

    const bookingsService = useMemo(() => new AssignmentBookingsService(), []);

    useEffect(() => {
        const calc = () => setIsMobile(window.innerWidth < 768);
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    // Close on route change
    useEffect(() => {
        if (isOpen) handleRequestClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                handleRequestClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, closeOnEscape]);

    useEffect(() => {
        if (isOpen && container?.id) fetchEnrolled();
        if (isOpen && container?.id) fetchAssignments();
        if (!isOpen) setEnrolledStudents([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, container?.id]);

    const fetchAssignments = async () => {
        if (!container?.id) return;
        setIsLoadingAssignments(true);
        try {
            const { data, error } = await supabase
                .from('class_assignments')
                .select('id, date, start_time, end_time, instructor_id, class_status, notes')
                .eq('class_container_id', container.id)
                .order('date', { ascending: true })
                .limit(200);

            if (error) {
                console.warn('fetchAssignments error', error);
                setAssignments([]);
            } else {
                setAssignments(data || []);
            }
        } catch (e) {
            console.warn('fetchAssignments exception', e);
            setAssignments([]);
        } finally {
            setIsLoadingAssignments(false);
        }
    };

    const handleRequestClose = () => {
        setIsClosing(true);
        // allow animation to play
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, ANIM_MS);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (!closeOnBackdropClick) return;
        if (e.target === e.currentTarget) handleRequestClose();
    };

    const fetchEnrolled = async () => {
        if (!container?.id) return;
        setIsLoadingEnrolled(true);
        try {
            const res = await bookingsService.getBookingsForProgram(container.id);
            if (res.success) {
                // Deduplicate students by booking_id
                const uniqueStudentsMap = new Map<string, any>();
                (res.data || []).forEach((item: any) => {
                    if (!uniqueStudentsMap.has(item.booking_id)) {
                        uniqueStudentsMap.set(item.booking_id, item);
                    }
                });
                setEnrolledStudents(Array.from(uniqueStudentsMap.values()));
            } else {
                console.warn('Failed to fetch enrolled students', res.error);
                setEnrolledStudents([]);
            }
        } catch (e) {
            console.warn('fetchEnrolled error', e);
            setEnrolledStudents([]);
        } finally {
            setIsLoadingEnrolled(false);
        }
    };

    if (!isOpen && !isClosing) return null;

    const widthClass = {
        default: 'w-[400px]',
        wide: 'w-[500px]',
        full: 'w-[600px]',
    }[width];

    const slideClass = isOpen && !isClosing ? 'translate-x-0 translate-y-0' : isMobile ? 'translate-y-full' : 'translate-x-full';

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}
                onMouseDown={handleBackdropClick}
                aria-hidden
            />

            <FocusTrap
                active={isOpen}
                focusTrapOptions={{
                    initialFocus: () => panelRef.current ?? undefined,
                    allowOutsideClick: true,
                    escapeDeactivates: false,
                    returnFocusOnDeactivate: true,
                }}
            >
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="drawer-title"
                    className={`fixed ${isMobile ? 'inset-x-0 bottom-0 rounded-t-2xl' : 'top-0 right-0 bottom-0'} bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ${isMobile ? 'h-[80vh]' : widthClass} ${slideClass}`}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <header className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                            <div>
                                <h3 id="drawer-title" className="text-lg font-semibold">
                                    {container?.display_name ?? 'Container details'}
                                </h3>
                                <p className="text-sm text-muted-foreground">{container?.package_name ?? ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    aria-label="Assign students"
                                    onClick={() => setIsAssignModalOpen(true)}
                                    className="px-3 py-1 text-sm rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                    + Assign Students
                                </button>
                                <button
                                    aria-label="Edit container"
                                    onClick={onEdit}
                                    className="px-3 py-1 text-sm rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                    Edit
                                </button>
                                <button
                                    aria-label="Close drawer"
                                    onClick={handleRequestClose}
                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800"
                                >
                                    ×
                                </button>
                            </div>
                        </header>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {/* Details */}
                            <section className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Details</h4>
                                <div className="grid grid-cols-2 gap-3 items-center">
                                    <div>
                                        <p className="text-xs text-gray-500">Instructor</p>
                                        <p className="text-sm">{container?.instructor_name ?? 'Unassigned'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Capacity</p>
                                        <div className="mt-1">
                                            <CapacityIndicator current={enrolledStudents.length} max={container?.capacity_total ?? container?.max_booking_count ?? 0} size="sm" showLabel />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="text-sm">{container?.status ?? '—'}</p>
                                </div>
                            </section>

                            {/* Assignments */}
                            <section className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium">Assignments</h4>
                                    <div className="text-sm">
                                        <button onClick={onCreateAssignment} className="text-sm text-emerald-600 mr-3">+ Create Assignment</button>
                                        <button onClick={() => setIsFillShortfallModalOpen(true)} className="text-sm text-amber-600 mr-3">Fill Shortfall</button>
                                        <button onClick={fetchAssignments} className="text-sm text-gray-500">Refresh</button>
                                    </div>
                                </div>

                                <div className="rounded-md border border-gray-100 dark:border-slate-800 p-3">
                                    {isLoadingAssignments ? (
                                        <p className="text-sm text-gray-500">Loading assignments...</p>
                                    ) : assignments.length === 0 ? (
                                        <p className="text-sm text-gray-500">No assignments found for this container.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {assignments.map((a: any, idx: number) => (
                                                <li key={`${a.id ?? a.assignment_code ?? a.date}-${idx}`} className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium">{a.date ? new Date(a.date).toLocaleDateString() : '—'} {a.start_time ? `• ${a.start_time}` : ''}</div>
                                                        <div className="text-xs text-gray-500">{a.instructor?.full_name ?? a.instructor_id ?? 'Unassigned'} • {a.class_status ?? '—'}</div>
                                                    </div>
                                                    <div className="text-sm text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAssignment(a);
                                                                setIsEditAssignmentModalOpen(true);
                                                            }}
                                                            className="text-xs text-emerald-600 mr-3"
                                                        >
                                                            Edit
                                                        </button>
                                                        {/* deletion/editing of assignments may be handled by parent modals */}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </section>

                            {/* Students placeholder */}
                            <section className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Enrolled Students</h4>
                                <div className="rounded-md border border-gray-100 dark:border-slate-800 p-3">
                                    {isLoadingEnrolled ? (
                                        <p className="text-sm text-gray-500">Loading students...</p>
                                    ) : enrolledStudents.length === 0 ? (
                                        <p className="text-sm text-gray-500">No students enrolled.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {enrolledStudents.map((e: any, idx: number) => (
                                                <li key={`${e.booking_id}-${idx}`} className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium">{(e.booking && (e.booking.first_name || e.booking.last_name)) ? `${e.booking.first_name ?? ''} ${e.booking.last_name ?? ''}`.trim() : e.booking?.booking_id || e.booking_id}</div>
                                                        <div className="text-xs text-gray-500">{e.booking?.status}</div>
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={() => {
                                                                const studentName = (e.booking && (e.booking.first_name || e.booking.last_name))
                                                                    ? `${e.booking.first_name ?? ''} ${e.booking.last_name ?? ''}`.trim()
                                                                    : e.booking?.booking_id || e.booking_id;
                                                                setUnassignTarget({ bookingId: e.booking_id, studentName });
                                                                setIsUnassignModalOpen(true);
                                                            }}
                                                            className="text-sm text-rose-600"
                                                        >
                                                            Unassign
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="mt-3">
                                        <button onClick={() => setIsAssignModalOpen(true)} className="text-sm text-emerald-600">+ Assign Students</button>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <footer className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onDelete}
                                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                                <button
                                    onClick={onArchive}
                                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    Archive
                                </button>
                                <button
                                    onClick={onEdit}
                                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Container
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            </FocusTrap>
            <AssignStudentsModal
                container={container}
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSuccess={async () => {
                    setIsAssignModalOpen(false);
                    await fetchEnrolled();
                    onAssignStudents?.();
                }}
            />

            <DeleteConfirmModal
                isOpen={isUnassignModalOpen}
                onClose={() => {
                    setIsUnassignModalOpen(false);
                    setUnassignTarget(null);
                }}
                title="Unassign student"
                message={unassignTarget ? `Are you sure you want to unassign ${unassignTarget.studentName} from this program?` : 'Are you sure you want to unassign this student from this program?'}
                onConfirm={async () => {
                    try {
                        if (!container?.id || !unassignTarget?.bookingId) return;
                        await bookingsService.unassignBookingFromProgram(container.id, unassignTarget.bookingId);
                        await fetchEnrolled();
                        onAssignStudents?.();
                    } catch (err) {
                        console.warn('unassign failed', err);
                    } finally {
                        setIsUnassignModalOpen(false);
                        setUnassignTarget(null);
                    }
                }}
            />

            <EditAssignmentModal
                isOpen={isEditAssignmentModalOpen}
                onClose={() => {
                    setIsEditAssignmentModalOpen(false);
                    setSelectedAssignment(null);
                }}
                assignment={selectedAssignment}
                containerId={container?.id}
                onUpdated={async () => {
                    setIsEditAssignmentModalOpen(false);
                    setSelectedAssignment(null);
                    await fetchAssignments();
                }}
            />

            <FillShortfallModal
                isOpen={isFillShortfallModalOpen}
                onClose={() => setIsFillShortfallModalOpen(false)}
                container={container}
                onFilled={async () => {
                    setIsFillShortfallModalOpen(false);
                    await fetchAssignments();
                }}
            />
        </div>
    );
};

export default ContainerDrawer;
