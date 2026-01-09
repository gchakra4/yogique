import { Activity, ArrowRight, Brain, Eye, Heart, Sparkles, Target, Wind } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'

// Minimal intersection observer + reveal used on this page (copied from Home)
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
    const ref = useRef<T | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true)
            return
        }
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    obs.unobserve(entry.target)
                }
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.1, ...(options || {}) }
        )
        obs.observe(el)
        return () => {
            if (el) obs.unobserve(el)
        }
    }, [options])

    return { ref, visible }
}

const Reveal: React.FC<{ className?: string; delay?: number; children: React.ReactNode }> = ({ className = '', delay = 0, children }) => {
    const { ref, visible } = useInView<HTMLDivElement>()
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out will-change-transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
        >
            {children}
        </div>
    )
}


export default function TeachingMethod() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <section className="relative py-24 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-16">
                        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">The 5-Layer Model</span>
                        </div>
                        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                            Integrated Yogic Experience
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            Our teaching balances <span className="font-semibold text-blue-700 dark:text-blue-400">sthira</span> (stability) and{' '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">sukha</span> (ease). Every class consciously integrates five dimensions that cultivate the body, energy, mind, emotions, and wisdom.
                        </p>
                    </Reveal>

                    {/* Core Principle - Featured Hero Card */}
                    <Reveal delay={100}>
                        <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 border-2 border-blue-200/50 dark:border-blue-700/30">
                            <div className="grid lg:grid-cols-2 gap-0">
                                {/* Left side - Content */}
                                <div className="p-10 lg:p-12 flex flex-col justify-center">
                                    <div className="inline-flex items-center gap-2 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                            <Target className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">The Core Principle</h3>
                                    </div>
                                    <p className="text-lg text-gray-700 dark:text-slate-300 mb-8 leading-relaxed">
                                        Teaching should balance <strong>sthira</strong> (stability) and <strong>sukha</strong> (ease) — both physically and mentally. Every class weaves these five aspects together.
                                    </p>
                                    <Link to="/contact">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg inline-flex items-center gap-2 w-fit">
                                            Book a Consult
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>

                                {/* Right side - Visual Highlight */}
                                <div className="relative bg-gradient-to-br from-blue-500/10 to-emerald-500/10 dark:from-blue-600/20 dark:to-emerald-600/20 p-10 lg:p-12 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.1),transparent_50%)]" />
                                    <div className="relative text-center">
                                        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl border-4 border-blue-200 dark:border-blue-700">
                                            <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                            Sthira <span className="text-blue-600 dark:text-blue-400">&</span> Sukha
                                        </h4>
                                        <p className="text-base text-gray-700 dark:text-slate-300 max-w-xs mx-auto">
                                            Stability meets ease in every breath, posture, and moment of practice.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* The 5 Layers - Illustration-focused Design */}
                    <Reveal delay={200}>
                        <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">The Five Dimensions</h3>
                        <p className="text-center text-gray-600 dark:text-slate-300 mb-20 max-w-2xl mx-auto text-lg">
                            A transformative journey through the layers of human experience — from body to bliss.
                        </p>
                    </Reveal>

                    <div className="space-y-24">
                        {/* Body - Layer 1 */}
                        <Reveal delay={250}>
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="order-2 lg:order-1">
                                    <div className="inline-flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-xl">
                                            <Activity className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white bg-blue-500 px-3 py-1 rounded-full">Layer 1</span>
                                            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">Body</h4>
                                        </div>
                                    </div>
                                    <p className="text-xl text-blue-600 dark:text-blue-400 font-semibold mb-4 italic">Annamaya Kosha</p>
                                    <p className="text-lg text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        The physical dimension of mobility, stability, and strength. Through conscious movement and postural awareness, we build a strong foundation for all other layers.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Focus:</strong> Mobility, stability, strength building</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Practice:</strong> Vinyasa flows, Hatha postures, restorative asanas</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-emerald-400/20 rounded-3xl blur-3xl"></div>
                                        <div className="relative bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-3xl p-12 md:p-16 flex items-center justify-center min-h-[300px] border-2 border-blue-200 dark:border-blue-800">
                                            <div className="text-center">
                                                <Activity className="w-32 h-32 mx-auto text-blue-500 dark:text-blue-400 mb-4" strokeWidth={1.5} />
                                                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Physical Foundation</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        {/* Energy - Layer 2 */}
                        <Reveal delay={300}>
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="order-1">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-3xl blur-3xl"></div>
                                        <div className="relative bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-3xl p-12 md:p-16 flex items-center justify-center min-h-[300px] border-2 border-cyan-200 dark:border-cyan-800">
                                            <div className="text-center">
                                                <Wind className="w-32 h-32 mx-auto text-cyan-500 dark:text-cyan-400 mb-4" strokeWidth={1.5} />
                                                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Vital Energy Flow</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-2">
                                    <div className="inline-flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-xl">
                                            <Wind className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white bg-cyan-500 px-3 py-1 rounded-full">Layer 2</span>
                                            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">Energy</h4>
                                        </div>
                                    </div>
                                    <p className="text-xl text-cyan-600 dark:text-cyan-400 font-semibold mb-4 italic">Pranamaya Kosha</p>
                                    <p className="text-lg text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        The energetic layer governed by breath and life force. Through pranayama, we learn to harness and balance our vital energy for vitality and calm.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Focus:</strong> Breath control, energy balance, vitality</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Practice:</strong> Nadi Shodhana, Ujjayi, breath awareness</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        {/* Mind - Layer 3 */}
                        <Reveal delay={350}>
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="order-2 lg:order-1">
                                    <div className="inline-flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-xl">
                                            <Eye className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white bg-purple-500 px-3 py-1 rounded-full">Layer 3</span>
                                            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">Mind</h4>
                                        </div>
                                    </div>
                                    <p className="text-xl text-purple-600 dark:text-purple-400 font-semibold mb-4 italic">Manomaya Kosha</p>
                                    <p className="text-lg text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        The mental-emotional dimension of thoughts, feelings, and perceptions. Cultivating awareness and presence transforms reactive patterns into conscious responses.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Focus:</strong> Awareness, presence, emotional calm</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Practice:</strong> Body scans, mindfulness meditation, observation</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-3xl"></div>
                                        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-12 md:p-16 flex items-center justify-center min-h-[300px] border-2 border-purple-200 dark:border-purple-800">
                                            <div className="text-center">
                                                <Eye className="w-32 h-32 mx-auto text-purple-500 dark:text-purple-400 mb-4" strokeWidth={1.5} />
                                                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Mental Awareness</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        {/* Intellect - Layer 4 */}
                        <Reveal delay={400}>
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="order-1">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-3xl blur-3xl"></div>
                                        <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-3xl p-12 md:p-16 flex items-center justify-center min-h-[300px] border-2 border-amber-200 dark:border-amber-800">
                                            <div className="text-center">
                                                <Brain className="w-32 h-32 mx-auto text-amber-500 dark:text-amber-400 mb-4" strokeWidth={1.5} />
                                                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Higher Wisdom</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-2">
                                    <div className="inline-flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl">
                                            <Brain className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white bg-amber-500 px-3 py-1 rounded-full">Layer 4</span>
                                            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">Intellect</h4>
                                        </div>
                                    </div>
                                    <p className="text-xl text-amber-600 dark:text-amber-400 font-semibold mb-4 italic">Vijnanamaya Kosha</p>
                                    <p className="text-lg text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        The wisdom layer where discernment and deeper understanding emerge. Through reflection and study, we access intuitive knowing beyond ordinary thought.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Focus:</strong> Reflection, insight, intuitive wisdom</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Practice:</strong> Journaling, self-inquiry, yogic philosophy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        {/* Bliss - Layer 5 */}
                        <Reveal delay={450}>
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="order-2 lg:order-1">
                                    <div className="inline-flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl">
                                            <Heart className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white bg-emerald-500 px-3 py-1 rounded-full">Layer 5</span>
                                            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">Bliss</h4>
                                        </div>
                                    </div>
                                    <p className="text-xl text-emerald-600 dark:text-emerald-400 font-semibold mb-4 italic">Anandamaya Kosha</p>
                                    <p className="text-lg text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        The innermost layer of pure joy and peace. Beyond all activity, this dimension connects us to our deepest nature — serene, whole, and complete.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Focus:</strong> Inner joy, peace, spiritual connection</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Practice:</strong> Yoga Nidra, chanting, devotional practice</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-3xl"></div>
                                        <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl p-12 md:p-16 flex items-center justify-center min-h-[300px] border-2 border-emerald-200 dark:border-emerald-800">
                                            <div className="text-center">
                                                <Heart className="w-32 h-32 mx-auto text-emerald-500 dark:text-emerald-400 mb-4" strokeWidth={1.5} />
                                                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Pure Bliss</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>
        </div>
    )
}
