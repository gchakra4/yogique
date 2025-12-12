# 🎉 Supabase Backup & Restore Toolset - Installation Complete

All backup and restore tools have been successfully created in:
**`scripts/supabase-backup/`**

---

## 📁 What Was Created

### Documentation (3 files)
- **README.md** - Complete documentation with prerequisites, usage, troubleshooting
- **QUICKSTART.md** - Get started in 5 minutes guide
- **TODO_AFTER_BACKUP.md** - 34-step comprehensive checklist for backup → restore workflow

### Configuration (2 files)
- **env.example** - Template with all configuration options and comments
- **.gitignore** - Protects sensitive backup files from being committed

### Scripts (4 files)
- **backup_supabase.sh** - Main backup script (Bash)
  - Exports database (schema + data)
  - Downloads Edge Functions
  - Exports secrets (names only)
  - Creates compressed archive with checksum
  
- **restore_supabase.sh** - Main restore script (Bash)
  - Validates backup integrity
  - Restores database
  - Redeploys Edge Functions
  - Provides manual steps for secrets/storage
  
- **verify_restore.sh** - Post-restore verification (Bash)
  - Tests database connectivity
  - Checks table counts
  - Verifies Edge Functions
  - Validates RLS policies
  
- **export_manifests.js** - Generate detailed JSON manifests (Node.js)
  - Edge Functions metadata
  - Database statistics
  - Storage inventory template

