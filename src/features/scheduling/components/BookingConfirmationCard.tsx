import React from 'react'
import { Button } from '../../../shared/components/ui/Button'

interface Props {
    bookingId: string | null
    onReturnHome?: () => void
    onBookAnother?: () => void
}

const BookingConfirmationCard: React.FC<Props> = ({ bookingId, onReturnHome, onBookAnother }) => {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Booking Submitted!</h2>
                <p className="text-gray-600 dark:text-white mb-2">
                    Thank you for booking with us! We've sent your booking confirmation number by email.
                </p>
                <div className="text-left mx-auto max-w-md mb-6">
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                        <li>
                            <span className="font-semibold">Confirmation email:</span> Your booking confirmation number and further instructions are in your email.
                        </li>
                        <li>
                            <span className="font-semibold">Check spam/junk:</span> If you don’t see it within a few minutes, please check your spam folder.
                        </li>
                        <li>
                            <span className="font-semibold">Need help?</span> Reply to the confirmation email and our team will assist.
                        </li>
                    </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-8">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Booking ID</h3>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">{bookingId}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">This number is also in the confirmation email for your records.</p>
                </div>
                <div className="space-y-4">
                    <Button
                        onClick={onReturnHome || (() => { window.location.href = '/' })}
                        className="bg-blue-600 hover:bg-blue-700 mr-4"
                    >
                        Return to Home
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onBookAnother || (() => window.location.reload())}
                    >
                        Book Another Class
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default BookingConfirmationCard
