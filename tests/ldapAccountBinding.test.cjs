'use strict';

// An LDAP login that finds a WeKan account by username or e-mail must not log
// into it when the account belongs to another directory entry (a reused login
// name); LDAP_EMAIL_MATCH_REQUIRE looked users up by _id = username and so
// never found one; and the background sync must not bind an account without
// an identifier to the first of several entries with its name.
// (packages/wekan-ldap/server/accountBinding.js, loginHandler.js, sync.js, ldap.js)
// Run: node tests/ldapAccountBinding.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { boundToAnotherEntry } = require('../packages/wekan-ldap/server/accountBinding');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const guid = (v, attribute = 'objectGUID') => ({ attribute, value: v });
const account = (id, idAttribute = 'objectGUID') => ({ _id: 'u1', username: 'jdevries', services: { ldap: { id, idAttribute } } });

test('a reused login name: the account records another entry\'s identifier -> refused', () => {
  assert.strictEqual(boundToAnotherEntry(account('aa11'), guid('bb22')), true);
});

test('negative: the same entry, an account without an identifier, a changed identifier attribute', () => {
  assert.strictEqual(boundToAnotherEntry(account('aa11'), guid('aa11')), false, 'same person');
  assert.strictEqual(boundToAnotherEntry({ _id: 'u1', username: 'x' }, guid('bb22')), false, 'local account merged into LDAP');
  assert.strictEqual(boundToAnotherEntry({ services: { ldap: {} } }, guid('bb22')), false);
  assert.strictEqual(boundToAnotherEntry(account('6a64', 'uid'), guid('bb22')), false, 'LDAP_UNIQUE_IDENTIFIER_FIELD changed: cannot compare');
  assert.strictEqual(boundToAnotherEntry(account('aa11', 'OBJECTGUID'), guid('aa11')), false, 'attribute names compare case-insensitively');
  assert.strictEqual(boundToAnotherEntry(account('aa11'), undefined), false, 'no identifier configured');
  assert.strictEqual(boundToAnotherEntry(undefined, guid('aa11')), false);
});

test('negative: an older account without idAttribute is not compared, so switching to objectGUID locks nobody out', () => {
  // the login name "jdevries" as hex, the identifier such accounts hold when
  // LDAP_UNIQUE_IDENTIFIER_FIELD was unset; the login now offers an objectGUID
  const byName = { services: { ldap: { id: Buffer.from('jdevries').toString('hex') } } };
  assert.strictEqual(boundToAnotherEntry(byName, guid('9f1c2b7e4a5d6e7f8091a2b3c4d5e6f7')), false);
  assert.strictEqual(boundToAnotherEntry({ services: { ldap: { id: 'aa11' } } }, guid('bb22')), false);
  assert.strictEqual(boundToAnotherEntry(account('aa11'), { value: 'bb22' }), false, 'no attribute offered either');
});

test('the login refuses such an account before it logs in, syncs or sets a password', () => {
  const src = read('packages/wekan-ldap/server/loginHandler.js');
  const guard = src.indexOf('if (user && boundToAnotherEntry(user, Unique_Identifier_Field)) {');
  assert.ok(guard > 0);
  assert.ok(guard < src.indexOf('// Login user if they exist'));
  assert.ok(guard > src.indexOf("'emails.0.address' : email"), 'after the username and e-mail lookups');
  assert.ok(/boundToAnotherEntry[\s\S]{0,300}throw new Meteor\.Error\('LDAP-login-error', 'LDAP authentication failed'\)/.test(src));
});

test('LDAP_EMAIL_MATCH_REQUIRE looks the user up by username, not by _id', () => {
  const src = read('packages/wekan-ldap/server/loginHandler.js');
  assert.ok(!src.includes("'_id' : username"), 'a user _id is never the username');
  const block = src.slice(src.indexOf("LDAP_EMAIL_MATCH_REQUIRE') === true"), src.indexOf('} else {\n        userQuery = {\n          username\n'));
  assert.strictEqual((block.match(/\n\s+username,\n/g) || []).length, 2);
});

test('the import does not merge a username that belongs to another entry', () => {
  const src = read('packages/wekan-ldap/server/sync.js');
  const fn = src.slice(src.indexOf('export async function importNewUsers'), src.indexOf('async function callLdapOrgTeamSyncInternal'));
  const guard = fn.indexOf('if (user && boundToAnotherEntry(user, uniqueId)) {');
  assert.ok(guard > 0 && guard < fn.indexOf('await syncUserData(user, ldapUser);'));
  assert.ok(/boundToAnotherEntry\(user, uniqueId\)\) \{[\s\S]{0,300}continue;/.test(fn), 'skipped, not added again');
});

test('background sync: an ambiguous username is skipped - not bound to the first entry, not disabled', () => {
  const sync = read('packages/wekan-ldap/server/sync.js');
  assert.ok(sync.includes('await ldap.getUserByUsername(user.username, { unique: true });'));
  assert.ok(/getUserByUsername\(user\.username, \{ unique: true \}\);\n\s+\} catch \(ambiguous\) \{\n\s+log_warn\([^)]*\);\n\s+continue;/.test(sync));
  const ldap = read('packages/wekan-ldap/server/ldap.js');
  assert.ok(/async getUserByUsername\(username, \{ unique = false \} = \{\}\)/.test(ldap));
  assert.ok(/if \(unique\) \{\n\s+throw new Error\(/.test(ldap));
});

test('a login or sync records the identifier and its attribute on an existing account', () => {
  const src = read('packages/wekan-ldap/server/sync.js');
  const fn = src.slice(src.indexOf('export async function syncUserData'), src.indexOf('export async function addLdapUser'));
  assert.ok(fn.includes("'services.ldap.id': uniqueId.value,") && fn.includes("'services.ldap.idAttribute': uniqueId.attribute,"));
  assert.ok(/toLowerCase\(\) !== String\(uniqueId\.attribute \|\| ''\)\.toLowerCase\(\)/.test(fn), 'only when it changed, attribute case-insensitive');
});

test('negative, anywhere in the package: no lookup by _id = username, and no name or e-mail match reaches a login unguarded', () => {
  const fs2 = require('node:fs');
  const dir = path.join(__dirname, '..', 'packages/wekan-ldap/server');
  for (const file of fs2.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const code = fs2.readFileSync(path.join(dir, file), 'utf8');
    assert.ok(!/['"]_id['"]\s*:\s*username\b/.test(code), `${file} looks a user up with _id = username`);
  }
  const login = read('packages/wekan-ldap/server/loginHandler.js');
  const guard = login.indexOf('boundToAnotherEntry(user, Unique_Identifier_Field)');
  const lookups = [...login.matchAll(/user = await Meteor\.users\.findOneAsync\(/g)].map(m => m.index);
  assert.ok(lookups.length >= 3, 'the id, username and e-mail lookups');
  assert.ok(guard > Math.max(...lookups), 'the guard comes after every lookup that finds an account');
  assert.ok(guard < login.indexOf('// Login user if they exist'), 'and before the login');
});

console.log(`ldapAccountBinding.test.cjs: ${passed} tests passed`);
