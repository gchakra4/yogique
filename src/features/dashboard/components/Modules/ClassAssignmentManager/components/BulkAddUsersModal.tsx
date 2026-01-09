import { X } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../../../../../shared/lib/supabase'
import { createAssignmentBookings } from '../services/assignmentCreation'

interface BulkAddUsersModalProps {
    isOpen: boolean
    onClose: () => void
    assignments: any[]
    onDone?: () => void
}

const parseLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return null
    // Try format: Name <email@example.com>
    const m = trimmed.match(/^(.*)<([^>\s]+@[^>\s]+)>$/)
    if (m) {
        return { name: m[1].trim(), email: m[2].trim() }
    }
    // If it's an email
    if (trimmed.includes('@')) {
        return { name: '', email: trimmed }
    }
    // Otherwise ignore
    return null
}

export const BulkAddUsersModal = ({ isOpen, onClose, assignments, onDone }: BulkAddUsersModalProps) => {
    const [text, setText] = useState('')
    const [selectedAssignment, setSelectedAssignment] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async () => {
        setError('')
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        const parsed = lines.map(parseLine).filter(Boolean) as { name: string, email: string }[]
        if (parsed.length === 0) {
            setError('No valid emails found')
            return
        }
        if (!selectedAssignment) {
            setError('Please select an assignment to add users to')
            return
        }

        setSaving(true)
        try {
            // Build booking rows
            const today = new Date().toISOString().split('T')[0]
            const bookingsPayload = parsed.map(p => {
                const random = Math.floor(1000 + Math.random() * 9000)
                const booking_id = `YOG-${today.replace(/-/g, '')}-${random}`
                const names = (p.name || '').split(/\s+/)
                return {
                    booking_id,
                    first_name: names[0] || '',
                    last_name: names.slice(1).join(' ') || '',
                    email: p.email,
                    phone: '',
                    booking_type: 'public_group',
                    class_package_id: null,
                    status: 'confirmed',
                    class_name: 'Public Group',
                    class_date: today,
                    class_time: '09:00',
                    instructor: 'TBD',
                    experience_level: 'all',
                    payment_status: 'pending'
                }
            })

            const { data: inserted, error: insertErr } = await supabase
                .from('bookings')
                .insert(bookingsPayload)
                .select('booking_id')

            if (insertErr) throw insertErr

            const bookingIds = (inserted || []).map((r: any) => r.booking_id).filter(Boolean)
            if (bookingIds.length === 0) throw new Error('No bookings were created')

            // Link bookings to assignment
            await createAssignmentBookings(selectedAssignment, bookingIds)

            if (onDone) await onDone()
            onClose()
        } catch (e: any) {
            console.error('Bulk add error', e)
            setError(e.message || 'Failed to add users')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Bulk Add Users to Group</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                    </div>

                    <div className="px-6 py-4 space-y-4">
                        <p className="text-sm text-gray-600">Paste one email per line, or "Name &lt;email&gt;" per line.</p>

                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="w-full border rounded p-2" />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Assignment</label>
                            <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} className="w-full px-3 py-2 border rounded">
                                <option value="">-- Select assignment --</option>
                                {assignments.filter(a => a.container_type === 'public_group' || a.booking_type === 'public_group').map(a => (
                                    <option key={a.id} value={a.id}>{a.name || a.class_name || a.id} • {a.start_date || ''}</option>
                                ))}
                            </select>
                        </div>

                        {error && <div className="text-red-600 text-sm">{error}</div>}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                        <button onClick={onClose} className="px-3 py-2 border rounded" disabled={saving}>Cancel</button>
                        <button onClick={handleSubmit} className="px-3 py-2 bg-blue-600 text-white rounded" disabled={saving}>{saving ? 'Adding...' : 'Add Users'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BulkAddUsersModal
