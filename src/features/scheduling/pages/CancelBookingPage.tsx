import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { supabase } from '../../../shared/lib/supabase'

export default function CancelBookingPage() {
    const { bookingId } = useParams() as { bookingId?: string }
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!bookingId || !token) {
            setMessage('Invalid cancellation link.');
        }
    }, [bookingId, token])

    const handleCancel = async () => {
        if (!bookingId || !token) return setMessage('Missing booking id or token')
        setLoading(true)
        setMessage(null)
        try {
            const payload = { booking_id: bookingId, token, note }
            // Use Supabase Functions invoke so the Edge Function receives the payload
            const res = await supabase.functions.invoke('cancel-booking', { body: payload })
            if ((res as any).error) {
                setMessage(`Cancellation failed: ${(res as any).error.message || JSON.stringify(res)}`)
            } else {
                setMessage('Booking cancelled successfully.')
                // Redirect to profile after short delay
                setTimeout(() => navigate('/profile#my-bookings'), 1200)
            }
        } catch (err: any) {
            setMessage('Cancellation failed: ' + (err?.message || String(err)))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900">
            <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Cancel Booking</h2>
                {message && <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">{message}</div>}
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">You're about to cancel booking <span className="font-mono">{bookingId}</span>.</p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cancellation Note (optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-3 border rounded mb-4 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" rows={4} placeholder="Optional note for our team" />
                <div className="flex items-center space-x-3">
                    <Button onClick={handleCancel} disabled={loading} className="bg-red-600 hover:bg-red-700">{loading ? 'Cancelling...' : 'Confirm Cancel'}</Button>
                    <Button variant="outline" onClick={() => navigate('/profile#my-bookings')}>Back to My Bookings</Button>
                </div>
            </div>
        </div>
    )
}
