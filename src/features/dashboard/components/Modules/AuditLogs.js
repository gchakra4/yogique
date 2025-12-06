import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
import { useAuth } from '../../../auth/contexts/AuthContext';
export default function AuditLogs() {
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [eventType, setEventType] = useState('');
    const [entityType, setEntityType] = useState('');
    const [actorId, setActorId] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [page, setPage] = useState(0);
    const limit = 25;
    const [selectedIds, setSelectedIds] = useState({});
    const [expanded, setExpanded] = useState({});
    useEffect(() => {
        if (!isAdmin)
            return;
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, page]);
    // Removed unused buildFilter to satisfy TS6133
    const fetchLogs = async () => {
        if (!isAdmin)
            return;
        setLoading(true);
        try {
            const offset = page * limit;
            // base select
            let query = supabase
                .from('audit_logs')
                .select('id,event_type,entity_type,entity_id,action,actor_id,actor_role,metadata,created_at')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (eventType)
                query = query.eq('event_type', eventType);
            if (entityType)
                query = query.eq('entity_type', entityType);
            if (actorId)
                query = query.eq('actor_id', actorId);
            if (startDate)
                query = query.gte('created_at', startDate);
            if (endDate)
                query = query.lte('created_at', endDate);
            const { data, error } = await query;
            if (error)
                throw error;
            setLogs((data || []));
        }
        catch (err) {
            console.error('Error fetching audit logs', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSearch = async () => {
        setPage(0);
        if (!isAdmin)
            return;
        setLoading(true);
        try {
            // For flexible metadata searching we'll fetch a larger set and filter client-side
            const maxFetch = 1000;
            let q = supabase
                .from('audit_logs')
                .select('id,event_type,entity_type,entity_id,action,actor_id,actor_role,metadata,created_at')
                .order('created_at', { ascending: false })
                .range(0, Math.min(maxFetch - 1, 5000));
            if (eventType)
                q = q.eq('event_type', eventType);
            if (entityType)
                q = q.eq('entity_type', entityType);
            if (actorId)
                q = q.eq('actor_id', actorId);
            if (startDate)
                q = q.gte('created_at', startDate);
            if (endDate)
                q = q.lte('created_at', endDate);
            const { data, error } = await q;
            if (error)
                throw error;
            let items = (data || []);
            if (search) {
                const term = search.toLowerCase();
                items = items.filter(i => {
                    const entityMatch = (i.entity_id || '').toLowerCase().includes(term);
                    const metaStr = JSON.stringify(i.metadata || {});
                    const metaMatch = metaStr.toLowerCase().includes(term);
                    return entityMatch || metaMatch;
                });
            }
            setLogs(items.slice(0, limit));
        }
        catch (err) {
            console.error('Search error', err);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleSelect = (id) => {
        setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const exportSelectedCsv = () => {
        const selected = logs.filter(l => selectedIds[l.id]);
        if (selected.length === 0)
            return alert('No rows selected');
        const headers = ['created_at', 'event_type', 'entity_type', 'entity_id', 'action', 'actor_id', 'actor_role', 'metadata'];
        const rows = selected.map(r => [
            r.created_at,
            r.event_type,
            r.entity_type || '',
            r.entity_id || '',
            r.action || '',
            r.actor_id || '',
            r.actor_role || '',
            JSON.stringify(r.metadata || {})
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_export_${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    const renderMetadataPretty = (metadata) => {
        if (!metadata)
            return _jsx("div", { className: "text-xs text-gray-600", children: "-" });
        if (typeof metadata === 'string') {
            try {
                metadata = JSON.parse(metadata);
            }
            catch (e) {
                return _jsx("pre", { className: "whitespace-pre-wrap text-xs", children: metadata });
            }
        }
        if (typeof metadata === 'object') {
            return (_jsx("div", { className: "text-xs text-gray-700", children: Object.entries(metadata).map(([k, v]) => (_jsxs("div", { className: "mb-1", children: [_jsxs("strong", { className: "text-gray-800", children: [k, ":"] }), ' ', k.toLowerCase() === 'reason' ? _jsx("mark", { className: "bg-yellow-100", children: String(v) }) : _jsx("span", { children: String(v) })] }, k))) }));
        }
        return _jsx("pre", { className: "whitespace-pre-wrap text-xs", children: String(metadata) });
    };
    if (!isAdmin)
        return _jsx("div", { className: "p-6", children: "You do not have access to view audit logs." });
    return (_jsxs("div", { className: "p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("h2", { className: "text-xl font-semibold", children: "Audit Logs" }) }), _jsxs("div", { className: "bg-white rounded-lg p-4 shadow-sm mb-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsx("input", { className: "input", placeholder: "Event type", value: eventType, onChange: (e) => setEventType(e.target.value) }), _jsx("input", { className: "input", placeholder: "Entity type", value: entityType, onChange: (e) => setEntityType(e.target.value) }), _jsx("input", { className: "input", placeholder: "Actor ID", value: actorId, onChange: (e) => setActorId(e.target.value) }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { className: "input flex-1", placeholder: "Search (entity_id / metadata)", value: search, onChange: (e) => setSearch(e.target.value) }), _jsx(Button, { onClick: handleSearch, children: "Search" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mt-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600", children: "Start date" }), _jsx("input", { type: "date", className: "input mt-1", onChange: (e) => setStartDate(e.target.value || null) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600", children: "End date" }), _jsx("input", { type: "date", className: "input mt-1", onChange: (e) => setEndDate(e.target.value || null) })] })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-x-auto", children: loading ? (_jsx("div", { className: "p-6 flex justify-center", children: _jsx(LoadingSpinner, {}) })) : (_jsxs("div", { children: [_jsxs("div", { className: "p-3 flex items-center justify-between", children: [_jsx("div", {}), _jsx("div", { className: "flex items-center space-x-2", children: _jsx(Button, { onClick: exportSelectedCsv, children: "Export CSV" }) })] }), _jsxs("table", { className: "min-w-full table-auto", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "px-4 py-2", children: _jsx("input", { type: "checkbox", onChange: (e) => {
                                                        const checked = e.target.checked;
                                                        const newSel = {};
                                                        logs.forEach(l => newSel[l.id] = checked);
                                                        setSelectedIds(newSel);
                                                    } }) }), _jsx("th", { className: "px-4 py-2", children: "When" }), _jsx("th", { className: "px-4 py-2", children: "Event" }), _jsx("th", { className: "px-4 py-2", children: "Entity" }), _jsx("th", { className: "px-4 py-2", children: "Actor" }), _jsx("th", { className: "px-4 py-2", children: "Metadata" })] }) }), _jsx("tbody", { children: logs.map((row) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "px-4 py-2", children: _jsx("input", { type: "checkbox", checked: !!selectedIds[row.id], onChange: () => toggleSelect(row.id) }) }), _jsx("td", { className: "px-4 py-2 text-sm", children: new Date(row.created_at).toLocaleString() }), _jsx("td", { className: "px-4 py-2 text-sm", children: row.event_type }), _jsxs("td", { className: "px-4 py-2 text-sm", children: [row.entity_type, " / ", row.entity_id] }), _jsxs("td", { className: "px-4 py-2 text-sm", children: [row.actor_id, " (", row.actor_role, ")"] }), _jsx("td", { className: "px-4 py-2 text-sm", children: !expanded[row.id] ? (_jsxs("div", { children: [_jsxs("div", { className: "text-xs text-gray-700", children: [String(row.metadata && typeof row.metadata === 'object' ? JSON.stringify(row.metadata).slice(0, 200) : String(row.metadata)).replace(/\n/g, ' '), String(row.metadata).length > 200 ? '…' : ''] }), _jsx("button", { className: "text-blue-600 text-xs mt-1", onClick: () => toggleExpand(row.id), children: "Show more" })] })) : (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-700 mb-2", children: renderMetadataPretty(row.metadata) }), _jsx("button", { className: "text-blue-600 text-xs mt-1", onClick: () => toggleExpand(row.id), children: "Collapse" })] })) })] }, row.id))) })] })] })) }), _jsxs("div", { className: "flex items-center justify-between mt-4", children: [_jsx("div", {}), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { onClick: () => setPage(Math.max(0, page - 1)), disabled: page === 0, children: "Prev" }), _jsxs("div", { className: "text-sm", children: ["Page ", page + 1] }), _jsx(Button, { onClick: () => setPage(page + 1), children: "Next" })] })] })] }));
}
