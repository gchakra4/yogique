// OTP service: generate, hash, store, and verify OTP codes
// Use a platform-safe environment accessor so this file can compile under Node (Vite/tsc)
const _global: any = globalThis as any;
const getEnv = (key: string) => _global.Deno?.env?.get?.(key) ?? _global.process?.env?.[key];
const SUPABASE_URL = getEnv('SUPABASE_URL')!;
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')!;
const OTP_HASH_SECRET = getEnv('OTP_HASH_SECRET') || getEnv('SUPABASE_SERVICE_ROLE_KEY')!;

function randomNumericCode(length = 6) {
  const digits = new Uint8Array(length);
  crypto.getRandomValues(digits);
  return Array.from(digits).map((d) => String(d % 10)).join('');
}

function bufToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(message: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bufToHex(sig);
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

export async function createOtp({ userId = null, phone, channel = 'whatsapp', ttlSeconds = 300, provider = null } : { userId?: string | null, phone: string, channel?: string, ttlSeconds?: number, provider?: string | null }) {
  const code = randomNumericCode(6);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  // include phone in the message to make hash unique per recipient
  const codeHash = await hmacHex(`${phone}:${code}`, OTP_HASH_SECRET);

  const body = [{ user_id: userId, phone, channel, provider, code_hash: codeHash, expires_at: expiresAt }];
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/otp_codes`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return { ok: false, error: 'failed_to_store', details: `${resp.status} ${text}` };
  }
  const rows = await resp.json().catch(() => null);
  // return code for immediate sending; do NOT log or persist the plain code
  return { ok: true, code, row: Array.isArray(rows) && rows.length ? rows[0] : null };
}

export async function sendOtpWithProvider(row: any, sendFn: (opts: { to: string; text: string }) => Promise<any>) {
  const phone = row.phone;
  const codePlaceholder = '***';
  // The actual code is not stored in the row; caller should have kept it from createOtp
  // sendFn is expected to send the message; caller must pass the real code into sendFn if needed
  const text = `Your verification code is ${codePlaceholder}.`;
  const result = await sendFn({ to: `whatsapp:${phone}`, text });
  return result;
}

export async function verifyOtp({ userId: _userId = null, phone, code, maxAttempts = 5 } : { userId?: string | null, phone: string, code: string, maxAttempts?: number }) {
  // fetch the most recent unused OTP for this phone
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/otp_codes?select=*&phone=eq.${encodeURIComponent(phone)}&used=eq.false&order=created_at.desc&limit=1`;
  const resp = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!resp.ok) throw new Error(`failed to fetch otp: ${resp.status}`);
  const rows = await resp.json();
  const row = Array.isArray(rows) && rows.length ? rows[0] : null;
  if (!row) return { ok: false, reason: 'no_otp' };
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' };
  }
  if (row.attempts >= maxAttempts) return { ok: false, reason: 'max_attempts' };

  const codeHash = await hmacHex(`${phone}:${code}`, OTP_HASH_SECRET);
  const match = constantTimeEqual(codeHash, row.code_hash);

  // increment attempts
  try {
    await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/otp_codes?id=eq.${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempts: (row.attempts || 0) + 1, used: match ? true : row.used }),
    });
  } catch (e) {
    console.warn('failed to patch otp attempts', e);
  }

  if (!match) return { ok: false, reason: 'invalid' };
  return { ok: true };
}

export default { createOtp, sendOtpWithProvider, verifyOtp };
