# Ready-to-send reply to Google Trust & Safety — Yogique

Subject: Domain verification evidence for Yogique (Project: Yogique)

Body (copy & paste into your reply email):

Hello Trust & Safety team,

I have added the Google verification TXT record to the DNS for Yogique.com and am submitting evidence for OAuth/app verification.

Details
- Domain: https://yogique.life/  
- Project ID: Yogique  
- OAuth Client ID: 196749664391-vdefv78ahi97j38f5bl9foegptf9nt96.apps.googleusercontent.com  
- DNS TXT value added: `google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE`  
- DNS provider: [fill provider e.g. Cloudflare / GoDaddy / Route 53]  
- Date/time added (timezone): [fill timestamp]

Attachments (please attach)
1. Screenshot of the DNS provider console showing the TXT record value.  
2. Output of `dig TXT Yogique.com +short` (or `nslookup -type=TXT Yogique.com`) showing the TXT record.  
3. Screenshot of Google verification/Search Console success page (after you click Verify).  
4. Screenshot(s) of live Privacy and Terms pages:
   - https://Yogique.com/privacy
   - https://Yogique.com/terms

Suggested copy for terminal verification (run and attach output):
```bash
# run from your terminal and paste output into the email or attach as a text file
dig TXT Yogique.com +short
nslookup -type=TXT Yogique.com
```

Short summary to include in the email body:
> I added the TXT record for domain verification to the DNS for `Yogique.com`. Attached are DNS console screenshot, authoritative DNS query output showing the TXT value, and the Search Console verification screenshot. OAuth Client ID and Project ID are listed above.

Regards,  
Yogique Team

---

Checklist (current status)
- [x] Obtain TXT value from Google console
- [x] Document exact TXT value in repo
- [x] Produce filled DNS record + reply template
- [ ] Add TXT to DNS provider (user action required)
- [ ] Wait for propagation and confirm with dig/nslookup
- [ ] Click Verify in Google Console and capture success screenshot
- [ ] Prepare evidence (DNS screenshot, dig output, Search Console success)
- [ ] Reply to Trust & Safety with all evidence (send this email)

Notes
- If you want I can fill the DNS provider field and timestamp into the email once you confirm where you added the record.  
- If you want the email formatted differently (shorter or with attachments enumerated), tell me which format and I will update the file.

