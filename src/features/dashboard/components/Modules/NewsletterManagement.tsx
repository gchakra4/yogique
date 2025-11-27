import { Edit, Eye, Mail, Plus, Send, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import EmailService from '../../../../services/emailService'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton'
import { supabase } from '../../../../shared/lib/supabase'
import { createSampleNewsletters } from '../../../../utils/sampleNewsletterData'
import NewsletterCreation from './NewsletterCreation'

interface Newsletter {
  id: string
  title: string
  content: string
  subject: string
  status: string
  sent_at: string
  created_at: string
}

interface Subscriber {
  id: string
  email: string
  name: string
  status: string
  subscribed_at?: string
  created_at?: string
  date_created?: string
}

export function NewsletterManagement() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('newsletters')
  const [showNewsletterCreation, setShowNewsletterCreation] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null)
  const [sendingNewsletter, setSendingNewsletter] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Try multiple possible table names for newsletter subscriptions
      const possibleTableNames = ['newsletter_subscribers', 'newsletter_subscriptions', 'subscriptions', 'subscribers']
      let subscribersRes = null

      // Try each table name until one works
      for (const tableName of possibleTableNames) {
        try {
          const testRes = await supabase.from(tableName).select('*').limit(1)
          if (!testRes.error) {
            subscribersRes = await supabase.from(tableName).select('*')
            break
          }
        } catch (err) {
          // Table not accessible, try next one
          continue
        }
      }

      // Fetch newsletters
      const newslettersRes = await supabase.from('newsletters').select('*').order('created_at', { ascending: false })

      if (newslettersRes.error) {
        console.error('Newsletter fetch error:', newslettersRes.error)
      }

      if (!subscribersRes || subscribersRes.error) {
        console.warn('Subscribers table not accessible or empty, showing newsletters only')
        // Set empty data but don't throw error - let component render with empty state
        setNewsletters(newslettersRes.data || [])
        setSubscribers([])
        return
      }

      setNewsletters(newslettersRes.data || [])
      setSubscribers(subscribersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't break the UI - show empty state with error logged
      setNewsletters([])
      setSubscribers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNewsletter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return

    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting newsletter:', error)
    }
  }

  const handleCreateNewsletter = () => {
    setEditingNewsletter(null)
    setShowNewsletterCreation(true)
  }

  const handleEditNewsletter = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter)
    setShowNewsletterCreation(true)
  }

  const handleBackToList = () => {
    setShowNewsletterCreation(false)
    setEditingNewsletter(null)
    fetchData() // Refresh data when returning to list
  }

  const handleCreateSampleNewsletters = async () => {
    try {
      setLoading(true)
      const result = await createSampleNewsletters()

      if (result.success) {
        alert(result.message)
        await fetchData() // Refresh the data
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating sample newsletters:', error)
      alert('Error creating sample newsletters. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendNewsletter = async (newsletter: Newsletter) => {
    if (!confirm(`Are you sure you want to send "${newsletter.title}" to all subscribers?`)) return

    try {
      setSendingNewsletter(newsletter.id)

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
      })

      if (result.success) {
        alert(`Newsletter sent successfully to ${result.sentCount} subscribers!`)
        await fetchData() // Refresh to show updated status
      } else {
        alert(`Failed to send newsletter: ${result.errors.join(', ')}`)
      }

    } catch (error) {
      console.error('Error sending newsletter:', error)
      alert('Error sending newsletter. Please try again.')
    } finally {
      setSendingNewsletter(null)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString)
      return 'Invalid date'
    }
  }

  const activeSubscribers = subscribers.filter(s => s.status === 'active')

  // Show newsletter creation page
  if (showNewsletterCreation) {
    return (
      <NewsletterCreation
        onBack={handleBackToList}
        editingNewsletter={editingNewsletter}
      />
    )
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
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Mail className="w-6 h-6 mr-2" />
          Newsletter Management
        </h2>
        {activeTab === 'newsletters' && (
          <ResponsiveActionButton onClick={handleCreateNewsletter} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Newsletter
          </ResponsiveActionButton>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
              <p className="text-3xl font-bold text-gray-900">{subscribers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
              <p className="text-3xl font-bold text-gray-900">{activeSubscribers.length}</p>
            </div>
            <Mail className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Newsletters Sent</p>
              <p className="text-3xl font-bold text-gray-900">
                {newsletters.filter(n => n.status === 'sent').length}
              </p>
            </div>
            <Send className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('newsletters')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'newsletters'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Newsletters ({newsletters.length})
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscribers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Subscribers ({subscribers.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'newsletters' ? (
            <div className="space-y-4">
              {newsletters.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No newsletters yet</h3>
                  <p className="text-gray-600 mb-6">Create your first newsletter to get started.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <ResponsiveActionButton onClick={handleCreateNewsletter} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Newsletter
                    </ResponsiveActionButton>
                    <ResponsiveActionButton
                      variant="outline"
                      onClick={handleCreateSampleNewsletters}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Create Sample Newsletters
                    </ResponsiveActionButton>
                  </div>
                </div>
              ) : (
                newsletters.map((newsletter) => (
                  <div key={newsletter.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{newsletter.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{newsletter.subject}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Created: {formatDate(newsletter.created_at)}</span>
                          {newsletter.sent_at && (
                            <span>Sent: {formatDate(newsletter.sent_at)}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${newsletter.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {newsletter.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditNewsletter(newsletter)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit newsletter"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {newsletter.status === 'draft' && (
                          <button
                            onClick={() => handleSendNewsletter(newsletter)}
                            disabled={sendingNewsletter === newsletter.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Send newsletter"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => console.log('Preview newsletter:', newsletter.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Preview newsletter"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNewsletter(newsletter.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {subscribers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscribers found</h3>
                  <p className="text-gray-600 mb-2">This could mean:</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• No subscribers have signed up yet</p>
                    <p>• Database table permissions (RLS) may be preventing access</p>
                    <p>• Table name might be different than expected</p>
                    <p>• Check browser console for detailed error messages</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscriber
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscribed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscriber.name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{subscriber.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${subscriber.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {subscriber.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(subscriber.subscribed_at || subscriber.created_at || subscriber.date_created)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewsletterManagement;