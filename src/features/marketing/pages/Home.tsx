import { Activity, ArrowRight, Award, Brain, Building, Eye, Globe, Heart, Sparkles, Target, User, Users, Wind } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { LeadMagnetCTA } from '../components/LeadMagnetCTA'

// Intersection Observer hook for reveal-on-scroll
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Respect reduced motion preferences
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

// Reveal wrapper component
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

// Subtle section divider variants: 'line' (default), 'tilt', 'wave'
const SectionDivider: React.FC<{ variant?: 'line' | 'tilt' | 'wave'; flip?: boolean; className?: string }> = ({ variant = 'line', flip = false, className = '' }) => {
  if (variant === 'tilt') {
    return (
      <div aria-hidden className={`w-full overflow-hidden leading-[0] ${className}`}>
        <svg
          className={`block w-full h-3 text-slate-200 dark:text-slate-800/70 ${flip ? 'rotate-180' : ''}`}
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="0,0 1200,0 1200,40" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    )
  }
  if (variant === 'wave') {
    return (
      <div aria-hidden className={`w-full overflow-hidden leading-[0] ${className}`}>
        <svg
          className={`block w-full h-6 text-slate-200 dark:text-slate-800/70 ${flip ? 'rotate-180' : ''}`}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,0 C300,60 900,-60 1200,0 L1200,120 L0,120 Z" fill="currentColor" opacity="0.35" />
          <path d="M0,0 C300,40 900,-40 1200,0 L1200,120 L0,120 Z" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
    )
  }
  // 'line' variant
  return (
    <div aria-hidden className={`w-full py-2 ${className}`}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-700/50" />
    </div>
  )
}

