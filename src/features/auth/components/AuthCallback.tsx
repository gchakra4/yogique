// Create this file: src/features/auth/components/AuthCallback.tsx

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase, SUPABASE_URL } from '../../../shared/lib/supabase'

export function AuthCallback() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the session from the URL hash
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Auth callback error:', error)
                    setError(error.message)
                    return
                }

                if (data.session) {
                    console.log('✅ Social auth successful:', data.session.user)

                    // Check if user has a profile, create one if not
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', data.session.user.id)
                        .maybeSingle()

                    if (profileError && profileError.code !== 'PGRST116') {
                        console.error('Error checking profile:', profileError)
                    }

                    // Create profile if it doesn't exist
                    if (!profile) {
                        const { error: createProfileError } = await supabase
                            .from('profiles')
                            .insert([
                                {
                                    user_id: data.session.user.id,
                                    email: data.session.user.email,
                                    full_name: data.session.user.user_metadata?.full_name ||
                                        data.session.user.user_metadata?.name ||
                                        data.session.user.email?.split('@')[0],
                                    avatar_url: data.session.user.user_metadata?.avatar_url ||
                                        data.session.user.user_metadata?.picture,
                                    is_active: true,
                                    profile_completed: false
                                }
                            ])

                        if (createProfileError) {
                            console.error('Error creating profile:', createProfileError)
                        } else {
                            console.log('✅ Profile created for social auth user')
                        }

                        // Assign default user role
                        try {
                            const jwt = data.session.access_token

                            await fetch(`${SUPABASE_URL}/functions/v1/assign_default_user_role`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${jwt}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    user_id: data.session.user.id,
                                    role_id: 'user',
                                    assigned_by: 'system'
                                })
                            })

                            console.log('✅ Default role assigned to social auth user')
                        } catch (roleError) {
                            console.error('Error assigning role:', roleError)
                        }
                    }

                    // Get redirect URL from search params
                    const redirectTo = searchParams.get('redirect') || '/'

                    // Small delay to ensure auth context updates
                    setTimeout(() => {
                        navigate(redirectTo, { replace: true })
                    }, 1000)

                } else {
                    setError('No session found. Please try signing in again.')
                }
            } catch (err: any) {
                console.error('Auth callback error:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        handleAuthCallback()
    }, [navigate, searchParams])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Completing sign in...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <h2 className="text-lg font-semibold text-red-900 mb-2">Sign In Failed</h2>
                        <p className="text-red-700 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}