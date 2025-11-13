import { CheckCircle2, Download, Mail } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { supabase } from '../../../shared/lib/supabase'

export function LeadMagnetCTA() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            // Call server-side function which records the signup and emails the guide
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
            const payload = { email, timezone, source: 'lead-magnet' }

            const { data, error } = await supabase.functions.invoke('send-guide', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            if (error) throw error

            // `data` may be a Response-like object depending on supabase client; handle common shapes
            const result = data || {}
            if (result?.error || result?.email_sent === false) {
                throw new Error(result?.error || 'Failed to send guide')
            }

            setSuccess('Check your inbox — we emailed your 7‑Day Guide (link valid 24 hours).')
            setEmail('')
        } catch (err: any) {
            console.error(err)
            setError('Something went wrong. Please try again in a moment.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Start Free — 7‑Day Wellness Series</h2>
                    <p className="text-lg text-gray-600 dark:text-slate-300 mt-2">Prefer reading? Get our Stress‑Relief Yoga Guide instead.</p>
                </div>
                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <div className="flex-1 inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-3 py-2 shadow-sm backdrop-blur">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <input
                                type="email"
                                required
                                placeholder="Your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center"
                        >
                            {loading ? 'Sending…' : (<span className="inline-flex items-center">Get the 7‑Day Guide <Download className="ml-2 w-4 h-4" /></span>)}
                        </Button>
                    </div>
                    {success && (
                        <div className="mt-4 inline-flex items-center text-emerald-700 dark:text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> {success}
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 text-rose-600 dark:text-rose-400 text-sm">{error}</div>
                    )}
                    <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">By signing up you'll be added to our newsletter subscribers list. You can unsubscribe anytime.</p>
                </form>
            </div>
        </section>
    )
}

export default LeadMagnetCTA
