#!/usr/bin/env bash

# =============================================================================
# Supabase Backup Script
# =============================================================================
# Complete backup of Supabase project including database, Edge Functions,
# secrets, and storage.
#
# SECURITY WARNING: This script handles sensitive data. Never commit backups
# or .env files containing secrets to version control!
#
# Usage: ./backup_supabase.sh
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Security Warning
# =============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🔒 SECURITY WARNING 🔒                      ║"
echo "╟────────────────────────────────────────────────────────────────╢"
echo "║ This backup will contain sensitive data:                      ║"
echo "║ • Database credentials and data                                ║"
echo "║ • API keys and secrets                                         ║"
echo "║ • User information (PII)                                       ║"
echo "║                                                                ║"
echo "║ NEVER commit .env files or backup dumps to version control!   ║"
echo "║ Encrypt backups before transferring or storing remotely.      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# =============================================================================
# Load Environment Variables
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
    log_info "Loading environment from .env file..."
    # shellcheck disable=SC1090
    source "$ENV_FILE"
else
    log_warn ".env file not found. Using environment variables..."
fi

# Required variables with defaults
PROJECT_REF="${PROJECT_REF:-}"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"
SKIP_DATABASE="${SKIP_DATABASE:-false}"
SKIP_FUNCTIONS="${SKIP_FUNCTIONS:-false}"
SKIP_SECRETS="${SKIP_SECRETS:-false}"
SKIP_STORAGE="${SKIP_STORAGE:-false}"

# Validate required variables
if [ -z "$PROJECT_REF" ]; then
    log_error "PROJECT_REF is not set. Please set it in .env or environment."
    exit 1
fi

# Database connection variables
PG_HOST="${PG_HOST:-db.${PROJECT_REF}.supabase.co}"
PG_PORT="${PG_PORT:-5432}"
PG_DATABASE="${PG_DATABASE:-postgres}"
PG_USER="${PG_USER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-}"

if [ -z "$PG_PASSWORD" ]; then
    log_warn "PG_PASSWORD not set. pg_dump may prompt for password."
fi

# =============================================================================
# Check Required Commands
# =============================================================================
log_info "Checking required commands..."

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

missing_commands=()

# Check Supabase CLI
if ! command_exists supabase; then
    missing_commands+=("supabase (Install: https://supabase.com/docs/guides/cli)")
fi

# Check PostgreSQL tools
if ! command_exists pg_dump; then
    missing_commands+=("pg_dump (Install: brew install postgresql or apt-get install postgresql-client)")
fi

if ! command_exists pg_dumpall; then
    missing_commands+=("pg_dumpall (part of postgresql-client)")
fi

if ! command_exists psql; then
    missing_commands+=("psql (part of postgresql-client)")
fi

# Check jq
if ! command_exists jq; then
    missing_commands+=("jq (Install: brew install jq or apt-get install jq)")
fi

# Check tar and gzip
if ! command_exists tar; then
    missing_commands+=("tar (usually pre-installed)")
fi

if ! command_exists gzip; then
    missing_commands+=("gzip (usually pre-installed)")
fi

# Optional: rclone for large storage
if ! command_exists rclone; then
    log_warn "rclone not found (optional - needed for large storage buckets)"
fi

