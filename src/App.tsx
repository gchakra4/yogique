import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import RequestAccess from './pages/RequestAccess';
import { ScrollToTop } from './shared/components/ScrollToTop';
import { UserRole } from './shared/config/roleConfig';
import { User as CustomUserType } from './shared/types/user';
// Context imports - updated paths
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { NotificationProvider } from './features/notifications/contexts/NotificationContext';
import { ThemeProvider } from './shared/contexts/ThemeContext';
// Layout components - updated paths
import { Footer } from './shared/components/layout/Footer';
import { Header } from './shared/components/layout/Header';
// Auth components - updated paths
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
// Dashboard component - new import
import UniversalDashboard from './features/dashboard/components/UniversalDashboard';
// Page imports - updated paths
import { Navigate } from 'react-router-dom';
import NewArticlePage from './features/articles/pages/NewArticlePage';
import { AuthCallback } from './features/auth/components/AuthCallback';
import { Login } from './features/auth/pages/Login';
import { ResetPassword } from './features/auth/pages/ResetPassword';
import { UpdatePassword } from './features/auth/pages/UpdatePassword';
import { ArticleView } from './features/learning/pages/ArticleView';
import { Learning } from './features/learning/pages/Learning';
import { About } from './features/marketing/pages/About';
import { Achievements } from './features/marketing/pages/Achievements';
import { BookLanding } from './features/marketing/pages/BookLanding';
import { Contact } from './features/marketing/pages/Contact.jsx';
import { Home } from './features/marketing/pages/Home';
import { Privacy } from './features/marketing/pages/Privacy';
import { Terms } from './features/marketing/pages/Terms';
import { Testimonials } from './features/marketing/pages/Testimonials';
import Unsubscribe from './features/marketing/pages/Unsubscribe';
import { YogaForYou } from './features/marketing/pages/YogaForYou';
import { BookCorporate } from './features/scheduling/pages/BookCorporate';
import { BookOneOnOne } from './features/scheduling/pages/BookOneOnOne';
import CancelBookingPage from './features/scheduling/pages/CancelBookingPage';
import InstructorProfile from './features/scheduling/pages/InstructorProfile';
import { Schedule } from './features/scheduling/pages/Schedule';
import { Profile } from './features/user-profile/pages/Profile';
import AdminApprovals from './pages/AdminApprovals';
import { NotFound } from './pages/NotFound';
import PaymentFailed from './pages/PaymentFailed';
import PaymentSuccess from './pages/PaymentSuccess';
import PricingPage from './pages/PricingPage';

function App() {
  const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : ''
  const isProdHost = hostname === 'yogique.life' || (hostname.endsWith('.yogique.life') && !hostname.startsWith('dev.'))
  const SHOW_DEV_HEADER = typeof window !== 'undefined' && (
    hostname === 'dev.yogique.life' ||
    hostname === 'localhost' ||
    import.meta.env.VITE_SHOW_DEV_HEADER === 'true' ||
    (((window as any).DEVTOOLS_CONFIG?.SHOW_DEV_HEADER === 'true') && !isProdHost)
  )
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <NotificationProvider>
            <div style={{ padding: 16 }}>
              {SHOW_DEV_HEADER && (
                <header style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <h1 style={{ marginRight: 'auto' }}>DevTools Hub</h1>
                  <nav style={{ display: 'flex', gap: 12 }}>
                    <Link to="/">Home</Link>
                    <Link to="/admin/approvals">Admin Approvals</Link>
                  </nav>
                </header>
              )}
              <AppRoutes />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

function AppRoutes() {
  const { user, userRoles } = useAuth() // Get current user from auth context
  const ENABLE_REQUEST_ACCESS = (import.meta.env.VITE_ENABLE_REQUEST_ACCESS === 'true') || (
    typeof window !== 'undefined' && (
      window.location?.hostname === 'dev.yogique.life' ||
      Boolean((window as any).DEVTOOLS_CONFIG?.ENABLE_REQUEST_ACCESS === 'true')
    )
  )

  // Compose a dashboardUser with a role property for UniversalDashboard
  const dashboardUser: CustomUserType | null = user && userRoles.length > 0
    ? {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: userRoles[0] as UserRole,
      isActive: !!user.email_confirmed_at,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at)
    }
    : null

  return (
    <Routes>
      {/* Universal Dashboard Route - New modular dashboard */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-white dark:bg-slate-900">
              {dashboardUser && <UniversalDashboard user={dashboardUser} />}
            </div>
          </ProtectedRoute>
        }
      />

      {/* Unauthorized Access Route */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
            <Header />
            <main className="flex-grow flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                <p className="text-gray-600 dark:text-slate-300">You don't have permission to access this resource.</p>
              </div>
            </main>
            <Footer />
          </div>
        }
      />

      {/* Public Routes */}
      <Route path="/*" element={
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
          <Header />
          <main className="flex-grow bg-white dark:bg-slate-900">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Navigate to="/yogique-for-you" replace />} />
              {ENABLE_REQUEST_ACCESS && (
                <Route path="/request-access" element={<RequestAccess />} />
              )}
              <Route path="/yogique-for-you" element={<YogaForYou />} />
              <Route path="/book" element={<BookLanding />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              {/* Removed /book-class route; links now point to external URL */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:id" element={<ArticleView />} />
              <Route path="/articles/new" element={<NewArticlePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
              <Route path="/bookings/:bookingId/cancel" element={<CancelBookingPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failed" element={<PaymentFailed />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/book/individual" element={<BookOneOnOne />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/book/corporate" element={<BookCorporate />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/admin/approvals" element={
                <ProtectedRoute>
                  <AdminApprovals />
                </ProtectedRoute>
              } />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  )
}

export default App
