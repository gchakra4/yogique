import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
export function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null);
    const [errors, setErrors] = useState({});
    const { signIn, signUp, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    // Prefer state.redirectTo, fallback to search param, then "/"
    const redirectTo = location.state?.redirectTo ||
        searchParams.get('redirect') ||
        '/';
    // Message from navigation state (e.g., "You need to sign in to start writing articles.")
    const message = location.state?.message;
    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(redirectTo);
        }
    }, [user, navigate, redirectTo]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim())
            newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = 'Email is invalid';
        if (!formData.password)
            newErrors.password = 'Password is required';
        else if (formData.password.length < 6)
            newErrors.password = 'Password must be at least 6 characters';
        if (isSignUp && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSocialSignIn = async (provider) => {
        setSocialLoading(provider);
        setErrors({});
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error)
                throw error;
            // Note: For OAuth, the redirect happens automatically
            // The user will be redirected to the OAuth provider's page
        }
        catch (error) {
            console.error(`${provider} sign-in error:`, error);
            setErrors({ general: error.message });
            setSocialLoading(null);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setLoading(true);
        try {
            if (isSignUp) {
                await signUp(formData.email, formData.password);
                // Get JWT for Authorization header
                const { data: sessionData } = await supabase.auth.getSession();
                const jwt = sessionData?.session?.access_token;
                // Specify role_id
                const role_id = 'user';
                // Get assigned_by (current admin user_id or 'system')
                const assigned_by = user?.id || 'system';
                // Get user_id from session
                const user_id = sessionData.session?.user?.id;
                if (user_id && jwt) {
                    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign_default_user_role`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${jwt}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id,
                            role_id,
                            assigned_by
                        })
                    });
                }
                alert('Account created successfully! Please check your email for verification.');
            }
            else {
                await signIn(formData.email, formData.password);
                navigate(redirectTo);
            }
        }
        catch (error) {
            setErrors({ general: error.message });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx(Link, { to: "/", className: "flex items-center justify-center space-x-2 mb-8", children: _jsx("img", { src: "/images/Brand.png", alt: "Yogique", className: "w-24 h-auto" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: isSignUp ? 'Create your account' : 'Sign in to your account' }), _jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-300", children: isSignUp ? 'Join our yoga community today' : 'Welcome back to your practice' }), message && (_jsx("div", { className: "mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg", children: _jsx("p", { className: "text-blue-800 dark:text-blue-200 text-sm", children: message }) })), !message && redirectTo !== '/' && (_jsx("div", { className: "mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg", children: _jsx("p", { className: "text-blue-800 dark:text-blue-200 text-sm", children: "Please sign in to continue booking your class" }) }))] }), _jsxs("div", { className: "card p-8", children: [_jsx("div", { className: "space-y-3 mb-6", children: _jsx(Button, { onClick: () => handleSocialSignIn('google'), loading: socialLoading === 'google', variant: "outline", className: "w-full flex items-center justify-center space-x-3 py-3 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800", children: socialLoading === 'google' ? (_jsx("span", { children: "Connecting..." })) : (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), _jsx("span", { children: "Continue with Google" })] })) }) }), _jsxs("div", { className: "relative mb-6", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300 dark:border-gray-600" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400", children: "Or continue with email" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`, placeholder: "Enter your email" })] }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" }), _jsx("input", { type: showPassword ? 'text' : 'password', id: "password", name: "password", value: formData.password, onChange: handleInputChange, className: `w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`, placeholder: "Enter your password" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400", children: showPassword ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] }), errors.password && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.password })] }), isSignUp && (_jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" }), _jsx("input", { type: showPassword ? 'text' : 'password', id: "confirmPassword", name: "confirmPassword", value: formData.confirmPassword, onChange: handleInputChange, className: `w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`, placeholder: "Confirm your password" })] }), errors.confirmPassword && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.confirmPassword })] })), _jsx(Button, { type: "submit", loading: loading, className: "w-full", children: loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In') })] }), _jsx("div", { className: "mt-4 text-center", children: _jsx(Link, { to: "/reset-password", className: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium", children: "Forgot Password?" }) }), _jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: [isSignUp ? 'Already have an account?' : "Don't have an account?", ' ', _jsx("button", { onClick: () => {
                                            setIsSignUp(!isSignUp);
                                            setErrors({});
                                            setFormData({ email: '', password: '', confirmPassword: '' });
                                        }, className: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium", children: isSignUp ? 'Sign in' : 'Sign up' })] }) })] }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/", className: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium", children: "\u2190 Back to Home" }) })] }) }));
}
