import {
  ArrowLeft,
  Eye,
  Mail,
  Save,
  Send,
  Users
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import EmailService from '../../../../services/emailService'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../../shared/lib/supabase'

interface NewsletterTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  category: 'modern' | 'classic' | 'minimal' | 'corporate' | 'creative'
  htmlContent: string
  isCustomizable: boolean
  features: string[]
  bestFor: string
}

interface NewsletterBlock {
  id: string
  type: 'text' | 'image' | 'button' | 'divider' | 'social' | 'header' | 'footer' | 'hero'
  content: any
  styles: Record<string, string>
  position: number
}


interface NewsletterData {
  title: string
  subject: string
  preheader: string
  content: string
  template: string
  customizations: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    fontFamily: string
    headerImage?: string
    backgroundImage?: string
  }
  scheduledAt?: Date
  status: 'draft' | 'scheduled' | 'sent'
}

interface NewsletterCreationProps {
  onBack: () => void
  editingNewsletter?: any
}

const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Clean design with gradient backgrounds and modern styling',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+TW9kZXJuIEdyYWRpZW50PC90ZXh0Pgo8ZGVmcz4KPGxHF8ZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIzMDAiIHkyPSIyMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    category: 'modern',
    features: ['Responsive Design', 'Gradient Background', 'Image Support', 'CTA Buttons'],
    bestFor: 'Tech companies, startups, modern brands',
    htmlContent: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          {{HEADER_IMAGE}}
          <div style="padding: 40px;">
            <h1 style="color: #333; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.3;">{{TITLE}}</h1>
            <div style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">{{CONTENT}}</div>
            {{CTA_BUTTON}}
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>You received this email because you subscribed to our newsletter.</p>
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </div>
        </div>
      </div>
    `,
    isCustomizable: true
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple and elegant design with maximum readability',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzMzMzMzMyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5NaW5pbWFsIENsZWFuPC90ZXh0Pgo8L3N2Zz4K',
    category: 'minimal',
    features: ['Clean Typography', 'High Contrast', 'Simple Layout', 'Fast Loading'],
    bestFor: 'Publishers, blogs, content creators',
    htmlContent: `
      <div style="background: #ffffff; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          {{HEADER_IMAGE}}
          <div style="padding: 20px 0;">
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 600; margin: 0 0 30px 0; line-height: 1.2;">{{TITLE}}</h1>
            <div style="color: #4a4a4a; font-size: 18px; line-height: 1.7; margin-bottom: 40px;">{{CONTENT}}</div>
            {{CTA_BUTTON}}
          </div>
          <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 40px; text-align: center; color: #999; font-size: 14px;">
            <p>{{COMPANY_NAME}} • {{COMPANY_ADDRESS}}</p>
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </div>
        </div>
      </div>
    `,
    isCustomizable: true
  },
  {
    id: 'corporate-professional',
    name: 'Corporate Professional',
    description: 'Professional design perfect for business communications',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMmMzZTUwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Db3Jwb3JhdGU8L3RleHQ+Cjwvc3ZnPgo=',
    category: 'corporate',
    features: ['Corporate Branding', 'Professional Layout', 'Logo Support', 'Formal Styling'],
    bestFor: 'Corporate communications, B2B companies, financial services',
    htmlContent: `
      <div style="background: #f5f5f5; padding: 30px 20px; font-family: Georgia, serif;">
        <div style="max-width: 650px; margin: 0 auto; background: white; border: 1px solid #ddd;">
          <div style="background: #2c3e50; padding: 20px; text-align: center;">
            {{LOGO}}
            <h2 style="color: white; margin: 10px 0 0 0; font-size: 24px;">Newsletter</h2>
          </div>
          {{HEADER_IMAGE}}
          <div style="padding: 30px;">
            <h1 style="color: #2c3e50; font-size: 26px; font-weight: normal; margin: 0 0 20px 0;">{{TITLE}}</h1>
            <div style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">{{CONTENT}}</div>
            {{CTA_BUTTON}}
          </div>
          <div style="background: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 13px;">
            <p>© {{YEAR}} {{COMPANY_NAME}}. All rights reserved.</p>
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #7f8c8d;">Unsubscribe</a>
          </div>
        </div>
      </div>
    `,
    isCustomizable: true
  },
  {
    id: 'image-focused',
    name: 'Image Focused',
    description: 'Perfect for visual content and photography',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+SW1hZ2UgRm9jdXNlZDwvdGV4dD4KPGR6ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjMwMCIgeTI9IjIwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjZmY3Mzc0Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZkMjk3YiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=',
    category: 'creative',
    features: ['Full-Width Images', 'Visual Storytelling', 'Overlay Content', 'Gallery Support'],
    bestFor: 'Photographers, artists, fashion brands, visual portfolios',
    htmlContent: `
      <div style="background: {{BACKGROUND_COLOR}}; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
          {{BACKGROUND_IMAGE}}
          <div style="position: relative; z-index: 2; background: rgba(255,255,255,0.95); margin: -100px 20px 0 20px; border-radius: 8px; padding: 30px;">
            <h1 style="color: #333; font-size: 30px; font-weight: bold; margin: 0 0 15px 0; text-align: center;">{{TITLE}}</h1>
            <div style="color: #666; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 25px;">{{CONTENT}}</div>
            {{CTA_BUTTON}}
          </div>
          <div style="padding: 20px; text-align: center; background: #f8f9fa;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              <a href="{{UNSUBSCRIBE_URL}}" style="color: #666; text-decoration: none;">Unsubscribe</a> | 
              <a href="{{PREFERENCES_URL}}" style="color: #666; text-decoration: none;">Update Preferences</a>
            </p>
          </div>
        </div>
      </div>
    `,
    isCustomizable: true
  },
  {
    id: 'newsletter-magazine',
    name: 'Magazine Style',
    description: 'Multi-column layout perfect for rich content',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMiIvPgo8cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNjAiIGhlaWdodD0iNDAiIGZpbGw9IiMxYTFhMWEiLz4KPHR0eHQgeD0iNTAlIiB5PSI0NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iR2VvcmdpYSIgZm9udC1zaXplPSIxMiI+TWFnYXppbmUgU3R5bGU8L3RleHQ+Cjwvc3ZnPgo=',
    category: 'creative',
    features: ['Multi-Column', 'Rich Typography', 'Article Sections', 'Featured Content'],
    bestFor: 'Magazines, news outlets, content-heavy newsletters',
    htmlContent: `
      <div style="background: #ffffff; padding: 20px; font-family: Georgia, 'Times New Roman', serif;">
        <div style="max-width: 700px; margin: 0 auto; border: 2px solid #e0e0e0;">
          <div style="background: #1a1a1a; color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;">{{TITLE}}</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">Issue #{{ISSUE_NUMBER}} • {{DATE}}</p>
          </div>
          {{HEADER_IMAGE}}
          <div style="padding: 40px 30px;">
            <div style="font-size: 18px; line-height: 1.8; color: #333; margin-bottom: 30px;">{{CONTENT}}</div>
            <div style="border-top: 3px solid #e0e0e0; padding-top: 20px;">
              {{CTA_BUTTON}}
            </div>
          </div>
          <div style="background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">{{COMPANY_NAME}} Newsletter</p>
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #666; text-decoration: none;">Unsubscribe</a>
          </div>
        </div>
      </div>
    `,
    isCustomizable: true
  },
  {
    id: 'social-modern',
    name: 'Social Media Style',
    description: 'Modern social media inspired design',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIgcng9IjIwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5Tb2NpYWwgTW9kZXJuPC90ZXh0Pgo8ZGVmcz4KPGxHF8ZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIzMDAiIHkyPSIyMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    category: 'modern',
    features: ['Social Buttons', 'Card Layout', 'Mobile First', 'Share Features'],
    bestFor: 'Social media brands, influencers, community newsletters',
    htmlContent: `
      <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="padding: 30px 25px; text-align: center;">
            <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">{{LOGO}}</div>
            <h1 style="color: #333; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">{{TITLE}}</h1>
            <div style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">{{CONTENT}}</div>
            {{CTA_BUTTON}}
          </div>
          <div style="background: #f8f9fb; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </div>
        </div>
      </div>
    `,
    isCustomizable: true
  }
]

export function NewsletterCreation({ onBack, editingNewsletter }: NewsletterCreationProps) {
  const [currentStep, setCurrentStep] = useState<'template' | 'content' | 'design' | 'preview' | 'send'>('template')
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null)
  const [templateCategory, setTemplateCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<NewsletterTemplate | null>(null)
  const [newsletterData, setNewsletterData] = useState<NewsletterData>({
    title: editingNewsletter?.title || '',
    subject: editingNewsletter?.subject || '',
    preheader: editingNewsletter?.preheader || '',
    content: editingNewsletter?.content || '',
    template: editingNewsletter?.template || '',
    customizations: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#F3F4F6',
      fontFamily: 'Arial, sans-serif'
    },
    status: editingNewsletter?.status || 'draft'
  })
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([])
  const blockIdRef = useRef(0)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)

  // Serialize blocks to HTML at the top level so hooks order stays stable
  const serializeBlocks = (blockList: NewsletterBlock[] = blocks) => {
    const hexToRgba = (hex: string, opacity: number) => {
      const clean = hex.replace('#', '')
      const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    return blockList
      .map(b => {
        if (b.type === 'text') return `<div>${b.content}</div>`
        if (b.type === 'image')
          return b.content
            ? `<img src="${b.content}" style="max-width:100%;display:block;border:none;outline:none;"/>`
            : '<div style="color:#aaa">[Image]</div>'
        if (b.type === 'button') {
          // Prefer an explicit URL provided on the button block; fall back to site root
          const btnUrl = (b.styles && b.styles.url) || window.location.origin
          return `<a href="${btnUrl}" style="background:#3B82F6;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${b.content}</a>`
        }
        if (b.type === 'divider') return '<hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb"/>'
        if (b.type === 'hero') {
          const c = b.content || {}
          const img = c.imageUrl || ''
          const title = c.title || ''
          const text = c.text || ''
          const btnText = c.buttonText || ''
          const btnUrl = c.buttonUrl || '#'
          const align = c.align || 'center'
          const textColor = c.textColor || '#ffffff'
          const overlay = hexToRgba(c.overlayHex || '#000000', typeof c.overlayOpacity === 'number' ? c.overlayOpacity : 0.4)

          // Email-friendly-ish hero (keeps inline styles, minimal positioning)
          return `
            <div style="position:relative;text-align:${align};margin:0 auto;max-width:600px;border-radius:8px;overflow:hidden">
              ${img ? `<img src="${img}" alt="" style="width:100%;height:auto;display:block;"/>` : '<div style="width:100%;height:240px;background:#e5e7eb"></div>'}
              <div style="position:absolute;inset:0;background:${overlay};"></div>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};justify-content:center;padding:24px;gap:12px">
                ${title ? `<div style="color:${textColor};font-size:28px;line-height:1.2;font-weight:700">${title}</div>` : ''}
                ${text ? `<div style="color:${textColor};font-size:16px;line-height:1.6;max-width:52ch">${text}</div>` : ''}
                ${btnText ? `<a href="${btnUrl}" style="background:#3B82F6;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${btnText}</a>` : ''}
              </div>
            </div>
          `
        }
        return ''
      })
      .join('')
  }

  // Build full template HTML by replacing placeholders
  const buildTemplateHtml = (
    template: NewsletterTemplate | null,
    data: NewsletterData,
    blockList: NewsletterBlock[]
  ) => {
    if (!template) return data.content

    // Derive CTA from hero or first button block
    const hero = blockList.find(b => b.type === 'hero') as any
    let ctaHtml = ''
    const siteRoot = window.location.origin
    if (hero?.content?.buttonText) {
      const t = hero.content
      const btnUrl = t.buttonUrl || siteRoot
      ctaHtml = `<a href="${btnUrl}" style="background:${data.customizations.primaryColor};color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${t.buttonText}</a>`
    } else {
      const btnBlock = blockList.find(b => b.type === 'button')
      if (btnBlock?.content) {
        // prefer explicit url in block.styles.url, otherwise fallback to site root
        const btnUrl = (btnBlock.styles && btnBlock.styles.url) || siteRoot
        ctaHtml = `<a href="${btnUrl}" style="background:${data.customizations.primaryColor};color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${btnBlock.content}</a>`
      }
    }

    const headerImageHtml = data.customizations.headerImage
      ? `<img src="${data.customizations.headerImage}" alt="" style="width:100%;height:auto;display:block;border:none;outline:none;"/>`
      : ''

    const backgroundImageHtml = data.customizations.backgroundImage
      ? `<img src="${data.customizations.backgroundImage}" alt="" style="width:100%;height:auto;display:block;border:none;outline:none;"/>`
      : ''

    const vars: Record<string, string> = {
      TITLE: data.title || '',
      CONTENT: data.content || '',
      CTA_BUTTON: ctaHtml,
      HEADER_IMAGE: headerImageHtml,
      BACKGROUND_IMAGE: backgroundImageHtml,
      BACKGROUND_COLOR: data.customizations.backgroundColor || '#ffffff',
      UNSUBSCRIBE_URL: `${window.location.origin}/unsubscribe`,
      PREFERENCES_URL: `${window.location.origin}/preferences`,
      COMPANY_NAME: 'Your Company',
      COMPANY_ADDRESS: 'Your Address',
      LOGO: '',
      YEAR: String(new Date().getFullYear()),
      DATE: new Date().toLocaleDateString(),
      ISSUE_NUMBER: '1'
    }

    let html = template.htmlContent
    Object.entries(vars).forEach(([key, value]) => {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(re, value)
    })
    // Remove any leftover placeholders
    html = html.replace(/\\{\\{[^}]+\\}\\}/g, '')
    return html
  }

  // Keep hooks at top-level: sync newsletter content whenever blocks change
  useEffect(() => {
    setNewsletterData(prev => ({ ...prev, content: serializeBlocks(blocks) }))
  }, [blocks])

  const handleTemplateSelect = (template: NewsletterTemplate) => {
    setSelectedTemplate(template)
    setNewsletterData(prev => ({ ...prev, template: template.id }))
    setCurrentStep('content')
  }


  const upsertNewsletter = async <T extends Record<string, any>>(payload: T, selectRow = false) => {
    // Remove undefined id to allow default UUID
    const clean: any = { ...payload }
    if (clean.id === undefined) delete clean.id

    const run = () => selectRow
      ? supabase.from('newsletters').upsert(clean).select().single()
      : supabase.from('newsletters').upsert(clean)

    let { data, error } = await run()
    // Fallback: remove unsupported 'customizations' column if schema doesn't have it
    if (error && (error as any).code === 'PGRST204' && /'customizations' column/i.test((error as any).message) && 'customizations' in clean) {
      delete clean.customizations
        ; ({ data, error } = await (selectRow
          ? supabase.from('newsletters').upsert(clean).select().single()
          : supabase.from('newsletters').upsert(clean)))
    }
    return { data, error }
  }

  const handleSaveDraft = async () => {
    try {
      setLoading(true)
      const payload: any = {
        id: editingNewsletter?.id,
        title: newsletterData.title,
        subject: newsletterData.subject,
        content: newsletterData.content,
        template: newsletterData.template,
        customizations: newsletterData.customizations,
        status: 'draft',
        created_at: editingNewsletter?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const { error } = await upsertNewsletter(payload, false)
      if (error) throw error
      alert('Newsletter saved as draft!')
    } catch (error) {
      console.error('Error saving newsletter:', error)
      alert('Error saving newsletter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderTemplateStep = () => {
    const categories = ['all', ...Array.from(new Set(NEWSLETTER_TEMPLATES.map(t => t.category)))];
    const filteredTemplates = templateCategory === 'all'
      ? NEWSLETTER_TEMPLATES
      : NEWSLETTER_TEMPLATES.filter(t => t.category === templateCategory);

    if (filteredTemplates.length === 0) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No templates found</h2>
          <p className="text-gray-500">Please check the template configuration</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose a Template</h2>
          <p className="text-gray-600 mb-8">Select a template that matches your newsletter style</p>
        </div>
        <div className="flex justify-center mb-6 gap-2 flex-wrap px-2">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full border ${templateCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} transition`}
              onClick={() => setTemplateCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="md:border md:border-gray-200 md:rounded-lg overflow-hidden cursor-pointer hover:md:shadow-lg transition relative bg-white md:bg-white"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center" onClick={() => setPreviewTemplate(template)}>
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-contain md:object-cover"
                />
                <span className="absolute top-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs shadow">Preview</span>
              </div>
              <div className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
                <button
                  className="mt-3 w-full bg-blue-600 text-white rounded px-3 py-3 md:py-2 hover:bg-blue-700 transition"
                  onClick={() => handleTemplateSelect(template)}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-4 md:p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setPreviewTemplate(null)}
              >
                ×
              </button>
              <h3 className="text-xl font-bold mb-2">{previewTemplate.name}</h3>
              <div className="mb-2 text-gray-600">{previewTemplate.description}</div>
              <div className="mb-4">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{previewTemplate.category}</span>
              </div>
              <div className="border rounded p-2 md:p-4 bg-gray-50 mb-4 overflow-x-hidden" dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent.replace('{{TITLE}}', 'Sample Title').replace('{{CONTENT}}', 'Sample content...') }} />
              <button
                className="w-full bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 transition"
                onClick={() => { handleTemplateSelect(previewTemplate); setPreviewTemplate(null); }}
              >
                Use This Template
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContentStep = () => {
    // Available block types for drag-and-drop
    const availableBlocks = [
      { type: 'text', label: 'Text' },
      { type: 'image', label: 'Image' },
      { type: 'button', label: 'Button' },
      { type: 'divider', label: 'Divider' },
      { type: 'hero', label: 'Hero (Image + Overlay)' }
    ]

    // Drag handlers
    const onDragStart = (e, type) => {
      e.dataTransfer.setData('blockType', type)
    }
    const onDrop = (e) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('blockType')
      const id = `block-${blockIdRef.current++}`
      let content: any = ''
      if (type === 'text') content = 'New text...'
      if (type === 'button') content = 'Click Me'
      if (type === 'divider') content = ''
      if (type === 'image') content = ''
      if (type === 'hero') content = {
        imageUrl: '',
        title: 'Your headline',
        text: 'Add a short description here...'
        ,
        buttonText: 'Learn More',
        buttonUrl: '#',
        align: 'center', // 'left' | 'center' | 'right'
        overlayHex: '#000000',
        overlayOpacity: 0.4,
        textColor: '#ffffff'
      }
      setBlocks(prev => [
        ...prev,
        { id, type, content, styles: type === 'button' ? { url: '' } : {}, position: prev.length }
      ])
    }
    const onDragOver = (e) => e.preventDefault()

    // Remove block
    const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id))

    // Move block up/down
    const moveBlock = (id, dir) => {
      setBlocks(prev => {
        const idx = prev.findIndex(b => b.id === id)
        if (idx < 0) return prev
        const newBlocks = [...prev]
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= newBlocks.length) return prev
          ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]
        return newBlocks.map((b, i) => ({ ...b, position: i }))
      })
    }

    // Update block content
    const updateBlockContent = (id, value) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: value } : b))
    }
    const updateHeroField = (id, key, value) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b))
    }
    // Update arbitrary style properties for a block (e.g., button URL)
    const updateBlockStyle = (id, key, value) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, styles: { ...(b.styles || {}), [key]: value } } : b))
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Content</h2>
          <p className="text-gray-600 mb-8">Add your newsletter content and details</p>
        </div>

        {/* Basic details to enable Next button */}
        <div className="bg-white border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newsletterData.title}
                onChange={(e) => setNewsletterData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Newsletter title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newsletterData.subject}
                onChange={(e) => setNewsletterData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preheader (optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={newsletterData.preheader}
                onChange={(e) => setNewsletterData(prev => ({ ...prev, preheader: e.target.value }))}
                placeholder="Short preview text"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar: Drag blocks */}
          <div className="lg:col-span-1 space-y-3 lg:space-y-4">
            <h4 className="font-semibold mb-2">Blocks</h4>
            {availableBlocks.map(b => (
              <div
                key={b.type}
                draggable
                onDragStart={e => onDragStart(e, b.type)}
                className="md:border rounded px-3 py-3 md:py-2 bg-white shadow-sm cursor-move hover:bg-blue-50"
              >
                {b.label}
              </div>
            ))}
          </div>
          {/* Main: Drop zone and block editor */}
          <div className="lg:col-span-3 space-y-3 lg:space-y-4">
            <div
              className="min-h-32 md:border-2 border-dashed border-blue-300 rounded-lg p-3 md:p-4 bg-white"
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              {blocks.length === 0 && (
                <div className="text-gray-400 text-center py-8">Drag blocks here to build your newsletter</div>
              )}
              {blocks.map((block) => (
                <div key={block.id} className="flex items-start gap-2 mb-3 group md:border rounded p-2 hover:shadow">
                  <div className="flex-1">
                    {block.type === 'text' && (
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        value={block.content}
                        onChange={e => updateBlockContent(block.id, e.target.value)}
                        placeholder="Text block..."
                        rows={2}
                      />
                    )}
                    {block.type === 'image' && (
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={block.content}
                        onChange={e => updateBlockContent(block.id, e.target.value)}
                        placeholder="Paste image URL..."
                      />
                    )}
                    {block.type === 'button' && (
                      <>
                        <input
                          type="text"
                          className="w-full border rounded px-2 py-1 mb-2"
                          value={block.content}
                          onChange={e => updateBlockContent(block.id, e.target.value)}
                          placeholder="Button text..."
                        />
                        <input
                          type="text"
                          className="w-full border rounded px-2 py-1"
                          value={(block.styles && block.styles.url) || ''}
                          onChange={e => updateBlockStyle(block.id, 'url', e.target.value)}
                          placeholder="Button URL (https://...)"
                        />
                      </>
                    )}
                    {block.type === 'divider' && (
                      <div className="w-full border-t border-gray-300 my-2" />
                    )}
                    {block.type === 'hero' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Image URL</label>
                            <input
                              type="text"
                              className="w-full border rounded px-2 py-1"
                              value={block.content?.imageUrl || ''}
                              onChange={e => updateHeroField(block.id, 'imageUrl', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Text color</label>
                            <input
                              type="color"
                              className="w-full h-9 border rounded"
                              value={block.content?.textColor || '#ffffff'}
                              onChange={e => updateHeroField(block.id, 'textColor', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Overlay color</label>
                            <input
                              type="color"
                              className="w-full h-9 border rounded"
                              value={block.content?.overlayHex || '#000000'}
                              onChange={e => updateHeroField(block.id, 'overlayHex', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Overlay opacity ({Math.round((block.content?.overlayOpacity ?? 0.4) * 100)}%)</label>
                            <input
                              type="range"
                              min={0}
                              max={0.9}
                              step={0.05}
                              value={block.content?.overlayOpacity ?? 0.4}
                              onChange={e => updateHeroField(block.id, 'overlayOpacity', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="md:col-span-3">
                            <label className="text-xs text-gray-600">Title</label>
                            <input
                              type="text"
                              className="w-full border rounded px-2 py-1"
                              value={block.content?.title || ''}
                              onChange={e => updateHeroField(block.id, 'title', e.target.value)}
                              placeholder="Headline..."
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-xs text-gray-600">Text</label>
                            <textarea
                              className="w-full border rounded px-2 py-1"
                              rows={3}
                              value={block.content?.text || ''}
                              onChange={e => updateHeroField(block.id, 'text', e.target.value)}
                              placeholder="Short description..."
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Button text</label>
                            <input
                              type="text"
                              className="w-full border rounded px-2 py-1"
                              value={block.content?.buttonText || ''}
                              onChange={e => updateHeroField(block.id, 'buttonText', e.target.value)}
                              placeholder="Learn more"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Button link</label>
                            <input
                              type="text"
                              className="w-full border rounded px-2 py-1"
                              value={block.content?.buttonUrl || ''}
                              onChange={e => updateHeroField(block.id, 'buttonUrl', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Align</label>
                            <select
                              className="w-full border rounded px-2 py-1"
                              value={block.content?.align || 'center'}
                              onChange={e => updateHeroField(block.id, 'align', e.target.value)}
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => moveBlock(block.id, 'up')}>↑</button>
                    <button type="button" className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => moveBlock(block.id, 'down')}>↓</button>
                    <button type="button" className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200" onClick={() => removeBlock(block.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 md:border rounded p-3 md:p-4 mt-4 overflow-x-hidden">
              <h4 className="font-semibold mb-2">Live Preview</h4>
              <div dangerouslySetInnerHTML={{ __html: serializeBlocks() || '<div class="text-gray-400">No content yet</div>' }} />
            </div>
          </div>
        </div>
        <div className="flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3 px-2 md:px-0 mt-2 md:mt-0">
          <Button variant="outline" onClick={() => setCurrentStep('template')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div className="space-x-4">
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => setCurrentStep('design')} disabled={!newsletterData.title || blocks.length === 0}>
              Next: Design
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderDesignStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Customize Design</h2>
        <p className="text-gray-600 mb-8">Personalize colors and styling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <input
                type="color"
                value={newsletterData.customizations.primaryColor}
                onChange={(e) => setNewsletterData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, primaryColor: e.target.value }
                }))}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                value={newsletterData.customizations.secondaryColor}
                onChange={(e) => setNewsletterData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, secondaryColor: e.target.value }
                }))}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <input
              type="color"
              value={newsletterData.customizations.backgroundColor}
              onChange={(e) => setNewsletterData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, backgroundColor: e.target.value }
              }))}
              className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={newsletterData.customizations.fontFamily}
              onChange={(e) => setNewsletterData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, fontFamily: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
              <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
              <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">System Font</option>
            </select>
          </div>
        </div>

        <div className="lg:border-l lg:pl-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Preview</h3>
          <div className="md:border md:border-gray-200 rounded-lg overflow-hidden">
            <div
              style={{
                backgroundColor: newsletterData.customizations.backgroundColor,
                fontFamily: newsletterData.customizations.fontFamily,
                padding: '20px'
              }}
            >
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ color: newsletterData.customizations.primaryColor, marginBottom: '10px' }}>
                  {newsletterData.title}
                </h3>
                <p style={{ color: newsletterData.customizations.secondaryColor, fontSize: '14px' }}>
                  {newsletterData.content?.substring(0, 100)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3 px-2 md:px-0 mt-2 md:mt-0">
        <Button variant="outline" onClick={() => setCurrentStep('content')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Content
        </Button>
        <Button onClick={() => setCurrentStep('preview')}>
          Next: Preview
          <Eye className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const handleSendNewsletter = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)

      const payload: any = {
        id: editingNewsletter?.id,
        title: newsletterData.title,
        subject: newsletterData.subject,
        content: newsletterData.content,
        template: newsletterData.template,
        customizations: newsletterData.customizations,
        status: 'sending',
        created_at: editingNewsletter?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const { data: newsletter, error: saveError } = await upsertNewsletter(payload, true)
      if (saveError) throw saveError

      // Send the newsletter
      const result = await EmailService.sendNewsletter({
        newsletterId: (newsletter as any).id,
        subject: newsletterData.subject,
        preheader: newsletterData.preheader,
        templateId: selectedTemplate.id,
        templateVariables: {
          title: newsletterData.title,
          content: newsletterData.content,
          headerImage: newsletterData.customizations.headerImage,
          backgroundImage: newsletterData.customizations.backgroundImage,
          primaryColor: newsletterData.customizations.primaryColor,
          secondaryColor: newsletterData.customizations.secondaryColor,
          backgroundColor: newsletterData.customizations.backgroundColor,
          fontFamily: newsletterData.customizations.fontFamily,
          unsubscribeUrl: `${window.location.origin}/unsubscribe`,
          preferencesUrl: `${window.location.origin}/preferences`,
          companyName: 'Your Company',
          companyAddress: 'Your Address'
        }
      })

      if (result.success) {
        alert(`Newsletter sent successfully to ${result.sentCount} subscribers!`)
        onBack()
      } else {
        alert(`Failed to send newsletter: ${result.errors.join(', ')}`)
      }

    } catch (error) {
      console.error('Error sending newsletter:', error)
      alert('Error sending newsletter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!selectedTemplate) return

    const testEmail = prompt('Enter test email address:')
    if (!testEmail) return

    try {
      setLoading(true)

      const success = await EmailService.sendTestEmail(
        selectedTemplate.id,
        {
          title: newsletterData.title,
          content: newsletterData.content,
          headerImage: newsletterData.customizations.headerImage,
          backgroundImage: newsletterData.customizations.backgroundImage,
          primaryColor: newsletterData.customizations.primaryColor,
          secondaryColor: newsletterData.customizations.secondaryColor,
          backgroundColor: newsletterData.customizations.backgroundColor,
          fontFamily: newsletterData.customizations.fontFamily,
          unsubscribeUrl: '#test-unsubscribe',
          companyName: 'Test Company'
        },
        testEmail
      )

      if (success) {
        alert(`Test email sent to ${testEmail}!`)
      } else {
        alert('Failed to send test email')
      }

    } catch (error) {
      console.error('Error sending test email:', error)
      alert('Error sending test email')
    } finally {
      setLoading(false)
    }
  }

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Preview & Send</h2>
        <p className="text-gray-600 mb-8">Review your newsletter before sending</p>
      </div>

      <div className="bg-white md:border md:border-gray-200 rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to Send</h3>
            <p className="text-sm text-gray-600">Your newsletter is ready to be sent to all subscribers</p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{subscriberCount ?? '…'} subscribers</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              <span>Newsletter</span>
            </div>
          </div>
        </div>

        {subscriberCount === 0 && (
          <div className="mb-4 p-3 rounded bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">
            No subscribers found. Add subscribers to proceed sending to an audience.
          </div>
        )}

        <div className="md:border md:border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 md:px-4 py-2 md:border-b md:border-gray-200">
            <div className="text-sm">
              <strong>Subject:</strong> {newsletterData.subject}
            </div>
            <div className="text-xs text-gray-600">
              <strong>Preheader:</strong> {newsletterData.preheader}
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-x-hidden">
            <div
              dangerouslySetInnerHTML={{
                __html: buildTemplateHtml(selectedTemplate, newsletterData, blocks)
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3 px-2 md:px-0 mt-2 md:mt-0">
        <Button variant="outline" onClick={() => setCurrentStep('design')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Design
        </Button>
        <div className="space-x-4">
          <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" onClick={handleTestEmail} disabled={loading}>
            <Mail className="w-4 h-4 mr-2" />
            Send Test Email
          </Button>
          <Button onClick={handleSendNewsletter} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send Newsletter'}
          </Button>
        </div>
      </div>
    </div>
  )

  // Fetch subscriber count (tries common table names)
  useEffect(() => {
    let active = true
      ; (async () => {
        const candidates = ['newsletter_subscribers', 'subscribers', 'email_subscribers']
        let found = 0
        for (const tbl of candidates) {
          const { count, error } = await supabase.from(tbl).select('*', { count: 'exact', head: true })
          if (!error) {
            found = count ?? 0
            break
          }
        }
        if (active) setSubscriberCount(found)
      })()
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="outline" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create Newsletter</h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {['template', 'content', 'design', 'preview'].map((step, index) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${['template', 'content', 'design', 'preview'].indexOf(currentStep) >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-8">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-center">Processing...</p>
            </div>
          </div>
        )}

        {currentStep === 'template' && renderTemplateStep()}
        {currentStep === 'content' && renderContentStep()}
        {currentStep === 'design' && renderDesignStep()}
        {currentStep === 'preview' && renderPreviewStep()}
      </div>
    </div>
  )
}

export default NewsletterCreation
