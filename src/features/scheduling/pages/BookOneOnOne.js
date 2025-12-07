import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Calendar, ChevronDown, ChevronUp, Clock, Mail, Phone, Search, Star, User, Users, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmailService from '../../../services/emailService';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
// Avoid using useSettings hook here to prevent invalid hook call when
// this component is executed in non-render contexts during async flows.
import { supabase } from '../../../shared/lib/supabase';
import { COMMON_TIMEZONES, getUserTimezone } from '../../../shared/utils/timezoneUtils';
import { useAuth } from '../../auth/contexts/AuthContext';
import { generateCancelToken } from '../lib/generateCancelToken';
// Remove erroneous top-level token generation using undefined variables
export function BookOneOnOne() {
    const { user } = useAuth();
    // Local settings copy used only for email preparation (support contact, etc.)
    const [localSettings, setLocalSettings] = useState({});
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data, error } = await supabase.from('business_settings').select('key, value');
                if (error)
                    throw error;
                if (!mounted)
                    return;
                const mapped = {};
                data?.forEach((r) => (mapped[r.key] = r.value));
                setLocalSettings(mapped);
            }
            catch (e) {
                // fail silently; email will fallback to default support address
                console.warn('Failed to load local settings for BookOneOnOne:', e);
            }
        })();
        return () => { mounted = false; };
    }, []);
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
        // Personal Info
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        timezone: getUserTimezone(),
        // Session Details
        packageType: '',
        experienceLevel: '',
        goals: '',
        healthConditions: '',
        preferredDays: [],
        preferredTimes: [],
        // Schedule
        startDate: '',
        // Special Requirements
        specialRequests: '',
        emergencyContact: '',
        emergencyPhone: ''
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
                .eq('is_archived', false)
                .eq('type', 'Individual')
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
    const calculatePricePerClass = (pkg) => {
        if (pkg.course_type === 'crash') {
            return null; // Don't show per-class price for crash courses
        }
        return Math.round(pkg.price / pkg.class_count);
    };
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
    const timeSlots = [
        '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
        '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
        '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
    ];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
                if (!formData.firstName.trim())
                    newErrors.firstName = 'First name is required';
                if (!formData.lastName.trim())
                    newErrors.lastName = 'Last name is required';
                if (!formData.email.trim())
                    newErrors.email = 'Email is required';
                if (!formData.phone.trim())
                    newErrors.phone = 'Phone number is required';
                if (!formData.timezone.trim())
                    newErrors.timezone = 'Timezone is required';
                break;
            case 2:
                if (!formData.packageType)
                    newErrors.packageType = 'Please select a package';
                if (!formData.experienceLevel)
                    newErrors.experienceLevel = 'Please select your experience level';
                if (!formData.goals.trim())
                    newErrors.goals = 'Please share your goals';
                break;
            case 3:
                console.log('Selected package:', selectedPackage);
                console.log('Package course_type:', selectedPackage?.course_type);
                if (formData.preferredDays.length === 0)
                    newErrors.preferredDays = 'Please select at least one preferred day';
                if (formData.preferredTimes.length === 0)
                    newErrors.preferredTimes = 'Please select at least one preferred time';
                if (!formData.startDate)
                    newErrors.startDate = 'Please select a start date';
                console.log('Step 3 validation - Form data:', formData);
                console.log('Step 3 validation - Errors found:', newErrors);
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
    // Save form data to localStorage before redirecting to login
    const saveFormDataAndRedirect = () => {
        const formDataToSave = {
            ...formData,
            selectedPackage,
            selectedStep: step,
            courseTypeFilter,
            expandedCards: Array.from(expandedCards)
        };
        localStorage.setItem('pendingBookingData', JSON.stringify(formDataToSave));
        window.location.href = '/login?redirect=/book/individual';
    };
    // Restore form data after login
    useEffect(() => {
        if (user) {
            const savedData = localStorage.getItem('pendingBookingData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    setFormData({
                        firstName: parsedData.firstName || '',
                        lastName: parsedData.lastName || '',
                        email: parsedData.email || user.email || '',
                        phone: parsedData.phone || '',
                        timezone: parsedData.timezone || '',
                        packageType: parsedData.packageType || '',
                        experienceLevel: parsedData.experienceLevel || '',
                        goals: parsedData.goals || '',
                        healthConditions: parsedData.healthConditions || '',
                        preferredDays: parsedData.preferredDays || [],
                        preferredTimes: parsedData.preferredTimes || [],
                        startDate: parsedData.startDate || '',
                        specialRequests: parsedData.specialRequests || '',
                        emergencyContact: parsedData.emergencyContact || '',
                        emergencyPhone: parsedData.emergencyPhone || ''
                    });
                    setSelectedPackage(parsedData.selectedPackage || null);
                    setStep(parsedData.selectedStep || 1);
                    setCourseTypeFilter(parsedData.courseTypeFilter || 'all');
                    setExpandedCards(new Set(parsedData.expandedCards || []));
                    // Clear saved data
                    localStorage.removeItem('pendingBookingData');
                }
                catch (error) {
                    console.error('Error restoring form data:', error);
                }
            }
        }
    }, [user]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Prevent duplicate concurrent submissions
        if (submittingRef.current) {
            console.warn('Submission already in progress — ignoring duplicate submit');
            return;
        }
        submittingRef.current = true;
        // Check if user is authenticated
        if (!user) {
            // Save form data and redirect to login
            saveFormDataAndRedirect();
            submittingRef.current = false;
            return;
        }
        console.log('handleSubmit called!');
        console.log('Form submission prevented, validating step 3...');
        if (!validateStep(3)) {
            console.log('Validation failed!');
            submittingRef.current = false;
            return;
        }
        console.log('Validation passed, proceeding with submission...');
        try {
            setLoading(true);
            console.log('Loading set to true');
            console.log('Selected package:', selectedPackage);
            console.log('Form data:', formData);
            const bookingData = {
                // Required fields from your schema
                user_id: user.id, // Now we know user exists
                class_name: `1-on-1 ${selectedPackage?.name}`,
                instructor: 'Yogodaan Instructor',
                class_date: formData.startDate,
                class_time: formData.preferredTimes[0],
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                experience_level: formData.experienceLevel,
                status: 'pending',
                booking_type: 'individual',
                // Emergency contact fields - now nullable
                emergency_contact: formData.emergencyContact || null,
                emergency_phone: formData.emergencyPhone || null,
                // Optional fields that match your schema
                special_requests: formData.specialRequests || null,
                package_type: formData.packageType,
                goals: formData.goals || null,
                preferred_days: formData.preferredDays,
                preferred_times: formData.preferredTimes,
                timezone: formData.timezone || null,
                price: selectedPackage?.price || 0,
                session_duration: 60, // Default duration
                participants_count: 1,
                equipment_needed: false,
                class_package_id: selectedPackage?.id || null,
                // Store health conditions in booking_notes
                booking_notes: formData.healthConditions ? `Health Conditions: ${formData.healthConditions}` : null
            };
            console.log('Submitting booking data:', bookingData);
            console.log('Auth user:', user);
            console.log('User ID being sent:', user.id);
            console.log('Booking data user_id:', bookingData.user_id);
            // Defensive pre-check: avoid creating duplicate bookings when user selected multiple days/times
            try {
                const { data: existing, error: existingErr } = await supabase
                    .from('bookings')
                    .select('id,booking_id,status')
                    .eq('user_id', user.id)
                    .eq('class_date', formData.startDate)
                    .eq('class_time', formData.preferredTimes[0])
                    .eq('class_package_id', selectedPackage?.id || null)
                    .limit(1)
                    .maybeSingle();
                if (existingErr)
                    console.warn('Error checking for existing booking', existingErr);
                if (existing && (existing.status === 'pending' || existing.status === 'confirmed')) {
                    console.info('Found existing booking - skipping insert', existing);
                    setBookingId(existing.booking_id || existing.id || 'N/A');
                    setStep(4);
                    submittingRef.current = false;
                    setLoading(false);
                    return;
                }
            }
            catch (checkErr) {
                console.warn('Failed to run pre-insert booking check', checkErr);
            }
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select('booking_id');
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            console.log('Successfully inserted:', data);
            const bookingIdValue = data?.[0]?.booking_id || 'N/A';
            setBookingId(bookingIdValue);
            setStep(4); // Success step
            // Send confirmation email to the user with booking ID and package details
            try {
                const userName = `${formData.firstName} ${formData.lastName}`.trim() || formData.email;
                const baseUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
                // Link to user's profile > My Bookings section
                const actionUrl = `${baseUrl}/profile#my-bookings`;
                const year = new Date().getFullYear();
                const classPackageDetails = selectedPackage ? `${selectedPackage.name} — ₹${selectedPackage.price}` : 'N/A';
                const classTime = formData.preferredTimes && formData.preferredTimes.length > 0 ? formData.preferredTimes[0] : '';
                const bookingNotes = formData.healthConditions || formData.specialRequests || '';
                const timezone = formData.timezone || '';
                const supportContact = localSettings.business_contact?.email || 'support@yogique.example.com';
                const policyUrl = `${baseUrl}/terms`;
                // Request server-side generation of a one-time cancellation token
                try {
                    const tokenResp = await generateCancelToken(bookingIdValue);
                    const cancelToken = tokenResp?.token || '';
                    const builtCancelUrl = `${baseUrl}/bookings/${encodeURIComponent(bookingIdValue)}/cancel?token=${cancelToken}`;
                    globalThis.__lastCancelUrl = builtCancelUrl;
                }
                catch (e) {
                    console.warn('Failed to generate server-side cancel token, falling back to profile link', e);
                    globalThis.__lastCancelUrl = `${baseUrl}/profile#my-bookings`;
                }
                // Your provided HTML template (simple placeholder replacement)
                const emailHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Booking Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #0f1012; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #181818; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
            .header { background: linear-gradient(135deg, #222222, #000000); color: white; text-align: center; padding: 30px 20px; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 25px 30px; color: #f5f5f5; }
            .content p { line-height: 1.6; font-size: 16px; }
            .booking-box { background: #242018; border-left: 5px solid #d9a441; padding: 15px 20px; margin: 20px 0; border-radius: 8px; }
            .booking-box strong { font-size: 18px; color: #ffd470; }
            .button { display: inline-block; margin-top: 25px; padding: 14px 24px; background: #d9a441; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 14px; color: #aaaaaa; }
            @media only screen and (max-width: 480px) { .container { margin: 20px 12px; border-radius: 10px; } .header { padding: 20px 14px; } .header h1 { font-size: 22px; } .content { padding: 18px 16px; } .content p, .booking-box p, ul { font-size: 14px; } .button { display: block; width: 100%; text-align: center; padding: 14px 0; box-sizing: border-box; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://yourdomain.com/path-to-logo.png" alt="Yogique Logo" style="width:80px; margin-bottom:10px;" />
                <h1>Yogique – Booking Confirmed</h1>
            </div>
            <div class="content">
                <p>Hi {{user_name}},</p>
                <p>Thank you for booking with us! We’re excited to have you. Below are your booking details for quick reference.</p>
                                <div class="booking-box">
                    <p><strong>Booking ID:</strong> {{booking_id}}</p>
                    <p><strong>Preferred Start Date:</strong> {{preferred_start_date}}</p>
                    <p><strong>Preferred Time:</strong> {{class_time}}</p>
                    <p><strong>Class/Package Details:</strong> {{class_package_details}}</p>
                    <p><strong>Timezone:</strong> {{timezone}}</p>
                    <p><strong>Notes / Requests:</strong> {{booking_notes}}</p>
                </div>
                <ul style="margin: 20px 0; padding-left: 20px; font-size:16px; line-height:1.6;">
                    <li>You'll receive a confirmation email within 24 hours</li>
                    <li>We'll send you the video call link before your session</li>
                    <li>Our team may call to discuss your specific needs</li>
                </ul>
                <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:{{support_contact}}" style="color:#ffd470;">{{support_contact}}</a>.</p>
                <a href="{{action_url}}" class="button">View Your Booking</a>
                <p style="margin-top:8px; font-size:13px; color:#dddddd;">If you've changed your mind, you can <a href="{{cancel_url}}" style="color:#ffd470;">cancel your booking</a>. Please include a short note when cancelling so our team can follow up.</p>
                <p style="margin-top:6px; font-size:12px; color:#bbbbbb;">Policy: <a href="{{policy_url}}" style="color:#ffd470;">Terms &amp; Cancellation Policy</a></p>
            </div>
            <div class="footer">© {{year}} Sampurnayogam LLP. All rights reserved.<br /><span style="font-size:12px; color:#999; line-height:1.4;">Yogique is a brand operating under the umbrella of Sampurnayogam LLP (a registered company). All services, including online B2C classes and programs, are offered by Sampurnayogam LLP.</span></div>
        </div>
    </body>
</html>`;
                const emailHtml = emailHtmlTemplate
                    .replace(/{{user_name}}/g, userName)
                    .replace(/{{booking_id}}/g, bookingIdValue)
                    .replace(/{{preferred_start_date}}/g, formData.startDate || '')
                    .replace(/{{class_package_details}}/g, classPackageDetails)
                    .replace(/{{class_time}}/g, classTime)
                    .replace(/{{support_contact}}/g, supportContact)
                    .replace(/{{booking_notes}}/g, bookingNotes)
                    .replace(/{{timezone}}/g, timezone)
                    .replace(/{{policy_url}}/g, policyUrl)
                    .replace(/{{cancel_url}}/g, globalThis.__lastCancelUrl || actionUrl)
                    .replace(/{{action_url}}/g, actionUrl)
                    .replace(/{{year}}/g, String(year));
                const subject = `Your Yogique Booking (${bookingIdValue})`;
                // Fire-and-forget: don't block the UI if email fails
                EmailService.sendTransactionalEmail(formData.email, subject, emailHtml)
                    .then(res => {
                    if (!res.ok)
                        console.warn('Failed to send booking confirmation email:', res.error);
                })
                    .catch(err => console.error('Error sending booking confirmation email:', err));
            }
            catch (emailErr) {
                console.error('Error while preparing/sending confirmation email:', emailErr);
            }
        }
        catch (error) {
            console.error('Full error:', error);
            setErrors({ general: error.message || 'An error occurred while booking your session.' });
        }
        finally {
            setLoading(false);
            submittingRef.current = false;
            console.log('Loading set to false');
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: [_jsx("div", { className: "bg-white dark:bg-slate-700 dark:bg-slate-800 shadow-sm", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Book Your Personal Yoga Session" }), _jsx("p", { className: "text-gray-600 dark:text-white mt-2", children: "Personalized guidance tailored to your needs" }), !user && (_jsx("div", { className: "mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4", children: _jsxs("p", { className: "text-blue-800 dark:text-blue-200 text-sm", children: [_jsx("span", { className: "font-medium", children: "Note:" }), " You'll need to log in to complete your booking.", _jsx("button", { onClick: () => window.location.href = '/login', className: "ml-2 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:text-blue-200", children: "Log in now" })] }) }))] }), _jsxs("div", { className: "mt-8", children: [_jsx("div", { className: "flex items-center justify-center space-x-4", children: [1, 2, 3, 4].map((stepNumber) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-white'}`, children: step > stepNumber ? '✓' : stepNumber }), stepNumber < 4 && (_jsx("div", { className: `w-16 h-1 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}` }))] }, stepNumber))) }), _jsxs("div", { className: "flex justify-center space-x-20 mt-2", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Personal Info" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Package" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Schedule" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-300", children: "Confirmation" })] })] })] }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [errors.general && (_jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), errors.classPackages && (_jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.classPackages }) })), _jsxs("form", { onSubmit: handleSubmit, children: [step === 1 && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(User, { className: "w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Personal Information" }), _jsx("p", { className: "text-gray-600 dark:text-white", children: "Tell us about yourself" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "First Name *" }), _jsx("input", { type: "text", name: "firstName", value: formData.firstName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.firstName ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your first name" }), errors.firstName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.firstName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Last Name *" }), _jsx("input", { type: "text", name: "lastName", value: formData.lastName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.lastName ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your last name" }), errors.lastName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.lastName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Email *" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your email" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Phone Number *" }), _jsx("input", { type: "tel", name: "phone", value: formData.phone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.phone ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your phone number" }), errors.phone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Timezone *" }), _jsxs("select", { name: "timezone", value: formData.timezone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.timezone ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select your timezone" }), COMMON_TIMEZONES.map((tz) => (_jsxs("option", { value: tz.value, children: [tz.label, " ", tz.offset ? `(${tz.offset})` : ''] }, tz.value)))] }), errors.timezone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.timezone })] })] }), _jsx("div", { className: "flex justify-end mt-8", children: _jsx(Button, { onClick: handleNext, className: "px-8 py-3", children: "Next Step" }) })] })), step === 2 && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Star, { className: "w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Choose Your Package" }), _jsx("p", { className: "text-gray-600 dark:text-white", children: "Select the perfect package for your yoga journey" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-4", children: "Available Packages *" }), loadingPackages ? (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400" }), _jsx("span", { className: "ml-2 text-gray-600 dark:text-white", children: "Loading packages..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search packages...", value: packageSearch, onChange: (e) => setPackageSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" })] }), _jsxs("div", { className: "flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1", children: [_jsx("button", { type: "button", onClick: () => setCourseTypeFilter('all'), className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'all'
                                                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                                            : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'}`, children: "All" }), _jsx("button", { type: "button", onClick: () => setCourseTypeFilter('regular'), className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'regular'
                                                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                                            : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'}`, children: "Regular" }), _jsx("button", { type: "button", onClick: () => setCourseTypeFilter('crash'), className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'crash'
                                                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                                            : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'}`, children: "Crash" })] })] }), _jsx("div", { className: "grid gap-4 max-h-96 overflow-y-auto", children: filteredPackages.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-300", children: packageSearch ? 'No packages found matching your search.' : 'No packages available.' })) : (_jsx("div", { className: "grid grid-cols-1 gap-4", children: filteredPackages.map((pkg) => {
                                                                const isExpanded = expandedCards.has(pkg.id);
                                                                const isSelected = selectedPackage?.id === pkg.id;
                                                                return (_jsx("div", { className: `border-2 rounded-lg transition-all duration-200 hover:shadow-md ${isSelected
                                                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                                        : 'border-gray-200 hover:border-blue-300'}`, children: _jsxs("div", { onClick: () => handlePackageSelect(pkg), className: "p-6 cursor-pointer", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white text-lg", children: pkg.name }), _jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "text-blue-600 dark:text-blue-400 font-bold text-xl", children: ["\u20B9", pkg.price] }), pkg.course_type === 'regular' && calculatePricePerClass(pkg) && (_jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-300", children: ["From \u20B9", calculatePricePerClass(pkg), "/class"] }))] })] }), pkg.description && (_jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-gray-600 dark:text-white text-sm", children: isExpanded ? pkg.description : truncateDescription(pkg.description) }), pkg.description.length > 100 && (_jsx("button", { type: "button", onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleCardExpansion(pkg.id);
                                                                                        }, className: "text-blue-600 dark:text-blue-400 text-sm font-medium mt-1 flex items-center hover:text-blue-700 dark:text-blue-300", children: isExpanded ? (_jsxs(_Fragment, { children: ["Show Less ", _jsx(ChevronUp, { className: "w-3 h-3 ml-1" })] })) : (_jsxs(_Fragment, { children: ["Show More ", _jsx(ChevronDown, { className: "w-3 h-3 ml-1" })] })) }))] })), _jsxs("div", { className: "flex flex-wrap gap-3 items-center text-sm text-gray-600 dark:text-white", children: [_jsxs("span", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), pkg.class_count, " ", pkg.class_count === 1 ? 'Class' : 'Classes'] }), pkg.course_type === 'crash' && pkg.duration ? (_jsxs("span", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), pkg.duration] })) : (_jsxs("span", { className: "flex items-center", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), pkg.validity_days, " Days Validity"] })), _jsx("span", { className: `text-xs px-2 py-1 rounded ${pkg.course_type === 'crash'
                                                                                            ? 'bg-orange-100 text-orange-800'
                                                                                            : 'bg-green-100 text-green-800'}`, children: pkg.course_type === 'crash' ? 'Crash Course' : 'Regular Course' }), pkg.class_type_restrictions && pkg.class_type_restrictions.length > 0 && (_jsx("span", { className: "text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded", children: "Specific Classes Only" }))] }), isSelected && (_jsx("div", { className: "mt-3 flex justify-end", children: _jsx("div", { className: "w-5 h-5 bg-blue-50 dark:bg-blue-900/200 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white dark:bg-slate-700 rounded-full" }) }) }))] }) }, pkg.id));
                                                            }) })) })] })), errors.packageType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.packageType })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Experience Level *" }), _jsxs("select", { name: "experienceLevel", value: formData.experienceLevel, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.experienceLevel ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select your experience level" }), _jsx("option", { value: "beginner", children: "Beginner (0-6 months)" }), _jsx("option", { value: "intermediate", children: "Intermediate (6 months - 2 years)" }), _jsx("option", { value: "advanced", children: "Advanced (2+ years)" }), _jsx("option", { value: "expert", children: "Expert/Teacher" })] }), errors.experienceLevel && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.experienceLevel })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "What are your goals? *" }), _jsx("textarea", { name: "goals", value: formData.goals, onChange: handleInputChange, rows: 4, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.goals ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Tell us about your yoga goals, what you hope to achieve..." }), errors.goals && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.goals })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Health Conditions or Injuries" }), _jsx("textarea", { name: "healthConditions", value: formData.healthConditions, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400", placeholder: "Please mention any health conditions, injuries, or physical limitations we should be aware of..." })] }), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(1), children: "Previous" }), _jsx(Button, { onClick: handleNext, children: "Next Step" })] })] })), step === 3 && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Calendar, { className: "w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Schedule Your Sessions" }), _jsx("p", { className: "text-gray-600 dark:text-white", children: "Choose your preferred schedule" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-4", children: "Preferred Days *" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: weekDays.map((day) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredDays', day), className: `p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                        : 'border-gray-200 text-gray-700 dark:text-white hover:border-gray-300 dark:border-slate-600'}`, children: day.slice(0, 3) }, day))) }), errors.preferredDays && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredDays })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-4", children: "Preferred Times *" }), _jsx("div", { className: "grid grid-cols-3 md:grid-cols-5 gap-3 max-h-40 overflow-y-auto", children: timeSlots.map((time) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredTimes', time), className: `p-2 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                        : 'border-gray-200 text-gray-700 dark:text-white hover:border-gray-300 dark:border-slate-600'}`, children: time }, time))) }), errors.preferredTimes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredTimes })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Preferred Start Date *" }), _jsx("input", { type: "date", name: "startDate", value: formData.startDate, onChange: handleInputChange, min: new Date().toISOString().split('T')[0], className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.startDate ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'}` }), errors.startDate && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.startDate })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-2", children: "Special Requests" }), _jsx("textarea", { name: "specialRequests", value: formData.specialRequests, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400", placeholder: "Any special requests or preferences..." })] }), selectedPackage && (_jsxs("div", { className: "bg-gray-50 dark:bg-slate-800 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Package Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Package:" }), _jsx("span", { children: selectedPackage.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Course Type:" }), _jsx("span", { className: "capitalize", children: selectedPackage.course_type })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Classes:" }), _jsxs("span", { children: [selectedPackage.class_count, " ", selectedPackage.class_count === 1 ? 'Class' : 'Classes'] })] }), selectedPackage.course_type === 'crash' && selectedPackage.duration ? (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Duration:" }), _jsx("span", { children: selectedPackage.duration })] })) : (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Validity:" }), _jsxs("span", { children: [selectedPackage.validity_days, " Days"] })] })), _jsx("div", { className: "border-t pt-2 mt-2", children: _jsxs("div", { className: "flex justify-between font-semibold text-lg", children: [_jsx("span", { children: "Total:" }), _jsxs("span", { className: "text-blue-600 dark:text-blue-400", children: ["\u20B9", selectedPackage.price] })] }) })] })] })), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(2), children: "Previous" }), _jsx(Button, { type: "submit", loading: loading, disabled: loading, className: "bg-blue-600 hover:bg-blue-700", children: "Submit Booking" })] })] })), step === 4 && !loading && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-4", children: "Booking Submitted!" }), _jsx("p", { className: "text-gray-600 dark:text-white mb-4", children: "Thank you for booking with us! We'll review your request and send you a confirmation email within 24 hours with your session details and payment instructions." }), _jsxs("div", { className: "bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-8", children: [_jsx("h3", { className: "font-semibold text-green-800 dark:text-green-200 mb-2", children: "Your Booking ID" }), _jsx("p", { className: "text-2xl font-bold text-green-900 dark:text-green-100 mb-1", children: bookingId }), _jsx("p", { className: "text-sm text-green-700 dark:text-green-300", children: "Please save this ID for your records" })] }), _jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "What's Next?" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-700 dark:text-white text-left", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" }), _jsx("span", { children: "You'll receive a confirmation email within 24 hours" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Video, { className: "w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" }), _jsx("span", { children: "We'll send you the video call link before your session" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" }), _jsx("span", { children: "Our team may call to discuss your specific needs" })] })] })] }), _jsx(Button, { onClick: () => window.location.href = '/', children: "Return to Home" })] })), loading && (_jsxs("div", { className: "bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-gray-600 dark:text-white mt-4", children: "Submitting your booking..." })] }))] })] })] }));
}
