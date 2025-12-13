import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type RequestRow = {
  user_id: string
  status: 'pending' | 'approved' | 'denied'
  requested_at: string
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

export default function AdminApprovals() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('devtools_requests')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
      if (error) setError(error.message)
      setRequests(data || [])
      setLoading(false)
    }
    fetchRequests()
  }, [])

  const approve = async (userId: string) => {
    setError(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError('No admin session')
      return
    }
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-developer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId })
    })
    if (!res.ok) {
      const txt = await res.text()
      setError(txt)
      return
    }
    // Refresh list
    const { data } = await supabase
      .from('devtools_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
    setRequests(data || [])
  }

  return (
    <div>
      <h2>Admin Approvals</h2>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && requests.length === 0 && <p>No pending requests.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {requests.map((r) => (
          <li key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span>{r.user_id}</span>
            <button onClick={() => approve(r.user_id)} style={{ padding: '6px 10px' }}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
