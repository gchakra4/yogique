import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, BarChart3, Brain, Heart, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
export function CorporateSolutions() {
    const benefits = [
        { icon: _jsx(Heart, { className: "w-6 h-6 text-rose-500" }), title: 'Stress Reduction', desc: 'Guided breath & movement reduce workplace tension.' },
        { icon: _jsx(Brain, { className: "w-6 h-6 text-purple-500" }), title: 'Mental Clarity', desc: 'Mindfulness segments sharpen focus & decision-making.' },
        { icon: _jsx(TrendingUp, { className: "w-6 h-6 text-emerald-600" }), title: 'Productivity Boost', desc: 'Regular sessions enhance sustained energy & output.' },
        { icon: _jsx(Users, { className: "w-6 h-6 text-blue-600" }), title: 'Team Cohesion', desc: 'Shared wellness rituals build trust & empathy.' },
        { icon: _jsx(ShieldCheck, { className: "w-6 h-6 text-indigo-600" }), title: 'Reduced Burnout Risk', desc: 'Emotional regulation practices support resilience.' },
        { icon: _jsx(BarChart3, { className: "w-6 h-6 text-orange-500" }), title: 'Measurable ROI', desc: 'Track attendance, engagement & wellbeing metrics.' }
    ];
    const packages = [
        {
            name: 'Starter (Pilot) Pack',
            price: '₹ (custom)',
            period: '4 weeks',
            features: ['1 live session / week', 'Basic onboarding', 'Pulse check survey', 'Email summary report'],
            highlight: false
        },
        {
            name: 'Growth Wellness Program',
            price: '₹ (custom)',
            period: '12 weeks',
            features: ['2 live sessions / week', 'Breath + posture micro-break videos', 'Monthly engagement report', 'Manager tips digest'],
            highlight: true
        },
        {
            name: 'Enterprise Culture Suite',
            price: '₹ (custom)',
            period: 'Annual',
            features: ['3 live sessions / week', 'Quarterly workshops (stress / ergonomics)', 'Advanced analytics dashboard', 'Dedicated success manager'],
            highlight: false
        }
    ];
    const caseStudies = [
        { company: 'FinTech Scale-up', outcome: 'Reported 23% drop in weekly stress indicators after 8 weeks.' },
        { company: 'Remote SaaS Team', outcome: 'Attendance stabilized at 78% and voluntary wellness initiative adoption doubled.' },
        { company: 'Design Agency', outcome: 'Creative team cited smoother handoffs + reduced posture injuries.' }
    ];
    const testimonials = [
        { author: 'HR Director, Mid-size Tech', quote: 'The weekly integrated sessions became the anchor ritual for our distributed teams.' },
        { author: 'Operations Lead, SaaS', quote: 'We saw calmer standups and fewer escalations after month two.' }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-slate-900", children: [_jsx("section", { className: "py-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: _jsx("div", { className: "max-w-6xl mx-auto px-4", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-4xl font-extrabold text-gray-900 dark:text-white leading-tight", children: "Corporate Wellness & Integrated Yogic Programs" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300", children: "Human-centered performance. We help teams cultivate stability (Sthira) and ease (Sukha) for sustainable output." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx(Link, { to: "/contact", children: _jsxs(Button, { size: "lg", className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg", children: ["Request Proposal ", _jsx(ArrowRight, { className: "ml-2 w-5 h-5" })] }) }), _jsx(Link, { to: "/book", children: _jsx(Button, { variant: "outline", size: "lg", className: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 font-semibold rounded-lg", children: "Book Pilot" }) })] })] }), _jsx("div", { className: "relative", children: _jsxs("div", { className: "rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 shadow-xl space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Program Outcomes" }), _jsxs("ul", { className: "space-y-2 text-sm text-gray-700 dark:text-slate-300", children: [_jsx("li", { children: "Lower stress markers & improved breath awareness" }), _jsx("li", { children: "Better meeting presence and calmer decision cycles" }), _jsx("li", { children: "Reduced musculoskeletal discomfort & posture fatigue" }), _jsx("li", { children: "Culture signal: investing in whole-person wellbeing" })] })] }) })] }) }) }), _jsx("section", { className: "py-16", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-8", children: "Key Benefits" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: benefits.map((b, i) => (_jsxs("div", { className: "rounded-xl border border-gray-100 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition", children: [_jsx("div", { className: "mb-3", children: b.icon }), _jsx("h3", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: b.title }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300", children: b.desc })] }, i))) })] }) }), _jsx("section", { className: "py-16 bg-gray-50 dark:bg-slate-800/50", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-8", children: "Case Studies" }), _jsx("div", { className: "space-y-6", children: caseStudies.map((c, i) => (_jsxs("div", { className: "rounded-xl border border-gray-100 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 shadow-sm", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: c.company }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300 mt-2", children: c.outcome })] }, i))) })] }) }), _jsx("section", { className: "py-16", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-8", children: "Packages" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: packages.map((p, i) => (_jsxs("div", { className: `rounded-2xl border ${p.highlight ? 'border-blue-500 shadow-xl' : 'border-gray-100 dark:border-slate-700 shadow-sm'} bg-white dark:bg-slate-800 p-6 flex flex-col`, children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-1", children: p.name }), _jsx("p", { className: "text-sm text-gray-500 dark:text-slate-400 mb-3", children: p.period }), _jsx("ul", { className: "text-sm text-gray-600 dark:text-slate-300 space-y-2 mb-4", children: p.features.map((f, idx) => _jsxs("li", { children: ["\u2022 ", f] }, idx)) }), _jsx("div", { className: "mt-auto", children: _jsx(Button, { className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg", children: "Enquire" }) })] }, i))) })] }) }), _jsx("section", { className: "py-16 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-8", children: "Corporate Voices" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: testimonials.map((t, i) => (_jsxs("div", { className: "rounded-xl border border-gray-100 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 shadow-sm", children: [_jsxs("p", { className: "italic text-gray-700 dark:text-slate-300", children: ["\u201C", t.quote, "\u201D"] }), _jsx("p", { className: "mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium", children: t.author })] }, i))) })] }) }), _jsx("section", { className: "py-20 text-center", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-4", children: "Ready to Elevate Team Wellbeing?" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300 mb-8", children: "Start with a pilot or request a tailored multi-quarter roadmap aligned to your organizational objectives." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(Link, { to: "/contact", children: _jsx(Button, { size: "lg", className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-4", children: "Request Proposal" }) }), _jsx(Link, { to: "/book", children: _jsx(Button, { variant: "outline", size: "lg", className: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4", children: "Book Pilot" }) })] })] }) })] }));
}
export default CorporateSolutions;
