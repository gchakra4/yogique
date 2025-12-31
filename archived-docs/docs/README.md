# Database documentation

Purpose
- Central place for database schema, data dictionary, RLS, functions, and maintenance notes.

How to regenerate
- Run the extraction scripts described in this repo to refresh CSV/SQL artifacts (see `backups-and-restore.md`).
- Keep secrets out of this folder and commit only metadata (no keys, no dumps with production data).

Structure
- `schema.md`, `data-dictionary.md`, `relationships.md`, `indexes.md`, `extensions.md`
- `rls-policies.md`, `functions.md`, `migrations.md`, `backups-and-restore.md`
- `access-control.md`, `maintenance.md`
