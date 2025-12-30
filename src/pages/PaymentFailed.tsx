import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function useQuery() {
    return new URLSearchParams(useLocation().search)
}

const PaymentFailed: React.FC = () => {
    const q = useQuery()
    const reason = q.get('reason') || q.get('status') || ''
    const bookingId = q.get('booking_id') || q.get('bookingId') || ''

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">
            <div className="max-w-xl w-full p-6 border rounded shadow text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
                <p className="mb-4">Unfortunately, your payment did not complete.</p>
                {reason && (
                    <p className="mb-4">Reason: <strong>{reason}</strong></p>
                )}
                <div className="flex gap-3 justify-center">
                    <Link to="/" className="px-4 py-2 bg-slate-800 text-white rounded">Go to Home</Link>
                    <Link to="/contact" className="px-4 py-2 border rounded">Contact Support</Link>
                </div>
                {bookingId && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { window.location.href = `/functions/v1/regenerate-payment-link?booking_id=${bookingId}` }}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Get a new payment link
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PaymentFailed
