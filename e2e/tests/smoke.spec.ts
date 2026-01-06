import { expect, test } from '@playwright/test';

const E2E_BASE = process.env.E2E_BASE_URL;
const SMOKE_EMAIL = process.env.SMOKE_USER_EMAIL;
const SMOKE_PASSWORD = process.env.SMOKE_USER_PASSWORD;

test.skip(!E2E_BASE, 'Set E2E_BASE_URL to run smoke tests (do not run locally)');
test('smoke: auth sign-in → company → booking → invoice → payment', async ({ page, request }) => {
  test.skip(!SMOKE_EMAIL || !SMOKE_PASSWORD, 'Set SMOKE_USER_EMAIL and SMOKE_USER_PASSWORD to run smoke tests');
  const email = SMOKE_EMAIL as string;
  const password = SMOKE_PASSWORD as string;

  // 1) Sign in through the UI so tests run against deployed site auth flows
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for either a dashboard URL OR an inline login error element so failures surface quickly
  const waitForDashboard = page.waitForURL('**/dashboard*', { timeout: 30000 }).then(() => ({ type: 'nav' })).catch(() => null)
  const loginErrorSelector = 'div.bg-red-50 p, div[role="alert"]'
  const waitForError = page.waitForSelector(loginErrorSelector, { timeout: 15000 }).then(async (el) => ({ type: 'error', text: await el?.innerText() })).catch(() => null)

  let result = await Promise.race([waitForDashboard, waitForError])

  if (!result) {
    // Neither dashboard nor error appeared — check for a Supabase session in localStorage
    const ls = await page.evaluate(() => {
      const dump: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || ''
        dump[k] = localStorage.getItem(k) || ''
      }
      return dump
    })

    const hasSession = Object.keys(ls).some(k => k.startsWith('sb-') || k.toLowerCase().includes('auth'))
    if (hasSession) {
      // Fallback: navigate to dashboard — some deployments rely on a full-page navigation
      console.warn('Found session in localStorage, attempting fallback navigation to /dashboard')
      await page.goto('/dashboard')
      await page.waitForURL('**/dashboard*', { timeout: 30000 })
      result = { type: 'nav' }
    } else {
      console.error('Login diagnostic: no navigation or inline error after submit. localStorage dump:', ls)
      throw new Error('Login did not navigate to dashboard and no inline error was shown')
    }
  }

  if (result.type === 'error') {
    // Show the server/client-provided login error and dump localStorage for debugging
    console.error('Login failed with page error:', result.text)
    const ls = await page.evaluate(() => {
      const dump: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || ''
        dump[k] = localStorage.getItem(k) || ''
      }
      return dump
    })
    console.error('localStorage dump after failed login:', ls)
    throw new Error('Login failed: ' + result.text)
  }

  // Extract access token from localStorage (search common shapes used by Supabase client)
  const token = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      try {
        const v = localStorage.getItem(k);
        if (!v) continue;
        const parsed = JSON.parse(v);
        if (!parsed) continue;
        if (typeof parsed === 'object') {
          if (parsed.access_token) return parsed.access_token;
          if (parsed.session && parsed.session.access_token) return parsed.session.access_token;
          if (parsed.currentSession && parsed.currentSession.access_token) return parsed.currentSession.access_token;
          if (parsed.persistedSession && parsed.persistedSession.currentSession && parsed.persistedSession.currentSession.access_token) return parsed.persistedSession.currentSession.access_token;
          if (parsed.value && parsed.value.access_token) return parsed.value.access_token;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return null;
  });

  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  // 2) Create company
  const companyResp = await request.post('/api/companies', {
    headers,
    data: { name: `Smoke Co ${Date.now()}` }
  });
  expect(companyResp.ok()).toBeTruthy();
  const company = await companyResp.json();
  expect(company?.id).toBeTruthy();

  // 3) Create booking
  const bookingResp = await request.post('/api/corporate/bookings', {
    headers,
    data: { company_id: company.id, starts_at: new Date().toISOString() }
  });
  expect(bookingResp.ok()).toBeTruthy();
  const booking = await bookingResp.json();
  expect(booking?.id).toBeTruthy();

  // 4) Trigger invoice generation (API may vary)
  const invoiceResp = await request.post('/api/billing/generate-invoice', {
    headers,
    data: { booking_id: booking.id }
  });
  expect(invoiceResp.ok()).toBeTruthy();
  const invoice = await invoiceResp.json();
  expect(invoice?.id).toBeTruthy();

  // 5) Simulate payment
  const payResp = await request.post('/api/billing/pay', {
    headers,
    data: { invoice_id: invoice.id, amount: invoice.amount || 0 }
  });
  expect(payResp.ok()).toBeTruthy();
  const payment = await payResp.json();
  expect(payment?.id).toBeTruthy();
});
