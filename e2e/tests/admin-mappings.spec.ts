import { expect, test } from '@playwright/test';

test('admin mappings page loads', async ({ page }) => {
  await page.goto('/dashboard/template_mappings');
  await expect(page.locator('text=Activity → Template mappings')).toBeVisible({ timeout: 5000 });
});
