import { expect, test } from '@playwright/test';

test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL to run E2E tests (do not run locally)');

test('admin mappings page loads', async ({ page }) => {
  await page.goto('/dashboard/template_mappings');
  await expect(page.locator('text=Activity → Template mappings')).toBeVisible({ timeout: 5000 });
});
