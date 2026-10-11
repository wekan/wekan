const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.', testMatch: process.env.NEXTCLOUD_TEST_PHASE ? 'persistence.spec.cjs' : 'live.spec.cjs', workers: 1, timeout: 120000,
  expect: { timeout: 30000 }, reporter: 'list',
  outputDir: process.env.NEXTCLOUD_TEST_OUTPUT,
  use: { browserName: 'chromium', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
});
