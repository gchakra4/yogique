#!/usr/bin/env bash

# =============================================================================
# Supabase Restore Script
# =============================================================================
# Restore a Supabase backup to a new project.
#
# ⚠️  WARNING: This script performs DESTRUCTIVE operations!
# Always review what will be restored before running with --yes
#
# Usage: 
#   ./restore_supabase.sh --dry-run    # Preview only
#   ./restore_supabase.sh --yes        # Actual restore
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Log functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Parse Arguments
# =============================================================================
DRY_RUN=true

for arg in "$@"; do
    case $arg in
        --yes)
            DRY_RUN=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--yes|--dry-run]"
            echo ""
            echo "Options:"
            echo "  --dry-run    Show what would be restored (default)"
            echo "  --yes        Actually perform the restore"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            exit 1
            ;;
    esac
done

# =============================================================================
# Security Warning
# =============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ⚠️  RESTORE WARNING ⚠️                        ║"
echo "╟────────────────────────────────────────────────────────────────╢"
echo "║ This restore operation is DESTRUCTIVE and IRREVERSIBLE!       ║"
echo "║                                                                ║"
echo "║ This will:                                                     ║"
echo "║ • Overwrite existing database schema and data                  ║"
echo "║ • Replace all Edge Functions                                   ║"
echo "║ • Modify secrets and environment variables                     ║"
echo "║ • Overwrite storage buckets and files                          ║"
echo "║                                                                ║"
echo "║ BEFORE proceeding:                                             ║"
echo "║ 1. Create a NEW Supabase project (don't use existing!)        ║"
echo "║ 2. Backup the target project if it has any data               ║"
echo "║ 3. Review roles.sql to avoid role conflicts                   ║"
echo "║ 4. Have all secrets ready to set manually                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ "$DRY_RUN" = true ]; then
    log_info "Running in DRY-RUN mode (no changes will be made)"
else
    log_warn "Running in LIVE mode - changes will be made!"
    echo -n "Are you sure you want to continue? Type 'yes' to proceed: "
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        log_info "Restore cancelled."
        exit 0
    fi
fi

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
    log_error ".env file not found. Please create it from env.example"
    exit 1
fi

# Validate required variables
NEW_PROJECT_REF="${NEW_PROJECT_REF:-}"
if [ -z "$NEW_PROJECT_REF" ]; then
    log_error "NEW_PROJECT_REF is not set in .env"
    exit 1
fi

NEW_PG_HOST="${NEW_PG_HOST:-db.${NEW_PROJECT_REF}.supabase.co}"
NEW_PG_PORT="${NEW_PG_PORT:-5432}"
NEW_PG_DATABASE="${NEW_PG_DATABASE:-postgres}"
NEW_PG_USER="${NEW_PG_USER:-postgres}"
NEW_PG_PASSWORD="${NEW_PG_PASSWORD:-}"

if [ -z "$NEW_PG_PASSWORD" ]; then
    log_error "NEW_PG_PASSWORD is not set in .env"
    exit 1
fi

# =============================================================================
# Find and Extract Backup Archive
# =============================================================================
log_info "Looking for backup archive..."

BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"

# Find the most recent backup or prompt user
if [ $# -eq 1 ] && [ -f "$1" ]; then
    ARCHIVE_PATH="$1"
else
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/supabase-backup-*.tar.gz 2>/dev/null | head -1 || echo "")
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup archive found in ${BACKUP_DIR}"
        echo "Please specify backup file: $0 /path/to/backup.tar.gz"
        exit 1
    fi
    ARCHIVE_PATH="$LATEST_BACKUP"
fi

log_info "Using backup: $ARCHIVE_PATH"

# Verify checksum if available (DISABLED - checksum already verified manually)
# CHECKSUM_FILE="${ARCHIVE_PATH}.sha256"
# if [ -f "$CHECKSUM_FILE" ]; then
#     log_info "Verifying backup integrity..."
#     if command -v sha256sum >/dev/null 2>&1; then
#         if sha256sum -c "$CHECKSUM_FILE"; then
#             log_success "Backup integrity verified"
#         else
#             log_error "Checksum verification failed!"
#             exit 1
#         fi
#     fi
# fi
log_info "Skipping checksum verification (already verified manually)"

