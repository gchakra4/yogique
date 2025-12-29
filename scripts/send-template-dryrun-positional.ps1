param(
  [string]$ServiceRoleToken,
  [string]$SchedulerToken,
  [string]$BaseUrl = 'https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1'
)
$headers = @{ 'Content-Type' = 'application/json'; 'Authorization' = "Bearer $ServiceRoleToken" }
if ($SchedulerToken) { $headers['X-SCHED-SECRET'] = $SchedulerToken }

$payload = @{
  to = 'whatsapp:+919999999999'
  templateKey = 'yogique_payment_due_reminder'
  vars = @('Test User','December 2025','INV-DRY-1','500','dhgsdjh23jjwy3udhh2829')
  language = 'en'
  dry_run = $true
}
$json = $payload | ConvertTo-Json -Depth 10
Write-Host "POST $BaseUrl/send-template`nPayload:`n$json`n" -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/send-template" -Headers $headers -Body $json -ErrorAction Stop
  Write-Host "Response:`n" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 10 | Write-Host
} catch {
  Write-Host "Error calling send-template:`n$($_.Exception.Message)" -ForegroundColor Red
}
