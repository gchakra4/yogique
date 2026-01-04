import { Award, Calendar, Clock, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'
import { useClassSchedule } from '../hooks/useClassSchedule'
import InstructorLink from './InstructorLink'
import { InstructorProvider } from './InstructorProvider'

// Internal component that uses the instructor context
function WeeklyScheduleContent() {
  const { schedules, loading, error, getDayName, formatTime } = useClassSchedule()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookingLoading, setBookingLoading] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const handleBookClass = async (schedule: any) => {
    if (!user) {
      navigate('/login?redirect=/schedule')
      return
    }

    if (submittingRef.current) return

    submittingRef.current = true
    setBookingLoading(schedule.id)

    try {
      const className = schedule.name || schedule.class_type.name
      const today = new Date()
      const targetDay = schedule.day_of_week
      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7
      const nextClassDate = new Date(today)
      nextClassDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))

      const classDate = nextClassDate.toISOString().split('T')[0]

      const { data: existingBooking, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('class_date', classDate)
        .eq('class_time', schedule.start_time)
        .eq('class_name', className)
        .maybeSingle()

      if (checkError) {
        throw checkError
      }

      if (existingBooking) {
        alert('You already have a booking for this class on this date.')
        setBookingLoading(null)
        submittingRef.current = false
        return
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      // debug: surface IANA timezone captured in client console
      console.debug('Booking timezone:', tz)

      // Normalize user metadata: Supabase can return an object or a JSON/string.
      // Handle both shapes safely before using split().
      let meta: any = user.user_metadata ?? {}
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta)
        } catch {
          // If it's a plain string, treat it as the user's full name.
          meta = { full_name: meta }
        }
      }

      const fullName = meta?.full_name || meta?.fullName || ''
      const nameParts = typeof fullName === 'string' ? fullName.trim().split(/\s+/) : []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      const phone = meta?.phone || meta?.phone_number || user.phone || ''

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
      }

      // debug: inspect payload sent to Supabase
      console.debug('Booking payload:', bookingData)

      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select('*')

      console.debug('Supabase insert response:', { bookingResult, bookingError })

      if (bookingError) {
        console.error('Supabase booking insert error:', bookingError)
        throw bookingError
      }

      if (bookingError) throw bookingError

      const bookingId = bookingResult?.[0]?.booking_id || 'N/A'
      alert(`Successfully booked ${className} for ${nextClassDate.toLocaleDateString()}!\n\nYour Booking ID: ${bookingId}\n\nPlease save this ID for your records.`)
    } catch (error: any) {
      console.error('Booking error:', error)
      alert('Failed to book class. Please try again.')
    } finally {
      setBookingLoading(null)
      submittingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading schedule: {error}</p>
      </div>
    )
  }

  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<number, typeof schedules>)

  const days = [0, 1, 2, 3, 4, 5, 6]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-600">
      <div className="p-6 border-b border-gray-200 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
          Weekly Class Schedule
        </h2>
        <p className="text-gray-600 dark:text-slate-300 mt-1">Regular weekly classes - book your spot today!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-slate-600">
        {days.map(day => (
          <div key={day} className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
              {getDayName(day)}
            </h3>

            <div className="space-y-3">
              {schedulesByDay[day]?.map(schedule => (
                <div
                  key={schedule.id}
                  className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-lg p-4 hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-slate-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                      {schedule.name || schedule.class_type.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${schedule.class_type.difficulty_level === 'beginner'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : schedule.class_type.difficulty_level === 'intermediate'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : schedule.class_type.difficulty_level === 'all'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                      {schedule.class_type.difficulty_level === 'all' ? 'All Levels' : (schedule.class_type.difficulty_level || '')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 dark:text-slate-300 mb-3">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" />
                      {formatTime(schedule.start_time)} ({schedule.duration_minutes}min)
                    </div>

                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1 text-emerald-500 dark:text-emerald-400" />
                      Max {schedule.max_participants} students
                    </div>

                    <div className="flex items-center">
                      <Award className="w-3 h-3 mr-1 text-orange-500 dark:text-orange-400" />
                      <InstructorLink
                        instructor={{
                          id: schedule.instructor_id || '',
                          fullName: schedule.instructor?.full_name || 'Unknown Instructor',
                          email: schedule.instructor?.email || '',
                          bio: '',
                          specialization: '',
                          experience: 0,
                          joinDate: '',
                          profileImage: ''
                        }}
                        className="text-xs font-medium hover:text-blue-600 hover:underline transition-colors"
                      />
                    </div>

                    {schedule.class_type.price && (
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
                        ₹{schedule.class_type.price}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleBookClass(schedule)}
                    loading={bookingLoading === schedule.id}
                    disabled={bookingLoading === schedule.id}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
                  >
                    {bookingLoading === schedule.id ? 'Booking...' : 'Book Now'}
                  </Button>
                </div>
              )) || (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                    No classes scheduled
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How Booking Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-slate-300">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-white font-semibold">1</span>
              </div>
              <p className="text-gray-900 dark:text-white">Click "Book Now" on any class</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-white font-semibold">2</span>
              </div>
              <p className="text-gray-900 dark:text-white">Sign in to your account</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-white font-semibold">3</span>
              </div>
              <p className="text-gray-900 dark:text-white">Get instant confirmation</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-slate-300">
            * Bookings are made for the next occurrence of the selected class
          </p>
        </div>
      </div>
    </div>
  )
}

// Main component wrapped with InstructorProvider
export function WeeklySchedule() {
  return (
    <InstructorProvider>
      <WeeklyScheduleContent />
    </InstructorProvider>
  )
}
