import { CheckCircle, Clock, Eye, MessageSquare, User, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../../shared/lib/supabase'
import { useAuth } from '../../../auth/contexts/AuthContext'
import { createNotification, notificationTemplates } from '../../../notifications/utils/notificationHelpers'

interface Article {
    id: string
    title: string
    content: string
    preview_text: string
    status: string
    created_at: string
    updated_at: string
    author_id: string
    author?: {
        full_name: string
        email: string
    }
    moderation_status?: string
    moderated_at?: string
    moderated_by?: string
}

interface ModerationLog {
    id: string
    action: string
    comment: string
    moderated_at: string
    moderated_by: string
    moderator?: {
        full_name: string
        email: string
    }
}

export function ArticleWorkflow() {
    const { user } = useAuth()
    const [articles, setArticles] = useState<Article[]>([])
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
    const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([])
    const [loading, setLoading] = useState(true)
    const [moderating, setModerating] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
    const [rejectionComment, setRejectionComment] = useState('')
    const [showRejectionModal, setShowRejectionModal] = useState(false)
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

    // Get current user's profile
    useEffect(() => {
        const getCurrentUserProfile = async () => {
            if (user?.id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (data) {
                    setCurrentUserProfile(data)
                }
            }
        }

        getCurrentUserProfile()
    }, [user])

    useEffect(() => {
        fetchArticles()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const fetchArticles = async () => {
        try {
            setLoading(true)

            // Fetch articles first
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false })

            if (articlesError) throw articlesError

            // Filter by tab
            let filteredArticles = articlesData || []
            if (activeTab === 'pending') {
                filteredArticles = filteredArticles.filter(article => article.status === 'pending_review')
            }

            // Fetch author information separately for each article
            const articlesWithAuthors = await Promise.all(
                filteredArticles.map(async (article) => {
                    const { data: authorData, error: authorError } = await supabase
                        .from('profiles')
                        .select('full_name, email, user_id')
                        .eq('user_id', article.author_id)
                        .single()

                    if (authorError) {
                        console.error('Error fetching author for article:', article.id, authorError)
                    }

                    return {
                        ...article,
                        author: authorData || null
                    }
                })
            )

            setArticles(articlesWithAuthors)
        } catch (error) {
            console.error('Error fetching articles:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchModerationLogs = async (articleId: string) => {
        try {
            const { data, error } = await supabase
                .from('article_moderation_logs')
                .select(`
          *,
          moderator:profiles!article_moderation_logs_moderated_by_fkey(full_name, email)
        `)
                .eq('article_id', articleId)
                .order('moderated_at', { ascending: false })

            if (error) throw error
            setModerationLogs(data || [])
        } catch (error) {
            console.error('Error fetching moderation logs:', error)
        }
    }

    const handleApprove = async (articleId: string) => {
        try {
            setModerating(true)

            if (!currentUserProfile) {
                throw new Error('User profile not found')
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
                .eq('id', articleId)

            if (updateError) throw updateError

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
                }])

            if (logError) throw logError

            // 🎉 NEW: Send notification to author
            if (selectedArticle?.author_id) {
                const notificationData = notificationTemplates.articleApproved(selectedArticle.title)
                await createNotification({
                    userId: selectedArticle.author_id,
                    ...notificationData,
                    data: { articleId: selectedArticle.id }
                })
            }

            await fetchArticles()
            setSelectedArticle(null)
            alert('Article approved and published successfully!')
        } catch (error) {
            console.error('Error approving article:', error)
            alert('Failed to approve article')
        } finally {
            setModerating(false)
        }
    }

    const handleReject = async (articleId: string, comment: string) => {
        try {
            setModerating(true)

            if (!currentUserProfile) {
                throw new Error('User profile not found')
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
                .eq('id', articleId)

            if (updateError) throw updateError

            // Log the moderation action using profile ID
            const { error: logError } = await supabase
                .from('article_moderation_logs')
                .insert([logData])

            if (logError) throw logError

            // 🎉 NEW: Send notification to author
            if (selectedArticle?.author_id) {
                const notificationData = notificationTemplates.articleRejected(selectedArticle.title, comment)
                await createNotification({
                    userId: selectedArticle.author_id,
                    ...notificationData,
                    data: { articleId: selectedArticle.id, rejectionReason: comment }
                })
            }

            await fetchArticles()
            setSelectedArticle(null)
            setShowRejectionModal(false)
            setRejectionComment('')
            alert('Article rejected and sent back to author for revision')
        } catch (error) {
            console.error('Error rejecting article:', error)
            alert('Failed to reject article')
        } finally {
            setModerating(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_review':
                return 'bg-yellow-100 text-yellow-800'
            case 'published':
                return 'bg-green-100 text-green-800'
            case 'draft':
                return 'bg-gray-100 text-gray-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

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
                <h2 className="text-2xl font-bold text-gray-900">Article Workflow Management</h2>
                <div className="flex space-x-2">
                    <ResponsiveActionButton
                        variant={activeTab === 'pending' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab('pending')}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Pending Review ({articles.filter(a => a.status === 'pending_review').length})
                    </ResponsiveActionButton>
                    <ResponsiveActionButton
                        variant={activeTab === 'all' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab('all')}
                    >
                        All Articles
                    </ResponsiveActionButton>
                </div>
            </div>

            {!selectedArticle ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {articles.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {activeTab === 'pending'
                                    ? 'No articles pending review'
                                    : 'No articles found'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Article
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Author
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {articles.map((article) => (
                                        <tr key={article.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                                        {article.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                        {article.preview_text}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {article.author?.full_name || 'Unknown Author'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {article.author?.email || 'No email available'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(article.status)}`}>
                                                    {article.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <ResponsiveActionButton
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedArticle(article)
                                                        fetchModerationLogs(article.id)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Review
                                                </ResponsiveActionButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <ResponsiveActionButton
                            variant="outline"
                            onClick={() => setSelectedArticle(null)}
                        >
                            ← Back to List
                        </ResponsiveActionButton>
                        <div className="flex space-x-2">
                            {selectedArticle.status === 'pending_review' && (
                                <>
                                    <ResponsiveActionButton
                                        variant="outline"
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => setShowRejectionModal(true)}
                                        disabled={moderating}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </ResponsiveActionButton>
                                    <ResponsiveActionButton
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleApprove(selectedArticle.id)}
                                        disabled={moderating}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {moderating ? 'Approving...' : 'Approve & Publish'}
                                    </ResponsiveActionButton>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {selectedArticle.title}
                                </h3>
                                <div className="prose max-w-none">
                                    <div className="text-gray-600 mb-4 p-4 bg-gray-50 rounded-lg">
                                        <strong>Preview:</strong> {selectedArticle.preview_text}
                                    </div>
                                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Article Details</h4>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500">Status:</span>
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedArticle.status)}`}>
                                            {selectedArticle.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Author:</span>
                                        <span className="ml-2 text-sm font-medium">
                                            {selectedArticle.author?.full_name || 'Unknown Author'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Email:</span>
                                        <span className="ml-2 text-sm">
                                            {selectedArticle.author?.email || 'No email available'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Created:</span>
                                        <span className="ml-2 text-sm">
                                            {new Date(selectedArticle.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Updated:</span>
                                        <span className="ml-2 text-sm">
                                            {new Date(selectedArticle.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Moderation History
                                </h4>
                                <div className="space-y-3">
                                    {moderationLogs.length === 0 ? (
                                        <p className="text-sm text-gray-500">No moderation history yet</p>
                                    ) : (
                                        moderationLogs.map((log) => (
                                            <div key={log.id} className="border-l-2 border-gray-200 pl-4 pb-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-sm font-medium ${log.action === 'approved' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(log.moderated_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {log.moderator && (
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        by {log.moderator.full_name}
                                                    </div>
                                                )}
                                                {log.comment && (
                                                    <p className="text-sm text-gray-600">{log.comment}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Reject Article
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Please provide feedback for the author on why this article was rejected:
                        </p>
                        <textarea
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Enter feedback for the author..."
                        />
                        <div className="flex space-x-3 mt-4">
                            <ResponsiveActionButton
                                variant="outline"
                                onClick={() => {
                                    setShowRejectionModal(false)
                                    setRejectionComment('')
                                }}
                            >
                                Cancel
                            </ResponsiveActionButton>
                            <ResponsiveActionButton
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleReject(selectedArticle!.id, rejectionComment)}
                                disabled={!rejectionComment.trim() || moderating}
                            >
                                {moderating ? 'Rejecting...' : 'Reject Article'}
                            </ResponsiveActionButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Add default export for lazy loading compatibility
export default ArticleWorkflow