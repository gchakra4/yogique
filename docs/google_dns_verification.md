# Google DNS TXT Verification — Instructions for Yogique

This document shows step‑by‑step instructions to verify your domain with Google using a DNS TXT record. Google will provide a TXT value (example: `google-site-verification=XXXXXXXXXXXX`). You must add the exact value Google gives you to your DNS provider.

## 1) Obtain the TXT value from Google
1. In Google Cloud Console (OAuth / App verification or Search Console), choose the DNS verification method.
2. Google will show a TXT record value — copy it exactly. Example formats you might see:
- google-site-verification=XXXXXXXXXXXXXXXXXXXX
- or a long quoted string (copy exactly as shown).

## 2) Add the TXT record at your DNS provider
General parameters:
- Type: TXT
- Name / Host: usually `@` for root domain, or the specific subdomain Google asks for (e.g., `my-subdomain`).
- Value / Content: the exact string Google provided (example: `google-site-verification=XXXXXXXXXXXX`)
- TTL: use default or 300 seconds

Examples for common DNS providers:

Cloudflare
1. DNS → Add record
2. Type: TXT
3. Name: @
4. Content: google-site-verification=XXXXXXXXXXXX
5. Save

GoDaddy
1. Domains → Manage DNS → Add
2. Type: TXT
3. Host: @
4. TXT Value: google-site-verification=XXXXXXXXXXXX
5. Save

Namecheap
1. Domain List → Manage → Advanced DNS → Add New Record
2. Type: TXT Record
3. Host: @
4. Value: google-site-verification=XXXXXXXXXXXX
5. Save all changes

AWS Route 53 (console)
1. Hosted zones → choose your zone → Create record
2. Record type: TXT
3. Record name: leave empty or use @
4. Value: "google-site-verification=XXXXXXXXXXXX" (include quotes if console requires)
5. Save

AWS Route 53 (CLI example)
```bash
# create changes.json with the correct value, replacing ZONEID and TXT_VALUE
cat > changes.json <<'JSON'
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "example.com.",
        "Type": "TXT",
        "TTL": 300,
        "ResourceRecords": [
          { "Value": "\"google-site-verification=XXXXXXXXXXXX\"" }
        ]
      }
    }
  ]
}
JSON

aws route53 change-resource-record-sets --hosted-zone-id ZONEID --change-batch file://changes.json
```

## 3) Wait for DNS propagation
- Many providers update quickly, but propagation can take up to 48 hours.
- Useful checks:
```bash
# Replace example.com with your domain
dig TXT example.com +short
# or
nslookup -type=TXT example.com
```
The output should include the exact TXT value Google gave you.

## 4) Complete verification in Google Console
- In the verification UI, click "Verify" (or in Search Console use the Verify button).
- If Google detects the TXT record, verification will succeed.

## 5) Troubleshooting
- Ensure there are no extra characters, spaces, or missing parts in the TXT value.
- If your DNS provider requires quotes around TXT values, include them exactly as shown.
- If using a CDN or DNS proxy (Cloudflare orange-cloud), try temporarily disabling the proxy for the record.
- Recheck the host/name field — `@` for root, or the specific host Google requested.
- Use dig/nslookup against authoritative nameservers to confirm propagation:
```bash
dig @ns1.provider.com TXT example.com +short
```

## 6) What to include when replying to Trust & Safety after you verify
When writing back to Google Trust & Safety / Verification team, include:
- Deployed site URL(s) (exact HTTPS URLs).
- OAuth Client ID & Project ID.
- Screenshot of the DNS record in your DNS provider showing the TXT value (or a support ticket if provider hides values).
- A dig or nslookup output showing the TXT record (copy/paste output).
- Screenshot of the Google verification success page (or Search Console verification success).
- Short note: where the TXT record was added (provider name), and timestamp when you verified.

Example reply text you can copy/paste:
> I have added the Google verification TXT record to the DNS for `Yogique.com` using [Cloudflare/GoDaddy/etc.]. Attached are (1) screenshot of the DNS record, (2) dig output showing the TXT value, (3) Search Console verification success screenshot. OAuth client ID: `YOUR_OAUTH_CLIENT_ID`. Project ID: `Yogique`.

## 7) Checklist
- [ ] Obtain TXT value from Google console
- [ ] Add TXT to DNS provider (Cloudflare / GoDaddy / Route 53 / etc.)
- [ ] Wait for propagation and confirm with dig/nslookup
- [ ] Click Verify in Google Console and capture success screenshot
- [ ] Prepare evidence (DNS screenshot, dig output, Search Console success, OAuth client ID)
- [ ] Reply to Trust & Safety with all evidence

---  
If you paste the exact TXT value from Google here (the string starting with `google-site-verification=`), I can:
- produce the exact DNS record text for you to copy into your DNS provider, and
- generate the recommended reply text (with placeholders filled: domain, OAuth client ID, project ID) ready to send to Trust & Safety.

