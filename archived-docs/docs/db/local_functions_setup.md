How to run Supabase Edge Functions locally (quick reference)
------------------------------------------------------------

Prereqs
- Supabase CLI installed and logged in.
- Project checked out locally (this repo).
- You have your SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY available (from Supabase project settings). Keep the service role key secret.

1) Set env vars in your terminal (PowerShell)
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="anon-key-here"
$env:SUPABASE_SERVICE_ROLE_KEY="service-role-key-here"
# then run
npx supabase functions serve

(Windows CMD)
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_ANON_KEY=anon-key-here
set SUPABASE_SERVICE_ROLE_KEY=service-role-key-here
npx supabase functions serve

(Mac / Linux)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="anon-key-here"
export SUPABASE_SERVICE_ROLE_KEY="service-role-key-here"
npx supabase functions serve

Notes:
- `npx supabase functions serve` serves the functions under supabase/functions/ locally (it detects each function folder).
- If you prefer to serve one function: `npx supabase functions serve <function-name>`
- The CLI will bundle TypeScript/JS functions and run Deno for you.

2) Test endpoints locally
- GET search-users:
curl "http://localhost:54321/functions/v1/search-users?q=alice&limit=5" -H "apikey: <anon-key>"

- POST record-transaction (example)
curl -X POST "http://localhost:54321/functions/v1/record-transaction" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <user-jwt-if-calling-as-authenticated-user>" \
  -d '{"user_id": null, "user_email": "alice@example.com", "user_full_name": "Alice Example", "amount": 100, "currency":"INR", "status":"completed"}'

- POST create-user (admin-only: must present Authorization Bearer <admin-jwt>)
curl -X POST "http://localhost:54321/functions/v1/create-user" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <admin-user-jwt>" \
  -d '{"email":"newuser@example.com","full_name":"New User"}'

3) When functions need the service role key
- record-transaction and search-users use SUPABASE_SERVICE_ROLE_KEY to read auth.users or write to protected tables. Ensure you exported SUPABASE_SERVICE_ROLE_KEY in the same terminal before `supabase functions serve`.

4) Debugging and logs
- The serve command prints logs to STDOUT. Fixes to functions are picked up when you restart the serve command.
- For more verbose output, run the CLI with --debug.

5) Integrating with the frontend (local dev)
- When running dev frontend (e.g. Vite), ensure environment var VITE_SUPABASE_URL points to your remote project URL (so auth works) while function calls use the local functions URL:
  - In dev, `import.meta.env.VITE_SUPABASE_URL` is still the Supabase project URL; `fetch` to `/functions/v1/...` will be proxied by the CLI when you run `supabase start` + `supabase functions serve` OR you can call local functions directly to localhost:54321 as shown above.
- Update FRONTEND calls to use:
  - Local: http://localhost:54321/functions/v1/<name>
  - Remote: https://<project>.supabase.co/functions/v1/<name>

6) Security reminder
- Never check-in service role key. Use local env only for development.
- For admin-only endpoints (create-user), call them with an admin-authorized JWT (a user that has required roles) or test using the Supabase Dashboard.

Quick troubleshooting
- If functions fail due to missing env keys, confirm the keys are set in the same shell session.
- If you see CORS issues in browser: use the local function URL directly (localhost) or ensure the CLI serve prints Access-Control-Allow-* headers (functions in this repo already set CORS).

Useful commands
- Serve all functions: npx supabase functions serve
- Serve single function: npx supabase functions serve record-transaction
- Deploy to cloud: npx supabase functions deploy <name>
