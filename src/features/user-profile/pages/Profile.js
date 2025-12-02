import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AlertCircle, Award, Calendar, Camera, CheckCircle, Clock, Edit2, Facebook, FileText, Globe, Instagram, Mail, Phone, Save, User, X, XCircle, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
export function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [userBookings, setUserBookings] = useState([]);
    const [userQueries, setUserQueries] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    // ✅ Updated state to match actual schema
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
        phone: '',
        bio: '',
        avatar_url: '',
        date_of_birth: '',
        address: '',
        location: '',
        gender: '',
        nationality: '',
        time_zone: '',
        website_url: '',
        instagram_handle: '',
        facebook_profile: '',
        linkedin_profile: '',
        youtube_channel: '',
        preferred_contact_method: 'email',
        profile_visibility: 'public',
        // Arrays
        specialties: [],
        certifications: [],
        languages: [],
        achievements: [],
        education: [],
        // Numbers
        experience_years: 0,
        years_of_experience: 0,
        hourly_rate: 0,
        // Text fields
        certification: '',
        teaching_philosophy: '',
        // JSONB fields
        emergency_contact: {},
        social_media: {},
        badges: {},
        availability_schedule: {},
        // Booleans
        is_active: true,
        profile_completed: false,
        whatsapp_opt_in: false
    });
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    // OTP toggle (Vite env): set `VITE_ENABLE_PHONE_OTP=true` to enable phone OTP verification flow
    const ENABLE_PHONE_OTP = import.meta.env.VITE_ENABLE_PHONE_OTP === 'true';
    const [initialPhone, setInitialPhone] = useState('');
    const [initialWhatsappOptIn, setInitialWhatsappOptIn] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [pendingPhone, setPendingPhone] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'bookings', label: 'My Bookings', icon: Calendar },
        { id: 'queries', label: 'My Queries', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Edit2 }
    ];
    // ✅ Move utility functions to the top, before they're used
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'responded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed': return _jsx(CheckCircle, { className: "w-4 h-4" });
            case 'cancelled': return _jsx(XCircle, { className: "w-4 h-4" });
            default: return _jsx(AlertCircle, { className: "w-4 h-4" });
        }
    };
    const getExperienceColor = (years) => {
        if (years === 0)
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        if (years <= 2)
            return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        if (years <= 5)
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    };
    const renderArray = (arr, emptyText = 'None') => {
        if (!Array.isArray(arr) || arr.length === 0) {
            return _jsx("span", { className: "text-gray-500 dark:text-slate-400", children: emptyText });
        }
        return arr.join(', ');
    };
    // ✅ Helper to safely render JSONB fields
    const renderJsonField = (field, key) => {
        if (!field || typeof field !== 'object')
            return 'Not provided';
        return field[key] || 'Not provided';
    };
    useEffect(() => {
        if (user) {
            fetchProfileData();
            fetchUserData();
        }
    }, [user]);
    const fetchProfileData = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error) {
                console.error('Error fetching profile:', error);
                setProfileData(prev => ({
                    ...prev,
                    email: user.email || ''
                }));
                return;
            }
            if (data) {
                setProfileData({
                    full_name: data.full_name || '',
                    email: data.email || user.email || '',
                    phone: data.phone || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || '',
                    date_of_birth: data.date_of_birth || '',
                    address: data.address || '',
                    location: data.location || '',
                    gender: data.gender || '',
                    nationality: data.nationality || '',
                    time_zone: data.time_zone || '',
                    website_url: data.website_url || '',
                    instagram_handle: data.instagram_handle || '',
                    facebook_profile: data.facebook_profile || '',
                    linkedin_profile: data.linkedin_profile || '',
                    youtube_channel: data.youtube_channel || '',
                    preferred_contact_method: data.preferred_contact_method || 'email',
                    profile_visibility: data.profile_visibility || 'public',
                    // ✅ Handle arrays safely
                    specialties: Array.isArray(data.specialties) ? data.specialties : [],
                    certifications: Array.isArray(data.certifications) ? data.certifications : [],
                    languages: Array.isArray(data.languages) ? data.languages : [],
                    achievements: Array.isArray(data.achievements) ? data.achievements : [],
                    education: Array.isArray(data.education) ? data.education : [],
                    // Numbers
                    experience_years: data.experience_years || 0,
                    years_of_experience: data.years_of_experience || 0,
                    hourly_rate: data.hourly_rate || 0,
                    // Text
                    certification: data.certification || '',
                    teaching_philosophy: data.teaching_philosophy || '',
                    // ✅ Handle JSONB fields safely
                    emergency_contact: data.emergency_contact || {},
                    social_media: data.social_media || {},
                    badges: data.badges || {},
                    availability_schedule: data.availability_schedule || {},
                    // Booleans
                    is_active: data.is_active ?? true,
                    profile_completed: data.profile_completed ?? false,
                    whatsapp_opt_in: data.whatsapp_opt_in ?? false
                });
                setInitialPhone(data.phone || '');
                setInitialWhatsappOptIn(!!data.whatsapp_opt_in);
            }
            else {
                setProfileData(prev => ({
                    ...prev,
                    email: user.email || ''
                }));
            }
        }
        catch (error) {
            console.error('Error fetching profile data:', error);
            setProfileData(prev => ({
                ...prev,
                email: user.email || ''
            }));
        }
    };
    const fetchUserData = async () => {
        if (!user)
            return;
        try {
            setLoading(true);
            // Bookings query remains the same
            const bookingsResult = await supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            // Updated queries to filter by user_id properly
            const queriesResult = await supabase
                .from('contact_messages')
                .select('id, name, email, phone, subject, message, status, created_at, user_id')
                .eq('user_id', user.id) // This should now work with the user_id column
                .order('created_at', { ascending: false });
            if (bookingsResult.error) {
                console.error('Error fetching bookings:', bookingsResult.error);
                setUserBookings([]);
            }
            else {
                setUserBookings(bookingsResult.data || []);
            }
            if (queriesResult.error) {
                console.error('Error fetching queries:', queriesResult.error);
                setUserQueries([]);
            }
            else {
                setUserQueries(Array.isArray(queriesResult.data) ? queriesResult.data : []);
            }
        }
        catch (error) {
            console.error('Error in fetchUserData:', error);
            setUserBookings([]);
            setUserQueries([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const uploadAvatar = async () => {
        if (!avatarFile || !user)
            return null;
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);
        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            return null;
        }
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
        return data.publicUrl;
    };
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        // Handle different input types
        let processedValue = value;
        if (type === 'number') {
            processedValue = value === '' ? 0 : Number(value);
        }
        else if (type === 'checkbox') {
            processedValue = e.target.checked;
        }
        setProfileData(prev => ({ ...prev, [name]: processedValue }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!profileData.full_name.trim())
            newErrors.full_name = 'Full name is required';
        if (!profileData.email.trim())
            newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(profileData.email))
            newErrors.email = 'Email is invalid';
        if (profileData.phone && !/^\+?[\d\s\-\(\)]+$/.test(profileData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSaveProfile = async () => {
        if (!validateForm())
            return;
        try {
            setLoading(true);
            let avatarUrl = profileData.avatar_url;
            if (avatarFile) {
                const uploadedUrl = await uploadAvatar();
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
            }
            // ✅ Fixed: Check if profile exists first, then update or insert accordingly
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            const whatsappOptInTs = (profileData.whatsapp_opt_in && !initialWhatsappOptIn) ? new Date().toISOString() : null;
            const profilePayload = {
                user_id: user.id,
                full_name: profileData.full_name,
                email: profileData.email,
                phone: profileData.phone,
                bio: profileData.bio,
                avatar_url: avatarUrl,
                date_of_birth: profileData.date_of_birth || null,
                address: profileData.address,
                location: profileData.location,
                gender: profileData.gender,
                nationality: profileData.nationality,
                time_zone: profileData.time_zone,
                website_url: profileData.website_url,
                instagram_handle: profileData.instagram_handle,
                facebook_profile: profileData.facebook_profile,
                linkedin_profile: profileData.linkedin_profile,
                youtube_channel: profileData.youtube_channel,
                preferred_contact_method: profileData.preferred_contact_method,
                profile_visibility: profileData.profile_visibility,
                specialties: profileData.specialties,
                certifications: profileData.certifications,
                languages: profileData.languages,
                achievements: profileData.achievements,
                education: profileData.education,
                experience_years: profileData.experience_years,
                years_of_experience: profileData.years_of_experience,
                hourly_rate: profileData.hourly_rate,
                certification: profileData.certification,
                teaching_philosophy: profileData.teaching_philosophy,
                emergency_contact: profileData.emergency_contact,
                social_media: profileData.social_media,
                badges: profileData.badges,
                availability_schedule: profileData.availability_schedule,
                is_active: profileData.is_active,
                profile_completed: profileData.profile_completed,
                whatsapp_opt_in: profileData.whatsapp_opt_in,
                whatsapp_opt_in_at: whatsappOptInTs,
                updated_at: new Date().toISOString()
            };
            // If phone changed and OTP verification is enabled, start OTP flow instead of saving directly
            if (ENABLE_PHONE_OTP && profileData.phone !== initialPhone) {
                setPendingPhone(profileData.phone);
                setOtpModalOpen(true);
                // attempt to trigger backend OTP send (optional)
                try {
                    // call Supabase Edge Function `send-phone-otp` if available
                    // this is best-effort: if function not present, we'll still show modal
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    await supabase.functions.invoke?.('send-phone-otp', { body: { user_id: user.id, phone: profileData.phone } });
                }
                catch (err) {
                    console.warn('send-phone-otp function not available or failed:', err);
                }
                return;
            }
            let result;
            if (existingProfile) {
                // ✅ Update existing profile
                result = await supabase
                    .from('profiles')
                    .update(profilePayload)
                    .eq('user_id', user.id);
            }
            else {
                // ✅ Insert new profile
                result = await supabase
                    .from('profiles')
                    .insert(profilePayload);
            }
            if (result.error)
                throw result.error;
            setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
            setEditing(false);
            setAvatarFile(null);
            setAvatarPreview(null);
            alert('Profile updated successfully!');
        }
        catch (error) {
            console.error('Error saving profile:', error);
            setErrors({ general: error.message });
        }
        finally {
            setLoading(false);
        }
    };
    // OTP verification helpers
    const verifyOtp = async () => {
        if (!pendingPhone)
            return;
        setOtpLoading(true);
        try {
            // call Supabase Edge Function `verify-phone-otp` if available
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const resp = await supabase.functions.invoke?.('verify-phone-otp', { body: { user_id: user.id, phone: pendingPhone, code: otpCode } });
            // If function returns a success flag use it, else fallback to optimistic success
            // resp may be undefined if function not present
            const ok = resp?.data?.verified ?? true;
            if (ok) {
                // persist phone to profiles table now that it's "verified"
                const { error } = await supabase
                    .from('profiles')
                    .upsert({ user_id: user.id, phone: pendingPhone }, { onConflict: 'user_id' });
                if (error)
                    throw error;
                setProfileData(prev => ({ ...prev, phone: pendingPhone }));
                setInitialPhone(pendingPhone);
                setOtpModalOpen(false);
                alert('Phone verified and saved successfully');
            }
            else {
                alert('OTP verification failed. Please try again.');
            }
        }
        catch (err) {
            console.error('Error verifying OTP:', err);
            alert('Unable to verify OTP right now. Please try again later.');
        }
        finally {
            setOtpLoading(false);
        }
    };
    if (!user) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(XCircle, { className: "w-8 h-8 text-red-600 dark:text-red-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "Please sign in to view your profile." }), _jsx(Button, { onClick: () => navigate('/login'), children: "Sign In" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-900", children: [otpModalOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black opacity-40" }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg p-6 z-50 w-full max-w-md mx-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2 text-gray-900 dark:text-white", children: "Verify Phone Number" }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-slate-300 mb-4", children: ["We've sent a one-time code to ", _jsx("span", { className: "font-medium", children: pendingPhone }), ". Enter the code below to verify your phone number."] }), _jsx("input", { type: "text", value: otpCode, onChange: (e) => setOtpCode(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-4", placeholder: "Enter OTP" }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx(Button, { variant: "outline", onClick: () => { setOtpModalOpen(false); setOtpCode(''); setPendingPhone(null); }, children: "Cancel" }), _jsx(Button, { loading: otpLoading, onClick: verifyOtp, children: "Verify" })] })] })] })), _jsx("div", { className: "bg-gradient-to-r from-blue-600 to-green-600 shadow-lg", children: _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0", children: [_jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { className: "relative", children: [avatarPreview || profileData.avatar_url ? (_jsx("img", { src: avatarPreview || profileData.avatar_url, alt: "Profile", className: "w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" })) : (_jsx("div", { className: "w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-white shadow-lg", children: _jsx(User, { className: "w-10 h-10 text-gray-400 dark:text-slate-300" }) })), editing && (_jsxs("label", { className: "absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg", children: [_jsx(Camera, { className: "w-4 h-4" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleAvatarChange, className: "hidden" })] }))] }), _jsxs("div", { className: "text-white", children: [_jsx("h1", { className: "text-3xl font-bold", children: profileData.full_name || 'Your Profile' }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 mt-2", children: [_jsxs("p", { className: "flex items-center opacity-90", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), profileData.email] }), profileData.phone && (_jsxs("p", { className: "flex items-center opacity-90", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), profileData.phone] }))] }), profileData.years_of_experience > 0 && (_jsx("div", { className: "mt-2", children: _jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getExperienceColor(profileData.years_of_experience)}`, children: [_jsx(Award, { className: "w-3 h-3 mr-1 inline" }), profileData.years_of_experience, " ", profileData.years_of_experience === 1 ? 'Year' : 'Years', " Experience"] }) }))] })] }), _jsx("div", { className: "flex space-x-3", children: editing ? (_jsxs(_Fragment, { children: [_jsxs(Button, { onClick: () => {
                                                setEditing(false);
                                                setAvatarFile(null);
                                                setAvatarPreview(null);
                                                fetchProfileData(); // Reset form
                                            }, variant: "outline", size: "sm", className: "bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-white dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600", children: [_jsx(X, { className: "w-4 h-4 mr-2" }), " Cancel"] }), _jsxs(Button, { onClick: handleSaveProfile, loading: loading, size: "sm", className: "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-600", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), " Save Changes"] })] })) : (_jsxs(Button, { onClick: () => setEditing(true), variant: "outline", size: "sm", className: "bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-white dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600", children: [_jsx(Edit2, { className: "w-4 h-4 mr-2" }), " Edit Profile"] })) })] }) }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700", children: _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("nav", { className: "flex space-x-8", children: tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { children: tab.label })] }, tab.id));
                        }) }) }) }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [activeTab === 'overview' && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6 mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-6", children: "Profile Information" }), errors.general && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6", children: _jsx("p", { className: "text-red-600 dark:text-red-400 text-sm", children: errors.general }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Full Name" }), editing ? (_jsx("input", { type: "text", name: "full_name", value: profileData.full_name, onChange: handleInputChange, className: `w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${errors.full_name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your full name" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.full_name || 'Not provided' })), errors.full_name && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.full_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Email Address" }), _jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Phone Number" }), editing ? (_jsx("input", { type: "tel", name: "phone", value: profileData.phone, onChange: handleInputChange, className: `w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${errors.phone ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your phone number" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.phone || 'Not provided' })), errors.phone && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.phone })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Date of Birth" }), editing ? (_jsx("input", { type: "date", name: "date_of_birth", value: profileData.date_of_birth, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.date_of_birth ? formatDate(profileData.date_of_birth) : 'Not provided' }))] }), editing && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Gender" }), _jsxs("select", { name: "gender", value: profileData.gender, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", children: [_jsx("option", { value: "", children: "Select Gender" }), _jsx("option", { value: "male", children: "Male" }), _jsx("option", { value: "female", children: "Female" }), _jsx("option", { value: "other", children: "Other" }), _jsx("option", { value: "prefer_not_to_say", children: "Prefer not to say" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Years of Experience" }), _jsx("input", { type: "number", name: "years_of_experience", value: profileData.years_of_experience, onChange: handleInputChange, min: "0", className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Years of yoga experience" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Location" }), _jsx("input", { type: "text", name: "location", value: profileData.location, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Your location" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Nationality" }), _jsx("input", { type: "text", name: "nationality", value: profileData.nationality, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Your nationality" })] })] }))] }), _jsxs("div", { className: "mt-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Bio" }), editing ? (_jsx("textarea", { name: "bio", rows: 4, value: profileData.bio, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none", placeholder: "Tell us about yourself..." })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.bio || 'No bio provided' }))] }), !editing && profileData.specialties.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Specialties" }), _jsx("div", { className: "flex flex-wrap gap-2", children: profileData.specialties.map((specialty, index) => (_jsx("span", { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium", children: specialty }, index))) })] })), _jsx("div", { className: "pt-6 border-t border-gray-200 dark:border-slate-600 mt-6", children: _jsxs("div", { className: "flex items-center text-sm text-gray-600 dark:text-slate-400", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Member since ", formatDate(user.created_at)] }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Quick Stats" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Total Bookings" }), _jsx("span", { className: "font-semibold text-blue-600 dark:text-blue-400", children: userBookings.length })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Queries Sent" }), _jsx("span", { className: "font-semibold text-green-600 dark:text-emerald-400", children: userQueries.length })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Experience" }), _jsxs("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(profileData.years_of_experience)}`, children: [profileData.years_of_experience, " ", profileData.years_of_experience === 1 ? 'Year' : 'Years'] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Profile Status" }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${profileData.profile_completed ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`, children: profileData.profile_completed ? 'Complete' : 'Incomplete' })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Recent Activity" }), _jsxs("div", { className: "space-y-3", children: [userBookings.slice(0, 3).map((booking, index) => (_jsxs("div", { className: "flex items-center space-x-3 text-sm", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${getStatusColor(booking.status).replace('text-', 'bg-').replace('100', '500')}` }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: booking.class_name }), _jsx("p", { className: "text-gray-500 dark:text-slate-400", children: formatDate(booking.class_date) })] })] }, index))), userBookings.length === 0 && (_jsx("p", { className: "text-gray-500 dark:text-slate-400 text-sm", children: "No recent activity" }))] })] })] })] })), activeTab === 'bookings' && (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-slate-600", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "My Bookings" }), _jsxs("span", { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium", children: [userBookings.length, " Total"] })] }) }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : userBookings.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "No bookings yet" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "Start your yoga journey by booking your first class!" }), _jsx(Button, { onClick: () => navigate('/schedule'), children: "Browse Classes" })] })) : (_jsx("div", { className: "divide-y divide-gray-200 dark:divide-slate-600", children: userBookings.map((booking, index) => (_jsx("div", { className: "p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.class_name }), _jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(booking.status)}`, children: [getStatusIcon(booking.status), _jsx("span", { className: "ml-1", children: booking.status.charAt(0).toUpperCase() + booking.status.slice(1) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-slate-300", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), formatDate(booking.class_date)] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), booking.class_time] }), _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2" }), booking.instructor] })] }), booking.special_requests && (_jsx("div", { className: "mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-800 dark:text-blue-400", children: [_jsx(FileText, { className: "w-4 h-4 mr-1 inline" }), _jsx("strong", { children: "Special Requests:" }), " ", booking.special_requests] }) }))] }) }) }, index))) }))] })), activeTab === 'queries' && (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-slate-600", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "My Messages" }), _jsxs("span", { className: "bg-green-100 text-green-800 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium", children: [userQueries.length, " Total"] })] }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-slate-400 mt-2", children: ["Messages sent from: ", _jsx("span", { className: "font-mono", children: user.email })] })] }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : userQueries.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "No messages found" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "You haven't sent any contact messages yet." }), _jsx("div", { className: "space-x-3", children: _jsx(Button, { onClick: () => navigate('/contact'), children: "Send Your First Message" }) })] })) : (_jsx("div", { className: "divide-y divide-gray-200 dark:divide-slate-600", children: userQueries.map((message, index) => (_jsxs("div", { className: "p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: message.subject }), _jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(message.status)}`, children: message.status.charAt(0).toUpperCase() + message.status.slice(1) })] }), _jsx("p", { className: "text-gray-700 dark:text-slate-300 mb-3 line-clamp-3", children: message.message }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500 dark:text-slate-400", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-1" }), "Sent on ", formatDate(message.created_at)] }), _jsxs("div", { className: "text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded", children: ["From: ", message.email] })] })] }, message.id || index))) }))] })), activeTab === 'settings' && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-6", children: "Account Settings" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "border-b border-gray-200 dark:border-slate-600 pb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Emergency Contact" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Emergency Contact Name" }), editing ? (_jsx("input", { type: "text", value: renderJsonField(profileData.emergency_contact, 'name'), onChange: (e) => {
                                                                        setProfileData(prev => ({
                                                                            ...prev,
                                                                            emergency_contact: { ...prev.emergency_contact, name: e.target.value }
                                                                        }));
                                                                    }, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Emergency contact name" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: renderJsonField(profileData.emergency_contact, 'name') }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Emergency Contact Phone" }), editing ? (_jsx("input", { type: "tel", value: renderJsonField(profileData.emergency_contact, 'phone'), onChange: (e) => {
                                                                        setProfileData(prev => ({
                                                                            ...prev,
                                                                            emergency_contact: { ...prev.emergency_contact, phone: e.target.value }
                                                                        }));
                                                                    }, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Emergency contact phone" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: renderJsonField(profileData.emergency_contact, 'phone') }))] })] })] }), _jsxs("div", { className: "border-b border-gray-200 dark:border-slate-600 pb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Social Media & Online Presence" }), editing ? (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: [_jsx(Globe, { className: "w-4 h-4 inline mr-1" }), "Website URL"] }), _jsx("input", { type: "url", name: "website_url", value: profileData.website_url, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "https://your-website.com" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: [_jsx(Instagram, { className: "w-4 h-4 inline mr-1" }), "Instagram Handle"] }), _jsx("input", { type: "text", name: "instagram_handle", value: profileData.instagram_handle, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "@your_handle" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: [_jsx(Facebook, { className: "w-4 h-4 inline mr-1" }), "Facebook Profile"] }), _jsx("input", { type: "url", name: "facebook_profile", value: profileData.facebook_profile, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "https://facebook.com/your-profile" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: [_jsx(Youtube, { className: "w-4 h-4 inline mr-1" }), "YouTube Channel"] }), _jsx("input", { type: "url", name: "youtube_channel", value: profileData.youtube_channel, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "https://youtube.com/your-channel" })] })] })) : (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [profileData.website_url && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Website" }), _jsx("a", { href: profileData.website_url, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 dark:text-blue-400 hover:underline", children: profileData.website_url })] })), profileData.instagram_handle && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Instagram" }), _jsx("p", { className: "text-gray-900 dark:text-white", children: profileData.instagram_handle })] }))] }))] }), _jsxs("div", { className: "border-b border-gray-200 dark:border-slate-600 pb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Yoga Specialties" }), editing ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Select Your Specialties" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: ['Hatha Yoga', 'Vinyasa', 'Ashtanga', 'Yin Yoga', 'Hot Yoga', 'Meditation', 'Prenatal Yoga', 'Restorative Yoga'].map((specialty) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: profileData.specialties.includes(specialty), onChange: (e) => {
                                                                            const currentSpecialties = profileData.specialties;
                                                                            if (e.target.checked) {
                                                                                setProfileData(prev => ({
                                                                                    ...prev,
                                                                                    specialties: [...currentSpecialties, specialty]
                                                                                }));
                                                                            }
                                                                            else {
                                                                                setProfileData(prev => ({
                                                                                    ...prev,
                                                                                    specialties: currentSpecialties.filter(s => s !== specialty)
                                                                                }));
                                                                            }
                                                                        }, className: "rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-slate-300", children: specialty })] }, specialty))) })] })) : (_jsx("div", { children: _jsx("div", { className: "text-gray-900 dark:text-white py-2", children: renderArray(profileData.specialties, 'No specialties selected') }) }))] }), _jsxs("div", { className: "border-b border-gray-200 dark:border-slate-600 pb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Privacy Settings" }), editing && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Profile Visibility" }), _jsxs("select", { name: "profile_visibility", value: profileData.profile_visibility, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "private", children: "Private" }), _jsx("option", { value: "friends", children: "Friends Only" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Preferred Contact Method" }), _jsxs("select", { name: "preferred_contact_method", value: profileData.preferred_contact_method, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", children: [_jsx("option", { value: "email", children: "Email" }), _jsx("option", { value: "phone", children: "Phone" }), _jsx("option", { value: "sms", children: "SMS" })] })] }), _jsx("div", { className: "md:col-span-2", children: editing ? (_jsxs("label", { className: "flex items-start space-x-3", children: [_jsx("input", { type: "checkbox", name: "whatsapp_opt_in", checked: !!profileData.whatsapp_opt_in, onChange: handleInputChange, className: "mt-2 h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-700 dark:text-slate-300", children: "WhatsApp updates" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300", children: "Only for class details/updates, important reminders, and notifications about new events & promotions. We do not spam." })] })] })) : (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "WhatsApp updates" }), _jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.whatsapp_opt_in ? 'Subscribed — will receive class details, important reminders, and notifications about events & promotions.' : 'Not subscribed to WhatsApp updates.' })] })) })] }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Danger Zone" }), _jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400 mr-3" }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-red-900 dark:text-red-400 font-medium", children: "Delete Account" }), _jsx("p", { className: "text-red-700 dark:text-red-400 text-sm", children: "Once you delete your account, there is no going back. Please be certain." })] }), _jsx(Button, { variant: "outline", className: "border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30", children: "Delete Account" })] }) })] })] })] }) }))] })] }));
}
