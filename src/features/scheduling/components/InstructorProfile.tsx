import { Award, Calendar, Clock, Mail, Phone, Star, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'

interface InstructorProfileData {
    user_id: string
    full_name: string
    email: string
    phone?: string
    bio?: string
    specialties?: string[]
    experience_years?: number
    certification?: string
    avatar_url?: string
    is_active: boolean
}

interface ClassSchedule {
    id: string
    day_of_week: number
    start_time: string
    duration_minutes: number
    max_participants: number
    class_type: {
        name: string
        difficulty_level: string
        description?: string
        price?: number
    }
}

function InstructorProfile() {
    const { instructorId } = useParams<{ instructorId: string }>()
    const [instructor, setInstructor] = useState<InstructorProfileData | null>(null)
    const [schedules, setSchedules] = useState<ClassSchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (instructorId) {
            fetchInstructorData()
        }
    }, [instructorId])

    const fetchInstructorData = async () => {
        try {
            setLoading(true)

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
                .single()

            if (profileError) {
                throw new Error('Instructor not found')
            }

            setInstructor(profileData)

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
                .order('start_time')

            if (scheduleError) {
                console.error('Error fetching schedules:', scheduleError)
            } else {
                setSchedules((scheduleData || []).map((s: any) => ({
                    ...s,
                    class_type: Array.isArray(s.class_type) ? s.class_type[0] : s.class_type
                })))
            }

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getDayName = (dayNumber: number) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[dayNumber] || 'Unknown'
    }

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':')
            const hour = parseInt(hours)
            const ampm = hour >= 12 ? 'PM' : 'AM'
            const displayHour = hour % 12 || 12
            return `${displayHour}:${minutes} ${ampm}`
        } catch {
            return time
        }
    }

    const getDifficultyColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            case 'intermediate':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            case 'advanced':
                return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (error || !instructor) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Instructor Not Found</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The instructor profile you are looking for does not exist.'}</p>
                    <Button onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                {instructor.avatar_url ? (
                                    <img
                                        src={instructor.avatar_url}
                                        alt={instructor.full_name}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center border-4 border-blue-100">
                                        <User className="w-12 h-12 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="flex-grow">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{instructor.full_name}</h1>

                                {instructor.certification && (
                                    <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
                                        <Award className="w-5 h-5 mr-2" />
                                        <span className="font-medium">{instructor.certification}</span>
                                    </div>
                                )}

                                {instructor.experience_years && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                                        <Star className="w-5 h-5 mr-2" />
                                        <span>{instructor.experience_years} years of experience</span>
                                    </div>
                                )}

                                {/* Contact Info */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 mr-1" />
                                        <a href={`mailto:${instructor.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                            {instructor.email}
                                        </a>
                                    </div>
                                    {instructor.phone && (
                                        <div className="flex items-center">
                                            <Phone className="w-4 h-4 mr-1" />
                                            <a href={`tel:${instructor.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                                {instructor.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Bio & Specialties */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Bio Section */}
                        {instructor.bio && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{instructor.bio}</p>
                            </div>
                        )}

                        {/* Specialties Section */}
                        {instructor.specialties && instructor.specialties.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Specialties</h2>
                                <div className="flex flex-wrap gap-3">
                                    {instructor.specialties.map((specialty, index) => (
                                        <span
                                            key={index}
                                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium"
                                        >
                                            {specialty}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Class Schedule Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Class Schedule</h2>

                            {schedules.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No classes scheduled at the moment</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {schedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{schedule.class_type.name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{getDayName(schedule.day_of_week)}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(schedule.class_type.difficulty_level)}`}>
                                                    {schedule.class_type.difficulty_level}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {formatTime(schedule.start_time)} ({schedule.duration_minutes}min)
                                                </div>
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-1" />
                                                    Max {schedule.max_participants} students
                                                </div>
                                                {schedule.class_type.price && (
                                                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                                                        ${schedule.class_type.price}
                                                    </div>
                                                )}
                                            </div>

                                            {schedule.class_type.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{schedule.class_type.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Quick Actions */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Button className="w-full" onClick={() => window.location.href = '/schedule'}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    View All Classes
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.location.href = 'https://yogique.life/yogique-for-you'}
                                >
                                    Book a Class
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.location.href = '/contact'}
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Contact Us
                                </Button>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instructor Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Experience</span>
                                    <span className="font-semibold dark:text-white">{instructor.experience_years || 0} years</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Weekly Classes</span>
                                    <span className="font-semibold dark:text-white">{schedules.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Specialties</span>
                                    <span className="font-semibold dark:text-white">{instructor.specialties?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Export both ways for flexibility
export { InstructorProfile }
export default InstructorProfile