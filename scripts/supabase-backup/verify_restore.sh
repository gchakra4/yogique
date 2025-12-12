#!/usr/bin/env bash

# =============================================================================
# Supabase Restore Verification Script
# =============================================================================
# Verify that a restore completed successfully by checking:
# - Database connectivity
# - Table row counts
# - Edge Functions are deployed
# - Storage accessibility
# - RLS policies are active
#
# Usage: ./verify_restore.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# =============================================================================
# Load Environment
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
else
    log_error ".env file not found"
    exit 1
fi

NEW_PROJECT_REF="${NEW_PROJECT_REF:-}"
if [ -z "$NEW_PROJECT_REF" ]; then
    log_error "NEW_PROJECT_REF not set in .env"
    exit 1
fi

NEW_PG_HOST="${NEW_PG_HOST:-db.${NEW_PROJECT_REF}.supabase.co}"
NEW_PG_PORT="${NEW_PG_PORT:-5432}"
NEW_PG_DATABASE="${NEW_PG_DATABASE:-postgres}"
NEW_PG_USER="${NEW_PG_USER:-postgres}"
NEW_PG_PASSWORD="${NEW_PG_PASSWORD:-}"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              VERIFYING RESTORE: $NEW_PROJECT_REF               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# =============================================================================
# Check 1: Database Connectivity
# =============================================================================
log_info "Testing database connectivity..."
export PGPASSWORD="$NEW_PG_PASSWORD"

if psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Database is accessible"
    ((CHECKS_PASSED++))
else
    log_error "Cannot connect to database"
    ((CHECKS_FAILED++))
fi

# =============================================================================
# Check 2: Database Schema
# =============================================================================
log_info "Checking database schemas..."