if [ ${#missing_commands[@]} -gt 0 ]; then
    log_error "Missing required commands:"
    for cmd in "${missing_commands[@]}"; do
        echo "  - $cmd"
    done
    exit 1
fi

log_success "All required commands are available."

# =============================================================================
# Create Backup Directory
# =============================================================================
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup-${PROJECT_REF}-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

log_info "Creating backup directory: ${BACKUP_PATH}"
mkdir -p "$BACKUP_PATH"
mkdir -p "${BACKUP_PATH}/functions"
mkdir -p "${BACKUP_PATH}/secrets"
mkdir -p "${BACKUP_PATH}/storage"

# Log file
LOG_FILE="${BACKUP_PATH}/backup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

log_success "Backup directory created."
log_info "Starting backup at: $(date)"
log_info "Project: ${PROJECT_REF}"

# =============================================================================
# Export Database
# =============================================================================
if [ "$SKIP_DATABASE" = "false" ]; then
    log_info "Exporting database..."
    
    # Set password for pg_dump (avoids interactive prompt)
    export PGPASSWORD="$PG_PASSWORD"
    
    # Custom format dump (recommended - allows selective restore)
    log_info "Creating custom format dump (db-full.dump)..."
    pg_dump \
        --format=custom \
        --file="${BACKUP_PATH}/db-full.dump" \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        --dbname="$PG_DATABASE" \
        --no-owner \
        --no-privileges \
        --verbose
    
    log_success "Custom dump created: db-full.dump"
    
    # Schema-only SQL dump
    log_info "Creating schema-only dump (db-schema.sql)..."
    pg_dump \
        --schema-only \
        --file="${BACKUP_PATH}/db-schema.sql" \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        --dbname="$PG_DATABASE" \
        --no-owner \
        --no-privileges
    
    log_success "Schema dump created: db-schema.sql"
    
    # Data-only SQL dump
    log_info "Creating data-only dump (db-data.sql)..."
    pg_dump \
        --data-only \
        --file="${BACKUP_PATH}/db-data.sql" \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        --dbname="$PG_DATABASE" \
        --no-owner \
        --no-privileges
    
    log_success "Data dump created: db-data.sql"
    
    # Export roles
    log_info "Exporting Postgres roles (roles.sql)..."
    pg_dumpall \
        --roles-only \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        > "${BACKUP_PATH}/roles.sql"
    
    log_success "Roles exported: roles.sql"
    log_warn "⚠️  Review roles.sql before restoring to avoid conflicts!"
    
    # Export globals (extensions, tablespaces, etc.)
    log_info "Exporting Postgres globals (globals.sql)..."
    pg_dumpall \
        --globals-only \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --username="$PG_USER" \
        > "${BACKUP_PATH}/globals.sql"
    
    log_success "Globals exported: globals.sql"
    
    # Clear password from environment
    unset PGPASSWORD
    
    log_success "Database export complete!"
else
    log_warn "Skipping database export (SKIP_DATABASE=true)"
fi

# =============================================================================
# Download Edge Functions
# =============================================================================
if [ "$SKIP_FUNCTIONS" = "false" ]; then
    log_info "Downloading Edge Functions..."
    
    # List all functions
    log_info "Fetching function list..."
    FUNCTIONS_JSON=$(supabase functions list --project-ref "$PROJECT_REF" --output json 2>/dev/null || echo "[]")
    
    if [ "$FUNCTIONS_JSON" = "[]" ] || [ -z "$FUNCTIONS_JSON" ]; then
        log_warn "No Edge Functions found or unable to list functions."
    else
        echo "$FUNCTIONS_JSON" > "${BACKUP_PATH}/functions-list.json"
        
        # Parse function names
        FUNCTION_NAMES=$(echo "$FUNCTIONS_JSON" | jq -r '.[].name' 2>/dev/null || echo "")
        
        if [ -z "$FUNCTION_NAMES" ]; then
            log_warn "No functions to download."
        else
            FUNCTION_COUNT=0
            while IFS= read -r func_name; do
                if [ -n "$func_name" ]; then
                    log_info "Downloading function: $func_name"
                    
                    # Create function directory
                    FUNC_DIR="${BACKUP_PATH}/functions/${func_name}"
                    mkdir -p "$FUNC_DIR"
                    
                    # Download function
                    if supabase functions download "$func_name" \
                        --project-ref "$PROJECT_REF" 2>/dev/null; then
                        
                        # Move downloaded files to backup directory
                        if [ -d "supabase/functions/${func_name}" ]; then
                            cp -r "supabase/functions/${func_name}/"* "$FUNC_DIR/"
                            log_success "Downloaded: $func_name"
                            ((FUNCTION_COUNT++))
                        else
                            log_warn "Function downloaded but files not found: $func_name"
                        fi
                    else
                        log_warn "Failed to download function: $func_name"
                    fi
                fi
            done <<< "$FUNCTION_NAMES"
            
            log_success "Downloaded $FUNCTION_COUNT Edge Functions"
        fi
        
        # Create manifest
        cat > "${BACKUP_PATH}/functions-manifest.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project_ref": "$PROJECT_REF",
  "functions": $FUNCTIONS_JSON
}
EOF
        log_success "Functions manifest created."
    fi
else
    log_warn "Skipping Edge Functions download (SKIP_FUNCTIONS=true)"
fi

# =============================================================================
# Export Secrets
# =============================================================================
if [ "$SKIP_SECRETS" = "false" ]; then
    log_info "Exporting secrets..."
    
    # Export Edge Function secrets
    log_info "Fetching Edge Function secrets..."
    SECRETS_JSON=$(supabase secrets list --project-ref "$PROJECT_REF" --output json 2>/dev/null || echo "[]")
    
    if [ "$SECRETS_JSON" != "[]" ] && [ -n "$SECRETS_JSON" ]; then
        echo "$SECRETS_JSON" > "${BACKUP_PATH}/secrets/functions-secrets.json"
        log_success "Secrets exported to functions-secrets.json"
        log_warn "⚠️  Secret values are NOT included (security). You must manually set them in the new project."
    else
        log_warn "No secrets found or unable to list secrets."
    fi
    
    # Note about Vault secrets
    cat > "${BACKUP_PATH}/secrets/README.txt" <<EOF
SECRET MANAGEMENT NOTES
=======================

Edge Function Secrets:
- Secret NAMES are exported in functions-secrets.json
- Secret VALUES are NOT exported (security policy)
- You must manually set secret values in the new project using:
  supabase secrets set KEY=VALUE --project-ref NEW_PROJECT_REF

Vault Secrets:
- Supabase Vault secrets must be manually exported from the Dashboard
- Go to: Database → Secrets Manager
- Export or manually copy secrets
- Re-create in new project

Environment Variables:
- Check your project's .env files
- Check CI/CD pipeline variables
- Update with new project credentials after restore

API Keys:
- Anon/Service keys are automatically generated for new projects
- Update your application config with new keys after restore
EOF
    
    log_success "Secrets export complete. See secrets/README.txt for important notes."
else
    log_warn "Skipping secrets export (SKIP_SECRETS=true)"
fi

# =============================================================================
# Download Storage Objects
# =============================================================================
if [ "$SKIP_STORAGE" = "false" ]; then
    log_info "Downloading Storage objects..."
    
    # Note: Supabase CLI v2.58.5 may not have comprehensive storage commands
    # We'll use a combination of CLI and manual instructions
    
    log_warn "Storage download requires manual steps or rclone for large buckets."
    
    # Create instructions file
    cat > "${BACKUP_PATH}/storage/DOWNLOAD_INSTRUCTIONS.txt" <<EOF
STORAGE BACKUP INSTRUCTIONS
============================

The Supabase CLI has limited storage download capabilities in v2.58.5.
For production use, we recommend using rclone with S3-compatible access.

Option 1: Using Supabase Dashboard
-----------------------------------
1. Go to Storage in your Supabase Dashboard
2. For each bucket:
   - Click bucket name
   - Select files
   - Click "Download" button
   - Save to: ${BACKUP_PATH}/storage/{bucket-name}/

Option 2: Using rclone (Recommended for large buckets)
-------------------------------------------------------
1. Get your S3 credentials from Supabase:
   - Go to Settings → API
   - Find S3 Access Keys section
   - Generate keys if needed

2. Configure rclone:
   rclone config create supabase-storage s3 \\
     provider=Other \\
     access_key_id=YOUR_ACCESS_KEY \\
     secret_access_key=YOUR_SECRET_KEY \\
     endpoint=https://${PROJECT_REF}.supabase.co/storage/v1/s3 \\
     acl=private

3. Sync storage:
   rclone sync supabase-storage: ${BACKUP_PATH}/storage/ --progress

Option 3: Using AWS CLI
------------------------
If you have AWS CLI configured:
   aws s3 sync \\
     s3://your-bucket \\
     ${BACKUP_PATH}/storage/ \\
     --endpoint-url=https://${PROJECT_REF}.supabase.co/storage/v1/s3

Option 4: Using Supabase Management API
----------------------------------------
Use the Storage API to list and download files programmatically.
See: https://supabase.com/docs/reference/javascript/storage-from-list

AFTER DOWNLOADING:
------------------
Create a manifest file: ${BACKUP_PATH}/storage-manifest.json
With structure:
{
  "buckets": [
    {
      "name": "bucket-name",
      "public": true,
      "file_count": 123,
      "total_size_bytes": 45678900
    }
  ]
}
EOF
    
    log_warn "See storage/DOWNLOAD_INSTRUCTIONS.txt for manual storage backup steps."
    log_info "If you have rclone configured, storage can be downloaded automatically in future versions."
    
    # Create empty manifest
    cat > "${BACKUP_PATH}/storage-manifest.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project_ref": "$PROJECT_REF",
  "buckets": [],
  "note": "Storage must be downloaded manually. See storage/DOWNLOAD_INSTRUCTIONS.txt"
}
EOF
else
    log_warn "Skipping storage download (SKIP_STORAGE=true)"
