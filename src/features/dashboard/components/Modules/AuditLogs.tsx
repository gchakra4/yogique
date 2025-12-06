import { useEffect, useState } from 'react'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../../shared/lib/supabase'
import { useAuth } from '../../../auth/contexts/AuthContext'

interface AuditLogRow {
    id: string
    event_type: string
    entity_type: string | null
    entity_id: string | null
    action: string | null
    actor_id: string | null
    actor_role: string | null
    metadata: any
    created_at: string
}

export default function AuditLogs() {
    const { isAdmin } = useAuth()
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<AuditLogRow[]>([])
    const [eventType, setEventType] = useState('')
    const [entityType, setEntityType] = useState('')
    const [actorId, setActorId] = useState('')
    const [search, setSearch] = useState('')
    const [startDate, setStartDate] = useState<string | null>(null)
    const [endDate, setEndDate] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const limit = 25
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (!isAdmin) return
        fetchLogs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, page])

    // Removed unused buildFilter to satisfy TS6133

    const fetchLogs = async () => {
        if (!isAdmin) return
        setLoading(true)
        try {
            const offset = page * limit
            // base select
            let query = supabase
                .from('audit_logs')
                .select('id,event_type,entity_type,entity_id,action,actor_id,actor_role,metadata,created_at')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            if (eventType) query = query.eq('event_type', eventType)
            if (entityType) query = query.eq('entity_type', entityType)
            if (actorId) query = query.eq('actor_id', actorId)
            if (startDate) query = query.gte('created_at', startDate)
            if (endDate) query = query.lte('created_at', endDate)

            const { data, error } = await query

            if (error) throw error
            setLogs((data || []) as AuditLogRow[])
        } catch (err) {
            console.error('Error fetching audit logs', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        setPage(0)
        if (!isAdmin) return
        setLoading(true)
        try {
            // For flexible metadata searching we'll fetch a larger set and filter client-side
            const maxFetch = 1000
            let q = supabase
                .from('audit_logs')
                .select('id,event_type,entity_type,entity_id,action,actor_id,actor_role,metadata,created_at')
                .order('created_at', { ascending: false })
                .range(0, Math.min(maxFetch - 1, 5000))

            if (eventType) q = q.eq('event_type', eventType)
            if (entityType) q = q.eq('entity_type', entityType)
            if (actorId) q = q.eq('actor_id', actorId)
            if (startDate) q = q.gte('created_at', startDate)
            if (endDate) q = q.lte('created_at', endDate)

            const { data, error } = await q
            if (error) throw error

            let items = (data || []) as AuditLogRow[]
            if (search) {
                const term = search.toLowerCase()
                items = items.filter(i => {
                    const entityMatch = (i.entity_id || '').toLowerCase().includes(term)
                    const metaStr = JSON.stringify(i.metadata || {})
                    const metaMatch = metaStr.toLowerCase().includes(term)
                    return entityMatch || metaMatch
                })
            }

            setLogs(items.slice(0, limit))
        } catch (err) {
            console.error('Search error', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const exportSelectedCsv = () => {
        const selected = logs.filter(l => selectedIds[l.id])
        if (selected.length === 0) return alert('No rows selected')
        const headers = ['created_at', 'event_type', 'entity_type', 'entity_id', 'action', 'actor_id', 'actor_role', 'metadata']
        const rows = selected.map(r => [
            r.created_at,
            r.event_type,
            r.entity_type || '',
            r.entity_id || '',
            r.action || '',
            r.actor_id || '',
            r.actor_role || '',
            JSON.stringify(r.metadata || {})
        ])
        const csv = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit_logs_export_${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    const renderMetadataPretty = (metadata: any) => {
        if (!metadata) return <div className="text-xs text-gray-600">-</div>
        if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata) } catch (e) { return <pre className="whitespace-pre-wrap text-xs">{metadata}</pre> }
        }
        if (typeof metadata === 'object') {
            return (
                <div className="text-xs text-gray-700">
                    {Object.entries(metadata).map(([k, v]) => (
                        <div key={k} className="mb-1">
                            <strong className="text-gray-800">{k}:</strong>{' '}
                            {k.toLowerCase() === 'reason' ? <mark className="bg-yellow-100">{String(v)}</mark> : <span>{String(v)}</span>}
                        </div>
                    ))}
                </div>
            )
        }
        return <pre className="whitespace-pre-wrap text-xs">{String(metadata)}</pre>
    }

    if (!isAdmin) return <div className="p-6">You do not have access to view audit logs.</div>

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Audit Logs</h2>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="input" placeholder="Event type" value={eventType} onChange={(e) => setEventType(e.target.value)} />
                    <input className="input" placeholder="Entity type" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
                    <input className="input" placeholder="Actor ID" value={actorId} onChange={(e) => setActorId(e.target.value)} />
                    <div className="flex space-x-2">
                        <input className="input flex-1" placeholder="Search (entity_id / metadata)" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Button onClick={handleSearch}>Search</Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                        <label className="text-sm text-gray-600">Start date</label>
                        <input type="date" className="input mt-1" onChange={(e) => setStartDate(e.target.value || null)} />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">End date</label>
                        <input type="date" className="input mt-1" onChange={(e) => setEndDate(e.target.value || null)} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                    <div className="p-6 flex justify-center"><LoadingSpinner /></div>
                ) : (
                    <div>
                        <div className="p-3 flex items-center justify-between">
                            <div />
                            <div className="flex items-center space-x-2">
                                <Button onClick={exportSelectedCsv}>Export CSV</Button>
                            </div>
                        </div>
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="text-left">
                                    <th className="px-4 py-2"><input type="checkbox" onChange={(e) => {
                                        const checked = e.target.checked
                                        const newSel: Record<string, boolean> = {}
                                        logs.forEach(l => newSel[l.id] = checked)
                                        setSelectedIds(newSel)
                                    }} /></th>
                                    <th className="px-4 py-2">When</th>
                                    <th className="px-4 py-2">Event</th>
                                    <th className="px-4 py-2">Entity</th>
                                    <th className="px-4 py-2">Actor</th>
                                    <th className="px-4 py-2">Metadata</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="px-4 py-2"><input type="checkbox" checked={!!selectedIds[row.id]} onChange={() => toggleSelect(row.id)} /></td>
                                        <td className="px-4 py-2 text-sm">{new Date(row.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-sm">{row.event_type}</td>
                                        <td className="px-4 py-2 text-sm">{row.entity_type} / {row.entity_id}</td>
                                        <td className="px-4 py-2 text-sm">{row.actor_id} ({row.actor_role})</td>
                                        <td className="px-4 py-2 text-sm">
                                            {!expanded[row.id] ? (
                                                <div>
                                                    <div className="text-xs text-gray-700">{String(row.metadata && typeof row.metadata === 'object' ? JSON.stringify(row.metadata).slice(0, 200) : String(row.metadata)).replace(/\n/g, ' ')}{String(row.metadata).length > 200 ? '…' : ''}</div>
                                                    <button className="text-blue-600 text-xs mt-1" onClick={() => toggleExpand(row.id)}>Show more</button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-xs text-gray-700 mb-2">
                                                        {renderMetadataPretty(row.metadata)}
                                                    </div>
                                                    <button className="text-blue-600 text-xs mt-1" onClick={() => toggleExpand(row.id)}>Collapse</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-4">
                <div />
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Prev</Button>
                    <div className="text-sm">Page {page + 1}</div>
                    <Button onClick={() => setPage(page + 1)}>Next</Button>
                </div>
            </div>
        </div>
    )
}
