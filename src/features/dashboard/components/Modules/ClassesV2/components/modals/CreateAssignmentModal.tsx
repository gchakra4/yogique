import { useState } from 'react'
import AssignmentForm from '../../forms/AssignmentForm'

interface Props {
    isOpen: boolean
    onClose: () => void
    containerId: string
    containerInstructor?: { id: string; name: string } | null
    containerTimezone?: string | null
    onCreated?: (assignment: any) => void
}

export default function CreateAssignmentModal({
    isOpen,
    onClose,
    containerId,
    containerInstructor,
    containerTimezone,
    onCreated,
}: Props) {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    async function handleSubmit(data: any) {
        setError(null)
        setLoading(true)
        try {
            // Try to use local service if available
            let created: any = null
            try {
                // Prefer the local ClassesV2 assignment service which supports bulk/monthly payloads.
                let svcMod: any = null
                try {
                    const local = await import('../../services/assignment.service')
                    svcMod = (local as any).default ?? (local as any)
                } catch (localErr) {
                    // Fallback to global v2 service if local not available
                    const remote = await import('@/features/dashboard/services/v2/assignment.service')
                    svcMod = (remote as any).default ?? (remote as any)
                }

                const service = svcMod
                if (typeof service.createAssignment === 'function') {
                    const result = await service.createAssignment(data)
                    if (result && result.success) created = result.data
                    else throw new Error(result?.error?.message || 'Service failed to create assignment')
                } else {
                    throw new Error('createAssignment not found on service')
                }
            } catch (svcErr) {
                // Fallback: attempt POST to /api/assignments
                const res = await fetch('/api/assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })
                if (!res.ok) throw new Error(`Server responded ${res.status}`)
                created = await res.json()
            }

            onCreated?.(created)
            onClose()
        } catch (err: any) {
            setError(err?.message || 'Failed to create assignment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Create Class</h3>
                    <button onClick={onClose} aria-label="Close" className="text-gray-600">
                        ✕
                    </button>
                </div>

                {error && (
                    <div role="alert" className="mb-4 text-red-700 bg-red-100 p-2 rounded">
                        {error}
                    </div>
                )}

                <AssignmentForm
                    containerId={containerId}
                    containerInstructor={containerInstructor}
                    containerTimezone={containerTimezone}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                />

                {loading && <div className="mt-4 text-sm text-gray-600">Creating class…</div>}
            </div>
        </div>
    )
}
