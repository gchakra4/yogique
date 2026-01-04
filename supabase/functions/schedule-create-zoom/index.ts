import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { callFunctionWithOptions, restGet, restPost } from '../shared/db.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Optional scheduler secret for create-zoom-and-email auth
const SCHEDULER_SECRET_HEADER = Deno.env.get("SCHEDULER_SECRET_HEADER") || null;
const SCHEDULER_SECRET_TOKEN = Deno.env.get("SCHEDULER_SECRET_TOKEN") || null;

// Scheduler config
const DEFAULT_HOURS_BEFORE = 12;
const DEFAULT_WINDOW_MINUTES = 5;
const DEFAULT_LIMIT = 20; // process max 20 classes per invocation to avoid timeout

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Convert date + time + timezone to UTC timestamp in minutes from now
 */
function minutesUntilClass(date: string, startTime: string, timezone: string): number | null {
  try {
    // Parse as ISO datetime in the class's timezone
    const classDateTime = new Date(`${date}T${startTime}`);
    if (isNaN(classDateTime.getTime())) return null;

    // For simplicity, assume timezone offset can be extracted or default to UTC
    // In production, use a proper timezone library like luxon or date-fns-tz
    const now = Date.now();
    const classMs = classDateTime.getTime();
    const diffMs = classMs - now;
    return Math.round(diffMs / 60000);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_env' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json().catch(() => ({}));
    const hoursBefore = Number(body.hours_before || DEFAULT_HOURS_BEFORE);
    const windowMinutes = Number(body.window_minutes || DEFAULT_WINDOW_MINUTES);
    const limit = Number(body.limit || DEFAULT_LIMIT);
    const forceInvoke = Boolean(body.force_invoke);

    console.log('schedule-create-zoom start', {
      hours_before: hoursBefore,
      window_minutes: windowMinutes,
      limit,
      force_invoke: forceInvoke,
    });

    // Detect scheduler secret from incoming request (when caller passed it),
    // otherwise attempt to populate scheduler secret header+token from DB if env not set
    const incomingHeaders = (req.headers || new Headers());
    const incomingSchedDefault = incomingHeaders.get('X-SCHED-SECRET') || incomingHeaders.get('x-sched-secret');
    let schedulerHeader = SCHEDULER_SECRET_HEADER;
    let schedulerToken = SCHEDULER_SECRET_TOKEN;
    if (!schedulerHeader && incomingSchedDefault) schedulerHeader = 'X-SCHED-SECRET';
    if (!schedulerToken && incomingSchedDefault) schedulerToken = incomingSchedDefault;
    // If still missing, try DB
    if (typeof restPost === 'function') {
      try {
        if (!schedulerHeader) {
          const headerResp = await restPost('/rpc/get_secret', { secret_key: 'scheduler_secret_header' }).catch(() => null);
          if (headerResp && typeof headerResp === 'string') schedulerHeader = headerResp;
          else if (headerResp && typeof headerResp === 'object' && 'value' in headerResp) schedulerHeader = (headerResp as any).value;
          if (schedulerHeader) console.log('Loaded scheduler header name from DB secrets');
        }

        if (!schedulerToken) {
          const tokenResp = await restPost('/rpc/get_secret', { secret_key: 'scheduler_secret_token' }).catch(() => null);
          if (tokenResp && typeof tokenResp === 'string') schedulerToken = tokenResp;
          else if (tokenResp && typeof tokenResp === 'object' && 'value' in tokenResp) schedulerToken = (tokenResp as any).value;
          if (schedulerToken) console.log('Loaded scheduler token from DB secrets');
        }
      } catch (e) {
        console.log('No scheduler secret values in DB secrets or failed to fetch them');
      }
    }

    // Fetch upcoming classes without zoom_meeting
    const now = new Date();
    const maxDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // next 48 hours
    const nowStr = now.toISOString().split('T')[0];
    const maxStr = maxDate.toISOString().split('T')[0];

    const q = `/rest/v1/class_assignments?select=id,assignment_code,date,start_time,timezone&zoom_meeting=is.null&date=gte.${nowStr}&date=lte.${maxStr}&limit=${limit}`;
    const classes = await restGet(q);

    if (!Array.isArray(classes)) {
      console.log('No classes found or invalid response');
      return new Response(JSON.stringify({ ok: true, candidates: 0, invoked: 0, skipped: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${classes.length} candidate classes`);

    const targetMinutes = hoursBefore * 60;
    const results: any[] = [];
    let invoked = 0;
    let skipped = 0;

    for (const cls of classes) {
      try {
        if (!cls?.date || !cls?.start_time) {
          console.log(`Skipping class ${cls?.id}: missing date/start_time`);
          skipped++;
          continue;
        }

        const minutesUntil = minutesUntilClass(cls.date, cls.start_time, cls.timezone || 'UTC');
        if (minutesUntil === null) {
          console.log(`Skipping class ${cls.id}: invalid datetime`);
          skipped++;
          continue;
        }

        console.log(`Class ${cls.id} (${cls.assignment_code || 'no code'}): starts in ${minutesUntil} minutes`);

        // Invoke if forced OR within time window (≤ hoursBefore and ≥ 0)
        const shouldInvoke = forceInvoke || (minutesUntil <= targetMinutes && minutesUntil >= 0);

        if (shouldInvoke) {
          console.log(`Invoking create-zoom-and-email for class ${cls.id}`);
          
          // Build headers with optional scheduler secret (env or DB fallback)
          const headers: Record<string, string> = {};
          if (schedulerHeader && schedulerToken) {
            headers[schedulerHeader] = schedulerToken;
          } else if (schedulerToken) {
            // default to Authorization Bearer if no explicit header name provided
            headers['Authorization'] = `Bearer ${schedulerToken}`;
          }
          
          const result = await callFunctionWithOptions('create-zoom-and-email', { classId: cls.id }, {
            serviceRoleKey: SUPABASE_KEY,
            timeoutMs: 10000,
            headers,
          });

          invoked++;
          results.push({
            class_id: cls.id,
            assignment_code: cls.assignment_code,
            minutes_until: minutesUntil,
            status: result?.status,
            ok: result?.ok,
          });

          console.log(`Class ${cls.id} result: ${result?.status} ok=${result?.ok}`);
        } else {
          console.log(`Skipping class ${cls.id}: not within ${hoursBefore}h window (${minutesUntil} min)`);
          skipped++;
        }
      } catch (err) {
        console.error(`Error processing class ${cls?.id}:`, err);
        results.push({
          class_id: cls?.id,
          error: String(err),
        });
      }
    }

    console.log('schedule-create-zoom complete', { candidates: classes.length, invoked, skipped });

    return new Response(JSON.stringify({
      ok: true,
      candidates: classes.length,
      invoked,
      skipped,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('schedule-create-zoom error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
