import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Edit, Eye, MessageSquare, Plus, Send, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton';
import { supabase } from '../../../../shared/lib/supabase';
import NewArticlePage from '../../../articles/pages/NewArticlePage';
import { useAuth } from '../../../auth/contexts/AuthContext';
export function ArticleManagement({ authorId }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [selectedArticleForFeedback, setSelectedArticleForFeedback] = useState(null);
    const [moderationLogs, setModerationLogs] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const { user, isMantraCurator } = useAuth();
    useEffect(() => {
        fetchArticles();
    }, []);
    const fetchArticles = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });
            // Always filter by current user unless authorId is provided
            if (authorId) {
                query = query.eq('author_id', authorId);
            }
            else if (user) {
                query = query.eq('author_id', user.id);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            setArticles(data || []);
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
            setLoadingFeedback(true);
            const { data, error } = await supabase
                .from('article_moderation_logs')
                .select(`
          id,
          action,
          comment,
          moderated_at,
          moderated_by,
          moderator:profiles!article_moderation_logs_moderated_by_fkey(
            id,
            full_name,
            email,
            user_id
          )
        `)
                .eq('article_id', articleId)
                .order('moderated_at', { ascending: false });
            if (error)
                throw error;
            console.log('Moderation logs fetched:', data); // Debug log
            setModerationLogs((data || []).map((log) => ({
                ...log,
                moderator: Array.isArray(log.moderator) ? log.moderator[0] : log.moderator
            })));
        }
        catch (error) {
            console.error('Error fetching moderation logs:', error);
            setModerationLogs([]);
        }
        finally {
            setLoadingFeedback(false);
        }
    };
    const handleSaveArticle = async (articleData) => {
        try {
            if (editingArticle) {
                // Update existing article
                let query = supabase
                    .from('articles')
                    .update({
                    ...articleData,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', editingArticle.id);
                // Add author check for mantra curators
                if (isMantraCurator && user) {
                    query = query.eq('author_id', user.id);
                }
                const { error } = await query;
                if (error)
                    throw error;
            }
            else {
                // Create new article
                const newArticleData = {
                    ...articleData,
                    author_id: user?.id || null,
                    status: articleData.status || 'draft',
                    view_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                const { error } = await supabase
                    .from('articles')
                    .insert([newArticleData]);
                if (error)
                    throw error;
            }
            await fetchArticles();
            setEditingArticle(null);
            setShowEditor(false);
            alert('Article saved successfully!');
        }
        catch (error) {
            console.error('Error saving article:', error);
            alert('Failed to save article');
        }
        finally {
        }
    };
    const handleDeleteArticle = async (id) => {
        if (!confirm('Are you sure you want to delete this article?'))
            return;
        try {
            let query = supabase
                .from('articles')
                .delete()
                .eq('id', id);
            // Add author check for mantra curators
            if (isMantraCurator && user) {
                query = query.eq('author_id', user.id);
            }
            const { error } = await query;
            if (error)
                throw error;
            await fetchArticles();
            alert('Article deleted successfully!');
        }
        catch (error) {
            console.error('Error deleting article:', error);
            alert('Failed to delete article');
        }
    };
    const handleSubmitForReview = async (articleId) => {
        try {
            const { error } = await supabase
                .from('articles')
                .update({
                status: 'pending_review',
                updated_at: new Date().toISOString()
            })
                .eq('id', articleId)
                .eq('author_id', user?.id);
            if (error)
                throw error;
            await fetchArticles();
            alert('Article submitted for review!');
        }
        catch (error) {
            console.error('Error submitting article for review:', error);
            alert('Failed to submit article for review');
        }
    };
    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setShowEditor(true);
    };
    const handleCreateNew = () => {
        setEditingArticle(null);
        setShowEditor(true);
    };
    const handleViewFeedback = async (article) => {
        setSelectedArticleForFeedback(article);
        setShowFeedbackModal(true);
        await fetchModerationLogs(article.id);
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
    const getStatusColor = (status) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'pending_review':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const hasModeratorFeedback = (article) => {
        return article.moderation_status === 'rejected' || article.moderated_at;
    };
    const getActionColor = (action) => {
        switch (action) {
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    if (showEditor) {
        const normalizedArticle = editingArticle ? {
            ...editingArticle,
            image_url: editingArticle.image_url || ''
        } : undefined;
        return (_jsx(NewArticlePage, { article: normalizedArticle, onSave: handleSaveArticle, onCancel: () => {
                setEditingArticle(null);
                setShowEditor(false);
            }, onBack: () => {
                setEditingArticle(null);
                setShowEditor(false);
            }, backToPath: "/dashboard/article_management" }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start sm:items-center justify-between", children: [_jsx("div", { className: "flex-1 min-w-0", children: _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Article Management" }) }), _jsx("div", { className: "flex-shrink-0 ml-3", children: _jsxs(ResponsiveActionButton, { onClick: handleCreateNew, className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create New Article"] }) })] }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : (_jsxs("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Title" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Views" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: articles.map((article) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsxs("div", { className: "text-sm font-medium text-gray-900", children: [article.title, hasModeratorFeedback(article) && (_jsx(MessageSquare, { className: "w-4 h-4 text-blue-500 inline ml-2" }))] }), _jsx("div", { className: "text-sm text-gray-500 truncate max-w-xs", children: article.preview_text })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: article.category }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getStatusColor(article.status)}`, children: article.status.replace('_', ' ') }), article.status === 'draft' && article.moderation_status === 'rejected' && (_jsx(AlertCircle, { className: "w-4 h-4 text-red-500 ml-2" }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Eye, { className: "w-4 h-4 mr-1 text-gray-400" }), article.view_count] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatDate(article.created_at) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [article.status === 'published' && (_jsx("a", { href: `/learning/${article.id}`, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-900", title: "View Published Article", children: _jsx(Eye, { className: "w-4 h-4" }) })), hasModeratorFeedback(article) && (_jsx("button", { onClick: () => handleViewFeedback(article), className: "text-blue-600 hover:text-blue-900", title: "View Moderator Feedback", children: _jsx(MessageSquare, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => handleEditArticle(article), className: "text-indigo-600 hover:text-indigo-900", title: "Edit Article", children: _jsx(Edit, { className: "w-4 h-4" }) }), article.status === 'draft' && (_jsx("button", { onClick: () => handleSubmitForReview(article.id), className: "text-blue-600 hover:text-blue-900", title: "Submit for Review", children: _jsx(Send, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => handleDeleteArticle(article.id), className: "text-red-600 hover:text-red-900", title: "Delete Article", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, article.id))) })] }) }), articles.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "No articles found. Create your first article!" }) }))] })), showFeedbackModal && selectedArticleForFeedback && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-start mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: "Review History" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: selectedArticleForFeedback.title })] }), _jsx("button", { onClick: () => {
                                        setShowFeedbackModal(false);
                                        setSelectedArticleForFeedback(null);
                                        setModerationLogs([]);
                                    }, className: "text-gray-400 hover:text-gray-600 text-xl font-bold", children: "\u2715" })] }), _jsx("div", { className: "space-y-4", children: loadingFeedback ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(LoadingSpinner, { size: "md" }) })) : moderationLogs.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(MessageSquare, { className: "w-12 h-12 text-gray-400 mx-auto mb-3" }), _jsx("p", { className: "text-gray-500", children: "No review history available yet." })] })) : (_jsx("div", { className: "space-y-4", children: moderationLogs.map((log, index) => (_jsxs("div", { className: `border rounded-lg p-4 ${getActionColor(log.action)}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: `px-3 py-1 text-xs rounded-full font-medium ${getActionColor(log.action)}`, children: log.action.charAt(0).toUpperCase() + log.action.slice(1) }), index === 0 && (_jsx("span", { className: "text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full", children: "Latest" }))] }), _jsx("span", { className: "text-sm text-gray-600", children: formatDate(log.moderated_at) })] }), log.moderator && (_jsxs("div", { className: "flex items-center mb-3", children: [_jsx(User, { className: "w-4 h-4 text-gray-500 mr-2" }), _jsxs("div", { children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["Reviewed by: ", log.moderator.full_name] }), _jsxs("span", { className: "text-sm text-gray-500 ml-2", children: ["(", log.moderator.email, ")"] })] })] })), log.comment && (_jsxs("div", { className: "bg-white bg-opacity-70 p-3 rounded border", children: [_jsx("div", { className: "text-sm font-medium text-gray-700 mb-1", children: "Feedback:" }), _jsx("p", { className: "text-sm text-gray-800", children: log.comment })] })), !log.comment && (_jsx("div", { className: "text-sm text-gray-600 italic", children: "No additional comments provided." }))] }, log.id))) })) }), _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [selectedArticleForFeedback.status === 'draft' &&
                                    selectedArticleForFeedback.moderation_status === 'rejected' && (_jsxs(ResponsiveActionButton, { onClick: () => {
                                        setShowFeedbackModal(false);
                                        setSelectedArticleForFeedback(null);
                                        setModerationLogs([]);
                                        handleEditArticle(selectedArticleForFeedback);
                                    }, className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Edit & Resubmit"] })), _jsx(ResponsiveActionButton, { variant: "outline", onClick: () => {
                                        setShowFeedbackModal(false);
                                        setSelectedArticleForFeedback(null);
                                        setModerationLogs([]);
                                    }, children: "Close" })] })] }) }))] }));
}
// Add default export for lazy loading compatibility
export default ArticleManagement;
