import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ScrollToTop } from './shared/components/ScrollToTop';
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
import { BookClass } from './features/scheduling/pages/BookClass';
import { BookCorporate } from './features/scheduling/pages/BookCorporate';
import { BookOneOnOne } from './features/scheduling/pages/BookOneOnOne';
import CancelBookingPage from './features/scheduling/pages/CancelBookingPage';
import InstructorProfile from './features/scheduling/pages/InstructorProfile';
import { Schedule } from './features/scheduling/pages/Schedule';
import { Profile } from './features/user-profile/pages/Profile';
import { NotFound } from './pages/NotFound';
function App() {
    return (_jsx(ThemeProvider, { children: _jsxs(Router, { children: [_jsx(ScrollToTop, {}), _jsx(AuthProvider, { children: _jsx(NotificationProvider, { children: _jsx(AppRoutes, {}) }) })] }) }));
}
function AppRoutes() {
    const { user, userRoles } = useAuth(); // Get current user from auth context
    // Compose a dashboardUser with a role property for UniversalDashboard
    const dashboardUser = user && userRoles.length > 0
        ? {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: userRoles[0],
            isActive: !!user.email_confirmed_at,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at || user.created_at)
        }
        : null;
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/dashboard/*", element: _jsx(ProtectedRoute, { children: _jsx("div", { className: "min-h-screen bg-white dark:bg-slate-900", children: dashboardUser && _jsx(UniversalDashboard, { user: dashboardUser }) }) }) }), _jsx(Route, { path: "/unauthorized", element: _jsxs("div", { className: "min-h-screen flex flex-col bg-white dark:bg-slate-900", children: [_jsx(Header, {}), _jsx("main", { className: "flex-grow flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-red-600 mb-4", children: "Unauthorized Access" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300", children: "You don't have permission to access this resource." })] }) }), _jsx(Footer, {})] }) }), _jsx(Route, { path: "/*", element: _jsxs("div", { className: "min-h-screen flex flex-col bg-white dark:bg-slate-900", children: [_jsx(Header, {}), _jsx("main", { className: "flex-grow bg-white dark:bg-slate-900", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/services", element: _jsx(Navigate, { to: "/yogique-for-you", replace: true }) }), _jsx(Route, { path: "/yogique-for-you", element: _jsx(YogaForYou, {}) }), _jsx(Route, { path: "/book", element: _jsx(BookLanding, {}) }), _jsx(Route, { path: "/schedule", element: _jsx(Schedule, {}) }), _jsx(Route, { path: "/testimonials", element: _jsx(Testimonials, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(Privacy, {}) }), _jsx(Route, { path: "/terms", element: _jsx(Terms, {}) }), _jsx(Route, { path: "/book-class", element: _jsx(BookClass, {}) }), _jsx(Route, { path: "/contact", element: _jsx(Contact, {}) }), _jsx(Route, { path: "/learning", element: _jsx(Learning, {}) }), _jsx(Route, { path: "/learning/:id", element: _jsx(ArticleView, {}) }), _jsx(Route, { path: "/articles/new", element: _jsx(NewArticlePage, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: "/update-password", element: _jsx(UpdatePassword, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/instructor/:instructorId", element: _jsx(InstructorProfile, {}) }), _jsx(Route, { path: "/bookings/:bookingId/cancel", element: _jsx(CancelBookingPage, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) }), _jsx(Route, { path: "/book/individual", element: _jsx(BookOneOnOne, {}) }), _jsx(Route, { path: "/book/corporate", element: _jsx(BookCorporate, {}) }), _jsx(Route, { path: "/achievements", element: _jsx(Achievements, {}) }), _jsx(Route, { path: "/auth/callback", element: _jsx(AuthCallback, {}) }), _jsx(Route, { path: "/unsubscribe", element: _jsx(Unsubscribe, {}) })] }) }), _jsx(Footer, {})] }) })] }));
}
export default App;
