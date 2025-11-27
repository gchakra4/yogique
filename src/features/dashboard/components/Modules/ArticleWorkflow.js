import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CheckCircle, Clock, Eye, MessageSquare, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
import { useAuth } from '../../../auth/contexts/AuthContext';
import { createNotification, notificationTemplates } from '../../../notifications/utils/notificationHelpers';
export function ArticleWorkflow() {
    const { user } = useAuth();
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [moderationLogs, setModerationLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [moderating, setModerating] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [rejectionComment, setRejectionComment] = useState('');
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    // Get current user's profile
    useEffect(() => {
        const getCurrentUserProfile = async () => {
            if (user?.id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                if (data) {
                    setCurrentUserProfile(data);
                }
            }
        };
        getCurrentUserProfile();
    }, [user]);
    useEffect(() => {
        fetchArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);
    const fetchArticles = async () => {
        try {
            setLoading(true);
            // Fetch articles first
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });
            if (articlesError)
                throw articlesError;
            // Filter by tab
            let filteredArticles = articlesData || [];
            if (activeTab === 'pending') {
                filteredArticles = filteredArticles.filter(article => article.status === 'pending_review');
            }
            // Fetch author information separately for each article
            const articlesWithAuthors = await Promise.all(filteredArticles.map(async (article) => {
                const { data: authorData, error: authorError } = await supabase
                    .from('profiles')
                    .select('full_name, email, user_id')
                    .eq('user_id', article.author_id)
                    .single();
                if (authorError) {
                    console.error('Error fetching author for article:', article.id, authorError);
                }
                return {
                    ...article,
                    author: authorData || null
                };
            }));
            setArticles(articlesWithAuthors);
        }
        catch (error) {
            console.error('Error fetching articles:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchModerationLogs = async (articleId) => {
        try {
            const { data, error } = await supabase
                .from('article_moderation_logs')
                .select(`
          *,
          moderator:profiles!article_moderation_logs_moderated_by_fkey(full_name, email)
        `)
                .eq('article_id', articleId)
                .order('moderated_at', { ascending: false });
            if (error)
                throw error;
            setModerationLogs(data || []);
        }
        catch (error) {
            console.error('Error fetching moderation logs:', error);
        }
    };
    const handleApprove = async (articleId) => {
        try {
            setModerating(true);
            if (!currentUserProfile) {
                throw new Error('User profile not found');
            }
            // Update article status to approved and published
            const { error: updateError } = await supabase
                .from('articles')
                .update({
                status: 'published',
                moderation_status: 'approved',
                moderated_at: new Date().toISOString(),
                moderated_by: user?.id,
                published_at: new Date().toISOString()
            })
                .eq('id', articleId);
            if (updateError)
                throw updateError;
            // Add this debugging code before the insert
            console.log('Debug - Current user:', user?.id);
            console.log('Debug - Current user profile:', currentUserProfile);
            console.log('Debug - Profile role:', currentUserProfile?.role);
            console.log('Debug - Profile is_active:', currentUserProfile?.is_active);
            console.log('Debug - Profile user_id:', currentUserProfile?.user_id);
            // Log the moderation action using profile ID
            const { error: logError } = await supabase
                .from('article_moderation_logs')
                .insert([{
                    article_id: articleId,
                    action: 'approved',
                    moderated_by: currentUserProfile.user_id, // Changed from currentUserProfile.id
                    comment: 'Article approved and published'
                }]);
            if (logError)
                throw logError;
            // 🎉 NEW: Send notification to author
            if (selectedArticle?.author_id) {
                const notificationData = notificationTemplates.articleApproved(selectedArticle.title);
                await createNotification({
                    userId: selectedArticle.author_id,
                    ...notificationData,
                    data: { articleId: selectedArticle.id }
                });
            }
            await fetchArticles();
            setSelectedArticle(null);
            alert('Article approved and published successfully!');
        }
        catch (error) {
            console.error('Error approving article:', error);
            alert('Failed to approve article');
        }
        finally {
            setModerating(false);
        }
    };
    const handleReject = async (articleId, comment) => {
        try {
            setModerating(true);
            if (!currentUserProfile) {
                throw new Error('User profile not found');
            }
            // Add this debugging code before the insert
            console.log('Debug - Current user:', user?.id);
            console.log('Debug - Current user profile:', currentUserProfile);
            console.log('Debug - Profile role:', currentUserProfile?.role);
            console.log('Debug - Profile is_active:', currentUserProfile?.is_active);
            console.log('Debug - Profile user_id:', currentUserProfile?.user_id);
            // Log the exact data being inserted
            const logData = {
                article_id: articleId,
                action: 'rejected',
                moderated_by: currentUserProfile.user_id, // Changed from currentUserProfile.id
                comment: comment
            };
            console.log('Debug - Data to insert:', logData);
            // Update article status back to draft
            const { error: updateError } = await supabase
                .from('articles')
                .update({
                status: 'draft',
                moderation_status: 'rejected',
                moderated_at: new Date().toISOString(),
                moderated_by: user?.id
            })
                .eq('id', articleId);
            if (updateError)
                throw updateError;
            // Log the moderation action using profile ID
            const { error: logError } = await supabase
                .from('article_moderation_logs')
                .insert([logData]);
            if (logError)
                throw logError;
            // 🎉 NEW: Send notification to author
            if (selectedArticle?.author_id) {
                const notificationData = notificationTemplates.articleRejected(selectedArticle.title, comment);
                await createNotification({
                    userId: selectedArticle.author_id,
                    ...notificationData,
                    data: { articleId: selectedArticle.id, rejectionReason: comment }
                });
            }
            await fetchArticles();
            setSelectedArticle(null);
            setShowRejectionModal(false);
            setRejectionComment('');
            alert('Article rejected and sent back to author for revision');
        }
        catch (error) {
            console.error('Error rejecting article:', error);
            alert('Failed to reject article');
        }
        finally {
            setModerating(false);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending_review':
                return 'bg-yellow-100 text-yellow-800';
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Article Workflow Management" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(ResponsiveActionButton, { variant: activeTab === 'pending' ? 'primary' : 'outline', onClick: () => setActiveTab('pending'), children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), "Pending Review (", articles.filter(a => a.status === 'pending_review').length, ")"] }), _jsx(ResponsiveActionButton, { variant: activeTab === 'all' ? 'primary' : 'outline', onClick: () => setActiveTab('all'), children: "All Articles" })] })] }), !selectedArticle ? (_jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: articles.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Clock, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: activeTab === 'pending'
                                ? 'No articles pending review'
                                : 'No articles found' })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Article" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Author" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Submitted" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: articles.map((article) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900 line-clamp-1", children: article.title }), _jsx("div", { className: "text-sm text-gray-500 line-clamp-2 mt-1", children: article.preview_text })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: article.author?.full_name || 'Unknown Author' }), _jsx("div", { className: "text-sm text-gray-500", children: article.author?.email || 'No email available' })] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getStatusColor(article.status)}`, children: article.status.replace('_', ' ') }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: new Date(article.created_at).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4", children: _jsxs(ResponsiveActionButton, { size: "sm", variant: "outline", onClick: () => {
                                                    setSelectedArticle(article);
                                                    fetchModerationLogs(article.id);
                                                }, children: [_jsx(Eye, { className: "w-4 h-4 mr-1" }), "Review"] }) })] }, article.id))) })] }) })) })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(ResponsiveActionButton, { variant: "outline", onClick: () => setSelectedArticle(null), children: "\u2190 Back to List" }), _jsx("div", { className: "flex space-x-2", children: selectedArticle.status === 'pending_review' && (_jsxs(_Fragment, { children: [_jsxs(ResponsiveActionButton, { variant: "outline", className: "border-red-300 text-red-600 hover:bg-red-50", onClick: () => setShowRejectionModal(true), disabled: moderating, children: [_jsx(XCircle, { className: "w-4 h-4 mr-2" }), "Reject"] }), _jsxs(ResponsiveActionButton, { className: "bg-green-600 hover:bg-green-700", onClick: () => handleApprove(selectedArticle.id), disabled: moderating, children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), moderating ? 'Approving...' : 'Approve & Publish'] })] })) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 mb-4", children: selectedArticle.title }), _jsxs("div", { className: "prose max-w-none", children: [_jsxs("div", { className: "text-gray-600 mb-4 p-4 bg-gray-50 rounded-lg", children: [_jsx("strong", { children: "Preview:" }), " ", selectedArticle.preview_text] }), _jsx("div", { dangerouslySetInnerHTML: { __html: selectedArticle.content } })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-4", children: "Article Details" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: `ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedArticle.status)}`, children: selectedArticle.status.replace('_', ' ') })] }), _jsxs("div", { children: [_jsx("span", { className: "text-sm text-gray-500", children: "Author:" }), _jsx("span", { className: "ml-2 text-sm font-medium", children: selectedArticle.author?.full_name || 'Unknown Author' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-sm text-gray-500", children: "Email:" }), _jsx("span", { className: "ml-2 text-sm", children: selectedArticle.author?.email || 'No email available' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-sm text-gray-500", children: "Created:" }), _jsx("span", { className: "ml-2 text-sm", children: new Date(selectedArticle.created_at).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("span", { className: "text-sm text-gray-500", children: "Updated:" }), _jsx("span", { className: "ml-2 text-sm", children: new Date(selectedArticle.updated_at).toLocaleDateString() })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsxs("h4", { className: "font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(MessageSquare, { className: "w-4 h-4 mr-2" }), "Moderation History"] }), _jsx("div", { className: "space-y-3", children: moderationLogs.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500", children: "No moderation history yet" })) : (moderationLogs.map((log) => (_jsxs("div", { className: "border-l-2 border-gray-200 pl-4 pb-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: `text-sm font-medium ${log.action === 'approved' ? 'text-green-600' : 'text-red-600'}`, children: log.action.charAt(0).toUpperCase() + log.action.slice(1) }), _jsx("span", { className: "text-xs text-gray-500", children: new Date(log.moderated_at).toLocaleDateString() })] }), log.moderator && (_jsxs("div", { className: "text-xs text-gray-500 mb-1", children: ["by ", log.moderator.full_name] })), log.comment && (_jsx("p", { className: "text-sm text-gray-600", children: log.comment }))] }, log.id)))) })] })] })] })] })), showRejectionModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl p-6 max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Reject Article" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please provide feedback for the author on why this article was rejected:" }), _jsx("textarea", { value: rejectionComment, onChange: (e) => setRejectionComment(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 4, placeholder: "Enter feedback for the author..." }), _jsxs("div", { className: "flex space-x-3 mt-4", children: [_jsx(ResponsiveActionButton, { variant: "outline", onClick: () => {
                                        setShowRejectionModal(false);
                                        setRejectionComment('');
                                    }, children: "Cancel" }), _jsx(ResponsiveActionButton, { className: "bg-red-600 hover:bg-red-700", onClick: () => handleReject(selectedArticle.id, rejectionComment), disabled: !rejectionComment.trim() || moderating, children: moderating ? 'Rejecting...' : 'Reject Article' })] })] }) }))] }));
}
// Add default export for lazy loading compatibility
export default ArticleWorkflow;
