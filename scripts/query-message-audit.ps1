param(
  [string]$Token,
  [string]$BaseUrl = 'https://iddvvefpwgwmgpyelzcv.supabase.co'
)

if (-not $Token) { $Token = $env:SUPABASE_SERVICE_ROLE }
if (-not $Token) { Write-Host 'ERROR: No token provided. Pass as parameter or set SUPABASE_SERVICE_ROLE env var.'; exit 1 }

$url = "$BaseUrl/rest/v1/message_audit?select=*&order=created_at.desc&limit=20"
$headers = @{ apikey = $Token; Authorization = "Bearer $Token"; 'Content-Type' = 'application/json' }
try {
  $r = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
  $json = $r | ConvertTo-Json -Depth 6
  Write-Host $json
} catch {
  Write-Host "Error: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $_.Exception.Response | Select-Object -Property StatusCode, StatusDescription | ConvertTo-Json | Write-Host
  }
}
