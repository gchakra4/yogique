submit-request Edge Function

This function accepts an authenticated user's request to join the DevTools program and writes a `devtools_requests` row using the Supabase service-role key (bypassing RLS). It expects requests to include an `Authorization: Bearer <access_token>` header from the user's session.

Environment variables (set in Supabase dashboard or deployment):

- `ALLOWED_ORIGIN` - The origin allowed for CORS (e.g. https://dev.yogique.life)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role key (sensitive)

Usage:
- POST / (with `Authorization` and optional JSON body `{ "message": "Optional note" }`)

Notes:
- The function uses `upsert` with `onConflict: 'user_id'` for idempotency; if a row already exists it will be left as-is.
- Audit rows are appended to `approvals_log` with `action: 'requested'`.

Security:
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret and only set it in the Supabase Edge Function environment.
- `ALLOWED_ORIGIN` should be set to the specific DevTools domain(s) to avoid open CORS.
