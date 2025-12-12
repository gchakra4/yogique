# Supabase Backup & Restore - Quick Start

Get started in 5 minutes! 🚀

## 1. Prerequisites Check

```bash
# Check if you have the required tools
supabase --version     # Need v2.50+
pg_dump --version      # PostgreSQL client tools
psql --version
jq --version           # JSON processor

# If missing, install:
# - Supabase CLI: https://supabase.com/docs/guides/cli
# - PostgreSQL: brew install postgresql (macOS) or apt-get install postgresql-client (Linux)
# - jq: brew install jq (macOS) or apt-get install jq (Linux)
```

## 2. Login to Supabase

```bash
supabase login
# Follow the browser authentication flow
```

## 3. Configure Environment

```bash
cd scripts/supabase-backup

# Copy the example
cp env.example .env

# Edit with your details
nano .env   # or use your favorite editor
```

**Required settings in .env:**
```bash
PROJECT_REF=your_project_ref              # From project URL
PG_HOST=db.your-project-ref.supabase.co
PG_PASSWORD=your_database_password        # From Dashboard → Settings → Database
```

**Get these from Supabase Dashboard:**
- Project Settings → General → Reference ID
- Project Settings → Database → Connection String (URI mode)

## 4. Run Your First Backup

```bash
# macOS/Linux/Git Bash
./backup_supabase.sh

# Windows PowerShell (if bash not available)
# You'll need to run in Git Bash or WSL
```

**What happens:**
- ✅ Validates all tools are installed
- ✅ Exports database (schema + data)
- ✅ Downloads Edge Functions
- ✅ Exports secrets list (names only)
- ✅ Creates compressed archive
- ✅ Generates checksum

**Output:** `backups/supabase-backup-{PROJECT_REF}-{TIMESTAMP}.tar.gz`

## 5. Verify Backup

```bash
# Check the backup was created
ls -lh backups/

# Verify integrity
sha256sum -c backups/*.sha256
# or on macOS:
shasum -a 256 -c backups/*.sha256
```

## 6. Encrypt Backup (Recommended!)

```bash
# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 backups/supabase-backup-*.tar.gz

# Enter a strong passphrase when prompted
# Save this passphrase in your password manager!
```

## 7. Store Safely

```bash
# Upload to cloud storage (example with AWS S3)
aws s3 cp backups/supabase-backup-*.tar.gz.gpg s3://my-backups/supabase/

# Or use SCP to your backup server
scp backups/supabase-backup-*.tar.gz.gpg user@backup-server:/backups/
```

## 8. Delete Local Copy

```bash
# ONLY after verifying remote backup exists!
rm backups/supabase-backup-*.tar.gz
rm backups/supabase-backup-*.tar.gz.gpg
```

---

## Restore Process (When Needed)

### 1. Create New Supabase Project
- Go to https://app.supabase.com
- Create new project
- Save the new project reference ID

### 2. Update .env for Restore
```bash
nano .env

# Add new project details:
NEW_PROJECT_REF=new_project_ref
NEW_PG_HOST=db.new-project-ref.supabase.co
NEW_PG_PASSWORD=new_db_password
```

### 3. Download & Decrypt Backup
```bash
# Download from cloud
aws s3 cp s3://my-backups/supabase/supabase-backup-*.tar.gz.gpg ./backups/

# Decrypt
gpg --decrypt backups/supabase-backup-*.tar.gz.gpg > backups/supabase-backup-*.tar.gz
```

### 4. Preview Restore (Dry Run)
```bash
./restore_supabase.sh --dry-run

# Review what will be restored
```

### 5. Execute Restore
```bash
./restore_supabase.sh --yes

# Follow the prompts
# This takes 10-30 minutes
```

### 6. Verify Restore
```bash
./verify_restore.sh

# Should show all checks passing
```

### 7. Manual Steps
After restore, you need to manually:
- Set Edge Function secrets (values not included in backup)
- Upload Storage files (if you have them)
- Configure OAuth providers
- Update your app with new API keys

See [TODO_AFTER_BACKUP.md](TODO_AFTER_BACKUP.md) for complete checklist.

---

## Common Commands

```bash
# Backup
./backup_supabase.sh

# Restore (preview)
./restore_supabase.sh --dry-run

# Restore (actual)
./restore_supabase.sh --yes

# Verify
./verify_restore.sh

# Export manifests only
node export_manifests.js

# List backups
ls -lht backups/

# Check backup size
du -sh backups/supabase-backup-*.tar.gz
```

---

## Troubleshooting

**"Command not found: supabase"**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase  # macOS
scoop install supabase              # Windows
```

**"Connection refused" during backup**
```bash
# Check your PG_HOST and PG_PASSWORD in .env
# Verify database is not paused (check Dashboard)
# Check your IP is whitelisted (Settings → Database → Connection Pooling)
```

**"Permission denied" executing scripts**
```bash
# Make scripts executable (Linux/macOS)
chmod +x *.sh
```

**"jq: command not found"**
```bash
brew install jq           # macOS
apt-get install jq        # Ubuntu/Debian
scoop install jq          # Windows
```

---

## Automation

Set up automated daily backups:

### Using Cron (Linux/macOS)
```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /path/to/scripts/supabase-backup && ./backup_supabase.sh
```

### Using GitHub Actions
See [TODO_AFTER_BACKUP.md](TODO_AFTER_BACKUP.md#32-set-up-automated-backups-cicd) for complete GitHub Actions workflow.

---

## Security Reminders

🔒 **Always:**
- Encrypt backups before transferring
- Use strong passwords/passphrases
- Never commit .env files
- Delete local backups after secure transfer
- Store encryption passphrases in password manager

❌ **Never:**
- Commit backups to Git
- Share .env files
- Store unencrypted backups on untrusted storage
- Use weak passwords

---

## What's Included in Backup?

✅ Database schema and data  
✅ RLS policies  
✅ Postgres roles, functions, triggers  
✅ Extensions  
✅ Edge Functions (source code)  
✅ Edge Function secrets (names only)  
⚠️ Storage files (requires manual download)  
⚠️ Vault secrets (must manually export)  

---

## Getting Help

- 📖 Full documentation: [README.md](README.md)
- ✅ Post-backup checklist: [TODO_AFTER_BACKUP.md](TODO_AFTER_BACKUP.md)
- 🌐 Supabase docs: https://supabase.com/docs
- 💬 Community: https://discord.supabase.com

---

**Ready to backup?** → `./backup_supabase.sh` 🚀
