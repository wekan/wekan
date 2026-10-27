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

// SVG / file CSP lost on revalidation (found 2026-10-27, by
// tests/playwright/specs/svg-attachment.e2e.js): files are served
// `private, no-cache`, so the browser revalidates its stored copy and the
// server answers 304. A 304 UPDATES the stored response's headers (RFC 9111
// 4.3.4), and the app-wide `frame-ancestors 'self'` it carried replaced the
// file's own `default-src 'none'; ... sandbox` - the fetched SVG came back
// with `frame-ancestors 'self'` as its only policy.
const { framingHeadersToDropOnNotModified } = require('../models/lib/framePolicy');

test('a 304 does not carry the app-wide framing headers over a stored file policy', () => {
  const framing = framingHeaders({ enabled: true });
  const onResponse = { ...framing, ETag: '"abc"' };
  assert.deepEqual(framingHeadersToDropOnNotModified(framing, n => onResponse[n]).sort(),
    ['Content-Security-Policy', 'X-Frame-Options']);
});

test('a policy a route set on the response itself is never dropped (negative)', () => {
  const framing = framingHeaders({ enabled: true });
  const onResponse = { 'Content-Security-Policy': "default-src 'none'; sandbox;", 'X-Frame-Options': 'DENY' };
  assert.deepEqual(framingHeadersToDropOnNotModified(framing, n => onResponse[n]), []);
  // Policy off: nothing set, nothing dropped.
  assert.deepEqual(framingHeadersToDropOnNotModified(framingHeaders({ enabled: false }), () => undefined), []);
});

test('the server drops them on every 304, and only there', () => {
  const policy = read('server/policy.js');
  assert.match(policy, /res\.writeHead = function writeHeadKeepingStoredPolicy\(statusCode, \.\.\.rest\) \{\s*if \(Number\(statusCode\) === 304\) \{\s*for \(const name of framingHeadersToDropOnNotModified\(FRAMING_HEADERS, n => res\.getHeader\(n\)\)\) res\.removeHeader\(name\);\s*\}\s*return writeHead\.call\(this, statusCode, \.\.\.rest\);/);
});

test('no other app-wide handler sets a Content-Security-Policy a 304 could carry (negative)', () => {
  // The fault's shape is an every-response CSP: any raw/connect-level
  // handler that sets one would replace a stored file's policy on its 304.
  // policy.js is the one, and it drops its own on a 304.
  const offenders = [];
  const skip = new Set(['node_modules', '.git', '.build', '_build', '.tools', 'tests', 'public']);
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(c|m)?js$/.test(entry.name)) {
        const src = read(rel);
        const handler = /(?:rawHandlers|rawConnectHandlers|rawExpressHandlers)\.use\(/.test(src);
        if (handler && /Content-Security-Policy/.test(src) && rel !== path.join('server', 'policy.js')) offenders.push(rel);
      }
    }
  };
  for (const dir of ['server', 'models', 'packages', 'imports', 'config']) {
    if (fs.existsSync(path.join(ROOT, dir))) walk(dir);
  }
  assert.deepEqual(offenders, []);
});
