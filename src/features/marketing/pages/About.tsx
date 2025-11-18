import { Award, Heart, Target, Users } from 'lucide-react'

export function About() {
  const values = [
    {
      icon: <Heart className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Compassion",
      description: "We approach every student with kindness, understanding, and patience on their unique journey."
    },
    {
      icon: <Target className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Excellence",
      description: "We strive for the highest standards in teaching, safety, and student experience."
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Community",
      description: "We foster a supportive, inclusive environment where everyone feels welcome and valued."
    },
    {
      icon: <Award className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Authenticity",
      description: "We honor traditional yoga practices while making them accessible to modern practitioners."
    }
  ]

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
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">Welcome to Yogique – Breathe. Move. Transform.</h1>
          <p className="text-lg text-gray-700 dark:text-slate-300">
            Sharing traditional practice with modern life — accessible, therapeutic, and community-led. We help people
            build steady, sustainable habits for wellbeing, movement, and calm.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 shadow-sm">
            <span className="text-sm text-gray-700 dark:text-slate-200">Yogique is a brand of Sampurnayogam LLP (registered)</span>
          </div>
        </div>
      </section>

      {/* Teaching Approach Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">How we teach</h2>
              <div className="space-y-4 text-lg text-gray-700 dark:text-slate-300">
                <p>
                  At Sampurnayogam, we bring together the depth of classical yogic wisdom and the clarity of modern, evidence-informed practice. Our approach is gentle yet progressive, designed to support every individual — whether you are just beginning, returning after an injury, or refining an established practice.
                </p>

                <p>We guide students through five harmonious layers of learning:</p>

                <ul className="list-disc list-inside ml-5 space-y-1 text-lg text-gray-700 dark:text-slate-300">
                  <li>Breath (pranayama)</li>
                  <li>Movement &amp; alignment (asana)</li>
                  <li>Mindful sequencing &amp; pacing</li>
                  <li>Restorative practices (relaxation &amp; meditation)</li>
                  <li>Practical guidance for weaving yoga into daily life</li>
                </ul>

                <p>
                  In every class, our instructors offer thoughtful options and modifications, helping you move with stability (sthira), ease (sukha), and confidence.
                </p>

                <p>
                  Our teachers are trained to observe, cue, and adapt with care — creating personalized growth pathways in both group classes and one-to-one sessions. Wherever you are in your journey, we’re here to support you with presence, precision, and compassion.
                </p>
              </div>
            </div>
            <div>
              <img
                src="/images/aboutus.png?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                alt="Yoga practice"
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">What you can expect</h3>
            <p className="text-gray-600 dark:text-slate-300 mt-2">
              Clear structure, safe progressions, and measurable improvements in wellbeing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-2">Structured classes</h4>
              <p className="text-gray-600 dark:text-slate-300">Warm-up, skill practice, main sequence, and a guided relaxation or meditation.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-2">Personal attention</h4>
              <p className="text-gray-600 dark:text-slate-300">Options and modifications for all bodies; private sessions for therapeutic needs.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-2">Sustainable outcomes</h4>
              <p className="text-gray-600 dark:text-slate-300">Improved mobility, stress reduction, better sleep and daily energy — with simple home practices to keep progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-indigo-50 to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Our Values</h3>
            <p className="text-lg text-gray-700 dark:text-slate-300 max-w-3xl mx-auto">
              These core values guide everything we do and shape the experience we create for our students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">Why we're different</h3>
            <p className="text-lg text-gray-700 dark:text-slate-300 mt-2">Practical, personalized and therapy-aware yoga that fits modern lives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Therapeutic expertise</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300">We combine yoga therapy and physiotherapy principles for safe, effective programs.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v2h6v-2c0-1.657-1.343-3-3-3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Small groups & personalization</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300">Intimate classes + tailored progress plans so students get real results.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Online & accessible</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300">Live classes, recordings, and flexible schedules that fit busy lives across time zones.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 7h.01M17 7h.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Corporate & group programs</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300">Tailored sessions for teams, ergonomics-informed chair yoga, and measurable wellbeing outcomes.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a href="/yogique-for-you" className="inline-flex items-center px-6 py-3 rounded-md bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700">View classes</a>
            <a href="/contact" className="ml-4 inline-flex items-center px-6 py-3 rounded-md border border-emerald-600 text-emerald-600 font-medium hover:bg-emerald-50 dark:hover:bg-slate-800">Book a free demo</a>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">Our Journey: Growing a Global Yoga Community</h2>
              <div className="space-y-4 text-lg text-gray-700 dark:text-slate-300">
                <p>
                  Founded by Ms. Bratati Batabyal in 2021, Yogique is an all-online yoga platform empowering people to live healthier, more mindful lives through yoga. Yogique operates under the umbrella of Sampurnayogam LLP, a registered company.
                </p>
                <p>
                  We’ve trained 1000+ students in different parts of the world—offering accessible, expert-led sessions that blend ancient yogic wisdom with modern lifestyles. We offer online B2C classes, group programs, and specialized wellness sessions.
                </p>
                <p>
                  From corporate wellness and chair yoga to programs for beginners and advanced practitioners, we’re here to help you de-stress, strengthen, and reconnect—wherever you are.
                </p>
                <p>
                  Join our growing community and take the first step toward a balanced, energized, and joyful life.
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                alt="Yoga studio"
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Instructors Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Meet Our Instructors</h2>
            <p className="text-lg text-gray-700 dark:text-slate-300">
              Our certified instructors bring years of experience and passion to every class.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {instructors.map((instructor, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <img
                  src={instructor.image}
                  alt={instructor.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                />

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{instructor.name}</h3>

                <p className="text-emerald-500 dark:text-emerald-400 font-medium mb-2">{instructor.title}</p>

                <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                  <p>
                    <span className="text-orange-500 dark:text-orange-400 font-semibold">{instructor.experience}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-blue-500 dark:text-blue-400 font-semibold">{instructor.specialization}</span>
                  </p>
                </div>

                <p className="text-lg text-gray-700 dark:text-slate-300">{instructor.bio}</p>

                {/* Certifications (optional) - rendered only when provided */}
                {instructor.certifications && instructor.certifications.length > 0 && (
                  <div className="mt-4 text-left">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {instructor.certifications.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">1000+</div>
              <div className="text-gray-600 dark:text-slate-300">Happy Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">25+</div>
              <div className="text-gray-600 dark:text-slate-300">Classes per Week</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">5</div>
              <div className="text-gray-600 dark:text-slate-300">Years of Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">5+</div>
              <div className="text-gray-600 dark:text-slate-300">Certified Instructors</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
