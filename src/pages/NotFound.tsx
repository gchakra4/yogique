import { ArrowLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../shared/components/ui/Button'

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist. It might have been moved,
            deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/">
            <Button className="w-full flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Looking for something specific?</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link to="/about" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              About Us
            </Link>
            <Link to="/book/private-group" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              Book Class
            </Link>
            <Link to="/contact" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              Ask Question
            </Link>
            <Link to="/contact" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}