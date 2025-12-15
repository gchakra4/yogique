import { supabase } from '../shared/lib/supabase';
export default async function submitRequest(opts = {}) {
    const runtime = typeof window !== 'undefined' ? window.DEVTOOLS_CONFIG || {} : {};
    const funcUrl = runtime.SUBMIT_REQUEST_URL || import.meta.env.VITE_SUBMIT_REQUEST_URL;
    // Try to use the Edge Function if configured
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const userId = session?.user?.id;
        if (funcUrl && token) {
            const res = await fetch(funcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: opts.message }),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) {
                const errMsg = body?.error || body?.details || `Function returned ${res.status}`;
                throw new Error(errMsg);
            }
            return { ok: true };
        }
        // Fallback: write directly (requires client RLS to allow insert)
        if (!userId)
            throw new Error('No authenticated user');
        const { error } = await supabase.from('devtools_requests').insert({ user_id: userId, status: 'pending' });
        if (error)
            throw error;
        return { ok: true };
    }
    catch (err) {
        throw err;
    }
}
