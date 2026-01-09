import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Brain, Eye, Heart, Sparkles, Target, Wind } from 'lucide-react'
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

const SectionDivider: React.FC<{ flip?: boolean; className?: string }> = ({ flip = false, className = '' }) => (
  <div aria-hidden className={`w-full py-2 ${className}`}>
    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-700/50" />
  </div>
)

export default function TeachingMethod() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <section className="py-20 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">The 5-Layer Model</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Discover Our Teaching Method</h1>
            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto mb-6">
              A practical, layered approach that balances stability and ease — integrating body, energy, mind, intellect and bliss across every class.
            </p>
            <Link to="/contact">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                Book a Consult
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Reveal>

          <SectionDivider />

          <div className="mt-12 space-y-12">
            {/* Core Principle */}
            <Reveal>
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 dark:from-slate-800 p-8">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">The Core Principle</h2>
                    <p className="text-gray-700 dark:text-slate-300">Teaching should balance <strong>sthira</strong> (stability) and <strong>sukha</strong> (ease) — both physically and mentally. Every class weaves these five aspects together.</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg border-4 border-blue-200">
                      <Sparkles className="w-12 h-12 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Layers (kept as full reference) */}
            <Reveal>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold">Body — Annamaya Kosha</h3>
                  <p className="text-gray-700 dark:text-slate-300">Physical foundation: mobility, alignment, strength and restorative practice.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Energy — Pranamaya Kosha</h3>
                  <p className="text-gray-700 dark:text-slate-300">Breathwork and energetic balance to support calm and vitality.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Mind & Intellect — Manomaya & Vijnanamaya Kosha</h3>
                  <p className="text-gray-700 dark:text-slate-300">Mindful sequencing, reflection and practical guidance to build sustainable practice.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Bliss — Anandamaya Kosha</h3>
                  <p className="text-gray-700 dark:text-slate-300">Guided relaxation and contemplative practices to access inner calm and joy.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}
