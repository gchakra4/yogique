import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Calendar, Clock, Mail, Phone, Star, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
function InstructorProfile() {
    const { instructorId } = useParams();
    const [instructor, setInstructor] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (instructorId) {
            fetchInstructorData();
        }
    }, [instructorId]);
    const fetchInstructorData = async () => {
        try {
            setLoading(true);
            // Fetch instructor profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`
          user_id,
          full_name,
          email,
          phone,
          bio,
          specialties,
          experience_years,
          certification,
          avatar_url,
          is_active
        `)
                .eq('user_id', instructorId)
                .single();
            if (profileError) {
                throw new Error('Instructor not found');
            }
            setInstructor(profileData);
            // Fetch instructor's class schedules
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('weekly_schedules')
                .select(`
          id,
          day_of_week,
          start_time,
          duration_minutes,
          max_participants,
          class_type:class_types(
            name,
            difficulty_level,
            description,
            price
          )
        `)
                .eq('instructor_id', instructorId)
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');
            if (scheduleError) {
                console.error('Error fetching schedules:', scheduleError);
            }
            else {
                setSchedules((scheduleData || []).map((s) => ({
                    ...s,
                    class_type: Array.isArray(s.class_type) ? s.class_type[0] : s.class_type
                })));
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const getDayName = (dayNumber) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber] || 'Unknown';
    };
    const formatTime = (time) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        }
        catch {
            return time;
        }
    };
    const getDifficultyColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'intermediate':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
            case 'advanced':
                return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (error || !instructor) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4", children: "Instructor Not Found" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6", children: error || 'The instructor profile you are looking for does not exist.' }), _jsx(Button, { onClick: () => window.history.back(), children: "Go Back" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8", children: _jsx("div", { className: "p-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6", children: [_jsx("div", { className: "flex-shrink-0", children: instructor.avatar_url ? (_jsx("img", { src: instructor.avatar_url, alt: instructor.full_name, className: "w-24 h-24 rounded-full object-cover border-4 border-blue-100", onError: (e) => {
                                            e.currentTarget.style.display = 'none';
                                        } })) : (_jsx("div", { className: "w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center border-4 border-blue-100", children: _jsx(User, { className: "w-12 h-12 text-white" }) })) }), _jsxs("div", { className: "flex-grow", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-2", children: instructor.full_name }), instructor.certification && (_jsxs("div", { className: "flex items-center text-blue-600 dark:text-blue-400 mb-2", children: [_jsx(Award, { className: "w-5 h-5 mr-2" }), _jsx("span", { className: "font-medium", children: instructor.certification })] })), instructor.experience_years && (_jsxs("div", { className: "flex items-center text-gray-600 dark:text-gray-300 mb-4", children: [_jsx(Star, { className: "w-5 h-5 mr-2" }), _jsxs("span", { children: [instructor.experience_years, " years of experience"] })] })), _jsxs("div", { className: "flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-1" }), _jsx("a", { href: `mailto:${instructor.email}`, className: "hover:text-blue-600 dark:hover:text-blue-400", children: instructor.email })] }), instructor.phone && (_jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 mr-1" }), _jsx("a", { href: `tel:${instructor.phone}`, className: "hover:text-blue-600 dark:hover:text-blue-400", children: instructor.phone })] }))] })] })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-8", children: [instructor.bio && (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4", children: "About" }), _jsx("p", { className: "text-gray-700 dark:text-gray-300 leading-relaxed", children: instructor.bio })] })), instructor.specialties && instructor.specialties.length > 0 && (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4", children: "Specialties" }), _jsx("div", { className: "flex flex-wrap gap-3", children: instructor.specialties.map((specialty, index) => (_jsx("span", { className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium", children: specialty }, index))) })] })), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-6", children: "Class Schedule" }), schedules.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Calendar, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "No classes scheduled at the moment" })] })) : (_jsx("div", { className: "space-y-4", children: schedules.map((schedule) => (_jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: schedule.class_type.name }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: getDayName(schedule.day_of_week) })] }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(schedule.class_type.difficulty_level)}`, children: schedule.class_type.difficulty_level })] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), formatTime(schedule.start_time), " (", schedule.duration_minutes, "min)"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-1" }), "Max ", schedule.max_participants, " students"] }), schedule.class_type.price && (_jsxs("div", { className: "font-semibold text-blue-600 dark:text-blue-400", children: ["$", schedule.class_type.price] }))] }), schedule.class_type.description && (_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-2", children: schedule.class_type.description }))] }, schedule.id))) }))] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Quick Actions" }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { className: "w-full", onClick: () => window.location.href = '/schedule', children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "View All Classes"] }), _jsx(Button, { variant: "outline", className: "w-full", onClick: () => window.location.href = 'https://yogique.life/yogique-for-you', children: "Book a Class" }), _jsxs(Button, { variant: "outline", className: "w-full", onClick: () => window.location.href = '/contact', children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "Contact Us"] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-xl p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Instructor Stats" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-300", children: "Experience" }), _jsxs("span", { className: "font-semibold dark:text-white", children: [instructor.experience_years || 0, " years"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-300", children: "Weekly Classes" }), _jsx("span", { className: "font-semibold dark:text-white", children: schedules.length })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-300", children: "Specialties" }), _jsx("span", { className: "font-semibold dark:text-white", children: instructor.specialties?.length || 0 })] })] })] })] })] })] }) }));
}
// Export both ways for flexibility
export { InstructorProfile };
export default InstructorProfile;
