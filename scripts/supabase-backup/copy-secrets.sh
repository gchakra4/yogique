#!/usr/bin/env bash

# =============================================================================
# Copy Secrets from Old to New Project
# =============================================================================
# This script helps copy secrets between Supabase projects
# Note: You must manually copy the VALUES from the old project dashboard
# =============================================================================

set -euo pipefail

OLD_PROJECT="iddvvefpwgwmgpyelzcv"
NEW_PROJECT="qkqonewssbldfckqmbvp"

echo "=============================================="
echo "Secret Migration Helper"
echo "=============================================="
echo ""
echo "You have 23 secrets to migrate:"
echo ""

# List of secrets from old project
secrets=(
    "CLASSES_ADMIN_EMAIL"
    "CLASSES_FROM_EMAIL"
    "DEBUG_SEND_GUIDE"
    "GUIDE_BUCKET"
    "GUIDE_PATH"
    "INVOICE_FROM_EMAIL"
    "PUBLIC_SITE_URL"
    "RESEND_API_KEY"
    "SCHEDULER_SECRET_HEADER"
    "SCHEDULER_SECRET_TOKEN"
    "SEND_GUIDE_FROM_EMAIL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_DB_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_URL"
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "TWILIO_SMS_FROM"
    "TWILIO_WHATSAPP_FROM"
    "ZOOM_ACCOUNT_ID"
    "ZOOM_CLIENT_ID"
    "ZOOM_CLIENT_SECRET"
    "gourab.master@gmail.com"
)

echo "STEP 1: Get values from OLD project dashboard"
echo "  → https://supabase.com/dashboard/project/$OLD_PROJECT/settings/functions"
echo ""
echo "STEP 2: Set them in NEW project using commands below:"
echo ""

# Link to new project first
echo "# Link to new project:"
echo "export SUPABASE_ACCESS_TOKEN=\"sbp_a2f0a9914c45b2d93e542a92a8dc0d351eda1060\""
echo "supabase link --project-ref $NEW_PROJECT"
echo ""

# Generate commands for each secret
for secret in "${secrets[@]}"; do
    echo "# Set $secret"
    echo "supabase secrets set $secret=\"PASTE_VALUE_HERE\" --project-ref $NEW_PROJECT"
    echo ""
done

echo "=============================================="
echo "Or set all at once (after filling in values):"
echo "=============================================="
echo ""
echo "cat <<EOF | supabase secrets set --project-ref $NEW_PROJECT"
for secret in "${secrets[@]}"; do
    echo "$secret=PASTE_VALUE_HERE"
done
echo "EOF"