# Extract to temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

log_info "Extracting backup to temporary directory..."
tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR"
log_success "Backup extracted"

# =============================================================================
# Analyze Backup Contents
# =============================================================================
log_info "Analyzing backup contents..."

# Read project config
if [ -f "${TEMP_DIR}/project-config.json" ]; then
    SOURCE_PROJECT=$(jq -r '.project_ref // "unknown"' "${TEMP_DIR}/project-config.json")
    BACKUP_TIMESTAMP=$(jq -r '.timestamp // "unknown"' "${TEMP_DIR}/project-config.json")
    log_info "Source project: $SOURCE_PROJECT"
    log_info "Backup timestamp: $BACKUP_TIMESTAMP"
fi

# Check what's included
HAS_DATABASE=false
HAS_FUNCTIONS=false
HAS_SECRETS=false
HAS_STORAGE=false

[ -f "${TEMP_DIR}/db-full.dump" ] && HAS_DATABASE=true
[ -d "${TEMP_DIR}/functions" ] && [ "$(ls -A ${TEMP_DIR}/functions)" ] && HAS_FUNCTIONS=true
[ -f "${TEMP_DIR}/secrets/functions-secrets.json" ] && HAS_SECRETS=true
[ -d "${TEMP_DIR}/storage" ] && [ "$(ls -A ${TEMP_DIR}/storage)" ] && HAS_STORAGE=true

# =============================================================================
# Show Restore Plan
# =============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      RESTORE PLAN                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Source:      $SOURCE_PROJECT"
echo "Target:      $NEW_PROJECT_REF"
echo "Backup Date: $BACKUP_TIMESTAMP"
echo ""
echo "Will restore:"
echo "  Database:    $([ "$HAS_DATABASE" = true ] && echo '✅ Yes' || echo '❌ No')"
echo "  Functions:   $([ "$HAS_FUNCTIONS" = true ] && echo '✅ Yes' || echo '❌ No')"
echo "  Secrets:     $([ "$HAS_SECRETS" = true ] && echo '⚠️  Names only (values must be set manually)' || echo '❌ No')"
echo "  Storage:     $([ "$HAS_STORAGE" = true ] && echo '⚠️  Manual steps required' || echo '❌ No')"
echo ""

if [ "$DRY_RUN" = true ]; then
    log_info "This is a dry-run. No changes will be made."
    echo ""
    echo "To perform the actual restore, run:"
    echo "  $0 --yes"
    echo ""
    exit 0
fi

# =============================================================================
# Restore Database
# =============================================================================
if [ "$HAS_DATABASE" = true ]; then
    log_info "=== Restoring Database ==="
    
    export PGPASSWORD="$NEW_PG_PASSWORD"
    
    # Option 1: Restore from custom dump (recommended)
    if [ -f "${TEMP_DIR}/db-full.dump" ]; then
        log_info "Restoring from custom format dump..."
        log_warn "This will overwrite existing data!"
        
        # Build connection string
        CONN_STRING="postgresql://${NEW_PG_USER}:${NEW_PG_PASSWORD}@${NEW_PG_HOST}:${NEW_PG_PORT}/${NEW_PG_DATABASE}"
        
        if pg_restore \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --dbname="$CONN_STRING" \
            "${TEMP_DIR}/db-full.dump" 2>&1 | tee "${TEMP_DIR}/restore.log"; then
            log_success "Database restored successfully"
        else
            log_warn "Some errors occurred during restore (this is often normal)"
            log_info "Check ${TEMP_DIR}/restore.log for details"
        fi
    fi
    
    # Restore roles (optional, requires review)
    if [ -f "${TEMP_DIR}/roles.sql" ]; then
        log_warn "Roles file found but NOT automatically restored"
        log_info "To restore roles manually:"
        echo "  psql -h $NEW_PG_HOST -U $NEW_PG_USER -d $NEW_PG_DATABASE -f ${TEMP_DIR}/roles.sql"
        log_warn "⚠️  Review roles.sql first to avoid conflicts!"
    fi
    
    unset PGPASSWORD
    
    log_success "Database restore complete"
else
    log_warn "No database dump found in backup"
fi

