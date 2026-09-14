'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../packages/wekan-ldap/server/ldap.js'), 'utf8');
const body = source.split('  getUserFilter(username) {')[1].split('\n  async bindUserIfNecessary')[0].replace(/\n  }\s*$/, '');
const getUserFilter = new Function('escapedToHex', 'Log', `return function(username) {${body}}`)(value => value, { error() {} });
for (const value of [undefined, null, '']) {
  assert.equal(getUserFilter.call({ options: { User_Search_Filter: value, User_Search_Field: 'sAMAccountName' } }, 'alice'), '(&(sAMAccountName=alice))');
}
for (const value of ['objectClass=person', '(objectClass=person)']) {
  assert.equal(getUserFilter.call({ options: { User_Search_Filter: value, User_Search_Field: 'uid,mail' } }, 'alice'), '(&(objectClass=person)(|(uid=alice)(mail=alice)))');
}
for (const value of [true, 123, {}]) {
  assert.throws(() => getUserFilter.call({ options: { User_Search_Filter: value, User_Search_Field: 'uid' } }, 'alice'), /LDAP_USER_SEARCH_FILTER must be a string/);
}
console.log('ldapOptionalUserFilter: unset optional filter, configured restrictions and invalid-type failures verified');

// Reproduce the actual post-bind search sequence from the LDAP implementation.
(async () => {
  const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
  // These methods use only the established structured logger as an external dependency.
  const Log = { info() {}, debug() {} };
  for (const filter of [undefined, null, '', '(objectClass=person)']) {
    const events = [];
    const ldap = {
      options: { Authentication: true, Authentication_UserDN: 'service@example.test', Authentication_Password: 'test-only-password', User_Search_Filter: filter, User_Search_Field: 'sAMAccountName' },
      getUserFilter, getUserAttributes: () => undefined,
      bind: async (dn) => { assert.equal(dn, 'service@example.test'); events.push('bind'); },
      searchAll: async (base, options) => { events.push('search'); assert.equal(options.filter, filter ? '(&(objectClass=person)(sAMAccountName=alice))' : '(&(sAMAccountName=alice))'); return [{dn:'cn=alice'}]; },
    };
    const bindBody = source.split('  async bindIfNecessary() {')[1].split('\n  async searchUsers(')[0].replace(/\n  }\s*$/, '');
    const searchBody = source.split('  async searchUsers(username) {')[1].split('\n  async getUserById(')[0].replace(/\n  }\s*$/, '');
    ldap.bindIfNecessary = new AsyncFunction('Log', bindBody).bind(ldap, Log);
    ldap.searchUsers = new AsyncFunction('Log', 'username', searchBody).bind(ldap, Log);
    assert.deepEqual(await ldap.searchUsers('alice'), [{dn:'cn=alice'}]);
    assert.deepEqual(events, ['bind','search']);
    ldap.domainBinded = false; events.length = 0;
    ldap.bind = async () => { throw new Error('invalid credentials'); };
    await assert.rejects(ldap.searchUsers('alice'), /invalid credentials/);
    assert.equal(events.length, 0, 'failed bind must never proceed to search');
  }
  console.log('ldapOptionalUserFilter: actual bind/search sequence and failed-bind isolation verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
