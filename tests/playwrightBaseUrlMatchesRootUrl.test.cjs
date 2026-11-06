'use strict';

// Guard: the browser tests open WeKan at the test server's ROOT_URL origin.
// Run: node tests/playwrightBaseUrlMatchesRootUrl.test.cjs
//
// Meteor-Files sends every upload to ROOT_URL + /cdn/storage/<collection>/__upload
// (packages/ostrio:files client: `_rootUrl` is __meteor_runtime_config__.ROOT_URL)
// and answers no CORS preflight for any other origin. build.sh started the test
// server with ROOT_URL=http://localhost:3000 but sent the Docker Playwright
// browsers to http://127.0.0.1:3000, so every upload from a page was blocked:
//
//   Access to fetch at 'http://localhost:3000/cdn/storage/attachments/__upload'
//   from origin 'http://127.0.0.1:3000' has been blocked by CORS policy
//
// and the four drawing specs whose Save uploads an attachment timed out. Run
// with WEKAN_BASE_URL=http://localhost:3000 the same eight drawing tests pass.
// A health check with curl may still use 127.0.0.1 - only a browser is bound
// by the origin - so this checks what browsers are given, not every address.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const buildSh = fs.readFileSync(path.join(repoRoot, 'build.sh'), 'utf8');
const config = fs.readFileSync(path.join(repoRoot, 'tests/playwright/playwright.config.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const origin = url => new URL(url).origin;

// Every ROOT_URL the test servers are started with.
const rootUrls = [...buildSh.matchAll(/\bROOT_URL="?(http:\/\/(?:localhost|127\.0\.0\.1):3000)"?/g)].map(m => m[1]);
// Every default a browser run is given.
const baseDefaults = [...buildSh.matchAll(/WEKAN_BASE_URL:-(http:\/\/[^}"\s]+)\}/g)].map(m => m[1]);

test('the scan finds the test server ROOT_URLs and the browser defaults', () => {
  assert.ok(rootUrls.length >= 3, `ROOT_URLs found: ${rootUrls.length}`);
  assert.ok(baseDefaults.length >= 2, `WEKAN_BASE_URL defaults found: ${baseDefaults.length}`);
});

test('the local test servers all use one ROOT_URL origin', () => {
  assert.deepStrictEqual([...new Set(rootUrls.map(origin))], ['http://localhost:3000']);
});

test('every browser default in build.sh is that ROOT_URL origin', () => {
  const wrong = baseDefaults.filter(u => origin(u) !== 'http://localhost:3000');
  assert.deepStrictEqual(wrong, [],
    'a browser opened on another origin than ROOT_URL cannot upload (Meteor-Files CORS)');
});

test('the Playwright config default is that origin too', () => {
  const m = config.match(/const BASE_URL = process\.env\.WEKAN_BASE_URL \|\| '([^']+)'/);
  assert.ok(m, 'playwright.config.js BASE_URL default not found');
  assert.strictEqual(origin(m[1]), 'http://localhost:3000');
});

test('negative: the same check rejects the 127.0.0.1 default that broke uploads', () => {
  const broken = buildSh.replace('WEKAN_BASE_URL:-http://localhost:3000}', 'WEKAN_BASE_URL:-http://127.0.0.1:3000}');
  const defaults = [...broken.matchAll(/WEKAN_BASE_URL:-(http:\/\/[^}"\s]+)\}/g)].map(m => m[1]);
  assert.ok(defaults.some(u => origin(u) !== 'http://localhost:3000'));
});

console.log(`\n${passed} passed`);
