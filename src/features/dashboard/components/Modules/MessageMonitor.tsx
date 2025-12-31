import { useEffect, useState } from 'react'
import { supabase, SUPABASE_URL } from '../../../../shared/lib/supabase'

type MessageAuditRow = {
    id: string
    channel: string
    recipient: string
    provider: string
    provider_message_id: string | null
    status: string | null
    attempts: number | null
    metadata: any
    created_at: string
    delivered_at?: string | null
}

type OtpRow = {
    id: string
    phone: string
    created_at: string
    expires_at: string
    used: boolean
}

export default function MessageMonitor() {
    const [rows, setRows] = useState<MessageAuditRow[]>([])
    const [otps, setOtps] = useState<Record<string, OtpRow | null>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [channel, setChannel] = useState<string>('')
    const [status, setStatus] = useState<string>('')
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')
    const [limit, setLimit] = useState<number>(200)

    // initial load handled by filter effect below

    // reload when filters change
    useEffect(() => {
        // simply re-run the loader effect by calling supabase again
        let mounted = true
        async function refresh() {
            setLoading(true)
            setError(null)
            try {
                // call secure edge function which uses service role key server-side
                const params = new URLSearchParams()
                if (search) params.set('search', search)
                if (channel) params.set('channel', channel)
                if (status) params.set('status', status)
                if (dateFrom) params.set('dateFrom', dateFrom)
                if (dateTo) params.set('dateTo', dateTo)
                params.set('limit', String(limit))

                // get current session access token
                const { data: sessionData } = await supabase.auth.getSession()
                const token = sessionData?.session?.access_token || ''
                const fnUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/admin-message-monitor?${params.toString()}`
                const fnRes = await fetch(fnUrl, { headers: { Authorization: `Bearer ${token}` } })
                if (!fnRes.ok) {
                    const txt = await fnRes.text().catch(() => '')
                    throw new Error(`function_error: ${fnRes.status} ${txt}`)
                }
                const json = await fnRes.json()
                if (!mounted) return
                setRows((json.rows || []) as MessageAuditRow[])
                const otpData = json.otps || []
                const map: Record<string, OtpRow | null> = {};
                (otpData || []).forEach((o: any) => { if (!map[o.phone]) map[o.phone] = o })
                if (mounted) setOtps(map)
            } catch (e: any) {
                setError(e.message || String(e))
            } finally {
                if (mounted) setLoading(false)
            }
        }
        refresh()
        return () => { mounted = false }
    }, [search, channel, status, dateFrom, dateTo, limit])

    // CSV export
    function exportCsv() {
        const cols = ['channel', 'recipient', 'provider', 'provider_message_id', 'status', 'attempts', 'created_at', 'delivered_at']
        const csv = [cols.join(',')]
        rows.forEach(r => {
            const line = cols.map(c => {
                const v = (r as any)[c]
                if (v === null || v === undefined) return ''
                // escape quotes
                return `"${String(v).replace(/"/g, '""')}"`
            }).join(',')
            csv.push(line)
        })
        const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `message_audit_${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Message Monitoring</h2>
            <p className="text-sm text-gray-600 mb-4">Shows recent WhatsApp and Email sends. Accessible to super_admin only.</p>
            {error && <div className="text-red-600">Error: {error}</div>}
            {loading && <div>Loading...</div>}

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                    <input aria-label="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipient or provider_msg_id" className="border rounded p-2 w-full" />
                </div>
                <div className="flex items-center gap-2">
                    <select value={channel} onChange={e => setChannel(e.target.value)} className="border rounded p-2 w-full">
                        <option value="">All channels</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded p-2 w-full">
                        <option value="">Any status</option>
                        <option value="sent">sent</option>
                        <option value="delivered">delivered</option>
                        <option value="read">read</option>
                        <option value="failed">failed</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm mr-2">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded p-2" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm mr-2">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded p-2" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm">Limit</label>
                    <select value={String(limit)} onChange={e => setLimit(Number(e.target.value))} className="border rounded p-2">
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                    </select>
                </div>
            </div>

            <div className="mb-4 flex gap-2">
                <button onClick={() => { setSearch(''); setChannel(''); setStatus(''); setDateFrom(''); setDateTo(''); }} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
                <button onClick={exportCsv} className="px-3 py-2 bg-blue-600 text-white rounded">Export CSV</button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="p-2">Channel</th>
                            <th className="p-2">Recipient</th>
                            <th className="p-2">Provider</th>
                            <th className="p-2">Provider Msg ID</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Attempts</th>
                            <th className="p-2">Sent At</th>
                            <th className="p-2">Delivered At</th>
                            <th className="p-2">Latest OTP (if any)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.id} className="border-t">
                                <td className="p-2 align-top">{r.channel}</td>
                                <td className="p-2 align-top">{r.recipient}</td>
                                <td className="p-2 align-top">{r.provider}</td>
                                <td className="p-2 align-top break-words max-w-xs">{r.provider_message_id || '-'}</td>
                                <td className="p-2 align-top">{r.status || '-'}</td>
                                <td className="p-2 align-top">{r.attempts ?? 0}</td>
                                <td className="p-2 align-top">{new Date(r.created_at).toLocaleString()}</td>
                                <td className="p-2 align-top">{r.delivered_at ? new Date(r.delivered_at).toLocaleString() : '-'}</td>
                                <td className="p-2 align-top">
                                    {otps[r.recipient] ? (
                                        <div>
                                            <div className="text-sm">ID: {otps[r.recipient]?.id}</div>
                                            <div className="text-xs text-gray-600">Created: {new Date(otps[r.recipient]!.created_at).toLocaleString()}</div>
                                            <div className="text-xs text-gray-600">Used: {String(otps[r.recipient]!.used)}</div>
                                        </div>
                                    ) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
