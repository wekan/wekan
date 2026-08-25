'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  ldapPresenceUpdate,
} = require('../packages/wekan-ldap/server/presenceSync');

const read = (relative) =>
  fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const syncSource = read('packages/wekan-ldap/server/sync.js');
const ldapSource = read('packages/wekan-ldap/server/ldap.js');
const documentation = read('docs/Features/Login/LDAP.md');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#4654 disables a confirmed missing LDAP user when explicitly enabled', () => {
  assert.deepStrictEqual(
    ldapPresenceUpdate({
      ldapUserFound: false,
      disableNonexistentUsers: true,
      loginDisabled: false,
    }),
    { loginDisabled: true },
  );
});

test('#4654 re-enables an LDAP user that reappears', () => {
  assert.deepStrictEqual(
    ldapPresenceUpdate({
      ldapUserFound: true,
      disableNonexistentUsers: true,
      loginDisabled: true,
    }),
    { loginDisabled: false },
  );
});

test('negative: default mode never changes active status', () => {
  for (const ldapUserFound of [true, false]) {
    for (const loginDisabled of [true, false, undefined]) {
      assert.strictEqual(
        ldapPresenceUpdate({
          ldapUserFound,
          disableNonexistentUsers: false,
          loginDisabled,
        }),
        null,
      );
    }
  }
});

test('negative: already-correct states do not produce redundant writes', () => {
  assert.strictEqual(
    ldapPresenceUpdate({
      ldapUserFound: true,
      disableNonexistentUsers: true,
      loginDisabled: false,
    }),
    null,
  );
  assert.strictEqual(
    ldapPresenceUpdate({
      ldapUserFound: false,
      disableNonexistentUsers: true,
      loginDisabled: true,
    }),
    null,
  );
});

test('#4654 repeat sync uses the stored ID attribute and real update writes', () => {
  assert.match(
    syncSource,
    /getUserById\(user\.services\.ldap\.id, user\.services\.ldap\.idAttribute\)/,
  );
  assert.match(
    syncSource,
    /updateAsync\(\{ _id: user\._id \}, \{ \$set: \{ username \}\}\)/,
  );
  assert.match(syncSource, /'emails\.0\.address': email/);
  assert.match(syncSource, /'profile\.fullname' : fullname/);
  assert.doesNotMatch(
    syncSource,
    /findOne(?:Async)?\(\{ _id: user\._id \}, \{ \$set:/,
  );
});

test('ambiguous or unconfigured ID lookups abort instead of disabling users', () => {
  assert.match(ldapSource, /if \(!filter\) \{\s*throw new Error\(/);
  assert.match(ldapSource, /if \(result\.length > 1\) \{\s*throw new Error\(/);
  assert.match(ldapSource, /ambiguous LDAP background-sync update/);
});

test('the background loop wires both presence outcomes through the helper', () => {
  const calls = syncSource.match(/ldapPresenceUpdate\(\{/g) || [];
  assert.strictEqual(calls.length, 2);
  assert.match(syncSource, /ldapUserFound: true/);
  assert.match(syncSource, /ldapUserFound: false/);
  assert.match(syncSource, /\{ \$set: presenceUpdate \}/);
});

test('documentation distinguishes confirmed removal from lookup failure', () => {
  assert.match(documentation, /successful LDAP search[\s\S]*no longer present/);
  assert.match(
    documentation,
    /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true/,
  );
  assert.match(
    documentation,
    /Lookup errors,[\s\S]*abort the run instead of[\s\S]*disabling accounts/,
  );
});

console.log(`\nldapBackgroundSync: all ${passed} tests passed`);
