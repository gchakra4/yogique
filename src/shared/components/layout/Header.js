import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronDown, ChevronUp, LayoutDashboard, LogOut, Menu, User, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth/contexts/AuthContext';
import { NotificationDropdown } from '../../../features/notifications/components/NotificationDropdown';
// ...existing imports...
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import logoOrange from '/images/Brand-orange.png';
export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, signOut } = useAuth();
    const location = useLocation();
    const dropdownRef = useRef(null);
    // removed isDark usage - header now uses a single orange logo for both themes
    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Yogique for You', href: '/yogique-for-you' },
        { name: 'Schedule', href: '/schedule' },
        { name: 'Learning', href: '/learning' },
        { name: 'Contact', href: '/contact' },
    ];
    const isActive = (path) => location.pathname === path;
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const handleSignOut = () => {
        signOut();
        setIsDropdownOpen(false);
    };
    return (_jsx("header", { className: "w-full bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-slate-700 backdrop-blur-sm py-2", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx(Link, { to: "/", className: "flex items-center h-12", children: _jsx("div", { className: "w-12 h-12 sm:w-12 sm:h-12 overflow-visible rounded-full flex items-center justify-center relative", children: _jsx("img", { src: logoOrange, alt: "Yogique Logo", className: "logo-zoom w-auto object-contain block", style: { height: '40px', width: '40px' } }) }) }), _jsx("nav", { className: "hidden lg:flex space-x-8", children: navigation.map((item) => (_jsx(Link, { to: item.href, className: `font-medium transition-colors duration-200 ${isActive(item.href)
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1'
                                    : 'text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`, children: item.name }, item.name))) }), _jsxs("div", { className: "hidden lg:flex items-center space-x-4", children: [_jsx(ThemeToggle, {}), user ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "relative", children: _jsx("div", { className: "p-2 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors duration-200 border border-blue-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 shadow-sm", children: _jsx(NotificationDropdown, {}) }) }), _jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setIsDropdownOpen(!isDropdownOpen), className: "flex items-center text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 hover:shadow-sm leading-none", children: [_jsx("div", { className: "w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center", children: _jsx(User, { size: 22, className: "text-white" }) }), isDropdownOpen ? (_jsx(ChevronUp, { size: 16, className: "text-gray-400 ml-2" })) : (_jsx(ChevronDown, { size: 16, className: "text-gray-400 ml-2" }))] }), isDropdownOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-slate-600 backdrop-blur-sm", children: [_jsxs(Link, { to: "/profile", onClick: () => setIsDropdownOpen(false), className: "flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors", children: [_jsx(UserCircle, { size: 16, className: "mr-2" }), "Profile"] }), _jsxs(Link, { to: "/dashboard", onClick: () => setIsDropdownOpen(false), className: "flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors", children: [_jsx(LayoutDashboard, { size: 16, className: "mr-2" }), "Dashboard"] }), _jsx("hr", { className: "my-1" }), _jsxs("button", { onClick: handleSignOut, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors", children: [_jsx(LogOut, { size: 16, className: "mr-2" }), "Sign Out"] })] }))] })] })) : (_jsx(Link, { to: "/login", children: _jsx(Button, { variant: "outline", size: "sm", children: "Sign In" }) }))] }), _jsx("button", { className: "lg:hidden text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors", onClick: () => setIsMenuOpen(!isMenuOpen), children: isMenuOpen ? _jsx(X, { size: 24 }) : _jsx(Menu, { size: 24 }) })] }), isMenuOpen && (_jsx("div", { className: "lg:hidden py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900", children: _jsxs("nav", { className: "flex flex-col space-y-4", children: [navigation.map((item) => (_jsx(Link, { to: item.href, className: `font-medium transition-colors duration-200 ${isActive(item.href)
                                    ? 'text-blue-600'
                                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600'}`, onClick: () => setIsMenuOpen(false), children: item.name }, item.name))), _jsxs("div", { className: "pt-4 border-t", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-3", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-200", children: "Theme" }), _jsx(ThemeToggle, {})] }), user ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-200", children: "Notifications" }), _jsx("div", { className: "p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700", children: _jsx(NotificationDropdown, {}) })] }), _jsxs("div", { className: "flex items-center space-x-3 text-gray-700 dark:text-gray-200 mb-3", children: [_jsx("div", { className: "w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center", children: _jsx(User, { size: 22, className: "text-white" }) }), _jsx("span", { className: "text-sm font-medium", children: "Account" })] }), _jsxs(Link, { to: "/profile", onClick: () => setIsMenuOpen(false), className: "flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2", children: [_jsx(UserCircle, { size: 16 }), _jsx("span", { children: "Profile" })] }), _jsxs(Link, { to: "/dashboard", onClick: () => setIsMenuOpen(false), className: "flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2", children: [_jsx(LayoutDashboard, { size: 16 }), _jsx("span", { children: "Dashboard" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                    signOut();
                                                    setIsMenuOpen(false);
                                                }, className: "flex items-center space-x-1 w-full justify-center", children: [_jsx(LogOut, { size: 16 }), _jsx("span", { children: "Sign Out" })] })] })) : (_jsx(Link, { to: "/login", onClick: () => setIsMenuOpen(false), children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full", children: "Sign In" }) }))] })] }) }))] }) }));
}
