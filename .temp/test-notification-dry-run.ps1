# Test notification dry run
$ErrorActionPreference = 'Stop'

# Read the payload
$payload = Get-Content -Raw -Path '.\.temp\send_template_payload.json'

Write-Host "=== Notification Dry Run Test ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Payload:" -ForegroundColor Yellow
$payload | ConvertFrom-Json | ConvertTo-Json -Depth 10
Write-Host ""

# Try calling the remote edge function (will fail due to env vars not being set remotely)
Write-Host "Attempting to call remote edge function..." -ForegroundColor Yellow
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHZ2ZWZwd2d3bWdweWVsemN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEwMTAxNSwiZXhwIjoyMDY2Njc3MDE1fQ.Mo2P8spulIyaypYh5SbqTH2wo1_XzezXSjqQBmOdLPY'
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
    'apikey' = $token
}

try {
    $result = Invoke-RestMethod -Uri 'https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1/send-template' -Method Post -Headers $headers -Body $payload -ContentType 'application/json'
    Write-Host "Success!" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "X Remote call failed (expected if env vars not configured):" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Note: To make this work, you need to set the following secrets in Supabase:" -ForegroundColor Yellow
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
    Write-Host "  - META_WHATSAPP_TOKEN" -ForegroundColor Gray
    Write-Host "  - META_PHONE_NUMBER_ID" -ForegroundColor Gray
}
