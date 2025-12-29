$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHZ2ZWZwd2d3bWdweWVsemN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEwMTAxNSwiZXhwIjoyMDY2Njc3MDE1fQ.Mo2P8spulIyaypYh5SbqTH2wo1_XzezXSjqQBmOdLPY'
$url = 'https://iddvvefpwgwmgpyelzcv.supabase.co/rest/v1/message_audit?select=*&order=created_at.desc&limit=20'
$headers = @{ apikey = $token; Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
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