### Directories (4 folders with .gitkeep)
- **backups/** - Stores backup archives (auto-created)
- **functions/** - Edge Functions during backup/restore
- **secrets/** - Secrets manifests
- **storage/** - Storage files during backup/restore

---

## 🚀 Quick Start

### 1. Set Up Your Environment

```bash
cd scripts/supabase-backup

# Copy example config
cp env.example .env

# Edit with your credentials
nano .env
```

**Required in .env:**
```bash
PROJECT_REF=iddvvefpwgwmgpyelzcv    # Your linked project
PG_HOST=db.iddvvefpwgwmgpyelzcv.supabase.co
PG_PASSWORD=your_password_here
```

Get these from: **Supabase Dashboard → Settings → Database**

### 2. Run Your First Backup

**On Windows, you need Git Bash or WSL:**

```bash
# Option 1: Git Bash (recommended for Windows)
# Install from: https://git-scm.com/download/win
# Then right-click folder → "Git Bash Here"
./backup_supabase.sh

# Option 2: WSL (Windows Subsystem for Linux)
wsl
cd /mnt/d/New\ folder/tryfix\ -\ Copy/scripts/supabase-backup
./backup_supabase.sh

# Option 3: macOS/Linux
./backup_supabase.sh
```

### 3. Verify & Secure

```bash
# Check backup created
ls -lh backups/

# Verify checksum
sha256sum -c backups/*.sha256

# Encrypt (IMPORTANT!)
gpg --symmetric --cipher-algo AES256 backups/supabase-backup-*.tar.gz

# Upload to secure storage
aws s3 cp backups/*.tar.gz.gpg s3://my-backups/
```

---

## ⚙️ Your Current Supabase Projects

Based on your CLI authentication, you have access to:

| Project Name | Project Ref | Region | Linked |
|-------------|-------------|---------|---------|
| **Yogodyaan** | `iddvvefpwgwmgpyelzcv` | Mumbai | ✓ (Current) |
| LatestYogodyaan | `yzbwmaxgdynjhojvqewq` | Mumbai | |
| gourab4u's Project | `dxjowyrentohwqbmwwkb` | Mumbai | |

**To backup your linked project (Yogodyaan):**
```bash
# In .env, set:
PROJECT_REF=iddvvefpwgwmgpyelzcv
```

---

## 🔧 Windows-Specific Setup

Since you're on Windows, you have these options:

### Option A: Git Bash (Recommended - Easiest)
1. **Install Git for Windows**: https://git-scm.com/download/win
2. Navigate to project folder in Explorer
3. Right-click → "Git Bash Here"
4. Run scripts: `./backup_supabase.sh`

### Option B: WSL (Ubuntu on Windows)
1. Install WSL: `wsl --install` in PowerShell (as Admin)
2. Open Ubuntu from Start Menu
3. Navigate: `cd /mnt/d/New\ folder/tryfix\ -\ Copy/scripts/supabase-backup`
4. Run scripts: `./backup_supabase.sh`

### Option C: PowerShell Alternative
The scripts are written in Bash. If you absolutely cannot use Git Bash or WSL, you would need to:
- Manually run each command from the scripts in PowerShell
- Or create PowerShell (.ps1) versions (more complex)

**Recommendation:** Use Git Bash - it's the simplest option and you likely already have Git installed.

---

## 📋 What Each Script Does

### backup_supabase.sh
✅ Validates all required tools (supabase, pg_dump, jq, etc.)  
✅ Connects to your Supabase project database  
✅ Exports complete database dump (custom format)  
✅ Exports schema-only and data-only SQL  
✅ Exports Postgres roles and globals  
✅ Downloads all Edge Functions source code  
✅ Exports secrets list (names only - values not included for security)  
✅ Creates instructions for Storage download  
✅ Packages everything into .tar.gz archive  
✅ Generates SHA256 checksum  

**Runtime:** 5-30 minutes depending on database size  
**Output:** `backups/supabase-backup-{PROJECT_REF}-{TIMESTAMP}.tar.gz`

### restore_supabase.sh
✅ Shows what will be restored (dry-run mode)  
✅ Validates backup integrity via checksum  
✅ Restores database to new project  
✅ Redeploys Edge Functions  
✅ Lists secrets that need manual setting  
✅ Provides storage restore instructions  
✅ Runs post-restore checklist  

**Runtime:** 10-30 minutes  
**Safety:** Requires `--yes` flag to actually run (prevents accidents)

### verify_restore.sh
✅ Tests database connectivity  
✅ Counts tables and rows  
✅ Checks RLS policies exist  
✅ Verifies Edge Functions deployed  
✅ Validates extensions installed  
✅ Confirms triggers active  

**Runtime:** 1-2 minutes  
**Use:** Run after restore to verify everything worked

### export_manifests.js
✅ Generates detailed JSON metadata  
✅ Lists all Edge Functions with versions  
✅ Database statistics (table counts, rows)  
✅ Extensions list  
✅ Storage bucket inventory template  

**Runtime:** 1-2 minutes  
**Use:** Optional - provides additional metadata for documentation

---

## 🔐 Security Features Built-In

✅ **Never commits secrets** - .env excluded from Git  
✅ **Never commits backups** - All backup files gitignored  
✅ **Prompts for confirmation** - Restore requires explicit --yes flag  
✅ **Checksum verification** - SHA256 hashes prevent corruption  
✅ **GPG encryption support** - Instructions for encrypting backups  
✅ **No hardcoded credentials** - Everything via .env or environment vars  
✅ **Secrets values excluded** - Only names exported (values set manually)  

---

## 📚 Documentation Roadmap

Start here based on your needs:

1. **First time?** → Read [QUICKSTART.md](QUICKSTART.md)
2. **Need full details?** → Read [README.md](README.md)
3. **Planning restore?** → Read [TODO_AFTER_BACKUP.md](TODO_AFTER_BACKUP.md)
4. **Automation?** → See [TODO_AFTER_BACKUP.md](TODO_AFTER_BACKUP.md#32-set-up-automated-backups-cicd)

---

## ⚠️ Important Notes

### What's Included in Backup
✅ Complete database (schema, data, policies, functions, triggers)  
✅ Edge Functions source code  
✅ Secret names (but NOT secret values - you must set manually)  
⚠️ Storage files (requires manual download - see instructions in backup)  
⚠️ Vault secrets (requires manual export from Dashboard)  

### What You Need to Do Manually After Restore
1. Set Edge Function secret values
2. Upload Storage files
3. Configure OAuth providers
4. Update DNS/custom domains
5. Update API keys in your application

Full checklist: [TODO_AFTER_BACKUP.md](TODO_AFTER_BACKUP.md)

---

## 🆘 Common Issues & Solutions

### "bash: command not found" (Windows)
**Solution:** Install Git Bash or use WSL (see Windows-Specific Setup above)

### "supabase: command not found"
**Solution:** Install Supabase CLI:
```bash
# Windows (with Scoop)
scoop install supabase

# macOS
brew install supabase/tap/supabase

# Or see: https://supabase.com/docs/guides/cli
```

### "pg_dump: command not found"
**Solution:** Install PostgreSQL client tools:
```bash
# Windows: Download from postgresql.org
# macOS: brew install postgresql
# Linux: apt-get install postgresql-client
```

### "jq: command not found"
**Solution:** Install jq:
```bash
# Windows: scoop install jq
# macOS: brew install jq
# Linux: apt-get install jq
```

### "Connection refused" during backup
**Check:**
- Database credentials in .env are correct
- Database is not paused (Dashboard → Project Settings)
- Your IP is whitelisted (Dashboard → Settings → Database)

---

## 🎯 Next Steps

1. **Set up .env file** with your project credentials
2. **Test backup** with your Yogodyaan project (iddvvefpwgwmgpyelzcv)
3. **Encrypt and store** the backup securely
4. **Schedule regular backups** (see automation guide in TODO_AFTER_BACKUP.md)
5. **Test restore process** to a new project to verify it works

---

## 📞 Getting Help

- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli
- **PostgreSQL Backup Guide:** https://www.postgresql.org/docs/current/backup.html
- **Community Support:** https://discord.supabase.com
- **Your Supabase Console:** https://app.supabase.com/project/iddvvefpwgwmgpyelzcv

---

## ✅ Verification Checklist

Before your first backup, ensure:

- [ ] Git Bash or WSL is installed (Windows)
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] PostgreSQL client tools installed (`pg_dump --version`)
- [ ] jq installed (`jq --version`)
- [ ] Logged into Supabase (`supabase login`)
- [ ] .env file created and configured
- [ ] Database password obtained from Dashboard
- [ ] Project ref confirmed (iddvvefpwgwmgpyelzcv for Yogodyaan)

**Ready to go?** → `cd scripts/supabase-backup && ./backup_supabase.sh` 🚀

---

**Created:** December 12, 2025  
**Supabase CLI Version Tested:** v2.58.5 (update recommended to v2.65.5)  
**Platform:** Windows 11 (scripts compatible with macOS/Linux)

---

## 💡 Pro Tips

1. **Test first** with a small test project before backing up production
2. **Automate** backups with GitHub Actions or cron jobs
3. **Encrypt everything** before uploading to cloud storage
4. **Test restore** at least once per quarter to verify backups work
5. **Document secrets** separately in your password manager
6. **Monitor backup sizes** to watch for unexpected growth
7. **Keep 3 copies** of critical backups (3-2-1 backup rule)

---

**Questions?** Review the documentation or reach out to Supabase community support! 🙌
