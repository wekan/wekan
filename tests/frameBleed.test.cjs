'use strict';

// Guard: FrameBleed (2022, CWE-1021) - and its regression. With
// BROWSER_POLICY_ENABLED (the Docker and Snap default) WeKan must refuse being
// framed by any page but its own and TRUSTED_URL, or another site can load it
// in an invisible frame and trick a signed-in user into clicking through it.
// From 2022-04-08 every line of server/policy.js was commented out, so the
// app's pages carried no framing header at all (found 2026-10-02).
// Run: node tests/frameBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { framingHeaders, trustedOrigins } = require('../models/lib/framePolicy');

test('with the browser policy on, only WeKan itself and TRUSTED_URL may frame it', () => {
  assert.deepEqual(framingHeaders({ enabled: true }), {
    'Content-Security-Policy': "frame-ancestors 'self'", 'X-Frame-Options': 'SAMEORIGIN' });
  assert.deepEqual(framingHeaders({ enabled: true, trustedUrl: 'https://intra.example.com/portal, https://b.example:8443' }), {
    'Content-Security-Policy': "frame-ancestors 'self' https://intra.example.com https://b.example:8443" });
});

test('a malformed or non-web TRUSTED_URL never widens the policy (negative)', () => {
  assert.deepEqual(trustedOrigins("* 'unsafe-inline' javascript:alert(1) data:x ftp://x.example"), []);
  assert.deepEqual(framingHeaders({ enabled: true, trustedUrl: '*' }), {
    'Content-Security-Policy': "frame-ancestors 'self'", 'X-Frame-Options': 'SAMEORIGIN' });
  // Policy off, or Sandstorm (which always frames WeKan): no header.
  assert.deepEqual(framingHeaders({ enabled: false }), {});
  assert.deepEqual(framingHeaders({ enabled: true, sandstorm: true }), {});
});

test('the server sets it on every response, and nothing is left commented out', () => {
  const policy = read('server/policy.js');
  assert.match(policy, /enabled: process\.env\.BROWSER_POLICY_ENABLED === 'true',/);
  assert.match(policy, /trustedUrl: process\.env\.TRUSTED_URL,/);
  assert.match(policy, /WebApp\.rawHandlers\.use\(\(req, res, next\) => \{\s*for \(const \[name, value\] of Object\.entries\(FRAMING_HEADERS\)\) res\.setHeader\(name, value\);/);
  assert.match(read('server/imports.js'), /import '\/server\/policy';/);
});
