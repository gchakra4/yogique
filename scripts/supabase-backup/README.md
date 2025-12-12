# Supabase Backup & Restore Tools

Complete toolset for creating full backups of a Supabase project and restoring to a new instance.

## What This Does

These scripts capture **everything** needed to recreate your Supabase project in another account:

- ✅ Database schema (tables, indexes, constraints, views)
- ✅ All table data
- ✅ RLS policies and security rules
- ✅ Postgres roles, extensions, triggers, functions
- ✅ Edge Functions (source code)
- ✅ Edge Function secrets
- ✅ Vault secrets
- ✅ Storage buckets and files
- ✅ Project configuration metadata

## Prerequisites

### Required Tools

1. **Supabase CLI** (v2.50+) - [Install Guide](https://supabase.com/docs/guides/cli/getting-started)
   ```bash
   # macOS/Linux
   brew install supabase/tap/supabase
   
   # Windows
   scoop install supabase
   ```

2. **PostgreSQL Client Tools** (pg_dump, pg_restore, psql, pg_dumpall)
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   apt-get install postgresql-client
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

3. **jq** (JSON processor)
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   apt-get install jq
   
   # Windows
   scoop install jq
   ```

4. **tar & gzip** (usually pre-installed on macOS/Linux, included in Git Bash on Windows)

### Optional Tools

- **rclone** - For syncing large storage buckets (recommended for 1GB+ storage)
- **gpg** - For encrypting backup archives
- **aws cli** - Alternative for S3-compatible storage sync

## Security Notes

🔒 **CRITICAL SECURITY WARNINGS:**

1. **NEVER commit `.env` files to version control**
2. **NEVER commit backup dumps containing data**
3. Backup files contain:
   - Database credentials
   - API keys and secrets
   - User data and PII
   - Edge Function secrets
   
4. Always encrypt backups before transferring:
   ```bash
   gpg --symmetric --cipher-algo AES256 backup.tar.gz
   ```

5. Delete local backups after secure transfer
6. Use environment variables or secret managers in CI/CD
7. Restrict access to backup storage (S3 bucket policies, etc.)

## Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Fill in your credentials (see env.example for details)

3. Get your database connection details from Supabase Dashboard:
   - Go to Project Settings → Database
   - Find "Connection string" → "URI"
   - Extract: host, port, database name, user, password

4. Authenticate Supabase CLI:
   ```bash
   supabase login
   ```

## Usage

### Creating a Backup

Run the backup script:

```bash
# macOS/Linux
chmod +x backup_supabase.sh
./backup_supabase.sh

# Windows (Git Bash or WSL)
bash backup_supabase.sh

# Windows (PowerShell)
pwsh backup_supabase.ps1
```

**Output:** Creates `supabase-backup-{PROJECT_REF}-{TIMESTAMP}.tar.gz`

The script will:
1. Check all required tools are installed
2. Create timestamped backup directory
3. Export database (schema + data)
4. Export roles and globals
5. Download Edge Functions
6. Export secrets (encrypted in manifest)
7. Download Storage files
8. Package everything into compressed archive
9. Generate SHA256 checksum

**Time estimate:** 5-30 minutes depending on database size and storage contents.

### Restoring to New Project

⚠️ **WARNING:** Restore operations are destructive and irreversible!

1. Create a new Supabase project (via Dashboard or CLI)
2. Update `.env` with new project credentials
3. Review what will be restored:
   ```bash
   ./restore_supabase.sh --dry-run
   ```

4. Run the actual restore:
   ```bash
   ./restore_supabase.sh --yes
   ```

The script will prompt you before each major step. Review carefully!

### Verifying the Restore

After restore completes, run verification:

```bash
./verify_restore.sh
```

This checks:
- Table row counts match
- Sample storage objects are accessible
- Edge Functions are deployed and responding
- RLS policies are active

## File Structure

```
scripts/supabase-backup/
├── README.md                    # This file
├── env.example                  # Environment template
├── .env                         # Your secrets (DO NOT COMMIT!)
├── backup_supabase.sh          # Main backup script (Bash)
├── backup_supabase.ps1         # Main backup script (PowerShell)
├── restore_supabase.sh         # Main restore script
├── verify_restore.sh           # Post-restore checks
├── export_manifests.js         # Generate JSON manifests
└── TODO_AFTER_BACKUP.md        # Post-backup checklist
```

## Backup Archive Contents

After unpacking a backup, you'll find:

```
backup-{timestamp}/
├── db-full.dump                # Custom format dump (recommended)
├── db-schema.sql               # Schema-only SQL
├── db-data.sql                 # Data-only SQL
├── roles.sql                   # Postgres roles
├── globals.sql                 # Extensions, settings
├── functions/                  # Edge Functions source
│   ├── function1/
│   └── function2/
├── functions-manifest.json     # Function metadata
├── secrets/
│   └── functions-secrets.json  # Environment variables (encrypted)
├── storage/                    # Storage bucket files
│   ├── bucket1/
│   └── bucket2/
├── storage-manifest.json       # Storage metadata
└── project-config.json         # Project settings
```

## Troubleshooting

### "Command not found: supabase"
- Install Supabase CLI (see Prerequisites)
- Ensure it's in your PATH

### "Connection refused" for pg_dump
- Check `PG_HOST`, `PG_PORT` in `.env`
- Verify IP is whitelisted in Supabase Dashboard → Database Settings
- Check if database is paused (unpause it)

### "Permission denied" for pg_dump
- Verify `PG_USER` and `PG_PASSWORD` are correct
- Check user has sufficient privileges

### Edge Functions not downloading
- Update Supabase CLI: `supabase update`
- Verify authentication: `supabase projects list`
- Check PROJECT_REF is correct

### Storage download timing out
- For large buckets (>1GB), use rclone (see backup script comments)
- Break into smaller chunks
- Check network connection stability

### Restore fails with "role already exists"
- Review `roles.sql` and comment out existing roles
- Or skip role restore if target project has suitable defaults

## Windows-Specific Notes

The Bash scripts work in:
- Git Bash (recommended)
- WSL (Windows Subsystem for Linux)
- MSYS2

Alternatively, use the PowerShell versions (`.ps1`) which are native to Windows.

PowerShell execution policy may need adjustment:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## CI/CD Integration

To automate backups:

1. Store credentials in CI secret manager (GitHub Secrets, GitLab CI Variables, etc.)
2. Use environment variables instead of `.env` file
3. Upload encrypted backup to secure storage (S3, Azure Blob, etc.)
4. Set up scheduled jobs (cron, GitHub Actions schedule)

Example GitHub Actions workflow structure:
```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}
  PROJECT_REF: ${{ secrets.PROJECT_REF }}
  PG_PASSWORD: ${{ secrets.PG_PASSWORD }}
```

## Support & Issues

- Supabase CLI Docs: https://supabase.com/docs/reference/cli
- Postgres Backup Guide: https://www.postgresql.org/docs/current/backup.html
- Report issues with these scripts in your project tracker

## License

These scripts are provided as-is for your internal use. Adapt as needed for your infrastructure.
