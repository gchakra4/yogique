import { test } from '@playwright/test';

test('diagnostic: capture console and failed requests', async ({ page }) => {
  page.on('console', msg => console.log('PAGE_CONSOLE', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQ_FAILED', req.url(), req.failure()?.errorText || 'unknown'));
  page.on('response', res => console.log('RESP', res.status(), res.url()));

  await page.goto('https://dev.yogique.life', { waitUntil: 'networkidle' });
  // allow JS to run and network settle
  await page.waitForTimeout(8000);
});
