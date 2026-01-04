import { Clock, Globe, Mail, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { useSettings } from '../../../shared/contexts/SettingsContext'
import { supabase } from '../../../shared/lib/supabase'

export function Contact() {
    const { settings = {} } = useSettings() || {}
    const contact = settings.business_contact || {}
    const social = settings.social_links || {}

    const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [errors, setErrors] = useState({})

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
        if (!formData.message.trim()) newErrors.message = 'Message is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return
        setLoading(true)
        try {
            const contactData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || '',
                subject: formData.subject,
                message: formData.message,
                status: 'new'
            }
            const { error } = await supabase.from('contact_messages').insert([contactData])
            if (error) throw error
            setSubmitted(true)
        } catch (err) {
            setErrors({ general: err.message || 'An error occurred while sending your message.' })
        } finally {
            setLoading(false)
        }
    }

    const addressLines = (contact.address_lines && contact.address_lines.join(', ')) || 'Flat 3C, 3rd Floor, Annapurna Apartment, 15 Garia Station Road, Kolkata 700084'

    const contactInfo = [
        { icon: <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />, title: 'Global Reach', details: ['Available worldwide', 'Online sessions only'], action: null },
        { icon: <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />, title: 'Email or Call Us', details: [contact.email || 'hello@yogodaan.com', contact.phone || '+1 (555) 123-4567'], action: 'contact' },
        { icon: <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />, title: 'Quick Response', details: ['24-48 hour response time'], action: null },
        { icon: <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />, title: 'Flexible Hours', details: ['Sessions available 24/7', 'Across all time zones'], action: null }
    ]

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="max-w-md mx-auto px-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Message Sent!</h2>
                        <p className="text-gray-600 dark:text-slate-300 mb-6">Thank you for contacting us. We'll get back to you within 24-48 hours.</p>
                        <Button onClick={() => {
                            setSubmitted(false)
                            setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
                        }}>Send Another Message</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Begin Your Wellness Journey</h1>
                    <p className="text-xl text-gray-600 dark:text-slate-300 leading-relaxed">Schedule a class or learn more about our programs. We're here to support your wellness goals and answer any questions you may have.</p>
                </div>
            </section>

            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6 text-center hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-center mb-4">{info.icon}</div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{info.title}</h3>
                                <div className="space-y-1 mb-4">{info.details.map((d, i) => <p key={i} className="text-gray-600 dark:text-slate-300 text-sm">{d}</p>)}</div>
                                {info.action === 'contact' && (
                                    <div className="flex items-center justify-center gap-4">
                                        {contact.email ? (
                                            <a href={`mailto:${contact.email}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors text-sm">Email</a>
                                        ) : (
                                            <span className="text-sm text-gray-500">Email</span>
                                        )}
                                        {contact.phone ? (
                                            <a href={`tel:${contact.phone}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors text-sm">Call</a>
                                        ) : (
                                            <span className="text-sm text-gray-500">Call</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {errors.general && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"><p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p></div>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name *</label>
                                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`} placeholder="Your full name" />
                                        {errors.name && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
                                        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`} placeholder="your@email.com" />
                                        {errors.email && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone (Optional)</label>
                                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder="+1 (555) 123-4567" />
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject *</label>
                                        <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.subject ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`} placeholder="How can we help?" />
                                        {errors.subject && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.subject}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message *</label>
                                    <textarea id="message" name="message" rows={5} value={formData.message} onChange={handleInputChange} placeholder="Tell us about your wellness goals, questions about our services, or how we can help you..." className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.message ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-slate-600'}`} />
                                    {errors.message && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.message}</p>}
                                </div>

                                <Button type="submit" loading={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center">{loading ? 'Sending...' : (<><Send className="w-4 h-4 mr-2" />Send Message</>)}</Button>
                            </form>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Global Time Zone Reference</h2>
                            <p className="text-gray-600 dark:text-slate-300 mb-6">We offer sessions across all time zones. Here are our typical availability windows:</p>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"><span className="font-medium text-gray-900 dark:text-white">PST (UTC-8)</span><span className="text-sm text-gray-600 dark:text-slate-300">06:00 AM - 10:00 PM</span></div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"><span className="font-medium text-gray-900 dark:text-white">EST (UTC-5)</span><span className="text-sm text-gray-600 dark:text-slate-300">09:00 AM - 01:00 AM</span></div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"><span className="font-medium text-gray-900 dark:text-white">GMT (UTC+0)</span><span className="text-sm text-gray-600 dark:text-slate-300">02:00 PM - 06:00 AM</span></div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"><span className="font-medium text-gray-900 dark:text-white">IST (UTC+5:30)</span><span className="text-sm text-gray-600 dark:text-slate-300">07:30 PM - 11:30 AM</span></div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"><span className="font-medium text-gray-900 dark:text-white">JST (UTC+9)</span><span className="text-sm text-gray-600 dark:text-slate-300">11:00 PM - 03:00 PM</span></div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"><span className="font-medium text-gray-900 dark:text-white">AEST (UTC+10)</span><span className="text-sm text-gray-600 dark:text-slate-300">12:00 AM - 04:00 PM</span></div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Flexible Scheduling</h3>
                                <p className="text-sm text-blue-800 dark:text-blue-200">Can't find a suitable time? Contact us for custom scheduling options. We're committed to finding a time that works for your busy lifestyle.</p>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Social Media</h3>
                                    <div className="flex space-x-4">
                                        <a href={social.linkedin || social.facebook || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">LinkedIn</a>
                                        <a href={social.instagram || '#'} target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">Instagram</a>
                                        <a href={social.youtube || '#'} target="_blank" rel="noopener noreferrer" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">YouTube</a>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Links</h3>
                                    <div className="space-y-2">
                                        <a href="/book/private-group" className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm">Book a Session</a>
                                        <a href="/book/private-group" className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm">View Offerings</a>
                                        <a href="/testimonials" className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm">Read Testimonials</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <section className="py-12 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Our Company</h3>
                                <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">Yogique is an initiative by <span className="font-semibold">Sampurnayogam LLP</span> (registered). LLPIN: <span className="font-mono">ACS-6592</span> • Registered Office: <span className="font-mono">{addressLines}</span>.</p>
                            </div>

                            <div className="shrink-0">
                                <a href="/privacy" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mr-4">Privacy</a>
                                <a href="/terms" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Terms</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}