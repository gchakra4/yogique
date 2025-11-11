import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, BadgeIndianRupee, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
export function SubscriptionOffers() {
    const offers = [
        {
            label: '6-Month Growth Plan',
            discount: 'Save 20%',
            details: ['Consistent progress tracking', 'Includes posture check-ins', 'Priority scheduling'],
            badge: 'Popular',
            cta: 'Choose 6-Month',
            to: '/book/individual?plan=6m'
        },
        {
            label: 'Annual Transformation Plan',
            discount: 'Save 40%',
            details: ['Deep integration & habit formation', 'Quarterly review session', 'Exclusive workshop access'],
            badge: 'Best Value',
            cta: 'Choose Annual',
            to: '/book/individual?plan=12m'
        }
    ];
    return (_jsx("section", { className: "py-20 bg-white dark:bg-slate-900", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Subscription Savings" }), _jsx("p", { className: "text-lg text-gray-600 dark:text-slate-300 mt-2", children: "Commit and amplify your practice with structured progression & accountability." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: offers.map((o, i) => (_jsxs("div", { className: `relative rounded-2xl border ${i === 1 ? 'border-blue-500' : 'border-gray-100 dark:border-slate-700'} bg-white dark:bg-slate-800 p-8 shadow-sm hover:shadow-xl transition`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: o.label }), _jsx("span", { className: "text-sm px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700", children: o.badge })] }), _jsxs("div", { className: "flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-medium", children: [_jsx(Percent, { className: "w-5 h-5" }), " ", o.discount] }), _jsx("ul", { className: "space-y-2 text-sm text-gray-600 dark:text-slate-300 mb-6", children: o.details.map((d, idx) => _jsxs("li", { children: ["\u2022 ", d] }, idx)) }), _jsx(Link, { to: o.to, children: _jsxs(Button, { className: `w-full ${i === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} py-3 rounded-lg font-semibold flex items-center justify-center`, children: [o.cta, " ", _jsx(ArrowRight, { className: "ml-2 w-4 h-4" })] }) }), _jsxs("div", { className: "mt-4 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1", children: [_jsx(BadgeIndianRupee, { className: "w-3 h-3" }), " Pricing relative to standard monthly class rate."] })] }, i))) })] }) }));
}
export default SubscriptionOffers;
