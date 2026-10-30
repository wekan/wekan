'use strict';

// Strict-Transport-Security and the baseline headers on every response
// (models/lib/securityHeaders.js, server/securityHeaders.js).
//
//  - HSTS is sent over an https ROOT_URL, 180 days by default, this host only;
//  - negative: never for an http ROOT_URL, never with 0, never preload without
//    includeSubDomains and a year, and a broken value does not turn it off;
//  - the middleware is a rawHandler loaded by the server, the settings are in
//    the catalog (so Admin Panel / People / Login shows them) and on every
//    platform (tests/authConfigCatalog.test.cjs checks those).
//
// Run: node tests/securityHeaders.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { hstsHeader, securityHeaders, hstsConfig } = require('../models/lib/securityHeaders');
const { AUTH_CONFIG_SECTIONS } = require('../models/lib/authConfigCatalog');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}
const env = values => name => values[name];

test('an https site sends HSTS for 180 days, this host only, by default', () => {
  assert.strictEqual(hstsHeader(env({}), 'https://wekan.example.com'), 'max-age=15552000');
  const names = securityHeaders(env({}), 'https://wekan.example.com').map(([n]) => n);
  assert.deepStrictEqual(names, ['X-Content-Type-Options', 'Referrer-Policy', 'Strict-Transport-Security']);
});

test('the administrator chooses the max-age, subdomains and preload', () => {
  assert.strictEqual(
    hstsHeader(env({ HSTS_MAX_AGE: '31536000', HSTS_INCLUDE_SUBDOMAINS: 'true', HSTS_PRELOAD: 'true' }), 'https://x.example'),
    'max-age=31536000; includeSubDomains; preload',
  );
  assert.strictEqual(hstsHeader(env({ HSTS_MAX_AGE: '999999999' }), 'https://x.example'), 'max-age=63072000', 'capped at two years');
});

test('negative: no HSTS over http, or with max-age 0', () => {
  assert.strictEqual(hstsHeader(env({}), 'http://wekan.example.com'), null, 'it would lock an http site out');
  assert.strictEqual(hstsHeader(env({}), ''), null);
  assert.strictEqual(hstsHeader(env({}), 'not a url'), null);
  assert.strictEqual(hstsHeader(env({ HSTS_MAX_AGE: '0' }), 'https://x.example'), null);
  const names = securityHeaders(env({}), 'http://x.example').map(([n]) => n);
  assert.ok(!names.includes('Strict-Transport-Security'));
  assert.ok(names.includes('X-Content-Type-Options'), 'the baseline is still sent');
});

test('negative: preload only together with includeSubDomains and a year', () => {
  assert.strictEqual(hstsHeader(env({ HSTS_PRELOAD: 'true' }), 'https://x.example'), 'max-age=15552000');
  assert.strictEqual(
    hstsHeader(env({ HSTS_PRELOAD: 'true', HSTS_INCLUDE_SUBDOMAINS: 'true' }), 'https://x.example'),
    'max-age=15552000; includeSubDomains',
    '180 days is too short for the preload list',
  );
});

test('negative: a value that is not a number keeps the default rather than switching HSTS off', () => {
  for (const bad of ['-1', 'abc', '1.5']) {
    assert.strictEqual(hstsConfig(env({ HSTS_MAX_AGE: bad })).maxAge, 15552000, bad);
  }
});

test('the server loads the middleware as a rawHandler, and the settings are in the catalog', () => {
  assert.match(read('server/imports.js'), /import '\/server\/securityHeaders';/);
  assert.match(read('server/securityHeaders.js'), /WebApp\.rawHandlers\.use\(/);
  assert.match(read('server/securityHeaders.js'), /authEnv/, 'an Admin Panel value applies without a restart');
  const vars = AUTH_CONFIG_SECTIONS.httpSecurity.fields.map(f => f.envVar);
  assert.deepStrictEqual(vars, ['HSTS_MAX_AGE', 'HSTS_INCLUDE_SUBDOMAINS', 'HSTS_PRELOAD']);
  assert.match(read('client/components/settings/peopleBody.jade'), /\+authProviderSettings\(httpSecurityData\)/);
});

console.log(`securityHeaders: ${passed} tests passed`);
