# Notification System Admin Guide

A comprehensive HTML documentation guide for managing and troubleshooting the Yogique notification system.

## Contents

This guide contains interactive documentation pages:

1. **index.html** - Overview and introduction
2. **architecture.html** - System architecture and diagrams
3. **flow-diagram.html** - Detailed flow diagrams
4. **components.html** - Detailed component descriptions
5. **configuration.html** - Setup and configuration guide
6. **queue-management.html** - Queue monitoring and SQL queries
7. **troubleshooting.html** - Common issues and solutions

## How to Use

### Opening the Guide

1. **Locally**: Open `index.html` in any web browser
2. **On Server**: Deploy these files to your web server
3. **Extract**: This entire folder can be extracted and shared independently

### Navigation

- Use the left sidebar to navigate between pages
- All pages are self-contained HTML files
- No internet connection required (except for external links)

## Features

✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **No Dependencies** - Pure HTML/CSS, no frameworks required
✅ **SQL Queries** - Copy-paste ready database queries
✅ **Searchable** - Use browser Find (Ctrl+F) to search within pages
✅ **Offline** - Works completely offline
✅ **Printable** - Each page can be printed to PDF

## Quick Reference

### Key Tables

- **notifications_queue** - Main queue table for pending notifications
- **message_audit** - Log of all notification sends
- **wa_templates** - WhatsApp message templates

### Environment Variables

**Email (Resend):**
- `RESEND_API_KEY`
- `CLASSES_FROM_EMAIL`
- `INVOICE_FROM_EMAIL`

**WhatsApp (Meta):**
- `META_PHONE_NUMBER_ID`
- `META_ACCESS_TOKEN`

**Database:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Common Queries

**Check queue health:**
```sql
SELECT status, COUNT(*) FROM notifications_queue GROUP BY status;
```

**View failed notifications:**
```sql
SELECT * FROM notifications_queue WHERE status = 'failed' LIMIT 10;
```

**Retry failed notifications:**
```sql
UPDATE notifications_queue
SET status = 'pending', run_after = NOW()
WHERE status = 'failed';
```

## Guide Pages Summary

### 📋 Overview (index.html)
Introduction to the notification system, key concepts, and quick start guide.

### 🏗️ Architecture (architecture.html)
System components, data flow, and integration points.

### 📊 Flow Diagram (flow-diagram.html)
Visual diagrams showing notification flow from creation to delivery.

### 🔧 Components (components.html)
Detailed documentation of each system component:
- notifications_queue table
- notification-worker edge function
- notification-service router
- send-email function
- send-template function
- message_audit table

### ⚙️ Configuration (configuration.html)
Complete setup guide including:
- Environment variables
- Email domain setup (Resend)
- WhatsApp template setup (Meta)
- Database table creation
- Pre-launch checklist

### 📦 Queue Management (queue-management.html)
Monitoring and maintenance:
- Queue health monitoring
- SQL queries for common tasks
- Bulk operations
- Database maintenance
- Troubleshooting queries

### 🔍 Troubleshooting (troubleshooting.html)
Solutions for common issues:
- Notifications not sending
- Email bouncing
- WhatsApp errors
- Performance issues
- Emergency procedures

## Maintenance

### Regular Checks
- Monitor queue health hourly during business hours
- Check for failed notifications weekly
- Archive old records monthly
- Review error patterns weekly

### Scaling
- Increase `NOTIFICATION_WORKER_LIMIT` as volume grows
- Archive notifications older than 30 days
- Monitor database table size
- Add indexes for custom queries

## Support Resources

**External Links** (in configuration.html):
- [Resend Dashboard](https://resend.com)
- [Supabase Dashboard](https://app.supabase.com)
- [Meta Business Suite](https://business.facebook.com)

## Deployment

### For Production
1. Extract this folder to your web server
2. Place in a protected directory (behind authentication)
3. Serve over HTTPS
4. Consider using basic auth or IP restriction

### For Team Sharing
1. Zip this folder
2. Share via email or file storage
3. Team members can extract and open `index.html` locally
4. No installation required

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (CSS Grid, modern syntax)

## File Structure

```
notification-system-guide/
├── index.html                 # Main entry point
├── architecture.html          # Architecture overview
├── flow-diagram.html          # Flow diagrams
├── components.html            # Component documentation
├── configuration.html         # Configuration guide
├── queue-management.html      # Queue monitoring
├── troubleshooting.html       # Troubleshooting guide
├── styles.css                 # Shared styles
└── README.md                  # This file
```

## Customization

To customize for your organization:

1. **Update Logo**: Edit the `.logo` section in each HTML file
2. **Add Company Colors**: Modify CSS variables in `styles.css`
3. **Add Internal Links**: Add custom pages and link from sidebar
4. **Localization**: Translate HTML content as needed

## Tips for Administrators

1. **Bookmark the guide** in your browser
2. **Print troubleshooting page** for quick reference
3. **Share queue-management.html** with database admins
4. **Update configuration.html** with your specific setup
5. **Add internal links** to your wiki or knowledge base

## Version History

- **v1.0** (2025-12-29) - Initial release
  - Complete system documentation
  - Troubleshooting guide
  - Queue management queries
  - Configuration guide

## License

This documentation is part of the Yogique notification system.

## Last Updated

December 29, 2025

---

**Quick Links:**
- [System Overview](index.html)
- [Setup Guide](configuration.html)
- [Troubleshooting](troubleshooting.html)
- [Queue Monitoring](queue-management.html)
