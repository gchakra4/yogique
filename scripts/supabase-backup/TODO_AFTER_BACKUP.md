# Post-Backup Checklist

After creating a backup, follow these steps to securely transfer and restore it to a new Supabase account.

## ✅ Immediate Actions (After Backup Creation)

### 1. Verify Backup Integrity
```bash
# Check the backup was created successfully
ls -lh backups/supabase-backup-*.tar.gz

# Verify checksum
sha256sum -c backups/supabase-backup-*.tar.gz.sha256

# Or on macOS:
shasum -a 256 -c backups/supabase-backup-*.tar.gz.sha256
```

### 2. Test Backup Archive
```bash
# Verify archive can be extracted without errors
tar -tzf backups/supabase-backup-*.tar.gz | head -20
```

### 3. Review Backup Contents
- [ ] Database dump files present (db-full.dump, db-schema.sql, db-data.sql)
- [ ] Roles and globals exported (roles.sql, globals.sql)
- [ ] Edge Functions downloaded (functions/ directory)
- [ ] Secrets manifest created (secrets/functions-secrets.json)
- [ ] Storage instructions present (storage/DOWNLOAD_INSTRUCTIONS.txt)
- [ ] Project config saved (project-config.json)

---

## 🔐 Security & Encryption

### 4. Encrypt the Backup (STRONGLY RECOMMENDED)
```bash
# Using GPG symmetric encryption
gpg --symmetric --cipher-algo AES256 backups/supabase-backup-*.tar.gz

# This creates: supabase-backup-*.tar.gz.gpg
# Save the passphrase in your password manager!

# Verify encrypted file
gpg --decrypt backups/supabase-backup-*.tar.gz.gpg | tar -tz | head -5

# Delete unencrypted backup after verification
rm backups/supabase-backup-*.tar.gz
```

### 5. Secure Local Storage
```bash
# Set restrictive permissions
chmod 600 backups/supabase-backup-*.tar.gz.gpg

# Consider encrypting entire backups directory
# macOS: Use encrypted disk image or FileVault
# Linux: Use LUKS encrypted volume
# Windows: Use BitLocker or VeraCrypt
```

---

## 📤 Transfer to Secure Storage

Choose ONE method below:

### Option A: AWS S3 (Recommended)
```bash
# Upload encrypted backup to S3
aws s3 cp backups/supabase-backup-*.tar.gz.gpg \
  s3://my-secure-backups/supabase/ \
  --storage-class GLACIER_IR \
  --server-side-encryption AES256

# Verify upload
aws s3 ls s3://my-secure-backups/supabase/

# Enable S3 bucket versioning (if not already)
aws s3api put-bucket-versioning \
  --bucket my-secure-backups \
  --versioning-configuration Status=Enabled
```

### Option B: Azure Blob Storage
```bash
# Upload to Azure
az storage blob upload \
  --account-name mystorageaccount \
  --container-name supabase-backups \
  --name supabase-backup-*.tar.gz.gpg \
  --file backups/supabase-backup-*.tar.gz.gpg \
  --encryption-scope encryption-scope-name
```

### Option C: Google Cloud Storage
```bash
# Upload to GCS
gsutil cp backups/supabase-backup-*.tar.gz.gpg \
  gs://my-backup-bucket/supabase/

# Enable versioning
gsutil versioning set on gs://my-backup-bucket
```

### Option D: Secure Server (SCP/SFTP)
```bash
# SCP to secure backup server
scp backups/supabase-backup-*.tar.gz.gpg \
  user@backup-server.com:/secure/backups/supabase/

# Using rsync over SSH (preserves permissions)
rsync -avz --progress \
  backups/supabase-backup-*.tar.gz.gpg \
  user@backup-server.com:/secure/backups/supabase/
```

### Option E: Self-Hosted Storage (rclone)
```bash
# Configure rclone remote first
rclone config

# Copy to remote
rclone copy backups/supabase-backup-*.tar.gz.gpg remote:supabase-backups/

# Verify
rclone ls remote:supabase-backups/
```

### 6. Verify Remote Backup
- [ ] Checksum matches on remote storage
- [ ] File size is correct
- [ ] Download test file to verify integrity
- [ ] Backup is in encrypted form

---

## 🗑️ Cleanup Local Backups

### 7. Delete Local Copies (After Verification)
```bash
# ⚠️ ONLY after verifying remote backup is secure and accessible!

# Delete local backup files
rm backups/supabase-backup-*.tar.gz
rm backups/supabase-backup-*.tar.gz.gpg
rm -rf backups/backup-*-*/

# Keep only the checksum for reference
# Or delete everything:
# rm -rf backups/*
```

### 8. Securely Wipe (Optional, for sensitive data)
```bash
# On Linux, use shred
shred -vfz -n 3 backups/supabase-backup-*.tar.gz

# On macOS, use srm (if available)
srm -vz backups/supabase-backup-*.tar.gz

# On Windows, use SDelete
# sdelete -p 3 backups\supabase-backup-*.tar.gz
```

