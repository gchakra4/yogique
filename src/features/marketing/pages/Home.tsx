import { ArrowRight, Award, Building, Globe, Target, User, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'

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
      route: "/book-class"
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

  const testimonials = [
    {
      name: "Kasturi Ray",
      location: "Kolkata, India",
      position: "Student",
      content: "Joining Yogique has been a life changing experience since the past six months. Yog, meditation and individual attendtion by Bratati is giving new way of holistic well being. Thank You 🙏",
      image: "/images/testimonial_Kasturi_Ray.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      type: "1-on-1"
    },
    {
      name: "Rina",
      location: "Auckland, New Zealand",
      position: "Student",
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Transform Your
                  <span className="block text-blue-600 dark:text-blue-400">Workplace, Mind,</span>
                  <span className="block text-emerald-600 dark:text-emerald-400">and Body — Online</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-slate-300 leading-relaxed">
                  Yogique brings personalized corporate and wellness yoga programs
                  to professionals worldwide. Experience the power of yoga from anywhere.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/services">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md"
                  >
                    <span className="flex items-center whitespace-nowrap">
                      Book Your Class
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </span>
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-lg">
                    Learn More
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
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/images/Garudasana.png"
                  alt="Garudasana"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-blue-200 to-green-200 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the perfect yoga program that fits your lifestyle and goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
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
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Your Global Yoga Journey Starts Here</h2>
              <div className="space-y-4 text-gray-700 dark:text-slate-300 leading-relaxed">
                <p>
                  With over 5 years of expertise combining traditional yoga practices with modern wellness needs,
                  I specialize in bringing the transformative power of yoga to professionals worldwide.
                </p>
                <p>
                  My focus on online teaching and global reach ensures that distance is never a barrier to
                  your wellness journey. Whether you're a busy executive in New York or a startup founder
                  in Singapore, personalized yoga guidance is just a click away.
                </p>
                <p>
                  I believe that yoga is not just about physical postures—it's about creating balance,
                  reducing stress, and enhancing overall well-being in our fast-paced professional lives.
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
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Yogique */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Yogique</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Experience the difference with our unique approach to online yoga
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-slate-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Global Community Says</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Real stories from professionals who transformed their lives with Yogique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{testimonial.position}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-slate-300 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 dark:text-yellow-300 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Begin Your Wellness Journey</h2>
          <p className="text-xl mb-8 text-gray-600 dark:text-slate-300">
            Join thousands of professionals worldwide who have discovered the transformative power of yoga.
            Schedule your first class today and take the first step towards a healthier, more balanced life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/services">
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
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
