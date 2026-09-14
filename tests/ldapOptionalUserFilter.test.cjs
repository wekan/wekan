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