---

## 🚀 Restore Preparation

### 9. Create New Supabase Project
- [ ] Go to https://app.supabase.com
- [ ] Create new project or use existing account
- [ ] Choose same region as source (recommended) or different region
- [ ] Wait for project to finish provisioning
- [ ] Note the new project reference ID

### 10. Gather New Project Credentials

#### From Supabase Dashboard:

**Database Credentials:**
- Go to: Project Settings → Database → Connection String
- Switch to "URI" mode
- Copy the connection string
- Extract:
  ```
  NEW_PG_HOST=db.your-new-project-ref.supabase.co
  NEW_PG_PORT=5432
  NEW_PG_DATABASE=postgres
  NEW_PG_USER=postgres
  NEW_PG_PASSWORD=your_new_password
  ```

**Project Reference:**
- Found in URL: `https://app.supabase.com/project/{NEW_PROJECT_REF}/`
- Or: Settings → General → Reference ID

**API Keys:**
- Settings → API
- Copy: `anon` (public) and `service_role` (secret) keys
- Save these for updating your application config later

### 11. Update .env for Restore
```bash
# Copy the example
cp scripts/supabase-backup/env.example scripts/supabase-backup/.env

# Edit .env and fill in:
nano scripts/supabase-backup/.env

# Required fields for restore:
NEW_PROJECT_REF=your_new_project_ref
NEW_PG_HOST=db.your-new-project-ref.supabase.co
NEW_PG_PASSWORD=your_new_db_password
```

### 12. Download and Decrypt Backup
```bash
# Download from cloud storage
aws s3 cp s3://my-secure-backups/supabase/supabase-backup-*.tar.gz.gpg \
  ./backups/

# Decrypt
gpg --decrypt backups/supabase-backup-*.tar.gz.gpg > backups/supabase-backup-*.tar.gz

# Verify checksum
sha256sum backups/supabase-backup-*.tar.gz
```

---

## 📋 Pre-Restore Checklist

### 13. Prepare Secrets
Collect all secret values that need to be manually set:

- [ ] Edge Function environment variables
- [ ] Vault secrets
- [ ] Third-party API keys
- [ ] OAuth client secrets
- [ ] Webhook signing secrets

