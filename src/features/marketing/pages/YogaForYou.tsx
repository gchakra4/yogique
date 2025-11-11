import { Activity, Baby, Brain, Calendar, Dumbbell, Feather, Heart, Home, Sparkles, User, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'

export function YogaForYou() {
    const services = [
        {
            icon: <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
            title: '1-on-1 Coaching',
            desc: 'Personalized plans, pace that suits you, and focused attention to your goals.',
            to: '/book/individual',
            cta: 'Book Individual',
            accent: 'from-blue-500 to-cyan-500'
        },
        {
            icon: <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />,
            title: 'Group Classes',
            desc: 'Small, friendly groups that build consistency. Free demo available.',
            to: '/schedule',
            cta: 'Join Free Demo',
            accent: 'from-emerald-500 to-teal-500',
            badge: 'Free Demo'
        },
        {
            icon: <Calendar className="w-10 h-10 text-orange-600 dark:text-orange-400" />,
            title: 'Corporate Wellness',
            desc: 'Stress reduction, mobility and focus programs designed for teams.',
            to: '/book/corporate',
            cta: 'Corporate Enquiry',
            accent: 'from-orange-500 to-amber-500'
        }
    ]

    const personas = [
        {
            icon: <Baby className="w-8 h-8" />,
            title: 'Beginners',
            points: ['Foundational postures', 'Safe alignment cues', 'Gentle pace + breaks'],
            gradient: 'from-blue-50 to-cyan-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: <Home className="w-8 h-8" />,
            title: 'Busy Parents',
            points: ['Short 20–30 min options', 'Home-friendly flows', 'Stress reset + breath'],
            gradient: 'from-emerald-50 to-teal-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: <Dumbbell className="w-8 h-8" />,
            title: 'Men',
            points: ['Mobility for hips/hamstrings', 'Strength + stability', 'Back care'],
            gradient: 'from-violet-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: <Feather className="w-8 h-8" />,
            title: 'Women',
            points: ['Cycle-aware options', 'Core + pelvic floor', 'Stress relief'],
            gradient: 'from-rose-50 to-pink-50 dark:from-slate-800/60 dark:to-slate-900/60'
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: 'Superagers (Seniors)',
            points: ['Joint-friendly sequences', 'Balance + fall prevention', 'Chair/prop support'],
            gradient: 'from-amber-50 to-yellow-50 dark:from-slate-800/60 dark:to-slate-900/60'
        }
        ,
        {
            icon: <Heart className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
            title: 'Therapeutic Yoga',
            points: ['Injury rehab & mobility', 'Chronic pain & posture care', 'Individualized modifications', 'Suitable for postnatal & seniors'],
            gradient: 'from-teal-50 to-emerald-50 dark:from-slate-800/60 dark:to-slate-900/60'
        }
    ]

    const benefits = [
        { icon: <Activity className="w-6 h-6" />, title: 'Flexibility', value: 85, color: 'from-blue-500 to-emerald-500' },
        { icon: <Zap className="w-6 h-6" />, title: 'Mobility', value: 78, color: 'from-cyan-500 to-blue-500' },
        { icon: <Heart className="w-6 h-6" />, title: 'Longevity', value: 72, color: 'from-rose-500 to-pink-500' },
        { icon: <Brain className="w-6 h-6" />, title: 'Productivity', value: 64, color: 'from-amber-500 to-orange-500' }
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
            {/* Hero */}
            <section className="relative py-24 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
                <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40">
                    <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl bg-emerald-200/40 dark:bg-emerald-500/10 animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] rounded-full blur-3xl bg-blue-200/40 dark:bg-blue-500/10" />
                </div>
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 shadow-sm mb-4">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-700 dark:text-slate-200">Yoga for Every Body & Lifestyle</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400 text-transparent bg-clip-text">
                        Services + Personalized Programs
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto">
                        Whether you’re starting out, raising a family, building a career, or staying active as a superager — we customize yoga to fit you.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/schedule">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                                Join a Free Demo Group Class
                            </Button>
                        </Link>
                        <Link to="/book/individual">
                            <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl">
                                Start 1-on-1 Coaching
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Services overview */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map((s, i) => (
                            <div key={i} className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${s.accent}`} />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700 flex items-center justify-center shadow">
                                        {s.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{s.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-300">{s.desc}</p>
                                    </div>
                                    {s.badge && s.title !== 'Group Classes' && (
                                        <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{s.badge}</span>
                                    )}
                                </div>
                                <div className="mt-5">
                                    {s.title === 'Group Classes' ? (
                                        <div className="space-y-3">
                                            <p className="text-sm italic text-gray-600 dark:text-slate-400">
                                                Have a private group? Use the "Private Group" button to request a dedicated session. To join our regular public classes or try a free demo, click "View &amp; Join" to see the schedule.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                                <Link to="/book-class">
                                                    <Button variant="outline" className="border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02]">
                                                        Private Group
                                                    </Button>
                                                </Link>
                                                <Link to="/schedule" className="relative inline-block">
                                                    <Button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3">
                                                        <span>View &amp; Join</span>
                                                    </Button>
                                                    <span className="absolute -top-2 -right-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shadow">Free Demo</span>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link to={s.to}>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300">
                                                {s.cta}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Personalization */}
            <section className="relative py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-50">
                    <div className="absolute left-8 top-8 w-24 h-24 rounded-full bg-emerald-300/30 blur-2xl" />
                    <div className="absolute right-10 bottom-10 w-32 h-32 rounded-full bg-blue-300/30 blur-3xl" />
                </div>
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold">Tailored For You</h2>
                        <p className="text-lg text-gray-600 dark:text-slate-300">Smart adjustments, props, and pacing for every body and season of life.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {personas.map((p, i) => (
                            <div key={i} className={`group rounded-2xl p-6 border border-gray-100 dark:border-slate-700 bg-gradient-to-br ${p.gradient} shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                        {p.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold">{p.title}</h3>
                                </div>
                                <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-slate-300">
                                    {p.points.map((pt, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits with radial graphs */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">How Yoga Helps</h2>
                        <p className="text-lg text-gray-600 dark:text-slate-300">Flexible body, mobile joints, calmer mind — leading to better focus and longevity.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {benefits.map((b, i) => (
                            <div key={i} className="rounded-2xl p-6 border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
                                <div className="mx-auto w-28 h-28 relative">
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: `conic-gradient(var(--tw-gradient-stops))`,
                                            ['--tw-gradient-from' as any]: `var(--tw-color-from)`,
                                            ['--tw-gradient-to' as any]: 'transparent',
                                        }}
                                    />
                                    <div
                                        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${b.color}`}
                                        style={{ mask: `conic-gradient(#000 ${b.value * 3.6}deg, transparent 0)` }}
                                    />
                                    <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                            {b.icon}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 font-semibold">{b.title}</div>
                                <div className="text-sm text-gray-600 dark:text-slate-300">~{b.value}% users reported improvement</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">How We Customize</h2>
                        <p className="text-lg text-gray-600 dark:text-slate-300">Simple steps to your tailored practice.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[{ t: 'Quick Assessment', d: 'We learn about your goals, time, and any concerns.' }, { t: 'Plan & Pace', d: 'We craft a sequence with mods/props and optimal duration.' }, { t: 'Progress & Support', d: 'Track improvements and evolve the plan as you grow.' }].map((x, i) => (
                            <div key={i} className="relative rounded-2xl p-6 border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow">{i + 1}</div>
                                <h3 className="text-xl font-semibold pl-8">{x.t}</h3>
                                <p className="mt-2 text-gray-700 dark:text-slate-300 pl-8">{x.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold">Try a Free Demo Group Class</h2>
                    <p className="text-lg text-gray-700 dark:text-slate-300 mt-3">See how a modern, inclusive practice feels — no pressure, just friendly guidance.</p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/schedule">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">Join Free Demo</Button>
                        </Link>
                        <Link to="/book/individual">
                            <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl">Talk to an Instructor</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default YogaForYou
