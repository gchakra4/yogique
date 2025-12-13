import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isApprovedDeveloper } from '../../utils/authGuard'

type Props = { children: React.ReactNode }

export default function ApprovedRoute({ children }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const ok = await isApprovedDeveloper()
      if (mounted) setAllowed(ok)
    })()
    return () => { mounted = false }
  }, [])

  if (allowed === null) return <div className="p-4">Checking access…</div>
  if (!allowed) return <Navigate to="/request-access" replace />
  return <>{children}</>
}
