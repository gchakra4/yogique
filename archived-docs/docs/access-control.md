# Access control & secrets

Recommendations
- Never include service_role or DB superuser credentials in client builds (`VITE_*`).
- Store service_role/DB credentials in secret manager (GitHub Actions secrets, Netlify/Vercel env).
- Use least-privilege DB roles for application (create `app_user` with tailored grants).

Quick fixes
- Remove VITE_SUPABASE_SERVICE_ROLE_KEY from client `.env`.
- Add `.env` to `.gitignore`.
- Rotate keys if they were exposed.
