#!/usr/bin/env bash
set -euo pipefail
echo "Installing npm dependencies (may update package-lock)"
npm install

echo "Installing Playwright browsers and deps"
npx playwright install --with-deps

echo "Running Playwright tests in e2e/tests using config"
npx playwright test --config=e2e/playwright.config.ts
