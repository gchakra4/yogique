import { useEffect, useState } from 'react'
import { supabase } from '../shared/lib/supabase'

export default function RequestAccess() {
    const [status, setStatus] = useState<'unknown' | 'approved' | 'pending' | 'none'>('unknown')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setError(null)
            const { data: sessionData } = await supabase.auth.getSession()
            const uid = sessionData.session?.user?.id
            if (!uid) {
                setError('Please sign in first.')
                setStatus('none')
                return
            }
            const { data: devs } = await supabase
                .from('devtools_developers')
                .select('user_id')
                .eq('user_id', uid)
                .limit(1)
            if (devs && devs.length > 0) {
                setStatus('approved')
                return
            }
            const { data: req } = await supabase
                .from('devtools_requests')
                .select('status')
                .eq('user_id', uid)
                .limit(1)
            if (req && req.length > 0 && (req[0] as any).status === 'pending') {
                setStatus('pending')
            } else {
                setStatus('none')
            }
        }
        load()
    }, [])

    const request = async () => {
        setError(null)
        const { data: sessionData } = await supabase.auth.getSession()
        const uid = sessionData.session?.user?.id
        if (!uid) { setError('No session'); return }

        try {
            // Use insert to avoid triggering update policies (upsert may perform UPDATE which is admin-only)
            const { error } = await supabase.from('devtools_requests').insert({ user_id: uid, status: 'pending' })
            if (error) {
                // Detect RLS failure and provide actionable message
                if (error.message && error.message.includes('row-level security')) {
                    setError('Request failed due to row-level security. Ensure you are signed in and your session is valid. If the problem persists, contact an admin.')
                } else if (error.code === '23505') {
                    // unique violation - request already exists
                    setStatus('pending')
                } else {
                    setError(error.message)
                }
                return
            }
            setStatus('pending')
        } catch (err: any) {
            console.error('Error requesting access:', err)
            setError(err?.message || String(err))
        }
    }

    return (
        <div>
            <h2>Request Access</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {status === 'approved' && <p>You are approved. Continue to tools.</p>}
            {status === 'pending' && <p>Your request is pending admin approval.</p>}
            {status === 'none' && <button onClick={request} style={{ padding: '6px 10px' }}>Request Access</button>}
        </div>
    )
}
