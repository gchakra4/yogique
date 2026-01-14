import AssignmentBookingsService from '@/features/dashboard/services/v2/assignment-bookings.service';
import FocusTrap from 'focus-trap-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CapacityIndicator } from './CapacityIndicator';
import AssignStudentsModal from './modals/AssignStudentsModal';

interface ContainerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    container: any | null;
    onEdit?: () => void;
    onDelete?: () => void;
    onCreateAssignment?: () => void;
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
    onCreateAssignment,
    onAssignStudents,
    width = 'default',
    closeOnBackdropClick = true,
    closeOnEscape = true,
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
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
        if (!isOpen) setEnrolledStudents([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, container?.id]);

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
            if (res.success) setEnrolledStudents(res.data || []);
            else {
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
                                            <CapacityIndicator current={container?.capacity_used ?? 0} max={container?.capacity_total ?? 0} size="sm" showLabel />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="text-sm">{container?.status ?? '—'}</p>
                                </div>
                            </section>

                            {/* Assignments placeholder */}
                            <section className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Assignments</h4>
                                <div className="rounded-md border border-gray-100 dark:border-slate-800 p-3">
                                    <p className="text-sm text-gray-500">Assignments will appear here.</p>
                                    <div className="mt-3">
                                        <button onClick={onCreateAssignment} className="text-sm text-emerald-600">+ Create Assignment</button>
                                    </div>
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
                                            {enrolledStudents.map((e: any) => (
                                                <li key={e.booking_id} className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium">{e.bookings?.student_name || e.bookings?.student_id || e.booking_id}</div>
                                                        <div className="text-xs text-gray-500">{e.bookings?.status}</div>
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await bookingsService.unassignBookingFromProgram(container.id, e.booking_id);
                                                                    await fetchEnrolled();
                                                                    onAssignStudents?.();
                                                                } catch (err) {
                                                                    console.warn('unassign failed', err);
                                                                }
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
                                    className="px-3 py-2 text-sm rounded-md text-rose-600 hover:bg-rose-50"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={onEdit}
                                    className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                >
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
        </div>
    );
};

export default ContainerDrawer;
