import { useEffect, useState } from 'react'
import { supabase } from '../../../../../../shared/lib/supabase'
import { Booking, ClassAssignment, ClassSchedule, ClassType, LoadingStates, Package, UserProfile } from '../types'

export const useClassAssignmentData = () => {
    const [assignments, setAssignments] = useState<ClassAssignment[]>([])
    const [weeklySchedules, setWeeklySchedules] = useState<ClassSchedule[]>([])
    const [scheduleTemplates, setScheduleTemplates] = useState<ClassSchedule[]>([])
    const [classTypes, setClassTypes] = useState<ClassType[]>([])
    const [packages, setPackages] = useState<Package[]>([])
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        creatingAssignment: false,
        updatingStatus: false,
        deletingAssignment: false,
        checkingConflicts: false,
        fetchingData: false
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            setLoadingStates(prev => ({ ...prev, fetchingData: true }))

            // Check authentication first
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            console.log('Current auth session:', session ? `Authenticated as ${session.user?.email}` : 'Not authenticated')
            if (sessionError) {
                console.error('Session error:', sessionError)
            }

            // Execute all independent queries in parallel
            console.log('Starting parallel queries...')
            const [
                classTypesResult,
                packagesResult,
                rolesResult,
                assignmentsResult,
                weeklySchedulesResult,
                scheduleTemplatesResult,
                bookingsResult
            ] = await Promise.all([
                supabase.from('class_types').select('id, name, difficulty_level'),
                supabase.from('class_packages').select('id, name, description, duration, price, class_count, validity_days, type, course_type, is_active').eq('is_active', true).eq('is_archived', false),
                supabase.from('roles').select('id, name').in('name', ['instructor', 'yoga_acharya']),
                supabase.from('class_assignments').select(`
                    *,
                    assignment_bookings (
                        booking_id
                    ),
                    class_container:class_containers!class_assignments_class_container_id_fkey (
                        id,
                        container_code,
                        container_type,
                        max_booking_count,
                        current_booking_count
                    )
                `).order('assigned_at', { ascending: false }),
                supabase.from('class_schedules').select('*').eq('is_active', true).order('day_of_week', { ascending: true }),
                supabase.from('class_schedules').select(`
                    *,
                    class_type:class_types(id, name, difficulty_level)
                `).eq('is_active', true).order('day_of_week', { ascending: true }).order('start_time', { ascending: true }),
                supabase.from('bookings').select(`
                    id,
                    booking_id,
                    user_id,
                    class_name,
                    instructor,
                    class_date,
                    class_time,
                    preferred_days,
                    preferred_times,
                    timezone,
                    first_name,
                    last_name,
                    email,
                    phone,
                    status,
                    created_at,
                    booking_type,
                    class_package_id,
                    class_packages:class_package_id(id, name, description, price, class_count, validity_days, type, duration, course_type)
                `).order('created_at', { ascending: false })
            ])

            const classTypesData = classTypesResult.data || []
            const packagesData = packagesResult.data || []
            const roles = rolesResult.data || []
            const assignmentsData = assignmentsResult.data || []
            const weeklySchedulesData = weeklySchedulesResult.data || []
            const scheduleTemplatesData = scheduleTemplatesResult.data || []
            const bookingsData = bookingsResult.data || []

            // Log query results and errors
            console.log('Query results:')
            console.log('- Class types:', classTypesData?.length || 0, classTypesResult.error ? `Error: ${classTypesResult.error.message}` : '✓')
            console.log('- Packages:', packagesData?.length || 0, packagesResult.error ? `Error: ${packagesResult.error.message}` : '✓')
            console.log('- Roles:', roles?.length || 0, rolesResult.error ? `Error: ${rolesResult.error.message}` : '✓')
            console.log('- Assignments:', assignmentsData?.length || 0, assignmentsResult.error ? `Error: ${assignmentsResult.error.message}` : '✓')
            console.log('- Weekly schedules:', weeklySchedulesData?.length || 0, weeklySchedulesResult.error ? `Error: ${weeklySchedulesResult.error.message}` : '✓')
            console.log('- Schedule templates:', scheduleTemplatesData?.length || 0, scheduleTemplatesResult.error ? `Error: ${scheduleTemplatesResult.error.message}` : '✓')
            console.log('- Bookings:', bookingsData?.length || 0, bookingsResult.error ? `Error: ${bookingsResult.error.message}` : '✓')

            // Create maps for efficient lookups
            const classTypeMap = new Map(classTypesData.map(ct => [ct.id, ct]))

            // Now fetch user roles and profiles based on role data
            const roleIds = roles.map(r => r.id)

            // First get user roles
            const { data: userRoles } = roleIds.length > 0
                ? await supabase
                    .from('user_roles')
                    .select('user_id, role_id')
                    .in('role_id', roleIds)
                : { data: [] }

            // Then get profiles for those users
            const userIds = [...new Set((userRoles || []).map(ur => ur.user_id))]
            const { data: profiles } = userIds.length > 0
                ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
                : { data: [] }

            // Build profiles with roles more efficiently
            const userRoleMap = new Map<string, string[]>()
                ; (userRoles || []).forEach(ur => {
                    if (!userRoleMap.has(ur.user_id)) {
                        userRoleMap.set(ur.user_id, [])
                    }
                    userRoleMap.get(ur.user_id)?.push(ur.role_id)
                })

            const roleMap = new Map(roles.map(role => [role.id, role.name]))

            const profilesWithRoles = (profiles || []).map(profile => ({
                ...profile,
                user_roles: (userRoleMap.get(profile.user_id) || [])
                    .map(roleId => ({ roles: { name: roleMap.get(roleId) || '' } }))
                    .filter(role => role.roles.name)
            }))

            // Build lookup maps for better performance
            const profileMap = new Map(profilesWithRoles.map(p => [p.user_id, p]))

            // Enrich data more efficiently
            const toNumber = (v: any): number => {
                if (v === null || v === undefined) return 0
                if (typeof v === 'number') return v
                const n = Number.parseFloat(v)
                return Number.isFinite(n) ? n : 0
            }

            const enrichedAssignments = assignmentsData.map(assignment => ({
                ...assignment,
                // prefer looked-up class type but fall back to pre-joined alias if present
                class_type: classTypeMap.get(assignment.class_type_id) || assignment.class_type,
                instructor_profile: profileMap.get(assignment.instructor_id),
                payment_amount: toNumber(assignment.payment_amount),
                override_payment_amount: assignment.override_payment_amount == null ? null : toNumber(assignment.override_payment_amount),
                final_payment_amount: assignment.final_payment_amount == null ? null : toNumber(assignment.final_payment_amount)
            }))

            const enrichedWeeklySchedules = weeklySchedulesData.map(schedule => ({
                ...schedule,
                class_type: classTypeMap.get(schedule.class_type_id),
                instructor_profile: profileMap.get(schedule.instructor_id)
            }))

            const enrichedBookings = bookingsData.map(booking => {
                // Normalize class_packages to single object or null
                let normalizedPackage = null
                if (Array.isArray(booking.class_packages) && booking.class_packages.length > 0) {
                    normalizedPackage = booking.class_packages[0]
                } else if (booking.class_packages && !Array.isArray(booking.class_packages)) {
                    normalizedPackage = booking.class_packages
                }

                return {
                    ...booking,
                    class_packages: normalizedPackage
                }
            })

            // Update state
            setClassTypes(classTypesData)
            setPackages(packagesData)
            setUserProfiles(profilesWithRoles)
            setAssignments(enrichedAssignments)
            setWeeklySchedules(enrichedWeeklySchedules)
            setScheduleTemplates(scheduleTemplatesData)
            setBookings(enrichedBookings)
        } catch (e) {
            console.error('Fetch error:', e)
        } finally {
            setLoading(false)
            setLoadingStates(prev => ({ ...prev, fetchingData: false }))
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return {
        assignments,
        setAssignments,
        weeklySchedules,
        setWeeklySchedules,
        scheduleTemplates,
        setScheduleTemplates,
        classTypes,
        setClassTypes,
        packages,
        setPackages,
        userProfiles,
        setUserProfiles,
        bookings,
        setBookings,
        loading,
        setLoading,
        loadingStates,
        setLoadingStates,
        fetchData,
        refetch: fetchData
    }
}