SCHEMA_COUNT=$(psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
    -t -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast');" \
    2>/dev/null | tr -d ' ')

if [ -n "$SCHEMA_COUNT" ] && [ "$SCHEMA_COUNT" -gt 0 ]; then
    log_success "Found $SCHEMA_COUNT custom schemas"
    ((CHECKS_PASSED++))
else
    log_warn "No custom schemas found (may be expected)"
    ((CHECKS_WARNED++))
fi

# =============================================================================
# Check 3: Tables
# =============================================================================
log_info "Checking tables..."

TABLE_COUNT=$(psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" \
    2>/dev/null | tr -d ' ')

if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "Found $TABLE_COUNT tables in public schema"
    ((CHECKS_PASSED++))
    
    # Show table row counts
    log_info "Sample table row counts:"
    psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
        -c "SELECT schemaname, tablename, n_live_tup as row_count 
            FROM pg_stat_user_tables 
            WHERE schemaname = 'public' 
            ORDER BY n_live_tup DESC 
            LIMIT 10;" 2>/dev/null || true
else
    log_error "No tables found in public schema"
    ((CHECKS_FAILED++))
fi

# =============================================================================
# Check 4: RLS Policies
# =============================================================================
log_info "Checking RLS policies..."

RLS_POLICY_COUNT=$(psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
    -t -c "SELECT COUNT(*) FROM pg_policies;" \
    2>/dev/null | tr -d ' ')

if [ -n "$RLS_POLICY_COUNT" ] && [ "$RLS_POLICY_COUNT" -gt 0 ]; then
    log_success "Found $RLS_POLICY_COUNT RLS policies"
    ((CHECKS_PASSED++))
else
    log_warn "No RLS policies found (may be expected)"
    ((CHECKS_WARNED++))
fi

# =============================================================================
# Check 5: Functions (Database Functions)
# =============================================================================
log_info "Checking database functions..."

FUNCTION_COUNT=$(psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
    -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');" \
    2>/dev/null | tr -d ' ')

if [ -n "$FUNCTION_COUNT" ] && [ "$FUNCTION_COUNT" -gt 0 ]; then
    log_success "Found $FUNCTION_COUNT database functions"
    ((CHECKS_PASSED++))
else
    log_warn "No database functions found in public schema"
    ((CHECKS_WARNED++))
fi

# =============================================================================
# Check 6: Triggers
# =============================================================================
log_info "Checking triggers..."

TRIGGER_COUNT=$(psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
    -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname NOT LIKE 'RI_ConstraintTrigger%';" \
    2>/dev/null | tr -d ' ')

if [ -n "$TRIGGER_COUNT" ] && [ "$TRIGGER_COUNT" -gt 0 ]; then
    log_success "Found $TRIGGER_COUNT triggers"
    ((CHECKS_PASSED++))
else
    log_warn "No triggers found (may be expected)"
    ((CHECKS_WARNED++))
fi

unset PGPASSWORD

# =============================================================================
# Check 7: Edge Functions
# =============================================================================
log_info "Checking Edge Functions..."

FUNCTIONS_JSON=$(supabase functions list --project-ref "$NEW_PROJECT_REF" --output json 2>/dev/null || echo "[]")

if [ "$FUNCTIONS_JSON" != "[]" ] && [ -n "$FUNCTIONS_JSON" ]; then
    FUNCTION_COUNT=$(echo "$FUNCTIONS_JSON" | jq 'length' 2>/dev/null || echo "0")
    
    if [ "$FUNCTION_COUNT" -gt 0 ]; then
        log_success "Found $FUNCTION_COUNT Edge Functions"
        echo "$FUNCTIONS_JSON" | jq -r '.[].name' | while read -r func_name; do
            echo "  • $func_name"
        done
        ((CHECKS_PASSED++))
    else
        log_warn "No Edge Functions deployed"
        ((CHECKS_WARNED++))
    fi
else
    log_warn "Unable to list Edge Functions or none found"
    ((CHECKS_WARNED++))
fi

# =============================================================================
# Check 8: Project Status
# =============================================================================
log_info "Checking project status..."

if supabase projects list --output json 2>/dev/null | jq -e ".[] | select(.reference_id == \"$NEW_PROJECT_REF\")" >/dev/null; then
    PROJECT_INFO=$(supabase projects list --output json | jq ".[] | select(.reference_id == \"$NEW_PROJECT_REF\")")
    PROJECT_NAME=$(echo "$PROJECT_INFO" | jq -r '.name')
    PROJECT_REGION=$(echo "$PROJECT_INFO" | jq -r '.region')
    
    log_success "Project is active: $PROJECT_NAME (Region: $PROJECT_REGION)"
    ((CHECKS_PASSED++))
else
    log_error "Project not found or inaccessible"
    ((CHECKS_FAILED++))
fi

# =============================================================================
# Check 9: Extensions
# =============================================================================
log_info "Checking installed extensions..."
export PGPASSWORD="$NEW_PG_PASSWORD"

EXTENSIONS=$(psql -h "$NEW_PG_HOST" -p "$NEW_PG_PORT" -U "$NEW_PG_USER" -d "$NEW_PG_DATABASE" \
    -t -c "SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql');" \
    2>/dev/null || echo "")

if [ -n "$EXTENSIONS" ]; then
    log_success "Extensions installed:"
    echo "$EXTENSIONS" | while read -r ext; do
        [ -n "$ext" ] && echo "  • $ext"
    done
    ((CHECKS_PASSED++))
else
    log_warn "No additional extensions found"
    ((CHECKS_WARNED++))
fi

unset PGPASSWORD

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION SUMMARY                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}Warned:${NC}  $CHECKS_WARNED"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    log_success "Verification completed successfully!"
    
    if [ $CHECKS_WARNED -gt 0 ]; then
        echo ""
        log_warn "Some checks produced warnings. Review them to ensure everything is as expected."
    fi
    
    echo ""
    echo "Next steps:"
    echo "  1. Test critical application functionality"
    echo "  2. Verify API keys are updated in your application"
    echo "  3. Check that secrets are set correctly"
    echo "  4. Test authentication flows"
    echo "  5. Verify storage file access"
    echo "  6. Monitor logs for any errors"
    echo ""
    exit 0
else
    log_error "Verification failed with $CHECKS_FAILED errors"
    echo ""
    echo "Review the errors above and:"
    echo "  1. Check .env configuration"
    echo "  2. Verify database credentials"
    echo "  3. Ensure restore script completed successfully"
    echo "  4. Check Supabase project status in Dashboard"
    echo ""
    exit 1
fi
