import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Clock, Globe, Mail, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
export function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim())
            newErrors.name = 'Name is required';
        if (!formData.email.trim())
            newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = 'Email is invalid';
        if (!formData.subject.trim())
            newErrors.subject = 'Subject is required';
        if (!formData.message.trim())
            newErrors.message = 'Message is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setLoading(true);
        try {
            const contactData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || '',
                subject: formData.subject,
                message: formData.message,
                status: 'new'
            };
            const { error } = await supabase
                .from('contact_messages')
                .insert([contactData]);
            if (error) {
                throw error;
            }
            setSubmitted(true);
        }
        catch (error) {
            setErrors({ general: error.message || 'An error occurred while sending your message.' });
        }
        finally {
            setLoading(false);
        }
    };
    const contactInfo = [
        {
            icon: _jsx(Globe, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }),
            title: "Global Reach",
            details: ["Available worldwide", "Online sessions only"],
            action: null
        },
        {
            icon: _jsx(Mail, { className: "w-6 h-6 text-green-600 dark:text-green-400" }),
            title: "Email Us",
            details: ["hello@yogodaan.com"],
            action: "Send Email"
        },
        {
            icon: _jsx(MessageCircle, { className: "w-6 h-6 text-purple-600 dark:text-purple-400" }),
            title: "Quick Response",
            details: ["24-48 hour response time"],
            action: null
        },
        {
            icon: _jsx(Clock, { className: "w-6 h-6 text-orange-600 dark:text-orange-400" }),
            title: "Flexible Hours",
            details: ["Sessions available 24/7", "Across all time zones"],
            action: null
        }
    ];
    const timeZones = [
        { zone: "PST (UTC-8)", time: "06:00 AM - 10:00 PM" },
        { zone: "EST (UTC-5)", time: "09:00 AM - 01:00 AM" },
        { zone: "GMT (UTC+0)", time: "02:00 PM - 06:00 AM" },
        { zone: "IST (UTC+5:30)", time: "07:30 PM - 11:30 AM" },
        { zone: "JST (UTC+9)", time: "11:00 PM - 03:00 PM" },
        { zone: "AEST (UTC+10)", time: "12:00 AM - 04:00 PM" }
    ];
    if (submitted) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center", children: _jsx("div", { className: "max-w-md mx-auto px-4", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Send, { className: "w-8 h-8 text-green-600 dark:text-green-400" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4", children: "Message Sent!" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "Thank you for contacting us. We'll get back to you within 24-48 hours." }), _jsx(Button, { onClick: () => {
                                setSubmitted(false);
                                setFormData({
                                    name: '',
                                    email: '',
                                    phone: '',
                                    subject: '',
                                    message: ''
                                });
                            }, children: "Send Another Message" })] }) }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-slate-900", children: [_jsx("section", { className: "bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 dark:text-white mb-6", children: "Begin Your Wellness Journey" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300 leading-relaxed", children: "Schedule a class or learn more about our programs. We're here to support your wellness goals and answer any questions you may have." })] }) }), _jsx("section", { className: "py-20 bg-white dark:bg-slate-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16", children: contactInfo.map((info, index) => (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6 text-center hover:shadow-xl transition-all duration-300", children: [_jsx("div", { className: "flex justify-center mb-4", children: info.icon }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-3", children: info.title }), _jsx("div", { className: "space-y-1 mb-4", children: info.details.map((detail, idx) => (_jsx("p", { className: "text-gray-600 dark:text-slate-300 text-sm", children: detail }, idx))) }), info.action && (_jsx("button", { className: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors text-sm", children: info.action }))] }, index))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12", children: [_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-6", children: "Send Us a Message" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 dark:text-red-400 text-sm", children: errors.general }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Name *" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Your full name" }), errors.name && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Email *" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "your@email.com" }), errors.email && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.email })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Phone (Optional)" }), _jsx("input", { type: "tel", id: "phone", name: "phone", value: formData.phone, onChange: handleInputChange, className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400", placeholder: "+1 (555) 123-4567" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "subject", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Subject *" }), _jsx("input", { type: "text", id: "subject", name: "subject", value: formData.subject, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.subject ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "How can we help?" }), errors.subject && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.subject })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Message *" }), _jsx("textarea", { id: "message", name: "message", rows: 5, value: formData.message, onChange: handleInputChange, placeholder: "Tell us about your wellness goals, questions about our services, or how we can help you...", className: `w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.message ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}` }), errors.message && _jsx("p", { className: "text-red-500 dark:text-red-400 text-sm mt-1", children: errors.message })] }), _jsx(Button, { type: "submit", loading: loading, className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center", children: loading ? ('Sending...') : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), "Send Message"] })) })] })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-6", children: "Global Time Zone Reference" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "We offer sessions across all time zones. Here are our typical availability windows:" }), _jsx("div", { className: "space-y-4", children: timeZones.map((tz, index) => (_jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg", children: [_jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: tz.zone }), _jsx("span", { className: "text-sm text-gray-600 dark:text-slate-300", children: tz.time })] }, index))) }), _jsxs("div", { className: "mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-blue-900 dark:text-blue-100 mb-2", children: "Flexible Scheduling" }), _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200", children: "Can't find a suitable time? Contact us for custom scheduling options. We're committed to finding a time that works for your busy lifestyle." })] }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-2", children: "Social Media" }), _jsxs("div", { className: "flex space-x-4", children: [_jsx("a", { href: "#", className: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors", children: "LinkedIn" }), _jsx("a", { href: "#", className: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors", children: "Instagram" }), _jsx("a", { href: "#", className: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors", children: "YouTube" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-2", children: "Quick Links" }), _jsxs("div", { className: "space-y-2", children: [_jsx("a", { href: "/book-class", className: "block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm", children: "Book a Session" }), _jsx("a", { href: "/yogique-for-you", className: "block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm", children: "View Offerings" }), _jsx("a", { href: "/testimonials", className: "block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm", children: "Read Testimonials" })] })] })] })] })] })] }) }), _jsx("section", { className: "py-12 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900", children: _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow p-6 md:p-8", children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Our Company" }), _jsxs("p", { className: "text-sm text-gray-700 dark:text-slate-300 mt-1", children: ["Yogique is an initiative by ", _jsx("span", { className: "font-semibold", children: "Sampurnayogam LLP" }), " (registered). LLPIN: ", _jsx("span", { className: "font-mono", children: "ACS-6592" }), " \u2022 Registered Office: ", _jsx("span", { className: "font-mono", children: "Flat 3C, 3rd Floor, Annapurna Apartment, 15 Garia Station Road, Kolkata 700084" }), "."] })] }), _jsxs("div", { className: "shrink-0", children: [_jsx("a", { href: "/privacy", className: "text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mr-4", children: "Privacy" }), _jsx("a", { href: "/terms", className: "text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline", children: "Terms" })] })] }) }) }) })] }));
}
