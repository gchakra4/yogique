# Maintenance & monitoring

Suggested schedule
- Backups: daily (rotate 7-30 days).
- Test restore: weekly or monthly.
- Audit logs: enable and review weekly.

Monitoring
- Set alerts for large exports, many failed auth attempts, or spikes in query time.
- Track connection/idle pool usage; use a pooler in production.

Playbook
- Steps to rotate keys, revoke compromised tokens, and restore from backup (link to `backups-and-restore.md`).
