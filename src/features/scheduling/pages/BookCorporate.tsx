import { Building, Calendar, ChevronDown, ChevronUp, Clock, Mail, Phone, Search, Star, Users } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'
import { COMMON_TIMEZONES, getUserTimezone } from '../../../shared/utils/timezoneUtils'
import { useAuth } from '../../auth/contexts/AuthContext'

interface ClassPackage {
    id: string
    name: string
    description: string | null
    class_count: number
    price: number
    validity_days: number
    class_type_restrictions: string[] | null
    is_active: boolean
    type: string | null
    duration: string | null
    course_type: string | null
}

export function BookCorporate() {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const submittingRef = useRef(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [bookingId, setBookingId] = useState<string>('')
    const [classPackages, setClassPackages] = useState<ClassPackage[]>([])
    const [loadingPackages, setLoadingPackages] = useState(true)
    const [packageSearch, setPackageSearch] = useState('')
    const [selectedPackage, setSelectedPackage] = useState<ClassPackage | null>(null)
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
    const [courseTypeFilter, setCourseTypeFilter] = useState<'all' | 'regular' | 'crash'>('all')

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
        preferredDays: [] as string[],
        preferredTimes: [] as string[],
        timezone: getUserTimezone(),
        startDate: '',
        location: '',

        // Budget & Requirements
        budget: '',
        specialRequests: '',
        hasWellnessProgram: '',
        previousExperience: ''
    })

    // Fetch class packages from database
    useEffect(() => {
        fetchClassPackages()
    }, [])

    const fetchClassPackages = async () => {
        try {
            setLoadingPackages(true)
            const { data, error } = await supabase
                .from('class_packages')
                .select('*')
                .eq('is_active', true)
                .eq('type', 'Corporate')
                .order('price')

            if (error) {
                throw error
            }

            setClassPackages(data || [])
        } catch (error) {
            console.error('Error fetching class packages:', error)
            setErrors({ classPackages: 'Failed to load class packages. Please refresh the page.' })
        } finally {
            setLoadingPackages(false)
        }
    }

    // Filter class packages based on search and course type filter
    const filteredPackages = classPackages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
            (pkg.description && pkg.description.toLowerCase().includes(packageSearch.toLowerCase()))

        const matchesCourseType = courseTypeFilter === 'all' || pkg.course_type === courseTypeFilter

        return matchesSearch && matchesCourseType
    })

    const toggleCardExpansion = (packageId: string) => {
        const newExpanded = new Set(expandedCards)
        if (newExpanded.has(packageId)) {
            newExpanded.delete(packageId)
        } else {
            newExpanded.add(packageId)
        }
        setExpandedCards(newExpanded)
    }

    const truncateDescription = (description: string, maxLength: number = 100) => {
        if (description.length <= maxLength) return description
        return description.substring(0, maxLength) + '...'
    }

    // Save form data to localStorage before redirecting to login
    const saveFormDataAndRedirect = () => {
        const formDataToSave = {
            ...formData,
            selectedPackage,
            selectedStep: step,
            courseTypeFilter,
            expandedCards: Array.from(expandedCards)
        }
        localStorage.setItem('pendingCorporateBookingData', JSON.stringify(formDataToSave))
        window.location.href = '/login?redirect=/book/corporate'
    }

    // Restore form data after login
    useEffect(() => {
        if (user) {
            const savedData = localStorage.getItem('pendingCorporateBookingData')
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData)
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
                    })
                    setSelectedPackage(parsedData.selectedPackage || null)
                    setStep(parsedData.selectedStep || 1)
                    setCourseTypeFilter(parsedData.courseTypeFilter || 'all')
                    setExpandedCards(new Set(parsedData.expandedCards || []))

                    // Clear saved data
                    localStorage.removeItem('pendingCorporateBookingData')
                } catch (error) {
                    console.error('Error restoring form data:', error)
                }
            }
        }
    }, [user])

    const industries = [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
        'Retail', 'Consulting', 'Legal', 'Marketing', 'Real Estate', 'Other'
    ]

    const companySizes = [
        '1-10 employees', '11-50 employees', '51-200 employees',
        '201-500 employees', '501-1000 employees', '1000+ employees'
    ]

    const frequencies = [
        { id: 'one-time', name: 'One-time Session', multiplier: 1 },
        { id: 'weekly', name: 'Weekly Sessions', multiplier: 4 },
        { id: 'bi-weekly', name: 'Bi-weekly Sessions', multiplier: 2 },
        { id: 'monthly', name: 'Monthly Sessions', multiplier: 1 },
        { id: 'quarterly', name: 'Quarterly Sessions', multiplier: 0.25 }
    ]

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    const timeSlots = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handlePackageSelect = (classPackage: ClassPackage) => {
        setSelectedPackage(classPackage)
        setFormData(prev => ({ ...prev, packageType: classPackage.id }))
        if (errors.packageType) {
            setErrors(prev => ({ ...prev, packageType: '' }))
        }
    }

    const handleArrayToggle = (field: 'preferredDays' | 'preferredTimes', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }))
    }

    const validateStep = (stepNumber: number): boolean => {
        const newErrors: Record<string, string> = {}

        switch (stepNumber) {
            case 1:
                if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
                if (!formData.industry) newErrors.industry = 'Industry is required'
                if (!formData.companySize) newErrors.companySize = 'Company size is required'
                if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required'
                if (!formData.position.trim()) newErrors.position = 'Position is required'
                if (!formData.email.trim()) newErrors.email = 'Email is required'
                if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
                break
            case 2:
                if (!formData.packageType) newErrors.packageType = 'Please select a package'
                if (!formData.participantCount) newErrors.participantCount = 'Number of participants is required'
                if (!formData.frequency) newErrors.frequency = 'Please select frequency'
                if (!formData.objectives.trim()) newErrors.objectives = 'Please describe your objectives'
                break
            case 3:
                if (formData.preferredDays.length === 0) newErrors.preferredDays = 'Please select at least one preferred day'
                if (formData.preferredTimes.length === 0) newErrors.preferredTimes = 'Please select at least one preferred time'
                if (!formData.timezone) newErrors.timezone = 'Timezone is required'
                if (!formData.startDate) newErrors.startDate = 'Start date is required'
                if (!formData.location) newErrors.location = 'Please specify location preference'
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Prevent duplicate concurrent submissions
        if (submittingRef.current) return
        submittingRef.current = true

        // Check if user is authenticated
        if (!user) {
            // Save form data and redirect to login
            saveFormDataAndRedirect()
            return
        }

        if (!validateStep(3)) return

        try {
            setLoading(true)

            const durationStr = selectedPackage?.duration
            const session_duration_minutes = durationStr ? (parseInt(durationStr, 10) || 60) : 60

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
            }

            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select('booking_id')

            if (error) throw error

            setBookingId(data?.[0]?.booking_id || 'N/A')
            setStep(4) // Success step
        } catch (error: any) {
            setErrors({ general: error.message || 'An error occurred while submitting your request.' })
        } finally {
            setLoading(false)
            submittingRef.current = false
        }
    }

    const calculateEstimatedPrice = () => {
        const selectedFrequency = frequencies.find(f => f.id === formData.frequency)

        if (!selectedPackage || !selectedFrequency || !formData.participantCount) return 0

        const basePrice = selectedPackage.price
        const participantMultiplier = Math.max(1, parseInt(formData.participantCount) / 20)
        const monthlyPrice = basePrice * participantMultiplier * selectedFrequency.multiplier

        return Math.round(monthlyPrice)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-700 dark:bg-slate-800 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">Corporate Wellness Program</h1>
                        <p className="text-gray-600 dark:text-white dark:text-slate-300 mt-2">Transform your workplace with customized yoga and wellness solutions</p>

                        {/* Login prompt for unauthenticated users */}
                        {!user && (
                            <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                                <p className="text-purple-800 dark:text-purple-200 text-sm">
                                    <span className="font-medium">Note:</span> You'll need to log in to complete your booking.
                                    <button
                                        onClick={() => window.location.href = '/login'}
                                        className="ml-2 text-purple-600 dark:text-purple-400 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-200"
                                    >
                                        Log in now
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8">
                        <div className="flex items-center justify-center space-x-4">
                            {[1, 2, 3, 4].map((stepNumber) => (
                                <div key={stepNumber} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-white'
                                        }`}>
                                        {step > stepNumber ? '✓' : stepNumber}
                                    </div>
                                    {stepNumber < 4 && (
                                        <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center space-x-20 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-300">Company Info</span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">Program Details</span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">Schedule</span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">Confirmation</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                )}

                {errors.classPackages && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{errors.classPackages}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Company Information */}
                    {step === 1 && (
                        <div className="bg-white dark:bg-slate-700 dark:bg-slate-800 rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Building className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Information</h2>
                                <p className="text-gray-600 dark:text-white">Tell us about your organization</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${errors.companyName ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="Enter your company name"
                                    />
                                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Industry *
                                    </label>
                                    <select
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${errors.industry ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                    >
                                        <option value="">Select industry</option>
                                        {industries.map(industry => (
                                            <option key={industry} value={industry}>{industry}</option>
                                        ))}
                                    </select>
                                    {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Company Size *
                                    </label>
                                    <select
                                        name="companySize"
                                        value={formData.companySize}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.companySize ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                    >
                                        <option value="">Select company size</option>
                                        {companySizes.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                    {errors.companySize && <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Contact Person *
                                    </label>
                                    <input
                                        type="text"
                                        name="contactName"
                                        value={formData.contactName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.contactName ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="Full name"
                                    />
                                    {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Position/Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.position ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="Your position/title"
                                    />
                                    {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="Email address"
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.phone ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="Phone number"
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end mt-8">
                                <Button onClick={handleNext} className="px-8 py-3 bg-purple-600 hover:bg-purple-700">
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Program Details */}
                    {step === 2 && (
                        <div className="bg-white dark:bg-slate-700 dark:bg-slate-800 rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Star className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Program Details</h2>
                                <p className="text-gray-600 dark:text-white">Choose the perfect program for your team</p>
                            </div>

                            {/* Package Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-4">
                                    Available Corporate Programs *
                                </label>

                                {loadingPackages ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 dark:border-purple-400"></div>
                                        <span className="ml-2 text-gray-600 dark:text-white">Loading programs...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Search Bar and Filter Toggle */}
                                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                            {/* Search Bar */}
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search programs..."
                                                    value={packageSearch}
                                                    onChange={(e) => setPackageSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>

                                            {/* Course Type Filter Toggle */}
                                            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setCourseTypeFilter('all')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'all'
                                                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'
                                                        }`}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCourseTypeFilter('regular')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'regular'
                                                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'
                                                        }`}
                                                >
                                                    Regular
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCourseTypeFilter('crash')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'crash'
                                                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                                        : 'text-gray-600 dark:text-white hover:text-gray-900 dark:text-white'
                                                        }`}
                                                >
                                                    Crash
                                                </button>
                                            </div>
                                        </div>

                                        {/* Package Cards */}
                                        <div className="grid gap-4 max-h-96 overflow-y-auto">
                                            {filteredPackages.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                                                    {packageSearch ? 'No programs found matching your search.' : 'No programs available.'}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {filteredPackages.map((pkg) => {
                                                        const isExpanded = expandedCards.has(pkg.id)
                                                        const isSelected = selectedPackage?.id === pkg.id

                                                        return (
                                                            <div
                                                                key={pkg.id}
                                                                className={`border-2 rounded-lg transition-all duration-200 hover:shadow-md ${isSelected
                                                                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                                                                    : 'border-gray-200 hover:border-purple-300'
                                                                    }`}
                                                            >
                                                                <div
                                                                    onClick={() => handlePackageSelect(pkg)}
                                                                    className="p-6 cursor-pointer"
                                                                >
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{pkg.name}</h3>
                                                                        <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">₹{pkg.price}</span>
                                                                    </div>

                                                                    {pkg.description && (
                                                                        <div className="mb-3">
                                                                            <p className="text-gray-600 dark:text-white text-sm">
                                                                                {isExpanded ? pkg.description : truncateDescription(pkg.description)}
                                                                            </p>
                                                                            {pkg.description.length > 100 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        toggleCardExpansion(pkg.id)
                                                                                    }}
                                                                                    className="text-purple-600 dark:text-purple-400 text-sm font-medium mt-1 flex items-center hover:text-purple-700 dark:text-purple-300"
                                                                                >
                                                                                    {isExpanded ? (
                                                                                        <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                                                                                    ) : (
                                                                                        <>Show More <ChevronDown className="w-3 h-3 ml-1" /></>
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600 dark:text-white">
                                                                        <span className="flex items-center">
                                                                            <Users className="w-4 h-4 mr-1" />
                                                                            {pkg.class_count} {pkg.class_count === 1 ? 'Session' : 'Sessions'}
                                                                        </span>

                                                                        {pkg.course_type === 'crash' && pkg.duration ? (
                                                                            <span className="flex items-center">
                                                                                <Clock className="w-4 h-4 mr-1" />
                                                                                {pkg.duration}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center">
                                                                                <Clock className="w-4 h-4 mr-1" />
                                                                                {pkg.validity_days} Days Validity
                                                                            </span>
                                                                        )}

                                                                        <span className={`text-xs px-2 py-1 rounded ${pkg.course_type === 'crash'
                                                                            ? 'bg-orange-100 text-orange-800'
                                                                            : 'bg-green-100 text-green-800'
                                                                            }`}>
                                                                            {pkg.course_type === 'crash' ? 'Crash Course' : 'Regular Course'}
                                                                        </span>

                                                                        {pkg.class_type_restrictions && pkg.class_type_restrictions.length > 0 && (
                                                                            <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                                                Specific Classes Only
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="mt-3 flex justify-end">
                                                                            <div className="w-5 h-5 bg-purple-50 dark:bg-purple-900/200 rounded-full flex items-center justify-center">
                                                                                <div className="w-2 h-2 bg-white dark:bg-slate-700 rounded-full"></div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {errors.packageType && <p className="text-red-500 text-sm mt-1">{errors.packageType}</p>}
                            </div>

                            {/* Participant Count and Frequency */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Expected Number of Participants *
                                    </label>
                                    <input
                                        type="number"
                                        name="participantCount"
                                        value={formData.participantCount}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="500"
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.participantCount ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="Number of participants"
                                    />
                                    {errors.participantCount && <p className="text-red-500 text-sm mt-1">{errors.participantCount}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Session Frequency *
                                    </label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.frequency ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                    >
                                        <option value="">Select frequency</option>
                                        {frequencies.map(freq => (
                                            <option key={freq.id} value={freq.id}>{freq.name}</option>
                                        ))}
                                    </select>
                                    {errors.frequency && <p className="text-red-500 text-sm mt-1">{errors.frequency}</p>}
                                </div>
                            </div>

                            {/* Objectives */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Program Objectives *
                                </label>
                                <textarea
                                    name="objectives"
                                    value={formData.objectives}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.objectives ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                        }`}
                                    placeholder="What do you hope to achieve with this program? (e.g., reduce stress, improve team bonding, enhance productivity...)"
                                />
                                {errors.objectives && <p className="text-red-500 text-sm mt-1">{errors.objectives}</p>}
                            </div>

                            {/* Current Wellness Program */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Does your company currently have a wellness program?
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="hasWellnessProgram"
                                            value="yes"
                                            checked={formData.hasWellnessProgram === 'yes'}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="hasWellnessProgram"
                                            value="no"
                                            checked={formData.hasWellnessProgram === 'no'}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            {/* Previous Experience */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Previous Yoga/Wellness Experience
                                </label>
                                <textarea
                                    name="previousExperience"
                                    value={formData.previousExperience}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    placeholder="Tell us about any previous yoga or wellness programs your team has participated in..."
                                />
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Previous
                                </Button>
                                <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule & Logistics */}
                    {step === 3 && (
                        <div className="bg-white dark:bg-slate-700 dark:bg-slate-800 rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Calendar className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule & Logistics</h2>
                                <p className="text-gray-600 dark:text-white">Set up your program schedule</p>
                            </div>

                            {/* Preferred Days */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-4">
                                    Preferred Days *
                                </label>
                                <div className="grid grid-cols-5 gap-3">
                                    {weekDays.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleArrayToggle('preferredDays', day)}
                                            className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 text-gray-700 dark:text-white hover:border-gray-300 dark:border-slate-600'
                                                }`}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                                {errors.preferredDays && <p className="text-red-500 text-sm mt-1">{errors.preferredDays}</p>}
                            </div>

                            {/* Preferred Times */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-4">
                                    Preferred Times *
                                </label>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                    {timeSlots.map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => handleArrayToggle('preferredTimes', time)}
                                            className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 text-gray-700 dark:text-white hover:border-gray-300 dark:border-slate-600'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                                {errors.preferredTimes && <p className="text-red-500 text-sm mt-1">{errors.preferredTimes}</p>}
                            </div>

                            {/* Timezone and Start Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Timezone *
                                    </label>
                                    <select
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.timezone ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                    >
                                        <option value="">Select timezone</option>
                                        {COMMON_TIMEZONES.map((tz) => (
                                            <option key={tz.value} value={tz.value}>
                                                {tz.label} {tz.offset ? `(${tz.offset})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        Preferred Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.startDate ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                    />
                                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Session Location *
                                </label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.location ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                                        }`}
                                >
                                    <option value="">Select location preference</option>
                                    <option value="on-site">On-site at our office</option>
                                    <option value="virtual">Virtual/Online sessions</option>
                                    <option value="hybrid">Hybrid (mix of on-site and virtual)</option>
                                    <option value="external">External venue (we'll arrange)</option>
                                </select>
                                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                            </div>

                            {/* Budget Range */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Budget Range (Monthly)
                                </label>
                                <select
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                >
                                    <option value="">Select budget range</option>
                                    <option value="under-500">Under ₹500</option>
                                    <option value="500-1000">₹500 - ₹1,000</option>
                                    <option value="1000-2500">₹1,000 - ₹2,500</option>
                                    <option value="2500-5000">₹2,500 - ₹5,000</option>
                                    <option value="5000-10000">₹5,000 - ₹10,000</option>
                                    <option value="over-10000">Over ₹10,000</option>
                                    <option value="flexible">Flexible/To be discussed</option>
                                </select>
                            </div>

                            {/* Special Requests */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    Special Requirements or Requests
                                </label>
                                <textarea
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    placeholder="Any specific requirements, equipment needs, accessibility considerations, or special requests..."
                                />
                            </div>

                            {/* Price Estimate */}
                            {selectedPackage && formData.participantCount && formData.frequency && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Estimated Investment</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Program:</span>
                                            <span>{selectedPackage.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Course Type:</span>
                                            <span className="capitalize">{selectedPackage.course_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sessions:</span>
                                            <span>{selectedPackage.class_count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Participants:</span>
                                            <span>{formData.participantCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Frequency:</span>
                                            <span>{frequencies.find(f => f.id === formData.frequency)?.name}</span>
                                        </div>
                                        {selectedPackage.course_type === 'crash' && selectedPackage.duration ? (
                                            <div className="flex justify-between">
                                                <span>Duration:</span>
                                                <span>{selectedPackage.duration}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between">
                                                <span>Validity:</span>
                                                <span>{selectedPackage.validity_days} Days</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-lg">
                                                <span>Estimated Monthly Cost:</span>
                                                <span className="text-purple-600 dark:text-purple-400">₹{calculateEstimatedPrice()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                                                *Final pricing will be customized based on your specific requirements
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Previous
                                </Button>
                                <Button type="submit" loading={loading} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                    Submit Request
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && !loading && (
                        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Request Submitted Successfully!</h2>
                            <p className="text-gray-600 dark:text-white mb-4">
                                Thank you for your interest in our Corporate Wellness Program! Our team will review your requirements and get back to you within 1 business day with a customized proposal.
                            </p>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-8">
                                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Your Request ID</h3>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">{bookingId}</p>
                                <p className="text-sm text-green-700 dark:text-green-300">Please save this ID for your records</p>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">What Happens Next?</h3>
                                <div className="space-y-3 text-sm text-gray-700 dark:text-white text-left">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                                        <span>Our corporate wellness specialist will review your requirements</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                                        <span>You'll receive a detailed proposal within 1 business day</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                                        <span>We'll schedule a consultation call to discuss your program</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                                        <span>Once approved, we'll coordinate the program schedule</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    className="bg-purple-600 hover:bg-purple-700 mr-4"
                                >
                                    Return to Home
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/contact'}
                                >
                                    Contact Us Directly
                                </Button>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 text-center">
                            <LoadingSpinner size="lg" />
                            <p className="text-gray-600 dark:text-white mt-4">Submitting your corporate wellness request...</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