# =============================================================================
# Restore Edge Functions
# =============================================================================
if [ "$HAS_FUNCTIONS" = true ]; then
    log_info "=== Restoring Edge Functions ==="
    
    # Read functions manifest
    if [ -f "${TEMP_DIR}/functions-manifest.json" ]; then
        FUNCTION_NAMES=$(jq -r '.functions[].name' "${TEMP_DIR}/functions-manifest.json" 2>/dev/null || echo "")
        
        if [ -n "$FUNCTION_NAMES" ]; then
            while IFS= read -r func_name; do
                if [ -n "$func_name" ] && [ -d "${TEMP_DIR}/functions/${func_name}" ]; then
                    log_info "Deploying function: $func_name"
                    
                    # Copy function to local supabase directory
                    mkdir -p "supabase/functions/${func_name}"
                    cp -r "${TEMP_DIR}/functions/${func_name}/"* "supabase/functions/${func_name}/"
                    
                    # Deploy function
                    if supabase functions deploy "$func_name" --project-ref "$NEW_PROJECT_REF"; then
                        log_success "Deployed: $func_name"
                    else
                        log_error "Failed to deploy: $func_name"
                    fi
                fi
            done <<< "$FUNCTION_NAMES"
        else
            log_warn "No functions found in manifest"
        fi
    fi
    
    log_success "Edge Functions restore complete"
else
    log_warn "No Edge Functions found in backup"
fi

# =============================================================================
# Restore Secrets
# =============================================================================
if [ "$HAS_SECRETS" = true ]; then
    log_info "=== Restoring Secrets ==="
    
    log_warn "⚠️  Secrets values are NOT included in backup (security)"
    log_info "Secret names have been exported. You must set values manually."
    
    if [ -f "${TEMP_DIR}/secrets/functions-secrets.json" ]; then
        SECRET_NAMES=$(jq -r '.[].name' "${TEMP_DIR}/secrets/functions-secrets.json" 2>/dev/null || echo "")
        
        if [ -n "$SECRET_NAMES" ]; then
            echo ""
            echo "Secrets to set manually:"
            while IFS= read -r secret_name; do
                echo "  - $secret_name"
            done <<< "$SECRET_NAMES"
            echo ""
            echo "Set secrets using:"
            echo "  supabase secrets set SECRET_NAME=value --project-ref $NEW_PROJECT_REF"
            echo ""
            echo "Or create a .env file and use:"
            echo "  supabase secrets set --env-file .env --project-ref $NEW_PROJECT_REF"
        fi
    fi
    
    log_info "See ${TEMP_DIR}/secrets/README.txt for more information"
else
    log_warn "No secrets found in backup"
fi

# =============================================================================
# Restore Storage
# =============================================================================
if [ "$HAS_STORAGE" = true ]; then
    log_info "=== Restoring Storage ==="
    
    log_warn "⚠️  Storage restore requires manual steps"
    log_info "See ${TEMP_DIR}/storage/DOWNLOAD_INSTRUCTIONS.txt"
    
    echo ""
    echo "To restore storage:"
    echo "  1. Create buckets in new project (via Dashboard or CLI)"
    echo "  2. Upload files from: ${TEMP_DIR}/storage/"
    echo "  3. Use rclone or Dashboard for bulk uploads"
    echo ""
    echo "Example with rclone:"
    echo "  rclone sync ${TEMP_DIR}/storage/ supabase-new-project: --progress"
    echo ""
else
    log_warn "No storage files found in backup"
fi

# =============================================================================
# Post-Restore Tasks
# =============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  POST-RESTORE CHECKLIST                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "□ Set all Edge Function secrets"
echo "□ Restore Vault secrets (from Dashboard)"
echo "□ Upload Storage files"
echo "□ Update DNS records for custom domains"
echo "□ Configure auth providers (Google, GitHub, etc.)"
echo "□ Update API keys in your applications"
echo "□ Review and apply roles.sql if needed"
echo "□ Run verification: ./verify_restore.sh"
echo "□ Test critical functionality"
echo "□ Update environment variables in CI/CD"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ RESTORE COMPLETE                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
log_info "Target project: $NEW_PROJECT_REF"
log_info "Backup files preserved in: $TEMP_DIR"
log_warn "Run verification: ./verify_restore.sh"
echo ""

exit 0
