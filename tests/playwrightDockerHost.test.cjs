'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const build = fs.readFileSync(path.join(__dirname, '..', 'build.sh'), 'utf8');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

console.log('playwrightDockerHost:');

test('Docker is discovered directly or through the Flatpak host bridge', () => {
  assert.match(build, /function docker_available\(\)/);
  assert.match(build, /command -v flatpak-spawn/);
  assert.match(build, /flatpak-spawn --host sh -lc 'command -v docker/);
});

test('Docker commands use the shared host-aware wrapper', () => {
  assert.match(build, /function docker_exec\(\)/);
  assert.match(build, /flatpak-spawn --host docker "\$@"/);
  assert.match(build, /docker_exec run --rm --init --ipc=host --network host/);
  assert.match(build, /docker_exec pull "mcr\.microsoft\.com\/playwright:/);
});

test('the Playwright runner fails clearly only when neither route exists', () => {
  const runner = build.slice(
    build.indexOf('function run_playwright_docker'),
    build.indexOf('function run_playwright_webkit_docker'),
  );
  assert.match(runner, /if ! docker_available; then/);
  assert.doesNotMatch(runner, /command -v docker/);
});

test("the runner installs local browsers and falls back per browser", () => {
  assert.ok(build.includes("function ensure_playwright_test_dependencies()"));
  assert.ok(build.includes("function ensure_native_playwright_browser()"));
  assert.ok(build.includes("$WEKAN_DIR/.tools/ms-playwright"));
  assert.ok(build.includes("! native_browser_can_launch \"$browser\" && docker_available"));
  const config = fs.readFileSync(path.join(__dirname, "playwright", "playwright.config.js"), "utf8");
  assert.ok(config.includes("LOCAL_BROWSER_CACHE"));
  assert.ok(config.includes("ms-playwright"));
  assert.ok(build.includes("function native_browser_is_installed()"));
  assert.ok(build.includes("WEKAN_PLAYWRIGHT_PROJECT=\"$browser\""));
  assert.ok(config.includes("SELECTED_BROWSER"));
  assert.ok(/SELECTED_BROWSER[\s\S]*name: SELECTED_BROWSER/.test(config));
});


test('browser retry policy preserves normal runs and stops immediately in bail mode', () => {
  const source = fs.readFileSync(path.join(__dirname, 'playwright', 'playwright.config.js'), 'utf8');
  const vm = require('node:vm');
  function config(env) {
    const sandbox = {
      module: { exports: {} }, __dirname: path.join(__dirname, 'playwright'),
      process: { env: { WEKAN_PLAYWRIGHT_PROBE: '0', WEKAN_PLAYWRIGHT_ALL: '1', ...env } },
      require: name => name === '@playwright/test'
        ? { defineConfig: value => value, devices: {} } : require(name),
    };
    vm.runInNewContext(source, sandbox);
    return sandbox.module.exports;
  }
  assert.strictEqual(config({}).projects.find(project => project.name === 'webkit').retries, 1);
  assert.strictEqual(config({ CI: '1' }).retries, 2, 'normal CI retains its retries');
  assert.strictEqual(config({}).use.trace, 'on-first-retry');
  for (const CI of ['', '1']) {
    const value = config({ CI, WEKAN_TEST_BAIL: '1' });
    assert.strictEqual(value.retries, 0, 'bail stops at the first failure');
    assert.strictEqual(value.maxFailures, 1);
    assert.strictEqual(value.use.trace, 'retain-on-failure', 'first failure retains evidence without retrying');
    assert.ok(value.projects.every(project => !project.retries), 'no project can override bail with a retry');
    assert.deepStrictEqual(Array.from(value.projects, project => project.name), ['chromium', 'firefox', 'webkit']);
  }
});

console.log(`\n${passed} tests passed`);
