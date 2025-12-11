import { ChevronLeft, ChevronRight, Clock, Search, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { getCountryList } from '../../../shared/lib/phone'
import { supabase } from '../../../shared/lib/supabase'
import { COMMON_TIMEZONES, getUserTimezone } from '../../../shared/utils/timezoneUtils'
import { useAuth } from '../../auth/contexts/AuthContext'

interface ClassPackage {
  id: string
  name: string
  description: string | null
  class_count: number
  price: number
  validity_days?: number
  class_type_restrictions: string[] | null
  is_active?: boolean
  is_archived: boolean
  type: string | null
  duration: string | null
  course_type: string | null
}

export function BookClass() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [classPackages, setClassPackages] = useState<ClassPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [packageSearch, setPackageSearch] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<ClassPackage | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: '',
    classType: '',
    groupSize: '',
    message: '',
    timezone: getUserTimezone()
  })

  const timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
  ]

  // Cross-tab id and lightweight local logging (used for idempotency diagnostics)
  const tabIdKey = 'yq_tab_id'
  let tabId = sessionStorage.getItem(tabIdKey)
  if (!tabId) {
    try {
      tabId = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')
      sessionStorage.setItem(tabIdKey, tabId)
    } catch (e) {
      tabId = `tab-${Date.now()}`
      try { sessionStorage.setItem(tabIdKey, tabId) } catch { }
    }
  }

  const LOG_KEY = 'yq_booking_logs'
  function recordLog(type: string, payload: any) {
    try {
      const logsRaw = localStorage.getItem(LOG_KEY)
      const logs = logsRaw ? JSON.parse(logsRaw) : []
      const entry = { time: new Date().toISOString(), tabId, type, payload }
      logs.push(entry)
      const trimmed = logs.slice(-200)
      localStorage.setItem(LOG_KEY, JSON.stringify(trimmed))
      console.debug('[booking-log]', entry)
    } catch (err) {
      console.debug('recordLog failed', err)
    }
  }

  const [countries, setCountries] = useState<string[]>([])

  const submittingRef = useRef(false)

  useEffect(() => {
    try {
      const list = getCountryList().map(c => c.name)
      setCountries(list)
    } catch (e) {
      console.warn('failed to build country list for booking form', e)
      setCountries(['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'])
    }
  }, [])

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
        .eq('is_archived', false)
        .eq('type', 'Private group')
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

  // Filter class packages based on search
  const filteredPackages = classPackages.filter(pkg =>
    pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
    (pkg.description && pkg.description.toLowerCase().includes(packageSearch.toLowerCase()))
  )

  // Removed unused getDifficultyColor function

  // Calendar functionality
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }))
    }
  }

  // Removed handleClassTypeSelect (no longer needed)

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.country) newErrors.country = 'Country is required'
    // Remove classType validation for group package booking
    if (!formData.groupSize) newErrors.groupSize = 'Group size is required'
    if (!selectedDate) newErrors.date = 'Please select a date'
    if (!selectedTime) newErrors.time = 'Please select a time'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submittingRef.current) return

    if (!validateForm()) return

    submittingRef.current = true
    setLoading(true)

    try {
      const bookingData = {
        user_id: user?.id || null,
        class_name: selectedPackage?.name || 'Private Group Class',
        instructor: 'Yogodaan Instructor',
        class_date: selectedDate,
        class_time: selectedTime,
        first_name: formData.fullName.split(' ')[0] || '',
        last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        timezone: formData.timezone,
        phone: '', // We'll add this field if needed
        experience_level: 'beginner',
        special_requests: formData.message,
        emergency_contact: '',
        emergency_phone: '',
        status: 'confirmed',
        booking_type: 'private_group',
        class_package_id: selectedPackage?.id || null
      }

      recordLog('submit-attempt', { packageId: selectedPackage?.id || null, class_date: selectedDate, class_time: selectedTime })

      // Idempotency guard across tabs: compute a simple payload hash and skip insert
      try {
        const payloadHash = JSON.stringify({ user_id: user?.id || null, class_date: selectedDate, class_time: selectedTime, class_package_id: selectedPackage?.id || null })
        const lastHash = localStorage.getItem('lastBookingPayloadHash')
        const lastCreated = localStorage.getItem('lastBookingCreated')
        if (lastHash && lastCreated && lastHash === payloadHash) {
          console.info('Detected previous booking with same payload in this browser — skipping duplicate insert')
          const parsed = JSON.parse(lastCreated)
          setBookingId(parsed.bookingId || 'N/A')
          setShowBookingForm(false)
          setShowConfirmation(true)
          submittingRef.current = false
          setLoading(false)
          return
        }
      } catch (hashErr) {
        console.warn('Failed to run idempotency check', hashErr)
      }

      // Defensive pre-check: avoid creating duplicate bookings when user selected multiple days/times
      try {
        if (user?.id) {
          const { data: existing, error: existingErr } = await supabase
            .from('bookings')
            .select('id,booking_id,status')
            .eq('user_id', user.id)
            .eq('class_date', selectedDate)
            .eq('class_time', selectedTime)
            .eq('class_package_id', selectedPackage?.id || null)
            .limit(1)
            .maybeSingle()

          if (existingErr) console.warn('Error checking for existing booking', existingErr)

          if (existing && (existing.status === 'pending' || existing.status === 'confirmed')) {
            console.info('Found existing booking - skipping insert', existing)
            recordLog('skip-insert-found-existing', existing)
            setBookingId(existing.booking_id || existing.id || 'N/A')
            setShowBookingForm(false)
            setShowConfirmation(true)
            submittingRef.current = false
            setLoading(false)
            return
          }
        }
      } catch (checkErr) {
        console.warn('Failed to run pre-insert booking check', checkErr)
      }

      const { data: bookingResult, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select('booking_id')

      if (error) {
        throw error
      }

      const bookingId = bookingResult?.[0]?.booking_id || 'N/A'

      // persist payload hash + booking id so other tabs won't re-submit
      try {
        const payloadHash = JSON.stringify({ user_id: user?.id || null, class_date: selectedDate, class_time: selectedTime, class_package_id: selectedPackage?.id || null })
        localStorage.setItem('lastBookingPayloadHash', payloadHash)
        localStorage.setItem('lastBookingCreated', JSON.stringify({ bookingId, createdAt: Date.now() }))
      } catch (lsErr) {
        console.warn('Failed to persist booking idempotency info to localStorage', lsErr)
      }

      // Broadcast booking creation to other tabs/windows
      try {
        // @ts-ignore
        const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('yq-booking-events') : null
        bc?.postMessage({ type: 'booking-created', bookingId, context: 'private_group' })
        try { bc?.close() } catch { }
      } catch (bcErr) {
        console.debug('BroadcastChannel not available or failed', bcErr)
      }

      // Reset form and show success
      setFormData({
        fullName: '',
        email: '',
        country: '',
        classType: '',
        groupSize: '',
        message: '',
        timezone: getUserTimezone()
      })
      setSelectedDate('')
      setSelectedTime('')
      setSelectedPackage(null)
      setBookingId(bookingId)
      setShowBookingForm(false)
      setShowConfirmation(true)
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred while booking your class.' })
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const canProceedToBooking = selectedDate && selectedTime

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-700 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Book Your Private Group Class</h1>
          <p className="text-xl text-gray-600 dark:text-white leading-relaxed mb-8">
            Create a memorable yoga experience for your group! Whether it's for your team, family, friends, or special occasion,
            we'll design a personalized session that brings everyone together in wellness and mindfulness.
          </p>

          {/* Group Classes Motivation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mx-auto max-w-2xl border-l-4 border-blue-500 dark:border-blue-400">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Strengthen Bonds Through Yoga</h3>
            </div>
            <p className="text-gray-600 dark:text-white leading-relaxed">
              Whether it's team building, celebrating a special occasion, or simply sharing mindfulness with loved ones,
              our private group sessions create lasting memories while nurturing wellness together.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showConfirmation ? (
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
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700 mr-4"
                >
                  Return to Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Book Another Class
                </Button>
              </div>
            </div>
          </div>
        ) : !showBookingForm ? (
          <div className="space-y-12">
            {/* Calendar */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Select Date</h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-300 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <div key={index} className="aspect-square">
                      {date && (
                        <button
                          onClick={() => isDateAvailable(date) && setSelectedDate(formatDate(date))}
                          disabled={!isDateAvailable(date)}
                          className={`w-full h-full rounded-lg text-sm font-medium transition-all duration-200 ${selectedDate === formatDate(date)
                            ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg'
                            : isDateAvailable(date)
                              ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white'
                              : 'text-gray-300 dark:text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          {date.getDate()}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Select Time</h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === time
                        ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-slate-600'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-4">
                  * All times are in your local timezone. We'll coordinate the actual session time based on your location.
                </p>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="text-center">
              <Button
                onClick={() => setShowBookingForm(true)}
                disabled={!canProceedToBooking}
                className={`px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 ${canProceedToBooking
                  ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 dark:text-gray-300 cursor-not-allowed'
                  }`}
              >
                Proceed to Booking Details
              </Button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-8">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Confirm Booking</h2>
              </div>

              {/* Booking Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white">Service:</span>
                    <span className="font-medium">{selectedPackage?.name || 'Private Group Class'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white">Date:</span>
                    <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white">Duration:</span>
                    <span className="font-medium">
                      {selectedPackage?.duration
                        ? `${selectedPackage.duration}`
                        : '60-90 minutes'
                      }
                    </span>
                  </div>
                  {selectedPackage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-white">Package:</span>
                      <span className="font-medium">{selectedPackage.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{errors.general}</p>
                  </div>
                )}

                {errors.classTypes && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{errors.classTypes}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Group Size *
                  </label>
                  <select
                    id="groupSize"
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.groupSize ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  >
                    <option value="">Select group size</option>
                    <option value="2-5">2-5 people</option>
                    <option value="6-10">6-10 people</option>
                    <option value="11-15">11-15 people</option>
                    <option value="16-20">16-20 people</option>
                    <option value="20+">20+ people</option>
                  </select>
                  {errors.groupSize && <p className="text-red-500 text-sm mt-1">{errors.groupSize}</p>}
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                      }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                      }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.country ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  >
                    <option value="">Select your country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                </div>

                {/* Enhanced Package Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
                    Preferred Group Package *
                  </label>

                  {loadingPackages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
                      <span className="ml-2 text-gray-600 dark:text-white">Loading packages...</span>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search packages..."
                          value={packageSearch}
                          onChange={(e) => setPackageSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </div>

                      {/* Package Cards */}
                      <div className="grid gap-3 max-h-80 overflow-y-auto">
                        {filteredPackages.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                            {packageSearch ? 'No packages found matching your search.' : 'No packages available.'}
                          </div>
                        ) : (
                          filteredPackages.map((pkg) => (
                            <div
                              key={pkg.id}
                              onClick={() => setSelectedPackage(pkg)}
                              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${selectedPackage?.id === pkg.id
                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:border-blue-500'
                                }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{pkg.name}</h4>
                                  {pkg.description && (
                                    <p className="text-sm text-gray-600 dark:text-white mb-2">{pkg.description}</p>
                                  )}

                                  <div className="flex flex-wrap gap-2 items-center">
                                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-300">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {pkg.duration ? pkg.duration : '60-90 min'}
                                    </span>
                                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-300">
                                      <Users className="w-3 h-3 mr-1" />
                                      {pkg.class_count} Sessions
                                    </span>
                                    <span className="text-sm font-semibold text-green-600">
                                      ₹{pkg.price}
                                    </span>
                                    {pkg.validity_days && (
                                      <span className="text-xs text-gray-500 dark:text-gray-300">
                                        {pkg.validity_days} Days Validity
                                      </span>
                                    )}
                                    {pkg.course_type && (
                                      <span className={`text-xs px-2 py-1 rounded ${pkg.course_type === 'crash'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {pkg.course_type === 'crash' ? 'Crash Course' : 'Regular Course'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {selectedPackage?.id === pkg.id && (
                                  <div className="ml-3">
                                    <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/200 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {errors.classType && <p className="text-red-500 text-sm mt-1">{errors.classType}</p>}
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Timezone *
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.timezone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  >
                    <option value="">Select your timezone</option>
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}{tz.offset ? ` (${tz.offset})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Special Requirements & Goals
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your group's experience level, specific goals, occasion details, or any special requirements..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  {loading ? 'Confirming Booking...' : 'Confirm Booking'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
