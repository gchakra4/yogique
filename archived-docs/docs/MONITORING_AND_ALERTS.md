# Monitoring & Alerts

Metrics to track
- `notifications_queue` depth (rows with status = 'pending').
- `notification_worker` failures (rows with status = 'failed' or attempts > threshold).
- Provider error rate (from `message_audit` rows with status 'failed').

Alert rules
- High queue depth: pending rows > 100 → Pager priority 2.
- Repeated send failures: >10 failed rows in 10 minutes → Pager priority 1.

Integration
- `NOTIFICATION_ALERT_AFTER` env triggers a POST to `MONITORING_WEBHOOK_URL` with details.

Dashboards
- Add dashboard panels for queue depth, worker attempt rates, average send latency.
