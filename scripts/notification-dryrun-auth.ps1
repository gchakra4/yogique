param(
  [string]$ServiceRoleToken,
  [string]$SchedulerToken,
  [string]$BaseUrl = 'https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1'
)
$headers = @{ 'Content-Type' = 'application/json'; 'Authorization' = "Bearer $ServiceRoleToken" }
if ($SchedulerToken) { $headers['X-SCHED-SECRET'] = $SchedulerToken }

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

Write-Host "Using functions base: $BaseUrl`n" -ForegroundColor Yellow

$emailPayload = @{
  to = 'test@example.com'
  subject = 'Dry-run: Payment reminder'
  html = '<p>This is a dry-run test email.</p>'
  dry_run = $true
}
PostJson "$BaseUrl/send-email" $emailPayload

$waPayload = @{
  to = 'whatsapp:+919999999999'
  templateKey = 'yogique_payment_due_reminder'
  vars = @{ name = 'Test User'; invoice_number = 'INV-DRY-1'; amount = '500'; booking_id = $null }
  language = 'en'
  dry_run = $true
}
PostJson "$BaseUrl/send-template" $waPayload

$svcPayload = @{
  channel = 'email'
  to = 'test@example.com'
  subject = 'Service dry-run'
  html = '<p>Service dry run</p>'
  dry_run = $true
}
PostJson "$BaseUrl/notification-service" $svcPayload

Write-Host 'Dry-run complete.' -ForegroundColor Yellow
