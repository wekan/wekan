'use strict';

// Guard (2026-10-02): with WITH_API off, the REST API is refused by a gate
// that tested req.url.startsWith('/api') - but Express matches routes
// case-insensitively and on the decoded path, so /API/... and /%61pi/...
// reached every API handler anyway.
// Run: node tests/apiGateCase.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/apiMiddleware.js'), 'utf8');
const fnSrc = src.slice(src.indexOf('function isApiPath(url) {'), src.indexOf('\n}\n', src.indexOf('function isApiPath(url) {')) + 2);
// eslint-disable-next-line no-new-func
const isApiPath = new Function(`${fnSrc}\nreturn isApiPath;`)();

test('every spelling Express routes to the API is gated', () => {
  for (const url of ['/api/boards', '/API/boards', '/Api/user', '/%61pi/boards', '/%41PI/users', '/api', '/api?x=1']) {
    assert.equal(isApiPath(url), true, url);
  }
});

test('nothing else is (negative)', () => {
  for (const url of ['/', '/b/x/board', '/apiary', '/cdn/storage/attachments/x', '/sign-in', '/%zz']) {
    assert.equal(isApiPath(url), false, url);
  }
});

test('the gate uses it', () => {
  assert.match(src, /const api = isApiPath\(req\.url\);/);
  assert.doesNotMatch(src, /req\.url\.startsWith\('\/api'\)/);
});

// #794: the inbound email endpoints pass the WITH_API gate - and nothing else
// does. A mail provider or Amazon SES posts there; those routes have gates of
// their own.
{
  const at = src.indexOf('function isInboundEmailPath(req) {');
  const inboundSrc = src.slice(src.indexOf('const INBOUND_EMAIL_PATHS'), src.indexOf('\n}\n', at) + 2);
  const isInboundEmailPath = new Function(`${inboundSrc}\nreturn isInboundEmailPath;`)();
  for (const url of ['/api/inbound-email', '/api/inbound-email?secret=x', '/api/inbound-email/', '/api/inbound-email/ses',
    '/api/%69nbound-email', '/api/inbound-email/bounces/mailgun', '/api/inbound-email/bounces/postmark?secret=x',
    '/api/inbound-email/bounces/resend']) {
    assert.equal(isInboundEmailPath({ method: 'POST', url }), true, url);
  }
  // Negative: another method, another API path, a path that only starts the
  // same, a traversal, an undecodable one.
  for (const [method, url] of [['GET', '/api/inbound-email'], ['POST', '/api/boards'], ['POST', '/api/inbound-email-x'],
    ['POST', '/api/inbound-email/../boards'], ['POST', '/api/inbound-email/ses/x'], ['POST', '/api/inbound-email%'],
    ['POST', '/API/inbound-email'], ['POST', '/api/inbound-email/bounces/evil'], ['POST', '/api/inbound-email/bounces/'],
    ['POST', '/api/inbound-email/bounces/mailgun/x'], ['GET', '/api/inbound-email/bounces/mailgun']]) {
    assert.equal(isInboundEmailPath({ method, url }), false, `${method} ${url}`);
  }
  assert.match(src, /if \(\(api && process\.env\.WITH_API === 'true'\) \|\| !api \|\| isInboundEmailPath\(req\)\) \{/);
  console.log('  ok - only the inbound email endpoints pass the WITH_API gate');
}
