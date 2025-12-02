# Twilio WhatsApp Sandbox — Integration Steps (concise)

## Overview
This documents steps to send Zoom links to class participants via Twilio WhatsApp Sandbox 12 hours before class using the existing scheduler and a Supabase Edge Function.

## Required env vars
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- EDGE_FUNCTION_URL (set after deploying the edge function)
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_FROM (example: whatsapp:+14155238886)
Optional:
- SCHEDULER_SECRET_HEADER
- SCHEDULER_SECRET_TOKEN
- HOURS_BEFORE (defaults to 12)
- WINDOW_MINUTES (defaults to 5)
- FORCE_INVOKE (true to force calls during testing)

## Steps

1. Twilio Sandbox setup
- In Twilio Console → Messaging → Try WhatsApp Sandbox.
- Note Account SID, Auth Token, sandbox "From" number (e.g. whatsapp:+14155238886) and the join code.
- Each participant must opt-in by sending the join code to the sandbox number.

2. Deploy the Supabase Edge Function
- File created at `supabase/functions/send-whatsapp-reminder/index.ts`.
- From repo root, deploy with Supabase CLI:
```bash
# typescript
supabase functions deploy send-whatsapp-reminder --project-ref <your-project-ref>
```
- After deploy, copy the function URL and set EDGE_FUNCTION_URL to it.

3. Configure scheduler (tools/scheduler)
- The existing scheduler (tools/scheduler/scheduler.js) POSTs `{ classId }` to EDGE_FUNCTION_URL.
- Set environment variables for the scheduler process. Example (.env or inline):
```bash
# typescript
export SUPABASE_URL="https://xyz.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="service_role_..."
export EDGE_FUNCTION_URL="https://<region>-<project>.functions.supabase.co/send-whatsapp-reminder"
export TWILIO_ACCOUNT_SID="AC..."
export TWILIO_AUTH_TOKEN="..."
export TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
export HOURS_BEFORE=12
# optional:
export SCHEDULER_SECRET_HEADER="x-sched-secret"
export SCHEDULER_SECRET_TOKEN="supersecret"
```

4. Test the edge function directly (simple curl)
```bash
# typescript
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"classId":123}'
```
If you set a scheduler secret header, add:
-H "x-sched-secret: supersecret"

5. Force-invoke via scheduler (local test)
- To test scheduler behavior use FORCE_INVOKE=true and run scheduler:
```bash
# typescript
FORCE_INVOKE=true node tools/scheduler/scheduler.js
```
- Or run normally and it will call the edge function for classes starting <= HOURS_BEFORE hours.

6. Notes / troubleshooting
- Phone numbers must be E.164 (e.g., +919876543210). The function performs minimal cleanup only.
- For sandbox, recipients must opt-in or Twilio will reject messages.
- Sandbox is for dev/testing only. For production, use a Twilio WhatsApp Business number and follow template approval rules for proactive messages.
- Add retries and logging for production reliability. Monitor Twilio message SIDs for delivery status.

## Quick checklist
- [ ] Set Twilio sandbox and obtain SID/Auth token
- [ ] Deploy the edge function and set EDGE_FUNCTION_URL
- [ ] Configure scheduler env and secrets
- [ ] Have test recipients opt-in to sandbox
- [ ] Run scheduler with FORCE_INVOKE to validate sends
