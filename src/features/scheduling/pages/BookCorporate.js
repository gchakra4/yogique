import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Building, Calendar, ChevronDown, ChevronUp, Clock, Mail, Phone, Search, Star, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { COMMON_TIMEZONES, getUserTimezone } from '../../../shared/utils/timezoneUtils';
import { useAuth } from '../../auth/contexts/AuthContext';
export function BookCorporate() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const submittingRef = useRef(false);
    const [errors, setErrors] = useState({});
    const [bookingId, setBookingId] = useState('');
    const [classPackages, setClassPackages] = useState([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [packageSearch, setPackageSearch] = useState('');
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [courseTypeFilter, setCourseTypeFilter] = useState('all');
    const [formData, setFormData] = useState({
        // Company Info
        companyName: '',
        industry: '',
        companySize: '',
        contactName: '',
        position: '',
        email: user?.email || '',
        phone: '',
        // Program Details
        packageType: '',
        participantCount: '',
        frequency: '',
        objectives: '',
        // Schedule & Logistics
        preferredDays: [],
        preferredTimes: [],
        timezone: getUserTimezone(),
        startDate: '',
        location: '',
        // Budget & Requirements
        budget: '',
        specialRequests: '',
        hasWellnessProgram: '',
        previousExperience: ''
    });
    // Fetch class packages from database
    useEffect(() => {
        fetchClassPackages();
    }, []);
    const fetchClassPackages = async () => {
        try {
            setLoadingPackages(true);
            const { data, error } = await supabase
                .from('class_packages')
                .select('*')
                .eq('is_active', true)
                .eq('type', 'Corporate')
                .order('price');
            if (error) {
                throw error;
            }
            setClassPackages(data || []);
        }
        catch (error) {
            console.error('Error fetching class packages:', error);
            setErrors({ classPackages: 'Failed to load class packages. Please refresh the page.' });
        }
        finally {
            setLoadingPackages(false);
        }
    };
    // Filter class packages based on search and course type filter
    const filteredPackages = classPackages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
            (pkg.description && pkg.description.toLowerCase().includes(packageSearch.toLowerCase()));
        const matchesCourseType = courseTypeFilter === 'all' || pkg.course_type === courseTypeFilter;
        return matchesSearch && matchesCourseType;
    });
    const toggleCardExpansion = (packageId) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(packageId)) {
            newExpanded.delete(packageId);
        }
        else {
            newExpanded.add(packageId);
        }
        setExpandedCards(newExpanded);
    };
    const truncateDescription = (description, maxLength = 100) => {
        if (description.length <= maxLength)
            return description;
        return description.substring(0, maxLength) + '...';
    };
    // Save form data to localStorage before redirecting to login
    const saveFormDataAndRedirect = () => {
        const formDataToSave = {
            ...formData,
            selectedPackage,
            selectedStep: step,
            courseTypeFilter,
            expandedCards: Array.from(expandedCards)
        };
        localStorage.setItem('pendingCorporateBookingData', JSON.stringify(formDataToSave));
        window.location.href = '/login?redirect=/book/corporate';
    };
    // Restore form data after login
    useEffect(() => {
        if (user) {
            const savedData = localStorage.getItem('pendingCorporateBookingData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    setFormData({
                        companyName: parsedData.companyName || '',
                        industry: parsedData.industry || '',
                        companySize: parsedData.companySize || '',
                        contactName: parsedData.contactName || '',
                        position: parsedData.position || '',
                        email: parsedData.email || user.email || '',
                        phone: parsedData.phone || '',
                        packageType: parsedData.packageType || '',
                        participantCount: parsedData.participantCount || '',
                        frequency: parsedData.frequency || '',
                        objectives: parsedData.objectives || '',
                        preferredDays: parsedData.preferredDays || [],
                        preferredTimes: parsedData.preferredTimes || [],
                        timezone: parsedData.timezone || '',
                        startDate: parsedData.startDate || '',
                        location: parsedData.location || '',
                        budget: parsedData.budget || '',
                        specialRequests: parsedData.specialRequests || '',
                        hasWellnessProgram: parsedData.hasWellnessProgram || '',
                        previousExperience: parsedData.previousExperience || ''
                    });
                    setSelectedPackage(parsedData.selectedPackage || null);
                    setStep(parsedData.selectedStep || 1);
                    setCourseTypeFilter(parsedData.courseTypeFilter || 'all');
                    setExpandedCards(new Set(parsedData.expandedCards || []));
                    // Clear saved data
                    localStorage.removeItem('pendingCorporateBookingData');
                }
                catch (error) {
                    console.error('Error restoring form data:', error);
                }
            }
        }
    }, [user]);
    const industries = [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
        'Retail', 'Consulting', 'Legal', 'Marketing', 'Real Estate', 'Other'
    ];
    const companySizes = [
        '1-10 employees', '11-50 employees', '51-200 employees',
        '201-500 employees', '501-1000 employees', '1000+ employees'
    ];
    const frequencies = [
        { id: 'one-time', name: 'One-time Session', multiplier: 1 },
        { id: 'weekly', name: 'Weekly Sessions', multiplier: 4 },
        { id: 'bi-weekly', name: 'Bi-weekly Sessions', multiplier: 2 },
        { id: 'monthly', name: 'Monthly Sessions', multiplier: 1 },
        { id: 'quarterly', name: 'Quarterly Sessions', multiplier: 0.25 }
    ];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];
    // Cross-tab id and lightweight local logging (used for idempotency diagnostics)
    const tabIdKey = 'yq_tab_id';
    let tabId = sessionStorage.getItem(tabIdKey);
    if (!tabId) {
        try {
            tabId = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
            sessionStorage.setItem(tabIdKey, tabId);
        }
        catch (e) {
            tabId = `tab-${Date.now()}`;
            try {
                sessionStorage.setItem(tabIdKey, tabId);
            }
            catch { }
        }
    }
    const LOG_KEY = 'yq_booking_logs';
    function recordLog(type, payload) {
        try {
            const logsRaw = localStorage.getItem(LOG_KEY);
            const logs = logsRaw ? JSON.parse(logsRaw) : [];
            const entry = { time: new Date().toISOString(), tabId, type, payload };
            logs.push(entry);
            const trimmed = logs.slice(-200);
            localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
            console.debug('[booking-log]', entry);
        }
        catch (err) {
            console.debug('recordLog failed', err);
        }
    }
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    const handlePackageSelect = (classPackage) => {
        setSelectedPackage(classPackage);
        setFormData(prev => ({ ...prev, packageType: classPackage.id }));
        if (errors.packageType) {
            setErrors(prev => ({ ...prev, packageType: '' }));
        }
    };
    const handleArrayToggle = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };
    const validateStep = (stepNumber) => {
        const newErrors = {};
        switch (stepNumber) {
            case 1:
                if (!formData.companyName.trim())
                    newErrors.companyName = 'Company name is required';
                if (!formData.industry)
                    newErrors.industry = 'Industry is required';
                if (!formData.companySize)
                    newErrors.companySize = 'Company size is required';
                if (!formData.contactName.trim())
                    newErrors.contactName = 'Contact name is required';
                if (!formData.position.trim())
                    newErrors.position = 'Position is required';
                if (!formData.email.trim())
                    newErrors.email = 'Email is required';
                if (!formData.phone.trim())
                    newErrors.phone = 'Phone number is required';
                break;
            case 2:
                if (!formData.packageType)
                    newErrors.packageType = 'Please select a package';
                if (!formData.participantCount)
                    newErrors.participantCount = 'Number of participants is required';
                if (!formData.frequency)
                    newErrors.frequency = 'Please select frequency';
                if (!formData.objectives.trim())
                    newErrors.objectives = 'Please describe your objectives';
                break;
            case 3:
                if (formData.preferredDays.length === 0)
                    newErrors.preferredDays = 'Please select at least one preferred day';
                if (formData.preferredTimes.length === 0)
                    newErrors.preferredTimes = 'Please select at least one preferred time';
                if (!formData.timezone)
                    newErrors.timezone = 'Timezone is required';
                if (!formData.startDate)
                    newErrors.startDate = 'Start date is required';
                if (!formData.location)
                    newErrors.location = 'Please specify location preference';
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Prevent duplicate concurrent submissions
        if (submittingRef.current)
            return;
        submittingRef.current = true;
        // Check if user is authenticated
        if (!user) {
            // Save form data and redirect to login
            saveFormDataAndRedirect();
            submittingRef.current = false;
            return;
        }
        if (!validateStep(3)) {
            submittingRef.current = false;
            return;
        }
        try {
            recordLog('submit-attempt', { packageId: selectedPackage?.id || null, startDate: formData.startDate, preferredTimes: formData.preferredTimes });
            setLoading(true);
            const durationStr = selectedPackage?.duration;
            const session_duration_minutes = durationStr ? (parseInt(durationStr, 10) || 60) : 60;
            const bookingData = {
                user_id: user.id,
                class_name: `Corporate: ${selectedPackage?.name}`,
                instructor: 'Yogodaan Corporate Team',
                class_date: formData.startDate,
                class_time: formData.preferredTimes[0],
                first_name: formData.contactName.split(' ')[0] || '',
                last_name: formData.contactName.split(' ').slice(1).join(' ') || '',
                email: formData.email,
                phone: formData.phone,
                experience_level: 'intermediate', // Default for corporate bookings
                special_requests: formData.specialRequests,
                status: 'pending',
                booking_type: 'corporate',
                company_name: formData.companyName,
                job_title: formData.position,
                industry: formData.industry,
                participants_count: parseInt(formData.participantCount),
                work_location: formData.location,
                preferred_days: formData.preferredDays,
                preferred_times: formData.preferredTimes,
                session_frequency: formData.frequency,
                goals: formData.objectives,
                current_wellness_programs: formData.hasWellnessProgram ? formData.hasWellnessProgram === 'yes' : null,
                timezone: formData.timezone,
                emergency_contact: formData.contactName,
                emergency_phone: formData.phone,
                class_package_id: selectedPackage?.id || null,
                price: selectedPackage?.price || 0,
                session_duration: session_duration_minutes,
                equipment_needed: false,
                booking_notes: formData.previousExperience ? `Previous Experience: ${formData.previousExperience}` : null
            };
            // Idempotency guard across tabs: compute a simple payload hash and skip insert
            try {
                const payloadHash = JSON.stringify({ user_id: user?.id || null, class_date: formData.startDate, class_time: formData.preferredTimes?.[0] || null, class_package_id: selectedPackage?.id || null });
                const lastHash = localStorage.getItem('lastBookingPayloadHash');
                const lastCreated = localStorage.getItem('lastBookingCreated');
                if (lastHash && lastCreated && lastHash === payloadHash) {
                    console.info('Detected previous booking with same payload in this browser — skipping duplicate insert');
                    const parsed = JSON.parse(lastCreated);
                    setBookingId(parsed.bookingId || 'N/A');
                    setStep(4);
                    submittingRef.current = false;
                    setLoading(false);
                    return;
                }
            }
            catch (hashErr) {
                console.warn('Failed to run idempotency check', hashErr);
            }
            // Defensive pre-check: avoid creating duplicate bookings when user selected multiple days/times
            try {
                if (user?.id) {
                    const { data: existing, error: existingErr } = await supabase
                        .from('bookings')
                        .select('id,booking_id,status')
                        .eq('user_id', user.id)
                        .eq('class_date', formData.startDate)
                        .eq('class_time', formData.preferredTimes?.[0] || null)
                        .eq('class_package_id', selectedPackage?.id || null)
                        .limit(1)
                        .maybeSingle();
                    if (existingErr)
                        console.warn('Error checking for existing booking', existingErr);
                    if (existing && (existing.status === 'pending' || existing.status === 'confirmed')) {
                        console.info('Found existing booking - skipping insert', existing);
                        recordLog('skip-insert-found-existing', existing);
                        setBookingId(existing.booking_id || existing.id || 'N/A');
                        setStep(4);
                        submittingRef.current = false;
                        setLoading(false);
                        return;
                    }
                }
            }
            catch (checkErr) {
                console.warn('Failed to run pre-insert booking check', checkErr);
            }
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select('booking_id');
            if (error)
                throw error;
            const bookingIdValue = data?.[0]?.booking_id || 'N/A';
            setBookingId(bookingIdValue);
            recordLog('submit-success', { bookingId: bookingIdValue, response: data });
            try {
                const payloadHash = JSON.stringify({ user_id: user?.id || null, class_date: formData.startDate, class_time: formData.preferredTimes?.[0] || null, class_package_id: selectedPackage?.id || null });
                localStorage.setItem('lastBookingPayloadHash', payloadHash);
                localStorage.setItem('lastBookingCreated', JSON.stringify({ bookingId: bookingIdValue, createdAt: Date.now() }));
            }
            catch (lsErr) {
                console.warn('Failed to persist booking idempotency info to localStorage', lsErr);
            }
            // Broadcast booking creation to other tabs/windows
            try {
                // @ts-ignore
                const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('yq-booking-events') : null;
                bc?.postMessage({ type: 'booking-created', bookingId: bookingIdValue, context: 'corporate' });
                try {
                    bc?.close();
                }
                catch { }
            }
            catch (bcErr) {
                console.debug('BroadcastChannel not available or failed', bcErr);
            }
            setStep(4); // Success step
        }
        catch (error) {
            setErrors({ general: error.message || 'An error occurred while submitting your request.' });
        }
        finally {
            setLoading(false);
            submittingRef.current = false;
        }
    };
    const calculateEstimatedPrice = () => {
        const selectedFrequency = frequencies.find(f => f.id === formData.frequency);
        if (!selectedPackage || !selectedFrequency || !formData.participantCount)
            return 0;
        const basePrice = selectedPackage.price;
        const participantMultiplier = Math.max(1, parseInt(formData.participantCount) / 20);
        const monthlyPrice = basePrice * participantMultiplier * selectedFrequency.multiplier;
        return Math.round(monthlyPrice);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: [_jsx("div", { className: "bg-white dark:bg-slate-700 dark:bg-slate-800 shadow-sm", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white dark:text-white", children: "Corporate Wellness Program" }), _jsx("p", { className: "text-gray-600 dark:text-white dark:text-slate-300 mt-2", children: "Transform your workplace with customized yoga and wellness solutions" }), !user && (_jsx("div", { className: "mt-4 bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4", children: _jsxs("p", { className: "text-purple-800 dark:text-purple-200 text-sm", children: [_jsx("span", { className: "font-medium", children: "Note:" }), " You'll need to log in to complete your booking.", _jsx("button", { onClick: () => window.location.href = '/login', className: "ml-2 text-purple-600 dark:text-purple-400 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-200", children: "Log in now" })] }) }))] }), _jsxs("div", { className: "mt-8", children: [_jsx("div", { className: "flex items-center justify-center space-x-4", children: [1, 2, 3, 4].map((stepNumber) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-white'}`, children: step > stepNumber ? '✓' : stepNumber }), stepNumber < 4 && (_jsx("div", { className: `w-16 h-1 mx-2 ${step > stepNumber ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'}` }))] }, stepNumber))) }), _jsxs("div", { className: "flex justify-center space-x-20 mt-2", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Company Info" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Program Details" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Schedule" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Confirmation" })] })] })] }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [errors.general && (_jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), errors.classPackages && (_jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.classPackages }) })), _jsxs("form", { onSubmit: handleSubmit, children: [step === 1 && (_jsxs("div", { className: "bg-white dark:bg-slate-700 dark:bg-slate-800 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Building, { className: "w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Company Information" }), _jsx("p", { className: "text-gray-600 dark:text-white", children: "Tell us about your organization" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Company Name *" }), _jsx("input", { type: "text", name: "companyName", value: formData.companyName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${errors.companyName ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your company name" }), errors.companyName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.companyName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Industry *" }), _jsxs("select", { name: "industry", value: formData.industry, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${errors.industry ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select industry" }), industries.map(industry => (_jsx("option", { value: industry, children: industry }, industry)))] }), errors.industry && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.industry })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Company Size *" }), _jsxs("select", { name: "companySize", value: formData.companySize, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.companySize ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select company size" }), companySizes.map(size => (_jsx("option", { value: size, children: size }, size)))] }), errors.companySize && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.companySize })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Contact Person *" }), _jsx("input", { type: "text", name: "contactName", value: formData.contactName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.contactName ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Full name" }), errors.contactName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.contactName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Position/Title *" }), _jsx("input", { type: "text", name: "position", value: formData.position, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.position ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Your position/title" }), errors.position && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.position })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Email *" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Email address" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Phone Number *" }), _jsx("input", { type: "tel", name: "phone", value: formData.phone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.phone ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Phone number" }), errors.phone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone })] })] }), _jsx("div", { className: "flex justify-end mt-8", children: _jsx(Button, { onClick: handleNext, className: "px-8 py-3 bg-purple-600 hover:bg-purple-700", children: "Next Step" }) })] })), step === 2 && (_jsxs("div", { className: "bg-white dark:bg-slate-700 dark:bg-slate-800 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Star, { className: "w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Program Details" }), _jsx("p", { className: "text-gray-600 dark:text-white", children: "Choose the perfect program for your team" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-4", children: "Available Corporate Programs *" }), loadingPackages ? (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 dark:border-purple-400" }), _jsx("span", { className: "ml-2 text-gray-600 dark:text-white", children: "Loading programs..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search programs...", value: packageSearch, onChange: (e) => setPackageSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" })] }), _jsxs("div", { className: "flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1", children: [_jsx("button", { type: "button", onClick: () => setCourseTypeFilter('all'), className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'all'
                                                                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                                                            : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'}`, children: "All" }), _jsx("button", { type: "button", onClick: () => setCourseTypeFilter('regular'), className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'regular'
                                                                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                                                            : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'}`, children: "Regular" }), _jsx("button", { type: "button", onClick: () => setCourseTypeFilter('crash'), className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'crash'
                                                                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                                                            : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'}`, children: "Crash" })] })] }), _jsx("div", { className: "grid gap-4 max-h-96 overflow-y-auto", children: filteredPackages.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-300", children: packageSearch ? 'No programs found matching your search.' : 'No programs available.' })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredPackages.map((pkg) => {
                                                                const isExpanded = expandedCards.has(pkg.id);
                                                                const isSelected = selectedPackage?.id === pkg.id;
                                                                return (_jsx("div", { className: `border-2 rounded-lg transition-all duration-200 hover:shadow-md ${isSelected
                                                                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                                                                        : 'border-gray-200 hover:border-purple-300'}`, children: _jsxs("div", { onClick: () => handlePackageSelect(pkg), className: "p-6 cursor-pointer", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white text-lg", children: pkg.name }), _jsxs("span", { className: "text-purple-600 dark:text-purple-400 font-bold text-xl", children: ["\u20B9", pkg.price] })] }), pkg.description && (_jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-gray-600 dark:text-white text-sm", children: isExpanded ? pkg.description : truncateDescription(pkg.description) }), pkg.description.length > 100 && (_jsx("button", { type: "button", onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleCardExpansion(pkg.id);
                                                                                        }, className: "text-purple-600 dark:text-purple-400 text-sm font-medium mt-1 flex items-center hover:text-purple-700 dark:text-purple-300", children: isExpanded ? (_jsxs(_Fragment, { children: ["Show Less ", _jsx(ChevronUp, { className: "w-3 h-3 ml-1" })] })) : (_jsxs(_Fragment, { children: ["Show More ", _jsx(ChevronDown, { className: "w-3 h-3 ml-1" })] })) }))] })), _jsxs("div", { className: "flex flex-wrap gap-3 items-center text-sm text-gray-600 dark:text-white", children: [_jsxs("span", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), pkg.class_count, " ", pkg.class_count === 1 ? 'Session' : 'Sessions'] }), pkg.course_type === 'crash' && pkg.duration ? (_jsxs("span", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), pkg.duration] })) : (_jsxs("span", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), pkg.validity_days, " Days Validity"] })), _jsx("span", { className: `text-xs px-2 py-1 rounded ${pkg.course_type === 'crash'
                                                                                            ? 'bg-orange-100 text-orange-800'
                                                                                            : 'bg-green-100 text-green-800'}`, children: pkg.course_type === 'crash' ? 'Crash Course' : 'Regular Course' }), pkg.class_type_restrictions && pkg.class_type_restrictions.length > 0 && (_jsx("span", { className: "text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded", children: "Specific Classes Only" }))] }), isSelected && (_jsx("div", { className: "mt-3 flex justify-end", children: _jsx("div", { className: "w-5 h-5 bg-purple-50 dark:bg-purple-900/200 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white dark:bg-slate-700 rounded-full" }) }) }))] }) }, pkg.id));
                                                            }) })) })] })), errors.packageType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.packageType })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Expected Number of Participants *" }), _jsx("input", { type: "number", name: "participantCount", value: formData.participantCount, onChange: handleInputChange, min: "1", max: "500", className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.participantCount ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Number of participants" }), errors.participantCount && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.participantCount })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Session Frequency *" }), _jsxs("select", { name: "frequency", value: formData.frequency, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.frequency ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select frequency" }), frequencies.map(freq => (_jsx("option", { value: freq.id, children: freq.name }, freq.id)))] }), errors.frequency && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.frequency })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Program Objectives *" }), _jsx("textarea", { name: "objectives", value: formData.objectives, onChange: handleInputChange, rows: 4, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.objectives ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "What do you hope to achieve with this program? (e.g., reduce stress, improve team bonding, enhance productivity...)" }), errors.objectives && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.objectives })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Does your company currently have a wellness program?" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "hasWellnessProgram", value: "yes", checked: formData.hasWellnessProgram === 'yes', onChange: handleInputChange, className: "mr-2" }), "Yes"] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "hasWellnessProgram", value: "no", checked: formData.hasWellnessProgram === 'no', onChange: handleInputChange, className: "mr-2" }), "No"] })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Previous Yoga/Wellness Experience" }), _jsx("textarea", { name: "previousExperience", value: formData.previousExperience, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400", placeholder: "Tell us about any previous yoga or wellness programs your team has participated in..." })] }), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(1), children: "Previous" }), _jsx(Button, { onClick: handleNext, className: "bg-purple-600 hover:bg-purple-700", children: "Next Step" })] })] })), step === 3 && (_jsxs("div", { className: "bg-white dark:bg-slate-700 dark:bg-slate-800 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Calendar, { className: "w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Schedule & Logistics" }), _jsx("p", { className: "text-gray-600 dark:text-white", children: "Set up your program schedule" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-4", children: "Preferred Days *" }), _jsx("div", { className: "grid grid-cols-5 gap-3", children: weekDays.map((day) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredDays', day), className: `p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                        : 'border-gray-200 text-gray-700 dark:text-white hover:border-gray-300 dark:border-slate-600'}`, children: day.slice(0, 3) }, day))) }), errors.preferredDays && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredDays })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-4", children: "Preferred Times *" }), _jsx("div", { className: "grid grid-cols-3 md:grid-cols-4 gap-3", children: timeSlots.map((time) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredTimes', time), className: `p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                        : 'border-gray-200 text-gray-700 dark:text-white hover:border-gray-300 dark:border-slate-600'}`, children: time }, time))) }), errors.preferredTimes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredTimes })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Timezone *" }), _jsxs("select", { name: "timezone", value: formData.timezone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.timezone ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select timezone" }), COMMON_TIMEZONES.map((tz) => (_jsxs("option", { value: tz.value, children: [tz.label, " ", tz.offset ? `(${tz.offset})` : ''] }, tz.value)))] }), errors.timezone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.timezone })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Preferred Start Date *" }), _jsx("input", { type: "date", name: "startDate", value: formData.startDate, onChange: handleInputChange, min: new Date().toISOString().split('T')[0], className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.startDate ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}` }), errors.startDate && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.startDate })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Session Location *" }), _jsxs("select", { name: "location", value: formData.location, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.location ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select location preference" }), _jsx("option", { value: "on-site", children: "On-site at our office" }), _jsx("option", { value: "virtual", children: "Virtual/Online sessions" }), _jsx("option", { value: "hybrid", children: "Hybrid (mix of on-site and virtual)" }), _jsx("option", { value: "external", children: "External venue (we'll arrange)" })] }), errors.location && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.location })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Budget Range (Monthly)" }), _jsxs("select", { name: "budget", value: formData.budget, onChange: handleInputChange, className: "w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400", children: [_jsx("option", { value: "", children: "Select budget range" }), _jsx("option", { value: "under-500", children: "Under \u20B9500" }), _jsx("option", { value: "500-1000", children: "\u20B9500 - \u20B91,000" }), _jsx("option", { value: "1000-2500", children: "\u20B91,000 - \u20B92,500" }), _jsx("option", { value: "2500-5000", children: "\u20B92,500 - \u20B95,000" }), _jsx("option", { value: "5000-10000", children: "\u20B95,000 - \u20B910,000" }), _jsx("option", { value: "over-10000", children: "Over \u20B910,000" }), _jsx("option", { value: "flexible", children: "Flexible/To be discussed" })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Special Requirements or Requests" }), _jsx("textarea", { name: "specialRequests", value: formData.specialRequests, onChange: handleInputChange, rows: 4, className: "w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400", placeholder: "Any specific requirements, equipment needs, accessibility considerations, or special requests..." })] }), selectedPackage && formData.participantCount && formData.frequency && (_jsxs("div", { className: "bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Estimated Investment" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Program:" }), _jsx("span", { children: selectedPackage.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Course Type:" }), _jsx("span", { className: "capitalize", children: selectedPackage.course_type })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Sessions:" }), _jsx("span", { children: selectedPackage.class_count })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Participants:" }), _jsx("span", { children: formData.participantCount })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Frequency:" }), _jsx("span", { children: frequencies.find(f => f.id === formData.frequency)?.name })] }), selectedPackage.course_type === 'crash' && selectedPackage.duration ? (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Duration:" }), _jsx("span", { children: selectedPackage.duration })] })) : (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Validity:" }), _jsxs("span", { children: [selectedPackage.validity_days, " Days"] })] })), _jsxs("div", { className: "border-t pt-2 mt-2", children: [_jsxs("div", { className: "flex justify-between font-semibold text-lg", children: [_jsx("span", { children: "Estimated Monthly Cost:" }), _jsxs("span", { className: "text-purple-600 dark:text-purple-400", children: ["\u20B9", calculateEstimatedPrice()] })] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-300 mt-1", children: "*Final pricing will be customized based on your specific requirements" })] })] })] })), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(2), children: "Previous" }), _jsx(Button, { type: "submit", loading: loading, disabled: loading, className: "bg-purple-600 hover:bg-purple-700", children: "Submit Request" })] })] })), step === 4 && !loading && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-4", children: "Request Submitted Successfully!" }), _jsx("p", { className: "text-gray-600 dark:text-white mb-4", children: "Thank you for your interest in our Corporate Wellness Program! Our team will review your requirements and get back to you within 1 business day with a customized proposal." }), _jsxs("div", { className: "bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-8", children: [_jsx("h3", { className: "font-semibold text-green-800 dark:text-green-200 mb-2", children: "Your Request ID" }), _jsx("p", { className: "text-2xl font-bold text-green-900 dark:text-green-100 mb-1", children: bookingId }), _jsx("p", { className: "text-sm text-green-700 dark:text-green-300", children: "Please save this ID for your records" })] }), _jsxs("div", { className: "bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "What Happens Next?" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-700 dark:text-white text-left", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" }), _jsx("span", { children: "Our corporate wellness specialist will review your requirements" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" }), _jsx("span", { children: "You'll receive a detailed proposal within 1 business day" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" }), _jsx("span", { children: "We'll schedule a consultation call to discuss your program" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" }), _jsx("span", { children: "Once approved, we'll coordinate the program schedule" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Button, { onClick: () => window.location.href = '/', className: "bg-purple-600 hover:bg-purple-700 mr-4", children: "Return to Home" }), _jsx(Button, { variant: "outline", onClick: () => window.location.href = '/contact', children: "Contact Us Directly" })] })] })), loading && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-gray-600 dark:text-white mt-4", children: "Submitting your corporate wellness request..." })] }))] })] })] }));
}