export function Home() {
  const services = [
    {
      icon: <User className="w-12 h-12 text-blue-500 dark:text-blue-400" />,
      title: "Personalized Online Coaching",
      description: "Individual attention, flexible scheduling, customized programs",
      features: ["1-on-1 sessions", "Personalized routines", "Flexible timing", "Progress tracking"],
      route: "/book/individual"
    },
    {
      icon: <Users className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />,
      title: "Online Group Sessions",
      description: "Build consistency with like-minded professionals",
      features: ["Small group classes", "Community support", "Regular schedule", "Affordable pricing"],
      route: "/book/private-group"
    },
    {
      icon: <Building className="w-12 h-12 text-orange-500 dark:text-orange-400" />,
      title: "Corporate Wellness Solutions",
      description: "Enhance team well-being and performance",
      features: ["Team sessions", "Workplace wellness", "Stress reduction", "Productivity boost"],
      route: "/book/corporate"
    }
  ]

  const benefits = [
    {
      icon: <Globe className="w-8 h-8 text-blue-500 dark:text-blue-400" />,
      title: "Global Accessibility",
      description: "Join from anywhere in the world with just an internet connection"
    },
    {
      icon: <Building className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Corporate Wellness Focus",
      description: "Specialized programs designed for busy professionals"
    },
    {
      icon: <Target className="w-8 h-8 text-purple-500 dark:text-purple-400" />,
      title: "Personalized Approach",
      description: "Customized sessions tailored to your specific needs and goals"
    },
    {
      icon: <Award className="w-8 h-8 text-orange-500 dark:text-orange-400" />,
      title: "Professional Experience",
      description: "5+ years of expertise combining traditional practices with modern wellness"
    }
  ]

  const layers = [
    {
      icon: <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Body",
      subtitle: "Annamaya"
    },
    {
      icon: <Wind className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      title: "Energy",
      subtitle: "Pranamaya"
    },
    {
      icon: <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      title: "Mind",
      subtitle: "Manomaya"
    },
    {
      icon: <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Intellect",
      subtitle: "Vijnanamaya"
    },
    {
      icon: <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />,
      title: "Bliss",
      subtitle: "Anandamaya"
    }
  ]

  const testimonials = [
    {
      name: "Kasturi Ray",
      location: "Kolkata, India",
      position: "Yoga Practitioner",
      content: "Joining Yogique has been a life changing experience since the past six months. Yog, meditation and individual attendtion by Bratati is giving new way of holistic well being. Thank You 🙏",
      image: "/images/testimonial_Kasturi_Ray.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      type: "1-on-1"
    },
    {
      name: "Rina",
      location: "Auckland, New Zealand",
      position: "Yoga Practitioner",
      content: "I was visiting my niece in India and joined her in session with Bratati. Hearing the correct pronunciation of the Asanas, experiencing the working of an online class inspired me to revive my yoga practice. I feel fortunate to learn yoga with Bratati’s guidance and instructions. Her attention to posture, gradually build strength and balance helps me improve wellbeing. Her pleasant and kind, yet encouraging approach goes a long way in sustaining my commitment to yoga.  The  added tips on poses are gentle reminders to make it practical and doable in the daily routine.",
      image: "/images/Testimonial_Rina.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      type: "1-on-1"
    },
    {
      name: "Moumita Pradhan",
      location: "Kolkata, India",
      position: "Student",
      content: "I have been associated with Yogique for a quiet a few years.. Practicing under Bratati's guidance has been a wonderful experience. She teaches each asana in such a clear and supportive way that even the most challenging pose feel achievable. What stands out most is the care she takes for each individual's needs, making sure we feel comfortable, safe and confident throughout the session. Her approach creates a nurturing and motivating environment that makes yoga truly enjoyable and sustainable.",
      image: "/images/testimonial_Moumita_Pradhan.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    }
  ]

  // Simple fade slider state for testimonials
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [pauseAuto, setPauseAuto] = useState(false)

  const goNextTestimonial = () => setActiveTestimonial((i) => (i + 1) % testimonials.length)
  const goPrevTestimonial = () => setActiveTestimonial((i) => (i - 1 + testimonials.length) % testimonials.length)

  useEffect(() => {
    if (pauseAuto) return
    const id = setInterval(goNextTestimonial, 6000)
    return () => clearInterval(id)
  }, [pauseAuto, testimonials.length])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400 text-transparent bg-clip-text">
                  Transform Your
                  <span className="block">Life, Mind,</span>
                  <span className="block">and Body — Yoga for Everyone</span>
                </h1>
                <div className="mt-5">
                  {/* compact pill bar */}
                  <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 backdrop-blur px-4 py-2 shadow-sm">
                    <span className="flex items-center gap-2 pr-3 text-sm text-gray-800 dark:text-slate-200">
                      <Wind className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Breath
                    </span>
                    <span className="mx-2 h-4 w-px bg-gray-300/70 dark:bg-slate-700" />
                    <span className="flex items-center gap-2 px-1 text-sm text-gray-800 dark:text-slate-200">
                      <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Presence
                    </span>
                    <span className="mx-2 h-4 w-px bg-gray-300/70 dark:bg-slate-700" />
                    <span className="flex items-center gap-2 pl-3 text-sm text-gray-800 dark:text-slate-200">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Accessible
                    </span>
                  </div>
                </div>
                <p className="text-xl text-gray-600 dark:text-slate-300 leading-relaxed">
                  Yogique offers personalized, accessible yoga for everyone — beginners, busy parents, seniors
                  and professionals. We provide online B2C classes, small group sessions, and specialized programs. Enjoy guided movement, breathwork and mindful practice from home or on the go.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/yogique-for-you">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md"
                  >
                    <span className="flex items-center whitespace-nowrap">
                      Book a Session
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </span>
                  </Button>
                </Link>
                <Link to="/schedule">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 px-6 py-3.5 text-base sm:px-8 sm:py-4 sm:text-lg font-semibold rounded-lg whitespace-nowrap"
                  >
                    Book a community class
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>5+ Years Experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Global Reach</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Corporate Focus</span>
                </div>
              </div>
            </Reveal>

            <Reveal className="relative" delay={100}>
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-500 shadow-2xl rounded-3xl overflow-hidden">
                <img
                  src="/images/Garudasana.png"
                  alt="Garudasana"
                  className="rounded-3xl w-full h-auto object-cover"
                />
                {/* floating accents */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-300 rounded-full opacity-40 blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-blue-300 rounded-full opacity-30 blur-3xl"></div>
              </div>
              <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-blue-200 to-green-200 rounded-2xl -z-10 opacity-30"></div>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-blue-100 via-sky-100 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the perfect yoga program that fits your lifestyle and goals
            </p>
          </Reveal>

          <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-8" delay={100}>
            {services.map((service, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500">
                <div className="flex justify-center mb-6">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">{service.title}</h3>
                <p className="text-gray-600 dark:text-slate-300 mb-6 text-center">{service.description}</p>

                <ul className="space-y-2 mb-8">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700 dark:text-slate-300">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={service.route}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300">
                    Book Your Class
                  </Button>
                </Link>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <SectionDivider flip />

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal className="relative">
              <img
                src="\images\Virbhadrasana2.png?auto=compress&cs=tinysrgb&w=500&h=600&fit=crop"
                alt="Yoga instructor"
                className="rounded-2xl shadow-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">5+</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Years Experience</div>
                </div>
              </div>
            </Reveal>

            <Reveal className="space-y-6" delay={100}>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Your Global Yoga Journey Starts Here</h2>
              <div className="space-y-4 text-gray-700 dark:text-slate-300 leading-relaxed">
                <p>
                  With over five years of experience blending traditional yogic wisdom and modern wellness,
                  we bring the transformative power of yoga to professionals around the world.
                </p>
                <p>
                  Our online-first approach and global reach mean distance is never a barrier to your
                  wellbeing. Whether you're a busy executive in New York or a startup founder in Singapore,
                  personalized yoga guidance is just a click away.
                </p>
                <p>
                  We see yoga as more than postures — it is a practical way to restore balance, reduce
                  stress, and improve overall wellbeing so you can perform better and feel calmer in
                  fast-paced professional lives.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1000+</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Inspired Lives</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">5+</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Corporate Programs</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Integrated Yogic Experience (teaser) */}
      <section className="py-20 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">The 5-Layer Model</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Integrated Yogic Experience</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">A layered teaching method that blends stability and ease to transform body, breath and mind.</p>
            <div className="mt-8 mb-8 md:mb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
              {layers.map((layer, idx) => (
                <div
                  key={idx}
                  className="group p-4 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-2">{layer.icon}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{layer.title}</div>
                    <div className="text-xs text-gray-600 dark:text-slate-400">{layer.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/teaching-method">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
                Discover Our Teaching Method
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      <SectionDivider flip />

      {/* Why Choose Yogique */}
      <section className="py-20 bg-gradient-to-br from-teal-100 via-emerald-100 to-green-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Yogique</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Experience the difference with our unique approach to online yoga
            </p>
          </Reveal>

          <Reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" delay={100}>
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-slate-300">{benefit.description}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">What Our Global Community Says</h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Real stories from professionals who transformed their lives with Yogique
            </p>
          </Reveal>

          {/* Fade Slider */}
          <div
            className="relative max-w-5xl mx-auto"
            onMouseEnter={() => setPauseAuto(true)}
            onMouseLeave={() => setPauseAuto(false)}
          >
            {/* Slides */}
            <div className="relative min-h-[720px] md:min-h-[460px] lg:min-h-[500px]">
              {testimonials.map((t, i) => {
                const isActive = i === activeTestimonial
                return (
                  <div
                    key={i}
                    aria-hidden={!isActive}
                    className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <div className="h-full">
                      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border-2 border-gray-100 dark:border-slate-700 h-full overflow-visible md:overflow-hidden">
                        <div className="grid md:grid-cols-[280px_1fr] h-full">
                          {/* Left: Profile */}
                          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-emerald-900/20 p-5 md:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-700">
                            <div className="absolute top-3 left-4 text-blue-300/40 dark:text-blue-700/40 text-7xl font-serif leading-none select-none">"</div>
                            <div className="relative z-10 mb-5">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-full blur-lg opacity-40"></div>
                              <img src={t.image} alt={t.name} className="relative w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-700 shadow-2xl" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-xl text-center mb-1">{t.name}</h4>
                            {t.position && <p className="text-sm text-gray-600 dark:text-slate-400 text-center mb-2">{t.position}</p>}
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span className="font-medium">{t.location}</span>
                            </p>
                          </div>

                          {/* Right: Quote */}
                          <div className="p-5 sm:p-6 md:p-10 flex items-center">
                            <div className="w-full">
                              <p className="text-gray-700 dark:text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed italic font-serif">
                                “{t.content}”
                              </p>
                              <div className="mt-6">
                                <Link to="/testimonials" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm transition-colors group">
                                  Read more stories
                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Controls */}
            <button
              onClick={goPrevTestimonial}
              aria-label="Previous testimonial"
              className="absolute left-0 -translate-x-1 md:-left-4 top-1/2 -translate-y-1/2 z-30 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl hover:scale-110 border-2 border-gray-200 dark:border-slate-600 transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5 rotate-180 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={goNextTestimonial}
              aria-label="Next testimonial"
              className="absolute right-0 translate-x-1 md:-right-4 top-1/2 -translate-y-1/2 z-30 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl hover:scale-110 border-2 border-gray-200 dark:border-slate-600 transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Dots */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'w-8 bg-blue-600 dark:bg-blue-400' : 'w-2.5 bg-gray-300 dark:bg-slate-600'}`}
                  onClick={() => setActiveTestimonial(i)}
                />
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <Reveal delay={300}>
            <div className="text-center mt-16">
              <p className="text-gray-600 dark:text-slate-400 mb-4">Join our growing community of 1000+ satisfied students</p>
              <Link to="/contact">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg inline-flex items-center gap-2">
                  Share Your Story
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Lead Magnet */}
      <section className="py-20 bg-gradient-to-br from-fuchsia-100 via-pink-100 to-rose-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <LeadMagnetCTA />
          </Reveal>
        </div>
      </section>

      <SectionDivider flip />

      {/* Subscription Offers removed per request */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 text-gray-900 dark:text-white">
        <Reveal className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Begin Your Wellness Journey</h2>
          <p className="text-xl mb-8 text-gray-600 dark:text-slate-300">
            Join thousands of professionals worldwide who have discovered the transformative power of yoga.
            Schedule your first class today and take the first step towards a healthier, more balanced life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/yogique-for-you">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md"
              >
                <span className="flex items-center whitespace-nowrap">
                  Book Your Class
                  <ArrowRight className="ml-2 w-5 h-5" />
                </span>
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 px-8 py-4 text-lg font-semibold rounded-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
