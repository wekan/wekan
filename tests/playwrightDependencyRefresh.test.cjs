'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const helper = source.slice(source.indexOf('function ensure_playwright_test_dependencies(){'),
  source.indexOf('\nfunction native_browser_is_installed(){'));
const parent = path.join(root, '.tools/tmp');
fs.mkdirSync(parent, { recursive: true });
const fixture = fs.mkdtempSync(path.join(parent, 'playwright-dependency-'));
try {
  const bin = path.join(fixture, 'tests/playwright/node_modules/.bin');
  fs.mkdirSync(bin, { recursive: true });
  const executable = path.join(bin, 'playwright');
  fs.writeFileSync(executable, '#!/bin/sh\n', { mode: 0o755 });
  for (const scenario of ['cached', 'stale', 'install-fails', 'missing']) {
    if (scenario === 'missing') fs.unlinkSync(executable);
    const result = spawnSync('bash', ['-c', `
${helper}
meteor() {
  printf 'npm-call:%s\\n' "$*" >> "$WEKAN_DIR/calls"
  case "$*" in
    'npm ls --depth=0') [ "$SCENARIO" = cached ];;
    'npm install') [ "$SCENARIO" != install-fails ];;
    *) return 99;;
  esac
}
ensure_playwright_test_dependencies
`, ], { encoding: 'utf8', env: { ...process.env, WEKAN_DIR: fixture, SCENARIO: scenario, TMPDIR: parent } });
    const calls = fs.readFileSync(path.join(fixture, 'calls'), 'utf8');
    assert.equal(result.status, scenario === 'install-fails' ? 1 : 0, result.stderr);
    if (scenario === 'cached') assert.doesNotMatch(calls, /npm install/);
    else assert.match(calls, /npm install/);
    if (scenario === 'missing') assert.doesNotMatch(calls, /npm ls/);
    fs.unlinkSync(path.join(fixture, 'calls'));
    console.log(`PASS Playwright dependency refresh: ${scenario}`);
  }
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
assert.match(source, /-e TMPDIR=\/repo\/\.tools\/tmp/);
const e2e = fs.readFileSync(path.join(root, 'tests/e2e/list-regressions.js'), 'utf8');
assert.doesNotMatch(e2e, /ARTIFACT_DIR.*\/tmp\/wekan/);
