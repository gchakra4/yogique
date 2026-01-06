# Helper to install dependencies and run Playwright E2E tests on Windows (PowerShell)
Write-Host 'Installing npm dependencies (will update package-lock if needed)'
npm install

Write-Host 'Installing Playwright browsers and deps'
npx playwright install --with-deps

Write-Host 'Running Playwright tests in e2e/tests using config'
npx playwright test --config=e2e/playwright.config.ts
