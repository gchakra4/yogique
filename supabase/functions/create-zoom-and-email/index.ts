// Supabase Edge Function: create-zoom-and-email
// Creates a Zoom meeting for a class assignment and sends emails via Resend
// Environment variables required (set in Supabase Functions settings):
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET,
// ZOOM_ACCOUNT_ID, RESEND_API_KEY, CLASSES_FROM_EMAIL, CLASSES_ADMIN_EMAIL

import { serve } from "https://deno.land/std@0.211.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.28.0?bundle";
import { DateTime } from "https://esm.sh/luxon@3.4.0?bundle";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID")!;
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET")!;
const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("CLASSES_FROM_EMAIL")!;
const ADMIN_EMAILS = (Deno.env.get("CLASSES_ADMIN_EMAIL") || "").split(",").map(s => s.trim()).filter(Boolean);
// optional scheduler auth: header name and expected token
const SCHEDULER_SECRET_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHEDULER_SECRET_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// simple per-invocation rate limiter for Resend: max 2 requests per 1s window
const _resendTimestamps: number[] = [];
async function throttleResend() {
    const now = Date.now();
    // drop timestamps older than 1s
    while (_resendTimestamps.length && now - _resendTimestamps[0] > 1000) _resendTimestamps.shift();
    if (_resendTimestamps.length >= 2) {
        const wait = 1000 - (now - _resendTimestamps[0]) + 10;
        await new Promise((r) => setTimeout(r, wait));
    }
    _resendTimestamps.push(Date.now());
}

async function getZoomAccessToken(): Promise<{ accessToken: string; apiUrl: string }> {
    // try cached token
    const { data } = await supabase.from("zoom_tokens").select("access_token, expires_at, api_url").eq("id", "server_token").single();
    if (data?.access_token && data?.expires_at && data?.api_url) {
        const expiresAt = new Date(data.expires_at);
        if (expiresAt.getTime() - Date.now() > 30_000) return { accessToken: data.access_token, apiUrl: data.api_url };
    }

    // request new Server-to-Server token
    const basic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
    const resp = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`, {
        method: "POST",
        headers: { "Authorization": `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }
    });
    if (!resp.ok) {
        const txt = await resp.text();
        console.error("Zoom token request failed:", resp.status, txt);
        throw new Error("zoom_token_failed");
    }
    const tokenJson = await resp.json();
    const accessToken = tokenJson.access_token;
    const apiUrl = tokenJson.api_url || "https://api.zoom.us";
    const expiresIn = tokenJson.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from("zoom_tokens").upsert({ id: "server_token", access_token: accessToken, expires_at: expiresAt, api_url: apiUrl }, { onConflict: "id" });
    return { accessToken, apiUrl };
}

// parse offsets like "UTC+5:30" -> minutes (330). returns null if invalid
function parseUtcOffsetToMinutes(offsetStr?: string | null): number | null {
    if (!offsetStr) return null;
    const m = String(offsetStr).trim().match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/i);
    if (!m) return null;
    const sign = m[1] === '-' ? -1 : 1;
    const hours = parseInt(m[2], 10) || 0;
    const mins = parseInt(m[3] || '0', 10) || 0;
    return sign * (hours * 60 + mins);
}

async function sendResendEmail(to: string | string[], subject: string, html: string, bcc?: string[]) {
    const maxAttempts = 2;
    // ensure there's a plain-text fallback for recipients/clients that prefer it
    const textFallback = (html || "").replace(/<[^>]*>/g, '').trim();
    const toList = Array.isArray(to) ? to : [to];
    const payload: any = { from: FROM_EMAIL, to: toList, subject, html };
    if (bcc && Array.isArray(bcc) && bcc.length) payload.bcc = bcc;
    if (textFallback) payload.text = textFallback;
    try { console.log(`Resend: sending to ${JSON.stringify(toList)} bcc=${JSON.stringify(bcc || [])} payload:`, JSON.stringify({ from: payload.from, to: payload.to, bcc: payload.bcc, subject: payload.subject })); } catch (e) { }

    let lastErr: any = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // ensure we respect per-invocation rate limits
            await throttleResend();
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const txt = await res.text().catch(() => null);
            const headersObj: Record<string, string> = {};
            try {
                res.headers.forEach((v, k) => { headersObj[k] = v; });
            } catch (e) { /* ignore header iteration errors */ }

            const result = { ok: res.ok, status: res.status, headers: headersObj, body: txt };
            if (res.ok) {
                try { console.log(`Resend success (attempt ${attempt}) to ${JSON.stringify(toList)}:`, txt); } catch (e) { }
                return result;
            }
            // rate limit handling: respect Retry-After header when present
            if (res.status === 429) {
                let retryAfter = 1000;
                try {
                    const ra = res.headers.get('retry-after');
                    if (ra) retryAfter = Math.max(500, parseInt(ra, 10) * 1000 || 1000);
                } catch (e) { /* ignore */ }
                console.error(`Resend rate-limited to ${to}, retry-after=${retryAfter}ms`);
                await new Promise((r) => setTimeout(r, retryAfter));
            }

            console.error(`Resend error (attempt ${attempt}) to ${to}:`, res.status, txt);
            lastErr = result;
        } catch (err) {
            console.error(`Resend fetch exception (attempt ${attempt}) to ${to}:`, String(err));
            lastErr = { ok: false, error: String(err) };
        }

        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 400 * attempt));
    }

    return lastErr || { ok: false, error: 'unknown' };
}

