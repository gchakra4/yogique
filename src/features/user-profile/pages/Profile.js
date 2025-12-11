import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { AlertCircle, Award, Calendar, Camera, CheckCircle, Clock, Edit2, Facebook, FileText, Globe, Instagram, Mail, Phone, Save, User, X, XCircle, Youtube } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
    const [scheduledBookingIds, setScheduledBookingIds] = useState(new Set());
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
    // phone number helper from google-libphonenumber
    const phoneUtil = PhoneNumberUtil.getInstance();
    // runtime countries list derived from libphonenumber's supported regions
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [phoneNumberInput, setPhoneNumberInput] = useState('');
    // Country picker open state and helper component will be declared below
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [cancelModalBooking, setCancelModalBooking] = useState(null);
    const [canceling, setCanceling] = useState(false);
    const [cancelSuccessMessage, setCancelSuccessMessage] = useState('');
    // OTP toggle (Vite env): set `VITE_ENABLE_PHONE_OTP=true` to enable phone OTP verification flow
    const ENABLE_PHONE_OTP = import.meta.env.VITE_ENABLE_PHONE_OTP === 'true';
    const [initialPhone, setInitialPhone] = useState('');
    const [initialWhatsappOptIn, setInitialWhatsappOptIn] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [pendingPhone, setPendingPhone] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
    const resendIntervalRef = useRef(null);
    const [phoneConflictMessage, setPhoneConflictMessage] = useState(null);
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
    const isClassStartInPast = (dateStr, timeStr) => {
        if (!dateStr || !timeStr)
            return false;
        try {
            const isoLike = `${dateStr}T${timeStr}`;
            const dt = new Date(isoLike);
            if (isNaN(dt.getTime())) {
                // Fallback: attempt parsing common formats
                const dt2 = new Date(`${dateStr} ${timeStr}`);
                if (isNaN(dt2.getTime()))
                    return false;
                return dt2.getTime() < Date.now();
            }
            return dt.getTime() < Date.now();
        }
        catch {
            return false;
        }
    };
    useEffect(() => {
        if (user) {
            fetchProfileData();
            fetchUserData();
        }
    }, [user]);
    // build full countries list from libphonenumber once on mount
    useEffect(() => {
        try {
            const regions = Array.from(phoneUtil.getSupportedRegions());
            const dn = new Intl.DisplayNames(['en'], { type: 'region' });
            const arr = regions.map(r => ({ name: String(dn.of(r) || r), iso: String(r), code: `+${phoneUtil.getCountryCodeForRegion(r)}` }));
            arr.sort((a, b) => a.name.localeCompare(b.name));
            setCountries(arr);
            if (arr.length && !selectedCountry) {
                // default to user's region if available, else first
                const defaultCountry = arr.find(c => c.iso === 'US') || arr[0];
                setSelectedCountry(defaultCountry);
            }
        }
        catch (e) {
            console.warn('failed to build countries list', e);
        }
    }, []);
    // when countries and profile phone are ready, parse existing phone into local input + selected country
    useEffect(() => {
        if (!countries.length)
            return;
        if (!profileData.phone)
            return;
        const phoneFull = (profileData.phone || '').trim();
        if (!phoneFull.startsWith('+')) {
            setPhoneNumberInput(phoneFull.replace(/\D/g, ''));
            return;
        }
        const matched = countries.find(c => phoneFull.startsWith(c.code));
        if (matched) {
            setSelectedCountry(matched);
            setPhoneNumberInput(phoneFull.replace(new RegExp('^\\' + matched.code), '').replace(/\D/g, ''));
        }
        else {
            setPhoneNumberInput(phoneFull.replace(/\D/g, '').replace(/^\+?\d{1,4}/, ''));
        }
    }, [countries, profileData.phone]);
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
                setInitialPhone(data.phone || '');
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
                const bookings = bookingsResult.data || [];
                setUserBookings(bookings);
                try {
                    const ids = bookings.map((b) => String(b.booking_id || b.id)).filter(Boolean);
                    if (ids.length) {
                        const { data: abData, error: abErr } = await supabase
                            .from('assignment_bookings')
                            .select('booking_id')
                            .in('booking_id', ids);
                        if (!abErr && Array.isArray(abData)) {
                            setScheduledBookingIds(new Set(abData.map((r) => String(r.booking_id))));
                        }
                        else {
                            setScheduledBookingIds(new Set());
                        }
                    }
                    else {
                        setScheduledBookingIds(new Set());
                    }
                }
                catch (e) {
                    console.warn('Failed to fetch assignment bookings linkage', e);
                    setScheduledBookingIds(new Set());
                }
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
    // Open cancel confirmation modal (inline) for a booking
    const handleUserCancel = (booking) => {
        setCancelModalBooking(booking);
    };
    // Perform the cancellation (called from modal Confirm)
    const performCancel = async () => {
        if (!cancelModalBooking)
            return;
        try {
            setCanceling(true);
            setLoading(true);
            const booking = cancelModalBooking;
            // Call server-side Edge Function to perform RLS-safe cancellation
            const fnPayload = { booking_id: booking.id || booking.booking_id };
            // Ensure we pass a valid access token to the Edge Function.
            // Try to refresh the session if possible before invoking.
            let { data: { session } } = await supabase.auth.getSession();
            try {
                if (session && session.refresh_token) {
                    const refreshRes = await supabase.auth.refreshSession();
                    if (refreshRes && refreshRes.data && refreshRes.data.session) {
                        session = refreshRes.data.session;
                    }
                }
            }
            catch (refreshErr) {
                console.warn('Failed to refresh session before cancel invoke', refreshErr);
            }
            if (!session || !session.access_token) {
                setCancelSuccessMessage('Your session has expired. Please sign in again and try cancelling.');
                setCanceling(false);
                setLoading(false);
                return;
            }
            console.debug('Invoking user-cancel-booking with token exp:', session.expires_at);
            const res = await supabase.functions.invoke('user-cancel-booking', {
                body: fnPayload,
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            console.debug('user-cancel-booking response:', res);
            // supabase.functions.invoke returns { data, error }
            if (res.error || (res.data && res.data.ok === false)) {
                console.error('Failed to cancel booking via edge function:', res.error || res.data);
                setCancelSuccessMessage('Unable to cancel booking right now. Please try again or contact support.');
                return;
            }
            // Refresh user's bookings
            await fetchUserData();
            setCancelSuccessMessage('Booking cancelled successfully.');
            // auto-clear after a short delay
            setTimeout(() => setCancelSuccessMessage(''), 4000);
            setCancelModalBooking(null);
        }
        catch (e) {
            console.error('Error cancelling booking from profile:', e);
            setCancelSuccessMessage('Unable to cancel booking right now. Please try again or contact support.');
        }
        finally {
            setCanceling(false);
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
        // Validate phone according to selected country local pattern
        if (editing) {
            const local = phoneNumberInput.replace(/\D/g, '');
            if (local && selectedCountry) {
                try {
                    const parsed = phoneUtil.parse(local, selectedCountry.iso);
                    if (!phoneUtil.isValidNumberForRegion(parsed, selectedCountry.iso)) {
                        newErrors.phone = `Please enter a valid phone number for ${selectedCountry.name}`;
                    }
                }
                catch (e) {
                    newErrors.phone = `Please enter a valid phone number for ${selectedCountry.name}`;
                }
            }
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
            // Normalize phone to E.164 when possible
            let newPhoneE164 = profileData.phone;
            if (editing && selectedCountry && phoneNumberInput) {
                try {
                    const parsed = phoneUtil.parse(phoneNumberInput, selectedCountry.iso);
                    newPhoneE164 = phoneUtil.format(parsed, PhoneNumberFormat.E164);
                }
                catch (e) {
                    // fallback: naive concat
                    newPhoneE164 = `${selectedCountry.code}${phoneNumberInput.replace(/\D/g, '')}`;
                }
            }
            const profilePayload = {
                user_id: user.id,
                full_name: profileData.full_name,
                email: profileData.email,
                phone: newPhoneE164,
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
            if (ENABLE_PHONE_OTP && (selectedCountry && phoneNumberInput && ((newPhoneE164 || '').replace(/\D/g, '') !== (initialPhone || '').replace(/\D/g, '')))) {
                setPendingPhone(newPhoneE164);
                setOtpModalOpen(true);
                try {
                    // Send OTP and start cooldown timer (allow server to enforce ownership at verify time)
                    await sendOtpRequest(user.id, newPhoneE164);
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
            // call Supabase Edge Function `verify-phone-otp`
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const resp = await supabase.functions.invoke?.('verify-phone-otp', { body: { user_id: user.id, phone: pendingPhone, code: otpCode } });
            // Prefer structured function response when available
            const data = resp?.data ?? resp;
            // Handle responses explicitly
            if (data && data.verified === true) {
                // Server verified and (server-side) updated the profile.phone; refresh profile data
                await fetchProfileData();
                setInitialPhone(pendingPhone);
                setOtpModalOpen(false);
                setOtpCode('');
                setPendingPhone(null);
                alert('Phone verified and saved successfully');
                return;
            }
            // If function returned a structured reason, surface it to the user
            if (data && data.verified === false) {
                const reason = data.reason || data.error || 'verification_failed';
                if (reason === 'phone_in_use_by_other_account') {
                    // Show a non-blocking banner on the page indicating the phone is registered elsewhere
                    setPhoneConflictMessage('This mobile number is already registered with another account. If this is your number, please sign in with that account or contact support.');
                    setOtpModalOpen(false);
                    return;
                }
                if (reason === 'invalid_code') {
                    alert('The code you entered is incorrect. Please try again.');
                    return;
                }
                if (reason === 'no_valid_otp') {
                    alert('No valid verification code was found or it expired. Please request a new code.');
                    setOtpModalOpen(false);
                    return;
                }
                if (reason === 'max_attempts_exceeded') {
                    alert('Maximum verification attempts exceeded. Please request a new code.');
                    setOtpModalOpen(false);
                    return;
                }
                alert('Verification failed: ' + String(reason));
                return;
            }
            // Fallback: if no structured response, try to infer common conflicts
            const text = JSON.stringify(data || {});
            if (text && /already\s+associated|in\s+use|exists|taken/i.test(text)) {
                setPhoneConflictMessage('This mobile number is already registered with another account. If this is your number, please sign in with that account or contact support.');
                setOtpModalOpen(false);
                return;
            }
            alert('Unable to verify OTP at this time. Please try again later.');
        }
        catch (err) {
            console.error('Error verifying OTP:', err);
            const msg = String(err?.message || err || '');
            if (msg && /already\s+associated|in\s+use|exists|taken/i.test(msg)) {
                setPhoneConflictMessage('This mobile number is already registered with another account. If this is your number, please sign in with that account or contact support.');
                setOtpModalOpen(false);
            }
            else {
                alert('Unable to verify OTP right now. Please try again later.');
            }
        }
        finally {
            setOtpLoading(false);
        }
    };
    // Helper to send OTP and start 60s cooldown
    const sendOtpRequest = async (userId, phone) => {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const resp = await supabase.functions.invoke?.('send-phone-otp', { body: { user_id: userId, phone } });
            const data = resp?.data ?? resp;
            // if function returned ok true, set last sent time and start cooldown
            if (data && data.ok) {
                setResendSecondsLeft(60);
                // clear any existing interval
                if (resendIntervalRef.current) {
                    clearInterval(resendIntervalRef.current);
                }
                resendIntervalRef.current = setInterval(() => {
                    setResendSecondsLeft(prev => {
                        if (prev <= 1) {
                            if (resendIntervalRef.current) {
                                clearInterval(resendIntervalRef.current);
                                resendIntervalRef.current = null;
                            }
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
            return data;
        }
        catch (err) {
            console.error('sendOtpRequest error', err);
            throw err;
        }
    };
    if (!user) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(XCircle, { className: "w-8 h-8 text-red-600 dark:text-red-400" }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "Please sign in to view your profile." }), _jsx(Button, { onClick: () => navigate('/login'), children: "Sign In" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 sm:pb-8 overflow-x-hidden", children: [otpModalOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black opacity-40" }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg p-6 z-50 w-full max-w-md mx-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2 text-gray-900 dark:text-white", children: "Verify Phone Number" }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-slate-300 mb-4", children: ["We've sent a one-time code to ", _jsx("span", { className: "font-medium", children: pendingPhone }), ". Enter the code below to verify your phone number."] }), _jsx("input", { type: "text", value: otpCode, onChange: (e) => setOtpCode(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-4", placeholder: "Enter OTP" }), _jsx("div", { className: "mb-3 text-sm text-gray-600 dark:text-slate-300", children: resendSecondsLeft > 0 ? (_jsxs("div", { children: ["Didn't receive the code? You can resend in ", _jsxs("span", { className: "font-medium", children: [resendSecondsLeft, "s"] }), "."] })) : (_jsxs("div", { children: ["Didn't receive the code? ", _jsx("button", { className: "underline text-blue-600 dark:text-blue-400", onClick: async () => {
                                                if (!pendingPhone || !user)
                                                    return;
                                                try {
                                                    setOtpLoading(true);
                                                    await sendOtpRequest(user.id, pendingPhone);
                                                    alert('A new code was sent');
                                                }
                                                catch (e) {
                                                    console.error('Resend failed', e);
                                                    alert('Unable to resend code right now');
                                                }
                                                finally {
                                                    setOtpLoading(false);
                                                }
                                            }, children: "Resend code" })] })) }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx(Button, { variant: "outline", onClick: () => { setOtpModalOpen(false); setOtpCode(''); setPendingPhone(null); }, children: "Cancel" }), _jsx(Button, { loading: otpLoading, onClick: verifyOtp, children: "Verify" })] })] })] })), _jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-green-600 shadow-lg", children: [_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 w-full sm:w-auto text-center sm:text-left", children: [_jsxs("div", { className: "relative", children: [avatarPreview || profileData.avatar_url ? (_jsx("img", { src: avatarPreview || profileData.avatar_url, alt: "Profile", className: "w-24 h-24 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg" })) : (_jsx("div", { className: "w-24 h-24 sm:w-20 sm:h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-white shadow-lg", children: _jsx(User, { className: "w-12 h-12 sm:w-10 sm:h-10 text-gray-400 dark:text-slate-300" }) })), editing && (_jsxs("label", { className: "absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg", children: [_jsx(Camera, { className: "w-4 h-4" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleAvatarChange, className: "hidden" })] }))] }), _jsxs("div", { className: "text-white w-full sm:w-auto", children: [_jsx("h1", { className: "text-3xl font-bold", children: profileData.full_name || 'Your Profile' }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 mt-2", children: [_jsxs("p", { className: "flex items-center opacity-90", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), profileData.email] }), profileData.phone && (_jsxs("p", { className: "flex items-center opacity-90", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), profileData.phone] })), editing && (_jsxs("label", { className: "flex items-center space-x-2 text-sm text-white opacity-95", children: [_jsx("input", { type: "checkbox", name: "whatsapp_opt_in", checked: !!profileData.whatsapp_opt_in, onChange: handleInputChange, className: "h-4 w-4 rounded border-white bg-white text-blue-600" }), _jsx("span", { className: "leading-tight", children: "Receive WhatsApp updates (class details & reminders)" })] }))] }), profileData.years_of_experience > 0 && (_jsx("div", { className: "mt-2", children: _jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getExperienceColor(profileData.years_of_experience)}`, children: [_jsx(Award, { className: "w-3 h-3 mr-1 inline" }), profileData.years_of_experience, " ", profileData.years_of_experience === 1 ? 'Year' : 'Years', " Experience"] }) }))] })] }), _jsx("div", { className: "hidden sm:flex space-x-3", children: editing ? (_jsxs(_Fragment, { children: [_jsxs(Button, { onClick: () => {
                                                    setEditing(false);
                                                    setAvatarFile(null);
                                                    setAvatarPreview(null);
                                                    fetchProfileData(); // Reset form
                                                }, variant: "outline", size: "sm", className: "bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-white dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600", children: [_jsx(X, { className: "w-4 h-4 mr-2" }), " Cancel"] }), _jsxs(Button, { onClick: handleSaveProfile, loading: loading, size: "sm", className: "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-600", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), " Save Changes"] })] })) : (_jsxs(Button, { onClick: () => setEditing(true), variant: "outline", size: "sm", className: "bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-white dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600", children: [_jsx(Edit2, { className: "w-4 h-4 mr-2" }), " Edit Profile"] })) })] }) }), cancelModalBooking && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black opacity-40" }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg p-6 z-50 w-full max-w-md mx-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2 text-gray-900 dark:text-white", children: "Cancel Booking" }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-slate-300 mb-4", children: ["You're about to cancel the booking ", _jsx("span", { className: "font-mono", children: cancelModalBooking.booking_id || cancelModalBooking.id }), ". This action cannot be undone."] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-sm text-gray-900 font-medium", children: cancelModalBooking.class_name }), _jsxs("div", { className: "text-sm text-gray-500", children: [formatDate(cancelModalBooking.class_date), " \u2022 ", cancelModalBooking.class_time] })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx(Button, { variant: "outline", onClick: () => setCancelModalBooking(null), children: "Back" }), _jsx(Button, { className: "bg-red-600 hover:bg-red-700", loading: canceling, onClick: performCancel, children: "Confirm Cancel" })] })] })] }))] }), phoneConflictMessage && (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4", children: _jsx("div", { className: "rounded-md bg-yellow-50 p-4 border border-yellow-200", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-1 text-sm text-yellow-800", children: phoneConflictMessage }), _jsx("div", { className: "ml-4 flex-shrink-0", children: _jsx("button", { onClick: () => setPhoneConflictMessage(null), className: "text-sm text-yellow-700 underline", children: "Dismiss" }) })] }) }) })), _jsx("div", { className: "bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700", children: _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("nav", { className: "flex space-x-8 overflow-x-auto py-2", children: tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { children: tab.label })] }, tab.id));
                        }) }) }) }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [activeTab === 'overview' && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6 mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-6", children: "Profile Information" }), errors.general && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6", children: _jsx("p", { className: "text-red-600 dark:text-red-400 text-sm", children: errors.general }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Full Name" }), editing ? (_jsx("input", { type: "text", name: "full_name", value: profileData.full_name, onChange: handleInputChange, className: `w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${errors.full_name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your full name" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.full_name || 'Not provided' })), errors.full_name && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.full_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Email Address" }), _jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Phone Number" }), editing ? (_jsx(CountryPicker, { countries: countries, selected: selectedCountry, onSelect: (c) => setSelectedCountry(c), phoneValue: phoneNumberInput, onPhoneChange: (v) => setPhoneNumberInput(v), error: errors.phone })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.phone || 'Not provided' })), errors.phone && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.phone })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Date of Birth" }), editing ? (_jsx("input", { type: "date", name: "date_of_birth", value: profileData.date_of_birth, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors" })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.date_of_birth ? formatDate(profileData.date_of_birth) : 'Not provided' }))] }), editing && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Gender" }), _jsxs("select", { name: "gender", value: profileData.gender, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", children: [_jsx("option", { value: "", children: "Select Gender" }), _jsx("option", { value: "male", children: "Male" }), _jsx("option", { value: "female", children: "Female" }), _jsx("option", { value: "other", children: "Other" }), _jsx("option", { value: "prefer_not_to_say", children: "Prefer not to say" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Years of Experience" }), _jsx("input", { type: "number", name: "years_of_experience", value: profileData.years_of_experience, onChange: handleInputChange, min: "0", className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Years of yoga experience" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Location" }), _jsx("input", { type: "text", name: "location", value: profileData.location, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Your location" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Nationality" }), _jsx("input", { type: "text", name: "nationality", value: profileData.nationality, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", placeholder: "Your nationality" })] })] }))] }), _jsxs("div", { className: "mt-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Bio" }), editing ? (_jsx("textarea", { name: "bio", rows: 4, value: profileData.bio, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none", placeholder: "Tell us about yourself..." })) : (_jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.bio || 'No bio provided' }))] }), !editing && profileData.specialties.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Specialties" }), _jsx("div", { className: "flex flex-wrap gap-2", children: profileData.specialties.map((specialty, index) => (_jsx("span", { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium", children: specialty }, index))) })] })), _jsx("div", { className: "pt-6 border-t border-gray-200 dark:border-slate-600 mt-6", children: _jsxs("div", { className: "flex items-center text-sm text-gray-600 dark:text-slate-400", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Member since ", formatDate(user.created_at)] }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Quick Stats" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Total Bookings" }), _jsx("span", { className: "font-semibold text-blue-600 dark:text-blue-400", children: userBookings.length })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Queries Sent" }), _jsx("span", { className: "font-semibold text-green-600 dark:text-emerald-400", children: userQueries.length })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Experience" }), _jsxs("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(profileData.years_of_experience)}`, children: [profileData.years_of_experience, " ", profileData.years_of_experience === 1 ? 'Year' : 'Years'] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-slate-300", children: "Profile Status" }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${profileData.profile_completed ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`, children: profileData.profile_completed ? 'Complete' : 'Incomplete' })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Recent Activity" }), _jsxs("div", { className: "space-y-3", children: [userBookings.slice(0, 3).map((booking, index) => (_jsxs("div", { className: "flex items-center space-x-3 text-sm", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${getStatusColor(booking.status).replace('text-', 'bg-').replace('100', '500')}` }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: booking.class_name }), _jsx("p", { className: "text-gray-500 dark:text-slate-400", children: formatDate(booking.class_date) })] })] }, index))), userBookings.length === 0 && (_jsx("p", { className: "text-gray-500 dark:text-slate-400 text-sm", children: "No recent activity" }))] })] })] })] })), cancelSuccessMessage && (_jsxs("div", { className: "mx-4 mt-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex justify-between items-center", children: [_jsx("span", { children: cancelSuccessMessage }), _jsx("button", { onClick: () => setCancelSuccessMessage(''), children: _jsx(X, { className: "w-4 h-4" }) })] })), activeTab === 'bookings' && (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-slate-600", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "My Bookings" }), _jsxs("span", { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium", children: [userBookings.length, " Total"] })] }) }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : userBookings.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "No bookings yet" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "Start your yoga journey by booking your first class!" }), _jsx(Button, { onClick: () => navigate('/schedule'), children: "Browse Classes" })] })) : (_jsx("div", { className: "divide-y divide-gray-200 dark:divide-slate-600", children: userBookings.map((booking, index) => (_jsx("div", { className: "p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: booking.class_name }), _jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(booking.status)}`, children: [getStatusIcon(booking.status), _jsx("span", { className: "ml-1", children: booking.status.charAt(0).toUpperCase() + booking.status.slice(1) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-slate-300", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), formatDate(booking.class_date)] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), booking.class_time] }), _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2" }), booking.instructor] }), _jsxs("div", { className: "flex items-center", children: [_jsx(FileText, { className: "w-4 h-4 mr-2" }), "Booking # ", String(booking.booking_id || booking.id || '').toString()] })] }), booking.special_requests && (_jsx("div", { className: "mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-800 dark:text-blue-400", children: [_jsx(FileText, { className: "w-4 h-4 mr-1 inline" }), _jsx("strong", { children: "Special Requests:" }), " ", booking.special_requests] }) })), _jsx("div", { className: "mt-4 flex items-center gap-2", children: (() => {
                                                        const s = String(booking.status || '').toLowerCase();
                                                        const isCanceled = s === 'cancelled' || s === 'canceled';
                                                        const isCompleted = s === 'completed';
                                                        const isScheduled = scheduledBookingIds.has(String(booking.booking_id || booking.id));
                                                        const startedInPast = isClassStartInPast(booking.class_date, booking.class_time);
                                                        // hide if there's no valid cancel token (used or expired)
                                                        const hasValidCancelToken = !!(booking.cancel_token && booking.cancel_token_expires_at && new Date(String(booking.cancel_token_expires_at)).getTime() > Date.now());
                                                        return !isCanceled && !isCompleted && !isScheduled && !startedInPast && hasValidCancelToken;
                                                    })() && (_jsx(Button, { variant: "outline", onClick: () => handleUserCancel(booking), children: "Cancel Booking" })) })] }) }) }, index))) }))] })), activeTab === 'queries' && (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-slate-600", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "My Messages" }), _jsxs("span", { className: "bg-green-100 text-green-800 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium", children: [userQueries.length, " Total"] })] }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-slate-400 mt-2", children: ["Messages sent from: ", _jsx("span", { className: "font-mono", children: user.email })] })] }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : userQueries.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "No messages found" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "You haven't sent any contact messages yet." }), _jsx("div", { className: "space-x-3", children: _jsx(Button, { onClick: () => navigate('/contact'), children: "Send Your First Message" }) })] })) : (_jsx("div", { className: "divide-y divide-gray-200 dark:divide-slate-600", children: userQueries.map((message, index) => (_jsxs("div", { className: "p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: message.subject }), _jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(message.status)}`, children: message.status.charAt(0).toUpperCase() + message.status.slice(1) })] }), _jsx("p", { className: "text-gray-700 dark:text-slate-300 mb-3 line-clamp-3", children: message.message }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500 dark:text-slate-400", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-1" }), "Sent on ", formatDate(message.created_at)] }), _jsxs("div", { className: "text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded", children: ["From: ", message.email] })] })] }, message.id || index))) }))] })), activeTab === 'settings' && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-6", children: "Account Settings" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "border-b border-gray-200 dark:border-slate-600 pb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Emergency Contact" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Emergency Contact Name" }), editing ? (_jsx("input", { type: "text", value: renderJsonField(profileData.emergency_contact, 'name'), onChange: (e) => {
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
                                                                        }, className: "rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-slate-300", children: specialty })] }, specialty))) })] })) : (_jsx("div", { children: _jsx("div", { className: "text-gray-900 dark:text-white py-2", children: renderArray(profileData.specialties, 'No specialties selected') }) }))] }), _jsxs("div", { className: "border-b border-gray-200 dark:border-slate-600 pb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Privacy Settings" }), editing && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Profile Visibility" }), _jsxs("select", { name: "profile_visibility", value: profileData.profile_visibility, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "private", children: "Private" }), _jsx("option", { value: "friends", children: "Friends Only" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2", children: "Preferred Contact Method" }), _jsxs("select", { name: "preferred_contact_method", value: profileData.preferred_contact_method, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors", children: [_jsx("option", { value: "email", children: "Email" }), _jsx("option", { value: "phone", children: "Phone" }), _jsx("option", { value: "sms", children: "SMS" })] })] }), _jsx("div", { className: "md:col-span-2", children: editing ? (_jsxs("label", { className: "flex items-start space-x-3", children: [_jsx("input", { type: "checkbox", name: "whatsapp_opt_in", checked: !!profileData.whatsapp_opt_in, onChange: handleInputChange, className: "mt-2 h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-700 dark:text-slate-300", children: "WhatsApp updates" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300", children: "Only for class details/updates, important reminders, and notifications about new events & promotions. We do not spam." })] })] })) : (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "WhatsApp updates" }), _jsx("p", { className: "text-gray-900 dark:text-white py-2", children: profileData.whatsapp_opt_in ? 'Subscribed — will receive class details, important reminders, and notifications about events & promotions.' : 'Not subscribed to WhatsApp updates.' })] })) })] }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-4", children: "Danger Zone" }), _jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400 mr-3" }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-red-900 dark:text-red-400 font-medium", children: "Delete Account" }), _jsx("p", { className: "text-red-700 dark:text-red-400 text-sm", children: "Once you delete your account, there is no going back. Please be certain." })] }), _jsx(Button, { variant: "outline", className: "border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30", children: "Delete Account" })] }) })] })] })] }) }))] }), editing && (_jsx("div", { className: "fixed bottom-4 left-0 right-0 px-4 sm:hidden z-50", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 flex gap-3", children: [_jsx(Button, { variant: "outline", className: "flex-1", onClick: () => { setEditing(false); fetchProfileData(); setAvatarFile(null); setAvatarPreview(null); }, children: "Cancel" }), _jsx(Button, { className: "flex-1", loading: loading, onClick: handleSaveProfile, children: "Save" })] }) })), !editing && (_jsx("div", { className: "fixed bottom-4 right-4 sm:hidden z-50", children: _jsx(Button, { onClick: () => { setEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, className: "p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg", children: _jsx(Edit2, { className: "w-5 h-5" }) }) }))] }));
}
// Small custom country picker component
function CountryPicker({ countries, selected, onSelect, phoneValue, onPhoneChange, error }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        function onDoc(e) {
            if (!ref.current)
                return;
            if (!ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);
    return (_jsxs("div", { ref: ref, className: "relative flex items-center w-full", children: [_jsxs("button", { type: "button", onClick: () => setOpen(s => !s), className: "w-28 flex-shrink-0 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-between", children: [_jsx("span", { className: "font-medium", children: selected?.code || 'Country' }), _jsx("svg", { className: "w-4 h-4 text-gray-500 ml-2", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 8l4 4 4-4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), _jsx("input", { type: "tel", name: "phone", value: phoneValue, onChange: (e) => onPhoneChange(e.target.value), className: `flex-1 min-w-0 ml-2 px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your mobile number" }), open && (_jsx("div", { className: "absolute z-50 mt-2 w-72 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg", children: _jsx("ul", { children: countries.map(c => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => { onSelect(c); setOpen(false); }, className: "w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700", children: [_jsx("span", { className: "mr-2", children: c.name }), _jsx("span", { className: "text-sm text-gray-500", children: c.code })] }) }, c.iso))) }) }))] }));
}
