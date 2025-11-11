import { Calendar, Clock, CreditCard, Users } from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'
import { WeeklySchedule } from '../components/WeeklySchedule'

export function Schedule() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Class Schedule</h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 leading-relaxed">
            Find the perfect class time that fits your schedule. Our regular weekly classes
            are designed to help you build a consistent yoga practice. Book instantly with just one click!
          </p>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WeeklySchedule />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Our Classes?</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Experience the benefits of structured, regular yoga practice with instant booking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
              <Calendar className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Consistent Schedule</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Regular weekly classes help you build a sustainable yoga practice and see real progress.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
              <Users className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Small Groups</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Limited class sizes ensure personalized attention and a supportive community atmosphere.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
              <Clock className="w-12 h-12 text-purple-500 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Instant Booking</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Book your spot instantly with one click. No waiting, no complicated forms.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
              <CreditCard className="w-12 h-12 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Flexible Payment</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Pay per class or choose from our package deals. Payment integration coming soon!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Instructions */}
      <section className="py-20 bg-gray-100 dark:bg-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How to Book a Class</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Simple, fast, and secure booking process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-700 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-600 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Choose Your Class</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Browse our weekly schedule and find a class that fits your schedule and skill level.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-600 text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sign In & Book</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Click "Book Now" and sign in to your account. New users can create an account instantly.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-600 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get Confirmation</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Receive instant confirmation and join your class at the scheduled time.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">New to Yoga?</h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Don't worry! Our beginner-friendly classes are perfect for those just starting their yoga journey.
              </p>
              <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Have questions? Contact us →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Ready to Join a Class?</h2>
          <p className="text-xl mb-8 text-gray-600 dark:text-slate-300">
            Book your spot in one of our regular classes and start your journey to better health and wellness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#schedule">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 px-8 py-4 text-lg font-semibold rounded-lg shadow-md">
                View Schedule Above
              </Button>
            </a>
            <a href="/contact">
              <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 px-8 py-4 text-lg font-semibold rounded-lg">
                Ask Questions
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}