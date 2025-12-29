param(
  [string]$ServiceRoleToken,
  [string]$SchedulerToken,
  [string]$EmailTo = 'gourab.master@gmail.com',
  [string]$WhatsappTo = 'whatsapp:+919088951685',
  [string]$BaseUrl = 'https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1'
)
$headers = @{ 'Content-Type' = 'application/json'; 'Authorization' = "Bearer $ServiceRoleToken" }
if ($SchedulerToken) { $headers['X-SCHED-SECRET'] = $SchedulerToken }

function PostJson($url, $bodyObj) {
  $json = $bodyObj | ConvertTo-Json -Depth 12
  Write-Host "POST $url`nPayload:`n$json`n" -ForegroundColor Cyan
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $json -ErrorAction Stop
    Write-Host "Response:`n" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 12 | Write-Host
  } catch {
    Write-Host (("Error calling {0}`n{1}" -f $url, $_.Exception.Message)) -ForegroundColor Red
  }
  Write-Host "`n----------------------------------------`n"
}

Write-Host "Using functions base: $BaseUrl`n" -ForegroundColor Yellow

# 1) Send real email via notification-service
$emailPayload = @{
  channel = 'email'
  to = $EmailTo
  subject = 'Test: live payment reminder'
  html = '<p>This is a live test email sent by the notification system.</p>'
}
PostJson "$BaseUrl/notification-service" $emailPayload

# 2) Send real WhatsApp template (positional vars) via send-template
$waPayload = @{
  to = $WhatsappTo
  templateKey = 'yogique_payment_due_reminder'
  vars = @('Gourab','December 2025','INV-REAL-1','500','real-invoice-12345')
  language = 'en'
}
PostJson "$BaseUrl/send-template" $waPayload

Write-Host 'Live send attempts complete.' -ForegroundColor Yellow
