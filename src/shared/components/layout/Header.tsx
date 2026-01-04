import { ChevronDown, ChevronUp, LayoutDashboard, LogOut, Menu, User, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth/contexts/AuthContext';
import { NotificationDropdown } from '../../../features/notifications/components/NotificationDropdown';
// ...existing imports...
import { supabase } from '../../../shared/lib/supabase';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
// use public Brand.png for the site logo (responsive text shown on >= sm)

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [phoneMissing, setPhoneMissing] = useState(false);
  // removed isDark usage - header now uses a single orange logo for both themes


    const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Yogique for You', href: '/book/private-group' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Schedule', href: '/schedule' },
    { name: 'Learning', href: '/learning' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch minimal profile info to determine whether to show phone-missing banner
  useEffect(() => {
    let mounted = true
    const checkProfile = async () => {
      if (!user) {
        if (mounted) setPhoneMissing(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        if (mounted) setPhoneMissing(!(data && data.phone))
      } catch (err) {
        console.error('Error checking profile phone:', err)
        if (mounted) setPhoneMissing(false)
      }
    }

    checkProfile()
    return () => { mounted = false }
  }, [user])


  const handleSignOut = () => {
    signOut();
    setIsDropdownOpen(false);
  };

  return (
    <header className="w-full bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-slate-700 backdrop-blur-sm py-2">
      {phoneMissing && (
        <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <div>
              <strong className="mr-2">As per our records, your phone number is missing.</strong>
              <span className="opacity-90">We do not spam — to receive class details and important reminders, please update your phone number with us.</span>
            </div>
            <div>
              <Link to="/profile" className="underline text-yellow-900 dark:text-yellow-100 font-medium">Update Profile</Link>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center">
          {/* Logo + Brand */}
          <Link
            to="/"
            className="flex items-center h-12 space-x-3 z-10 absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none"
          >
            <div className="flex items-center justify-center w-10 h-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/Brand.png" alt="Yogique Logo" className="h-10 w-auto object-contain" />
            </div>

            {/* Brand name + tagline: hidden on small screens */}
            <div className="hidden sm:flex flex-col leading-tight">
              <span
                className="text-xl font-bold text-gray-800 dark:text-white brand-samarkan"
                style={{ fontFamily: 'Samarkan, serif' }}
              >
                Yogique
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 tagline-cursive">yoga beyond asanas</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 ${isActive(item.href)
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1'
                  : 'text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <>
                {/* 🔔 Notification Bell - Enhanced styling */}
                <div className="relative">
                  <div className="p-2 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors duration-200 border border-blue-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 shadow-sm">
                    <NotificationDropdown />
                  </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 hover:shadow-sm leading-none"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <User size={22} className="text-white" />
                    </div>
                    {/* Removed full name and roles */}
                    {isDropdownOpen ? (
                      <ChevronUp size={16} className="text-gray-400 ml-2" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 ml-2" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-slate-600 backdrop-blur-sm">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <UserCircle size={16} className="mr-2" />
                        Profile
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <LayoutDashboard size={16} className="mr-2" />
                        Dashboard
                      </Link>



                      <hr className="my-1" />

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`font-medium transition-colors duration-200 ${isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t">
                {/* Theme Toggle for Mobile */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
                  <ThemeToggle />
                </div>

                {user ? (
                  <div className="space-y-3">
                    {/* 🔔 Mobile Notification Section - Enhanced */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Notifications</span>
                      <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700">
                        <NotificationDropdown />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <User size={22} className="text-white" />
                      </div>
                      <span className="text-sm font-medium">Account</span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2"
                    >
                      <UserCircle size={16} />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>


                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-1 w-full justify-center"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

