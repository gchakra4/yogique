import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'
import { AlertCircle, Award, Calendar, Camera, CheckCircle, Clock, Edit2, Facebook, FileText, Globe, Instagram, Mail, Phone, Save, User, X, XCircle, Youtube } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'

export function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [scheduledBookingIds, setScheduledBookingIds] = useState<Set<string>>(new Set())
  const [userQueries, setUserQueries] = useState<any[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

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
    specialties: [] as string[],
    certifications: [] as string[],
    languages: [] as string[],
    achievements: [] as string[],
    education: [] as string[],
    // Numbers
    experience_years: 0,
    years_of_experience: 0,
    hourly_rate: 0,
    // Text fields
    certification: '',
    teaching_philosophy: '',
    // JSONB fields
    emergency_contact: {} as any,
    social_media: {} as any,
    badges: {} as any,
    availability_schedule: {} as any,
    // Booleans
    is_active: true,
    profile_completed: false
    ,
    whatsapp_opt_in: false
  })

  // phone number helper from google-libphonenumber
  const phoneUtil = PhoneNumberUtil.getInstance()

  // runtime countries list derived from libphonenumber's supported regions
  const [countries, setCountries] = useState<Array<{ name: string; iso: string; code: string }>>([])
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; iso: string; code: string } | null>(null)
  const [phoneNumberInput, setPhoneNumberInput] = useState('')

  // Country picker open state and helper component will be declared below

  const [errors, setErrors] = useState<any>({})
  const [activeTab, setActiveTab] = useState('overview')

  // OTP toggle (Vite env): set `VITE_ENABLE_PHONE_OTP=true` to enable phone OTP verification flow
  const ENABLE_PHONE_OTP = import.meta.env.VITE_ENABLE_PHONE_OTP === 'true'
  const [initialPhone, setInitialPhone] = useState('')
  const [initialWhatsappOptIn, setInitialWhatsappOptIn] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [pendingPhone, setPendingPhone] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0)
  const resendIntervalRef = useRef<number | null>(null)
  const [phoneConflictMessage, setPhoneConflictMessage] = useState<string | null>(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'queries', label: 'My Queries', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Edit2 }
  ]

  // ✅ Move utility functions to the top, before they're used
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'responded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getExperienceColor = (years: number) => {
    if (years === 0) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    if (years <= 2) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    if (years <= 5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const renderArray = (arr: any[], emptyText: string = 'None') => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <span className="text-gray-500 dark:text-slate-400">{emptyText}</span>
    }
    return arr.join(', ')
  }

  // ✅ Helper to safely render JSONB fields
  const renderJsonField = (field: any, key: string) => {
    if (!field || typeof field !== 'object') return 'Not provided'
    return field[key] || 'Not provided'
  }

  const isClassStartInPast = (dateStr?: string, timeStr?: string) => {
    if (!dateStr || !timeStr) return false
    try {
      const isoLike = `${dateStr}T${timeStr}`
      const dt = new Date(isoLike)
      if (isNaN(dt.getTime())) {
        // Fallback: attempt parsing common formats
        const dt2 = new Date(`${dateStr} ${timeStr}`)
        if (isNaN(dt2.getTime())) return false
        return dt2.getTime() < Date.now()
      }
      return dt.getTime() < Date.now()
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfileData()
      fetchUserData()
    }
  }, [user])

  // build full countries list from libphonenumber once on mount
  useEffect(() => {
    try {
      const regions = Array.from(phoneUtil.getSupportedRegions()) as string[]
      const dn = new Intl.DisplayNames(['en'], { type: 'region' })
      const arr = regions.map(r => ({ name: String(dn.of(r) || r), iso: String(r), code: `+${phoneUtil.getCountryCodeForRegion(r)}` }))
      arr.sort((a, b) => a.name.localeCompare(b.name))
      setCountries(arr)
      if (arr.length && !selectedCountry) {
        // default to user's region if available, else first
        const defaultCountry = arr.find(c => c.iso === 'US') || arr[0]
        setSelectedCountry(defaultCountry)
      }
    } catch (e) {
      console.warn('failed to build countries list', e)
    }
  }, [])

  // when countries and profile phone are ready, parse existing phone into local input + selected country
  useEffect(() => {
    if (!countries.length) return
    if (!profileData.phone) return
    const phoneFull = (profileData.phone || '').trim()
    if (!phoneFull.startsWith('+')) {
      setPhoneNumberInput(phoneFull.replace(/\D/g, ''))
      return
    }
    const matched = countries.find(c => phoneFull.startsWith(c.code))
    if (matched) {
      setSelectedCountry(matched)
      setPhoneNumberInput(phoneFull.replace(new RegExp('^\\' + matched.code), '').replace(/\D/g, ''))
    } else {
      setPhoneNumberInput(phoneFull.replace(/\D/g, '').replace(/^\+?\d{1,4}/, ''))
    }
  }, [countries, profileData.phone])

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfileData(prev => ({
          ...prev,
          email: user!.email || ''
        }))
        return
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          email: data.email || user!.email || '',
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
        })
        setInitialPhone(data.phone || '')
        setInitialWhatsappOptIn(!!data.whatsapp_opt_in)
        setInitialPhone(data.phone || '')
      } else {
        setProfileData(prev => ({
          ...prev,
          email: user!.email || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setProfileData(prev => ({
        ...prev,
        email: user!.email || ''
      }))
    }
  }

  const fetchUserData = async () => {
    if (!user) return
    try {
      setLoading(true)

      // Bookings query remains the same
      const bookingsResult = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Updated queries to filter by user_id properly
      const queriesResult = await supabase
        .from('contact_messages')
        .select('id, name, email, phone, subject, message, status, created_at, user_id')
        .eq('user_id', user.id) // This should now work with the user_id column
        .order('created_at', { ascending: false })

      if (bookingsResult.error) {
        console.error('Error fetching bookings:', bookingsResult.error)
        setUserBookings([])
      } else {
        const bookings = bookingsResult.data || []
        setUserBookings(bookings)
        try {
          const ids = bookings.map((b: any) => String(b.booking_id || b.id)).filter(Boolean)
          if (ids.length) {
            const { data: abData, error: abErr } = await supabase
              .from('assignment_bookings')
              .select('booking_id')
              .in('booking_id', ids)
            if (!abErr && Array.isArray(abData)) {
              setScheduledBookingIds(new Set(abData.map((r: any) => String(r.booking_id))))
            } else {
              setScheduledBookingIds(new Set())
            }
          } else {
            setScheduledBookingIds(new Set())
          }
        } catch (e) {
          console.warn('Failed to fetch assignment bookings linkage', e)
          setScheduledBookingIds(new Set())
        }
      }

      if (queriesResult.error) {
        console.error('Error fetching queries:', queriesResult.error)
        setUserQueries([])
      } else {
        setUserQueries(Array.isArray(queriesResult.data) ? queriesResult.data : [])
      }

    } catch (error) {
      console.error('Error in fetchUserData:', error)
      setUserBookings([])
      setUserQueries([])
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    // Handle different input types
    let processedValue: any = value
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value)
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked
    }

    setProfileData(prev => ({ ...prev, [name]: processedValue }))
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}
    if (!profileData.full_name.trim()) newErrors.full_name = 'Full name is required'
    if (!profileData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(profileData.email)) newErrors.email = 'Email is invalid'
    // Validate phone according to selected country local pattern
    if (editing) {
      const local = phoneNumberInput.replace(/\D/g, '')
      if (local && selectedCountry) {
        try {
          const parsed = phoneUtil.parse(local, selectedCountry.iso)
          if (!phoneUtil.isValidNumberForRegion(parsed, selectedCountry.iso)) {
            newErrors.phone = `Please enter a valid phone number for ${selectedCountry.name}`
          }
        } catch (e) {
          newErrors.phone = `Please enter a valid phone number for ${selectedCountry.name}`
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      let avatarUrl = profileData.avatar_url
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }

      // ✅ Fixed: Check if profile exists first, then update or insert accordingly
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()

      const whatsappOptInTs = (profileData.whatsapp_opt_in && !initialWhatsappOptIn) ? new Date().toISOString() : null

      // Normalize phone to E.164 when possible
      let newPhoneE164 = profileData.phone
      if (editing && selectedCountry && phoneNumberInput) {
        try {
          const parsed = phoneUtil.parse(phoneNumberInput, selectedCountry.iso)
          newPhoneE164 = phoneUtil.format(parsed, PhoneNumberFormat.E164)
        } catch (e) {
          // fallback: naive concat
          newPhoneE164 = `${selectedCountry.code}${phoneNumberInput.replace(/\D/g, '')}`
        }
      }

      const profilePayload = {
        user_id: user!.id,
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
      }

      // If phone changed and OTP verification is enabled, start OTP flow instead of saving directly
      if (ENABLE_PHONE_OTP && (selectedCountry && phoneNumberInput && ((newPhoneE164 || '').replace(/\D/g, '') !== (initialPhone || '').replace(/\D/g, '')))) {
        setPendingPhone(newPhoneE164)
        setOtpModalOpen(true)
        try {
          // Send OTP and start cooldown timer (allow server to enforce ownership at verify time)
          await sendOtpRequest(user!.id, newPhoneE164)
        } catch (err) {
          console.warn('send-phone-otp function not available or failed:', err)
        }
        return
      }

      let result
      if (existingProfile) {
        // ✅ Update existing profile
        result = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('user_id', user!.id)
      } else {
        // ✅ Insert new profile
        result = await supabase
          .from('profiles')
          .insert(profilePayload)
      }

      if (result.error) throw result.error

      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }))
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      alert('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  // OTP verification helpers
  const verifyOtp = async () => {
    if (!pendingPhone) return
    setOtpLoading(true)
    try {
      // call Supabase Edge Function `verify-phone-otp`
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const resp = await supabase.functions.invoke?.('verify-phone-otp', { body: { user_id: user!.id, phone: pendingPhone, code: otpCode } })

      // Prefer structured function response when available
      const data = resp?.data ?? resp

      // Handle responses explicitly
      if (data && data.verified === true) {
        // Server verified and (server-side) updated the profile.phone; refresh profile data
        await fetchProfileData()
        setInitialPhone(pendingPhone)
        setOtpModalOpen(false)
        setOtpCode('')
        setPendingPhone(null)
        alert('Phone verified and saved successfully')
        return
      }

      // If function returned a structured reason, surface it to the user
      if (data && data.verified === false) {
        const reason = data.reason || data.error || 'verification_failed'
        if (reason === 'phone_in_use_by_other_account') {
          // Show a non-blocking banner on the page indicating the phone is registered elsewhere
          setPhoneConflictMessage('This mobile number is already registered with another account. If this is your number, please sign in with that account or contact support.')
          setOtpModalOpen(false)
          return
        }
        if (reason === 'invalid_code') {
          alert('The code you entered is incorrect. Please try again.')
          return
        }
        if (reason === 'no_valid_otp') {
          alert('No valid verification code was found or it expired. Please request a new code.')
          setOtpModalOpen(false)
          return
        }
        if (reason === 'max_attempts_exceeded') {
          alert('Maximum verification attempts exceeded. Please request a new code.')
          setOtpModalOpen(false)
          return
        }
        alert('Verification failed: ' + String(reason))
        return
      }

      // Fallback: if no structured response, optimistic success is not safe — show generic error
      alert('Unable to verify OTP at this time. Please try again later.')
    } catch (err) {
      console.error('Error verifying OTP:', err)
      alert('Unable to verify OTP right now. Please try again later.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Helper to send OTP and start 60s cooldown
  const sendOtpRequest = async (userId: string, phone: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const resp = await supabase.functions.invoke?.('send-phone-otp', { body: { user_id: userId, phone } })
      const data = resp?.data ?? resp
      // if function returned ok true, set last sent time and start cooldown
      if (data && data.ok) {
        setResendSecondsLeft(60)
        // clear any existing interval
        if (resendIntervalRef.current) {
          clearInterval(resendIntervalRef.current)
        }
        resendIntervalRef.current = setInterval(() => {
          setResendSecondsLeft(prev => {
            if (prev <= 1) {
              if (resendIntervalRef.current) {
                clearInterval(resendIntervalRef.current)
                resendIntervalRef.current = null
              }
              return 0
            }
            return prev - 1
          })
        }, 1000) as unknown as number
      }
      return data
    } catch (err) {
      console.error('sendOtpRequest error', err)
      throw err
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-slate-300 mb-6">Please sign in to view your profile.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 sm:pb-8">
        {otpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" />
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 z-50 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Verify Phone Number</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">We've sent a one-time code to <span className="font-medium">{pendingPhone}</span>. Enter the code below to verify your phone number.</p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-4"
                placeholder="Enter OTP"
              />
              <div className="mb-3 text-sm text-gray-600 dark:text-slate-300">
                {resendSecondsLeft > 0 ? (
                  <div>Didn't receive the code? You can resend in <span className="font-medium">{resendSecondsLeft}s</span>.</div>
                ) : (
                  <div>Didn't receive the code? <button
                    className="underline text-blue-600 dark:text-blue-400"
                    onClick={async () => {
                      if (!pendingPhone || !user) return
                      try {
                        setOtpLoading(true)
                        await sendOtpRequest(user.id, pendingPhone)
                        alert('A new code was sent')
                      } catch (e) {
                        console.error('Resend failed', e)
                        alert('Unable to resend code right now')
                      } finally {
                        setOtpLoading(false)
                      }
                    }}
                  >Resend code</button></div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => { setOtpModalOpen(false); setOtpCode(''); setPendingPhone(null); }}>Cancel</Button>
                <Button loading={otpLoading} onClick={verifyOtp}>Verify</Button>
              </div>
            </div>
          </div>
        )}
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 w-full sm:w-auto text-center sm:text-left">
                {/* Enhanced Avatar with Upload */}
                <div className="relative">
                  {avatarPreview || profileData.avatar_url ? (
                    <img
                      src={avatarPreview || profileData.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-20 sm:h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 sm:w-10 sm:h-10 text-gray-400 dark:text-slate-300" />
                    </div>
                  )}
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="text-white w-full sm:w-auto">
                  <h1 className="text-3xl font-bold">
                    {profileData.full_name || 'Your Profile'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <p className="flex items-center opacity-90">
                      <Mail className="w-4 h-4 mr-2" />
                      {profileData.email}
                    </p>
                    {profileData.phone && (
                      <p className="flex items-center opacity-90">
                        <Phone className="w-4 h-4 mr-2" />
                        {profileData.phone}
                      </p>
                    )}
                    {/* Quick WhatsApp opt-in visible in header while editing for convenience */}
                    {editing && (
                      <label className="flex items-center space-x-2 text-sm text-white opacity-95">
                        <input
                          type="checkbox"
                          name="whatsapp_opt_in"
                          checked={!!profileData.whatsapp_opt_in}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-white bg-white text-blue-600"
                        />
                        <span className="leading-tight">Receive WhatsApp updates (class details & reminders)</span>
                      </label>
                    )}
                  </div>
                  {profileData.years_of_experience > 0 && (
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExperienceColor(profileData.years_of_experience)}`}>
                        <Award className="w-3 h-3 mr-1 inline" />
                        {profileData.years_of_experience} {profileData.years_of_experience === 1 ? 'Year' : 'Years'} Experience
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex space-x-3">
                {editing ? (
                  <>
                    <Button
                      onClick={() => {
                        setEditing(false)
                        setAvatarFile(null)
                        setAvatarPreview(null)
                        fetchProfileData() // Reset form
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-white dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      loading={loading}
                      size="sm"
                      className="bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    size="sm"
                    className="bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-white dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {phoneConflictMessage && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex items-start">
                <div className="flex-1 text-sm text-yellow-800">
                  {phoneConflictMessage}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button onClick={() => setPhoneConflictMessage(null)} className="text-sm text-yellow-700 underline">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Information Card */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
                  {errors.general && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Full Name</label>
                      {editing ? (
                        <input
                          type="text"
                          name="full_name"
                          value={profileData.full_name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${errors.full_name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'
                            }`}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-2">{profileData.full_name || 'Not provided'}</p>
                      )}
                      {errors.full_name && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.full_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email Address</label>
                      <p className="text-gray-900 dark:text-white py-2">{profileData.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Phone Number</label>
                      {editing ? (
                        <CountryPicker
                          countries={countries}
                          selected={selectedCountry}
                          onSelect={(c) => setSelectedCountry(c)}
                          phoneValue={phoneNumberInput}
                          onPhoneChange={(v) => setPhoneNumberInput(v)}
                          error={errors.phone}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-2">{profileData.phone || 'Not provided'}</p>
                      )}
                      {errors.phone && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Date of Birth</label>
                      {editing ? (
                        <input
                          type="date"
                          name="date_of_birth"
                          value={profileData.date_of_birth}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-2">
                          {profileData.date_of_birth ? formatDate(profileData.date_of_birth) : 'Not provided'}
                        </p>
                      )}
                    </div>

                    {editing && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Gender</label>
                          <select
                            name="gender"
                            value={profileData.gender}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Years of Experience</label>
                          <input
                            type="number"
                            name="years_of_experience"
                            value={profileData.years_of_experience}
                            onChange={handleInputChange}
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="Years of yoga experience"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Location</label>
                          <input
                            type="text"
                            name="location"
                            value={profileData.location}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="Your location"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nationality</label>
                          <input
                            type="text"
                            name="nationality"
                            value={profileData.nationality}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="Your nationality"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Bio</label>
                    {editing ? (
                      <textarea
                        name="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white py-2">{profileData.bio || 'No bio provided'}</p>
                    )}
                  </div>

                  {/* ✅ Display specialties safely */}
                  {!editing && profileData.specialties.length > 0 && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Specialties</label>
                      <div className="flex flex-wrap gap-2">
                        {profileData.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-200 dark:border-slate-600 mt-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      Member since {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Sidebar */}
              <div className="space-y-6">
                {/* Stats Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Total Bookings</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{userBookings.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Queries Sent</span>
                      <span className="font-semibold text-green-600 dark:text-emerald-400">{userQueries.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Experience</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(profileData.years_of_experience)}`}>
                        {profileData.years_of_experience} {profileData.years_of_experience === 1 ? 'Year' : 'Years'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Profile Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${profileData.profile_completed ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                        {profileData.profile_completed ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {userBookings.slice(0, 3).map((booking, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status).replace('text-', 'bg-').replace('100', '500')}`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{booking.class_name}</p>
                          <p className="text-gray-500 dark:text-slate-400">{formatDate(booking.class_date)}</p>
                        </div>
                      </div>
                    ))}
                    {userBookings.length === 0 && (
                      <p className="text-gray-500 dark:text-slate-400 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Bookings</h2>
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {userBookings.length} Total
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : userBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookings yet</h3>
                  <p className="text-gray-600 dark:text-slate-300 mb-6">Start your yoga journey by booking your first class!</p>
                  <Button onClick={() => navigate('/schedule')}>Browse Classes</Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-600">
                  {userBookings.map((booking, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.class_name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-slate-300">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(booking.class_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {booking.class_time}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {booking.instructor}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Booking # {String(booking.booking_id || booking.id || '').toString()}
                            </div>
                          </div>
                          {booking.special_requests && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm text-blue-800 dark:text-blue-400">
                                <FileText className="w-4 h-4 mr-1 inline" />
                                <strong>Special Requests:</strong> {booking.special_requests}
                              </p>
                            </div>
                          )}
                          <div className="mt-4 flex items-center gap-2">
                            {(() => {
                              const s = String(booking.status || '').toLowerCase()
                              const isCanceled = s === 'cancelled' || s === 'canceled'
                              const isCompleted = s === 'completed'
                              const isScheduled = scheduledBookingIds.has(String(booking.booking_id || booking.id))
                              const startedInPast = isClassStartInPast(booking.class_date, booking.class_time)
                              return !isCanceled && !isCompleted && !isScheduled && !startedInPast
                            })() && (
                              <Button
                                variant="outline"
                                onClick={() => navigate(`/bookings/${String(booking.booking_id || booking.id)}/cancel`)}
                              >
                                Cancel Booking
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === 'queries' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Messages</h2>
                  <span className="bg-green-100 text-green-800 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                    {userQueries.length} Total
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  Messages sent from: <span className="font-mono">{user.email}</span>
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : userQueries.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages found</h3>
                  <p className="text-gray-600 dark:text-slate-300 mb-6">
                    You haven't sent any contact messages yet.
                  </p>
                  <div className="space-x-3">
                    <Button onClick={() => navigate('/contact')}>
                      Send Your First Message
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-600">
                  {userQueries.map((message, index) => (
                    <div key={message.id || index} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{message.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(message.status)}`}>
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-slate-300 mb-3 line-clamp-3">{message.message}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Sent on {formatDate(message.created_at)}
                        </div>
                        <div className="text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                          From: {message.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Account Settings</h2>
                <div className="space-y-6">

                  {/* Emergency Contact */}
                  <div className="border-b border-gray-200 dark:border-slate-600 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Emergency Contact Name</label>
                        {editing ? (
                          <input
                            type="text"
                            value={renderJsonField(profileData.emergency_contact, 'name')}
                            onChange={(e) => {
                              setProfileData(prev => ({
                                ...prev,
                                emergency_contact: { ...prev.emergency_contact, name: e.target.value }
                              }))
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="Emergency contact name"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white py-2">{renderJsonField(profileData.emergency_contact, 'name')}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Emergency Contact Phone</label>
                        {editing ? (
                          <input
                            type="tel"
                            value={renderJsonField(profileData.emergency_contact, 'phone')}
                            onChange={(e) => {
                              setProfileData(prev => ({
                                ...prev,
                                emergency_contact: { ...prev.emergency_contact, phone: e.target.value }
                              }))
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="Emergency contact phone"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white py-2">{renderJsonField(profileData.emergency_contact, 'phone')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="border-b border-gray-200 dark:border-slate-600 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Media & Online Presence</h3>
                    {editing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            <Globe className="w-4 h-4 inline mr-1" />
                            Website URL
                          </label>
                          <input
                            type="url"
                            name="website_url"
                            value={profileData.website_url}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="https://your-website.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            <Instagram className="w-4 h-4 inline mr-1" />
                            Instagram Handle
                          </label>
                          <input
                            type="text"
                            name="instagram_handle"
                            value={profileData.instagram_handle}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="@your_handle"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            <Facebook className="w-4 h-4 inline mr-1" />
                            Facebook Profile
                          </label>
                          <input
                            type="url"
                            name="facebook_profile"
                            value={profileData.facebook_profile}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="https://facebook.com/your-profile"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            <Youtube className="w-4 h-4 inline mr-1" />
                            YouTube Channel
                          </label>
                          <input
                            type="url"
                            name="youtube_channel"
                            value={profileData.youtube_channel}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="https://youtube.com/your-channel"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileData.website_url && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Website</label>
                            <a href={profileData.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {profileData.website_url}
                            </a>
                          </div>
                        )}
                        {profileData.instagram_handle && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Instagram</label>
                            <p className="text-gray-900 dark:text-white">{profileData.instagram_handle}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  <div className="border-b border-gray-200 dark:border-slate-600 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yoga Specialties</h3>
                    {editing ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Select Your Specialties</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['Hatha Yoga', 'Vinyasa', 'Ashtanga', 'Yin Yoga', 'Hot Yoga', 'Meditation', 'Prenatal Yoga', 'Restorative Yoga'].map((specialty) => (
                            <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileData.specialties.includes(specialty)}
                                onChange={(e) => {
                                  const currentSpecialties = profileData.specialties
                                  if (e.target.checked) {
                                    setProfileData(prev => ({
                                      ...prev,
                                      specialties: [...currentSpecialties, specialty]
                                    }))
                                  } else {
                                    setProfileData(prev => ({
                                      ...prev,
                                      specialties: currentSpecialties.filter(s => s !== specialty)
                                    }))
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                              />
                              <span className="text-sm text-gray-700 dark:text-slate-300">{specialty}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-900 dark:text-white py-2">
                          {renderArray(profileData.specialties, 'No specialties selected')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Privacy Settings */}
                  <div className="border-b border-gray-200 dark:border-slate-600 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
                    {editing && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Profile Visibility</label>
                          <select
                            name="profile_visibility"
                            value={profileData.profile_visibility}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="friends">Friends Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Preferred Contact Method</label>
                          <select
                            name="preferred_contact_method"
                            value={profileData.preferred_contact_method}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          >
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="sms">SMS</option>
                          </select>
                        </div>

                        {/* WhatsApp opt-in checkbox */}
                        <div className="md:col-span-2">
                          {editing ? (
                            <label className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                name="whatsapp_opt_in"
                                checked={!!profileData.whatsapp_opt_in}
                                onChange={handleInputChange}
                                className="mt-2 h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">WhatsApp updates</div>
                                <p className="text-sm text-gray-600 dark:text-slate-300">Only for class details/updates, important reminders, and notifications about new events & promotions. We do not spam.</p>
                              </div>
                            </label>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">WhatsApp updates</label>
                              <p className="text-gray-900 dark:text-white py-2">{profileData.whatsapp_opt_in ? 'Subscribed — will receive class details, important reminders, and notifications about events & promotions.' : 'Not subscribed to WhatsApp updates.'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Danger Zone</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                        <div className="flex-1">
                          <h4 className="text-red-900 dark:text-red-400 font-medium">Delete Account</h4>
                          <p className="text-red-700 dark:text-red-400 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                        <Button variant="outline" className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {editing && (
        <div className="fixed bottom-4 left-0 right-0 px-4 sm:hidden z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setEditing(false); fetchProfileData(); setAvatarFile(null); setAvatarPreview(null); }}>Cancel</Button>
            <Button className="flex-1" loading={loading} onClick={handleSaveProfile}>Save</Button>
          </div>
        </div>
      )}
      {!editing && (
        <div className="fixed bottom-4 right-4 sm:hidden z-50">
          <Button onClick={() => { setEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
            <Edit2 className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  )
}

// Small custom country picker component
function CountryPicker({ countries, selected, onSelect, phoneValue, onPhoneChange, error }: {
  countries: Array<{ name: string; iso: string; code: string }>
  selected: { name: string; iso: string; code: string } | null
  onSelect: (c: { name: string; iso: string; code: string }) => void
  phoneValue: string
  onPhoneChange: (v: string) => void
  error?: any
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative flex items-center w-full">
      <button type="button" onClick={() => setOpen(s => !s)} className="w-28 flex-shrink-0 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-between">
        <span className="font-medium">{selected?.code || 'Country'}</span>
        <svg className="w-4 h-4 text-gray-500 ml-2" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <input
        type="tel"
        name="phone"
        value={phoneValue}
        onChange={(e) => onPhoneChange(e.target.value)}
        className={`flex-1 min-w-0 ml-2 px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`}
        placeholder="Enter your mobile number"
      />

      {open && (
        <div className="absolute z-50 mt-2 w-72 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
          <ul>
            {countries.map(c => (
              <li key={c.iso}>
                <button
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false) }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <span className="mr-2">{c.name}</span>
                  <span className="text-sm text-gray-500">{c.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}