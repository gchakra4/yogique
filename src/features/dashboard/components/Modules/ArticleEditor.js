import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Image, Save, Send, Tag, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ResponsiveActionButton from '../../../../shared/components/ui/ResponsiveActionButton';
import { useAuth } from '../../../auth/contexts/AuthContext';
export function ArticleEditor({ article, onSave, onCancel, loading = false }) {
    const { isAdmin } = useAuth();
    const isSanghaGuide = false; // Temporary fix until AuthContext is updated
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        preview_text: '',
        image_url: '',
        video_url: '',
        category: 'general',
        tags: [],
        status: 'draft'
    });
    const [newTag, setNewTag] = useState('');
    const [errors, setErrors] = useState({});
    const [submitAction, setSubmitAction] = useState('draft');
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
                status: article.status
            });
        }
    }, [article, isAdmin, isSanghaGuide]);
    const categories = [
        'general',
        'beginner',
        'wellness',
        'corporate',
        'advanced',
        'meditation',
        'nutrition'
    ];
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
        ],
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim())
            newErrors.title = 'Title is required';
        else if (formData.title.length > 60)
            newErrors.title = 'Title must be 60 characters or less';
        if (!formData.content.trim())
            newErrors.content = 'Content is required';
        if (!formData.preview_text.trim())
            newErrors.preview_text = 'Preview text is required';
        else if (formData.preview_text.length > 150)
            newErrors.preview_text = 'Preview text must be 150 characters or less';
        if (formData.image_url && !isValidUrl(formData.image_url)) {
            newErrors.image_url = 'Please enter a valid image URL';
        }
        if (formData.video_url && !isValidVideoUrl(formData.video_url)) {
            newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    };
    const isValidVideoUrl = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
        return youtubeRegex.test(url) || vimeoRegex.test(url);
    };
    const handleSubmit = async (action) => {
        if (!validateForm())
            return;
        // Determine the final status based on action and user role
        let finalStatus;
        if (action === 'publish' && (isAdmin || isSanghaGuide)) {
            finalStatus = 'published';
        }
        else if (action === 'review') {
            finalStatus = 'pending_review';
        }
        else {
            finalStatus = 'draft';
        }
        try {
            const finalFormData = {
                ...formData,
                status: finalStatus
            };
            await onSave(finalFormData);
        }
        catch (error) {
            console.error('Failed to save article:', error);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-xl shadow-lg", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: article ? 'Edit Article' : 'Create New Article' }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: isAdmin || isSanghaGuide
                            ? 'You can save as draft, submit for review, or publish directly.'
                            : 'Save as draft or submit for review by sangha_guide.' })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700 mb-1", children: "Title *" }), _jsx("input", { type: "text", id: "title", value: formData.title, onChange: (e) => handleInputChange('title', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter article title (max 60 characters)", maxLength: 60 }), _jsxs("div", { className: "flex justify-between mt-1", children: [errors.title && _jsx("p", { className: "text-red-500 text-sm", children: errors.title }), _jsxs("p", { className: "text-gray-500 text-sm ml-auto", children: [formData.title.length, "/60"] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "preview_text", className: "block text-sm font-medium text-gray-700 mb-1", children: "Preview Text *" }), _jsx("textarea", { id: "preview_text", value: formData.preview_text, onChange: (e) => handleInputChange('preview_text', e.target.value), rows: 3, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.preview_text ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Brief description that appears in article cards (max 150 characters)", maxLength: 150 }), _jsxs("div", { className: "flex justify-between mt-1", children: [errors.preview_text && _jsx("p", { className: "text-red-500 text-sm", children: errors.preview_text }), _jsxs("p", { className: "text-gray-500 text-sm ml-auto", children: [formData.preview_text.length, "/150"] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }), _jsx("select", { id: "category", value: formData.category, onChange: (e) => handleInputChange('category', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: categories.map(category => (_jsx("option", { value: category, children: category.charAt(0).toUpperCase() + category.slice(1) }, category))) })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "image_url", className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Image, { className: "w-4 h-4 inline mr-1" }), "Featured Image URL"] }), _jsx("input", { type: "url", id: "image_url", value: formData.image_url, onChange: (e) => handleInputChange('image_url', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.image_url ? 'border-red-500' : 'border-gray-300'}`, placeholder: "https://example.com/image.jpg" }), errors.image_url && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.image_url }), formData.image_url && isValidUrl(formData.image_url) && (_jsx("div", { className: "mt-2", children: _jsx("img", { src: formData.image_url, alt: "Preview", className: "w-32 h-20 object-cover rounded border", onError: (e) => {
                                        e.currentTarget.style.display = 'none';
                                    } }) }))] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "video_url", className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Video, { className: "w-4 h-4 inline mr-1" }), "Video URL (YouTube/Vimeo)"] }), _jsx("input", { type: "url", id: "video_url", value: formData.video_url, onChange: (e) => handleInputChange('video_url', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.video_url ? 'border-red-500' : 'border-gray-300'}`, placeholder: "https://youtube.com/watch?v=..." }), errors.video_url && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.video_url })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Tag, { className: "w-4 h-4 inline mr-1" }), "Tags"] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: formData.tags.map((tag, index) => (_jsxs("span", { className: "bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center", children: ["#", tag, _jsx("button", { type: "button", onClick: () => handleRemoveTag(tag), className: "ml-2 text-blue-600 hover:text-blue-800", children: _jsx(X, { className: "w-3 h-3" }) })] }, index))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newTag, onChange: (e) => setNewTag(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag()), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Add a tag" }), _jsx(ResponsiveActionButton, { type: "button", onClick: handleAddTag, variant: "outline", size: "sm", children: "Add Tag" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Content *" }), _jsx("div", { className: `border rounded-lg ${errors.content ? 'border-red-500' : 'border-gray-300'}`, children: _jsx(ReactQuill, { value: formData.content, onChange: (content) => handleInputChange('content', content), modules: quillModules, theme: "snow", style: { minHeight: '300px' } }) }), errors.content && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.content })] }), _jsxs("div", { className: "flex justify-between pt-6 border-t border-gray-200", children: [_jsx(ResponsiveActionButton, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(ResponsiveActionButton, { type: "button", variant: "outline", onClick: () => handleSubmit('draft'), loading: loading && submitAction === 'draft', className: "flex items-center", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), loading && submitAction === 'draft' ? 'Saving...' : 'Save Draft'] }), !isAdmin && !isSanghaGuide && (_jsxs(ResponsiveActionButton, { type: "button", onClick: () => {
                                            setSubmitAction('review');
                                            handleSubmit('review');
                                        }, loading: loading && submitAction === 'review', className: "flex items-center bg-blue-600 hover:bg-blue-700", children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), loading && submitAction === 'review' ? 'Submitting...' : 'Submit for Review'] })), (isAdmin || isSanghaGuide) && (_jsxs(ResponsiveActionButton, { type: "button", onClick: () => {
                                            setSubmitAction('publish');
                                            handleSubmit('publish');
                                        }, loading: loading && submitAction === 'publish', className: "flex items-center bg-green-600 hover:bg-green-700", children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), loading && submitAction === 'publish' ? 'Publishing...' : 'Publish Now'] }))] })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h4", { className: "text-sm font-medium text-blue-900 mb-2", children: "Article Workflow" }), isAdmin || isSanghaGuide ? (_jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Save Draft:" }), " Keep working on your article"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Publish Now:" }), " Make article immediately available to users"] })] })) : (_jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Save Draft:" }), " Keep working on your article"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Submit for Review:" }), " Send to sangha_guide for approval"] }), _jsx("li", { children: "\u2022 Once approved, your article will be automatically published" })] }))] })] })] }));
}
export default ArticleEditor;
