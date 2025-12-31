# Backups & restore

Procedures
- Create dump (custom format):
  pg_dump -h <host> -p <port> -U <user> -d <db> -Fc --no-owner --no-acl -f ./prod_db.dump

- Restore custom dump:
  pg_restore -h 127.0.0.1 -p 54322 -U postgres -d postgres --no-owner --no-acl --clean --if-exists ./prod_db.dump

- Import plain SQL (ensure UTF-8):
  psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ./file.sql

Notes
- Storage objects are not included in DB dumps. Use Storage API to copy files.
- Do not store secrets in backups; encrypt and store offsite.
