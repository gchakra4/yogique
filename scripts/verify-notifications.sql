# Quick verification queries for notification system
# Run these in Supabase SQL Editor

-- 1. Check queue health
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM notifications_queue
GROUP BY status;

-- 2. Recent notifications (last 24 hours)
SELECT 
  id,
  channel,
  recipient,
  status,
  attempts,
  created_at,
  last_error
FROM notifications_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Failed notifications with errors
SELECT 
  id,
  channel,
  recipient,
  attempts,
  last_error,
  created_at
FROM notifications_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Message audit summary (delivery tracking)
SELECT 
  channel,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_delivery
FROM message_audit
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel, status;

-- 5. Check for stuck processing notifications
SELECT 
  id,
  channel,
  recipient,
  updated_at,
  NOW() - updated_at as stuck_duration
FROM notifications_queue
WHERE status = 'processing'
  AND updated_at < NOW() - INTERVAL '10 minutes';

-- 6. WhatsApp templates available
SELECT key, meta_name, language, approved, status
FROM wa_templates
ORDER BY key;
