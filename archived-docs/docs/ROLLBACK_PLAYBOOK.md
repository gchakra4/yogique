# Rollback Playbook

Goal: safely revert recent deployment or mitigate a broken release.

Options
- Functions: revert to previous version via Supabase Dashboard (Functions → Versions) or re-deploy earlier commit tag.
- DB migrations: prefer forward-fix migrations. If strict rollback needed, create compensating migrations to restore previous schema/data.

Immediate mitigation
1. Disable worker: set `NOTIFICATION_WORKER_LIMIT=0` or pause scheduled invocation to stop processing new rows.
2. Disable `notification-service`/`send-template` by removing function or revoking `SUPERUSER_API_TOKEN` temporarily (use with caution).
3. Restore critical DB state from backups if necessary.

Recovery
- Patch the code and re-deploy functions, then re-enable worker.
- Use compensating SQL migrations to correct schema or data changes.
