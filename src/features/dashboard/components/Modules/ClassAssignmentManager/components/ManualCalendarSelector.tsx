import { Calendar, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ResponsiveActionButton from '../../../../../../shared/components/ui/ResponsiveActionButton'
import { ManualClassSelection } from '../types'

interface ManualCalendarSelectorProps {
    selections: ManualClassSelection[]
    onSelectionsChange: (selections: ManualClassSelection[]) => void
    totalClasses: number
}

export const ManualCalendarSelector = ({
    selections,
    onSelectionsChange,
    totalClasses
}: ManualCalendarSelectorProps) => {
    const [newSelection, setNewSelection] = useState<Partial<ManualClassSelection>>({
        date: '',
        start_time: '',
        end_time: ''
    })

    const addSelection = () => {
        if (newSelection.date && newSelection.start_time && newSelection.end_time) {
            const newSelections = [...selections, newSelection as ManualClassSelection]
            onSelectionsChange(newSelections)
            setNewSelection({ date: '', start_time: '', end_time: '' })
        }
    }

    const removeSelection = (index: number) => {
        const newSelections = selections.filter((_, i) => i !== index)
        onSelectionsChange(newSelections)
    }

    const updateSelection = (index: number, field: keyof ManualClassSelection, value: string) => {
        const newSelections = [...selections]
        newSelections[index] = { ...newSelections[index], [field]: value }
        onSelectionsChange(newSelections)
    }


    const isComplete = selections.length >= totalClasses

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manual Class Schedule
                </h4>
                <span className="text-sm text-gray-500">
                    {selections.length} of {totalClasses} classes scheduled
                </span>
            </div>

            {/* Existing Selections */}
            {selections.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Scheduled Classes
                    </h5>
                    {selections.map((selection, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={selection.date}
                                        onChange={(e) => updateSelection(index, 'date', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={selection.start_time}
                                        onChange={(e) => updateSelection(index, 'start_time', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={selection.end_time}
                                        onChange={(e) => updateSelection(index, 'end_time', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSelection(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Remove this class"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Selection */}
            {!isComplete && (
                <div className="space-y-3">
                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Add New Class
                    </h5>
                    <div className="flex items-end space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={newSelection.date || ''}
                                    onChange={(e) => setNewSelection({ ...newSelection, date: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                                <input
                                    type="time"
                                    value={newSelection.start_time || ''}
                                    onChange={(e) => setNewSelection({ ...newSelection, start_time: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">End Time</label>
                                <input
                                    type="time"
                                    value={newSelection.end_time || ''}
                                    onChange={(e) => setNewSelection({ ...newSelection, end_time: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <ResponsiveActionButton
                            type="button"
                            onClick={addSelection}
                            disabled={!newSelection.date || !newSelection.start_time || !newSelection.end_time}
                            className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                        </ResponsiveActionButton>
                    </div>
                </div>
            )}

            {/* Progress Indicator */}
            <div className="bg-gray-100 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((selections.length / totalClasses) * 100, 100)}%` }}
                ></div>
            </div>

            {/* Status Messages */}
            {isComplete && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                        ✓ All {totalClasses} classes have been scheduled
                    </p>
                </div>
            )}

            {selections.length > 0 && !isComplete && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        {totalClasses - selections.length} more class{totalClasses - selections.length !== 1 ? 'es' : ''} need to be scheduled
                    </p>
                </div>
            )}
        </div>
    )
}