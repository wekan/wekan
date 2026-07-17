'use strict';

// Regression tests for the LDAP connection leak (WeKan #6467 / #6469).
//
// Symptom reported by operators after an update: WeKan "dies really quickly"
// and "kills our openldap server with too many open connections", plus slow /
// failing logins ("Must be logged in"). Root cause: every LDAP login attempt
// (loginHandler.js) and every background sync run (sync.js) created a fresh
// `new LDAP()` + `connect()` but NEVER called `disconnect()`, so each attempt
// leaked a socket to the directory server until its connection limit was hit.
//
// These tests cover both the behavioural contract of the shared guard
// (runWithLdapDisconnect) and source-level guards that the leak-prone call
// sites actually route through it, including negative cases.
//
// Run: node tests/ldapConnectionRelease.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { runWithLdapDisconnect } = require('../packages/wekan-ldap/server/connectionGuard');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
const failures = [];
const pending = [];

function test(name, fn) {
  pending.push(
    Promise.resolve()
      .then(fn)
      .then(() => {
        passed += 1;
        console.log('  ok -', name);
      })
      .catch((err) => {
        failures.push({ name, err });
        console.log('  FAIL -', name, '-', err && err.message);
      }),
  );
}

// ---------------------------------------------------------------------------
// Behavioural contract of runWithLdapDisconnect
// ---------------------------------------------------------------------------

test('disconnects AFTER successful work and returns the work result', async () => {
  const events = [];
  const ldap = { disconnect: async () => { events.push('disconnect'); } };

  const result = await runWithLdapDisconnect(ldap, async () => {
    events.push('work');
    return 42;
  });

  assert.strictEqual(result, 42);
  // ordering matters: the connection is released only after the work is done
  assert.deepStrictEqual(events, ['work', 'disconnect']);
});

test('disconnects exactly once', async () => {
  let count = 0;
  const ldap = { disconnect: async () => { count += 1; } };

  await runWithLdapDisconnect(ldap, async () => {});

  assert.strictEqual(count, 1);
});

// Negative case: work throws. The connection must STILL be released, and the
// original error must propagate unchanged (this is the leak-on-failed-login
// path that exhausted OpenLDAP).
test('disconnects even when the work throws, and rethrows the original error', async () => {
  let disconnected = false;
  const ldap = { disconnect: async () => { disconnected = true; } };

  await assert.rejects(
    () => runWithLdapDisconnect(ldap, async () => { throw new Error('login boom'); }),
    /login boom/,
  );

  assert.strictEqual(disconnected, true);
});

// Negative case: a failing disconnect must never turn a successful login into
// a failure.
test('a failing disconnect does not turn a success into a failure', async () => {
  const ldap = { disconnect: async () => { throw new Error('unbind failed'); } };

  const result = await runWithLdapDisconnect(ldap, async () => 'ok');

  assert.strictEqual(result, 'ok');
});

// Negative case: a failing disconnect must not hide the real work error.
test('a failing disconnect does not mask the original work error', async () => {
  const ldap = { disconnect: async () => { throw new Error('unbind failed'); } };

  await assert.rejects(
    () => runWithLdapDisconnect(ldap, async () => { throw new Error('original'); }),
    /original/,
  );
});

// Negative case: tolerate an ldap object that never reached connect() (so it
// has no usable client / disconnect), and a null ldap. Cleanup must be a
// safe no-op.
test('tolerates an ldap without a disconnect method and a null ldap', async () => {
  assert.strictEqual(await runWithLdapDisconnect({}, async () => 'v'), 'v');
  assert.strictEqual(await runWithLdapDisconnect(null, async () => 'v2'), 'v2');
});

// ---------------------------------------------------------------------------
// Source-level guards: the leak-prone call sites route through the guard
// ---------------------------------------------------------------------------

const loginHandler = read('packages/wekan-ldap/server/loginHandler.js');
const sync = read('packages/wekan-ldap/server/sync.js');
const ldapClass = read('packages/wekan-ldap/server/ldap.js');
const testConnection = read('packages/wekan-ldap/server/testConnection.js');
const guard = read('packages/wekan-ldap/server/connectionGuard.js');

test('the shared guard releases the connection in a finally', () => {
  assert.ok(/finally\s*{[\s\S]*ldap\.disconnect\(\)/.test(guard),
    'runWithLdapDisconnect must call disconnect in a finally');
});

test('loginHandler runs the whole login flow through runWithLdapDisconnect', () => {
  assert.ok(loginHandler.includes("from './connectionGuard'"),
    'loginHandler must import the connection guard');

  const wrapIdx = loginHandler.indexOf('runWithLdapDisconnect(ldap');
  const connectIdx = loginHandler.indexOf('ldap.connect()');

  assert.ok(wrapIdx !== -1, 'loginHandler must wrap the flow in runWithLdapDisconnect');
  assert.ok(connectIdx !== -1, 'loginHandler must still connect');
  // Negative guard against the regression: connect() must live INSIDE the
  // guarded region, otherwise the connection could leak again.
  assert.ok(connectIdx > wrapIdx,
    'ldap.connect() must run inside runWithLdapDisconnect so it is always released');
});

test('background sync() disconnects in a finally on every exit path', () => {
  assert.ok(/finally\s*{[\s\S]*ldap\.disconnect\(\)/.test(sync),
    'sync() must release its LDAP connection in a finally');
});

test('importNewUsers disconnects ONLY the connection it owns', () => {
  assert.ok(sync.includes('ownConnection'),
    'importNewUsers must track whether it opened the connection itself');
  assert.ok(/if \(ownConnection\)\s*{\s*await ldap\.disconnect\(\)/.test(sync),
    'a borrowed connection (passed in by sync()) must not be closed here');
});

test('ldap.disconnect() is a safe no-op when connect() was never reached', () => {
  assert.ok(/if \(!this\.client\)\s*{\s*return;/.test(ldapClass),
    'disconnect() must guard against a missing client');
});

test('ldap_test_connection releases its connection too', () => {
  assert.ok(testConnection.includes("from './connectionGuard'"),
    'the admin "Test Connection" method must import the guard');
  assert.ok(testConnection.includes('runWithLdapDisconnect(ldap'),
    'the bind/return path must run through the guard');
  // Negative case: a failed connect() must still disconnect before rethrowing.
  assert.ok(/if \(ldap\)\s*{\s*await ldap\.disconnect\(\)/.test(testConnection),
    'a failed connect() must release anything opened before rethrowing');
});

// ---------------------------------------------------------------------------

Promise.all(pending).then(() => {
  if (failures.length) {
    console.error(`\n${failures.length} test(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${passed} LDAP connection-release tests passed`);
});
