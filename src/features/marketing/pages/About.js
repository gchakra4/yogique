import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Heart, Target, Users } from 'lucide-react';
export function About() {
    const values = [
        {
            icon: _jsx(Heart, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" }),
            title: "Compassion",
            description: "We approach every student with kindness, understanding, and patience on their unique journey."
        },
        {
            icon: _jsx(Target, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" }),
            title: "Excellence",
            description: "We strive for the highest standards in teaching, safety, and student experience."
        },
        {
            icon: _jsx(Users, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" }),
            title: "Community",
            description: "We foster a supportive, inclusive environment where everyone feels welcome and valued."
        },
        {
            icon: _jsx(Award, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" }),
            title: "Authenticity",
            description: "We honor traditional yoga practices while making them accessible to modern practitioners."
        }
    ];
    const instructors = [
        {
            name: "Bratati Batabyal",
            title: "Founder, Certified Yoga Therapist and Yoga Consultant",
            certifications: ["YIC", "YCB", "ADYT"],
            experience: "5+ years",
            specialization: "Traditional Yoga & Meditation",
            image: "/images/pp_Bratati.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "With a deep passion for yoga, Bratati guides students in traditional yoga and meditation, helping them develop a steady and mindful practice."
        },
        {
            name: "Kasturi Roy Bardhan",
            title: "Certified Yoga Instructor",
            certifications: ["TTC - Mysore Ashtanga"],
            experience: "5+ years",
            specialization: "Ashtanga Vinyasa Yoga",
            image: "/images/Instructor_Kasturi.jpg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Kasturi empowers students through dynamic Ashtanga Vinyasa practice, focusing on breath-led movement and alignment."
        },
        {
            name: "Payel Paul",
            title: "Certified Yoga Instructor",
            certifications: ["YIC"],
            experience: "4+ years",
            specialization: "General Yoga, Zumba",
            image: "/images/Instructor_Payel.jpg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Passionate and dynamic, Payel blends yoga and movement to create energetic, inclusive classes for all levels."
        },
        {
            name: "Swarup Chattopadhaya",
            title: "Yogic Therapist",
            certifications: [],
            experience: "8+ years",
            specialization: "Yogic Therapy & Physiotherapy",
            image: "/images/Instructor_Swarup.jpg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Swarup blends therapeutic yoga and physiotherapy to help students recover, strengthen, and find balance."
        },
        {
            name: "Amita Agarwal",
            title: "Certified Yoga Instructor",
            certifications: ["ADY", "ADYT"],
            experience: "6+ years",
            specialization: "Kids Yoga",
            image: "/images/Instructor_Amita.jpg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Amita inspires children with playful, safe yoga practices that build confidence and coordination."
        },
        {
            name: "Sima Purakayastha",
            title: "Certified Yoga Instructor & Fitness trainer",
            certifications: ["Masters in Yoga", "ADYT"],
            experience: "10+ years",
            specialization: "Yoga Therapy",
            image: "/images/Instructor_Sima.jpg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Sima combines her expertise in yoga and fitness to offer holistic wellness solutions, focusing on individual needs."
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-white dark:bg-slate-900", children: [_jsx("section", { className: "bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold mb-6 text-gray-900 dark:text-white", children: "About Yogique" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300", children: "Dedicated to spreading the transformative power of yoga and creating a community where everyone can find their path to wellness and inner peace." })] }) }), _jsx("section", { className: "py-20 bg-white dark:bg-slate-900", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-6", children: "Welcome to Yogique \u2013 Breathe. Move. Transform." }), _jsxs("div", { className: "space-y-4 text-gray-700 dark:text-white text-lg", children: [_jsx("p", { children: "Founded by Ms. Bratati Batabyal in 2021, Yogique is an all-online yoga platform empowering people to live healthier, more mindful lives through yoga." }), _jsx("p", { children: "We\u2019ve trained 1000+ students in different parts of the world\u2014offering accessible, expert-led sessions that blend ancient yogic wisdom with modern lifestyles." }), _jsx("p", { children: "From corporate wellness and chair yoga to programs for beginners and advanced practitioners, we\u2019re here to help you de-stress, strengthen, and reconnect\u2014wherever you are." }), _jsx("p", { children: "Join our growing community and take the first step toward a balanced, energized, and joyful life." })] })] }), _jsx("div", { children: _jsx("img", { src: "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop", alt: "Yoga studio", className: "rounded-2xl shadow-lg" }) })] }) }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-purple-50 via-indigo-50 to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Our Values" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto", children: "These core values guide everything we do and shape the experience we create for our students." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: values.map((value, index) => (_jsxs("div", { className: "bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-300", children: [_jsx("div", { className: "flex justify-center mb-4", children: value.icon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: value.title }), _jsx("p", { className: "text-gray-600 dark:text-slate-300", children: value.description })] }, index))) })] }) }), _jsx("section", { className: "py-20 bg-white dark:bg-slate-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Meet Our Instructors" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-slate-300", children: "Our certified instructors bring years of experience and passion to every class." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: instructors.map((instructor, index) => (_jsxs("div", { className: "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-200", children: [_jsx("img", { src: instructor.image, alt: instructor.name, className: "w-32 h-32 rounded-full mx-auto mb-4 object-cover ring-2 ring-slate-200 dark:ring-slate-700" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-1", children: instructor.name }), _jsx("p", { className: "text-emerald-500 dark:text-emerald-400 font-medium mb-2", children: instructor.title }), _jsx("div", { className: "text-sm text-gray-600 dark:text-slate-400 mb-3", children: _jsxs("p", { children: [_jsx("span", { className: "text-orange-500 dark:text-orange-400 font-semibold", children: instructor.experience }), _jsx("span", { className: "mx-2 text-gray-300", children: "\u2022" }), _jsx("span", { className: "text-blue-500 dark:text-blue-400 font-semibold", children: instructor.specialization })] }) }), _jsx("p", { className: "text-gray-700 dark:text-white", children: instructor.bio }), instructor.certifications && instructor.certifications.length > 0 && (_jsxs("div", { className: "mt-4 text-left", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2", children: "Certifications" }), _jsx("div", { className: "flex flex-wrap gap-2", children: instructor.certifications.map((c, i) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-200", children: c }, i))) })] }))] }, index))) })] }) }), _jsx("section", { className: "bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white py-20", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2 text-gray-900 dark:text-white", children: "1000+" }), _jsx("div", { className: "text-gray-600 dark:text-slate-300", children: "Happy Students" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2 text-gray-900 dark:text-white", children: "25+" }), _jsx("div", { className: "text-gray-600 dark:text-slate-300", children: "Classes per Week" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2 text-gray-900 dark:text-white", children: "5" }), _jsx("div", { className: "text-gray-600 dark:text-slate-300", children: "Years of Experience" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2 text-gray-900 dark:text-white", children: "5+" }), _jsx("div", { className: "text-gray-600 dark:text-slate-300", children: "Certified Instructors" })] })] }) }) })] }));
}
