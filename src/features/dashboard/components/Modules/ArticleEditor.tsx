import { Check, ChevronRight, FileText, Image, ListChecks, ListOrdered, Newspaper, Palette, PenTool, Save, Send, Tag, Video, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton'
import { useAuth } from '../../../auth/contexts/AuthContext'
import { Article } from '../../../learning/types/article'

interface ArticleEditorProps {
  article?: Article
  onSave: (articleData: Partial<Article>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ArticleEditor({ article, onSave, onCancel, loading = false }: ArticleEditorProps) {
  const { isAdmin } = useAuth()
  const isSanghaGuide = false // Temporary fix until AuthContext is updated
  type TemplateId = 'optimal' | 'light' | 'news' | 'howto' | 'listicle'

  const TEMPLATES: { id: TemplateId, label: string, desc: string, video: boolean, icon: any, color?: string }[] = [
    { id: 'optimal', label: 'Optimal', desc: 'Rich layout with image/video.', video: true, icon: Palette, color: 'blue' },
    { id: 'light', label: 'Light', desc: 'Minimal, fast reading.', video: false, icon: FileText, color: 'emerald' },
    { id: 'news', label: 'News Brief', desc: 'Short, time-sensitive update.', video: true, icon: Newspaper, color: 'indigo' },
    { id: 'howto', label: 'How-To', desc: 'Step-by-step guide.', video: false, icon: ListChecks, color: 'amber' },
    { id: 'listicle', label: 'Listicle', desc: 'Numbered tips or items.', video: false, icon: ListOrdered, color: 'fuchsia' },
  ]

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    preview_text: '',
    image_url: '',
    video_url: '',
    category: 'general',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'pending_review',
    template: 'optimal' as TemplateId
  })
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<any>({})
  const [submitAction, setSubmitAction] = useState<'draft' | 'review' | 'publish'>('draft')
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { key: 'template', label: 'Style' },
    { key: 'title', label: 'Title' },
    { key: 'media', label: 'Media' },
    { key: 'tags', label: 'Tags' },
    { key: 'content', label: 'Content' },
    { key: 'review', label: 'Review' }
  ]

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        preview_text: article.preview_text,
        image_url: article.image_url || '',
        video_url: article.video_url || '',
        category: article.category,
        tags: article.tags || [],
        // Don't allow changing from pending_review back to published for regular users
        status: article.status as 'draft' | 'published',
        template: ((article as any).template ?? 'optimal') as TemplateId
      })
    }
  }, [article, isAdmin, isSanghaGuide])

  const categories = [
    'general',
    'beginner',
    'wellness',
    'corporate',
    'advanced',
    'meditation',
    'nutrition'
  ]

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // Prefill skeleton content for empty drafts when switching template
  useEffect(() => {
    const empty = !formData.content || formData.content.trim() === ''
    if (!empty) return
    const skeleton = getTemplateSkeleton(formData.template)
    setFormData(prev => ({ ...prev, content: skeleton }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.template])

  const getTemplateSkeleton = (tpl: TemplateId): string => {
    switch (tpl) {
      case 'news':
        return `<h2>Headline</h2><p><em>City — Date</em></p><p>Write a brief update here. Keep it concise and informative.</p><h3>Key Points</h3><ul><li>Point one</li><li>Point two</li></ul>`
      case 'howto':
        return `<h2>How to [Do Something]</h2><p>Intro: what you'll achieve and prerequisites.</p><h3>Steps</h3><ol><li>Step 1: ...</li><li>Step 2: ...</li><li>Step 3: ...</li></ol><h3>Tips</h3><ul><li>Tip 1</li><li>Tip 2</li></ul>`
      case 'listicle':
        return `<h2>[Number] Things About [Topic]</h2><p>Intro: set context for the list.</p><h3>1. First item</h3><p>Why it matters...</p><h3>2. Second item</h3><p>Explain with examples...</p>`
      case 'light':
        return `<h2>Title</h2><p>Short introduction paragraph.</p><p>Main content...</p>`
      case 'optimal':
      default:
        return `<h2>Compelling Title</h2><p>Engaging preview that draws readers in.</p><h3>Section Heading</h3><p>Compose your main content here. Add images or video if needed.</p>`
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    else if (formData.title.length > 60) newErrors.title = 'Title must be 60 characters or less'

    if (!formData.content.trim()) newErrors.content = 'Content is required'

    if (!formData.preview_text.trim()) newErrors.preview_text = 'Preview text is required'
    else if (formData.preview_text.length > 150) newErrors.preview_text = 'Preview text must be 150 characters or less'

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid image URL'
    }

    if (formData.video_url && !isValidVideoUrl(formData.video_url)) {
      newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/
    return youtubeRegex.test(url) || vimeoRegex.test(url)
  }

  const handleSubmit = async (action: 'draft' | 'review' | 'publish') => {
    if (!validateForm()) return

    // Determine the final status based on action and user role
    let finalStatus: string
    if (action === 'publish' && (isAdmin || isSanghaGuide)) {
      finalStatus = 'published'
    } else if (action === 'review') {
      finalStatus = 'pending_review'
    } else {
      finalStatus = 'draft'
    }

    try {
      const finalFormData = {
        ...formData,
        status: finalStatus
      }

      await onSave(finalFormData as any)
    } catch (error) {
      console.error('Failed to save article:', error)
    }
  }

  const goNext = () => {
    // basic per-step validation before moving forward
    const key = steps[currentStep].key
    if (key === 'title') {
      if (!formData.title.trim() || !formData.preview_text.trim()) {
        setErrors((prev: any) => ({ ...prev, title: !formData.title.trim() ? 'Title is required' : '', preview_text: !formData.preview_text.trim() ? 'Preview text is required' : '' }))
        return
      }
    }
    if (key === 'content') {
      if (!formData.content.trim()) {
        setErrors((prev: any) => ({ ...prev, content: 'Content is required' }))
        return
      }
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
  }

  // Previous step function removed; navigation handled via step buttons

  const renderMobileStep = () => {
    switch (steps[currentStep].key) {
      case 'template':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">Choose a style for this article. You can change it later.</p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => {
                const Icon = t.icon
                const active = formData.template === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleInputChange('template', t.id)}
                    className={`rounded-lg border p-3 text-left ${active ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-600" />
                      <div className="font-medium">{t.label}</div>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      case 'title':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="title_mobile" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input id="title_mobile" type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter article title (max 60 characters)" maxLength={60} />
              <div className="flex justify-between mt-1">
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                <p className="text-gray-500 text-sm ml-auto">{formData.title.length}/60</p>
              </div>
            </div>
            <div>
              <label htmlFor="preview_text_mobile" className="block text-sm font-medium text-gray-700 mb-1">Preview Text *</label>
              <textarea id="preview_text_mobile" value={formData.preview_text} onChange={(e) => handleInputChange('preview_text', e.target.value)} rows={3} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.preview_text ? 'border-red-500' : 'border-gray-300'}`} placeholder="Brief description" maxLength={150} />
              <div className="flex justify-between mt-1">
                {errors.preview_text && <p className="text-red-500 text-sm">{errors.preview_text}</p>}
                <p className="text-gray-500 text-sm ml-auto">{formData.preview_text.length}/150</p>
              </div>
            </div>
          </div>
        )
      case 'media':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="image_url_mobile" className="block text-sm font-medium text-gray-700 mb-1"><Image className="w-4 h-4 inline mr-1" /> Featured Image URL {formData.template !== 'optimal' && <span className="text-xs text-gray-500">(optional)</span>}</label>
              <input id="image_url_mobile" type="url" value={formData.image_url} onChange={(e) => handleInputChange('image_url', e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.image_url ? 'border-red-500' : 'border-gray-300'}`} placeholder="https://example.com/image.jpg" />
            </div>
            {TEMPLATES.find(t => t.id === formData.template)?.video && (
              <div>
                <label htmlFor="video_url_mobile" className="block text-sm font-medium text-gray-700 mb-1"><Video className="w-4 h-4 inline mr-1" /> Video URL</label>
                <input id="video_url_mobile" type="url" value={formData.video_url} onChange={(e) => handleInputChange('video_url', e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.video_url ? 'border-red-500' : 'border-gray-300'}`} placeholder="https://youtube.com/watch?v=..." />
              </div>
            )}
          </div>
        )
      case 'tags':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><Tag className="w-4 h-4 inline mr-1" /> Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">#{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-blue-600 hover:text-blue-800"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add a tag" />
                <ResponsiveActionButton type="button" onClick={handleAddTag} variant="outline" size="sm">Add</ResponsiveActionButton>
              </div>
              <div className="mt-3">
                <label htmlFor="category_mobile" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select id="category_mobile" value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categories.map(category => <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>
        )
      case 'content':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <div className={`border rounded-lg ${errors.content ? 'border-red-500' : 'border-gray-300'}`}>
              <ReactQuill value={formData.content} onChange={(content) => handleInputChange('content', content)} modules={quillModules} theme="snow" style={{ minHeight: '220px' }} />
            </div>
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
          </div>
        )
      case 'review':
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Review</h3>
            <p className="text-sm text-gray-700">Title: <strong>{formData.title}</strong></p>
            <p className="text-sm text-gray-700">Preview: {formData.preview_text}</p>
            <p className="text-sm text-gray-700">Category: {formData.category}</p>
            <p className="text-sm text-gray-700">Tags: {formData.tags.join(', ') || '—'}</p>
            <div className="mt-2">
              <ResponsiveActionButton type="button" onClick={() => handleSubmit('draft')} variant="outline">Save Draft</ResponsiveActionButton>
              {!isAdmin && !isSanghaGuide && <ResponsiveActionButton type="button" onClick={() => { setSubmitAction('review'); handleSubmit('review') }} className="ml-2">Submit for Review</ResponsiveActionButton>}
              {(isAdmin || isSanghaGuide) && <ResponsiveActionButton type="button" onClick={() => { setSubmitAction('publish'); handleSubmit('publish') }} className="ml-2 bg-green-600 hover:bg-green-700">Publish</ResponsiveActionButton>}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const progress = Math.max(0, Math.min(100, ((currentStep + 1) / steps.length) * 100))

  return (
    <div className="bg-white sm:rounded-xl rounded-none sm:shadow-lg shadow-none -mx-4 sm:mx-0">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {article ? 'Edit Article' : 'Create New Article'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isAdmin || isSanghaGuide
            ? 'You can save as draft, submit for review, or publish directly.'
            : 'Save as draft or submit for review by sangha_guide.'}
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {/* Desktop form (hidden on small screens) */}
        <div className="hidden sm:block space-y-6">
          {/* Template selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t => {
                const ActiveIcon = t.icon
                const active = formData.template === t.id
                const activeCls = active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleInputChange('template', t.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border border-gray-200 shadow-sm ${activeCls}`}
                    title={t.desc}
                  >
                    <ActiveIcon className="w-4 h-4" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter article title (max 60 characters)"
              maxLength={60}
            />
            <div className="flex justify-between mt-1">
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              <p className="text-gray-500 text-sm ml-auto">{formData.title.length}/60</p>
            </div>
          </div>

          {/* Preview Text */}
          <div>
            <label htmlFor="preview_text" className="block text-sm font-medium text-gray-700 mb-1">
              Preview Text *
            </label>
            <textarea
              id="preview_text"
              value={formData.preview_text}
              onChange={(e) => handleInputChange('preview_text', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.preview_text ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Brief description that appears in article cards (max 150 characters)"
              maxLength={150}
            />
            <div className="flex justify-between mt-1">
              {errors.preview_text && <p className="text-red-500 text-sm">{errors.preview_text}</p>}
              <p className="text-gray-500 text-sm ml-auto">{formData.preview_text.length}/150</p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
              <Image className="w-4 h-4 inline mr-1" />
              Featured Image URL
            </label>
            <input
              type="url"
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.image_url ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>}
            {formData.image_url && isValidUrl(formData.image_url) && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-20 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Video URL (only for templates that support video) */}
          {TEMPLATES.find(t => t.id === formData.template)?.video && (
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                <Video className="w-4 h-4 inline mr-1" />
                Video URL (YouTube/Vimeo)
              </label>
              <input
                type="url"
                id="video_url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.video_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.video_url && <p className="text-red-500 text-sm mt-1">{errors.video_url}</p>}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag"
              />
              <ResponsiveActionButton
                type="button"
                onClick={handleAddTag}
                variant="outline"
                size="sm"
              >
                Add Tag
              </ResponsiveActionButton>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <div className={`border rounded-lg ${errors.content ? 'border-red-500' : 'border-gray-300'}`}>
              <ReactQuill
                value={formData.content}
                onChange={(content) => handleInputChange('content', content)}
                modules={quillModules}
                theme="snow"
                style={{ minHeight: '300px' }}
              />
            </div>
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <ResponsiveActionButton
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </ResponsiveActionButton>

            <div className="flex space-x-3">
              {/* Save as Draft Button */}
              <ResponsiveActionButton
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                loading={loading && submitAction === 'draft'}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading && submitAction === 'draft' ? 'Saving...' : 'Save Draft'}
              </ResponsiveActionButton>

              {/* Submit for Review Button (for regular users) */}
              {!isAdmin && !isSanghaGuide && (
                <ResponsiveActionButton
                  type="button"
                  onClick={() => {
                    setSubmitAction('review')
                    handleSubmit('review')
                  }}
                  loading={loading && submitAction === 'review'}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading && submitAction === 'review' ? 'Submitting...' : 'Submit for Review'}
                </ResponsiveActionButton>
              )}

              {/* Publish Button (for admins and sangha_guides) */}
              {(isAdmin || isSanghaGuide) && (
                <ResponsiveActionButton
                  type="button"
                  onClick={() => {
                    setSubmitAction('publish')
                    handleSubmit('publish')
                  }}
                  loading={loading && submitAction === 'publish'}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading && submitAction === 'publish' ? 'Publishing...' : 'Publish Now'}
                </ResponsiveActionButton>
              )}
            </div>
          </div>

          {/* Workflow Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Article Workflow</h4>
            {isAdmin || isSanghaGuide ? (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Save Draft:</strong> Keep working on your article</li>
                <li>• <strong>Publish Now:</strong> Make article immediately available to users</li>
              </ul>
            ) : (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Save Draft:</strong> Keep working on your article</li>
                <li>• <strong>Submit for Review:</strong> Send to sangha_guide for approval</li>
                <li>• Once approved, your article will be automatically published</li>
              </ul>
            )}
          </div>

        </div>

        {/* end desktop form container */}

        {/* Mobile wizard (visible only on small screens) */}
        <div className="block sm:hidden">
          <div className="mb-3 text-sm text-gray-700 dark:text-slate-300">Step {currentStep + 1} of {steps.length} — {steps[currentStep].label}</div>
          <div className="space-y-4">
            {renderMobileStep()}
          </div>

          {/* Bottom fixed nav - news-style (compact, colorful) */}
          <div className="fixed bottom-0 inset-x-0 sm:hidden z-50 supports-[backdrop-filter]:bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-700 shadow-md rounded-t-2xl px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.25rem)]">
            <div className="relative max-w-3xl mx-auto">
              {/* progress bar */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full overflow-hidden bg-gradient-to-r from-slate-200/70 to-slate-300/70 dark:from-slate-700/70 dark:to-slate-600/70">
                <div className="h-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-emerald-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Steps pill icons (compact) */}
                <div className="flex flex-1 items-center justify-between gap-1.5">
                  {steps.map((s, idx) => {
                    const active = idx === currentStep
                    const colorClass = active
                      ? s.key === 'template'
                        ? 'bg-blue-600 ring-2 ring-blue-100 text-white'
                        : s.key === 'title'
                          ? 'bg-fuchsia-600 ring-2 ring-fuchsia-100 text-white'
                          : s.key === 'media'
                            ? 'bg-rose-600 ring-2 ring-rose-100 text-white'
                            : s.key === 'tags'
                              ? 'bg-amber-500 ring-2 ring-amber-100 text-white'
                              : s.key === 'content'
                                ? 'bg-emerald-600 ring-2 ring-emerald-100 text-white'
                                : 'bg-indigo-600 ring-2 ring-indigo-100 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    const Icon = s.key === 'template' ? Palette
                      : s.key === 'title' ? PenTool
                        : s.key === 'media' ? Image
                          : s.key === 'tags' ? Tag
                            : s.key === 'content' ? FileText
                              : Check
                    return (
                      <button
                        key={s.key}
                        onClick={() => setCurrentStep(idx)}
                        aria-current={active ? 'step' : undefined}
                        className={`flex flex-col items-center flex-1 min-w-0 px-0.5 py-1 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`mt-0.5 text-[10px] font-medium truncate`}>{s.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Primary CTA */}
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={goNext}
                    className="ml-2 shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow flex items-center"
                  >
                    <span className="mr-1.5 text-sm">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit('draft')}
                    className="ml-2 shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow flex items-center"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-sm">Finish</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* spacer for fixed bar */}
          <div className="h-16 pb-[env(safe-area-inset-bottom)]"></div>
        </div>
      </div>
    </div>
  )
}

export default ArticleEditor;