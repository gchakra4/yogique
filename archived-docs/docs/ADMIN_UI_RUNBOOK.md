# Admin UI Runbook (Template Mappings)

Overview: the Superuser admin UI allows mapping application `activity` keys to `wa_template` entries stored in Postgres.

1) API flow
- Frontend calls `/functions/v1/admin-proxy` with the user's Supabase `Authorization: Bearer <access_token>` header.
- `admin-proxy` validates the user via `/auth/v1/user`, checks `user_roles` for `admin`/`super_admin`, then proxies to `admin-template-mappings` using `SUPERUSER_API_TOKEN`.

2) Secrets
- `SUPERUSER_API_TOKEN` (Supabase secret) — already set in the project.
- For local development, `secrets/dev.env` contains `SUPERUSER_API_TOKEN` for parity; real sessions are used in the browser.

3) Deploy & test
- Deploy `admin-proxy` and `admin-template-mappings` functions.
- Login as an admin user in dev, open `/dashboard/template_mappings`, confirm CRUD works and database rows are updated in `activity_template_mappings`.

4) Troubleshooting
- 401 from proxy: ensure correct Authorization header (browser must have a valid Supabase session cookie or token).
- 403 from proxy: user lacks `admin`/`super_admin` role; inspect `user_roles` table.
- Database errors: confirm `SUPABASE_SERVICE_ROLE_KEY` has privileges and REST calls include `apikey`/Authorization headers.
