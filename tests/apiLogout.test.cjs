'use strict';

// Plain-Node unit test (no Meteor) for the POST /users/logout planning helper.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/apiLogout.test.cjs
//
// Regression guard for #1437 ("Old tokens are not replaced or set invalid"):
// the REST API had POST /users/login but no logout, so tokens acquired via
// the API could never be invalidated server-side. buildLogoutPlan must
// produce the exact Mongo update that revokes the presented token (default)
// or every token ({ all: true }), and must cleanly reject unauthenticated
// requests — never throwing, never yielding an update without a user filter.

const assert = require('assert');
const {
  buildLogoutPlan,
  wantsAllSessions,
} = require('../models/lib/apiLogout');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const USER = 'user123';
const HASH = 'sha256-hashed-token-value';

// --- positive: default single-token logout ---------------------------------
test('authenticated request revokes exactly the presented token via $pull', () => {
  const r = buildLogoutPlan({ userId: USER, hashedToken: HASH });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.all, false);
  assert.deepStrictEqual(r.selector, { _id: USER });
  assert.deepStrictEqual(r.modifier, {
    $pull: { 'services.resume.loginTokens': { hashedToken: HASH } },
  });
});

test('single-token logout matches by hashedToken (never the raw token)', () => {
  const r = buildLogoutPlan({ userId: USER, hashedToken: HASH });
  const pull = r.modifier.$pull['services.resume.loginTokens'];
  assert.deepStrictEqual(Object.keys(pull), ['hashedToken']);
  assert.strictEqual(pull.hashedToken, HASH);
});

// --- positive: logout everywhere --------------------------------------------
test('{ all: true } clears every resume login token of the user', () => {
  const r = buildLogoutPlan({ userId: USER, hashedToken: HASH, all: true });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.all, true);
  assert.deepStrictEqual(r.selector, { _id: USER });
  assert.deepStrictEqual(r.modifier, {
    $set: { 'services.resume.loginTokens': [] },
  });
});

test('urlencoded bodies work: all="true" / "1" / "yes" mean everywhere', () => {
  ['true', '1', 'yes', ' TRUE '].forEach(v => {
    const r = buildLogoutPlan({ userId: USER, hashedToken: HASH, all: v });
    assert.strictEqual(r.all, true, `all=${JSON.stringify(v)}`);
  });
});

test('{ all: true } does not require a hashed token (revokes leaked ones too)', () => {
  const r = buildLogoutPlan({ userId: USER, all: true });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.all, true);
});

// --- negative: falsy / unknown `all` values stay in single-token mode --------
test('all=false / "false" / "0" / undefined stay in single-token mode', () => {
  [false, 'false', '0', 'no', undefined, null, 0, ''].forEach(v => {
    const r = buildLogoutPlan({ userId: USER, hashedToken: HASH, all: v });
    assert.strictEqual(r.ok, true, `all=${JSON.stringify(v)}`);
    assert.strictEqual(r.all, false, `all=${JSON.stringify(v)}`);
    assert.ok(r.modifier.$pull, 'must be a $pull of the single token');
  });
});

test('wantsAllSessions rejects arbitrary truthy junk (objects, arrays)', () => {
  [{}, [], 'maybe', 2, -1].forEach(v => {
    assert.strictEqual(wantsAllSessions(v), false, `all=${JSON.stringify(v)}`);
  });
});

// --- negative: unauthenticated requests are rejected with 401 ----------------
test('missing userId is rejected with 401 (no update plan produced)', () => {
  const r = buildLogoutPlan({ hashedToken: HASH });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 401);
  assert.strictEqual(r.error, 'unauthorized');
  assert.strictEqual(r.selector, undefined);
  assert.strictEqual(r.modifier, undefined);
});

test('empty / non-string userId is rejected with 401', () => {
  ['', null, undefined, 42, {}].forEach(uid => {
    const r = buildLogoutPlan({ userId: uid, hashedToken: HASH });
    assert.strictEqual(r.ok, false, `userId=${JSON.stringify(uid)}`);
    assert.strictEqual(r.status, 401, `userId=${JSON.stringify(uid)}`);
  });
});

test('single-token mode without a token is rejected with 401', () => {
  ['', null, undefined, 7].forEach(tok => {
    const r = buildLogoutPlan({ userId: USER, hashedToken: tok });
    assert.strictEqual(r.ok, false, `hashedToken=${JSON.stringify(tok)}`);
    assert.strictEqual(r.status, 401, `hashedToken=${JSON.stringify(tok)}`);
  });
});

// --- safety: selector always scopes to the authenticated user ----------------
test('every successful plan filters by the authenticated user id only', () => {
  [
    buildLogoutPlan({ userId: USER, hashedToken: HASH }),
    buildLogoutPlan({ userId: USER, hashedToken: HASH, all: true }),
  ].forEach(r => {
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(Object.keys(r.selector), ['_id']);
    assert.strictEqual(r.selector._id, USER);
  });
});

// --- nothing ever throws ------------------------------------------------------
test('never throws for a range of odd inputs', () => {
  const inputs = [
    undefined,
    null,
    {},
    { userId: USER },
    { hashedToken: HASH },
    { userId: 42, hashedToken: 42, all: 'garbage' },
    { userId: USER, hashedToken: HASH, all: {} },
  ];
  inputs.forEach(v => {
    assert.doesNotThrow(() => buildLogoutPlan(v));
    const r = buildLogoutPlan(v);
    assert.ok(r && typeof r.ok === 'boolean', 'result must always have a boolean ok');
  });
});

console.log(`\n${passed} tests passed.`);
