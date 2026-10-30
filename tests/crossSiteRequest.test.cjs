'use strict';

// A state-changing HTTP request that carries the login only as the cookie must
// come from WeKan's own origin (models/lib/crossSiteRequest.js,
// server/crossSiteRequestGuard.js).
//
//  - test: the forged request - another site POSTing to /import-trello with the
//    victim's cookie - is refused, and so are Origin: null and a cross-site
//    Referer;
//  - negative: WeKan's own requests, GETs, token-authenticated API calls,
//    requests without the cookie, Meteor's cookie routes and DDP all pass,
//    behind a proxy too;
//  - the guard is a rawHandler (before every route, so no route can be
//    registered ahead of it), its refusal reaches Admin Panel / Problems, and
//    it never blocks the victim's account.
//
// Run: node tests/crossSiteRequest.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { crossSiteCookieRequest } = require('../models/lib/crossSiteRequest');
const { CATALOG } = require('../models/lib/securityCategories');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const ROOT = 'https://wekan.example.com';
const COOKIE = 'meteor_login_token=abcdefghijklmnop';
function req(method, url, headers = {}) {
  return { method, url, headers: { host: 'wekan.example.com', ...headers } };
}

test('a forged POST from another site with the victim\'s cookie is refused', () => {
  const d = crossSiteCookieRequest(req('POST', '/import-trello', { cookie: COOKIE, origin: 'https://evil.example' }), ROOT);
  assert.deepStrictEqual(d, { block: true, origin: 'evil.example', reason: 'origin' });
  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    assert.strictEqual(crossSiteCookieRequest(req(method, '/api/x', { cookie: COOKIE, origin: 'https://evil.example' }), ROOT).block, true, method);
  }
});

test('Origin: null, a cross-site Referer and the other login cookie are refused too', () => {
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/import-trello', { cookie: COOKIE, origin: 'null' }), ROOT).block, true);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/import-trello', { cookie: COOKIE, referer: 'https://evil.example/page' }), ROOT).block, true);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/x', { cookie: 'wekan_login_token=t0k3n', origin: 'https://evil.example' }), ROOT).block, true);
  assert.strictEqual(
    crossSiteCookieRequest(req('POST', '/x', { cookie: COOKIE, origin: 'https://wekan.example.com.evil.example' }), ROOT).block, true,
    'a lookalike host is not this site');
});

test('negative: WeKan\'s own requests pass, also behind a proxy and on another port', () => {
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/import-trello', { cookie: COOKIE, origin: ROOT }), ROOT).block, false);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/import-trello', { cookie: COOKIE, referer: `${ROOT}/b/x` }), ROOT).block, false);
  const proxied = { host: '127.0.0.1:3000', 'x-forwarded-host': 'kanban.example.org', cookie: COOKIE, origin: 'https://kanban.example.org' };
  assert.strictEqual(crossSiteCookieRequest({ method: 'POST', url: '/import-trello', headers: proxied }, 'http://127.0.0.1:3000').block, false);
  assert.strictEqual(crossSiteCookieRequest(
    { method: 'POST', url: '/x', headers: { host: 'localhost:8080', cookie: COOKIE, origin: 'http://localhost:8080' } }, 'http://localhost:8080').block, false);
});

test('negative: a Sandstorm grain passes - the bridge sends the grain\'s own host', () => {
  // sandstorm-http-bridge.c++ writes Host: from X-Sandstorm-Base-Path, while
  // ROOT_URL stays the internal http://127.0.0.1:4000.
  const headers = {
    host: 'ui-abc123.sandstorm.example', 'x-sandstorm-base-path': 'https://ui-abc123.sandstorm.example',
    cookie: COOKIE, origin: 'https://ui-abc123.sandstorm.example',
  };
  assert.strictEqual(crossSiteCookieRequest({ method: 'POST', url: '/import-trello', headers }, 'http://127.0.0.1:4000').block, false);
  assert.strictEqual(crossSiteCookieRequest(
    { method: 'POST', url: '/import-trello', headers: { ...headers, origin: 'https://ui-other.sandstorm.example' } },
    'http://127.0.0.1:4000').block, true, 'another grain is another site');
});

test('negative: requests that cannot be forged this way are not checked', () => {
  const evil = { cookie: COOKIE, origin: 'https://evil.example' };
  assert.strictEqual(crossSiteCookieRequest(req('GET', '/b/x', evil), ROOT).block, false, 'GET changes nothing');
  assert.strictEqual(crossSiteCookieRequest(req('OPTIONS', '/api/x', evil), ROOT).block, false);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/api/x', { ...evil, authorization: 'Bearer t' }), ROOT).block, false, 'an explicit token');
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/api/x', { ...evil, 'x-auth-token': 't' }), ROOT).block, false);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/api/x?authToken=t', evil), ROOT).block, false);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/api/x', { origin: 'https://evil.example' }), ROOT).block, false, 'no login to misuse');
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/api/x', { cookie: 'other=1', origin: 'https://evil.example' }), ROOT).block, false);
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/_accounts/cookie/set', evil), ROOT).block, false, 'Meteor checks its own');
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/sockjs/123/abc/xhr_send', evil), ROOT).block, false, 'DDP');
  assert.strictEqual(crossSiteCookieRequest(req('POST', '/import-trello', { cookie: COOKIE }), ROOT).block, false, 'not a browser');
});

test('the guard runs before every route, is loaded, and reports to Admin Panel / Problems', () => {
  const guard = read('server/crossSiteRequestGuard.js');
  assert.match(guard, /WebApp\.rawHandlers\.use\(/, 'a rawHandler runs before every WebApp.handlers route');
  assert.match(read('server/imports.js'), /import '\/server\/crossSiteRequestGuard';/);
  assert.match(guard, /key: 'csrf\.cross-site-cookie', action: 'blocked'/);
  assert.match(guard, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.doesNotMatch(guard, /userId:/, 'the cookie is the victim\'s; the event is not theirs');
  assert.match(guard, /res\.writeHead\(403/);
});

test('negative: the refusal never blocks the victim\'s account', () => {
  const entry = CATALOG['csrf.cross-site-cookie'];
  assert.ok(entry, 'catalog key');
  assert.strictEqual(entry.blocksAccount, false);
  assert.strictEqual(entry.cwe, 'CWE-352');
});

test('negative: no route reads the login cookie through a handler that runs before the guard', () => {
  // A rawHandler registered by a route file could run ahead of the guard. Only
  // the header middlewares (cors, policy, securityHeaders), Sandstorm's startup
  // ping and Accept-Encoding fix, and the guard use them.
  const allowed = new Set(['server/cors.js', 'server/policy.js', 'server/securityHeaders.js',
    'server/crossSiteRequestGuard.js', 'server/sandstorm.js']);
  const { execFileSync } = require('child_process');
  const files = execFileSync('git', ['grep', '-l', 'WebApp.rawHandlers.use', '--', 'server', 'models'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  assert.deepStrictEqual(files.filter(f => !allowed.has(f)), []);
});

console.log(`crossSiteRequest: ${passed} tests passed`);
