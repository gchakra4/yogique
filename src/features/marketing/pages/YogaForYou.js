import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Activity, Baby, Brain, Calendar, Dumbbell, Feather, Heart, Home, Sparkles, User, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
export function YogaForYou() {
    const services = [
        {
            icon: _jsx(User, { className: "w-10 h-10 text-blue-600 dark:text-blue-400" }),
            title: '1-on-1 Coaching',
            desc: 'Personalized plans, pace that suits you, and focused attention to your goals.',
            to: '/book/individual',
            cta: 'Book Individual',
            accent: 'from-blue-500 to-cyan-500'
        },
        {
            icon: _jsx(Users, { className: "w-10 h-10 text-emerald-600 dark:text-emerald-400" }),
            title: 'Group Classes',
            desc: 'Small, friendly groups that build consistency. Free demo available.',
            to: '/schedule',
            cta: 'Join Free Demo',
            accent: 'from-emerald-500 to-teal-500',
            badge: 'Free Demo'
        },
        {
            icon: _jsx(Calendar, { className: "w-10 h-10 text-orange-600 dark:text-orange-400" }),
            title: 'Corporate Wellness',
            desc: 'Stress reduction, mobility and focus programs designed for teams.',
            to: '/book/corporate',
            cta: 'Corporate Enquiry',
            accent: 'from-orange-500 to-amber-500'
        }
    ];
    const personas = [
        {
            icon: _jsx(Baby, { className: "w-8 h-8" }),
            title: 'Beginners',
            points: ['Foundational postures', 'Safe alignment cues', 'Gentle pace + breaks'],
            gradient: 'from-blue-50 to-cyan-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: _jsx(Home, { className: "w-8 h-8" }),
            title: 'Busy Parents',
            points: ['Short 20–30 min options', 'Home-friendly flows', 'Stress reset + breath'],
            gradient: 'from-emerald-50 to-teal-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: _jsx(Dumbbell, { className: "w-8 h-8" }),
            title: 'Men',
            points: ['Mobility for hips/hamstrings', 'Strength + stability', 'Back care'],
            gradient: 'from-violet-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: _jsx(Feather, { className: "w-8 h-8" }),
            title: 'Women',
            points: ['Cycle-aware options', 'Core + pelvic floor', 'Stress relief'],
            gradient: 'from-rose-50 to-pink-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: _jsx(Sparkles, { className: "w-8 h-8" }),
            title: 'Superagers (Seniors)',
            points: ['Joint-friendly sequences', 'Balance + fall prevention', 'Chair/prop support'],
            gradient: 'from-amber-50 to-yellow-50 dark:from-slate-800/60 dark:to-slate-900/60'
        }
    ];
    const benefits = [
        { icon: _jsx(Activity, { className: "w-6 h-6" }), title: 'Flexibility', value: 85, color: 'from-blue-500 to-emerald-500' },
        { icon: _jsx(Zap, { className: "w-6 h-6" }), title: 'Mobility', value: 78, color: 'from-cyan-500 to-blue-500' },
        { icon: _jsx(Heart, { className: "w-6 h-6" }), title: 'Longevity', value: 72, color: 'from-rose-500 to-pink-500' },
        { icon: _jsx(Brain, { className: "w-6 h-6" }), title: 'Productivity', value: 64, color: 'from-amber-500 to-orange-500' }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white", children: [_jsxs("section", { className: "relative py-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: [_jsxs("div", { className: "pointer-events-none absolute inset-0 opacity-60 dark:opacity-40", children: [_jsx("div", { className: "absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl bg-emerald-200/40 dark:bg-emerald-500/10 animate-pulse" }), _jsx("div", { className: "absolute -bottom-24 -right-24 w-[30rem] h-[30rem] rounded-full blur-3xl bg-blue-200/40 dark:bg-blue-500/10" })] }), _jsxs("div", { className: "relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 shadow-sm mb-4", children: [_jsx(Sparkles, { className: "w-4 h-4 text-emerald-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-slate-200", children: "Yoga for Every Body & Lifestyle" })] }), _jsx("h1", { className: "text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400 text-transparent bg-clip-text", children: "Services + Personalized Programs" }), _jsx("p", { className: "mt-4 text-lg md:text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto", children: "Whether you\u2019re starting out, raising a family, building a career, or staying active as a superager \u2014 we customize yoga to fit you." }), _jsxs("div", { className: "mt-8 flex flex-col sm:flex-row gap-3 justify-center", children: [_jsx(Link, { to: "/schedule", children: _jsx(Button, { className: "bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5", children: "Join a Free Demo Group Class" }) }), _jsx(Link, { to: "/book/individual", children: _jsx(Button, { variant: "outline", className: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl", children: "Start 1-on-1 Coaching" }) })] })] })] }), _jsx("section", { className: "py-20", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-center mb-12", children: "What We Offer" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: services.map((s, i) => (_jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl", children: [_jsx("div", { className: `absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${s.accent}` }), _jsxs("div", { className: "relative flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700 flex items-center justify-center shadow", children: s.icon }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold", children: s.title }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300", children: s.desc })] }), s.badge && (_jsx("span", { className: "ml-auto text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", children: s.badge }))] }), _jsx("div", { className: "mt-5", children: s.title === 'Group Classes' ? (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-gray-600 dark:text-slate-300 text-sm", children: "If you have a group and want to book a private session, use the button below. To join our scheduled weekly classes, please check the class schedule." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Link, { to: "/book-class", children: _jsx(Button, { className: "bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02]", children: "Book Group Session" }) }), _jsx(Link, { to: "/schedule", children: _jsx(Button, { variant: "outline", className: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02]", children: "View Class Schedule" }) })] })] })) : (_jsx(Link, { to: s.to, children: _jsx(Button, { className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300", children: s.cta }) })) })] }, i))) })] }) }), _jsxs("section", { className: "relative py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden", children: [_jsxs("div", { className: "pointer-events-none absolute inset-0 opacity-50", children: [_jsx("div", { className: "absolute left-8 top-8 w-24 h-24 rounded-full bg-emerald-300/30 blur-2xl" }), _jsx("div", { className: "absolute right-10 bottom-10 w-32 h-32 rounded-full bg-blue-300/30 blur-3xl" })] }), _jsxs("div", { className: "relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold", children: "Tailored For You" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300", children: "Smart adjustments, props, and pacing for every body and season of life." })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: personas.map((p, i) => (_jsxs("div", { className: `group rounded-2xl p-6 border border-gray-100 dark:border-slate-700 bg-gradient-to-br ${p.gradient} shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-300", children: p.icon }), _jsx("h3", { className: "text-lg font-semibold", children: p.title })] }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-gray-700 dark:text-slate-300", children: p.points.map((pt, idx) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" }), pt] }, idx))) })] }, i))) })] })] }), _jsx("section", { className: "py-20", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold", children: "How Yoga Helps" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300", children: "Flexible body, mobile joints, calmer mind \u2014 leading to better focus and longevity." })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6", children: benefits.map((b, i) => (_jsxs("div", { className: "rounded-2xl p-6 border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center", children: [_jsxs("div", { className: "mx-auto w-28 h-28 relative", children: [_jsx("div", { className: "absolute inset-0 rounded-full", style: {
                                                    background: `conic-gradient(var(--tw-gradient-stops))`,
                                                    ['--tw-gradient-from']: `var(--tw-color-from)`,
                                                    ['--tw-gradient-to']: 'transparent',
                                                } }), _jsx("div", { className: `absolute inset-0 rounded-full bg-gradient-to-tr ${b.color}`, style: { mask: `conic-gradient(#000 ${b.value * 3.6}deg, transparent 0)` } }), _jsx("div", { className: "absolute inset-2 rounded-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 flex items-center justify-center", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-300", children: b.icon }) })] }), _jsx("div", { className: "mt-4 font-semibold", children: b.title }), _jsxs("div", { className: "text-sm text-gray-600 dark:text-slate-300", children: ["~", b.value, "% users reported improvement"] })] }, i))) })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold", children: "How We Customize" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300", children: "Simple steps to your tailored practice." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [{ t: 'Quick Assessment', d: 'We learn about your goals, time, and any concerns.' }, { t: 'Plan & Pace', d: 'We craft a sequence with mods/props and optimal duration.' }, { t: 'Progress & Support', d: 'Track improvements and evolve the plan as you grow.' }].map((x, i) => (_jsxs("div", { className: "relative rounded-2xl p-6 border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl", children: [_jsx("div", { className: "absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow", children: i + 1 }), _jsx("h3", { className: "text-xl font-semibold pl-8", children: x.t }), _jsx("p", { className: "mt-2 text-gray-700 dark:text-slate-300 pl-8", children: x.d })] }, i))) })] }) }), _jsx("section", { className: "py-20", children: _jsxs("div", { className: "max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold", children: "Try a Free Demo Group Class" }), _jsx("p", { className: "text-lg text-gray-700 dark:text-slate-300 mt-3", children: "See how a modern, inclusive practice feels \u2014 no pressure, just friendly guidance." }), _jsxs("div", { className: "mt-6 flex flex-col sm:flex-row gap-3 justify-center", children: [_jsx(Link, { to: "/schedule", children: _jsx(Button, { className: "bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5", children: "Join Free Demo" }) }), _jsx(Link, { to: "/book/individual", children: _jsx(Button, { variant: "outline", className: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl", children: "Talk to an Instructor" }) })] })] }) })] }));
}
export default YogaForYou;
