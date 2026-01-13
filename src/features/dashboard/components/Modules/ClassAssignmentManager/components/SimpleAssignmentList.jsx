import { useEffect, useState } from 'react'
import { supabase } from '../../../../../../shared/lib/supabase'

export function SimpleAssignmentList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSimple = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('class_assignments')
        .select('*')
        .order('assigned_at', { ascending: false })
        .limit(100)
      if (error) throw error
      console.log('SimpleAssignmentList fetched:', data?.length || 0, 'assignments');
      if (data?.length > 0) {
        console.log('First simple assignment:', data[0]);
      }
      setRows(data || [])
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSimple() }, [])

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">Loading assignments…</div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-600 mb-3">Failed to load: {error}</div>
        <button onClick={fetchSimple} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white">Retry</button>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="p-6 text-sm text-gray-600">No assignments found.</div>
    )
  }

  const fmt = (v) => v ?? '—'
  const fmtAmt = (v) => {
    const n = (typeof v === 'number') ? v : Number.parseFloat(v)
    return Number.isFinite(n) ? n.toFixed(2) : '—'
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Assignments (simple view)</h3>
        <button onClick={fetchSimple} className="px-3 py-1.5 text-sm rounded border bg-white hover:bg-gray-50">Refresh</button>
      </div>
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Schedule</th>
              <th className="px-3 py-2 text-left">Instructor</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">{fmt(r.date)}</td>
                <td className="px-3 py-2">{fmt(r.start_time)}{r.end_time ? ` - ${r.end_time}` : ''}</td>
                <td className="px-3 py-2">{fmt(r.schedule_type)}</td>
                <td className="px-3 py-2">{fmt(r.instructor_id)}</td>
                <td className="px-3 py-2">{fmt(r.class_status)}</td>
                <td className="px-3 py-2 max-w-[360px] truncate" title={r.notes || ''}>{fmt(r.notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SimpleAssignmentList
