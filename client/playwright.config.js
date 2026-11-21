import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: 'list',
  outputDir: '../artifacts/browser',
  use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173', browserName: 'chromium', channel: process.env.E2E_BROWSER || 'msedge', headless: true, trace: 'retain-on-failure' },
});
