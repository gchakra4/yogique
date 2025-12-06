import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AlertTriangle, Calendar, CheckCircle, Edit, Eye, Filter, Mail, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
export function BookingManagement() {
    const [bookings, setBookings] = useState([]);
    const [allPackages, setAllPackages] = useState([]); // For the edit dropdown
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [showConfirmDelete, setShowConfirmDelete] = useState(null);
    const [isNotifying, setIsNotifying] = useState(false);
    const [updatedBooking, setUpdatedBooking] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    useEffect(() => {
        fetchBookings();
        fetchAllPackages(); // Still need this for the edit dropdown
    }, []);
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          class_packages(id, name, description, price, class_count, validity_days, type, duration, course_type)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setBookings(data || []);
        }
        catch (error) {
            console.error('Error fetching bookings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Still need to fetch all packages for the edit dropdown
    const fetchAllPackages = async () => {
        try {
            const { data, error } = await supabase
                .from('class_packages')
                .select('id, name, description, price, class_count, validity_days, type, duration, course_type, is_archived')
                .eq('is_archived', false)
                .eq('is_active', true);
            if (error)
                throw error;
            setAllPackages(data || []);
        }
        catch (error) {
            console.error('Error fetching packages:', error);
        }
    };
    // Helper function to get package name - now much simpler
    const getPackageName = (booking) => {
        if (!booking.class_packages)
            return 'Not provided';
        return booking.class_packages.name;
    };
    // Helper function to handle package click
    const handlePackageClick = (booking) => {
        if (booking.class_packages) {
            setSelectedPackage(booking.class_packages);
        }
    };
    // Helper function to format currency
    const formatCurrency = (amount) => {
        if (!amount)
            return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };
    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setIsEditing(false);
        setUpdatedBooking({});
    };
    const handleEditBooking = (booking) => {
        setSelectedBooking(booking);
        setIsEditing(true);
        setUpdatedBooking({
            class_name: booking.class_name,
            instructor: booking.instructor,
            class_date: booking.class_date,
            class_time: booking.class_time,
            status: booking.status,
            special_requests: booking.special_requests,
            package_type: booking.package_type,
        });
    };
    const handleDeleteBooking = async (id) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            setBookings(bookings.filter(booking => booking.id !== id));
            setShowConfirmDelete(null);
            setSelectedBooking(null);
            setSuccessMessage('Booking deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (error) {
            console.error('Error deleting booking:', error);
        }
    };
    const handleRevokeToken = async (id) => {
        try {
            const confirmed = window.confirm('Revoke cancellation token for this booking?');
            if (!confirmed)
                return;
            // Prompt admin for optional reason (stored in audit log)
            const reason = window.prompt('Reason for revoking cancel token (optional)') || null;
            // Call server-side revoke function so we don't rely on client DB privileges
            const payload = { id, reason };
            const res = await supabase.functions.invoke('revoke-cancel-token', { body: payload });
            if (res.error) {
                throw res.error;
            }
            setBookings(bookings.map(b => b.id === id ? { ...b, cancel_token: null, cancel_token_expires_at: null } : b));
            setSuccessMessage('Cancel token revoked');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (err) {
            console.error('Error revoking token:', err);
        }
    };
    const handleUpdateBookingStatus = async (id, status) => {
        try {
            // When admin cancels a booking via this action, record cancelled_by = 'admin'
            const updatePayload = { status };
            if (status === 'cancelled' || status === 'canceled')
                updatePayload.cancelled_by = 'admin';
            else
                updatePayload.cancelled_by = null;
            const { error } = await supabase
                .from('bookings')
                .update(updatePayload)
                .eq('id', id);
            if (error)
                throw error;
            // Update local state
            setBookings(bookings.map(booking => booking.id === id ? { ...booking, ...updatePayload } : booking));
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking({ ...selectedBooking, ...updatePayload });
            }
            setSuccessMessage(`Booking status updated to ${status}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (error) {
            console.error('Error updating booking status:', error);
        }
    };
    const handleSaveBooking = async () => {
        if (!selectedBooking)
            return;
        try {
            const { error } = await supabase
                .from('bookings')
                .update(updatedBooking)
                .eq('id', selectedBooking.id);
            if (error)
                throw error;
            // If package was updated, we need to refresh the booking data to get the new joined package info
            if (updatedBooking.package_type && updatedBooking.package_type !== selectedBooking.package_type) {
                await fetchBookings();
                // Find the updated booking from the fresh data
                const refreshedBooking = bookings.find(b => b.id === selectedBooking.id);
                if (refreshedBooking) {
                    setSelectedBooking(refreshedBooking);
                }
            }
            else {
                // Update local state for other fields
                const updatedBookings = bookings.map(booking => booking.id === selectedBooking.id
                    ? { ...booking, ...updatedBooking }
                    : booking);
                setBookings(updatedBookings);
                setSelectedBooking({ ...selectedBooking, ...updatedBooking });
            }
            setIsEditing(false);
            setUpdatedBooking({});
            setSuccessMessage('Booking updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (error) {
            console.error('Error updating booking:', error);
        }
    };
    const sendNotification = async () => {
        if (!selectedBooking)
            return;
        setIsNotifying(true);
        try {
            // This would typically call an API or Edge Function
            // For now we'll simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccessMessage(`Notification sent to ${selectedBooking.email}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (error) {
            console.error('Error sending notification:', error);
        }
        finally {
            setIsNotifying(false);
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 text-orange-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    // Filter bookings based on search term and filters
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = searchTerm === '' ||
            `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.class_name.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesStatus = false;
        if (statusFilter === 'all')
            matchesStatus = true;
        else if (statusFilter === 'user_cancelled') {
            // user-cancelled: status is cancelled and cancel token is null/expired
            const s = String(booking.status || '').toLowerCase();
            const isCancelled = s === 'cancelled' || s === 'canceled';
            const hasValidToken = !!booking.cancel_token && !!booking.cancel_token_expires_at && new Date(String(booking.cancel_token_expires_at)).getTime() > Date.now();
            matchesStatus = isCancelled && !hasValidToken;
        }
        else {
            matchesStatus = booking.status === statusFilter;
        }
        let matchesDate = true;
        const bookingDate = new Date(booking.class_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateFilter === 'today') {
            const todayStr = today.toISOString().split('T')[0];
            matchesDate = booking.class_date === todayStr;
        }
        else if (dateFilter === 'upcoming') {
            matchesDate = bookingDate >= today;
        }
        else if (dateFilter === 'past') {
            matchesDate = bookingDate < today;
        }
        return matchesSearch && matchesStatus && matchesDate;
    });
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "w-6 h-6 mr-2" }), "Booking Management (", bookings.length, ")"] }) }), successMessage && (_jsxs("div", { className: "bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex justify-between items-center", children: [_jsx("span", { children: successMessage }), _jsx("button", { onClick: () => setSuccessMessage(''), children: _jsx(X, { className: "w-4 h-4" }) })] })), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search by name, email, or class...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }) }), _jsx("div", { children: _jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white", children: [_jsx("option", { value: "all", children: "All Statuses" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "confirmed", children: "Confirmed" }), _jsx("option", { value: "cancelled", children: "Cancelled" }), _jsx("option", { value: "user_cancelled", children: "User Cancelled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "rescheduled", children: "Rescheduled" })] })] }) }), _jsx("div", { children: _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsxs("select", { value: dateFilter, onChange: (e) => setDateFilter(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white", children: [_jsx("option", { value: "all", children: "All Dates" }), _jsx("option", { value: "today", children: "Today" }), _jsx("option", { value: "upcoming", children: "Upcoming" }), _jsx("option", { value: "past", children: "Past" })] })] }) })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: filteredBookings.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No bookings found" }), _jsx("p", { className: "text-gray-600", children: "Try changing your search or filter criteria." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Customer" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Class" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date & Time" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredBookings.map((booking) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium text-gray-900", children: [booking.first_name, " ", booking.last_name] }), _jsx("div", { className: "text-sm text-gray-500", children: booking.email }), booking.phone && _jsx("div", { className: "text-sm text-gray-500", children: booking.phone })] }) }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("div", { className: "text-sm text-gray-900", children: booking.class_name }), _jsx("div", { className: "text-sm text-gray-500", children: booking.instructor })] }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("div", { className: "text-sm text-gray-900", children: formatDate(booking.class_date) }), _jsx("div", { className: "text-sm text-gray-500", children: booking.class_time })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`, children: booking.status.replace('_', ' ') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleViewBooking(booking), className: "text-blue-600 hover:text-blue-900 p-1", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleEditBooking(booking), className: "text-indigo-600 hover:text-indigo-900 p-1", title: "Edit Booking", children: _jsx(Edit, { className: "w-4 h-4" }) }), booking.status === 'pending' && (_jsx("button", { onClick: () => handleUpdateBookingStatus(booking.id, 'confirmed'), className: "text-green-600 hover:text-green-900 p-1", title: "Confirm Booking", children: _jsx(CheckCircle, { className: "w-4 h-4" }) })), booking.status === 'confirmed' && (_jsx("button", { onClick: () => handleUpdateBookingStatus(booking.id, 'completed'), className: "text-blue-600 hover:text-blue-900 p-1", title: "Mark as Completed", children: _jsx(CheckCircle, { className: "w-4 h-4" }) })), (booking.status === 'pending' || booking.status === 'confirmed') && (_jsx("button", { onClick: () => handleUpdateBookingStatus(booking.id, 'cancelled'), className: "text-red-600 hover:text-red-900 p-1", title: "Cancel Booking", children: _jsx(X, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => handleRevokeToken(booking.id), className: "text-yellow-600 hover:text-yellow-900 p-1", title: "Revoke Cancel Token", children: _jsx(AlertTriangle, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setShowConfirmDelete(booking.id), className: "text-red-600 hover:text-red-900 p-1", title: "Delete Booking", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, booking.id))) })] }) })) }), showConfirmDelete && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Confirm Deletion" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Are you sure you want to delete this booking? This action cannot be undone." }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx(Button, { variant: "outline", onClick: () => setShowConfirmDelete(null), children: "Cancel" }), _jsx(Button, { onClick: () => handleDeleteBooking(showConfirmDelete), className: "bg-red-600 hover:bg-red-700", children: "Delete" })] })] }) })), selectedBooking && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: isEditing ? 'Edit Booking' : 'Booking Details' }), _jsx("button", { onClick: () => {
                                            setSelectedBooking(null);
                                            setIsEditing(false);
                                            setUpdatedBooking({});
                                        }, className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }) }), _jsx("div", { className: "p-6", children: isEditing ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class" }), _jsx("input", { type: "text", value: updatedBooking.class_name || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, class_name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Instructor" }), _jsx("input", { type: "text", value: updatedBooking.instructor || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, instructor: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Date" }), _jsx("input", { type: "date", value: updatedBooking.class_date || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, class_date: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Time" }), _jsx("input", { type: "text", value: updatedBooking.class_time || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, class_time: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsxs("select", { value: updatedBooking.status || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, status: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "confirmed", children: "Confirmed" }), _jsx("option", { value: "cancelled", children: "Cancelled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "rescheduled", children: "Rescheduled" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Package" }), _jsxs("select", { value: updatedBooking.package_type || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, package_type: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select a package" }), allPackages.map((pkg) => (_jsx("option", { value: pkg.id, children: pkg.name }, pkg.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Special Requests" }), _jsx("textarea", { value: updatedBooking.special_requests || '', onChange: (e) => setUpdatedBooking({ ...updatedBooking, special_requests: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                    setIsEditing(false);
                                                    setUpdatedBooking({});
                                                }, children: "Cancel" }), _jsx(Button, { onClick: handleSaveBooking, children: "Save Changes" })] })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-md font-semibold text-gray-900 mb-3 border-b pb-2", children: "Customer Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Name" }), _jsxs("p", { className: "font-medium", children: [selectedBooking.first_name, " ", selectedBooking.last_name] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Email" }), _jsx("p", { className: "font-medium", children: selectedBooking.email })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Phone" }), _jsx("p", { className: "font-medium", children: selectedBooking.phone || 'Not provided' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Experience Level" }), _jsx("p", { className: "font-medium capitalize", children: selectedBooking.experience_level })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-md font-semibold text-gray-900 mb-3 border-b pb-2", children: "Class Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Class" }), _jsx("p", { className: "font-medium", children: selectedBooking.class_name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Instructor" }), _jsx("p", { className: "font-medium", children: selectedBooking.instructor })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Date" }), _jsx("p", { className: "font-medium", children: formatDate(selectedBooking.class_date) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Time" }), _jsx("p", { className: "font-medium", children: selectedBooking.class_time })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-md font-semibold text-gray-900 mb-3 border-b pb-2", children: "Additional Information" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Status" }), _jsx("p", { children: _jsx("span", { className: `inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedBooking.status)}`, children: selectedBooking.status.replace('_', ' ') }) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Special Requests" }), _jsx("p", { className: "text-gray-700", children: selectedBooking.special_requests || 'None' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Emergency Contact" }), _jsx("p", { className: "font-medium", children: selectedBooking.emergency_contact || 'Not provided' }), _jsx("p", { className: "text-sm text-gray-700", children: selectedBooking.emergency_phone || 'Not provided' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Booking Date" }), _jsx("p", { className: "font-medium", children: formatDate(selectedBooking.created_at) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Time Zone" }), _jsx("p", { className: "font-medium", children: selectedBooking.timezone || 'Not provided' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Goals" }), _jsx("p", { className: "font-medium", children: selectedBooking.goals || 'Not provided' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Preferred Days" }), _jsx("p", { className: "font-medium", children: selectedBooking.preferred_days?.join(', ') || 'Not provided' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Preferred Times" }), _jsx("p", { className: "font-medium", children: selectedBooking.preferred_times?.join(', ') || 'Not provided' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Package" }), _jsx("button", { onClick: () => handlePackageClick(selectedBooking), className: "font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer", disabled: !selectedBooking.class_packages, children: getPackageName(selectedBooking) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Health Conditions / Notes" }), _jsx("p", { className: "font-medium", children: selectedBooking.booking_notes || 'None' })] })] })] }), _jsxs("div", { className: "border-t pt-4 flex flex-wrap gap-3 justify-end", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditBooking(selectedBooking), className: "flex items-center", children: [_jsx(Edit, { className: "w-4 h-4 mr-1" }), "Edit"] }), selectedBooking.status === 'pending' && (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleUpdateBookingStatus(selectedBooking.id, 'confirmed'), className: "flex items-center bg-green-50 text-green-700 hover:bg-green-100", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-1" }), "Confirm Booking"] })), selectedBooking.status === 'confirmed' && (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleUpdateBookingStatus(selectedBooking.id, 'completed'), className: "flex items-center text-blue-700 hover:bg-blue-50", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-1" }), "Mark Completed"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleUpdateBookingStatus(selectedBooking.id, 'rescheduled'), className: "flex items-center text-yellow-700 hover:bg-yellow-50", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-1" }), "Mark Rescheduled"] })] })), (selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleUpdateBookingStatus(selectedBooking.id, 'cancelled'), className: "flex items-center text-red-700 hover:bg-red-50", children: [_jsx(X, { className: "w-4 h-4 mr-1" }), "Cancel Booking"] })), _jsxs(Button, { variant: "outline", size: "sm", onClick: sendNotification, disabled: isNotifying, className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-1" }), isNotifying ? 'Sending...' : 'Notify Customer'] }), _jsxs(Button, { size: "sm", onClick: () => setShowConfirmDelete(selectedBooking.id), className: "flex items-center bg-red-600 hover:bg-red-700", children: [_jsx(Trash2, { className: "w-4 h-4 mr-1" }), "Delete"] })] })] })) })] }) })), selectedPackage && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-md w-full mx-4", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Package Details" }), _jsx("button", { onClick: () => setSelectedPackage(null), className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }) }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-xl font-bold text-gray-900 mb-2", children: selectedPackage.name }), selectedPackage.description && (_jsx("p", { className: "text-gray-600 text-sm", children: selectedPackage.description }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-blue-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-blue-600 font-medium uppercase tracking-wide", children: "Price" }), _jsx("p", { className: "text-lg font-bold text-blue-900", children: formatCurrency(selectedPackage.price) })] }), _jsxs("div", { className: "bg-green-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-green-600 font-medium uppercase tracking-wide", children: "Classes" }), _jsx("p", { className: "text-lg font-bold text-green-900", children: selectedPackage.class_count ? `${selectedPackage.class_count} classes` : 'N/A' })] }), _jsxs("div", { className: "bg-orange-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-orange-600 font-medium uppercase tracking-wide", children: "Validity" }), _jsx("p", { className: "text-lg font-bold text-orange-900", children: selectedPackage.validity_days ? `${selectedPackage.validity_days} days` : 'N/A' })] }), _jsxs("div", { className: "bg-purple-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-purple-600 font-medium uppercase tracking-wide", children: "Duration" }), _jsx("p", { className: "text-lg font-bold text-purple-900", children: selectedPackage.duration || 'N/A' })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Package Type" }), _jsx("p", { className: "text-gray-900 capitalize", children: selectedPackage.type || 'Not specified' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Course Type" }), _jsx("p", { className: "text-gray-900 capitalize", children: selectedPackage.course_type || 'Not specified' })] })] }), selectedPackage.class_count && selectedPackage.price && (_jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 font-medium uppercase tracking-wide", children: "Price per Class" }), _jsx("p", { className: "text-sm font-bold text-gray-900", children: formatCurrency(selectedPackage.price / selectedPackage.class_count) })] }))] }), _jsx("div", { className: "mt-6 flex justify-end", children: _jsx(Button, { variant: "outline", onClick: () => setSelectedPackage(null), children: "Close" }) })] })] }) }))] }));
}
export default BookingManagement;