fi

# =============================================================================
# Export Project Configuration
# =============================================================================
log_info "Exporting project configuration..."

# Get project info
PROJECT_INFO=$(supabase projects list --output json 2>/dev/null | jq ".[] | select(.reference_id == \"$PROJECT_REF\")" || echo "{}")

cat > "${BACKUP_PATH}/project-config.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "backup_version": "1.0",
  "source_project": $PROJECT_INFO,
  "project_ref": "$PROJECT_REF",
  "cli_version": "$(supabase --version 2>/dev/null || echo 'unknown')",
  "backup_path": "$BACKUP_PATH",
  "backup_contents": {
    "database": $([ "$SKIP_DATABASE" = "false" ] && echo "true" || echo "false"),
    "functions": $([ "$SKIP_FUNCTIONS" = "false" ] && echo "true" || echo "false"),
    "secrets": $([ "$SKIP_SECRETS" = "false" ] && echo "true" || echo "false"),
    "storage": $([ "$SKIP_STORAGE" = "false" ] && echo "true" || echo "false")
  }
}
EOF

log_success "Project configuration exported."

# =============================================================================
# Create Archive
# =============================================================================
log_info "Creating compressed archive..."

ARCHIVE_NAME="supabase-backup-${PROJECT_REF}-${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"

cd "$BACKUP_DIR"
tar -czf "$ARCHIVE_NAME" -C "$BACKUP_NAME" .

