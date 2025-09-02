import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building, Globe, Quote, Star, User } from 'lucide-react';
export function Testimonials() {
    const testimonials = [
        {
            name: "Kasturi Ray",
            location: "Kolkata, India",
            content: "Joining Yogique has been a life changing experience since the past six months. Yog, meditation and individual attendtion by Bratati is giving new way of holistic well being. Thank You 🙏",
            image: "/images/testimonial_Kasturi_Ray.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
            rating: 5,
            type: "Private Group"
        },
        {
            name: "Rina",
            location: "Auckland, New Zealand",
            content: "I was visiting my niece in India and joined her in session with Bratati. Hearing the correct pronunciation of the Asanas, experiencing the working of an online class inspired me to revive my yoga practice. I feel fortunate to learn yoga with Bratati’s guidance and instructions. Her attention to posture, gradually build strength and balance helps me improve wellbeing. Her pleasant and kind, yet encouraging approach goes a long way in sustaining my commitment to yoga.  The  added tips on poses are gentle reminders to make it practical and doable in the daily routine.",
            image: "/images/Testimonial_Rina.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
            rating: 5,
            type: "1-on-1"
        },
        {
            name: "Moumita Pradhan",
            location: "Kolkata, India",
            content: "I have been associated with Yogique for a quiet a few years.. Practicing under Bratati's guidance has been a wonderful experience. She teaches each asana in such a clear and supportive way that even the most challenging pose feel achievable. What stands out most is the care she takes for each individual's needs, making sure we feel comfortable, safe and confident throughout the session. Her approach creates a nurturing and motivating environment that makes yoga truly enjoyable and sustainable.",
            image: "/images/testimonial_Moumita_Pradhan.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
            rating: 5,
            type: "1-on-1"
        },
        {
            name: "Michael Rodriguez",
            position: "CEO",
            company: "InnovateCorp",
            location: "Mexico City, Mexico",
            content: "As a CEO, stress management is crucial. The corporate wellness program has been a game-changer for our entire leadership team. We've seen improved decision-making, better work-life balance, and enhanced team dynamics.",
            image: "https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
            rating: 5,
            type: "Corporate"
        },
        {
            name: "Aisha Okonkwo",
            position: "Data Scientist",
            company: "AI Innovations",
            location: "Lagos, Nigeria",
            content: "The personalized approach helped me address specific posture issues from long hours of coding. The instructor's expertise in adapting yoga for tech professionals is evident in every session. My back pain is gone, and my focus has improved dramatically.",
            image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
            rating: 5,
            type: "1-on-1"
        },
        {
            name: "James Thompson",
            position: "Operations Manager",
            company: "LogisticsPro",
            location: "London, UK",
            content: "The group classes have become the highlight of my week. The community aspect keeps me motivated, and the professional guidance ensures I'm practicing safely and effectively. It's the perfect balance of social connection and personal wellness.",
            image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
            rating: 5,
            type: "Group"
        }
    ];
    const stats = [
        { number: "1000+", label: "Global Students", icon: _jsx(Globe, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }) },
        { number: "5+", label: "Corporate Programs", icon: _jsx(Building, { className: "w-8 h-8 text-green-600 dark:text-emerald-400" }) },
        { number: "98%", label: "Satisfaction Rate", icon: _jsx(Star, { className: "w-8 h-8 text-yellow-500 dark:text-yellow-400" }) },
        { number: "7+", label: "Countries Served", icon: _jsx(User, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" }) }
    ];
    const getTypeColor = (type) => {
        switch (type) {
            case 'Corporate': return 'bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-white';
            case '1-on-1': return 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white';
            case 'Group': return 'bg-green-100 text-green-800 dark:bg-emerald-600 dark:text-white';
            default: return 'bg-gray-100 text-gray-800 dark:bg-slate-600 dark:text-white';
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'Corporate': return _jsx(Building, { className: "w-4 h-4" });
            case '1-on-1': return _jsx(User, { className: "w-4 h-4" });
            case 'Group': return _jsx(Globe, { className: "w-4 h-4" });
            default: return null;
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-slate-900", children: [_jsx("section", { className: "bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 dark:text-white mb-6", children: "What Our Global Community Says" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300 leading-relaxed", children: "Real stories from professionals around the world who have transformed their lives with Yogique's personalized wellness programs." })] }) }), _jsx("section", { className: "py-16 bg-white dark:bg-slate-800", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: stats.map((stat, index) => (_jsxs("div", { className: "text-center p-6 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all duration-300", children: [_jsx("div", { className: "flex justify-center mb-4", children: stat.icon }), _jsx("div", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-2", children: stat.number }), _jsx("div", { className: "text-gray-600 dark:text-slate-300", children: stat.label })] }, index))) }) }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Success Stories" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300", children: "Discover how professionals from different industries and locations have benefited from our programs" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: testimonials.map((testimonial, index) => (_jsxs("div", { className: "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative", children: [_jsx(Quote, { className: "absolute top-4 right-4 w-8 h-8 text-blue-200 dark:text-blue-400" }), _jsxs("div", { className: "flex items-center mb-6", children: [_jsx("img", { src: testimonial.image, alt: testimonial.name, className: "w-16 h-16 rounded-full mr-4 object-cover" }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: testimonial.name }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300", children: testimonial.position }), _jsx("p", { className: "text-sm text-gray-500 dark:text-slate-400", children: testimonial.company }), _jsxs("p", { className: "text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1", children: [_jsx(Globe, { className: "w-3 h-3 mr-1" }), testimonial.location] })] })] }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "flex text-yellow-400", children: [...Array(testimonial.rating)].map((_, i) => (_jsx(Star, { className: "w-5 h-5 fill-current" }, i))) }), _jsxs("span", { className: `px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTypeColor(testimonial.type)}`, children: [getTypeIcon(testimonial.type), _jsx("span", { children: testimonial.type })] })] }), _jsxs("p", { className: "text-gray-700 dark:text-slate-300 italic leading-relaxed", children: ["\"", testimonial.content, "\""] })] }, index))) })] }) }), _jsx("section", { className: "py-20 bg-white dark:bg-slate-800", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Video Testimonials" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300", children: "Hear directly from our students about their transformation journey" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: [1, 2, 3].map((index) => (_jsx("div", { className: "bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl aspect-video flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-300 cursor-pointer", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }), _jsxs("p", { className: "text-gray-600 dark:text-white font-medium", children: ["Video Testimonial ", index] }), _jsx("p", { className: "text-sm text-gray-500 dark:text-slate-300", children: "Coming Soon" })] }) }, index))) })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-6", children: "Ready to Write Your Success Story?" }), _jsx("p", { className: "text-xl mb-8 text-blue-100", children: "Join our global community of professionals who have transformed their lives through yoga. Your wellness journey starts with a single session." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx("a", { href: "/book-class", className: "bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 inline-block", children: "Start Your Journey" }), _jsx("a", { href: "/contact", className: "border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 inline-block", children: "Learn More" })] })] }) })] }));
}

