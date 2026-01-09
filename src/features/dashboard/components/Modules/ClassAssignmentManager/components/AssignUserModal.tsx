import { Save, X } from 'lucide-react'
import { useState } from 'react'
import { QuickBookingForm } from './QuickBookingForm'
import { BookingSelector } from '../../../../../../shared/components/ui/BookingSelector'

interface AssignUserModalProps {
    isOpen: boolean
    onClose: () => void
    // optional package to preselect when creating booking
    defaultPackageId?: string
    onAssigned: (bookingId: string) => void
}

export const AssignUserModal = ({ isOpen, onClose, defaultPackageId, onAssigned }: AssignUserModalProps) => {
    const [selectedBookingId, setSelectedBookingId] = useState('')
    const [loading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Assign User to Public Group</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Existing Public Booking</label>
                            <BookingSelector
                                selectedBookingId={selectedBookingId}
                                onBookingSelect={(id) => setSelectedBookingId(id)}
                                bookingType={'public_group'}
                            />
                        </div>

                        <div className="text-center text-sm text-gray-600">OR</div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Create New Public Booking</label>
                            {showCreate ? (
                                <QuickBookingForm
                                    onBookingCreated={(bookingId) => { onAssigned(bookingId); onClose() }}
                                    onCancel={() => setShowCreate(false)}
                                    initialBookingType={'public_group'}
                                    initialClassPackageId={defaultPackageId}
                                />
                            ) : (
                                <div className="flex justify-end">
                                    <button onClick={() => setShowCreate(true)} className="px-3 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>Create Public Booking</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-3 py-2 border rounded-md">Cancel</button>
                        <button
                            onClick={() => { if (selectedBookingId) { onAssigned(selectedBookingId); onClose() } }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md"
                            disabled={!selectedBookingId || loading}
                        >
                            <Save className="w-4 h-4 mr-2 inline" /> Assign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AssignUserModal
