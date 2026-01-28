import { supabase } from '@/shared/lib/supabase'
import { useState, useEffect } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    container: any | null
    onFilled?: () => void
}

interface ShortfallAnalysis {
    calendarMonth: string
    requiredClasses: number
    scheduledClasses: number
    shortfall: number
    hasShortfall: boolean
    recommendations: Array<{
        date: Date
        dateString: string
        dayOfWeek: number
        reason: string
    }>
}

export default function FillShortfallModal({ isOpen, onClose, container, onFilled }: Props) {
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [analysis, setAnalysis] = useState<ShortfallAnalysis | null>(null)

    useEffect(() => {
        if (isOpen && container) {
            analyzeShortfall()
        } else {
            setAnalysis(null)
            setError(null)
        }
    }, [isOpen, container])

    async function analyzeShortfall() {
        if (!container?.id || !container?.package_id) return

        setAnalyzing(true)
        setError(null)
        try {
            // Get package details (class_count, recurring days if stored)
            const { data: pkg, error: pkgErr } = await supabase
                .from('class_packages')
                .select('class_count, name')
                .eq('id', container.package_id)
                .single()

            if (pkgErr) throw new Error('Failed to load package details')

            const requiredClasses = pkg?.class_count || 0

            // Get current month assignments for this container
            const now = new Date()
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

            const { data: assignments, error: assignErr } = await supabase
                .from('class_assignments')
                .select('id, date, schedule_type')
                .eq('class_container_id', container.id)
                .gte('date', `${monthKey}-01`)
                .lte('date', `${monthKey}-31`)

            if (assignErr) throw new Error('Failed to load assignments')

            const scheduledClasses = (assignments || []).length
            const shortfall = scheduledClasses - requiredClasses

            // Generate simple recommendations for remaining days in month
            const recommendations: Array<{
                date: Date
                dateString: string
                dayOfWeek: number
                reason: string
            }> = []

            if (shortfall < 0) {
                const needed = Math.abs(shortfall)
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                const existingDates = new Set((assignments || []).map((a: any) => a.date))

                // Find available dates after the last scheduled class
                let currentDate = new Date(now)
                while (recommendations.length < needed && currentDate <= lastDayOfMonth) {
                    const dateStr = currentDate.toISOString().split('T')[0]
                    if (!existingDates.has(dateStr) && currentDate > now) {
                        recommendations.push({
                            date: new Date(currentDate),
                            dateString: dateStr,
                            dayOfWeek: currentDate.getDay(),
                            reason: `Fill shortfall (${recommendations.length + 1}/${needed})`
                        })
                    }
                    currentDate.setDate(currentDate.getDate() + 1)
                }
            }

            setAnalysis({
                calendarMonth: monthKey,
                requiredClasses,
                scheduledClasses,
                shortfall,
                hasShortfall: shortfall < 0,
                recommendations
            })
        } catch (err: any) {
            setError(err?.message || 'Failed to analyze shortfall')
        } finally {
            setAnalyzing(false)
        }
    }

    async function handleFillShortfall() {
        if (!analysis || !analysis.hasShortfall || !container) return

        setLoading(true)
        setError(null)
        try {
            // Import the adjustment service
            const adjustmentSvc = await import('../../../../../../dashboard/components/Modules/ClassAssignmentManager/services/adjustmentClassService')

            // Get container instructor & package
            const instructorId = container.instructor_id
            const packageId = container.package_id

            if (!instructorId) throw new Error('Container must have an instructor assigned')
            if (!packageId) throw new Error('Container must have a package assigned')

            // Get default times from first assignment or use defaults
            const { data: firstAssignment } = await supabase
                .from('class_assignments')
                .select('start_time, end_time')
                .eq('class_container_id', container.id)
                .limit(1)
                .single()

            const startTime = firstAssignment?.start_time || '10:00'
            const endTime = firstAssignment?.end_time || '11:00'

            // Create adjustment classes for each recommendation
            let created = 0
            const errors: string[] = []

            for (const rec of analysis.recommendations) {
                try {
                    const result = await adjustmentSvc.createAdjustmentClass({
                        instructorId,
                        packageId,
                        calendarMonth: analysis.calendarMonth,
                        date: rec.dateString,
                        startTime,
                        endTime,
                        adjustmentReason: rec.reason,
                        bookingIds: [], // No specific bookings for adjustment
                        bookingType: container.container_type || 'individual',
                        paymentAmount: 0,
                        notes: `Auto-filled adjustment class for ${container.display_name}`
                    })

                    if (result.success) {
                        created++
                    } else {
                        errors.push(`${rec.dateString}: ${result.error}`)
                    }
                } catch (err: any) {
                    errors.push(`${rec.dateString}: ${err?.message || 'Failed'}`)
                }
            }

            if (errors.length > 0) {
                setError(`Created ${created} classes. Errors: ${errors.join(', ')}`)
            }

            if (created > 0) {
                onFilled?.()
                onClose()
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to fill shortfall')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded shadow-lg p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Fill Class Shortfall</h3>
                    <button onClick={onClose} aria-label="Close" className="text-gray-600 hover:text-gray-900">
                        ✕
                    </button>
                </div>

                {error && (
                    <div role="alert" className="mb-4 text-red-700 bg-red-100 p-2 rounded">
                        {error}
                    </div>
                )}

                {analyzing ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-600">Analyzing schedule...</p>
                    </div>
                ) : !analysis ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">Unable to load analysis</p>
                    </div>
                ) : !analysis.hasShortfall ? (
                    <div className="text-center py-8">
                        <div className="text-emerald-600 mb-2">✓</div>
                        <p className="text-sm font-medium">No shortfall detected</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Scheduled {analysis.scheduledClasses} / {analysis.requiredClasses} classes for {analysis.calendarMonth}
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
                            <h4 className="text-sm font-medium text-amber-900">Shortfall Detected</h4>
                            <p className="text-sm text-amber-800 mt-1">
                                {analysis.scheduledClasses} of {analysis.requiredClasses} classes scheduled for {analysis.calendarMonth}
                            </p>
                            <p className="text-sm text-amber-800">
                                <strong>{Math.abs(analysis.shortfall)} class{Math.abs(analysis.shortfall) !== 1 ? 'es' : ''} missing</strong>
                            </p>
                        </div>

                        {analysis.recommendations.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-600">No available dates found in this month</p>
                                <p className="text-xs text-gray-500 mt-1">Consider creating classes manually or waiting for next month's automation</p>
                            </div>
                        ) : (
                            <>
                                <h4 className="text-sm font-medium mb-2">Recommended Dates</h4>
                                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                    {analysis.recommendations.map((rec, idx) => (
                                        <div key={rec.dateString} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <div className="text-sm font-medium">{new Date(rec.dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                                <div className="text-xs text-gray-500">{rec.reason}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">#{idx + 1}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                                    <button
                                        type="button"
                                        onClick={handleFillShortfall}
                                        disabled={loading}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : `Fill ${analysis.recommendations.length} Class${analysis.recommendations.length !== 1 ? 'es' : ''}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
