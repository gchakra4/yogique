import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
export default function RequestAccess() {
    const [status, setStatus] = useState('unknown');
    const [error, setError] = useState(null);
    useEffect(() => {
        const load = async () => {
            setError(null);
            const { data: sessionData } = await supabase.auth.getSession();
            const uid = sessionData.session?.user?.id;
            if (!uid) {
                setError('Please sign in first.');
                setStatus('none');
                return;
            }
            const { data: devs } = await supabase
                .from('devtools_developers')
                .select('user_id')
                .eq('user_id', uid)
                .limit(1);
            if (devs && devs.length > 0) {
                setStatus('approved');
                return;
            }
            const { data: req } = await supabase
                .from('devtools_requests')
                .select('status')
                .eq('user_id', uid)
                .limit(1);
            if (req && req.length > 0 && req[0].status === 'pending') {
                setStatus('pending');
            }
            else {
                setStatus('none');
            }
        };
        load();
    }, []);
    const request = async () => {
        setError(null);
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (!uid) {
            setError('No session');
            return;
        }
        const { error } = await supabase.from('devtools_requests').upsert({ user_id: uid, status: 'pending' });
        if (error)
            setError(error.message);
        else
            setStatus('pending');
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Request Access" }), error && _jsx("p", { style: { color: 'red' }, children: error }), status === 'approved' && _jsx("p", { children: "You are approved. Continue to tools." }), status === 'pending' && _jsx("p", { children: "Your request is pending admin approval." }), status === 'none' && _jsx("button", { onClick: request, style: { padding: '6px 10px' }, children: "Request Access" })] }));
}
