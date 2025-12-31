# How to reply to the Google verification thread in Gmail and attach evidence

Quick checklist (what you must gather before replying)
- [ ] Screenshot of DNS provider showing the TXT record
- [ ] Terminal output (dig/nslookup) showing the TXT record
- [ ] Screenshot of Google verification success page (after you click Verify)
- [ ] Screenshots of live privacy and terms pages:
  - https://yogique.life/privacy
  - https://yogique.life/terms
- [ ] OAuth Client ID and Project ID (already recorded)

Step-by-step: reply in Gmail
1. Open Gmail where you received the verification thread (same account used for the Google Cloud project).
2. Find the thread:
   - Search for the sender or subject: try "from:(noreply-verification@google.com) OR subject:(Verification) OR subject:(OAuth)".
   - If you received a direct Trust & Safety email, open that thread.
3. Click "Reply" (do NOT start a new thread) so Trust & Safety retains context.
4. Attach evidence:
   - Click the paperclip (Attach files) icon and upload:
     - DNS provider screenshot
     - A text file or screenshot with the dig/nslookup output
     - Google verification success screenshot
     - Privacy and Terms screenshots
   - Optionally drag images into the reply body.
5. Paste the ready-to-send message (below) into the reply and update any placeholders.
6. Send the reply. Keep the thread; monitor for Google responses.

If you prefer to upload from Google Cloud Console instead
- Open the Cloud Console verification screen where you saw the "Homepage requirements" message.
- If there is an "Upload evidence" or "Reply" link in the verification card, use it to attach the same files and paste the same message. Otherwise reply in the email thread (Gmail).

Ready-to-paste email body (update DNS provider and timestamp before sending)
```text
Subject: Domain verification evidence for Yogique (Project: Yogique)

Hello Trust & Safety team,

I have added the Google verification TXT record to the DNS for yogique.life and am submitting evidence for OAuth/app verification.

Details
- Domain: https://yogique.life
- Project ID: Yogique
- OAuth Client ID: 196749664391-vdefv78ahi97j38f5bl9foegptf9nt96.apps.googleusercontent.com
- DNS TXT value added: google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE
- DNS provider: [fill provider, e.g., Cloudflare / GoDaddy / Route 53]
- Date/time added (timezone): [fill timestamp]

Attached evidence:
1) Screenshot of the DNS provider console showing the TXT record value.
2) Terminal output of `dig TXT yogique.life +short` (or `nslookup -type=TXT yogique.life`) showing the TXT record.
3) Screenshot of Google verification success page (after you click Verify).
4) Screenshots of live Privacy and Terms pages:
   - https://yogique.life/privacy
   - https://yogique.life/terms

Short summary:
I added the TXT record for domain verification to the DNS for `yogique.life`. Attached are DNS console screenshot, authoritative DNS query output showing the TXT value, and the Search Console/verification screenshot. OAuth Client ID and Project ID are listed above.

Regards,
Yogique Team
```

Notes
- Keep the original verification email thread when replying so Google can correlate your evidence with the verification request.
- If any attachments are too large, compress or provide a text file for terminal output and smaller PNG/JPEG screenshots.
- After sending, paste the reply timestamp and any confirmation you get from Google here so I can finalize the verification report.

