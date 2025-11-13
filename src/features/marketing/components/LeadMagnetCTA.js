import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, Download, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
export function LeadMagnetCTA() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // Call server-side function which records the signup and emails the guide
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            const payload = { email, timezone, source: 'lead-magnet' };
            const { data, error } = await supabase.functions.invoke('send-guide', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (error)
                throw error;
            // `data` may be a Response-like object depending on supabase client; handle common shapes
            const result = data || {};
            if (result?.error || result?.email_sent === false) {
                throw new Error(result?.error || 'Failed to send guide');
            }
            setSuccess('Check your inbox — we emailed your 7‑Day Guide (link valid 24 hours).');
            setEmail('');
        }
        catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again in a moment.');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("section", { className: "py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Start Free \u2014 7\u2011Day Wellness Series" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300 mt-2", children: "Prefer reading? Get our Stress\u2011Relief Yoga Guide instead." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-3 items-stretch", children: [_jsxs("div", { className: "flex-1 inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-3 py-2 shadow-sm backdrop-blur", children: [_jsx(Mail, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }), _jsx("input", { type: "email", required: true, placeholder: "Your email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400" })] }), _jsx(Button, { type: "submit", disabled: loading, className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center", children: loading ? 'Sending…' : (_jsxs("span", { className: "inline-flex items-center", children: ["Get the 7\u2011Day Guide ", _jsx(Download, { className: "ml-2 w-4 h-4" })] })) })] }), success && (_jsxs("div", { className: "mt-4 inline-flex items-center text-emerald-700 dark:text-emerald-400 text-sm", children: [_jsx(CheckCircle2, { className: "w-4 h-4 mr-2" }), " ", success] })), error && (_jsx("div", { className: "mt-4 text-rose-600 dark:text-rose-400 text-sm", children: error })), _jsx("p", { className: "mt-3 text-sm text-gray-600 dark:text-slate-400", children: "By signing up you'll be added to our newsletter subscribers list. You can unsubscribe anytime." })] })] }) }));
}
export default LeadMagnetCTA;
