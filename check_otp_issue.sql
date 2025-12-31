-- Check message_audit for this phone number
SELECT 
    id,
    channel,
    recipient,
    provider,
    provider_message_id,
    status,
    attempts,
    metadata->'provider_payload' as provider_response,
    created_at
FROM message_audit 
WHERE recipient = '+918240262455' 
AND created_at > '2025-12-31 09:30:00'::timestamptz
ORDER BY created_at DESC;

-- Check notifications_queue
SELECT 
    id,
    channel,
    recipient,
    template_key,
    status,
    last_error,
    attempts,
    created_at
FROM notifications_queue 
WHERE recipient LIKE '%8240262455%'
AND created_at > '2025-12-31 09:30:00'::timestamptz
ORDER BY created_at DESC;

-- Check the OTP entry details
SELECT 
    id,
    user_id,
    phone,
    channel,
    provider,
    attempts,
    expires_at,
    used,
    created_at
FROM otp_codes
WHERE id = 'd07422eb-c192-455a-ae37-a6e01d81c6ae';