log_success "Archive created: ${ARCHIVE_PATH}"

# Calculate checksum
log_info "Calculating SHA256 checksum..."
if command_exists sha256sum; then
    CHECKSUM=$(sha256sum "$ARCHIVE_NAME" | awk '{print $1}')
elif command_exists shasum; then
    CHECKSUM=$(shasum -a 256 "$ARCHIVE_NAME" | awk '{print $1}')
else
    CHECKSUM="(checksum tool not available)"
fi

echo "$CHECKSUM" > "${ARCHIVE_NAME}.sha256"
log_success "Checksum: $CHECKSUM"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ BACKUP COMPLETE                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
log_info "Backup Summary:"
echo "  Project:       $PROJECT_REF"
echo "  Timestamp:     $TIMESTAMP"
echo "  Archive:       $ARCHIVE_PATH"
echo "  Checksum:      $CHECKSUM"
echo "  Directory:     $BACKUP_PATH"
echo ""
log_info "Archive size: $(du -h "$ARCHIVE_PATH" | cut -f1)"
echo ""

# Next steps
echo "Next Steps:"
echo "  1. Verify backup integrity:"
echo "     sha256sum -c ${ARCHIVE_NAME}.sha256"
echo ""
echo "  2. Encrypt backup (recommended):"
echo "     gpg --symmetric --cipher-algo AES256 ${ARCHIVE_NAME}"
echo ""
echo "  3. Transfer to secure storage:"
echo "     scp ${ARCHIVE_NAME} user@backup-server:/backups/"
echo "     # or"
echo "     aws s3 cp ${ARCHIVE_NAME} s3://my-backups/"
echo ""
echo "  4. Delete local copy after secure transfer:"
echo "     rm ${ARCHIVE_NAME}"
echo "     rm -rf ${BACKUP_PATH}"
echo ""
echo "  5. See TODO_AFTER_BACKUP.md for restore instructions."
echo ""

log_warn "⚠️  Remember: This backup contains sensitive data. Handle securely!"

exit 0
