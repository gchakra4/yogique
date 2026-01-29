import AssignmentBookingsService from '@/features/dashboard/services/v2/assignment-bookings.service';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    container: any; // container object with id, capacity_total, capacity_booked, enrolled_count
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (result: { assignedCount: number }) => void;
}

export default function AssignStudentsModal({ container, isOpen, onClose, onSuccess }: Props) {
    const service = useMemo(() => new AssignmentBookingsService(), []);

    const [bookings, setBookings] = useState<any[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [onlyAvailable, setOnlyAvailable] = useState(true);
    const [allowOverride, setAllowOverride] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const res = await service.getAvailableBookings(container.id, { search: search || undefined });
                if (res.success) setBookings(res.data || []);
                else setError(res.error?.message || 'Failed to load bookings');
            } catch (e: any) {
                setError(e?.message || String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [isOpen, container?.id, search]);

    useEffect(() => {
        if (!isOpen) {
            setSelected(new Set());
            setSearch('');
            setBookings([]);
            setError(null);
        }
    }, [isOpen]);

    const toggle = (id: string) => {
        setSelected(prev => {
            const copy = new Set(prev);
            if (copy.has(id)) copy.delete(id);
            else copy.add(id);
            return copy;
        });
    };

    const toggleAll = () => {
        if (selected.size === bookings.length) setSelected(new Set());
        else setSelected(new Set(bookings.map(b => b.booking_id)));
    };

    const availableSlots = (container.capacity_total ?? Infinity) - (container.capacity_booked ?? 0);
    const willExceed = selected.size > (availableSlots as number);

    const handleAssign = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const bookingIds = Array.from(selected);
            if (bookingIds.length === 0) {
                setError('Select at least one booking');
                return;
            }

            const res = await service.assignBookingsToContainer(container.id, bookingIds, { overrideCapacity: allowOverride });
            if (!res.success) {
                const errCode = res.error?.code;
                const errDetails = res.error?.details;

                if (errCode === 'PACKAGE_MISMATCH') {
                    setError(`❌ Package mismatch: Cannot assign bookings from different packages. ${errDetails ? JSON.stringify(errDetails) : ''}`);
                } else {
                    setError(res.error?.message || 'Assignment failed');
                }
                console.error('[AssignStudentsModal] Assignment error:', res.error);
            } else {
                const assignedCount = res.data?.assignedCount ?? 0;
                const packageMismatches = res.data?.packageMismatches || [];

                console.log('[AssignStudentsModal] Assignment result:', res.data);

                if (packageMismatches.length > 0) {
                    alert(`⚠️ ${packageMismatches.length} booking(s) skipped due to package mismatch. Check console for details.`);
                }

                // Refresh available bookings so UI reflects updated booking statuses
                try {
                    const refreshRes = await service.getAvailableBookings(container.id, { search: undefined });
                    if (refreshRes.success) {
                        setBookings(refreshRes.data || []);
                    }
                } catch (e) {
                    console.warn('[AssignStudentsModal] Failed to refresh bookings after assignment', e);
                }

                // optimistic UI: call onSuccess and close
                onSuccess?.({ assignedCount });
                onClose();
            }
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none opacity-0'}`} aria-hidden={!isOpen}>
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <h3 className="text-lg font-medium">Assign Students to Program</h3>
                        <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <input placeholder="Search by booking ID" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 p-2 border rounded" />
                            <button onClick={toggleAll} className="px-3 py-2 bg-gray-100 rounded">{selected.size === bookings.length ? 'Clear' : 'Select all'}</button>
                        </div>

                        <div className="text-sm text-gray-600">Showing bookings matching container package. {loading && 'Loading...'}</div>

                        {error && <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-800">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-auto">
                            {bookings.length === 0 && !loading && (<div className="text-sm text-gray-600">No bookings available</div>)}
                            {bookings.map(b => {
                                const bid = b.booking_id || b.bookingId || b.id;
                                const studentName = (b.first_name || b.firstName ? `${b.first_name || b.firstName} ${b.last_name || b.lastName || ''}`.trim() : undefined) || b.student_name || b.student_id;
                                return (
                                    <label key={bid} className={`flex items-start gap-3 p-3 border rounded ${selected.has(bid) ? 'ring-2 ring-emerald-300' : ''}`}>
                                        <input type="checkbox" checked={selected.has(bid)} onChange={() => toggle(bid)} />
                                        <div>
                                            <div className="font-medium">{studentName || bid}</div>
                                            <div className="text-xs text-gray-500">{bid} • {b.status}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm">Selected: {selected.size}</div>
                                <div className="text-sm">
                                    Capacity: {(container.capacity_total ?? '∞')} total • Booked: {(container.capacity_booked ?? 0)}
                                </div>
                            </div>

                            {willExceed && (
                                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mt-2 text-sm text-orange-900">
                                    This selection will exceed capacity. Check to allow override.
                                    <div className="mt-2">
                                        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={allowOverride} onChange={e => setAllowOverride(e.target.checked)} /> Allow override</label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-4 py-3 border-t">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleAssign} disabled={submitting || selected.size === 0 || (willExceed && !allowOverride)} className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">
                            {submitting ? 'Assigning...' : willExceed ? 'Assign Anyway' : 'Assign Students'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
