import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import AssignUserModal from './AssignUserModal'

interface NewAssignmentChooserProps {
    onClose: () => void
    onOpenSimplified: (initialBookingId?: string) => void
}

export const NewAssignmentChooser = ({ onClose, onOpenSimplified }: NewAssignmentChooserProps) => {
    const [showAssignUserModal, setShowAssignUserModal] = useState(false)

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">New Assignment</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                    </div>

                    <div className="px-6 py-6 space-y-4">
                        <p className="text-sm text-gray-600">Choose how you'd like to create the assignment.</p>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAssignUserModal(true)}
                                className="w-full px-4 py-3 text-left border rounded-md flex items-center space-x-3 hover:shadow-sm"
                            >
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                    <div className="font-medium">Add User to Public Class</div>
                                    <div className="text-xs text-gray-500">Select or create a public-group booking to assign.</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onOpenSimplified()}
                                className="w-full px-4 py-3 text-left border rounded-md flex items-center space-x-3 hover:shadow-sm"
                            >
                                <Plus className="w-5 h-5 text-green-600" />
                                <div>
                                    <div className="font-medium">Add Users to Other Classes</div>
                                    <div className="text-xs text-gray-500">Create assignments for monthly, crash-course, or adhoc bookings.</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {showAssignUserModal && (
                        <AssignUserModal
                            isOpen={showAssignUserModal}
                            onClose={() => setShowAssignUserModal(false)}
                            onAssigned={(bookingId: string) => {
                                setShowAssignUserModal(false)
                                onOpenSimplified(bookingId)
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default NewAssignmentChooser
