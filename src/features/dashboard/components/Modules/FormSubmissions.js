import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle, Clock, Eye, FileText, Filter, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton';
import { supabase } from '../../../../shared/lib/supabase';
export function FormSubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [contactMessages, setContactMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [selectedContactMessage, setSelectedContactMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('submissions');
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch both form submissions and contact messages in parallel
            // Admins can see ALL contact messages (no user filtering)
            const [submissionsResponse, contactsResponse] = await Promise.all([
                supabase
                    .from('form_submissions')
                    .select('*')
                    .order('created_at', { ascending: false }),
                // For contact messages, admins see ALL messages including user_id
                supabase
                    .from('contact_messages')
                    .select('*') // Select all fields including user_id
                    .order('created_at', { ascending: false })
            ]);
            if (submissionsResponse.error)
                throw submissionsResponse.error;
            if (contactsResponse.error)
                throw contactsResponse.error;
            setSubmissions(submissionsResponse.data || []);
            setContactMessages(contactsResponse.data || []);
        }
        catch (error) {
            console.error('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleStatusUpdate = async (submissionId, newStatus, notes) => {
        try {
            if (activeTab === 'submissions') {
                const { error } = await supabase
                    .from('form_submissions')
                    .update({
                    status: newStatus,
                    notes: notes || null,
                    processed_by: (await supabase.auth.getUser()).data.user?.id,
                    processed_at: new Date().toISOString()
                })
                    .eq('id', submissionId);
                if (error)
                    throw error;
                await fetchData();
                setSelectedSubmission(null);
            }
            else {
                const { error } = await supabase
                    .from('contact_messages')
                    .update({
                    status: newStatus
                })
                    .eq('id', submissionId);
                if (error)
                    throw error;
                await fetchData();
                setSelectedContactMessage(null);
            }
            alert('Updated successfully!');
        }
        catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating: ' + (error.message || 'An unknown error occurred'));
        }
        finally {
            setLoading(false);
        }
    };
    const filteredSubmissions = submissions.filter(submission => {
        const typeMatch = selectedType === 'all' || submission.type === selectedType;
        const statusMatch = selectedStatus === 'all' || submission.status === selectedStatus;
        return typeMatch && statusMatch;
    });
    const filteredContacts = contactMessages.filter(message => {
        const statusMatch = selectedStatus === 'all' || message.status === selectedStatus;
        return statusMatch;
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'booking': return '📅';
            case 'query': return '❓';
            case 'contact': return '📧';
            case 'corporate': return '🏢';
            default: return '📄';
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(FileText, { className: "w-6 h-6 mr-2" }), activeTab === 'submissions' ?
                                `Form Submissions (${filteredSubmissions.length})` :
                                `Contact Messages (${filteredContacts.length})`] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { className: `px-4 py-2 rounded-lg transition-colors ${activeTab === 'submissions'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, onClick: () => setActiveTab('submissions'), children: "Form Submissions" }), _jsx("button", { className: `px-4 py-2 rounded-lg transition-colors ${activeTab === 'contacts'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, onClick: () => setActiveTab('contacts'), children: "Contact Messages" })] })] }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [_jsx(Filter, { className: "w-5 h-5 text-gray-400 hidden md:block" }), activeTab === 'submissions' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Type" }), _jsxs("select", { value: selectedType, onChange: (e) => setSelectedType(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "booking", children: "Booking" }), _jsx("option", { value: "query", children: "Query" }), _jsx("option", { value: "contact", children: "Contact" }), _jsx("option", { value: "corporate", children: "Corporate" })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsxs("select", { value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "new", children: "New" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "rejected", children: "Rejected" })] })] })] }) }), activeTab === 'submissions' ? (
            /* Form Submissions List */
            _jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: filteredSubmissions.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No submissions found" }), _jsx("p", { className: "text-gray-600", children: "No form submissions match your current filters." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Submission" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Contact" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredSubmissions.map((submission) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-2xl mr-3", children: getTypeIcon(submission.type) }), _jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium text-gray-900 capitalize", children: [submission.type, " Submission"] }), _jsxs("div", { className: "text-sm text-gray-500", children: ["ID: ", submission.id.slice(0, 8), "..."] })] })] }) }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("div", { className: "text-sm text-gray-900", children: submission.user_name || 'N/A' }), _jsx("div", { className: "text-sm text-gray-500", children: submission.user_email }), submission.user_phone && (_jsx("div", { className: "text-sm text-gray-500", children: submission.user_phone }))] }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`, children: submission.status.replace('_', ' ') }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: formatDate(submission.created_at) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setSelectedSubmission(submission), className: "text-blue-600 hover:text-blue-900", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), submission.status === 'new' && (_jsx("button", { onClick: () => handleStatusUpdate(submission.id, 'in_progress'), className: "text-yellow-600 hover:text-yellow-900", title: "Mark In Progress", children: _jsx(Clock, { className: "w-4 h-4" }) })), submission.status !== 'completed' && (_jsx("button", { onClick: () => handleStatusUpdate(submission.id, 'completed'), className: "text-green-600 hover:text-green-900", title: "Mark Completed", children: _jsx(CheckCircle, { className: "w-4 h-4" }) }))] }) })] }, submission.id))) })] }) })) })) : (
            /* Enhanced Contact Messages List with User ID Support */
            _jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: filteredContacts.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No contact messages found" }), _jsx("p", { className: "text-gray-600", children: "No contact messages match your current filters." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Message" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Contact" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredContacts.map((message) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: message.subject }), _jsx("div", { className: "text-xs text-gray-500 mt-1 line-clamp-1", children: message.message })] }) }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("div", { className: "text-sm text-gray-900", children: message.name }), _jsx("div", { className: "text-sm text-gray-500", children: message.email }), message.phone && (_jsx("div", { className: "text-sm text-gray-500", children: message.phone }))] }), _jsx("td", { className: "px-6 py-4", children: message.user_id ? (_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 text-green-600 mr-1" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-green-700 font-medium", children: "Registered User" }), _jsxs("div", { className: "text-xs text-gray-500 font-mono", children: [message.user_id.slice(0, 8), "..."] })] })] })) : (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-orange-200 mr-1 flex items-center justify-center", children: _jsx("span", { className: "text-xs text-orange-600", children: "?" }) }), _jsx("span", { className: "text-xs text-orange-600", children: "Anonymous" })] })) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`, children: message.status.replace('_', ' ') }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: formatDate(message.created_at) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setSelectedContactMessage(message), className: "text-blue-600 hover:text-blue-900", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), message.status === 'new' && (_jsx("button", { onClick: () => handleStatusUpdate(message.id, 'in_progress'), className: "text-yellow-600 hover:text-yellow-900", title: "Mark In Progress", children: _jsx(Clock, { className: "w-4 h-4" }) })), message.status !== 'completed' && (_jsx("button", { onClick: () => handleStatusUpdate(message.id, 'completed'), className: "text-green-600 hover:text-green-900", title: "Mark Completed", children: _jsx(CheckCircle, { className: "w-4 h-4" }) }))] }) })] }, message.id))) })] }) })) })), selectedSubmission && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: [getTypeIcon(selectedSubmission.type), " ", selectedSubmission.type, " Submission"] }), _jsx("button", { onClick: () => setSelectedSubmission(null), className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }) }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Contact Information" }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", selectedSubmission.user_name || 'N/A'] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", selectedSubmission.user_email] }), selectedSubmission.user_phone && (_jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", selectedSubmission.user_phone] }))] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Submission Data" }), _jsx("div", { className: "bg-gray-50 rounded-lg p-4", children: _jsx("pre", { className: "text-sm text-gray-700 whitespace-pre-wrap", children: JSON.stringify(selectedSubmission.data, null, 2) }) })] }), selectedSubmission.notes && (_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Notes" }), _jsx("div", { className: "bg-gray-50 rounded-lg p-4", children: _jsx("p", { className: "text-sm text-gray-700", children: selectedSubmission.notes }) })] })), _jsxs("div", { className: "flex space-x-3 pt-4", children: [_jsx(ResponsiveActionButton, { onClick: () => handleStatusUpdate(selectedSubmission.id, 'in_progress'), variant: "outline", size: "sm", children: "Mark In Progress" }), _jsx(ResponsiveActionButton, { onClick: () => handleStatusUpdate(selectedSubmission.id, 'completed'), size: "sm", children: "Mark Completed" })] })] })] }) })), selectedContactMessage && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Contact Message Details" }), _jsx("button", { onClick: () => setSelectedContactMessage(null), className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }) }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Contact Information" }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", selectedContactMessage.name || 'N/A'] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", selectedContactMessage.email] }), selectedContactMessage.phone && (_jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", selectedContactMessage.phone] })), selectedContactMessage.user_id ? (_jsx("div", { className: "mt-3 p-3 bg-green-50 border border-green-200 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 text-green-600 mr-2" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-800", children: "Registered User" }), _jsxs("p", { className: "text-xs text-green-600 font-mono", children: ["User ID: ", selectedContactMessage.user_id] })] })] }) })) : (_jsx("div", { className: "mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-orange-200 mr-2 flex items-center justify-center", children: _jsx("span", { className: "text-xs text-orange-600", children: "?" }) }), _jsx("p", { className: "text-sm text-orange-700", children: "Anonymous submission (no user account linked)" })] }) }))] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Message Details" }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("p", { className: "font-semibold text-gray-800 mb-2", children: selectedContactMessage.subject }), _jsx("p", { className: "text-gray-700 whitespace-pre-wrap", children: selectedContactMessage.message })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Status" }), _jsx("div", { className: "bg-gray-50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: `inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedContactMessage.status)}`, children: selectedContactMessage.status.replace('_', ' ') }), _jsxs("span", { className: "text-gray-500 text-sm ml-3", children: ["Received on ", formatDate(selectedContactMessage.created_at)] })] }) })] }), _jsxs("div", { className: "flex space-x-3 pt-4", children: [selectedContactMessage.status === 'new' && (_jsx(ResponsiveActionButton, { onClick: () => handleStatusUpdate(selectedContactMessage.id, 'in_progress'), variant: "outline", size: "sm", children: "Mark In Progress" })), selectedContactMessage.status !== 'completed' && (_jsx(ResponsiveActionButton, { onClick: () => handleStatusUpdate(selectedContactMessage.id, 'completed'), size: "sm", children: "Mark Completed" }))] })] })] }) }))] }));
}
export default FormSubmissions;
