# WhatsApp Templates Reference

This document lists all WhatsApp templates and their expected `vars` array format when creating `notifications_queue` rows.

## Important Rules

1. **Always use arrays for `vars`**, not objects (positional parameters match template `{{1}}`, `{{2}}`, etc.)
2. **Set `template_language` to match the exact language code in `wa_templates` table** (case-sensitive: `en_IN` not `en_in`)
3. **Order matters** - vars must be in exact order shown below

---

## Template: `class_reminder_zoom`

**Language:** `en_IN`  
**Template Key:** `class_reminder_zoom`  
**Meta Name:** `class_reminder_zoom`

### Expected vars array:
```javascript
[
  name,        // Student name (e.g., "Gourab")
  date,        // Date string (e.g., "29 Dec 2025")
  time,        // Time string (e.g., "7.30 PM")
  zoom_link    // Full Zoom join URL
]
```

### Example notification_queue row:
```javascript
{
  channel: 'whatsapp',
  recipient: '+919876543210',
  template_key: 'class_reminder_zoom',
  template_language: 'en_IN',  // Must match DB exactly
  vars: [
    'Gourab Chakraborty',
    '29 Dec 2025',
    '7.30 PM',
    'https://zoom.us/j/86427553426?pwd=...'
  ],
  metadata: { class_id: '...', user_id: '...' },
  status: 'pending',
  attempts: 0,
  run_after: new Date().toISOString()
}
```

---

## Template: `yogique_next_class_alerts`

**Language:** `en`  
**Template Key:** `yogique_next_class_alerts`

### Expected vars array:
```javascript
[
  name,        // Student name
  class_name,  // Class title/name
  date,        // Date string
  time,        // Time string
  zoom_link    // Full Zoom join URL
]
```

---

## Template: `yogique_payment_due_reminder`

**Language:** `en`  
**Template Key:** `yogique_payment_due_reminder`

### Expected vars array:
```javascript
[
  name,            // Customer name
  period,          // Billing period (e.g., "January 2026")
  invoice_number,  // Invoice number/ID
  amount,          // Amount string (e.g., "₹3000")
  url_token        // Payment link token/ID
]
```

### Button:
- URL button with dynamic suffix (uses var after body vars)

---

## Template: `yogique_otp_phone_verification`

**Language:** `en`  
**Template Key:** `yogique_otp_phone_verification`

### Expected vars array:
```javascript
[
  otp_code  // 6-digit OTP
]
```

### Button:
- Copy code button

---

## Template: `yogique_invoice_generated`

**Language:** `en`  
**Template Key:** `yogique_invoice_generated`

### Expected vars array:
```javascript
[
  name,            // Customer name
  amount,          // Invoice amount
  period,          // Billing period
  url_token        // Invoice/payment link token
]
```

---

## Template: `yogique_payment_successful` / `yogique_payment_success`

**Language:** `en_IN` (for `yogique_payment_successful`) / `en` (for `yogique_payment_success`)  
**Template Keys:** `yogique_payment_successful`, `yogique_payment_success`

### Expected vars array:
```javascript
[
  name,     // Customer name
  amount,   // Payment amount
  date      // Payment date
]
```

---

## Template: `yogique_booking_confirmation`

**Language:** `en`  
**Template Key:** `yogique_booking_confirmation`

### Expected vars array:
```javascript
[
  name,         // Customer name
  booking_id,   // Booking reference ID
  class_name,   // Class/package name
  start_date    // Start date
]
```

### Button:
- Phone number button (to contact support)

---

## How to Add a New Template

1. **Export from Meta** using `fetch-wa-template` function or manual Graph API call
2. **Parse and insert** into `public.wa_templates` table with correct structure:
   - `key` - Your internal reference (snake_case)
   - `meta_name` - Exact name from Meta
   - `language` - Exact language code from Meta (e.g., `en_IN`, `en_US`)
   - `components` - Full JSON from Meta template
3. **Document here** with vars array order
4. **Update business functions** that create queue rows to provide vars in correct order

---

## Common Mistakes to Avoid

❌ **Wrong:** Using objects for vars
```javascript
vars: { name: 'John', date: '2026-01-01' }  // WRONG
```

✅ **Correct:** Using arrays
```javascript
vars: ['John', '2026-01-01']  // CORRECT
```

❌ **Wrong:** Case mismatch on language
```javascript
template_language: 'en_in'  // WRONG (DB has en_IN)
```

✅ **Correct:** Exact match
```javascript
template_language: 'en_IN'  // CORRECT
```

❌ **Wrong:** Wrong order or missing vars
```javascript
vars: ['https://zoom.us/...', 'John']  // WRONG order
```

✅ **Correct:** Match template order
```javascript
vars: ['John', '29 Dec 2025', '7.30 PM', 'https://zoom.us/...']  // CORRECT
```

---

## Reference: Template Components

WhatsApp templates can have:
- **HEADER** (optional): Text, image, video, or document
- **BODY** (required): Main message with `{{1}}`, `{{2}}`, etc. placeholders
- **FOOTER** (optional): Small text at bottom
- **BUTTONS** (optional): Quick reply, URL, or phone number buttons

Variables (`{{1}}`, `{{2}}`, ...) are numbered **sequentially across all components** (header counts as `{{1}}` if it has a variable, then body starts at `{{2}}`).

See `wa_templates_parsed.json` for full component details of each template.
