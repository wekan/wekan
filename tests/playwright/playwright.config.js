// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { execFileSync } = require('child_process');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const RUN_ALL_BROWSERS = process.env.WEKAN_PLAYWRIGHT_ALL === '1';

// Some hosts can't run every bundled browser — e.g. the WebKit build ships
// against older system libraries (libicu 74, libxml2 v2, libevent 2.1) that
// newer distros no longer provide, so it fails to launch with
// "Host system is missing dependencies to run browsers". Rather than report
// a whole project's worth of false failures, probe each browser once and skip
// the ones that can't start (same spirit as global-setup skipping when WeKan
// is not running).
//
// On CI we keep every browser so a genuinely broken browser fails loudly
// instead of silently shrinking coverage; set WEKAN_PLAYWRIGHT_PROBE=1 to force
// probing there, or WEKAN_PLAYWRIGHT_PROBE=0 to disable it locally.
const SHOULD_PROBE = process.env.WEKAN_PLAYWRIGHT_PROBE
  ? process.env.WEKAN_PLAYWRIGHT_PROBE === '1'
  : !process.env.CI;

function canLaunch(browserName) {
  try {
    execFileSync(
      process.execPath,
      [
        '-e',
        `require('@playwright/test').${browserName}.launch()` +
          `.then(b => b.close()).then(() => process.exit(0))` +
          `.catch(() => process.exit(1))`,
      ],
      { stdio: 'ignore', timeout: 60_000 },
    );
    return true;
  } catch (_e) {
    return false;
  }
}

function browserProjects() {
  const candidates = RUN_ALL_BROWSERS
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];

  if (!SHOULD_PROBE) {
    return candidates;
  }

  const usable = candidates.filter(p => {
    if (canLaunch(p.name)) {
      return true;
    }
    // eslint-disable-next-line no-console
    console.log(
      `\n[playwright] SKIP project "${p.name}": browser cannot launch on this host ` +
        `(missing system dependencies). Run "npx playwright install-deps ${p.name}" to enable it.\n`,
    );
    return false;
  });

  // Never end up with zero projects — if even chromium can't launch, keep the
  // candidates so Playwright surfaces the real launch error instead of
  // reporting "no tests found".
  return usable.length > 0 ? usable : candidates;
}

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
  projects: browserProjects(),
  outputDir: 'test-results',
});
