# DevTools 1-Click Approval Workflow (Supabase Edge Function)

## Overview
- Admin approves developers with one click. A Supabase Edge Function verifies admin JWT, restricts CORS to your DevTools domain, writes membership to `devtools_developers`, updates `devtools_requests`, and logs to `approvals_log`.

## Deploy Steps
1. Create tables and policies:
   - Apply migration: see `supabase/migrations/2025-12-13-approve-devtools.sql`.
2. Deploy the Edge Function:
   - Function path: `supabase/functions/approve-developer/index.ts`.
   - Set env vars in Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN=https://devtools.yogique.life`.
3. Allow your DevTools domain in Supabase Auth redirect URLs and CORS if applicable.

## Function API
- URL: `POST /functions/v1/approve-developer`
- Auth: Bearer token (Supabase JWT of admin)
- Body: `{ "user_id": "<uuid>" }`
- Response: `{ ok: true }` or `{ error, details }`

## UI Wiring (Minimal)
- Request Access: insert into `devtools_requests` with current `auth.uid()`.
- Admin Approvals page: list pending requests; on click, call the function with admin JWT.
- Guard pages: check membership `devtools_developers` for `auth.uid()`. If empty, redirect to Request Access.

## Security Notes
- Service role key is used only inside the Edge Function (never in the browser).
- Admin is determined via `app_metadata.role` or `user_metadata.role = 'admin'` in JWT.
- CORS is restricted to your DevTools domain.

## Example Client Call
```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

async function approve(userId: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('No session')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-developer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}
```

## Next Steps
- Add a simple admin page under your DevTools to list `devtools_requests` with Approve/Reject buttons.
- Optionally send Slack/email notifications from a separate function.
