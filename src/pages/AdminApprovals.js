import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL } from '../shared/lib/supabase';
export default function AdminApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            setError(null);
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) {
                setError('No admin session');
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${SUPABASE_URL}/functions/v1/list-requests`, {
                    method: 'GET',
                    headers: { authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const txt = await res.text();
                    setError(txt);
                    setRequests([]);
                    setLoading(false);
                    return;
                }
                const body = await res.json();
                setRequests(body.data || []);
            }
            catch (err) {
                setError(String(err));
                setRequests([]);
            }
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
        const res = await fetch(`${SUPABASE_URL}/functions/v1/approve-developer`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId })
        });
        if (!res.ok) {
            const txt = await res.text();
            setError(txt);
            return;
        }
        // Refresh list via admin function using the same token
        if (token) {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/list-requests`, {
                method: 'GET',
                headers: { authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const body = await res.json();
                setRequests(body.data || []);
            }
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Admin Approvals" }), loading && _jsx("p", { children: "Loading\u2026" }), error && _jsx("p", { style: { color: 'red' }, children: error }), !loading && requests.length === 0 && _jsx("p", { children: "No pending requests." }), _jsx("ul", { style: { listStyle: 'none', padding: 0 }, children: requests.map((r) => (_jsxs("li", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }, children: [_jsx("span", { children: r.user_id }), _jsx("button", { onClick: () => approve(r.user_id), style: { padding: '6px 10px' }, children: "Approve" })] }, r.user_id))) })] }));
}
