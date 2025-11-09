import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Building, CheckCircle, Clock, Globe, Heart, Target, User, Users } from 'lucide-react';
// Button component
const Button = ({ children, className = "", variant = "primary", size = "md", ...props }) => {
    const baseClasses = "font-semibold rounded-lg transition-all duration-300 cursor-pointer inline-block text-center";
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
    };
    const sizes = {
        md: "px-6 py-3",
        lg: "px-8 py-4 text-lg"
    };
    return (_jsx("button", { className: `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`, ...props, children: children }));
};
// Link component
const Link = ({ to, children, className = "", ...props }) => {
    return (_jsx("a", { href: to, className: className, ...props, children: children }));
};
export function Services() {
    const services = [
        {
            icon: _jsx(User, { className: "w-16 h-16 text-blue-500 dark:text-blue-400" }),
            title: "1-on-1 Coaching",
            subtitle: "Personalized Online Coaching",
            description: "Individual attention with flexible scheduling and customized programs tailored to your specific needs and goals.",
            features: [
                "Personalized yoga routines",
                "Flexible scheduling across time zones",
                "One-on-one attention and guidance",
                "Progress tracking and adjustments",
                "Customized meditation practices",
                "Injury modification and support"
            ],
            pricing: "From ₹375/session",
            duration: "60 minutes",
            ideal: "Busy professionals, beginners, specific health goals",
            bookingLink: "/book/individual"
        },
        {
            icon: _jsx(Users, { className: "w-16 h-16 text-green-600" }),
            title: "Group Classes",
            subtitle: "Online Group Sessions",
            description: "Build consistency with like-minded professionals in small, intimate group settings. Perfect for teams or private groups seeking dedicated sessions.",
            features: [
                "Small group classes (max 8 people)",
                "Regular weekly schedule",
                "Community support and motivation",
                "Affordable pricing",
                "Interactive sessions with Q&A",
                "Progressive skill development"
            ],
            pricing: "From ₹125/session/person",
            duration: "45-60 minutes",
            ideal: "Team building, regular practice, community connection",
            bookingLink: "/book-class"
        },
        {
            icon: _jsx(Building, { className: "w-16 h-16 text-purple-600" }),
            title: "Corporate Programs",
            subtitle: "Corporate Wellness Solutions",
            description: "Enhance team well-being and performance with specialized workplace wellness programs designed for modern organizations.",
            features: [
                "Team wellness sessions",
                "Stress reduction workshops",
                "Productivity enhancement programs",
                "Flexible corporate packages",
                "Employee wellness assessments",
                "Custom program development"
            ],
            pricing: "Custom packages available",
            duration: "30-90 minutes",
            ideal: "Companies, HR departments, team wellness initiatives",
            bookingLink: "/book/corporate"
        }
    ];
    const additionalServices = [
        {
            icon: _jsx(Clock, { className: "w-8 h-8 text-blue-500 dark:text-blue-400" }),
            title: "Flexible Scheduling",
            description: "Sessions available across multiple time zones to accommodate global professionals"
        },
        {
            icon: _jsx(Globe, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" }),
            title: "Global Accessibility",
            description: "Join from anywhere in the world with just a stable internet connection"
        },
        {
            icon: _jsx(Target, { className: "w-8 h-8 text-orange-500 dark:text-orange-400" }),
            title: "Goal-Oriented Programs",
            description: "Customized programs designed to meet your specific wellness and fitness goals"
        },
        {
            icon: _jsx(Heart, { className: "w-8 h-8 text-red-500 dark:text-red-400" }),
            title: "Holistic Wellness",
            description: "Comprehensive approach including physical postures, breathing, and meditation"
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-slate-900", children: [_jsx("section", { className: "bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 dark:text-white mb-6", children: "Our Services" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300 leading-relaxed", children: "Discover the yoga program that fits your lifestyle, schedule, and wellness goals. From personalized coaching to corporate wellness solutions." })] }) }), _jsx("section", { className: "py-20 bg-white dark:bg-slate-900", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "space-y-20", children: services.map((service, index) => (_jsxs("div", { className: `grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`, children: [_jsxs("div", { className: `space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`, children: [_jsxs("div", { className: "flex items-center space-x-4", children: [service.icon, _jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: service.title }), _jsx("p", { className: "text-lg text-gray-600 dark:text-emerald-400", children: service.subtitle })] })] }), _jsx("p", { className: "text-gray-700 dark:text-white text-lg leading-relaxed", children: service.description }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: service.features.map((feature, idx) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" }), _jsx("span", { className: "text-gray-700 dark:text-white", children: feature })] }, idx))) }), _jsxs("div", { className: "bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6 space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: "Pricing:" }), _jsx("span", { className: "text-blue-600 dark:text-blue-400 font-bold", children: service.pricing })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: "Duration:" }), _jsx("span", { className: "text-gray-700 dark:text-slate-300", children: service.duration })] }), _jsxs("div", { className: "pt-2", children: [_jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: "Ideal for:" }), _jsx("p", { className: "text-gray-700 dark:text-slate-300 text-sm", children: service.ideal })] })] }), service.title === "Group Classes" ? (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-gray-600 dark:text-slate-300 text-sm", children: "If you have a group and want to book a private session, use the button below. To join our scheduled weekly classes, please check the class schedule." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Link, { to: service.bookingLink, children: _jsx(Button, { className: "bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300", children: "Book Group Session" }) }), _jsx(Link, { to: "/schedule", children: _jsx(Button, { variant: "outline", className: "border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300", children: "View Class Schedule" }) })] })] })) : (_jsx(Link, { to: service.bookingLink, children: _jsx(Button, { className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105", children: service.title === "1-on-1 Coaching" ? "Book Individual Session" : "Book Corporate Program" }) }))] }), _jsx("div", { className: `${index % 2 === 1 ? 'lg:col-start-1' : ''}`, children: _jsxs("div", { className: "relative", children: [_jsx("img", { src: service.title === 'Group Classes'
                                                    ? '/images/PrivateClass.png'
                                                    : `https://images.pexels.com/photos/${index === 0 ? '3822622' : index === 1 ? '3823495' : '3823488'}/pexels-photo-${index === 0 ? '3822622' : index === 1 ? '3823495' : '3823488'}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`, alt: service.title, className: "rounded-2xl shadow-lg" }), _jsx("div", { className: "absolute -top-4 -right-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-4 rounded-xl shadow-lg", children: _jsx(Award, { className: "w-8 h-8 text-yellow-500 dark:text-yellow-400" }) })] }) })] }, index))) }) }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Why Choose Our Services" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300", children: "Experience the difference with our comprehensive approach to online yoga" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: additionalServices.map((service, index) => (_jsxs("div", { className: "bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 shadow-lg hover:shadow-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-300 text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: service.icon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-3", children: service.title }), _jsx("p", { className: "text-gray-600 dark:text-slate-300", children: service.description })] }, index))) })] }) }), _jsx("section", { className: "py-20 bg-white dark:bg-slate-900", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Pricing Options" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300", children: "Choose the plan that works best for your schedule and budget" })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl p-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "1-on-1 Coaching" }), _jsx("div", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2", children: "From \u20B9375" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-4", children: "per session" }), _jsx(Link, { to: "/book/individual", children: _jsx(Button, { className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium", children: "Book Individual" }) })] }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Group Classes" }), _jsx("div", { className: "text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2", children: "From \u20B9125" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-4", children: "per session / person" }), _jsx(Link, { to: "/schedule", children: _jsx(Button, { className: "bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium", children: "View Schedule" }) })] }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Corporate Programs" }), _jsx("div", { className: "text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2", children: "Custom" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-4", children: "packages available" }), _jsx(Link, { to: "/book/corporate", children: _jsx(Button, { className: "bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium", children: "Book Corporate" }) })] })] }), _jsxs("div", { className: "text-center mt-8", children: [_jsx("p", { className: "text-gray-700 dark:text-white mb-6", children: "All sessions include personalized guidance, progress tracking, and ongoing support. Package deals and corporate discounts available." }), _jsx(Link, { to: "/contact", children: _jsx(Button, { className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold", children: "Get Custom Quote" }) })] })] })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-6 text-gray-900 dark:text-white", children: "Ready to Start Your Journey?" }), _jsx("p", { className: "text-xl mb-8 text-gray-600 dark:text-slate-300", children: "Choose the service that best fits your needs and schedule your first session today. Transform your wellness routine with professional guidance." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(Link, { to: "/book/individual", children: _jsx(Button, { size: "lg", className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105", children: "Book Individual Session" }) }), _jsx(Link, { to: "/contact", children: _jsx(Button, { variant: "outline", size: "lg", className: "border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg", children: "Ask Questions" }) })] })] }) }), _jsx("section", { className: "py-12 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900", children: _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow p-6 md:p-8", children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Our Company" }), _jsxs("p", { className: "text-sm text-gray-700 dark:text-slate-300 mt-1", children: ["Yogique is an initiative by ", _jsx("span", { className: "font-semibold", children: "Sampurnayogam LLP" }), " (registered). LLPIN: ", _jsx("span", { className: "font-mono", children: "[LLPIN-XXXXX]" }), " \u2022 Registered Office: ", _jsx("span", { className: "font-mono", children: "[Please provide official registered address]" }), "."] })] }), _jsxs("div", { className: "shrink-0", children: [_jsx("a", { href: "/privacy", className: "text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mr-4", children: "Privacy" }), _jsx("a", { href: "/terms", className: "text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline", children: "Terms" })] })] }) }) }) })] }));
}
