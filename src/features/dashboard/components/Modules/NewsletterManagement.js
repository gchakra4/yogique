import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Edit, Eye, Mail, Plus, Send, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmailService from '../../../../services/emailService';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton';
import { supabase } from '../../../../shared/lib/supabase';
import { createSampleNewsletters } from '../../../../utils/sampleNewsletterData';
import NewsletterCreation from './NewsletterCreation';
export function NewsletterManagement() {
    const [newsletters, setNewsletters] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('newsletters');
    const [showNewsletterCreation, setShowNewsletterCreation] = useState(false);
    const [editingNewsletter, setEditingNewsletter] = useState(null);
    const [sendingNewsletter, setSendingNewsletter] = useState(null);
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            // Try multiple possible table names for newsletter subscriptions
            const possibleTableNames = ['newsletter_subscribers', 'newsletter_subscriptions', 'subscriptions', 'subscribers'];
            let subscribersRes = null;
            // Try each table name until one works
            for (const tableName of possibleTableNames) {
                try {
                    const testRes = await supabase.from(tableName).select('*').limit(1);
                    if (!testRes.error) {
                        subscribersRes = await supabase.from(tableName).select('*');
                        break;
                    }
                }
                catch (err) {
                    // Table not accessible, try next one
                    continue;
                }
            }
            // Fetch newsletters
            const newslettersRes = await supabase.from('newsletters').select('*').order('created_at', { ascending: false });
            if (newslettersRes.error) {
                console.error('Newsletter fetch error:', newslettersRes.error);
            }
            if (!subscribersRes || subscribersRes.error) {
                console.warn('Subscribers table not accessible or empty, showing newsletters only');
                // Set empty data but don't throw error - let component render with empty state
                setNewsletters(newslettersRes.data || []);
                setSubscribers([]);
                return;
            }
            setNewsletters(newslettersRes.data || []);
            setSubscribers(subscribersRes.data || []);
        }
        catch (error) {
            console.error('Error fetching data:', error);
            // Don't break the UI - show empty state with error logged
            setNewsletters([]);
            setSubscribers([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteNewsletter = async (id) => {
        if (!confirm('Are you sure you want to delete this newsletter?'))
            return;
        try {
            const { error } = await supabase
                .from('newsletters')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            await fetchData();
        }
        catch (error) {
            console.error('Error deleting newsletter:', error);
        }
    };
    const handleCreateNewsletter = () => {
        setEditingNewsletter(null);
        setShowNewsletterCreation(true);
    };
    const handleEditNewsletter = (newsletter) => {
        setEditingNewsletter(newsletter);
        setShowNewsletterCreation(true);
    };
    const handleBackToList = () => {
        setShowNewsletterCreation(false);
        setEditingNewsletter(null);
        fetchData(); // Refresh data when returning to list
    };
    const handleCreateSampleNewsletters = async () => {
        try {
            setLoading(true);
            const result = await createSampleNewsletters();
            if (result.success) {
                alert(result.message);
                await fetchData(); // Refresh the data
            }
            else {
                alert(`Error: ${result.error}`);
            }
        }
        catch (error) {
            console.error('Error creating sample newsletters:', error);
            alert('Error creating sample newsletters. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendNewsletter = async (newsletter) => {
        if (!confirm(`Are you sure you want to send "${newsletter.title}" to all subscribers?`))
            return;
        try {
            setSendingNewsletter(newsletter.id);
            const result = await EmailService.sendNewsletter({
                newsletterId: newsletter.id,
                subject: newsletter.subject,
                templateId: 'minimal-clean', // Default template
                templateVariables: {
                    title: newsletter.title,
                    content: newsletter.content,
                    primaryColor: '#3B82F6',
                    secondaryColor: '#1E40AF',
                    backgroundColor: '#F3F4F6',
                    fontFamily: 'Arial, sans-serif',
                    unsubscribeUrl: `${window.location.origin}/unsubscribe`
                }
            });
            if (result.success) {
                alert(`Newsletter sent successfully to ${result.sentCount} subscribers!`);
                await fetchData(); // Refresh to show updated status
            }
            else {
                alert(`Failed to send newsletter: ${result.errors.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error sending newsletter:', error);
            alert('Error sending newsletter. Please try again.');
        }
        finally {
            setSendingNewsletter(null);
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'Unknown date';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        catch (error) {
            console.error('Date formatting error:', error, 'for date:', dateString);
            return 'Invalid date';
        }
    };
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    // Show newsletter creation page
    if (showNewsletterCreation) {
        return (_jsx(NewsletterCreation, { onBack: handleBackToList, editingNewsletter: editingNewsletter }));
    }
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Mail, { className: "w-6 h-6 mr-2" }), "Newsletter Management"] }), activeTab === 'newsletters' && (_jsxs(ResponsiveActionButton, { onClick: handleCreateNewsletter, className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Newsletter"] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6", children: [_jsx("div", { className: "bg-transparent md:bg-white md:rounded-xl md:shadow-lg md:p-6 p-4 border-0 md:border", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Subscribers" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: subscribers.length })] }), _jsx(Users, { className: "w-8 h-8 text-blue-600" })] }) }), _jsx("div", { className: "bg-transparent md:bg-white md:rounded-xl md:shadow-lg md:p-6 p-4 border-0 md:border", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Subscribers" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: activeSubscribers.length })] }), _jsx(Mail, { className: "w-8 h-8 text-green-600" })] }) }), _jsx("div", { className: "bg-transparent md:bg-white md:rounded-xl md:shadow-lg md:p-6 p-4 border-0 md:border", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Newsletters Sent" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: newsletters.filter(n => n.status === 'sent').length })] }), _jsx(Send, { className: "w-8 h-8 text-purple-600" })] }) })] }), _jsxs("div", { className: "bg-transparent md:bg-white md:rounded-xl md:shadow-lg", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsxs("nav", { className: "flex space-x-4 md:space-x-8 px-4 md:px-6 overflow-x-auto no-scrollbar", children: [_jsxs("button", { onClick: () => setActiveTab('newsletters'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'newsletters'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: ["Newsletters (", newsletters.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('subscribers'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscribers'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: ["Subscribers (", subscribers.length, ")"] })] }) }), _jsx("div", { className: "p-4 md:p-6", children: activeTab === 'newsletters' ? (_jsx("div", { className: "space-y-4", children: newsletters.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Mail, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No newsletters yet" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Create your first newsletter to get started." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center px-2", children: [_jsxs(ResponsiveActionButton, { onClick: handleCreateNewsletter, className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Newsletter"] }), _jsx(ResponsiveActionButton, { variant: "outline", onClick: handleCreateSampleNewsletters, className: "border-gray-300 text-gray-700 hover:bg-gray-50", children: "Create Sample Newsletters" })] })] })) : (newsletters.map((newsletter) => (_jsx("div", { className: "border-0 md:border md:border-gray-200 md:rounded-lg p-3 md:p-4 hover:md:shadow-md transition-shadow bg-white md:bg-white", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: newsletter.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: newsletter.subject }), _jsxs("div", { className: "flex items-center space-x-4 mt-2 text-sm text-gray-500", children: [_jsxs("span", { children: ["Created: ", formatDate(newsletter.created_at)] }), newsletter.sent_at && (_jsxs("span", { children: ["Sent: ", formatDate(newsletter.sent_at)] })), _jsx("span", { className: `px-2 py-1 rounded-full text-xs ${newsletter.status === 'sent'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'}`, children: newsletter.status })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleEditNewsletter(newsletter), className: "text-blue-600 hover:text-blue-900", title: "Edit newsletter", children: _jsx(Edit, { className: "w-4 h-4" }) }), newsletter.status === 'draft' && (_jsx("button", { onClick: () => handleSendNewsletter(newsletter), disabled: sendingNewsletter === newsletter.id, className: "text-green-600 hover:text-green-900 disabled:opacity-50", title: "Send newsletter", children: _jsx(Send, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => console.log('Preview newsletter:', newsletter.id), className: "text-gray-600 hover:text-gray-900", title: "Preview newsletter", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteNewsletter(newsletter.id), className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }, newsletter.id)))) })) : (_jsx("div", { className: "space-y-4", children: subscribers.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Users, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No subscribers found" }), _jsx("p", { className: "text-gray-600 mb-2", children: "This could mean:" }), _jsxs("div", { className: "text-sm text-gray-500 space-y-1", children: [_jsx("p", { children: "\u2022 No subscribers have signed up yet" }), _jsx("p", { children: "\u2022 Database table permissions (RLS) may be preventing access" }), _jsx("p", { children: "\u2022 Table name might be different than expected" }), _jsx("p", { children: "\u2022 Check browser console for detailed error messages" })] })] })) : (_jsx("div", { className: "overflow-x-auto md:overflow-x-visible", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Subscriber" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Subscribed" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: subscribers.map((subscriber) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: subscriber.name || 'No name' }), _jsx("div", { className: "text-sm text-gray-500", children: subscriber.email })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${subscriber.status === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'}`, children: subscriber.status }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: formatDate(subscriber.subscribed_at || subscriber.created_at || subscriber.date_created) })] }, subscriber.id))) })] }) })) })) })] })] }));
}
export default NewsletterManagement;
