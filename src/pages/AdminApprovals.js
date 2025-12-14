import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
export default function AdminApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('devtools_requests')
                .select('*')
                .eq('status', 'pending')
                .order('requested_at', { ascending: false });
            if (error)
                setError(error.message);
            setRequests(data || []);
            setLoading(false);
        };
        fetchRequests();
    }, []);
    const approve = async (userId) => {
        setError(null);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
            setError('No admin session');
            return;
        }
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-developer`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId })
        });
        if (!res.ok) {
            const txt = await res.text();
            setError(txt);
            return;
        }
        // Refresh list
        const { data } = await supabase
            .from('devtools_requests')
            .select('*')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        setRequests(data || []);
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Admin Approvals" }), loading && _jsx("p", { children: "Loading\u2026" }), error && _jsx("p", { style: { color: 'red' }, children: error }), !loading && requests.length === 0 && _jsx("p", { children: "No pending requests." }), _jsx("ul", { style: { listStyle: 'none', padding: 0 }, children: requests.map((r) => (_jsxs("li", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }, children: [_jsx("span", { children: r.user_id }), _jsx("button", { onClick: () => approve(r.user_id), style: { padding: '6px 10px' }, children: "Approve" })] }, r.user_id))) })] }));
}
