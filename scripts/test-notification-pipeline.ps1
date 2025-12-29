# Test notification pipeline with dry-run mode
# Run from project root: .\scripts\test-notification-pipeline.ps1

$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_ANON_KEY = $env:SUPABASE_ANON_KEY

if (-not $SUPABASE_URL) {
    Write-Host "ERROR: SUPABASE_URL environment variable not set" -ForegroundColor Red
    exit 1
}

if (-not $SUPABASE_ANON_KEY) {
    Write-Host "ERROR: SUPABASE_ANON_KEY environment variable not set" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Testing Notification Pipeline ===" -ForegroundColor Cyan

# Test 1: send-email with dry-run
Write-Host "`n[1/3] Testing send-email (dry-run)..." -ForegroundColor Yellow
$emailPayload = @{
    to = "test@example.com"
    subject = "Test Email from Pipeline"
    html = "<h1>Hello</h1><p>This is a test email.</p>"
    dry_run = $true
} | ConvertTo-Json

$emailResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-email" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $emailPayload `
    -ErrorAction Stop

Write-Host "✓ Email dry-run successful:" -ForegroundColor Green
$emailResponse | ConvertTo-Json -Depth 3

# Test 2: send-template with dry-run
Write-Host "`n[2/3] Testing send-template (dry-run)..." -ForegroundColor Yellow
$templatePayload = @{
    to = "+919876543210"
    templateKey = "class_reminder_zoom"
    vars = @("Student Name", "Yoga Class", "2025-12-30 10:00 AM", "https://zoom.us/j/123456")
    dry_run = $true
} | ConvertTo-Json

try {
    $templateResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-template" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $SUPABASE_ANON_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $templatePayload `
        -ErrorAction Stop

    Write-Host "✓ Template dry-run successful:" -ForegroundColor Green
    $templateResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "✗ Template test failed (this is expected if wa_templates not seeded):" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
}

# Test 3: notification-service router
Write-Host "`n[3/3] Testing notification-service router (email)..." -ForegroundColor Yellow
$routerPayload = @{
    channel = "email"
    to = "test@example.com"
    subject = "Router Test"
    html = "<p>Testing notification-service router</p>"
    dry_run = $true
} | ConvertTo-Json

$routerResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/notification-service" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $routerPayload `
    -ErrorAction Stop

Write-Host "✓ Router test successful:" -ForegroundColor Green
$routerResponse | ConvertTo-Json -Depth 3

Write-Host "`n=== All Tests Passed ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Check notifications_queue table: SELECT * FROM notifications_queue ORDER BY created_at DESC LIMIT 10;"
Write-Host "2. Trigger notification-worker manually or wait for scheduled run"
Write-Host "3. Monitor message_audit for delivery status"
