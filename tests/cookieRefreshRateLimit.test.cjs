'use strict';
// Meteor's HttpOnly login cookie refresh is limited to 30 per 10 seconds per
// client address. ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT raises it; the browser
// test server sets it, because every spec comes from localhost and a quick run
// signed its own users out (the 18-rtl-layout "list pages" flake).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'server/accounts-common.js'), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const fnSource = source.match(/export function cookieRefreshRateLimit\(value\) \{[\s\S]*?\n\}/)[0]
  .replace('export function', 'function');
const cookieRefreshRateLimit = vm.runInNewContext(`${fnSource}; cookieRefreshRateLimit`);

test('a positive whole number raises the per-10-seconds allowance', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(cookieRefreshRateLimit('100000'))),
    { httpOnlyCookieRateLimit: { max: 100000, windowMs: 10000 } });
  assert.deepEqual(JSON.parse(JSON.stringify(cookieRefreshRateLimit('31'))).httpOnlyCookieRateLimit.max, 31);
});

test('negative: anything else leaves Meteor\'s default rather than disabling the limit', () => {
  for (const value of [undefined, '', '0', '-5', '1.5', 'abc', 'false', 'Infinity']) {
    assert.deepEqual(JSON.parse(JSON.stringify(cookieRefreshRateLimit(value))), {}, String(value));
  }
});

test('Accounts.config receives it, and only from the server environment', () => {
  assert.match(source, /\.\.\.cookieRefreshRateLimit\(process\.env\.ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT\),/);
  // false would switch Meteor's limiter off entirely; never pass it.
  assert.doesNotMatch(source, /httpOnlyCookieRateLimit:\s*false/);
});

test('the browser test server raises it, and documentation names it', () => {
  const build = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
  assert.match(build, /export ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT="\$\{ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT:-100000\}"/);
  const docs = fs.readFileSync(path.join(root, 'docs/Features/Admin-Panel/People/Login.md'), 'utf8');
  assert.match(docs, /ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT/);
});

test('loginWithToken waits out a 429 on the cookie refresh, and only that', () => {
  const auth = fs.readFileSync(path.join(root, 'tests/playwright/helpers/auth.js'), 'utf8');
  assert.match(auth, /response\.status\(\) === 429 && response\.url\(\)\.includes\('\/_accounts\/cookie\/refresh'\)/);
  assert.match(auth, /if \(!throttled\) throw error;/);
});

console.log(`\ncookieRefreshRateLimit: all ${passed} tests passed`);
