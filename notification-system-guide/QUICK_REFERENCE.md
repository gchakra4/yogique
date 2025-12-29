# Quick Reference Card - Notification System

## 🚀 Getting Started

**Open**: `index.html` in any web browser

**Navigate**: Use the left sidebar to jump between pages

**Search**: Press Ctrl+F to search within any page

---

## 📑 Pages at a Glance

| Page | When to Use | Key Info |
|------|------------|----------|
| **index.html** | First time? Start here | Overview, concepts, quick start |
| **architecture.html** | Understanding design | Components, relationships, flow |
| **flow-diagram.html** | Seeing the big picture | Visual diagrams of processes |
| **components.html** | Learning internals | Detailed technical specs |
| **configuration.html** | Setting up the system | Env vars, database, setup checklist |
| **queue-management.html** | Daily monitoring | SQL queries, health checks, operations |
| **troubleshooting.html** | Something's broken | Common issues with solutions |

---

## 🔧 Key Environment Variables

### Email (Resend)
```
RESEND_API_KEY=re_XXXX
CLASSES_FROM_EMAIL=classes@yogique.life
INVOICE_FROM_EMAIL=invoices@yogique.life
```

### WhatsApp (Meta)
```
META_PHONE_NUMBER_ID=102938456789012
META_ACCESS_TOKEN=EAAB...
```

### Database
```
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Scheduler
```
SCHEDULER_SECRET_HEADER=X-SCHED-SECRET
SCHEDULER_SECRET_TOKEN=your-token
```

---

## 📊 Database Tables

### notifications_queue
Main queue for pending notifications
- **Statuses**: pending, processing, sent, failed
- **Channels**: email, whatsapp
- **Key field**: `run_after` (when to process)

### message_audit
Log of all notification deliveries
- Tracks who received what
- Provider message IDs
- Sent/failed status

### wa_templates
WhatsApp message templates
- Template names and bodies
- Variable placeholders: {{var_name}}
- Language support

---

## 🎯 Check Queue Health (30 seconds)

```sql
-- Run this to see overall status
SELECT status, COUNT(*) FROM notifications_queue GROUP BY status;

-- Expected output for healthy system:
-- pending    | 0-2
-- processing | 0
-- sent       | many
-- failed     | 0-5
```

---

## 🔍 Troubleshooting Flowchart

```
Problem: Notifications not sending
  ├─ Are any notifications in the queue?
  │  └─ No → Check if notifications being created
  │  └─ Yes → Continue...
  │
  ├─ Check status of those notifications
  │  ├─ status='pending' → Worker not running
  │  ├─ status='processing' → Worker crashed
  │  ├─ status='failed' → Check last_error
  │  └─ status='sent' → Check email/WhatsApp delivery
  │
  └─ Fix based on status
```

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing RESEND_API_KEY" | Config missing | Set env var in Supabase |
| "Template not found" | WhatsApp template not approved | Wait 24h after Meta approval |
| "Invalid phone number" | Wrong format | Use: +[country][number] |
| "rate limited" | Too many requests | Increase backoff settings |
| stuck in processing | Worker crashed | Mark as failed, restart worker |

---

## 📝 Daily Checklist (5 minutes)

- [ ] Check queue health (see above)
- [ ] View failed notifications: `SELECT * FROM notifications_queue WHERE status='failed' LIMIT 5;`
- [ ] Look at error messages in last_error column
- [ ] Restart worker if stuck in processing
- [ ] Retry failed notifications if needed

---

## 🔧 Common SQL Operations

### View failed notifications
```sql
SELECT id, recipient, last_error FROM notifications_queue 
WHERE status='failed' ORDER BY created_at DESC LIMIT 10;
```

### Retry failed notification
```sql
UPDATE notifications_queue 
SET status='pending', run_after=NOW() 
WHERE id='notification-id';
```

### View queue by channel
```sql
SELECT channel, status, COUNT(*) FROM notifications_queue 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel, status;
```

### Clean old sent notifications
```sql
DELETE FROM notifications_queue 
WHERE status='sent' AND created_at < NOW() - INTERVAL '30 days';
```

---

## 💡 Pro Tips

1. **Save this card** for quick reference
2. **Bookmark troubleshooting.html** in your browser
3. **Print queue-management.html** for desk reference
4. **Share configuration.html** with your team
5. **Monitor queue.html** daily during business hours

---

## ⚠️ Emergency Procedures

### System Down - Stop All Notifications
```sql
UPDATE notifications_queue 
SET run_after=NOW()+INTERVAL '1 hour' 
WHERE status='pending';
```

### Check If Worker is Running
```sql
SELECT COUNT(*) FROM notifications_queue 
WHERE updated_at > NOW() - INTERVAL '15 minutes';
-- Should be > 0
```

### Mark Stuck as Failed
```sql
UPDATE notifications_queue 
SET status='failed', last_error='Marked failed by admin' 
WHERE status='processing' AND updated_at < NOW()-INTERVAL '10 min';
```

---

## 📞 Need Help?

1. **Configuration issues** → See configuration.html
2. **Something not working** → See troubleshooting.html
3. **Need SQL queries** → See queue-management.html
4. **Want to understand system** → See architecture.html

---

## 🎯 Your Next Steps

1. Open `index.html` for overview
2. Go to `configuration.html` if setting up
3. Bookmark `troubleshooting.html` for quick access
4. Check `queue-management.html` daily
5. Share with your team

---

**Quick Link**: Jump to any page using the sidebar navigation

**Keyboard Shortcut**: Ctrl+F to search within page

**Print Tip**: Use browser Print function for PDF copy

---

*Last Updated: December 29, 2025*
