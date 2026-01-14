import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Filter,
  Mail,
  PlusCircle,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { enqueueNotification } from '../../../../services/enqueueBookingConfirmationEmail'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { UserRole } from '../../../../shared/config/roleConfig'
import { supabase } from '../../../../shared/lib/supabase'
import { hasPermission } from '../../../../shared/utils/permissions'
import AssignmentBookingsService from '../../services/v2/assignment-bookings.service'
import AssignToProgram from './ClassesV2/components/modals/AssignToProgram'

interface ClassPackage {
  id: string
  name: string
  description?: string
  price?: number
  class_count?: number
  validity_days?: number
  type?: string
  duration?: string
  course_type?: string
  is_archived?: boolean
}

interface Booking {
  id: string
  booking_id?: string
  user_id: string
  class_name: string
  instructor: string
  class_date: string
  class_time: string
  first_name: string
  last_name: string
  email: string
  phone: string
  experience_level: string
  special_requests: string
  emergency_contact: string
  emergency_phone: string
  status: string
  created_at: string
  updated_at: string
  access_status?: string
  is_recurring?: boolean
  billing_cycle_anchor?: string | null
  timezone?: string
  goals?: string
  preferred_days?: string[]
  preferred_times?: string[]
  package_type?: string
  booking_notes?: string
  class_packages?: ClassPackage | null // This will contain the joined package data
  // Optional cancellation fields
  cancel_token?: string | null
  cancel_token_expires_at?: string | null
  user_cancelled?: boolean
  cancelled_by?: string | null
  cancelled_at?: string | null
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allPackages, setAllPackages] = useState<ClassPackage[]>([]) // For the edit dropdown
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<ClassPackage | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [bookingNumberFilter, setBookingNumberFilter] = useState('')
  const [bookingSort, setBookingSort] = useState<'asc' | 'desc' | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const [isNotifying, setIsNotifying] = useState(false)
  const [updatedBooking, setUpdatedBooking] = useState<Partial<Booking>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false)
  const bookingsService = useMemo(() => new AssignmentBookingsService(), [])
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | undefined>(undefined)
  const location = useLocation()

  useEffect(() => {
    fetchBookings()
    fetchAllPackages() // Still need this for the edit dropdown
      // fetch current user's role for permission checks
      ; (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            setCurrentUserRole(profile?.role)
          }
        } catch (err) {
          // ignore
        }
      })()
  }, [])

  // If the URL contains a booking_id query param, open details modal (deep link)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const bid = params.get('booking_id') || params.get('bookingId')
    if (!bid) return

    // If bookings already loaded, try to find and open
    if (bookings && bookings.length > 0) {
      const found = bookings.find(b => (b.booking_id && b.booking_id === bid) || b.id === bid)
      if (found) {
        handleViewBooking(found)
        return
      }
    }

    // Fallback: fetch bookings and try again
    (async () => {
      try {
        await fetchBookings()
        const fresh = (bookings || []).find(b => (b.booking_id && b.booking_id === bid) || b.id === bid)
        if (fresh) handleViewBooking(fresh)
      } catch (e) {
        // ignore
      }
    })()
  }, [location.search])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          class_packages(id, name, description, price, class_count, validity_days, type, duration, course_type)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Still need to fetch all packages for the edit dropdown
  const fetchAllPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('class_packages')
        .select('id, name, description, price, class_count, validity_days, type, duration, course_type, is_archived')
        .eq('is_archived', false)
        .eq('is_active', true)

      if (error) throw error
      setAllPackages(data || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  // Helper function to get package name - now much simpler
  const getPackageName = (booking: Booking): string => {
    if (!booking.class_packages) return 'Not provided'
    return booking.class_packages.name
  }

  // Helper function to handle package click
  const handlePackageClick = (booking: Booking) => {
    if (booking.class_packages) {
      setSelectedPackage(booking.class_packages)
    }
  }

  // Helper function to format currency
  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Fetch programs this booking is already assigned to
  const fetchAssignedPrograms = async (bookingId: string) => {
    setIsLoadingPrograms(true)
    try {
      const res = await bookingsService.getProgramsForBooking(bookingId)
      if (res && res.success) {
        setAssignedPrograms(res.data || [])
      } else {
        setAssignedPrograms([])
      }
    } catch (err) {
      console.error('Error fetching assigned programs:', err)
      setAssignedPrograms([])
    } finally {
      setIsLoadingPrograms(false)
    }
  }


  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsEditing(false)
    setUpdatedBooking({})
  }

  // When a booking is selected, fetch its assigned programs
  useEffect(() => {
    if (selectedBooking && selectedBooking.id) {
      fetchAssignedPrograms(selectedBooking.id)
    } else {
      setAssignedPrograms([])
    }
  }, [selectedBooking])

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsEditing(true)
    setUpdatedBooking({
      class_name: booking.class_name,
      instructor: booking.instructor,
      class_date: booking.class_date,
      class_time: booking.class_time,
      status: booking.status,
      special_requests: booking.special_requests,
      package_type: booking.package_type,
    })
  }

  const handleDeleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBookings(bookings.filter(booking => booking.id !== id))
      setShowConfirmDelete(null)
      setSelectedBooking(null)

      setSuccessMessage('Booking deleted successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  const handleRevokeToken = async (id: string) => {
    try {
      const confirmed = window.confirm('Revoke cancellation token for this booking?')
      if (!confirmed) return

      // Prompt admin for optional reason (stored in audit log)
      const reason = window.prompt('Reason for revoking cancel token (optional)') || null
      // Call server-side revoke function so we don't rely on client DB privileges
      const payload = { id, reason }
      const res = await supabase.functions.invoke('revoke-cancel-token', { body: payload })

      if ((res as any).error) {
        throw (res as any).error
      }

      setBookings(bookings.map(b => b.id === id ? { ...b, cancel_token: null, cancel_token_expires_at: null } : b))
      setSuccessMessage('Cancel token revoked')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error revoking token:', err)
    }
  }

  const handleUnassignFromProgram = async (containerId: string) => {
    if (!selectedBooking) return
    try {
      const res = await bookingsService.unassignBookingFromProgram(containerId, selectedBooking.id)
      if (res && res.success) {
        setSuccessMessage('Booking unassigned from program')
        setTimeout(() => setSuccessMessage(''), 3000)
        // refresh assigned programs
        fetchAssignedPrograms(selectedBooking.id)
      } else {
        console.error('Failed to unassign booking', res)
      }
    } catch (err) {
      console.error('Error unassigning booking:', err)
    }
  }

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      // When admin cancels a booking via this action, record cancelled_by = 'admin'
      const updatePayload: any = { status }
      if (status === 'cancelled' || status === 'canceled') updatePayload.cancelled_by = 'admin'
      else updatePayload.cancelled_by = null

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', id)

      if (error) throw error

      // Update local state
      setBookings(bookings.map(booking =>
        booking.id === id ? { ...booking, ...updatePayload } : booking
      ))

      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, ...updatePayload })
      }

      setSuccessMessage(`Booking status updated to ${status}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  const handleSaveBooking = async () => {
    if (!selectedBooking) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update(updatedBooking)
        .eq('id', selectedBooking.id)

      if (error) throw error

      // If package was updated, we need to refresh the booking data to get the new joined package info
      if (updatedBooking.package_type && updatedBooking.package_type !== selectedBooking.package_type) {
        await fetchBookings()
        // Find the updated booking from the fresh data
        const refreshedBooking = bookings.find(b => b.id === selectedBooking.id)
        if (refreshedBooking) {
          setSelectedBooking(refreshedBooking)
        }
      } else {
        // Update local state for other fields
        const updatedBookings = bookings.map(booking =>
          booking.id === selectedBooking.id
            ? { ...booking, ...updatedBooking }
            : booking
        )

        setBookings(updatedBookings)
        setSelectedBooking({ ...selectedBooking, ...updatedBooking })
      }

      setIsEditing(false)
      setUpdatedBooking({})

      setSuccessMessage('Booking updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const sendNotification = async () => {
    if (!selectedBooking) return

    setIsNotifying(true)
    try {
      await enqueueNotification({
        channel: 'email',
        recipient: selectedBooking.email,
        subject: `Update regarding your booking ${selectedBooking.id}`,
        html: `<p>This is a notification regarding your booking ${selectedBooking.id}.</p>`,
        metadata: { booking_id: selectedBooking.id, notification_type: 'admin_notification' }
      })

      setSuccessMessage(`Notification queued for ${selectedBooking.email}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error sending notification:', error)
    } finally {
      setIsNotifying(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessStatusBadge = (access_status?: string) => {
    if (!access_status) return null

    const config = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: '✓' },
      overdue_grace: { color: 'bg-yellow-100 text-yellow-800', label: 'Grace Period', icon: '⚠' },
      overdue_locked: { color: 'bg-red-100 text-red-800', label: 'Locked', icon: '🔒' }
    }

    const cfg = config[access_status as keyof typeof config] || config.active
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${cfg.color}`}>
        <span>{cfg.icon}</span>
        {cfg.label}
      </span>
    )
  }

  // Filter bookings based on search term, booking-number filter and other filters
  let filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' ||
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.class_name.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = false
    if (statusFilter === 'all') matchesStatus = true
    else if (statusFilter === 'user_cancelled') {
      // user-cancelled: status is cancelled and cancel token is null/expired
      const s = String(booking.status || '').toLowerCase()
      const isCancelled = s === 'cancelled' || s === 'canceled'
      const hasValidToken = !!booking.cancel_token && !!booking.cancel_token_expires_at && new Date(String(booking.cancel_token_expires_at)).getTime() > Date.now()
      matchesStatus = isCancelled && !hasValidToken
    } else {
      matchesStatus = booking.status === statusFilter
    }

    let matchesDate = true
    const bookingDate = new Date(booking.class_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dateFilter === 'today') {
      const todayStr = today.toISOString().split('T')[0]
      matchesDate = booking.class_date === todayStr
    } else if (dateFilter === 'upcoming') {
      matchesDate = bookingDate >= today
    } else if (dateFilter === 'past') {
      matchesDate = bookingDate < today
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // Apply booking number filtering if present
  if (bookingNumberFilter && bookingNumberFilter.trim() !== '') {
    const q = bookingNumberFilter.trim().toLowerCase()
    filteredBookings = filteredBookings.filter(b => (b.booking_id || b.id || '').toLowerCase().includes(q))
  }

  // Apply sorting by booking number when requested
  const displayedBookings = bookingSort ? [...filteredBookings].sort((a, b) => {
    const aKey = (a.booking_id || a.id || '').toLowerCase()
    const bKey = (b.booking_id || b.id || '').toLowerCase()
    if (aKey < bKey) return bookingSort === 'asc' ? -1 : 1
    if (aKey > bKey) return bookingSort === 'asc' ? 1 : -1
    return 0
  }) : filteredBookings

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          Booking Management ({bookings.length})
        </h2>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Booking number filter */}
          <div className="w-56">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by Booking #"
                value={bookingNumberFilter}
                onChange={(e) => setBookingNumberFilter(e.target.value)}
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="user_cancelled">User Cancelled</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">Try changing your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => setBookingSort(prev => prev === 'asc' ? 'desc' : (prev === 'desc' ? null : 'asc'))}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Booking Number</span>
                      <span className="text-xs text-gray-400">{bookingSort === 'asc' ? '▲' : bookingSort === 'desc' ? '▼' : ''}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.first_name} {booking.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{booking.email}</div>
                        {booking.phone && <div className="text-sm text-gray-500">{booking.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/dashboard/booking_management?booking_id=${encodeURIComponent(booking.booking_id || booking.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-left inline-block"
                        onClick={(e) => {
                          // allow same-tab opening via click with ctrl/meta not pressed
                          if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
                          e.preventDefault()
                          handleViewBooking(booking)
                        }}
                      >
                        <div className="text-sm text-blue-600 hover:underline">{booking.booking_id || booking.id}</div>
                        <div className="text-xs text-gray-500">Open in new tab</div>
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.class_name}</div>
                      <div className="text-sm text-gray-500">{booking.instructor}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(booking.class_date)}</div>
                      <div className="text-sm text-gray-500">{booking.class_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAccessStatusBadge(booking.access_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBooking(booking)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Confirm button for pending bookings */}
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Confirm Booking"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Mark completed for confirmed bookings */}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel button for pending and confirmed */}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Cancel Booking"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {/* Revoke cancel token (admin) */}
                        <button
                          onClick={() => handleRevokeToken(booking.id)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Revoke Cancel Token"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setShowConfirmDelete(booking.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteBooking(showConfirmDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Booking' : 'Booking Details'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedBooking(null)
                    setIsEditing(false)
                    setUpdatedBooking({})
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class
                    </label>
                    <input
                      type="text"
                      value={updatedBooking.class_name || ''}
                      onChange={(e) => setUpdatedBooking({ ...updatedBooking, class_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={updatedBooking.instructor || ''}
                      onChange={(e) => setUpdatedBooking({ ...updatedBooking, instructor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={updatedBooking.class_date || ''}
                        onChange={(e) => setUpdatedBooking({ ...updatedBooking, class_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="text"
                        value={updatedBooking.class_time || ''}
                        onChange={(e) => setUpdatedBooking({ ...updatedBooking, class_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={updatedBooking.status || ''}
                      onChange={(e) => setUpdatedBooking({ ...updatedBooking, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package
                    </label>
                    <select
                      value={updatedBooking.package_type || ''}
                      onChange={(e) => setUpdatedBooking({ ...updatedBooking, package_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a package</option>
                      {allPackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      value={updatedBooking.special_requests || ''}
                      onChange={(e) => setUpdatedBooking({ ...updatedBooking, special_requests: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setUpdatedBooking({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveBooking}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{selectedBooking.first_name} {selectedBooking.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedBooking.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedBooking.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Experience Level</p>
                        <p className="font-medium capitalize">{selectedBooking.experience_level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Class Details */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Class Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Class</p>
                        <p className="font-medium">{selectedBooking.class_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Instructor</p>
                        <p className="font-medium">{selectedBooking.instructor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(selectedBooking.class_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{selectedBooking.class_time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Additional Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedBooking.status)}`}>
                            {selectedBooking.status.replace('_', ' ')}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Special Requests</p>
                        <p className="text-gray-700">{selectedBooking.special_requests || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="font-medium">{selectedBooking.emergency_contact || 'Not provided'}</p>
                        <p className="text-sm text-gray-700">{selectedBooking.emergency_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Booking Date</p>
                        <p className="font-medium">{formatDate(selectedBooking.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time Zone</p>
                        <p className="font-medium">{selectedBooking.timezone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Goals</p>
                        <p className="font-medium">{selectedBooking.goals || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Preferred Days</p>
                        <p className="font-medium">{selectedBooking.preferred_days?.join(', ') || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Preferred Times</p>
                        <p className="font-medium">{selectedBooking.preferred_times?.join(', ') || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Package</p>
                        <button
                          onClick={() => handlePackageClick(selectedBooking)}
                          className="font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          disabled={!selectedBooking.class_packages}
                        >
                          {getPackageName(selectedBooking)}
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Health Conditions / Notes</p>
                        <p className="font-medium">{selectedBooking.booking_notes || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Programs */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2 flex items-center justify-between">
                      <span>Assigned Programs</span>
                      {isLoadingPrograms && <div className="text-sm text-gray-500">Loading...</div>}
                    </h4>

                    {assignedPrograms.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Not assigned to any program yet</p>
                        {hasPermission(currentUserRole, 'bookings', 'assign') && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAssignModalOpen(true)}
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Assign to Program
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assignedPrograms.map((program) => (
                          <div key={program.container_id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">{program.container_name}</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div>
                                    <span className="text-gray-500">Package:</span> {program.package_name}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Instructor:</span> {program.instructor_name || 'TBD'}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Schedule:</span> {program.schedule}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Capacity:</span>{' '}
                                    <span className={program.enrolled_count >= program.capacity ? 'text-red-600 font-medium' : ''}>
                                      {program.enrolled_count}/{program.capacity}
                                    </span>
                                  </div>
                                </div>
                                {program.next_class_date && (
                                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block">
                                    Next class: {formatDate(program.next_class_date)} at {program.next_class_time}
                                  </div>
                                )}
                              </div>
                              {hasPermission(currentUserRole, 'bookings', 'unassign') && (
                                <Button variant="outline" size="sm" onClick={() => handleUnassignFromProgram(program.container_id)} className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t pt-4 flex flex-wrap gap-3 justify-end">
                    {hasPermission(currentUserRole, 'bookings', 'assign') && (selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Assign to Program
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBooking(selectedBooking)}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    {/* Show confirm button for pending bookings */}
                    {selectedBooking.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'confirmed')}
                        className="flex items-center bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm Booking
                      </Button>
                    )}

                    {/* Show completed/reschedule buttons for confirmed bookings */}
                    {selectedBooking.status === 'confirmed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'completed')}
                          className="flex items-center text-blue-700 hover:bg-blue-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Completed
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'rescheduled')}
                          className="flex items-center text-yellow-700 hover:bg-yellow-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Mark Rescheduled
                        </Button>
                      </>
                    )}

                    {/* Show cancel button for pending and confirmed bookings */}
                    {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="flex items-center text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel Booking
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendNotification}
                      disabled={isNotifying}
                      className="flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {isNotifying ? 'Sending...' : 'Notify Customer'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowConfirmDelete(selectedBooking.id)}
                      className="flex items-center bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Package Details Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedPackage.name}</h4>
                  {selectedPackage.description && (
                    <p className="text-gray-600 text-sm">{selectedPackage.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Price</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedPackage.price)}</p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Classes</p>
                    <p className="text-lg font-bold text-green-900">
                      {selectedPackage.class_count ? `${selectedPackage.class_count} classes` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Validity</p>
                    <p className="text-lg font-bold text-orange-900">
                      {selectedPackage.validity_days ? `${selectedPackage.validity_days} days` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Duration</p>
                    <p className="text-lg font-bold text-purple-900">
                      {selectedPackage.duration || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Package Type</p>
                    <p className="text-gray-900 capitalize">{selectedPackage.type || 'Not specified'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Course Type</p>
                    <p className="text-gray-900 capitalize">{selectedPackage.course_type || 'Not specified'}</p>
                  </div>
                </div>

                {selectedPackage.class_count && selectedPackage.price && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Price per Class</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(selectedPackage.price / selectedPackage.class_count)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPackage(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assign To Program Modal */}
      {isAssignModalOpen && selectedBooking && (
        <AssignToProgram
          booking={selectedBooking}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          bookingsService={bookingsService}
          onSuccess={() => {
            if (selectedBooking) fetchAssignedPrograms(selectedBooking.id)
            setIsAssignModalOpen(false)
            setSuccessMessage('Booking assigned to program successfully')
            setTimeout(() => setSuccessMessage(''), 3000)
          }}
        />
      )}
    </div>
  )
}

export default BookingManagement;