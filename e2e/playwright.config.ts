import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/archived-tests/**'],
  timeout: 30_000,
  use: {
    headless: true,
    // Do not assume a local dev server. Use `E2E_BASE_URL` to point tests
    // at a running dev/staging instance. If unset, tests should skip.
    baseURL: process.env.E2E_BASE_URL || undefined
  }
});
