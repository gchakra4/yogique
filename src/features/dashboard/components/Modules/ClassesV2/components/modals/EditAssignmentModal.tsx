import { supabase } from '@/shared/lib/supabase'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AssignmentForm from '../../forms/AssignmentForm'

interface Props {
    isOpen: boolean
    onClose: () => void
    assignment: any | null
    containerId?: string
    onUpdated?: (assignment: any) => void
    onDeleted?: (assignmentId: string) => void
}

export default function EditAssignmentModal({
    isOpen,
    onClose,
    assignment,
    containerId,
    onUpdated,
    onDeleted,
}: Props) {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Fetch enrolled students for this assignment
    useEffect(() => {
        async function fetchEnrolledStudents() {
            if (!isOpen || !assignment?.id) return

            setLoadingStudents(true)
            try {
                const { data, error } = await supabase
                    .from('assignment_bookings')
                    .select('booking_id, bookings:booking_id(booking_id, first_name, last_name, email, status)')
                    .eq('assignment_id', assignment.id)

                if (error) throw error

                setEnrolledStudents(data || [])
            } catch (err) {
                console.warn('Failed to fetch enrolled students:', err)
                setEnrolledStudents([])
            } finally {
                setLoadingStudents(false)
            }
        }

        fetchEnrolledStudents()
    }, [isOpen, assignment?.id])

    // Reset error when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setError(null)
            setLoading(false)
            setEnrolledStudents([])
            setShowDeleteConfirm(false)
        }
    }, [isOpen])

    if (!isOpen || !assignment) return null

    // Map assignment data to match AssignmentForm expected format
    const formattedAssignment = {
        ...assignment,
        class_date: assignment.date || assignment.class_date,
        instructor_id: assignment.instructor_id,
        instructor_name: assignment.instructor?.full_name || assignment.instructor_name,
        status: assignment.class_status || assignment.status || 'scheduled',
    }

    async function handleDelete() {
        setError(null)
        setLoading(true)
        try {
            const { error: deleteErr } = await supabase
                .from('class_assignments')
                .delete()
                .eq('id', assignment.id)

            if (deleteErr) throw deleteErr

            onDeleted?.(assignment.id)
            onClose()
        } catch (err: any) {
            setError(err?.message || 'Failed to delete class')
        } finally {
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    async function handleSubmit(data: any) {
        setError(null)
        setLoading(true)
        try {
            // Try to use local service if available
            let updated: any = null
            try {
                // Prefer local ClassesV2 assignment service for updates
                let svcMod: any = null
                try {
                    const local = await import('../../services/assignment.service')
                    svcMod = (local as any).default ?? (local as any)
                } catch (localErr) {
                    const remote = await import('@/features/dashboard/services/v2/assignment.service')
                    svcMod = (remote as any).default ?? (remote as any)
                }

                const service = svcMod
                if (typeof service.updateAssignment === 'function') {
                    const result = await service.updateAssignment(assignment.id, data)
                    if (result && result.success) updated = result.data
                    else throw new Error(result?.error?.message || 'Service failed to update assignment')
                } else {
                    throw new Error('updateAssignment not found on service')
                }
            } catch (svcErr) {
                // Fallback: attempt PUT/PATCH to /api/assignments/:id
                const res = await fetch(`/api/assignments/${assignment.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })
                if (!res.ok) throw new Error(`Server responded ${res.status}`)
                updated = await res.json()
            }

            onUpdated?.(updated)
            onClose()
        } catch (err: any) {
            setError(err?.message || 'Failed to update assignment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Class</h3>
                    <button onClick={onClose} aria-label="Close" className="text-gray-600 hover:text-gray-900">
                        ✕
                    </button>
                </div>

                {error && (
                    <div role="alert" className="mb-4 text-red-700 bg-red-100 p-2 rounded">
                        {error}
                    </div>
                )}

                {/* Enrolled Students Section */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Enrolled Students</h4>
                        <span className="text-xs text-gray-500">({enrolledStudents.length})</span>
                    </div>

                    {loadingStudents ? (
                        <p className="text-sm text-gray-500">Loading students...</p>
                    ) : enrolledStudents.length === 0 ? (
                        <p className="text-sm text-gray-500">No students enrolled in this class yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {enrolledStudents.map((item: any, idx: number) => {
                                const booking = item.bookings
                                const studentName = (booking?.first_name || booking?.last_name)
                                    ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
                                    : booking?.booking_id || item.booking_id

                                return (
                                    <div key={`${item.booking_id}-${idx}`} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{studentName}</div>
                                            <div className="text-xs text-gray-500">{booking?.email || ''}</div>
                                        </div>
                                        <div className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                                            {booking?.status || 'enrolled'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <AssignmentForm
                    containerId={containerId || assignment.class_container_id}
                    assignment={formattedAssignment}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                />

                {loading && <div className="mt-4 text-sm text-gray-600">Updating class…</div>}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 mb-3">
                            Are you sure you want to delete this class? This will also remove all student assignments for this specific class.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Button */}
                {!showDeleteConfirm && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Class
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
