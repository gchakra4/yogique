import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:5173'
  }
});
