import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
export default function CancelBookingPage() {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        if (!bookingId || !token) {
            setMessage('Invalid cancellation link.');
        }
    }, [bookingId, token]);
    const handleCancel = async () => {
        if (!bookingId || !token)
            return setMessage('Missing booking id or token');
        setLoading(true);
        setMessage(null);
        try {
            const payload = { booking_id: bookingId, token, note };
            // Use Supabase Functions invoke so the Edge Function receives the payload
            const res = await supabase.functions.invoke('cancel-booking', { body: payload });
            if (res.error) {
                const raw = res.error;
                const lower = String(raw?.message || '').toLowerCase();
                const userFriendly = lower.includes('non-2xx') || lower.includes('already cancelled') || lower.includes('invalid') || lower.includes('expired')
                    ? 'This booking is already cancelled or the cancellation link has expired. If you need help, please contact support.'
                    : 'We could not cancel this booking right now. Please try again or contact support.';
                setMessage(userFriendly);
            }
            else {
                setMessage('Booking cancelled successfully.');
                // Redirect to profile after short delay
                setTimeout(() => navigate('/profile#my-bookings'), 1200);
            }
        }
        catch (err) {
            const lower = String(err?.message || err || '').toLowerCase();
            const userFriendly = lower.includes('non-2xx') || lower.includes('already cancelled') || lower.includes('invalid') || lower.includes('expired')
                ? 'This booking is already cancelled or the cancellation link has expired. If you need help, please contact support.'
                : 'We could not cancel this booking right now. Please try again or contact support.';
            setMessage(userFriendly);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900", children: _jsxs("div", { className: "max-w-xl w-full bg-white dark:bg-slate-800 rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Cancel Booking" }), message && _jsx("div", { className: "mb-4 text-sm text-gray-700 dark:text-gray-200", children: message }), _jsxs("p", { className: "mb-4 text-sm text-gray-600 dark:text-gray-300", children: ["You're about to cancel booking ", _jsx("span", { className: "font-mono", children: bookingId }), "."] }), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2", children: "Cancellation Note (optional)" }), _jsx("textarea", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full p-3 border rounded mb-4 bg-white dark:bg-slate-700 text-gray-900 dark:text-white", rows: 4, placeholder: "Optional note for our team" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Button, { onClick: handleCancel, disabled: loading, className: "bg-red-600 hover:bg-red-700", children: loading ? 'Cancelling...' : 'Confirm Cancel' }), _jsx(Button, { variant: "outline", onClick: () => navigate('/profile#my-bookings'), children: "Back to My Bookings" })] })] }) }));
}
