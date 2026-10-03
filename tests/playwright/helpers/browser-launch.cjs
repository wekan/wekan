'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Firefox's -profile does not isolate profiles.ini / installs.ini bookkeeping.
// On macOS 27 the real Firefox app-data directory can be TCC-protected even
// though Playwright's temporary profile is writable (playwright#42768).
// Gecko supports MOZ_APP_DATA and MOZ_LOCAL_APP_DATA in GetUserDataDirectory.
// Keep both roots local to this run; do not touch the user's browser or HOME.
function browserLaunchOptions(browser, {
  platform = process.platform,
  env = process.env,
  tempRoot = path.resolve(__dirname, '../../../.tools/tmp'),
} = {}) {
  if (browser !== 'firefox' || platform !== 'darwin') return {};
  if (env.MOZ_APP_DATA && env.MOZ_LOCAL_APP_DATA) return { env: { ...env } };
  fs.mkdirSync(tempRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(tempRoot, 'firefox-app-data-'));
  const data = path.join(directory, 'data');
  const local = path.join(directory, 'local');
  fs.mkdirSync(data); fs.mkdirSync(local);
  process.once('exit', () => {
    try { fs.rmSync(directory, { recursive: true, force: true }); } catch (_) { /* next run uses a fresh directory */ }
  });
  return { env: {
    ...env,
    MOZ_APP_DATA: env.MOZ_APP_DATA || data,
    MOZ_LOCAL_APP_DATA: env.MOZ_LOCAL_APP_DATA || local,
  } };
}

module.exports = { browserLaunchOptions };

// build.sh and the config's optional probe must use the same launch settings
// as the real project, otherwise they can skip a browser that actually works.
if (require.main === module) {
  const name = process.argv[2];
  if (!['chromium', 'firefox', 'webkit'].includes(name)) process.exit(2);
  require('@playwright/test')[name].launch(browserLaunchOptions(name))
    .then(browser => browser.close())
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
