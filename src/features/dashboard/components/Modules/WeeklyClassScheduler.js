import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, Clock, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { ResponsiveActionButton } from '../../../../shared/components/ui/ResponsiveActionButton';
import { supabase } from '../../../../shared/lib/supabase';
export function WeeklyClassScheduler() {
    const [schedules, setSchedules] = useState([]);
    const [classTypes, setClassTypes] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        class_type_id: '',
        instructor_id: '',
        day_of_week: 0,
        start_time: '',
        duration_minutes: 60,
        max_participants: 20,
        is_active: true,
        effective_from: new Date().toISOString().split('T')[0]
    });
    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];
    const timeSlots = [
        '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
    ];
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            // ✅ First check if is_archived column exists
            let classTypesQuery = supabase
                .from('class_types')
                .select('*')
                .eq('is_active', true);
            // Try to add is_archived filter, but handle gracefully if column doesn't exist
            try {
                const { error: testError } = await supabase
                    .from('class_types')
                    .select('is_archived')
                    .limit(1);
                // If no error, column exists - add the filter
                if (!testError) {
                    classTypesQuery = classTypesQuery.or('is_archived.is.null,is_archived.eq.false');
                    console.log('✅ is_archived column found - filtering out archived classes');
                }
                else if (testError.code === '42703') {
                    console.log('ℹ️ is_archived column not found - only filtering by is_active');
                }
            }
            catch (error) {
                console.log('ℹ️ Column check failed - using basic filter');
            }
            // Fetch schedules and class types first (these should work fine)
            const [schedulesRes, classTypesRes] = await Promise.all([
                supabase
                    .from('class_schedules')
                    .select(`
        *,
        class_type:class_types(*)
      `)
                    .order('day_of_week')
                    .order('start_time'),
                // ✅ Updated query to exclude archived class types
                classTypesQuery.order('name')
            ]);
            if (schedulesRes.error)
                throw schedulesRes.error;
            if (classTypesRes.error)
                throw classTypesRes.error;
            // ✅ Log filtered class types for debugging
            console.log('📚 Available class types (active & non-archived):', classTypesRes.data);
            console.log(`📊 Total class types loaded: ${classTypesRes.data?.length || 0}`);
            // Try multiple approaches to get instructor data
            let instructorsRes;
            let instructorData = [];
            // Approach 1: Query from user_roles table
            try {
                instructorsRes = await supabase
                    .from('user_roles')
                    .select(`
        user_id,
        profiles!inner(
          user_id,
          full_name,
          email,
          bio,
          specialties
        ),
        roles!inner(name)
      `)
                    .in('roles.name', ['instructor', 'yoga_acharya'])
                    .order('profiles.full_name');
                if (!instructorsRes.error && instructorsRes.data) {
                    instructorData = instructorsRes.data.map(userRole => ({
                        user_id: userRole.profiles.user_id,
                        full_name: userRole.profiles.full_name,
                        email: userRole.profiles.email,
                        bio: userRole.profiles.bio,
                        specialties: userRole.profiles.specialties,
                        role: userRole.roles.name
                    }));
                    console.log('✅ Successfully fetched instructors via user_roles approach');
                }
            }
            catch (error) {
                console.log('❌ user_roles approach failed:', error);
            }
            // Approach 2: If approach 1 fails, try separate queries
            if (instructorData.length === 0) {
                try {
                    // First get all instructor/yoga_acharya user IDs
                    const rolesRes = await supabase
                        .from('user_roles')
                        .select(`
          user_id,
          roles!inner(name)
        `)
                        .in('roles.name', ['instructor', 'yoga_acharya']);
                    if (!rolesRes.error && rolesRes.data) {
                        const instructorUserIds = rolesRes.data.map(ur => ur.user_id);
                        // Then get profiles for these users
                        const profilesRes = await supabase
                            .from('profiles')
                            .select(`
            user_id,
            full_name,
            email,
            bio,
            specialties
          `)
                            .in('user_id', instructorUserIds)
                            .order('full_name');
                        if (!profilesRes.error && profilesRes.data) {
                            instructorData = profilesRes.data;
                            console.log('✅ Successfully fetched instructors via separate queries approach');
                        }
                    }
                }
                catch (error) {
                    console.log('❌ Separate queries approach failed:', error);
                }
            }
            // Approach 3: If all else fails, get all profiles and filter manually
            if (instructorData.length === 0) {
                try {
                    console.log('🔄 Trying fallback approach: fetching all profiles...');
                    const allProfilesRes = await supabase
                        .from('profiles')
                        .select(`
          user_id,
          full_name,
          email,
          bio,
          specialties
        `)
                        .order('full_name');
                    const allRolesRes = await supabase
                        .from('user_roles')
                        .select(`
          user_id,
          roles!inner(name)
        `)
                        .in('roles.name', ['instructor', 'yoga_acharya']);
                    if (!allProfilesRes.error && !allRolesRes.error && allProfilesRes.data && allRolesRes.data) {
                        const instructorUserIds = new Set(allRolesRes.data.map(ur => ur.user_id));
                        instructorData = allProfilesRes.data.filter(profile => instructorUserIds.has(profile.user_id));
                        console.log('✅ Successfully fetched instructors via fallback approach');
                    }
                }
                catch (error) {
                    console.log('❌ Fallback approach failed:', error);
                }
            }
            console.log('📊 Raw instructor data:', instructorData);
            // Filter and validate instructor profiles
            const validInstructors = instructorData.filter(profile => {
                const hasValidName = profile.full_name?.trim();
                const hasValidEmail = profile.email?.trim();
                const isValid = profile.user_id && (hasValidName || hasValidEmail);
                if (!isValid) {
                    console.warn('⚠️ Filtering out invalid instructor profile:', profile);
                }
                return isValid;
            }).map(profile => ({
                user_id: profile.user_id,
                full_name: profile.full_name?.trim() ||
                    profile.email?.split('@')[0]?.replace(/[._]/g, ' ') ||
                    'Unknown Instructor',
                bio: profile.bio,
                specialties: profile.specialties
            }));
            console.log('✅ Valid instructors after filtering:', validInstructors);
            // Map instructors for quick lookup
            const instructorMap = validInstructors.reduce((acc, instructor) => {
                acc[instructor.user_id] = instructor;
                return acc;
            }, {});
            console.log('🗺️ Instructor map:', instructorMap);
            // Enrich schedules with instructor data
            const enrichedSchedules = (schedulesRes.data || []).map(schedule => ({
                ...schedule,
                instructor: instructorMap[schedule.instructor_id] || undefined
            }));
            console.log('📅 Enriched schedules:', enrichedSchedules);
            // Set state
            setSchedules(enrichedSchedules);
            setClassTypes(classTypesRes.data || []);
            setInstructors(validInstructors);
            console.log('✅ Data fetching completed successfully');
            console.log(`📚 Final class types count: ${classTypesRes.data?.length || 0}`);
        }
        catch (error) {
            console.error('❌ Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
        // Auto-fill duration and max participants when class type changes
        if (field === 'class_type_id') {
            const selectedClassType = classTypes.find(ct => ct.id === value);
            if (selectedClassType) {
                setFormData(prev => ({
                    ...prev,
                    [field]: value,
                    duration_minutes: selectedClassType.duration_minutes,
                    max_participants: selectedClassType.max_participants
                }));
            }
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.class_type_id)
            newErrors.class_type_id = 'Class type is required';
        if (formData.day_of_week === undefined)
            newErrors.day_of_week = 'Day of week is required';
        if (!formData.start_time)
            newErrors.start_time = 'Start time is required';
        if (!formData.duration_minutes || formData.duration_minutes < 15) {
            newErrors.duration_minutes = 'Duration must be at least 15 minutes';
        }
        if (!formData.max_participants || formData.max_participants < 1) {
            newErrors.max_participants = 'Max participants must be at least 1';
        }
        if (!formData.effective_from)
            newErrors.effective_from = 'Effective from date is required';
        // Check for time slot conflicts (same day and time)
        const conflictingSchedule = schedules.find(schedule => {
            if (editingSchedule && schedule.id === editingSchedule.id)
                return false;
            if (schedule.day_of_week === formData.day_of_week) {
                const existingStart = new Date(`2000-01-01T${schedule.start_time}`);
                const existingEnd = new Date(existingStart.getTime() + schedule.duration_minutes * 60000);
                const newStart = new Date(`2000-01-01T${formData.start_time}`);
                const newEnd = new Date(newStart.getTime() + (formData.duration_minutes || 0) * 60000);
                return (newStart < existingEnd && newEnd > existingStart);
            }
            return false;
        });
        if (conflictingSchedule) {
            newErrors.general = 'A class is already scheduled at this time slot';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setSaving(true);
            // Prepare data with proper null handling for instructor_id
            const scheduleData = {
                ...formData,
                instructor_id: formData.instructor_id || null
            };
            if (editingSchedule) {
                // Update existing schedule
                const { error } = await supabase
                    .from('class_schedules')
                    .update(scheduleData)
                    .eq('id', editingSchedule.id);
                if (error)
                    throw error;
            }
            else {
                // Create new schedule
                const { error } = await supabase
                    .from('class_schedules')
                    .insert([scheduleData]);
                if (error)
                    throw error;
            }
            await fetchData();
            resetForm();
            alert(editingSchedule ? 'Schedule updated successfully!' : 'Schedule created successfully!');
        }
        catch (error) {
            setErrors({ general: error.message });
        }
        finally {
            setSaving(false);
        }
    };
    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            class_type_id: schedule.class_type_id,
            instructor_id: schedule.instructor_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            duration_minutes: schedule.duration_minutes,
            max_participants: schedule.max_participants,
            is_active: schedule.is_active,
            effective_from: schedule.effective_from,
            effective_until: schedule.effective_until
        });
        setShowAddForm(true);
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this class schedule? This will also remove all related class assignments.'))
            return;
        try {
            // ✅ First delete all related class_assignments
            const { error: assignmentsError } = await supabase
                .from('class_assignments')
                .delete()
                .eq('scheduled_class_id', id);
            if (assignmentsError) {
                console.error('Error deleting class assignments:', assignmentsError);
                throw assignmentsError;
            }
            // ✅ Then delete the schedule
            const { error: scheduleError } = await supabase
                .from('class_schedules')
                .delete()
                .eq('id', id);
            if (scheduleError) {
                console.error('Error deleting schedule:', scheduleError);
                throw scheduleError;
            }
            await fetchData();
            alert('Schedule and all related assignments deleted successfully!');
        }
        catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Failed to delete schedule: ' + (error.message || 'Unknown error'));
        }
    };
    // ✅ Alternative: Soft delete instead of hard delete
    const handleSoftDelete = async (id) => {
        if (!confirm('Are you sure you want to deactivate this class schedule?'))
            return;
        try {
            const { error } = await supabase
                .from('class_schedules')
                .update({
                is_active: false,
                effective_until: new Date().toISOString().split('T')[0]
            })
                .eq('id', id);
            if (error)
                throw error;
            await fetchData();
            alert('Schedule deactivated successfully!');
        }
        catch (error) {
            console.error('Error deactivating schedule:', error);
            alert('Failed to deactivate schedule: ' + (error.message || 'Unknown error'));
        }
    };
    const resetForm = () => {
        setFormData({
            class_type_id: '',
            instructor_id: '',
            day_of_week: 0,
            start_time: '',
            duration_minutes: 60,
            max_participants: 20,
            is_active: true,
            effective_from: new Date().toISOString().split('T')[0]
        });
        setEditingSchedule(null);
        setShowAddForm(false);
        setErrors({});
    };
    const formatTime = (time) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    const getDifficultyColor = (level) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    // Group schedules by day for better visualization
    const schedulesByDay = schedules.reduce((acc, schedule) => {
        const day = schedule.day_of_week;
        if (!acc[day])
            acc[day] = [];
        acc[day].push(schedule);
        return acc;
    }, {});
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "w-6 h-6 mr-2" }), "Weekly Class Scheduler"] }), _jsxs(ResponsiveActionButton, { onClick: () => setShowAddForm(true), className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add New Schedule"] })] }), showAddForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: editingSchedule ? 'Edit Class Schedule' : 'Add New Class Schedule' }), _jsx("button", { onClick: resetForm, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class Type *" }), _jsxs("select", { value: formData.class_type_id, onChange: (e) => handleInputChange('class_type_id', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.class_type_id ? 'border-red-500' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select class type" }), classTypes.map(classType => (_jsxs("option", { value: classType.id, children: [classType.name, " (", classType.difficulty_level, ")"] }, classType.id)))] }), errors.class_type_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.class_type_id })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Instructor (Optional)" }), _jsxs("select", { value: formData.instructor_id, onChange: (e) => handleInputChange('instructor_id', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Assign later via Class Assignment Manager" }), instructors.map(instructor => (_jsx("option", { value: instructor.user_id, children: instructor.full_name }, instructor.user_id)))] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Leave empty to assign instructor later" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Day of Week *" }), _jsx("select", { value: formData.day_of_week, onChange: (e) => handleInputChange('day_of_week', parseInt(e.target.value)), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.day_of_week ? 'border-red-500' : 'border-gray-300'}`, children: daysOfWeek.map(day => (_jsx("option", { value: day.value, children: day.label }, day.value))) }), errors.day_of_week && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.day_of_week })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Start Time *" }), _jsxs("select", { value: formData.start_time, onChange: (e) => handleInputChange('start_time', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.start_time ? 'border-red-500' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select start time" }), timeSlots.map(time => (_jsx("option", { value: time, children: formatTime(time) }, time)))] }), errors.start_time && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.start_time })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Duration (minutes) *" }), _jsx("input", { type: "number", value: formData.duration_minutes, onChange: (e) => handleInputChange('duration_minutes', parseInt(e.target.value)), min: "15", max: "180", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'}` }), errors.duration_minutes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.duration_minutes })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Max Participants *" }), _jsx("input", { type: "number", value: formData.max_participants, onChange: (e) => handleInputChange('max_participants', parseInt(e.target.value)), min: "1", max: "50", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_participants ? 'border-red-500' : 'border-gray-300'}` }), errors.max_participants && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.max_participants })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Effective From *" }), _jsx("input", { type: "date", value: formData.effective_from, onChange: (e) => handleInputChange('effective_from', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.effective_from ? 'border-red-500' : 'border-gray-300'}` }), errors.effective_from && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.effective_from })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Effective Until (Optional)" }), _jsx("input", { type: "date", value: formData.effective_until || '', onChange: (e) => handleInputChange('effective_until', e.target.value || null), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => handleInputChange('is_active', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 block text-sm text-gray-900", children: "Active Schedule" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: "Cancel" }), _jsxs(Button, { type: "submit", loading: saving, className: "flex items-center", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')] })] })] })] }) })), _jsxs("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Current Weekly Schedule" }) }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-gray-200", children: daysOfWeek.map(day => (_jsxs("div", { className: "p-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-4 text-center", children: day.label }), _jsx("div", { className: "space-y-3", children: schedulesByDay[day.value]?.map(schedule => (_jsxs("div", { className: `rounded-lg p-3 border-l-4 ${schedule.is_active
                                            ? 'bg-blue-50 border-blue-500'
                                            : 'bg-gray-50 border-gray-400'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h5", { className: "font-medium text-gray-900 text-sm", children: schedule.class_type?.name }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEdit(schedule), className: "text-blue-600 hover:text-blue-800 p-1", title: "Edit", children: _jsx(Calendar, { className: "w-3 h-3" }) }), _jsx("button", { onClick: () => handleSoftDelete(schedule.id), className: "text-yellow-600 hover:text-yellow-800 p-1", title: "Deactivate", children: _jsx(X, { className: "w-3 h-3" }) }), _jsx("button", { onClick: () => handleDelete(schedule.id), className: "text-red-600 hover:text-red-800 p-1", title: "Permanently Delete (includes assignments)", children: _jsx(Trash2, { className: "w-3 h-3" }) })] })] }), _jsxs("div", { className: "space-y-1 text-xs text-gray-600", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), formatTime(schedule.start_time), " (", schedule.duration_minutes, "min)"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-3 h-3 mr-1" }), "Max ", schedule.max_participants] }), _jsx("div", { className: "text-gray-700 font-medium", children: schedule.instructor?.full_name || 'No instructor assigned' }), schedule.class_type && (_jsx("span", { className: `inline-block px-2 py-1 rounded text-xs ${getDifficultyColor(schedule.class_type.difficulty_level)}`, children: schedule.class_type.difficulty_level })), !schedule.is_active && (_jsx("span", { className: "inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs", children: "Inactive" }))] })] }, schedule.id))) || (_jsx("div", { className: "text-center text-gray-500 text-sm py-8", children: "No classes scheduled" })) })] }, day.value))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-blue-600 mb-2", children: schedules.filter(s => s.is_active).length }), _jsx("div", { className: "text-gray-600", children: "Active Schedules" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-green-600 mb-2", children: new Set(schedules.filter(s => s.is_active).map(s => s.instructor_id)).size }), _jsx("div", { className: "text-gray-600", children: "Active Instructors" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-purple-600 mb-2", children: new Set(schedules.filter(s => s.is_active).map(s => s.class_type_id)).size }), _jsx("div", { className: "text-gray-600", children: "Class Types" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-orange-600 mb-2", children: schedules.filter(s => s.is_active).reduce((sum, s) => sum + s.max_participants, 0) }), _jsx("div", { className: "text-gray-600", children: "Total Capacity" })] })] })] }));
}
export default WeeklyClassScheduler;
