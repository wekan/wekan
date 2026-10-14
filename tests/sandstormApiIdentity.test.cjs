'use strict';

// The REST API in a Sandstorm grain, with a Sandstorm API key (the Planned
// Sandstorm item). In a grain the bridge sets X-Sandstorm-User-Id itself and
// removes any a client sent, so there it says who is calling; anywhere else it
// is a header anybody can write. Run: node tests/sandstormApiIdentity.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sandstormApiIdentity } = require('../models/lib/sandstormApiIdentity');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}
const ID = '0123456789abcdef0123456789abcdef';
const headers = over => ({ 'x-sandstorm-user-id': ID, 'x-sandstorm-permissions': 'participate,configure', ...over });

test('in a grain, a key with participate is its user, for every method', () => {
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
    assert.deepEqual(sandstormApiIdentity(headers(), { sandstorm: true, method }), { sandstormId: ID, readOnly: false });
  }
});

test('a key without participate reads only', () => {
  assert.deepEqual(sandstormApiIdentity(headers({ 'x-sandstorm-permissions': '' }), { sandstorm: true, method: 'GET' }),
    { sandstormId: ID, readOnly: true });
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
    assert.equal(sandstormApiIdentity(headers({ 'x-sandstorm-permissions': 'configure' }), { sandstorm: true, method }), null, method);
  }
});

test('negative: off Sandstorm the header is anybody\'s, and is never believed', () => {
  assert.equal(sandstormApiIdentity(headers(), { sandstorm: false, method: 'GET' }), null);
  assert.equal(sandstormApiIdentity(headers(), {}), null);
  assert.equal(sandstormApiIdentity(headers(), { sandstorm: 'true' }), null, 'only the real setting');
});

test('negative: an anonymous or malformed caller is nobody', () => {
  for (const id of [undefined, '', 'admin', `${ID}0`, ID.toUpperCase(), { $ne: null }]) {
    assert.equal(sandstormApiIdentity(headers({ 'x-sandstorm-user-id': id }), { sandstorm: true }), null, String(id));
  }
  assert.equal(sandstormApiIdentity(null, { sandstorm: true }), null);
});

test('the middleware uses it only in a grain, after a WeKan token, for an enabled account', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'apiMiddleware.js'), 'utf8');
  const tokenAt = src.indexOf('function authenticateByToken(');
  const keyAt = src.indexOf('function authenticateSandstormApiKey(');
  assert.ok(tokenAt > 0 && keyAt > tokenAt, 'after the token step');
  const body = src.slice(keyAt, src.indexOf('\n});', keyAt));
  assert.match(body, /if \(req\.userId \|\| !isSandstormGrain\) return next\(\);/);
  assert.match(body, /'services\.sandstorm\.id': identity\.sandstormId/);
  assert.match(body, /allowActiveUser\(user, 'sandstormApiKey', req\)/);
  assert.doesNotMatch(body, /insert|upsert|createUser|updateOrCreateUser/, 'never creates an account');
});

console.log(`sandstormApiIdentity: ${passed} tests passed`);
