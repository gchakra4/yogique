import { BarChart3, Calendar, CheckSquare, FileText, Filter, List, Plus, RefreshCw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ResponsiveActionButton } from '../../../../../shared/components/ui/ResponsiveActionButton'
import { supabase } from '../../../../../shared/lib/supabase'
import {
    AdvancedFilters,
    AnalyticsView,
    AssignmentForm,
    AssignmentListView,
    BulkAddUsersModal,
    Button,
    CalendarView,
    ClassDetailsPopup,
    EditAssignmentModal,
    SimplifiedAssignmentForm
} from './components'
import NewAssignmentChooser from './components/NewAssignmentChooser'
import { useClassAssignmentData, useFormHandler } from './hooks'
import { AssignmentCreationService } from './services/assignmentCreation'
import {
    ClassAssignment,
    ConflictDetails,
    Filters,
    getClientNames
} from './types'
import {
    formatTime,
    getAssignmentType,
    timeToMinutes
} from './utils'

export function ClassAssignmentManager() {
    // New assignment chooser flow (simplified UX)

    // Data fetching hook
    const {
        assignments,
        weeklySchedules,
        scheduleTemplates,
        classTypes,
        packages,
        userProfiles,
        bookings,
        loading,
        loadingStates,
        setLoadingStates,
        fetchData
    } = useClassAssignmentData()

    // Form handling hook with conflict checking
    const {
        formData,
        errors,
        conflictWarning,
        setConflictWarning,
        handleInputChange,
        handleTimeChange,
        handleDurationChange,
        validateForm,
        resetForm
    } = useFormHandler({ conflictCheckCallback: checkForConflicts, packages })

    // UI state
    const [showAssignForm, setShowAssignForm] = useState(false)
    const [assignModalMode, setAssignModalMode] = useState<'chooser' | 'simplified' | 'full'>('chooser')
    const [assignInitialBookingId, setAssignInitialBookingId] = useState('')
    const [saving, setSaving] = useState(false)
    const [showBulkAddModal, setShowBulkAddModal] = useState(false)
    const [activeView, setActiveView] = useState<'list' | 'calendar' | 'analytics'>('list')
    const [showFilters, setShowFilters] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<Filters>({
        dateRange: { start: '', end: '' },
        assignmentTypes: [],
        classStatus: [],
        paymentStatus: [],
        instructors: [],
        classTypes: [],
        packages: [],
        clientName: '',
        weeklyClasses: false
    })

    // Selection state for multi-delete
    const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set())
    const [isSelectMode, setIsSelectMode] = useState(false)

    // Manual invoice generation state
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [generatingInvoices, setGeneratingInvoices] = useState(false)

    // Tabs scroll handler (for small screens)
    const tabsScrollRef = useRef<HTMLDivElement | null>(null)

    const updateTabsIndicator = () => {
        // keep a no-op updater so we can attach it to scroll/resize events
        // in the future we may show a visual indicator again
        const el = tabsScrollRef.current
        if (!el) return
        // noop for now
        void el.scrollLeft
    }

    useEffect(() => {
        updateTabsIndicator()
        const el = tabsScrollRef.current
        if (!el) return
        const onScroll = () => updateTabsIndicator()
        el.addEventListener('scroll', onScroll)
        window.addEventListener('resize', updateTabsIndicator)
        return () => {
            el.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', updateTabsIndicator)
        }
    }, [])

    // For touch devices: hide native scrollbar and emulate horizontal dragging so
    // the scroll thumb never appears while keeping touch-scrolling functional.
    useEffect(() => {
        const el = tabsScrollRef.current
        if (!el) return

        const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
        if (!isTouch) return

        const prevOverflow = el.style.overflow
        // Hide native scrollbar visually
        el.style.overflow = 'hidden'

        let startX = 0
        let startScroll = 0
        let dragging = false

        const onTouchStart = (ev: TouchEvent) => {
            if (!ev.touches || ev.touches.length === 0) return
            startX = ev.touches[0].clientX
            startScroll = el.scrollLeft
            dragging = true
        }

        const onTouchMove = (ev: TouchEvent) => {
            if (!dragging || !ev.touches || ev.touches.length === 0) return
            const dx = ev.touches[0].clientX - startX
            el.scrollLeft = Math.max(0, startScroll - dx)
        }

        const onTouchEnd = () => {
            dragging = false
        }

        el.addEventListener('touchstart', onTouchStart, { passive: true })
        el.addEventListener('touchmove', onTouchMove, { passive: true })
        el.addEventListener('touchend', onTouchEnd)

        return () => {
            el.style.overflow = prevOverflow
            el.removeEventListener('touchstart', onTouchStart)
            el.removeEventListener('touchmove', onTouchMove)
            el.removeEventListener('touchend', onTouchEnd)
        }
    }, [])

    // Class details popup state
    const [selectedClassDetails, setSelectedClassDetails] = useState<ClassAssignment | null>(null)
    const [showClassDetailsPopup, setShowClassDetailsPopup] = useState(false)

    // Edit assignment modal state
    const [selectedEditAssignment, setSelectedEditAssignment] = useState<ClassAssignment | null>(null)
    const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false)

    const instructors = userProfiles

    const createDateInTimeZone = (dateString: string) => {
        return new Date(dateString + 'T00:00:00')
    }

    // Enhanced conflict checking function
    async function checkForConflicts() {
        if (!formData.instructor_id || !formData.date || !formData.start_time || !formData.end_time) {
            setConflictWarning(null)
            return
        }

        setLoadingStates(prev => ({ ...prev, checkingConflicts: true }))

        const proposedStart = timeToMinutes(formData.start_time)
        const proposedEnd = timeToMinutes(formData.end_time)
        const proposedDate = createDateInTimeZone(formData.date)
        const proposedDayOfWeek = proposedDate.getDay()

        // Enhanced conflict detection
        const conflicts: ConflictDetails[] = []

        try {
            // 1. Check instructor conflicts with future classes in the database
            const { data: futureClasses, error: futureClassesError } = await supabase
                .from('class_assignments')
                .select('id, date, schedule_type, start_time, end_time, class_type_id, instructor_id')
                .eq('instructor_id', formData.instructor_id)
                .eq('schedule_type', 'weekly')
                .gte('date', formData.date)
                .eq('class_type_id', formData.class_type_id || '')
                .eq('start_time', formData.start_time + ':00')
                .is('end_time', null)
                .order('date', { ascending: true })

            if (futureClassesError) {
                console.error('Error fetching future classes:', futureClassesError)
                // Continue with local conflict checking even if database query fails
            } else if (futureClasses && futureClasses.length > 0) {
                conflicts.push({
                    hasConflict: true,
                    conflictingClass: futureClasses[0],
                    message: `Future weekly class found at ${formatTime(futureClasses[0].start_time)}`,
                    conflictType: 'instructor',
                    severity: 'warning'
                })
            }

            // 2. Check instructor conflicts with existing assignments
            const conflictingAssignments = assignments.filter(assignment => {
                if (assignment.instructor_id !== formData.instructor_id) return false
                if (assignment.date !== formData.date) return false
                if (assignment.class_status === 'cancelled') return false

                const assignmentStart = timeToMinutes(assignment.start_time || '')
                const assignmentEnd = timeToMinutes(assignment.end_time || '')

                return (proposedStart < assignmentEnd && proposedEnd > assignmentStart)
            })

            if (conflictingAssignments.length > 0) {
                conflicts.push({
                    hasConflict: true,
                    conflictingClass: conflictingAssignments[0],
                    message: `Instructor has another class at ${formatTime(conflictingAssignments[0].start_time)} - ${formatTime(conflictingAssignments[0].end_time)}`,
                    conflictType: 'instructor',
                    severity: 'error'
                })
            }
        } catch (error) {
            console.error('Error in conflict checking:', error)
        }

        // 2. Check instructor conflicts with weekly schedules
        const conflictingSchedules = weeklySchedules.filter(schedule => {
            if (schedule.instructor_id !== formData.instructor_id) return false
            if (schedule.day_of_week !== proposedDayOfWeek) return false
            if (!schedule.is_active) return false

            const scheduleStart = timeToMinutes(schedule.start_time)
            const scheduleEnd = timeToMinutes(schedule.end_time)

            return (proposedStart < scheduleEnd && proposedEnd > scheduleStart)
        })

        if (conflictingSchedules.length > 0) {
            conflicts.push({
                hasConflict: true,
                conflictingClass: conflictingSchedules[0],
                message: `Instructor has a weekly class scheduled at ${formatTime(conflictingSchedules[0].start_time)} - ${formatTime(conflictingSchedules[0].end_time)}`,
                conflictType: 'instructor',
                severity: 'warning',
                suggestions: ['Consider scheduling at a different time', 'Check if the weekly class can be moved']
            })
        }

        // 3. Check for timing issues
        const duration = proposedEnd - proposedStart
        if (duration < 30) {
            conflicts.push({
                hasConflict: true,
                message: 'Class duration should be at least 30 minutes',
                conflictType: 'timing',
                severity: 'warning'
            })
        } else if (duration > 180) {
            conflicts.push({
                hasConflict: true,
                message: 'Class duration over 3 hours is unusual',
                conflictType: 'timing',
                severity: 'warning'
            })
        }

        // 4. Check for early morning or late evening classes
        if (proposedStart < 360) { // Before 6 AM
            conflicts.push({
                hasConflict: true,
                message: 'Very early morning class (before 6 AM)',
                conflictType: 'timing',
                severity: 'warning'
            })
        } else if (proposedEnd > 1320) { // After 10 PM
            conflicts.push({
                hasConflict: true,
                message: 'Late evening class (after 10 PM)',
                conflictType: 'timing',
                severity: 'warning'
            })
        }

        // 5. Check weekend scheduling
        if (proposedDayOfWeek === 0 || proposedDayOfWeek === 6) { // Sunday or Saturday
            conflicts.push({
                hasConflict: true,
                message: `Weekend class scheduled for ${proposedDayOfWeek === 0 ? 'Sunday' : 'Saturday'}`,
                conflictType: 'timing',
                severity: 'warning'
            })
        }

        // Process conflicts and set the most severe one
        const errorConflicts = conflicts.filter(c => c.severity === 'error')
        const warningConflicts = conflicts.filter(c => c.severity === 'warning')

        setLoadingStates(prev => ({ ...prev, checkingConflicts: false }))

        if (errorConflicts.length > 0) {
            setConflictWarning(errorConflicts[0])
        } else if (warningConflicts.length > 0) {
            // Show the first warning-level conflict
            setConflictWarning(warningConflicts[0])
        } else {
            setConflictWarning(null)
        }
    }

    // Check for conflicts when relevant fields change
    useEffect(() => {
        if (formData.assignment_type === 'adhoc') {
            checkForConflicts()
        }
    }, [formData.instructor_id, formData.date, formData.start_time, formData.end_time, assignments, weeklySchedules])

    // Enhanced filtering and search functionality
    const filteredAssignments = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return assignments.filter(assignment => {
            // Search term filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                const matchesSearch =
                    assignment.class_type?.name?.toLowerCase().includes(searchLower) ||
                    assignment.instructor_profile?.full_name?.toLowerCase().includes(searchLower) ||
                    getClientNames(assignment)?.toLowerCase().includes(searchLower) ||
                    assignment.notes?.toLowerCase().includes(searchLower)

                if (!matchesSearch) return false
            }

            // Date range filter
            if (filters.dateRange.start && assignment.date < filters.dateRange.start) return false
            if (filters.dateRange.end && assignment.date > filters.dateRange.end) return false

            // Weekly classes filter
            if (filters.weeklyClasses && assignment.schedule_type !== 'weekly') return false

            // Class status filter
            if (filters.classStatus.length > 0 && assignment.class_status && !filters.classStatus.includes(assignment.class_status)) return false

            // Payment status filter
            if (filters.paymentStatus.length > 0 && assignment.payment_status && !filters.paymentStatus.includes(assignment.payment_status)) return false

            // Assignment type filter
            if (filters.assignmentTypes.length > 0) {
                const assignmentType = getAssignmentType(assignment)
                if (!filters.assignmentTypes.includes(assignmentType)) return false
            }

            // Instructor filter
            if (filters.instructors.length > 0 && !filters.instructors.includes(assignment.instructor_id)) return false

            // Class types filter
            if (filters.classTypes.length > 0 && assignment.class_type_id && !filters.classTypes.includes(assignment.class_type_id)) return false

            // Client name filter
            if (filters.clientName && !getClientNames(assignment).toLowerCase().includes(filters.clientName.toLowerCase())) return false

            // Hide past classes that remain in 'pending' status (avoid showing stale pending items)
            try {
                const assignmentDate = assignment.date ? new Date(assignment.date + 'T00:00:00') : null
                if (assignmentDate && assignmentDate < today && assignment.payment_status === 'pending') return false
            } catch (e) {
                // ignore parsing errors and keep the assignment
            }

            return true
        })
    }, [assignments, searchTerm, filters])

    // Group assignments by recurring patterns
    const groupedAssignments = useMemo(() => {
        const groups = new Map<string, {
            key: string
            type: string
            containerId: string | null
            containerCode: string | null
            assignments: ClassAssignment[]
            groupInfo: {
                instructor_name: string
                class_type_name: string
                total_revenue: number
                assignment_count: number
                client_names?: string
                pattern_description?: string
            }
        }>()

        filteredAssignments.forEach(assignment => {
            // PHASE 6: Group by class_container_id as single source of truth
            // Container ID is the primary grouping mechanism
            const containerId = assignment.class_container_id || null
            const containerCode = assignment.class_container?.container_code || null

            // Use container_id if available, fallback to old logic for orphaned assignments
            let groupKey: string
            let groupType: string

            if (containerId) {
                // Primary path: Group by container
                groupKey = `container_${containerId}`
                // Derive type from container type
                const containerType = assignment.class_container?.container_type
                // If a container is marked as 'individual' but the assignment itself is schedule_type 'monthly',
                // treat it as a monthly container (fixes incorrect 'Adhoc' label for individual monthly containers).
                groupType = containerType === 'individual'
                    ? (assignment.schedule_type === 'monthly' ? 'monthly' : 'adhoc')
                    :
                    containerType === 'public_group' ? 'monthly' :
                        containerType === 'private_group' ? 'monthly' :
                            containerType === 'crash_course' ? 'crash_course' :
                                assignment.schedule_type || 'adhoc'
            } else {
                // Fallback path: Legacy grouping for orphaned assignments (should be rare)
                switch (assignment.schedule_type) {
                    case 'weekly':
                        groupKey = `legacy_weekly_${assignment.instructor_id}_${assignment.class_type_id}`
                        groupType = 'weekly'
                        break
                    case 'monthly':
                        groupKey = `legacy_monthly_${assignment.instructor_id}_${assignment.package_id || assignment.class_type_id || 'unknown'}`
                        groupType = 'monthly'
                        break
                    case 'crash':
                        groupKey = `legacy_crash_${assignment.instructor_id}_${assignment.package_id || assignment.class_type_id || 'unknown'}`
                        groupType = 'crash_course'
                        break
                    case 'adhoc':
                    default:
                        groupKey = `legacy_adhoc_${assignment.id}`
                        groupType = 'adhoc'
                        break
                }
            }

            if (!groups.has(groupKey)) {
                // Determine display name with better fallback logic
                let displayName: string = 'Unknown Class'

                // Try package name first
                if (assignment.package?.name) {
                    displayName = assignment.package.name
                }
                // Then class type name
                else if (assignment.class_type?.name) {
                    displayName = assignment.class_type.name
                }
                // For container-grouped assignments, use container display_name if available
                else if (assignment.class_container?.display_name) {
                    displayName = assignment.class_container.display_name
                }
                // Last resort: try to build from container code
                else if (containerCode) {
                    displayName = `Container ${containerCode}`
                }

                groups.set(groupKey, {
                    key: groupKey,
                    type: groupType,
                    containerId,
                    containerCode,
                    assignments: [],
                    groupInfo: {
                        instructor_name: assignment.instructor_profile?.full_name || 'Unknown Instructor',
                        class_type_name: displayName,
                        total_revenue: 0,
                        assignment_count: 0,
                        client_names: getClientNames(assignment),
                        pattern_description: groupType === 'weekly' ? 'Weekly Recurring' :
                            groupType === 'monthly' ? 'Monthly Package' :
                                groupType === 'crash_course' ? 'Crash Course' : undefined
                    }
                })
            }

            const group = groups.get(groupKey)!
            group.assignments.push(assignment)
            group.groupInfo.total_revenue += assignment.payment_amount
            group.groupInfo.assignment_count += 1

            // Sort assignments within each group by date
            group.assignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        })

        // Convert to array format with group metadata
        return Array.from(groups.values())
            .sort((a, b) => {
                const typeOrder: Record<string, number> = {
                    'weekly': 1,
                    'monthly': 2,
                    'crash_course': 3,
                    'adhoc': 4
                }

                // Sort groups by type priority and then by date
                const typeDiff = (typeOrder[a.type] || 999) - (typeOrder[b.type] || 999)
                if (typeDiff !== 0) return typeDiff

                // Get first assignment date for each group
                const aFirstDate = a.assignments[0]?.date || ''
                const bFirstDate = b.assignments[0]?.date || ''

                // Within same type, sort by first assignment date (newest first)
                return new Date(bFirstDate).getTime() - new Date(aFirstDate).getTime()
            })
    }, [filteredAssignments])

    // Assignment actions
    const openClassDetails = (assignment: ClassAssignment) => {
        setSelectedClassDetails(assignment)
        setShowClassDetailsPopup(true)
    }

    const closeClassDetails = () => {
        setSelectedClassDetails(null)
        setShowClassDetailsPopup(false)
    }

    const openEditAssignment = (assignment: ClassAssignment) => {
        setSelectedEditAssignment(assignment)
        setShowEditAssignmentModal(true)
        // Close class details popup if it's open
        setShowClassDetailsPopup(false)
    }

    const closeEditAssignment = () => {
        setSelectedEditAssignment(null)
        setShowEditAssignmentModal(false)
    }

    const deleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${assignmentTitle}"?`)) return

        try {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: true }))

            const { error } = await supabase
                .from('class_assignments')
                .delete()
                .eq('id', assignmentId)

            if (error) throw error

            // Refresh data to update the UI
            await fetchData()

            // Show success message
            console.log('Assignment deleted successfully')
        } catch (error) {
            console.error('Error deleting assignment:', error)
            alert('Failed to delete assignment. Please try again.')
        } finally {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: false }))
        }
    }

    // Bulk delete functionality
    const deleteBulkAssignments = async () => {
        if (selectedAssignments.size === 0) return

        const assignmentTitles = Array.from(selectedAssignments)
            .slice(0, 3) // Show first 3 assignments
            .map(id => {
                const assignment = assignments.find(a => a.id === id)
                return assignment ? `${assignment.class_type?.name || 'Class'} on ${assignment.date}` : 'Assignment'
            })

        const displayText = selectedAssignments.size > 3
            ? `${assignmentTitles.join(', ')} and ${selectedAssignments.size - 3} more`
            : assignmentTitles.join(', ')

        if (!confirm(`Are you sure you want to delete ${selectedAssignments.size} assignment${selectedAssignments.size !== 1 ? 's' : ''}?\n\n${displayText}`)) return

        try {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: true }))

            const { error } = await supabase
                .from('class_assignments')
                .delete()
                .in('id', Array.from(selectedAssignments))

            if (error) throw error

            // Clear selections and refresh data
            setSelectedAssignments(new Set())
            setIsSelectMode(false)
            await fetchData()

            // Show success message
            console.log(`${selectedAssignments.size} assignments deleted successfully`)
        } catch (error) {
            console.error('Error deleting assignments:', error)
            alert('Failed to delete assignments. Please try again.')
        } finally {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: false }))
        }
    }

    // Selection handling
    const toggleAssignmentSelection = (assignmentId: string) => {
        const newSelected = new Set(selectedAssignments)
        if (newSelected.has(assignmentId)) {
            newSelected.delete(assignmentId)
        } else {
            newSelected.add(assignmentId)
        }
        setSelectedAssignments(newSelected)
    }

    const selectAllFilteredAssignments = () => {
        const allIds = new Set(filteredAssignments.map(a => a.id))
        setSelectedAssignments(allIds)
    }

    const clearAllSelections = () => {
        setSelectedAssignments(new Set())
    }

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode)
        if (isSelectMode) {
            clearAllSelections()
        }
    }

    // Enhanced create assignment function
    const createAssignment = async () => {
        if (!validateForm()) return

        try {
            setSaving(true)
            setLoadingStates(prev => ({ ...prev, creatingAssignment: true }))

            // Calculate student count based on selected booking(s)
            const calculateStudentCount = () => {
                // For the new multiple booking system, each booking represents 1 student
                // The booking selection is now handled by BookingSelector/MultipleBookingSelector
                // For now, we'll use a default of 1 student - the booking count will be handled
                // in the assignment creation service
                return 1;
            };

            const studentCount = calculateStudentCount();

            // If linking bookings is disabled in the form, ensure we don't send booking IDs
            const payloadFormData = { ...formData }
            if (!payloadFormData.link_booking) {
                payloadFormData.booking_ids = []
                payloadFormData.booking_id = ''
            }

            const result = await AssignmentCreationService.createAssignment(payloadFormData, packages, studentCount)

            await fetchData()
            resetForm()
            setShowAssignForm(false)

            console.log(`Successfully created ${result.count} assignment${result.count !== 1 ? 's' : ''}`)
        } catch (error) {
            console.error('Error creating assignment:', error)
            alert(`Failed to create assignment: ${error.message || 'Please try again.'}`)
        } finally {
            setSaving(false)
            setLoadingStates(prev => ({ ...prev, creatingAssignment: false }))
        }
    }

    // Simplified form submission handler (NEW)
    const createAssignmentSimplified = async (data: any) => {
        try {
            setSaving(true)
            setLoadingStates(prev => ({ ...prev, creatingAssignment: true }))

            // Get the package class count for monthly assignments
            const selectedPackage = packages.find(p => p.id === data.package_id)
            const totalClasses = selectedPackage?.class_count || 1

            // Convert simplified form data to service format
            const formPayload: any = {
                assignment_type: data.assignment_type,
                booking_id: data.booking_id,
                booking_ids: [data.booking_id],
                package_id: data.package_id || '',
                class_type_id: '',
                instructor_id: data.instructor_id,
                start_date: data.start_date,
                date: data.start_date,
                start_time: data.start_time,
                end_time: data.end_time,
                duration: 60,
                end_date: '',
                day_of_week: 0,
                day_of_month: 1,
                weekly_days: data.weekly_days || [],
                payment_amount: data.payment_amount,
                booking_type: data.booking_type,
                notes: data.notes || '',
                monthly_assignment_method: 'weekly_recurrence',
                course_duration_value: 1,
                course_duration_unit: 'months' as 'months',
                payment_type: 'per_class' as any,
                class_frequency: 'weekly' as any,
                specific_days: [],
                timeline_description: '',
                total_classes: totalClasses,
                timezone: 'UTC+5:30',
                manual_selections: [],
                client_name: '',
                client_email: '',
                selected_template_id: '',
                validity_end_date: '',
                recurrence_type: 'monthly',
                recurrence_interval: 1,
                link_booking: true
            }

            const result = await AssignmentCreationService.createAssignment(formPayload, packages, 1)

            // If mark_recurring flag, update booking
            if (data.mark_recurring && data.booking_id) {
                try {
                    await supabase
                        .from('bookings')
                        .update({
                            is_recurring: true,
                            billing_cycle_anchor: data.start_date,
                            class_package_id: data.package_id || null
                        })
                        .eq('booking_id', data.booking_id)
                } catch (err) {
                    console.warn('Failed to mark booking as recurring:', err)
                }
            }

            await fetchData()
            setShowAssignForm(false)

            alert(`Successfully created ${result.count} assignment${result.count !== 1 ? 's' : ''}!`)
        } catch (error) {
            console.error('Error creating assignment:', error)
            alert(`Failed to create assignment: ${error.message || 'Please try again.'}`)
        } finally {
            setSaving(false)
            setLoadingStates(prev => ({ ...prev, creatingAssignment: false }))
        }
    }

    // Save assignment function
    const saveAssignment = async (assignmentId: string, updates: Partial<ClassAssignment>) => {
        try {
            setLoadingStates(prev => ({ ...prev, updatingStatus: true }))

            // Clean the updates object to only include valid database fields
            const cleanUpdates: any = {}

            // Only include fields that exist in the database
            if (updates.class_status !== undefined) cleanUpdates.class_status = updates.class_status
            if (updates.payment_amount !== undefined) cleanUpdates.payment_amount = updates.payment_amount
            if (updates.payment_status !== undefined) cleanUpdates.payment_status = updates.payment_status
            if (updates.notes !== undefined) cleanUpdates.notes = updates.notes

            // Note: booking_id is no longer handled here since we use the junction table
            // assignment_bookings for multiple booking support

            console.log('Updating assignment with:', cleanUpdates)

            const { error } = await supabase
                .from('class_assignments')
                .update(cleanUpdates)
                .eq('id', assignmentId)

            if (error) {
                console.error('Supabase update error:', error)
                throw error
            }

            // Refresh data to update the UI
            await fetchData()

            console.log('Assignment updated successfully')
        } catch (error) {
            console.error('Error updating assignment:', error)
            throw error
        } finally {
            setLoadingStates(prev => ({ ...prev, updatingStatus: false }))
        }
    }

    // Filter management
    const clearAllFilters = () => {
        setFilters({
            dateRange: { start: '', end: '' },
            assignmentTypes: [],
            classStatus: [],
            paymentStatus: [],
            instructors: [],
            classTypes: [],
            packages: [],
            clientName: '',
            weeklyClasses: false
        })
        setSearchTerm('')
    }

    return (
        <div className="px-0 sm:px-6 py-6 sm:max-w-7xl max-w-full sm:mx-auto mx-0 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900">Class Assignment Manager</h1>
                    <p className="text-gray-600">Manage class assignments, schedules, and payments</p>
                </div>

                {/* Desktop / wide screens: original large CTAs */}
                <div className="hidden sm:flex w-full sm:w-auto items-center justify-center sm:justify-end space-x-3 mt-2 sm:mt-0">
                    <ResponsiveActionButton className="inline-flex items-center px-4 py-2 text-sm whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 shadow-none transform-none" onClick={() => fetchData()} disabled={loadingStates.fetchingData}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingStates.fetchingData ? 'animate-spin' : ''}`} />
                        Refresh
                    </ResponsiveActionButton>
                    <ResponsiveActionButton className="inline-flex items-center px-4 py-2 text-sm whitespace-nowrap bg-purple-600 text-white hover:bg-purple-700 shadow-none transform-none" onClick={() => setShowInvoiceModal(true)} disabled={generatingInvoices}>
                        <FileText className="w-4 h-4 mr-2" />
                        {generatingInvoices ? 'Generating...' : 'Generate Invoices'}
                    </ResponsiveActionButton>
                    <ResponsiveActionButton className="inline-flex items-center px-4 py-2 text-sm whitespace-nowrap bg-emerald-500 text-white hover:bg-emerald-600 shadow-none transform-none" onClick={() => { setShowAssignForm(true); setAssignModalMode('chooser'); setAssignInitialBookingId('') }}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Assignment
                    </ResponsiveActionButton>
                    <ResponsiveActionButton className="inline-flex items-center px-4 py-2 text-sm whitespace-nowrap bg-yellow-500 text-white hover:bg-yellow-600 shadow-none transform-none" onClick={() => setShowBulkAddModal(true)}>
                        Bulk Add to Group
                    </ResponsiveActionButton>
                </div>

                {/* Mobile compact toolbar: small icons only */}
                <div className="flex sm:hidden items-center space-x-2">
                    <button
                        aria-label="refresh"
                        className="p-2 bg-white rounded-lg shadow-sm"
                        onClick={() => fetchData()}
                    >
                        <RefreshCw className={`w-5 h-5 ${loadingStates.fetchingData ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        aria-label="invoices"
                        className="p-2 bg-white rounded-lg shadow-sm"
                        onClick={() => setShowInvoiceModal(true)}
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    <button
                        aria-label="bulk add"
                        className="p-2 bg-white rounded-lg shadow-sm"
                        onClick={() => setShowBulkAddModal(true)}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Mobile FAB: new assignment (floating) */}
            <button
                className="fixed bottom-28 right-4 z-50 sm:hidden bg-teal-500 text-white px-4 py-3 rounded-full shadow-lg text-lg"
                onClick={() => { setShowAssignForm(true); setAssignModalMode('chooser'); setAssignInitialBookingId('') }}
                aria-label="New Assignment"
            >
                +
            </button>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative sticky top-16 z-40 sm:static bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(true)}>
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {Object.values(filters).some(filter =>
                            Array.isArray(filter) ? filter.length > 0 :
                                typeof filter === 'object' ? Object.values(filter).some(v => v) :
                                    filter
                        ) && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            )}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="sm:bg-white sm:rounded-lg sm:shadow">
                {/* View Toggle */}
                <div className="relative border-b border-gray-200 px-4 sm:px-6 py-4">
                    {/* Inject small component-scoped CSS to hide webkit scrollbars for this row */}
                    <style>{`.class-assignment-hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
                    <div className="flex items-center justify-between gap-3">
                        <div
                            className="overflow-x-auto class-assignment-hide-scrollbar px-0"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            ref={tabsScrollRef}
                            onScroll={updateTabsIndicator}
                        >
                            <div className="flex items-center space-x-2 whitespace-nowrap">
                                <button
                                    onClick={() => setActiveView('list')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center whitespace-nowrap ${activeView === 'list'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <List className="w-4 h-4 mr-1" />
                                    List
                                </button>
                                <button
                                    onClick={() => setActiveView('calendar')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center whitespace-nowrap ${activeView === 'calendar'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Calendar
                                </button>
                                <button
                                    onClick={() => setActiveView('analytics')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center whitespace-nowrap ${activeView === 'analytics'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <BarChart3 className="w-4 h-4 mr-1" />
                                    Analytics
                                </button>
                            </div>
                        </div>

                        {/* No custom scroll indicator on small screens; native scrolling remains functional but scrollbar hidden */}

                        {activeView === 'list' && (
                            <div className="flex-shrink-0 flex items-center space-x-2">
                                {filteredAssignments.length > 0 && (
                                    <span className="hidden sm:inline text-sm text-gray-500">
                                        {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                                <button
                                    onClick={toggleSelectMode}
                                    className={`px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm font-medium rounded-full flex items-center whitespace-nowrap border ${isSelectMode ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {isSelectMode ? (
                                        <>
                                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                                            <span className="hidden sm:inline">Cancel</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                                            <span className="hidden sm:inline">Select</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bulk Actions Toolbar */}
                    {isSelectMode && selectedAssignments.size > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">
                                    {selectedAssignments.size} assignment{selectedAssignments.size !== 1 ? 's' : ''} selected
                                </span>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={clearAllSelections}>
                                        Clear
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={selectAllFilteredAssignments}>
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={deleteBulkAssignments}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete Selected
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className={activeView === 'analytics' ? '' : 'px-0 sm:px-6 py-6'}>
                    {activeView === 'list' && (
                        <AssignmentListView
                            loading={loading}
                            groupedAssignments={groupedAssignments}
                            isSelectMode={isSelectMode}
                            selectedAssignments={selectedAssignments}
                            onToggleSelection={toggleAssignmentSelection}
                            onDeleteAssignment={deleteAssignment}
                            onOpenClassDetails={openClassDetails}
                        />
                    )}

                    {activeView === 'calendar' && (
                        <CalendarView
                            assignments={filteredAssignments}
                            isSelectMode={isSelectMode}
                            selectedAssignments={selectedAssignments}
                            onToggleSelection={toggleAssignmentSelection}
                            onDeleteAssignment={deleteAssignment}
                            onOpenClassDetails={openClassDetails}
                        />
                    )}

                    {activeView === 'analytics' && (
                        <AnalyticsView
                            assignments={assignments}
                            instructors={instructors}
                        />
                    )}
                </div>
            </div>

            {/* Assignment Form Modal: show chooser first, then relevant form */}
            {showAssignForm && assignModalMode === 'chooser' && (
                <NewAssignmentChooser
                    onClose={() => setShowAssignForm(false)}
                    onOpenSimplified={(bookingId?: string) => {
                        setAssignInitialBookingId(bookingId || '')
                        setAssignModalMode('simplified')
                    }}
                />
            )}

            {showAssignForm && assignModalMode === 'simplified' && (
                <SimplifiedAssignmentForm
                    isVisible={showAssignForm}
                    classTypes={classTypes}
                    packages={packages}
                    instructors={instructors}
                    bookings={bookings}
                    saving={saving}
                    onClose={() => { setShowAssignForm(false); setAssignModalMode('chooser'); setAssignInitialBookingId('') }}
                    onSubmit={createAssignmentSimplified}
                    onBookingCreated={fetchData}
                    initialSelectedBookingId={assignInitialBookingId}
                />
            )}

            {showAssignForm && assignModalMode === 'full' && (
                <AssignmentForm
                    isVisible={showAssignForm}
                    formData={formData}
                    errors={errors}
                    conflictWarning={conflictWarning}
                    classTypes={classTypes}
                    packages={packages}
                    instructors={instructors}
                    scheduleTemplates={scheduleTemplates}
                    bookings={bookings}
                    saving={saving}
                    onClose={() => { setShowAssignForm(false); setAssignModalMode('chooser'); setAssignInitialBookingId('') }}
                    onSubmit={createAssignment}
                    onInputChange={handleInputChange}
                    onTimeChange={handleTimeChange}
                    onDurationChange={handleDurationChange}
                />
            )}

            {showBulkAddModal && (
                <BulkAddUsersModal
                    isOpen={showBulkAddModal}
                    onClose={() => setShowBulkAddModal(false)}
                    assignments={assignments}
                    onDone={() => { fetchData(); setShowBulkAddModal(false) }}
                />
            )}

            {/* Advanced Filters Modal */}
            <AdvancedFilters
                isVisible={showFilters}
                filters={filters}
                classTypes={classTypes}
                instructors={instructors}
                packages={packages}
                onFiltersChange={setFilters}
                onClose={() => setShowFilters(false)}
                onClearAll={clearAllFilters}
            />

            {/* Class Details Popup */}
            <ClassDetailsPopup
                assignment={selectedClassDetails}
                isVisible={showClassDetailsPopup}
                onClose={closeClassDetails}
                onEdit={openEditAssignment}
            />

            {/* Edit Assignment Modal */}
            <EditAssignmentModal
                assignment={selectedEditAssignment}
                isVisible={showEditAssignmentModal}
                bookings={bookings}
                userProfiles={userProfiles}
                onClose={closeEditAssignment}
                onSave={saveAssignment}
                onRefresh={fetchData}
            />

            {/* Manual Invoice Generation Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Generate Monthly Invoices</h2>
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                                disabled={generatingInvoices}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            This will generate invoices for all active bookings for the specified month.
                            Use this for the first billing cycle. Subsequent months will be handled automatically by T-5 automation.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Calendar Month *
                            </label>
                            <input
                                type="month"
                                id="invoice-month"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={generatingInvoices}
                                defaultValue={new Date().toISOString().slice(0, 7)}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowInvoiceModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={generatingInvoices}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setGeneratingInvoices(true);
                                    const monthInput = document.getElementById('invoice-month') as HTMLInputElement;
                                    const calendarMonth = monthInput?.value || new Date().toISOString().slice(0, 7);

                                    try {
                                        // Call the RPC function to generate invoices
                                        const { data, error } = await supabase.rpc('generate_monthly_invoices', {
                                            p_calendar_month: calendarMonth
                                        });

                                        if (error) {
                                            alert('Error generating invoices: ' + error.message);
                                        } else {
                                            alert(`Successfully generated invoices for ${calendarMonth}. Generated: ${data || 0} invoices.`);
                                            setShowInvoiceModal(false);
                                            fetchData(); // Refresh the data
                                        }
                                    } catch (err) {
                                        alert('Exception generating invoices: ' + (err instanceof Error ? err.message : String(err)));
                                    } finally {
                                        setGeneratingInvoices(false);
                                    }
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                disabled={generatingInvoices}
                            >
                                {generatingInvoices ? 'Generating...' : 'Generate Invoices'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClassAssignmentManager
