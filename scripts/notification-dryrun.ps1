<#
PowerShell dry-run script for notification functions.

Usage:
  Set-Location to the repo root and run:
    .\scripts\notification-dryrun.ps1

Optional env vars:
  SUPABASE_FUNCTIONS_BASE - base URL for functions (default: http://localhost:54321/functions/v1)
  SCHEDULER_SECRET_HEADER and SCHEDULER_SECRET_TOKEN - included as header if present
#>

$base = $env:SUPABASE_FUNCTIONS_BASE
if (-not $base) { $base = 'http://localhost:54321/functions/v1' }

$headers = @{ 'Content-Type' = 'application/json' }
if ($env:SCHEDULER_SECRET_HEADER -and $env:SCHEDULER_SECRET_TOKEN) {
  $headers[$env:SCHEDULER_SECRET_HEADER] = $env:SCHEDULER_SECRET_TOKEN
}

function PostJson($url, $bodyObj) {
  $json = $bodyObj | ConvertTo-Json -Depth 10
  Write-Host "POST $url`nPayload:`n$json`n" -ForegroundColor Cyan
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $json -ErrorAction Stop
    Write-Host "Response:`n" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 10 | Write-Host
  } catch {
    $errMsg = $_.Exception.Message
    Write-Host ("Error calling {0}`n{1}" -f $url, $errMsg) -ForegroundColor Red
  }
  Write-Host "`n----------------------------------------`n"
}

Write-Host "Using functions base: $base`n" -ForegroundColor Yellow

# 1) send-email dry run
$emailPayload = @{
  to = 'test@example.com'
  subject = 'Dry-run: Payment reminder'
  html = '<p>This is a dry-run test email.</p>'
  dry_run = $true
}
PostJson "$base/send-email" $emailPayload

# 2) send-template dry run (WhatsApp)
$waPayload = @{
  to = 'whatsapp:+919999999999'
  templateKey = 'yogique_payment_due_reminder'
  vars = @{ name = 'Test User'; invoice_number = 'INV-DRY-1'; amount = '500'; booking_id = $null }
  language = 'en'
  dry_run = $true
}
PostJson "$base/send-template" $waPayload

# 3) notification-service direct dry run (optional)
$svcPayload = @{
  channel = 'email'
  to = 'test@example.com'
  subject = 'Service dry-run'
  html = '<p>Service dry run</p>'
  dry_run = $true
}
PostJson "$base/notification-service" $svcPayload

Write-Host 'Dry-run complete.' -ForegroundColor Yellow
