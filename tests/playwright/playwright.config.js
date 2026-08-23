// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const RUN_ALL_BROWSERS = process.env.WEKAN_PLAYWRIGHT_ALL === '1';
const SELECTED_BROWSER = process.env.WEKAN_PLAYWRIGHT_PROJECT || '';
// Flatpak exposes only the repository, so browsers installed by the sandbox
// bootstrap live here rather than under the real home cache. Honour an explicit
// caller path first; otherwise make direct npx runs use the existing local cache.
const LOCAL_BROWSER_CACHE = path.join(__dirname, '..', '..', '.tools', 'ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(LOCAL_BROWSER_CACHE)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = LOCAL_BROWSER_CACHE;
}

// WPE WebKit (the `webkit` project) aborts its WPEWebProcess renderer in headless
// software-GL environments — notably ARM hosts using Mesa llvmpipe (observed
// crashing with SIGTRAP on Apple Silicon / Asahi). That shows up as mid-test
// "renderer gone" click/navigation TIMEOUTS, i.e. false WebKit failures, not real
// WeKan bugs. Disabling WPE's DMABUF renderer path is the standard fix for
// headless / containerized / VM WebKit. It is harmless for Chromium and Firefox
// (they ignore it), and Playwright passes process.env to the launched browser, so
// setting it here covers every way these tests are run (build.sh, direct
// `npx playwright test`, CI). An explicit value already in the environment wins.
if (process.env.WEBKIT_DISABLE_DMABUF_RENDERER === undefined) {
  process.env.WEBKIT_DISABLE_DMABUF_RENDERER = '1';
}

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
  const candidates = SELECTED_BROWSER
    ? [{ name: SELECTED_BROWSER, use: { ...devices[SELECTED_BROWSER === 'chromium' ? 'Desktop Chrome' : SELECTED_BROWSER === 'firefox' ? 'Desktop Firefox' : 'Desktop Safari'] } }]
    : RUN_ALL_BROWSERS
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];

  // WebKit can occasionally terminate a renderer after hundreds of tests and
  // report only "WebKit encountered an internal error". One local retry gets a
  // fresh Playwright worker/browser. A real application failure repeats and
  // still fails; CI keeps its broader two-retry policy below.
  if (!process.env.CI) {
    const webkitProject = candidates.find(project => project.name === 'webkit');
    if (webkitProject) webkitProject.retries = 1;
  }

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
  workers: Math.max(1, Number(process.env.WEKAN_PLAYWRIGHT_WORKERS || 1)),
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
