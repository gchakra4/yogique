import { ArrowRight, Building, User, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'

export function BookLanding() {
    const options = [
        {
            icon: <User className="w-10 h-10 text-blue-600" />,
            title: 'Individual Session',
            description: 'Personalized 1-on-1 guidance tailored to your goals.',
            to: '/book/individual'
        },
        {
            icon: <Users className="w-10 h-10 text-emerald-600" />,
            title: 'Group Class',
            description: 'Practice with a supportive community and shared energy.',
            to: '/book-class'
        },
        {
            icon: <Building className="w-10 h-10 text-purple-600" />,
            title: 'Corporate Wellness',
            description: 'Bring structured wellness programs to your team.',
            to: '/book/corporate'
        }
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 py-16">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Book Your Practice Path</h1>
                    <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Choose how you want to begin. Whether you seek individual focus, shared momentum, or organizational wellbeing—start here.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {options.map((opt, i) => (
                        <div key={i} className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-xl transition group">
                            <div className="flex justify-center mb-4">{opt.icon}</div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">{opt.title}</h2>
                            <p className="text-sm text-gray-600 dark:text-slate-300 text-center mb-6">{opt.description}</p>
                            <Link to={opt.to} className="flex justify-center">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center">
                                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Home</Link>
                </div>
            </div>
        </div>
    )
}

export default BookLanding
