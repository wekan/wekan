'use strict';

// #6771: the LDAP background import searched `(uid=\2a)` and imported nobody.
// importNewUsers() asked for every user with the string '*', and the RFC 4515
// escaping added for login names turned that into a literal asterisk:
//   "filter": "(&(&(objectclass=person))(uid=\\2a))"
//   Search result count 0 / Import finished. Users imported: 0
// The wildcard is now reachable only through ALL_LDAP_USERS, a Symbol that a
// login request (strings) cannot carry, so a typed `*` stays escaped.
// Run: node tests/ldapImportAllUsers.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ALL_LDAP_USERS, userSearchValue, describeUserSearch } = require('../packages/wekan-ldap/server/userSearchValue');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

// The real getUserFilter() and escapeLdapFilterValue() from ldap.js.
const ldapSource = read('packages/wekan-ldap/server/ldap.js');
const escapeBody = ldapSource.split('function escapeLdapFilterValue(value) {')[1].split('\n}\n')[0];
const escapeLdapFilterValue = new Function('value', escapeBody);
const filterBody = ldapSource.split('  getUserFilter(username) {')[1].split('\n  async bindUserIfNecessary')[0].replace(/\n  }\s*$/, '');
const getUserFilter = new Function('escapeLdapFilterValue', 'Log', 'userSearchValue', `return function(username) {${filterBody}}`)(
  escapeLdapFilterValue, { error() {} }, userSearchValue);
// The reporter's FreeIPA settings.
const freeipa = { options: { User_Search_Filter: '(&(objectclass=person))', User_Search_Field: 'uid' } };

test('the background import searches every user with a real wildcard', () => {
  assert.equal(getUserFilter.call(freeipa, ALL_LDAP_USERS), '(&(&(objectclass=person))(uid=*))');
  const multi = { options: { User_Search_Filter: '', User_Search_Field: 'uid,mail' } };
  assert.equal(getUserFilter.call(multi, ALL_LDAP_USERS), '(&(|(uid=*)(mail=*)))');
});

test('negative: a typed "*" or filter syntax is still escaped, as in the report', () => {
  assert.equal(getUserFilter.call(freeipa, '*'), '(&(&(objectclass=person))(uid=\\2a))');
  assert.equal(getUserFilter.call(freeipa, 'a*)(uid=*'), '(&(&(objectclass=person))(uid=a\\2a\\29\\28uid=\\2a))');
  // Nothing a JSON login body can hold is the sentinel.
  for (const value of ['*', 'ALL_LDAP_USERS', 'Symbol(all LDAP users)', String(ALL_LDAP_USERS), JSON.parse('"*"')]) {
    assert.notEqual(userSearchValue(value, escapeLdapFilterValue), '*', value);
  }
});

test('the log line names the search without throwing on the Symbol', () => {
  assert.equal(describeUserSearch(ALL_LDAP_USERS), '*');
  assert.equal(describeUserSearch('alice'), 'alice');
  const searchBody = ldapSource.split('  async searchUsers(username) {')[1].split('\n  async getUserById(')[0];
  assert.match(searchBody, /Log\.info\(`Searching user \$\{describeUserSearch\(username\)\}`\)/);
});

test('importNewUsers() uses the sentinel, and no code searches the string "*"', () => {
  const sync = read('packages/wekan-ldap/server/sync.js');
  const importBody = sync.split('export async function importNewUsers(ldap) {')[1].split('\nexport ')[0];
  assert.match(importBody, /ldap\.searchUsers\(ALL_LDAP_USERS\)/);
  // Negative, across the tree: a string wildcard handed to a user search is
  // the shape that broke, wherever it would be written.
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.build', '_build', '.tools', '.meteor', '.git'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|mjs|cjs)$/.test(e.name) && /(searchUsers|getUserByUsername|getUserFilter)\(\s*['"`]\*['"`]\s*\)/.test(fs.readFileSync(p, 'utf8'))) {
        offenders.push(path.relative(ROOT, p));
      }
    }
  };
  for (const dir of ['server', 'packages', 'models', 'client', 'imports']) walk(path.join(ROOT, dir));
  assert.deepEqual(offenders, []);
});

console.log(`# ${passed} passed`);
