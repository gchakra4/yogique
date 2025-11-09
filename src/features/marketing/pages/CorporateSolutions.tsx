import { ArrowRight, BarChart3, Brain, Heart, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'

export function CorporateSolutions() {
    const benefits = [
        { icon: <Heart className="w-6 h-6 text-rose-500" />, title: 'Stress Reduction', desc: 'Guided breath & movement reduce workplace tension.' },
        { icon: <Brain className="w-6 h-6 text-purple-500" />, title: 'Mental Clarity', desc: 'Mindfulness segments sharpen focus & decision-making.' },
        { icon: <TrendingUp className="w-6 h-6 text-emerald-600" />, title: 'Productivity Boost', desc: 'Regular sessions enhance sustained energy & output.' },
        { icon: <Users className="w-6 h-6 text-blue-600" />, title: 'Team Cohesion', desc: 'Shared wellness rituals build trust & empathy.' },
        { icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />, title: 'Reduced Burnout Risk', desc: 'Emotional regulation practices support resilience.' },
        { icon: <BarChart3 className="w-6 h-6 text-orange-500" />, title: 'Measurable ROI', desc: 'Track attendance, engagement & wellbeing metrics.' }
    ]

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
    ]

    const caseStudies = [
        { company: 'FinTech Scale-up', outcome: 'Reported 23% drop in weekly stress indicators after 8 weeks.' },
        { company: 'Remote SaaS Team', outcome: 'Attendance stabilized at 78% and voluntary wellness initiative adoption doubled.' },
        { company: 'Design Agency', outcome: 'Creative team cited smoother handoffs + reduced posture injuries.' }
    ]

    const testimonials = [
        { author: 'HR Director, Mid-size Tech', quote: 'The weekly integrated sessions became the anchor ritual for our distributed teams.' },
        { author: 'Operations Lead, SaaS', quote: 'We saw calmer standups and fewer escalations after month two.' }
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">Corporate Wellness & Integrated Yogic Programs</h1>
                            <p className="text-lg text-gray-600 dark:text-slate-300">Human-centered performance. We help teams cultivate stability (Sthira) and ease (Sukha) for sustainable output.</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/contact">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg">Request Proposal <ArrowRight className="ml-2 w-5 h-5" /></Button>
                                </Link>
                                <Link to="/book">
                                    <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 font-semibold rounded-lg">Book Pilot</Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 shadow-xl space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Program Outcomes</h2>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                                    <li>Lower stress markers & improved breath awareness</li>
                                    <li>Better meeting presence and calmer decision cycles</li>
                                    <li>Reduced musculoskeletal discomfort & posture fatigue</li>
                                    <li>Culture signal: investing in whole-person wellbeing</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Key Benefits</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((b, i) => (
                            <div key={i} className="rounded-xl border border-gray-100 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition">
                                <div className="mb-3">{b.icon}</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{b.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-300">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50 dark:bg-slate-800/50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Case Studies</h2>
                    <div className="space-y-6">
                        {caseStudies.map((c, i) => (
                            <div key={i} className="rounded-xl border border-gray-100 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{c.company}</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{c.outcome}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Packages</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map((p, i) => (
                            <div key={i} className={`rounded-2xl border ${p.highlight ? 'border-blue-500 shadow-xl' : 'border-gray-100 dark:border-slate-700 shadow-sm'} bg-white dark:bg-slate-800 p-6 flex flex-col`}>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{p.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{p.period}</p>
                                <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-2 mb-4">
                                    {p.features.map((f, idx) => <li key={idx}>• {f}</li>)}
                                </ul>
                                <div className="mt-auto">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">Enquire</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Corporate Voices</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="rounded-xl border border-gray-100 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 shadow-sm">
                                <p className="italic text-gray-700 dark:text-slate-300">“{t.quote}”</p>
                                <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">{t.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Elevate Team Wellbeing?</h2>
                    <p className="text-lg text-gray-600 dark:text-slate-300 mb-8">Start with a pilot or request a tailored multi-quarter roadmap aligned to your organizational objectives.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/contact"><Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">Request Proposal</Button></Link>
                        <Link to="/book"><Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4">Book Pilot</Button></Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default CorporateSolutions
