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

console.log(`\n${passed} tests passed`);
