import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, Building, User, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
export function BookLanding() {
    const options = [
        {
            icon: _jsx(User, { className: "w-10 h-10 text-blue-600" }),
            title: 'Individual Session',
            description: 'Personalized 1-on-1 guidance tailored to your goals.',
            to: '/book/individual'
        },
        {
            icon: _jsx(Users, { className: "w-10 h-10 text-emerald-600" }),
            title: 'Group Class',
            description: 'Practice with a supportive community and shared energy.',
            to: 'https://yogique.life/yogique-for-you'
        },
        {
            icon: _jsx(Building, { className: "w-10 h-10 text-purple-600" }),
            title: 'Corporate Wellness',
            description: 'Bring structured wellness programs to your team.',
            to: '/book/corporate'
        }
    ];
    return (_jsx("div", { className: "min-h-screen bg-white dark:bg-slate-900 py-16", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Book Your Practice Path" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto", children: "Choose how you want to begin. Whether you seek individual focus, shared momentum, or organizational wellbeing\u2014start here." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: options.map((opt, i) => (_jsxs("div", { className: "rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-xl transition group", children: [_jsx("div", { className: "flex justify-center mb-4", children: opt.icon }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center", children: opt.title }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300 text-center mb-6", children: opt.description }), _jsx(Link, { to: opt.to, className: "flex justify-center", children: _jsxs(Button, { className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center", children: ["Continue ", _jsx(ArrowRight, { className: "ml-2 w-4 h-4" })] }) })] }, i))) }), _jsx("div", { className: "mt-12 text-center", children: _jsx(Link, { to: "/", className: "text-sm text-blue-600 dark:text-blue-400 hover:underline", children: "Back to Home" }) })] }) }));
}
export default BookLanding;
