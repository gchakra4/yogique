import { Button } from '@/shared/components/ui/Button'
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner'
import { supabase } from '@/shared/lib/supabase'
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
    booking: any
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    bookingsService: any
}

export default function AssignToProgram({ booking, isOpen, onClose, onSuccess, bookingsService }: Props) {
    const [programs, setPrograms] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [allowOverride, setAllowOverride] = useState(false)


    useEffect(() => {
        if (isOpen) fetchAvailablePrograms()
        else {
            setPrograms([])
            setSelectedProgram(null)
            setError(null)
            setAllowOverride(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, booking?.id])

    const fetchAvailablePrograms = async () => {
        setLoading(true)
        try {
            const pkgId = booking?.class_packages?.id || booking?.package_type || null
            let query = supabase.from('class_containers').select(`*, containers_packages:class_packages(id,name)`)
                .eq('is_active', true)

            if (pkgId) {
                query = query.eq('package_id', pkgId)
            }

            const { data, error } = await query.order('start_date', { ascending: true }).limit(100)
            if (error) throw error
            setPrograms(data || [])
        } catch (err: any) {
            console.error('Error fetching programs:', err)
            setPrograms([])
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedProgram) return
        setSubmitting(true)
        setError(null)

        try {
            const res = await bookingsService.assignBookingsToContainer(selectedProgram, [booking.id], { allowCapacityOverride: allowOverride })
            if (res && res.success) {
                onSuccess()
            } else {
                setError(res?.error || 'Assignment failed')
            }
        } catch (err: any) {
            console.error('Assignment error:', err)
            setError(err?.message || 'Assignment failed')
        } finally {
            setSubmitting(false)
        }
    }

    const selectedProgramData = programs.find(p => p.id === selectedProgram)
    const willExceedCapacity = selectedProgramData ? (selectedProgramData.capacity_booked || 0) >= (selectedProgramData.capacity || 0) : false

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Assign to Program</h3>
                            <p className="text-sm text-gray-600 mt-1">Student: {booking.first_name} {booking.last_name} | Package: {booking.class_packages?.name || booking.package_type || 'N/A'}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <input
                            type="search"
                            placeholder="Search programs..."
                            onChange={(e) => {
                                // basic client-side search filter
                                const q = e.target.value.toLowerCase()
                                if (!q) fetchAvailablePrograms()
                                else setPrograms(prev => prev.filter(p => (p.name || '').toLowerCase().includes(q) || (p.schedule || '').toLowerCase().includes(q)))
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {willExceedCapacity && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-orange-900">Capacity Exceeded</p>
                                    <p className="text-sm text-orange-700 mt-1">This program is at capacity ({selectedProgramData?.capacity_booked}/{selectedProgramData?.capacity}). Override will be logged.</p>
                                    <label className="flex items-center mt-2">
                                        <input type="checkbox" checked={allowOverride} onChange={(e) => setAllowOverride(e.target.checked)} className="mr-2" />
                                        <span className="text-sm text-orange-900">Allow capacity override</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-12"><LoadingSpinner /></div>
                    )}

                    {!loading && programs.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs found</h3>
                            <p className="text-gray-600">No active programs match this booking's package.</p>
                        </div>
                    )}

                    {!loading && programs.length > 0 && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {programs.map((program) => {
                                const isSelected = selectedProgram === program.id
                                const isAtCapacity = (program.capacity_booked || 0) >= (program.capacity || 0)

                                return (
                                    <div key={program.id} onClick={() => setSelectedProgram(program.id)} className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-gray-900">{program.name}</h4>
                                                    {isAtCapacity && (<span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">At Capacity</span>)}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                                                    <div><span className="text-gray-500">Instructor:</span> {program.instructor_name || 'TBD'}</div>
                                                    <div><span className="text-gray-500">Capacity:</span> <span className={isAtCapacity ? 'text-orange-600 font-medium' : ''}>{program.capacity_booked || 0}/{program.capacity}</span></div>
                                                    <div><span className="text-gray-500">Schedule:</span> {program.schedule}</div>
                                                    <div><span className="text-gray-500">Status:</span> <span className="capitalize">{program.status}</span></div>
                                                </div>

                                                {program.start_date && (<div className="mt-2 text-xs text-gray-600">Starts: {new Date(program.start_date).toLocaleDateString()}</div>)}
                                            </div>
                                            {isSelected && (<CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-sm text-gray-600">{programs.length} program{programs.length !== 1 ? 's' : ''} available</div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleAssign} disabled={!selectedProgram || submitting || (willExceedCapacity && !allowOverride)}>
                                {submitting ? 'Assigning...' : 'Assign to Program'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
