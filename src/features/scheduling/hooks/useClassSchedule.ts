import { useEffect, useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'

interface ClassSchedule {
  name?: string
  id: string
  class_type_id: string
  instructor_id: string
  day_of_week: number
  start_time: string
  duration_minutes: number
  max_participants: number
  is_active: boolean
  effective_from: string
  effective_until: string | null
  class_type: {
    name: string
    description: string
    difficulty_level: string
    price: number
  }
  instructor: {
    full_name: string
    email?: string
    user_id?: string
  }
}

export function useClassSchedule() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching class schedules...')

      // Use the same approach as the class assignment manager for consistency
      const [classTypesResult, scheduleResult] = await Promise.all([
        supabase.from('class_types').select('id, name, description, difficulty_level, price'),
        supabase.from('class_schedules').select('*').eq('is_active', true).order('day_of_week', { ascending: true }).order('start_time', { ascending: true })
      ])

      console.log('📊 Raw schedule result:', scheduleResult)
      console.log('📊 Raw class types result:', classTypesResult)

      const classTypesData = classTypesResult.data || []
      const scheduleData = scheduleResult.data || []

      if (scheduleResult.error) {
        throw new Error(`Failed to fetch schedules: ${scheduleResult.error.message}`)
      }

      if (classTypesResult.error) {
        console.warn('⚠️ Failed to fetch class types:', classTypesResult.error)
      }

      if (scheduleData.length === 0) {
        console.log('📭 No active schedules found')
        setSchedules([])
        return
      }

      console.log('📊 Schedule data fetched:', scheduleData.length, 'schedules')
      console.log('📊 Class types fetched:', classTypesData.length, 'types')

      // Fetch related data separately using the same pattern as class assignment manager
      const combinedData = await fetchRelatedDataSeparately(scheduleData, classTypesData)
      setSchedules(combinedData)

    } catch (err: any) {
      console.error('❌ Error fetching class schedules:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedDataSeparately = async (schedules: any[], classTypes: any[]) => {
    try {
      // Get unique instructor IDs
      const instructorIds = [...new Set(schedules.map(s => s.instructor_id).filter(Boolean))]

      console.log('🔗 Fetching instructor data for', instructorIds.length, 'instructors')

      // Fetch instructors (we already have class types from the parallel fetch)
      let instructors: any[] = []
      if (instructorIds.length > 0) {
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', instructorIds)

        if (instructorError) {
          console.error('❌ Error fetching instructors:', instructorError)
        } else {
          instructors = instructorData || []
          console.log('✅ Instructors fetched:', instructors.length)
        }
      }

      // Combine the data
      const combinedSchedules = schedules.map(schedule => {
        const classType = classTypes.find(ct => ct.id === schedule.class_type_id) || {
          name: 'Unknown Class',
          description: 'Class details not available',
          difficulty_level: 'beginner',
          price: 0
        }

        const instructor = instructors.find(inst => inst.user_id === schedule.instructor_id) || {
          full_name: 'TBD',
          email: '',
          user_id: schedule.instructor_id
        }

        return {
          ...schedule,
          class_type: classType,
          instructor: instructor
        }
      })

      console.log('✅ Data combined successfully:', combinedSchedules.length, 'schedules')
      return combinedSchedules

    } catch (error) {
      console.error('❌ Error in fetchRelatedDataSeparately:', error)
      return schedules.map(schedule => ({
        ...schedule,
        class_type: {
          name: 'Error Loading Class',
          description: 'Unable to load class details',
          difficulty_level: 'beginner',
          price: 0
        },
        instructor: {
          full_name: 'Error Loading Instructor',
          email: '',
          user_id: schedule.instructor_id
        }
      }))
    }
  }


  useEffect(() => {
    fetchSchedules()
  }, [])

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek] || 'Invalid Day'
  }

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      console.error('Error formatting time:', time, error)
      return time
    }
  }

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
    getDayName,
    formatTime
  }
}
