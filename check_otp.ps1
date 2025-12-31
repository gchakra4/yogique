# Query Supabase tables via REST API
$SUPABASE_URL = "https://qkqonewssbldfckqmbvp.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcW9uZXdzc2JsZGZja3FtYnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU0Nzg4MSwiZXhwIjoyMDgxMTIzODgxfQ.K-Lf0u0ZaSdVNa7OPoIid6X3eJ2Dhdhx_0Wpl1nRb_w"

$headers = @{
    "apikey"        = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type"  = "application/json"
}

Write-Host "`n=== Checking OTP Entry ===" -ForegroundColor Cyan
$otpUrl = "$SUPABASE_URL/rest/v1/otp_codes?id=eq.d07422eb-c192-455a-ae37-a6e01d81c6ae&select=*"
$otp = Invoke-RestMethod -Uri $otpUrl -Headers $headers -Method Get
$otp | ConvertTo-Json

Write-Host "`n=== Checking message_audit ===" -ForegroundColor Cyan
$auditUrl = "$SUPABASE_URL/rest/v1/message_audit?recipient=eq.%2B918240262455&created_at=gte.2025-12-31T09:30:00&select=*&order=created_at.desc&limit=5"
$audit = Invoke-RestMethod -Uri $auditUrl -Headers $headers -Method Get
if ($audit.Count -eq 0) {
    Write-Host "NO MESSAGE_AUDIT ENTRIES FOUND - Message was never sent!" -ForegroundColor Red
}
else {
    $audit | ConvertTo-Json
}

Write-Host "`n=== Checking notifications_queue ===" -ForegroundColor Cyan
$queueUrl = "$SUPABASE_URL/rest/v1/notifications_queue?recipient=like.*8240262455*&created_at=gte.2025-12-31T09:30:00&select=*&order=created_at.desc&limit=5"
try {
    $queue = Invoke-RestMethod -Uri $queueUrl -Headers $headers -Method Get -ErrorAction Stop
    if ($queue.Count -eq 0) {
        Write-Host "No notifications_queue entries found" -ForegroundColor Yellow
    }
    else {
        $queue | ConvertTo-Json
    }
}
catch {
    Write-Host "notifications_queue table may not exist: $($_.Exception.Message)" -ForegroundColor Yellow
}
