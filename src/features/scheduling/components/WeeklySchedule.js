import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Calendar, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useClassSchedule } from '../hooks/useClassSchedule';
import InstructorLink from './InstructorLink';
import { InstructorProvider } from './InstructorProvider';
// Internal component that uses the instructor context
function WeeklyScheduleContent() {
    const { schedules, loading, error, getDayName, formatTime } = useClassSchedule();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookingLoading, setBookingLoading] = useState(null);
    const handleBookClass = async (schedule) => {
        if (!user) {
            navigate('/login?redirect=/schedule');
            return;
        }
        setBookingLoading(schedule.id);
        try {
            const className = schedule.name || schedule.class_type.name;
            const today = new Date();
            const targetDay = schedule.day_of_week;
            const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
            const nextClassDate = new Date(today);
            nextClassDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
            const classDate = nextClassDate.toISOString().split('T')[0];
            const { data: existingBooking, error: checkError } = await supabase
                .from('bookings')
                .select('id')
                .eq('user_id', user.id)
                .eq('class_date', classDate)
                .eq('class_time', schedule.start_time)
                .eq('class_name', className)
                .maybeSingle();
            if (checkError) {
                throw checkError;
            }
            if (existingBooking) {
                alert('You already have a booking for this class on this date.');
                return;
            }
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            // debug: surface IANA timezone captured in client console
            console.debug('Booking timezone:', tz);
            // Normalize user metadata: Supabase can return an object or a JSON/string.
            // Handle both shapes safely before using split().
            let meta = user.user_metadata ?? {};
            if (typeof meta === 'string') {
                try {
                    meta = JSON.parse(meta);
                }
                catch {
                    // If it's a plain string, treat it as the user's full name.
                    meta = { full_name: meta };
                }
            }
            const fullName = meta?.full_name || meta?.fullName || '';
            const nameParts = typeof fullName === 'string' ? fullName.trim().split(/\s+/) : [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            const phone = meta?.phone || meta?.phone_number || user.phone || '';
            const bookingData = {
                user_id: user.id,
                class_name: className,
                instructor: schedule.instructor.full_name,
                class_date: classDate,
                class_time: schedule.start_time,
                timezone: tz,
                first_name: firstName,
                last_name: lastName,
                email: user.email,
                phone,
                experience_level: 'beginner',
                special_requests: '',
                emergency_contact: '',
                emergency_phone: '',
                status: 'confirmed',
                booking_type: 'public_group'
            };
            // debug: inspect payload sent to Supabase
            console.debug('Booking payload:', bookingData);
            const { data: bookingResult, error: bookingError } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select('*');
            console.debug('Supabase insert response:', { bookingResult, bookingError });
            if (bookingError) {
                console.error('Supabase booking insert error:', bookingError);
                throw bookingError;
            }
            if (bookingError)
                throw bookingError;
            const bookingId = bookingResult?.[0]?.booking_id || 'N/A';
            alert(`Successfully booked ${className} for ${nextClassDate.toLocaleDateString()}!\n\nYour Booking ID: ${bookingId}\n\nPlease save this ID for your records.`);
        }
        catch (error) {
            console.error('Booking error:', error);
            alert('Failed to book class. Please try again.');
        }
        finally {
            setBookingLoading(null);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "text-center py-12", children: _jsxs("p", { className: "text-red-600", children: ["Error loading schedule: ", error] }) }));
    }
    const schedulesByDay = schedules.reduce((acc, schedule) => {
        const day = schedule.day_of_week;
        if (!acc[day])
            acc[day] = [];
        acc[day].push(schedule);
        return acc;
    }, {});
    const days = [0, 1, 2, 3, 4, 5, 6];
    return (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-600", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-slate-600", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center", children: [_jsx(Calendar, { className: "w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" }), "Weekly Class Schedule"] }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mt-1", children: "Regular weekly classes - book your spot today!" })] }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-slate-600", children: days.map(day => (_jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-4 text-center", children: getDayName(day) }), _jsx("div", { className: "space-y-3", children: schedulesByDay[day]?.map(schedule => (_jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-lg p-4 hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-slate-500", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white text-sm leading-tight", children: schedule.name || schedule.class_type.name }), _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${schedule.class_type.difficulty_level === 'beginner'
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                    : schedule.class_type.difficulty_level === 'intermediate'
                                                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`, children: schedule.class_type.difficulty_level })] }), _jsxs("div", { className: "space-y-2 text-xs text-gray-600 dark:text-slate-300 mb-3", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" }), formatTime(schedule.start_time), " (", schedule.duration_minutes, "min)"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-3 h-3 mr-1 text-emerald-500 dark:text-emerald-400" }), "Max ", schedule.max_participants, " students"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Award, { className: "w-3 h-3 mr-1 text-orange-500 dark:text-orange-400" }), _jsx(InstructorLink, { instructor: {
                                                            id: schedule.instructor_id || '',
                                                            fullName: schedule.instructor?.full_name || 'Unknown Instructor',
                                                            email: schedule.instructor?.email || '',
                                                            bio: '',
                                                            specialization: '',
                                                            experience: 0,
                                                            joinDate: '',
                                                            profileImage: ''
                                                        }, className: "text-xs font-medium hover:text-blue-600 hover:underline transition-colors" })] }), schedule.class_type.price && (_jsxs("div", { className: "text-blue-600 dark:text-blue-400 font-semibold", children: ["\u20B9", schedule.class_type.price] }))] }), _jsx(Button, { onClick: () => handleBookClass(schedule), loading: bookingLoading === schedule.id, size: "sm", className: "w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2", children: bookingLoading === schedule.id ? 'Booking...' : 'Book Now' })] }, schedule.id))) || (_jsx("div", { className: "text-center text-gray-500 dark:text-gray-400 text-sm py-8", children: "No classes scheduled" })) })] }, day))) }), _jsx("div", { className: "p-6 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600", children: _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: "How Booking Works" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-slate-300", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2", children: _jsx("span", { className: "text-white font-semibold", children: "1" }) }), _jsx("p", { className: "text-gray-900 dark:text-white", children: "Click \"Book Now\" on any class" })] }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2", children: _jsx("span", { className: "text-white font-semibold", children: "2" }) }), _jsx("p", { className: "text-gray-900 dark:text-white", children: "Sign in to your account" })] }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2", children: _jsx("span", { className: "text-white font-semibold", children: "3" }) }), _jsx("p", { className: "text-gray-900 dark:text-white", children: "Get instant confirmation" })] })] }), _jsx("p", { className: "mt-4 text-xs text-gray-500 dark:text-slate-300", children: "* Bookings are made for the next occurrence of the selected class" })] }) })] }));
}
// Main component wrapped with InstructorProvider
export function WeeklySchedule() {
    return (_jsx(InstructorProvider, { children: _jsx(WeeklyScheduleContent, {}) }));
}