**Where to find secrets:**
- Original project's Edge Function secrets
- Your password manager
- CI/CD secret storage
- `.env` files (don't commit these!)

### 14. Review roles.sql
```bash
# Extract and review roles before restore
tar -xzf backups/supabase-backup-*.tar.gz -C /tmp/ backup-*/roles.sql

# Review roles
cat /tmp/backup-*/roles.sql

# Comment out or remove any roles that might conflict:
# - Default Supabase roles (already exist)
# - Roles you don't want to recreate
```

### 15. Storage Preparation
If you have large storage buckets:

- [ ] Ensure you have downloaded all storage files
- [ ] Organize files by bucket name
- [ ] Prepare rclone or bulk upload tool
- [ ] Check available storage quota in new project

---

## 🔄 Running the Restore

### 16. Test Restore (Dry Run)
```bash
cd scripts/supabase-backup

# Preview what will be restored
./restore_supabase.sh --dry-run

# Review the output carefully
```

### 17. Execute Restore
```bash
# Run actual restore
./restore_supabase.sh --yes

# Follow prompts and confirm each step
# This will take 10-30 minutes depending on data size
```

### 18. Verify Restore
```bash
# Run verification script
./verify_restore.sh

# Check all tests pass
```

---

## ⚙️ Post-Restore Configuration

### 19. Set Secrets Manually
```bash
# Set Edge Function secrets
supabase secrets set \
  SECRET_KEY_1=value1 \
  SECRET_KEY_2=value2 \
  --project-ref $NEW_PROJECT_REF

# Or from .env file:
supabase secrets set --env-file .env --project-ref $NEW_PROJECT_REF
```

### 20. Restore Vault Secrets
- Go to: Database → Secrets Manager in new project
- Manually create each secret from your backup notes
- Verify secrets are accessible to functions that need them

### 21. Upload Storage Files
```bash
# Using Dashboard (for small amounts):
# Go to Storage → Select bucket → Upload files

# Using rclone (recommended for large amounts):
rclone sync ./backups/storage/ supabase-new-project: --progress

# Using Supabase CLI (if available):
# supabase storage upload bucket-name ./local-file.jpg
```

### 22. Update Application Configuration
Update your application(s) with new credentials:

- [ ] Database connection string
- [ ] Supabase URL: `https://{NEW_PROJECT_REF}.supabase.co`
- [ ] Anon key (public)
- [ ] Service role key (secret)
- [ ] Storage URLs
- [ ] Edge Function URLs

Files to update:
- `.env` or `.env.production`
- CI/CD environment variables
- Mobile app configuration
- Frontend environment files

### 23. Configure Authentication Providers
Re-configure OAuth providers in the new project:

- **Google:** Settings → Authentication → Providers → Google
  - Add new redirect URL: `https://{NEW_PROJECT_REF}.supabase.co/auth/v1/callback`
  - Update in Google Cloud Console

- **GitHub:** Settings → Authentication → Providers → GitHub
  - Add new callback URL in GitHub OAuth app settings

- **Others:** Update each provider with new callback URLs

### 24. Custom Domain (If Applicable)
- Settings → Custom Domain
- Add your domain
- Update DNS records as instructed
- Wait for SSL certificate provisioning

### 25. Configure Email Templates
- Settings → Authentication → Email Templates
- Customize signup, invite, recovery emails
- Test email flows

---

## ✅ Final Verification

### 26. Functional Testing
- [ ] User can sign up
- [ ] User can log in
- [ ] Database queries work
- [ ] Edge Functions respond correctly
- [ ] Storage files are accessible
- [ ] RLS policies enforce correctly
- [ ] Webhooks fire as expected

### 27. Performance Check
- [ ] Query response times acceptable
- [ ] Edge Functions have low cold start times
- [ ] No errors in logs
- [ ] Connection pooling working

### 28. Monitoring Setup
- Configure alerts in new project
- Set up external monitoring (UptimeRobot, Pingdom, etc.)
- Monitor error rates in logs
- Set up log drains if needed

---

## 📚 Documentation

### 29. Update Documentation
- [ ] Document the new project reference ID
- [ ] Update team wiki with new credentials (securely!)
- [ ] Update runbooks with new URLs
- [ ] Document any differences from old project

### 30. Update CI/CD
Update environment variables in:
- [ ] GitHub Actions secrets
- [ ] GitLab CI variables
- [ ] CircleCI environment
- [ ] Jenkins credentials
- [ ] Terraform/IaC code

---

## 🔄 Ongoing Maintenance

### 31. Schedule Regular Backups
```bash
# Add to cron (Linux/macOS)
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/supabase-backup/backup_supabase.sh

# Or use systemd timer, launchd, or Task Scheduler (Windows)
```

### 32. Set Up Automated Backups (CI/CD)
Example GitHub Actions workflow:

```yaml
name: Supabase Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PostgreSQL Client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Setup Supabase CLI
        run: |
          brew install supabase/tap/supabase
      
      - name: Run Backup
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}
          PROJECT_REF: ${{ secrets.PROJECT_REF }}
          PG_PASSWORD: ${{ secrets.PG_PASSWORD }}
        run: |
          cd scripts/supabase-backup
          ./backup_supabase.sh
      
      - name: Encrypt Backup
        run: |
          gpg --batch --yes --passphrase "${{ secrets.GPG_PASSPHRASE }}" \
            --symmetric --cipher-algo AES256 \
            backups/supabase-backup-*.tar.gz
      
      - name: Upload to S3
        run: |
          aws s3 cp backups/supabase-backup-*.tar.gz.gpg \
            s3://my-backups/supabase/ \
            --storage-class GLACIER_IR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### 33. Test Restore Periodically
- Schedule quarterly restore tests
- Restore to a test project
- Verify all functionality
- Document restore time

### 34. Backup Retention Policy
Set up automated cleanup:

```bash
# Delete backups older than 30 days
find backups/ -name "supabase-backup-*.tar.gz*" -mtime +30 -delete

# Or in S3 with lifecycle policy:
aws s3api put-bucket-lifecycle-configuration \
  --bucket my-backups \
  --lifecycle-configuration file://lifecycle.json
```

---

## 🆘 Troubleshooting

### Common Issues and Solutions

#### "Connection refused" during restore
- Check database credentials
- Verify IP is whitelisted
- Ensure database is not paused

#### "Permission denied" on pg_restore
- Check user privileges
- Use `--no-owner --no-privileges` flags
- May need to manually grant permissions

#### Edge Functions fail to deploy
- Check function code for errors
- Verify secrets are set
- Check Deno import compatibility
- Review function logs in Dashboard

#### Storage files missing
- Verify rclone configuration
- Check bucket permissions
- Ensure files were downloaded completely

#### RLS policies too restrictive
- Review policies in restored database
- Test with service role key
- Check auth context

---

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase CLI Reference: https://supabase.com/docs/reference/cli
- Community Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase

---

## ✨ Success Criteria

You're done when:
- ✅ All tests in `verify_restore.sh` pass
- ✅ Application connects to new project
- ✅ Users can authenticate
- ✅ Data is accessible
- ✅ Edge Functions respond
- ✅ Storage files load
- ✅ No errors in logs for 24 hours
- ✅ Team is notified of new project details

---

**Remember:** Keep this checklist and refer back to it for future backups/restores!
