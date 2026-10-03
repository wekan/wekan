'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { browserLaunchOptions } = require('./playwright/helpers/browser-launch.cjs');
const root = path.resolve(__dirname, '..');

test('macOS Firefox isolates both app-data roots while preserving the launch environment', () => {
  const env = { HOME: '/unchanged-home', PATH: '/unchanged-path', CUSTOM: 'kept' };
  const options = browserLaunchOptions('firefox', { platform: 'darwin', env });
  const again = browserLaunchOptions('firefox', { platform: 'darwin', env });
  for (const key of ['MOZ_APP_DATA', 'MOZ_LOCAL_APP_DATA']) {
    assert.ok(options.env[key].startsWith(path.join(root, '.tools/tmp/firefox-app-data-')));
    assert.ok(fs.statSync(options.env[key]).isDirectory());
    assert.notEqual(options.env[key], again.env[key], 'separate runs cannot share bookkeeping');
  }
  assert.notEqual(options.env.MOZ_APP_DATA, options.env.MOZ_LOCAL_APP_DATA);
  for (const key of Object.keys(env)) assert.equal(options.env[key], env[key]);
  assert.equal(env.MOZ_APP_DATA, undefined, 'does not mutate the parent environment');
  assert.equal(options.args, undefined, 'does not disable a browser sandbox');
});

test('other browsers and platforms are unchanged, and explicit app-data overrides win', () => {
  for (const platform of ['linux', 'win32']) assert.deepEqual(browserLaunchOptions('firefox', { platform }), {});
  for (const browser of ['chromium', 'webkit']) assert.deepEqual(browserLaunchOptions(browser, { platform: 'darwin' }), {});
  const env = { MOZ_APP_DATA: '/custom/data', MOZ_LOCAL_APP_DATA: '/custom/local' };
  assert.deepEqual(browserLaunchOptions('firefox', { platform: 'darwin', env }), { env });
  assert.equal(browserLaunchOptions('firefox', { platform: 'darwin', env: { MOZ_APP_DATA: '/custom/data' } }).env.MOZ_APP_DATA, '/custom/data');
});

test('build-menu probe, config probe and real projects share the launch helper', () => {
  const build = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
  const config = fs.readFileSync(path.join(root, 'tests/playwright/playwright.config.js'), 'utf8');
  assert.match(build, /node helpers\/browser-launch\.cjs "\$browser"/);
  assert.match(config, /helpers\/browser-launch\.cjs'\), browserName/);
  assert.match(config, /project\.use\.launchOptions = browserLaunchOptions\(project\.name\)/);
  assert.doesNotMatch(build.slice(build.indexOf('function native_browser_can_launch'), build.indexOf('function run_pw_all_browser')), /\.launch\(\)/);
});
