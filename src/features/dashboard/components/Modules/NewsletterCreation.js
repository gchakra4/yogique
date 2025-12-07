import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft, Eye, Mail, Save, Send, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmailService from '../../../../services/emailService';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
const NEWSLETTER_TEMPLATES = [
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
];
export function NewsletterCreation({ onBack, editingNewsletter }) {
    const [currentStep, setCurrentStep] = useState('template');
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateCategory, setTemplateCategory] = useState('all');
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [simpleMode, setSimpleMode] = useState(true);
    const [newsletterData, setNewsletterData] = useState({
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
    });
    const [blocks, setBlocks] = useState([]);
    const blockIdRef = useRef(0);
    const [subscriberCount, setSubscriberCount] = useState(null);
    // Serialize blocks to HTML at the top level so hooks order stays stable
    const serializeBlocks = (blockList = blocks) => {
        const hexToRgba = (hex, opacity) => {
            const clean = hex.replace('#', '');
            const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };
        return blockList
            .map(b => {
            if (b.type === 'text')
                return `<div>${b.content}</div>`;
            if (b.type === 'image')
                return b.content
                    ? `<img src="${b.content}" style="max-width:100%;display:block;border:none;outline:none;"/>`
                    : '<div style="color:#aaa">[Image]</div>';
            if (b.type === 'button') {
                // Prefer an explicit URL provided on the button block; fall back to site root
                const btnUrl = (b.styles && b.styles.url) || window.location.origin;
                return `<a href="${btnUrl}" style="background:#3B82F6;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${b.content}</a>`;
            }
            if (b.type === 'divider')
                return '<hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb"/>';
            if (b.type === 'hero') {
                const c = b.content || {};
                const img = c.imageUrl || '';
                const title = c.title || '';
                const text = c.text || '';
                const btnText = c.buttonText || '';
                const btnUrl = c.buttonUrl || '#';
                const align = c.align || 'center';
                const textColor = c.textColor || '#ffffff';
                const overlay = hexToRgba(c.overlayHex || '#000000', typeof c.overlayOpacity === 'number' ? c.overlayOpacity : 0.4);
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
          `;
            }
            return '';
        })
            .join('');
    };
    // Build full template HTML by replacing placeholders
    const buildTemplateHtml = (template, data, blockList) => {
        if (!template)
            return data.content;
        // Derive CTA from hero or first button block
        const hero = blockList.find(b => b.type === 'hero');
        let ctaHtml = '';
        const siteRoot = window.location.origin;
        if (hero?.content?.buttonText) {
            const t = hero.content;
            const btnUrl = t.buttonUrl || siteRoot;
            ctaHtml = `<a href="${btnUrl}" style="background:${data.customizations.primaryColor};color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${t.buttonText}</a>`;
        }
        else {
            const btnBlock = blockList.find(b => b.type === 'button');
            if (btnBlock?.content) {
                // prefer explicit url in block.styles.url, otherwise fallback to site root
                const btnUrl = (btnBlock.styles && btnBlock.styles.url) || siteRoot;
                ctaHtml = `<a href="${btnUrl}" style="background:${data.customizations.primaryColor};color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">${btnBlock.content}</a>`;
            }
        }
        const headerImageHtml = data.customizations.headerImage
            ? `<img src="${data.customizations.headerImage}" alt="" style="width:100%;height:auto;display:block;border:none;outline:none;"/>`
            : '';
        const backgroundImageHtml = data.customizations.backgroundImage
            ? `<img src="${data.customizations.backgroundImage}" alt="" style="width:100%;height:auto;display:block;border:none;outline:none;"/>`
            : '';
        const vars = {
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
        };
        let html = template.htmlContent;
        Object.entries(vars).forEach(([key, value]) => {
            const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            html = html.replace(re, value);
        });
        // Remove any leftover placeholders
        html = html.replace(/\\{\\{[^}]+\\}\\}/g, '');
        return html;
    };
    // Keep hooks at top-level: sync newsletter content whenever blocks change
    useEffect(() => {
        setNewsletterData(prev => ({ ...prev, content: serializeBlocks(blocks) }));
    }, [blocks]);
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setNewsletterData(prev => ({ ...prev, template: template.id }));
        setCurrentStep('content');
        setSimpleMode(true);
    };
    const upsertNewsletter = async (payload, selectRow = false) => {
        // Remove undefined id to allow default UUID
        const clean = { ...payload };
        if (clean.id === undefined)
            delete clean.id;
        const run = () => selectRow
            ? supabase.from('newsletters').upsert(clean).select().single()
            : supabase.from('newsletters').upsert(clean);
        let { data, error } = await run();
        // Fallback: remove unsupported 'customizations' column if schema doesn't have it
        if (error && error.code === 'PGRST204' && /'customizations' column/i.test(error.message) && 'customizations' in clean) {
            delete clean.customizations;
            ({ data, error } = await (selectRow
                ? supabase.from('newsletters').upsert(clean).select().single()
                : supabase.from('newsletters').upsert(clean)));
        }
        return { data, error };
    };
    const handleSaveDraft = async () => {
        try {
            setLoading(true);
            const payload = {
                id: editingNewsletter?.id,
                title: newsletterData.title,
                subject: newsletterData.subject,
                content: newsletterData.content,
                template: newsletterData.template,
                customizations: newsletterData.customizations,
                status: 'draft',
                created_at: editingNewsletter?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { error } = await upsertNewsletter(payload, false);
            if (error)
                throw error;
            alert('Newsletter saved as draft!');
        }
        catch (error) {
            console.error('Error saving newsletter:', error);
            alert('Error saving newsletter. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const renderTemplateStep = () => {
        const categories = ['all', ...Array.from(new Set(NEWSLETTER_TEMPLATES.map(t => t.category)))];
        const filteredTemplates = templateCategory === 'all'
            ? NEWSLETTER_TEMPLATES
            : NEWSLETTER_TEMPLATES.filter(t => t.category === templateCategory);
        if (filteredTemplates.length === 0) {
            return (_jsxs("div", { className: "text-center py-12", children: [_jsx("h2", { className: "text-xl text-gray-600", children: "No templates found" }), _jsx("p", { className: "text-gray-500", children: "Please check the template configuration" })] }));
        }
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Choose a Template" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Select a template that matches your newsletter style" })] }), _jsx("div", { className: "flex justify-center mb-6 gap-2 flex-wrap px-2", children: categories.map(cat => (_jsx("button", { className: `px-4 py-2 rounded-full border ${templateCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} transition`, onClick: () => setTemplateCategory(cat), children: cat.charAt(0).toUpperCase() + cat.slice(1) }, cat))) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:overflow-visible overflow-x-auto snap-x snap-mandatory pb-2 -mx-3 px-3", children: filteredTemplates.map((template) => (_jsxs("div", { className: "md:border md:border-gray-200 md:rounded-lg overflow-hidden cursor-pointer hover:md:shadow-lg transition relative bg-white md:bg-white snap-center min-w-[85%] md:min-w-0", children: [_jsxs("div", { className: "h-48 bg-gray-100 flex items-center justify-center", onClick: () => setPreviewTemplate(template), children: [_jsx("img", { src: template.thumbnail, alt: template.name, className: "w-full h-full object-contain md:object-cover" }), _jsx("span", { className: "absolute top-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs shadow", children: "Preview" })] }), _jsxs("div", { className: "p-3 md:p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: template.name }), _jsx("span", { className: "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full", children: template.category })] }), _jsx("p", { className: "text-sm text-gray-600", children: template.description }), _jsx("button", { className: "mt-3 w-full bg-blue-600 text-white rounded px-3 py-3 md:py-2 hover:bg-blue-700 transition", onClick: () => handleTemplateSelect(template), children: "Select" })] })] }, template.id))) }), previewTemplate && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full p-4 md:p-6 relative", children: [_jsx("button", { className: "absolute top-2 right-2 text-gray-500 hover:text-gray-700", onClick: () => setPreviewTemplate(null), children: "\u00D7" }), _jsx("h3", { className: "text-xl font-bold mb-2", children: previewTemplate.name }), _jsx("div", { className: "mb-2 text-gray-600", children: previewTemplate.description }), _jsx("div", { className: "mb-4", children: _jsx("span", { className: "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full", children: previewTemplate.category }) }), _jsx("div", { className: "border rounded p-2 md:p-4 bg-gray-50 mb-4 overflow-x-hidden", dangerouslySetInnerHTML: { __html: previewTemplate.htmlContent.replace('{{TITLE}}', 'Sample Title').replace('{{CONTENT}}', 'Sample content...') } }), _jsx("button", { className: "w-full bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 transition", onClick: () => { handleTemplateSelect(previewTemplate); setPreviewTemplate(null); }, children: "Use This Template" })] }) }))] }));
    };
    const renderContentStep = () => {
        // Advanced drag-and-drop helpers removed in simple-first iteration.
        // Simple mode handled by separate renderer
        // Advanced mode (drag/drop)
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Create Your Content" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Add your newsletter content and details" })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { className: "text-sm text-blue-600", onClick: () => setSimpleMode(true), children: "Switch to Simple Mode" }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Add Your Content" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Fill in the fields; no dragging needed" })] }), _jsxs("div", { className: "bg-white md:border rounded-lg p-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.title, onChange: (e) => setNewsletterData(prev => ({ ...prev, title: e.target.value })), placeholder: "Newsletter title" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.subject, onChange: (e) => setNewsletterData(prev => ({ ...prev, subject: e.target.value })), placeholder: "Email subject" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Preheader (optional)" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.preheader, onChange: (e) => setNewsletterData(prev => ({ ...prev, preheader: e.target.value })), placeholder: "Short preview text" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Main Content" }), _jsx("textarea", { className: "w-full px-3 py-2 border rounded", rows: 6, value: newsletterData.content, onChange: (e) => setNewsletterData(prev => ({ ...prev, content: e.target.value })), placeholder: "Write your newsletter..." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Header Image URL" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.customizations.headerImage || '', onChange: (e) => setNewsletterData(prev => ({ ...prev, customizations: { ...prev.customizations, headerImage: e.target.value } })), placeholder: "https://..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Background Image URL" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.customizations.backgroundImage || '', onChange: (e) => setNewsletterData(prev => ({ ...prev, customizations: { ...prev.customizations, backgroundImage: e.target.value } })), placeholder: "https://..." })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "CTA Button Text" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: blocks.find(b => b.type === 'button')?.content || '', onChange: (e) => {
                                                        const existing = blocks.find(b => b.type === 'button');
                                                        if (existing) {
                                                            setBlocks(prev => prev.map(b => b.id === existing.id ? { ...b, content: e.target.value } : b));
                                                        }
                                                        else {
                                                            const id = `block-${blockIdRef.current++}`;
                                                            setBlocks(prev => [...prev, { id, type: 'button', content: e.target.value, styles: { url: '' }, position: prev.length }]);
                                                        }
                                                    }, placeholder: "Buy now" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "CTA Button URL" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: blocks.find(b => b.type === 'button')?.styles?.url || '', onChange: (e) => {
                                                        const existing = blocks.find(b => b.type === 'button');
                                                        if (existing) {
                                                            setBlocks(prev => prev.map(b => b.id === existing.id ? { ...b, styles: { ...(b.styles || {}), url: e.target.value } } : b));
                                                        }
                                                        else {
                                                            const id = `block-${blockIdRef.current++}`;
                                                            setBlocks(prev => [...prev, { id, type: 'button', content: 'Click', styles: { url: e.target.value }, position: prev.length }]);
                                                        }
                                                    }, placeholder: "https://..." })] })] })] }), _jsxs("div", { className: "flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3", children: [_jsxs(Button, { variant: "outline", onClick: () => setCurrentStep('template'), children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Templates"] }), _jsxs("div", { className: "space-x-4", children: [_jsxs(Button, { variant: "outline", onClick: handleSaveDraft, disabled: loading, children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Save Draft"] }), _jsx(Button, { onClick: () => setCurrentStep('design'), disabled: !newsletterData.title || !newsletterData.content, children: "Next: Design" })] })] })] })] }));
    };
    const renderSimpleContentStep = () => {
        // Simple mode: form fields mapped to template placeholders
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Add Your Content" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Fill in the fields; no dragging needed" })] }), _jsx("div", { className: "bg-white border rounded-lg p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.title, onChange: (e) => setNewsletterData(prev => ({ ...prev, title: e.target.value })), placeholder: "Newsletter title" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.subject, onChange: (e) => setNewsletterData(prev => ({ ...prev, subject: e.target.value })), placeholder: "Email subject" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Preheader (optional)" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.preheader, onChange: (e) => setNewsletterData(prev => ({ ...prev, preheader: e.target.value })), placeholder: "Short preview text" })] })] }) }), _jsxs("div", { className: "bg-white md:border rounded-lg p-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Header Image URL" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.customizations.headerImage || '', onChange: (e) => setNewsletterData(prev => ({ ...prev, customizations: { ...prev.customizations, headerImage: e.target.value } })), placeholder: "https://..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Background Image URL" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: newsletterData.customizations.backgroundImage || '', onChange: (e) => setNewsletterData(prev => ({ ...prev, customizations: { ...prev.customizations, backgroundImage: e.target.value } })), placeholder: "https://..." })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "CTA Button Text" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: blocks.find(b => b.type === 'button')?.content || '', onChange: (e) => {
                                                const existing = blocks.find(b => b.type === 'button');
                                                if (existing) {
                                                    setBlocks(prev => prev.map(b => b.id === existing.id ? { ...b, content: e.target.value } : b));
                                                }
                                                else {
                                                    const id = `block-${blockIdRef.current++}`;
                                                    setBlocks(prev => [...prev, { id, type: 'button', content: e.target.value, styles: { url: '' }, position: prev.length }]);
                                                }
                                            }, placeholder: "Buy now" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "CTA Button URL" }), _jsx("input", { type: "text", className: "w-full px-3 py-2 border rounded", value: blocks.find(b => b.type === 'button')?.styles?.url || '', onChange: (e) => {
                                                const existing = blocks.find(b => b.type === 'button');
                                                if (existing) {
                                                    setBlocks(prev => prev.map(b => b.id === existing.id ? { ...b, styles: { ...(b.styles || {}), url: e.target.value } } : b));
                                                }
                                                else {
                                                    const id = `block-${blockIdRef.current++}`;
                                                    setBlocks(prev => [...prev, { id, type: 'button', content: 'Click', styles: { url: e.target.value }, position: prev.length }]);
                                                }
                                            }, placeholder: "https://..." })] })] })] }), _jsxs("div", { className: "flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3", children: [_jsxs(Button, { variant: "outline", onClick: () => setCurrentStep('template'), children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Templates"] }), _jsxs("div", { className: "space-x-4", children: [_jsxs(Button, { variant: "outline", onClick: handleSaveDraft, disabled: loading, children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Save Draft"] }), _jsx(Button, { onClick: () => setCurrentStep('design'), disabled: !newsletterData.title || !newsletterData.content, children: "Next: Design" })] })] })] }));
    };
    const renderDesignStep = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Customize Design" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Personalize colors and styling" })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { className: "text-sm text-blue-600", onClick: () => setSimpleMode(!simpleMode), children: simpleMode ? 'Switch to Advanced Mode' : 'Switch to Simple Mode' }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Primary Color" }), _jsx("input", { type: "color", value: newsletterData.customizations.primaryColor, onChange: (e) => setNewsletterData(prev => ({
                                                    ...prev,
                                                    customizations: { ...prev.customizations, primaryColor: e.target.value }
                                                })), className: "w-full h-12 border border-gray-300 rounded-lg cursor-pointer" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Secondary Color" }), _jsx("input", { type: "color", value: newsletterData.customizations.secondaryColor, onChange: (e) => setNewsletterData(prev => ({
                                                    ...prev,
                                                    customizations: { ...prev.customizations, secondaryColor: e.target.value }
                                                })), className: "w-full h-12 border border-gray-300 rounded-lg cursor-pointer" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Background Color" }), _jsx("input", { type: "color", value: newsletterData.customizations.backgroundColor, onChange: (e) => setNewsletterData(prev => ({
                                            ...prev,
                                            customizations: { ...prev.customizations, backgroundColor: e.target.value }
                                        })), className: "w-full h-12 border border-gray-300 rounded-lg cursor-pointer" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Font Family" }), _jsxs("select", { value: newsletterData.customizations.fontFamily, onChange: (e) => setNewsletterData(prev => ({
                                            ...prev,
                                            customizations: { ...prev.customizations, fontFamily: e.target.value }
                                        })), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "Arial, sans-serif", children: "Arial" }), _jsx("option", { value: "Georgia, serif", children: "Georgia" }), _jsx("option", { value: "'Times New Roman', serif", children: "Times New Roman" }), _jsx("option", { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", children: "Helvetica" }), _jsx("option", { value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", children: "Segoe UI" }), _jsx("option", { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", children: "System Font" })] })] })] }), _jsxs("div", { className: "lg:border-l lg:pl-8", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Design Preview" }), _jsx("div", { className: "md:border md:border-gray-200 rounded-lg overflow-hidden", children: _jsx("div", { style: {
                                        backgroundColor: newsletterData.customizations.backgroundColor,
                                        fontFamily: newsletterData.customizations.fontFamily,
                                        padding: '20px'
                                    }, children: _jsxs("div", { style: { backgroundColor: 'white', padding: '20px', borderRadius: '8px' }, children: [_jsx("h3", { style: { color: newsletterData.customizations.primaryColor, marginBottom: '10px' }, children: newsletterData.title }), _jsxs("p", { style: { color: newsletterData.customizations.secondaryColor, fontSize: '14px' }, children: [newsletterData.content?.substring(0, 100), "..."] })] }) }) })] })] }), _jsxs("div", { className: "flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3 px-2 md:px-0 mt-2 md:mt-0", children: [_jsxs(Button, { variant: "outline", onClick: () => setCurrentStep('content'), children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Content"] }), _jsxs(Button, { onClick: () => setCurrentStep('preview'), children: ["Next: Preview", _jsx(Eye, { className: "w-4 h-4 ml-2" })] })] })] }));
    const handleSendNewsletter = async () => {
        if (!selectedTemplate)
            return;
        try {
            setLoading(true);
            const payload = {
                id: editingNewsletter?.id,
                title: newsletterData.title,
                subject: newsletterData.subject,
                content: newsletterData.content,
                template: newsletterData.template,
                customizations: newsletterData.customizations,
                status: 'sending',
                created_at: editingNewsletter?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: newsletter, error: saveError } = await upsertNewsletter(payload, true);
            if (saveError)
                throw saveError;
            // Send the newsletter
            const result = await EmailService.sendNewsletter({
                newsletterId: newsletter.id,
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
            });
            if (result.success) {
                alert(`Newsletter sent successfully to ${result.sentCount} subscribers!`);
                onBack();
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
            setLoading(false);
        }
    };
    const handleTestEmail = async () => {
        if (!selectedTemplate)
            return;
        const testEmail = prompt('Enter test email address:');
        if (!testEmail)
            return;
        try {
            setLoading(true);
            const success = await EmailService.sendTestEmail(selectedTemplate.id, {
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
            }, testEmail);
            if (success) {
                alert(`Test email sent to ${testEmail}!`);
            }
            else {
                alert('Failed to send test email');
            }
        }
        catch (error) {
            console.error('Error sending test email:', error);
            alert('Error sending test email');
        }
        finally {
            setLoading(false);
        }
    };
    const renderPreviewStep = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Preview & Send" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Review your newsletter before sending" })] }), _jsxs("div", { className: "bg-white md:border md:border-gray-200 rounded-lg p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Ready to Send" }), _jsx("p", { className: "text-sm text-gray-600", children: "Your newsletter is ready to be sent to all subscribers" })] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), _jsxs("span", { children: [subscriberCount ?? '…', " subscribers"] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-1" }), _jsx("span", { children: "Newsletter" })] })] })] }), subscriberCount === 0 && (_jsx("div", { className: "mb-4 p-3 rounded bg-yellow-50 text-yellow-800 text-sm border border-yellow-200", children: "No subscribers found. Add subscribers to proceed sending to an audience." })), _jsxs("div", { className: "md:border md:border-gray-200 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "bg-gray-50 px-3 md:px-4 py-2 md:border-b md:border-gray-200", children: [_jsxs("div", { className: "text-sm", children: [_jsx("strong", { children: "Subject:" }), " ", newsletterData.subject] }), _jsxs("div", { className: "text-xs text-gray-600", children: [_jsx("strong", { children: "Preheader:" }), " ", newsletterData.preheader] })] }), _jsx("div", { className: "p-4 md:p-6 overflow-x-hidden", children: _jsx("div", { dangerouslySetInnerHTML: {
                                        __html: buildTemplateHtml(selectedTemplate, newsletterData, blocks)
                                    } }) })] })] }), _jsxs("div", { className: "flex justify-between sticky bottom-0 bg-white/80 backdrop-blur-md py-3 px-2 md:px-0 mt-2 md:mt-0", children: [_jsxs(Button, { variant: "outline", onClick: () => setCurrentStep('design'), children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Design"] }), _jsxs("div", { className: "space-x-4", children: [_jsxs(Button, { variant: "outline", onClick: handleSaveDraft, disabled: loading, children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Save Draft"] }), _jsxs(Button, { variant: "outline", onClick: handleTestEmail, disabled: loading, children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "Send Test Email"] }), _jsxs(Button, { onClick: handleSendNewsletter, disabled: loading, className: "bg-green-600 hover:bg-green-700", children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), loading ? 'Sending...' : 'Send Newsletter'] })] })] })] }));
    // Fetch subscriber count (tries common table names)
    useEffect(() => {
        let active = true;
        (async () => {
            const candidates = ['newsletter_subscribers', 'subscribers', 'email_subscribers'];
            let found = 0;
            for (const tbl of candidates) {
                const { count, error } = await supabase.from(tbl).select('*', { count: 'exact', head: true });
                if (!error) {
                    found = count ?? 0;
                    break;
                }
            }
            if (active)
                setSubscriberCount(found);
        })();
        return () => { active = false; };
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 overflow-x-hidden", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Button, { variant: "outline", onClick: onBack, className: "mr-4", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Create Newsletter" })] }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("div", { className: "flex items-center space-x-1", children: ['template', 'content', 'design', 'preview'].map((step, index) => (_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${['template', 'content', 'design', 'preview'].indexOf(currentStep) >= index
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600'}`, children: index + 1 }, step))) }) })] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-8", children: [loading && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "mt-4 text-center", children: "Processing..." })] }) })), currentStep === 'template' && renderTemplateStep(), currentStep === 'content' && (simpleMode ? renderSimpleContentStep() : renderContentStep()), currentStep === 'design' && renderDesignStep(), currentStep === 'preview' && renderPreviewStep()] }), _jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden", children: _jsx("div", { className: "flex items-center justify-between", children: [
                        { id: 'template', label: 'Templates', icon: '🖼️' },
                        { id: 'content', label: 'Content', icon: '✍️' },
                        { id: 'design', label: 'Design', icon: '🎨' },
                        { id: 'preview', label: 'Preview', icon: '👁️' },
                    ].map(item => (_jsxs("button", { onClick: () => setCurrentStep(item.id), className: `flex flex-col items-center text-xs ${currentStep === item.id ? 'text-blue-600' : 'text-gray-600'}`, children: [_jsx("span", { className: "text-lg", children: item.icon }), _jsx("span", { children: item.label })] }, item.id))) }) })] }));
}
export default NewsletterCreation;
