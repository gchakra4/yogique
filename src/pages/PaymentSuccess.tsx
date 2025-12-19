import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function useQuery() {
    return new URLSearchParams(useLocation().search)
}

const PaymentSuccess: React.FC = () => {
    const q = useQuery()
    const bookingId = q.get('booking_id')

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">
            <div className="max-w-xl w-full p-6 border rounded shadow text-center">
                <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful</h1>
                <p className="mb-4">Thank you — your payment was received successfully.</p>
                {bookingId && (
                    <p className="mb-4">Booking ID: <strong>{bookingId}</strong></p>
                )}
                <div className="flex gap-3 justify-center">
                    <Link to="/" className="px-4 py-2 bg-slate-800 text-white rounded">Go to Home</Link>
                    <Link to="/profile" className="px-4 py-2 border rounded">View Profile</Link>
                </div>
            </div>
        </div>
    )
}

export default PaymentSuccess
