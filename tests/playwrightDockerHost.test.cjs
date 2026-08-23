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


test('local WebKit gets one fresh-worker retry for renderer internal errors', () => {
  const config = fs.readFileSync(path.join(__dirname, 'playwright', 'playwright.config.js'), 'utf8');
  assert.match(config, /!process\.env\.CI/);
  assert.match(config, /candidates\.find\(project => project\.name === 'webkit'\)/);
  assert.match(config, /webkitProject\.retries = 1/);
  assert.match(config, /retries: process\.env\.CI \? 2 : 0/,
    'CI must retain its existing two-retry policy');
});

console.log(`\n${passed} tests passed`);
