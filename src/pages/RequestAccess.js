import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import submitRequest from '../services/submitRequest';
import { supabase } from '../shared/lib/supabase';
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
        try {
            await submitRequest({ message: 'Requested via UI' });
            setStatus('pending');
        }
        catch (err) {
            console.error('Error requesting access:', err);
            // Surface friendly RLS hint if present
            const msg = err?.message || String(err);
            if (msg.includes('row-level security')) {
                setError('Request failed due to row-level security. The client cannot write directly; ensure the submit-request function is deployed and its URL is configured.');
            }
            else {
                setError(msg);
            }
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Request Access" }), error && _jsx("p", { style: { color: 'red' }, children: error }), status === 'approved' && _jsx("p", { children: "You are approved. Continue to tools." }), status === 'pending' && _jsx("p", { children: "Your request is pending admin approval." }), status === 'none' && _jsx("button", { onClick: request, style: { padding: '6px 10px' }, children: "Request Access" })] }));
}