serve(async (req) => {
    try {
        // If scheduler auth is configured, require the header to match the token
        if (SCHEDULER_SECRET_HEADER && SCHEDULER_SECRET_TOKEN) {
            const provided = req.headers.get(SCHEDULER_SECRET_HEADER);
            if (!provided || provided !== SCHEDULER_SECRET_TOKEN) {
                console.warn('Unauthorized request: missing or invalid scheduler header');
                return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
            }
        }
        const body = await req.json().catch(() => ({}));
        const classId = body?.classId;
        if (!classId) return new Response("classId required", { status: 400 });

        // 1) fetch class assignment (include zoom_meeting for idempotency)
        const { data: cls, error: clsErr } = await supabase
            .from("class_assignments")
            .select("id, assignment_code, date, start_time, end_time, timezone, class_type_id, instructor_id, zoom_meeting")
            .eq("id", classId)
            .single();
        if (clsErr || !cls) return new Response(JSON.stringify({ error: clsErr?.message || "class_assignment not found" }), { status: 404 });

        // 2) fetch class type for title (optional)
        const { data: ct } = await supabase.from("class_types").select("name").eq("id", cls.class_type_id).single();

        // 3) instructor profile (try `profiles` table, then fallback to `auth.users`)
        let instructor: { id: string; user_id?: string | null; email?: string | null; full_name?: string | null } | null = null;
        try {
            // first try profiles linked by user_id -> auth.users.id
            const { data: instrByUser } = await supabase.from("profiles").select("id, user_id, email, full_name").eq("user_id", cls.instructor_id).single();
            instructor = instrByUser || null;
        } catch (e) {
            instructor = null;
        }

        // fallback: try profiles where primary id equals instructor_id (older schema)
        if (!instructor) {
            try {
                const { data: instrById } = await supabase.from("profiles").select("id, user_id, email, full_name").eq("id", cls.instructor_id).single();
                instructor = instrById || null;
            } catch (e) {
                instructor = instructor || null;
            }
        }

        // fallback: check auth.users (useful when you store user rows only in Supabase Auth)
        if (!instructor) {
            try {
                const { data: authUser, error: authErr } = await supabase.from("auth.users").select("id, email, raw_user_meta_data").eq("id", cls.instructor_id).single();
                try { console.log('Debug: auth.users query result:', JSON.stringify({ authUser, authErr })); } catch (e) { }
                if (authUser) {
                    // raw_user_meta_data may be a JSON object or a string; parse safely
                    let um: any = {};
                    try {
                        const raw = (authUser as any).raw_user_meta_data;
                        if (raw) {
                            if (typeof raw === 'string') um = JSON.parse(raw);
                            else um = raw;
                        }
                    } catch (e) {
                        um = {};
                    }
                    const fullName = um?.full_name || um?.fullName || um?.name || null;
                    instructor = { id: authUser.id, email: authUser.email, full_name: fullName };
                    try { console.log('Debug: instructor found in auth.users, mapped profile (from raw_user_meta_data):', JSON.stringify(instructor)); } catch (e) { }
                }
            } catch (e) {
                // ignore and leave instructor null
            }
        }

        // 4) attendees (assignment_bookings -> bookings -> profiles)
        // First collect booking_ids from assignment_bookings, then fetch bookings to get user_ids
        const { data: assignmentBookings } = await supabase.from("assignment_bookings").select("booking_id").eq("assignment_id", classId);
        const bookingIds = Array.isArray(assignmentBookings) ? assignmentBookings.map((b: any) => b.booking_id).filter(Boolean) : [];
        let userIds: string[] = [];
        if (bookingIds.length) {
            try {
                // include timezone from bookings (user timezone saved as 'UTC+hh:mm')
                const { data: bookingsRows } = await supabase.from("bookings").select("booking_id, user_id, timezone").in("booking_id", bookingIds);
                userIds = Array.isArray(bookingsRows) ? bookingsRows.map((r: any) => r.user_id).filter(Boolean) : [];
                // build map of user_id -> booking timezone
                var bookingTimezoneByUser: Record<string, string> = {};
                if (Array.isArray(bookingsRows)) {
                    for (const br of bookingsRows) {
                        if (br?.user_id) bookingTimezoneByUser[br.user_id] = br.timezone || bookingTimezoneByUser[br.user_id];
                    }
                }
            } catch (e) {
                userIds = [];
            }
        }

        let attendees: Array<{ id: string; user_id?: string; email?: string; full_name?: string }> = [];
        if (userIds.length) {
            // first try matching profiles.user_id (common FK to auth.users.id)
            try {
                const { data: profilesByUser } = await supabase.from("profiles").select("id, user_id, email, full_name").in("user_id", userIds);
                let profilesList: any[] = [];
                if (Array.isArray(profilesByUser) && profilesByUser.length) profilesList = profilesByUser as any;
                else {
                    const { data: profilesById } = await supabase.from("profiles").select("id, user_id, email, full_name").in("id", userIds);
                    profilesList = profilesById || [];
                }
                // attach booking timezone to each profile (if available)
                attendees = (profilesList || []).map((p: any) => ({ ...p, booking_timezone: (typeof bookingTimezoneByUser !== 'undefined' ? bookingTimezoneByUser[p.user_id || p.id] : null) }));
            } catch (e) {
                attendees = [];
            }
        }

        // 5) build start ISO (timezone-aware using Luxon)
        let startIso = new Date().toISOString();
        let classDisplay = '';
        try {
            if (cls.date && cls.start_time) {
                const classZone = cls.timezone || 'UTC';
                const classDt = DateTime.fromISO(`${cls.date}T${cls.start_time}`, { zone: classZone });
                if (classDt.isValid) {
                    startIso = classDt.toISO(); // includes offset
                    classDisplay = classDt.toLocaleString(DateTime.DATETIME_FULL);
                } else {
                    // fallback
                    startIso = new Date(`${cls.date}T${cls.start_time}`).toISOString();
                    classDisplay = `${cls.date} ${cls.start_time} (${cls.timezone || 'UTC'})`;
                }
            } else {
                classDisplay = 'scheduled time';
            }
        } catch (e) {
            startIso = new Date().toISOString();
            classDisplay = `${cls.date || ''} ${cls.start_time || ''} (${cls.timezone || 'UTC'})`;
        }

        // Diagnostic logs: surface fetched records so we can see why emails may not be sent
        try { console.log('Debug: class_assignment:', JSON.stringify(cls)); } catch (e) { }
        try { console.log('Debug: class_type:', JSON.stringify(ct)); } catch (e) { }
        try { console.log('Debug: instructor profile:', JSON.stringify(instructor)); } catch (e) { }
        try { console.log('Debug: attendees list:', JSON.stringify(attendees)); } catch (e) { }
        try { console.log('Debug: admin emails:', JSON.stringify(ADMIN_EMAILS)); } catch (e) { }

        // 6) create Zoom meeting
        const hostZoomUserId = "me"; // change if you store per-instructor Zoom user IDs
        const { accessToken, apiUrl } = await getZoomAccessToken();
        const apiBase = (apiUrl || "https://api.zoom.us").replace(/\/$/, "");
        const zoomResp = await fetch(`${apiBase}/v2/users/${encodeURIComponent(hostZoomUserId)}/meetings`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                topic: ct?.name || "Class",
                type: 2,
                start_time: startIso,
                duration: 60,
                timezone: cls.timezone || "UTC",
                settings: { join_before_host: false, approval_type: 0 }
            })
        });

        if (!zoomResp.ok) {
            const errText = await zoomResp.text();
            console.error("Zoom create failed:", errText);
            return new Response(JSON.stringify({ error: "Zoom create failed", details: errText }), { status: 502 });
        }
        const zoomData = await zoomResp.json();

        // 7) persist zoom metadata
        const { error: updateErr } = await supabase.from("class_assignments").update({
            zoom_meeting: {
                meetingId: zoomData.id,
                join_url: zoomData.join_url,
                start_url: zoomData.start_url,
                password: zoomData.password,
                created_at: new Date().toISOString()
            }
        }).eq("id", classId);
        if (updateErr) {
            console.error("DB update failed:", updateErr);
            return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
        }

        // 8) prepare email HTML - replace previous template with the provided yoga-themed builder
        const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || null;
        const LOGO_URL = PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL.replace(/\/$/, '')}/images/Brand-orange.png` : '/images/Brand-orange.png';

        function buildEmailTemplate({
            recipientName,
            isInstructor,
            classTitle,
            classDisplay,
            localTime,
            zoomUrl,
            assignmentCode,
            instructorName,
            instructorEmail,
            meetingId,
            passcode,
        }: {
            recipientName: string,
            isInstructor?: boolean,
            classTitle: string,
            classDisplay: string,
            localTime?: string | null,
            zoomUrl: string,
            assignmentCode: string,
            instructorName: string,
            instructorEmail: string,
            meetingId?: string,
            passcode?: string,
        }) {
            return `
    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,Helvetica,sans-serif;color:#111;background:#f9fafb;border-radius:8px;">

        <div style="text-align:center;margin-bottom:20px;">
            ${LOGO_URL ? `<img src="${LOGO_URL}" alt="Yoga Brand Logo" style="max-width:160px;height:auto;">` : ''}
        </div>

        <h2 style="margin-top:0;color:#d97706;text-align:center;">${classTitle}</h2>

        <p style="font-size:16px;">Namaste ${recipientName},</p>
        <p style="font-size:16px;">Your yoga class is scheduled at <strong>${classDisplay}</strong>.</p>
        ${localTime ? `<p style="font-size:16px;">Your local time: <strong>${localTime}</strong></p>` : ''}

        <div style="text-align:center;margin:24px 0;">
            <a href="${zoomUrl}" 
                style="display:inline-block;padding:14px 24px;background:#d97706;color:#fff;font-weight:bold;
                             border-radius:6px;text-decoration:none;font-size:16px;">
                ${isInstructor ? "Start Class (Host)" : "Join Class"}
            </a>
        </div>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-top:20px;">
            <h3 style="margin:0 0 12px 0;color:#111;font-size:18px;">Class Details</h3>
            <p style="margin:4px 0;font-size:14px;"><strong>Assignment Code:</strong> ${assignmentCode}</p>
            <p style="margin:4px 0;font-size:14px;"><strong>Instructor:</strong> ${instructorName} (${instructorEmail})</p>
            <p style="margin:4px 0;font-size:14px;"><strong>Meeting ID:</strong> ${meetingId || "TBD"}</p>
            ${passcode ? `<p style="margin:4px 0;font-size:14px;"><strong>Passcode:</strong> ${passcode}</p>` : ""}
        </div>

        <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">
            May your practice be peaceful and fulfilling.<br>
            For assistance, write to <a href="mailto:${FROM_EMAIL}" style="color:#d97706;">${FROM_EMAIL}</a>.
        </p>
    </div>
    `;
        }

        // 9) send notifications: single email per attendee (To includes attendee + instructor), BCC admins
        const sendResults: Array<{ to: string[]; bcc?: string[]; result: any }> = [];

        if (attendees.length) {
            for (const a of attendees) {
                if (!a.email) continue; // skip malformed attendee rows
                const toList = [a.email].filter(Boolean) as string[];
                if (instructor?.email && !toList.includes(instructor.email)) toList.push(instructor.email);
                const bccList = ADMIN_EMAILS.length ? ADMIN_EMAILS : undefined;
                // compute attendee local time.
                // Prefer IANA tznames stored in booking_timezone (e.g. 'Asia/Kolkata').
                // Fallback: accept legacy offsets like 'UTC+5:30'.
                let attendeeLocalDisplay: string | null = null;
                try {
                    const bookingTz = (a as any).booking_timezone;
                    if (bookingTz) {
                        if (/^UTC[+-]/i.test(String(bookingTz))) {
                            const offMin = parseUtcOffsetToMinutes(String(bookingTz));
                            if (offMin !== null) {
                                const attendeeLocal = DateTime.fromISO(startIso, { zone: 'utc' }).plus({ minutes: offMin });
                                if (attendeeLocal.isValid) attendeeLocalDisplay = attendeeLocal.toLocaleString(DateTime.DATETIME_FULL);
                            }
                        } else {
                            // assume IANA zone
                            const attendeeLocal = DateTime.fromISO(startIso).setZone(String(bookingTz));
                            if (attendeeLocal.isValid) attendeeLocalDisplay = attendeeLocal.toLocaleString(DateTime.DATETIME_FULL);
                        }
                    }
                } catch (e) { attendeeLocalDisplay = null; }

                const details = `
                                    <div style="font-size:14px;color:#6b7280;">
                                        <p style="margin:6px 0"><strong>Class time:</strong> ${classDisplay}</p>
                                        ${attendeeLocalDisplay ? `<p style="margin:6px 0"><strong>Your local time:</strong> ${attendeeLocalDisplay}</p>` : ''}
                                        <p style="margin:6px 0"><strong>Assignment code:</strong> ${cls.assignment_code || cls.id}</p>
                                        <p style="margin:6px 0"><strong>Instructor:</strong> ${instructor?.full_name || 'TBD'} (${instructor?.email || 'TBD'})</p>
                                        <p style="margin:6px 0"><strong>Topic:</strong> ${ct?.name || 'Class'}</p>
                                    </div>
                                `;

                const bodyHtml = buildEmailTemplate({
                    recipientName: a.full_name || 'Student',
                    isInstructor: false,
                    classTitle: ct?.name || 'Class — Join details',
                    classDisplay: classDisplay,
                    localTime: attendeeLocalDisplay || null,
                    zoomUrl: zoomData.join_url,
                    assignmentCode: cls.assignment_code || cls.id,
                    instructorName: instructor?.full_name || 'TBD',
                    instructorEmail: instructor?.email || 'TBD',
                    meetingId: String(zoomData.id || ''),
                    passcode: zoomData.password || undefined,
                });
                const res = await sendResendEmail(toList, `${ct?.name || 'Class'} — Join details`, bodyHtml, bccList);
                sendResults.push({ to: toList, bcc: bccList, result: res });
            }
        } else if (instructor?.email) {
            // no attendees — send single host email and CC admins
            const toList = [instructor.email];
            const bccList = ADMIN_EMAILS.length ? ADMIN_EMAILS : undefined;
            const hostDetails = `
                <div style="font-size:14px;color:#6b7280;">
                    <p style="margin:6px 0"><strong>Class time:</strong> ${classDisplay}</p>
                    <p style="margin:6px 0"><strong>Assignment code:</strong> ${cls.assignment_code || cls.id}</p>
                    <p style="margin:6px 0"><strong>Topic:</strong> ${ct?.name || 'Class'}</p>
                </div>
            `;
            const hostHtml = buildEmailTemplate({
                recipientName: instructor.full_name || 'Instructor',
                isInstructor: true,
                classTitle: `${ct?.name || 'Class'} — Host join details`,
                classDisplay: classDisplay,
                localTime: null,
                zoomUrl: zoomData.start_url,
                assignmentCode: cls.assignment_code || cls.id,
                instructorName: instructor.full_name || 'Instructor',
                instructorEmail: instructor.email || '',
                meetingId: String(zoomData.id || ''),
                passcode: zoomData.password || undefined,
            });
            const res = await sendResendEmail(toList, `${ct?.name || 'Class'} — Host join details`, hostHtml, bccList);
            sendResults.push({ to: toList, bcc: bccList, result: res });
        } else {
            // no instructor email found — notify admins only (existing behavior)
            const adminDetails = `
                                <div style="font-size:14px;color:#6b7280;">
                                    <p style="margin:6px 0">No instructor email found for class <strong>${ct?.name || 'Class'}</strong> (assignment ${cls.assignment_code || cls.id}).</p>
                                    <p style="margin:6px 0">Zoom join link: <a href="${zoomData.join_url}">${zoomData.join_url}</a></p>
                                </div>
                        `;
            if (ADMIN_EMAILS.length) {
                const adminHtml = buildEmailTemplate({
                    recipientName: 'Admin',
                    isInstructor: false,
                    classTitle: `Admin: class created (no instructor) — ${ct?.name || 'Class'}`,
                    classDisplay: '',
                    localTime: null,
                    zoomUrl: zoomData.join_url,
                    assignmentCode: cls.assignment_code || cls.id,
                    instructorName: instructor?.full_name || 'TBD',
                    instructorEmail: instructor?.email || '',
                    meetingId: String(zoomData.id || ''),
                    passcode: zoomData.password || undefined,
                });
                const ar = await sendResendEmail([FROM_EMAIL], `Admin: class created (no instructor) — ${ct?.name || 'Class'}`, adminHtml, ADMIN_EMAILS);
                sendResults.push({ to: [FROM_EMAIL], bcc: ADMIN_EMAILS, result: ar });
            }
        }


        // log aggregated results for easier debugging in Dashboard
        try { console.log('Resend aggregated results:', JSON.stringify(sendResults)); } catch (e) { }

        return new Response(JSON.stringify({ success: true, zoom: { id: zoomData.id, join_url: zoomData.join_url }, resend: sendResults }), { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: "internal" }), { status: 500 });
    }
});
