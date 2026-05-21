// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const RUN_ALL_BROWSERS = process.env.WEKAN_PLAYWRIGHT_ALL === '1';

module.exports = defineConfig({
  globalSetup: './global-setup.js',
  testDir: './specs',
  testMatch: '**/*.e2e.js',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: RUN_ALL_BROWSERS
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ],
  outputDir: 'test-results',
});
