import { AlertCircle, Edit, Eye, MessageSquare, Plus, Send, Trash2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton'
import { supabase } from '../../../../shared/lib/supabase'
import NewArticlePage from '../../../articles/pages/NewArticlePage'
import { useAuth } from '../../../auth/contexts/AuthContext'

interface Article {
  id: string
  title: string
  content: string
  preview_text: string
  image_url?: string
  video_url?: string
  category: string
  tags: string[]
  status: string
  view_count: number
  created_at: string
  updated_at: string
  published_at?: string
  author_id?: string
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
    id: string
    full_name: string
    email: string
    user_id: string
  }
}

interface ArticleManagementProps {
  authorId?: string; // Optional prop for filtering by author
}

export function ArticleManagement({ authorId }: ArticleManagementProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [selectedArticleForFeedback, setSelectedArticleForFeedback] = useState<Article | null>(null)
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([])
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const { user, isMantraCurator } = useAuth()

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })

      // Always filter by current user unless authorId is provided
      if (authorId) {
        query = query.eq('author_id', authorId)
      } else if (user) {
        query = query.eq('author_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModerationLogs = async (articleId: string) => {
    try {
      setLoadingFeedback(true)
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
        .order('moderated_at', { ascending: false })

      if (error) throw error

      console.log('Moderation logs fetched:', data) // Debug log
      setModerationLogs((data || []).map((log: any) => ({
        ...log,
        moderator: Array.isArray(log.moderator) ? log.moderator[0] : log.moderator
      })))
    } catch (error) {
      console.error('Error fetching moderation logs:', error)
      setModerationLogs([])
    } finally {
      setLoadingFeedback(false)
    }
  }

  const handleSaveArticle = async (articleData: Partial<Article>) => {
    try {

      if (editingArticle) {
        // Update existing article
        const updatePayload = { ...articleData, updated_at: new Date().toISOString() } as any
        if ('template' in updatePayload) delete updatePayload.template

        let query = supabase
          .from('articles')
          .update(updatePayload)
          .eq('id', editingArticle.id)

        // Add author check for mantra curators
        if (isMantraCurator && user) {
          query = query.eq('author_id', user.id)
        }

        const { error } = await query

        if (error) throw error
      } else {
        // Create new article
        const newArticleData = {
          ...articleData,
          author_id: user?.id || null,
          status: articleData.status || 'draft',
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const sanitized = { ...newArticleData } as any
        if ('template' in sanitized) delete sanitized.template

        const { error } = await supabase
          .from('articles')
          .insert([sanitized])

        if (error) throw error
      }

      await fetchArticles()
      setEditingArticle(null)
      setShowEditor(false)
      alert('Article saved successfully!')
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article')
    } finally {
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      let query = supabase
        .from('articles')
        .delete()
        .eq('id', id)

      // Add author check for mantra curators
      if (isMantraCurator && user) {
        query = query.eq('author_id', user.id)
      }

      const { error } = await query

      if (error) throw error

      await fetchArticles()
      alert('Article deleted successfully!')
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article')
    }
  }

  const handleSubmitForReview = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .eq('author_id', user?.id)

      if (error) throw error

      await fetchArticles()
      alert('Article submitted for review!')
    } catch (error) {
      console.error('Error submitting article for review:', error)
      alert('Failed to submit article for review')
    }
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setShowEditor(true)
  }

  const handleCreateNew = () => {
    setEditingArticle(null)
    setShowEditor(true)
  }

  const handleViewFeedback = async (article: Article) => {
    setSelectedArticleForFeedback(article)
    setShowFeedbackModal(true)
    await fetchModerationLogs(article.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const hasModeratorFeedback = (article: Article) => {
    return article.moderation_status === 'rejected' || article.moderated_at
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (showEditor) {
    const normalizedArticle = editingArticle ? {
      ...editingArticle,
      image_url: editingArticle.image_url || ''
    } as any : undefined;

    return (
      <NewArticlePage
        article={normalizedArticle}
        onSave={handleSaveArticle}
        onCancel={() => {
          setEditingArticle(null)
          setShowEditor(false)
        }}
        onBack={() => {
          setEditingArticle(null)
          setShowEditor(false)
        }}
        backToPath="/dashboard/article_management"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">Article Management</h2>
        </div>
        <div className="flex-shrink-0 ml-3">
          <ResponsiveActionButton onClick={handleCreateNew} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create New Article
          </ResponsiveActionButton>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {article.title}
                        {hasModeratorFeedback(article) && (
                          <MessageSquare className="w-4 h-4 text-blue-500 inline ml-2" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {article.preview_text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {article.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(article.status)}`}>
                          {article.status.replace('_', ' ')}
                        </span>
                        {article.status === 'draft' && article.moderation_status === 'rejected' && (
                          <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1 text-gray-400" />
                        {article.view_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {article.status === 'published' && (
                          <a
                            href={`/learning/${article.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Published Article"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}

                        {hasModeratorFeedback(article) && (
                          <button
                            onClick={() => handleViewFeedback(article)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Moderator Feedback"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEditArticle(article)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {article.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitForReview(article.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Submit for Review"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Article"
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

          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No articles found. Create your first article!</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Feedback Modal */}
      {showFeedbackModal && selectedArticleForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Review History
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedArticleForFeedback.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setSelectedArticleForFeedback(null)
                  setModerationLogs([])
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {loadingFeedback ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : moderationLogs.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No review history available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moderationLogs.map((log, index) => (
                    <div key={log.id} className={`border rounded-lg p-4 ${getActionColor(log.action)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getActionColor(log.action)}`}>
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                          </span>
                          {index === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDate(log.moderated_at)}
                        </span>
                      </div>

                      {log.moderator && (
                        <div className="flex items-center mb-3">
                          <User className="w-4 h-4 text-gray-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Reviewed by: {log.moderator.full_name}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({log.moderator.email})
                            </span>
                          </div>
                        </div>
                      )}

                      {log.comment && (
                        <div className="bg-white bg-opacity-70 p-3 rounded border">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Feedback:
                          </div>
                          <p className="text-sm text-gray-800">
                            {log.comment}
                          </p>
                        </div>
                      )}

                      {!log.comment && (
                        <div className="text-sm text-gray-600 italic">
                          No additional comments provided.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {selectedArticleForFeedback.status === 'draft' &&
                selectedArticleForFeedback.moderation_status === 'rejected' && (
                  <ResponsiveActionButton
                    onClick={() => {
                      setShowFeedbackModal(false)
                      setSelectedArticleForFeedback(null)
                      setModerationLogs([])
                      handleEditArticle(selectedArticleForFeedback)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit & Resubmit
                  </ResponsiveActionButton>
                )}
              <ResponsiveActionButton
                variant="outline"
                onClick={() => {
                  setShowFeedbackModal(false)
                  setSelectedArticleForFeedback(null)
                  setModerationLogs([])
                }}
              >
                Close
              </ResponsiveActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add default export for lazy loading compatibility
export default ArticleManagement
