'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  missingGroupLookupSettings,
  missingLoginGroupFilterSettings,
  splitGroupNames,
  loginGroupNames,
} = require('../packages/wekan-ldap/server/groupFilterConfig');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const complete = {
  group_filter_group_id_attribute: 'cn',
  group_filter_group_member_attribute: 'member',
  group_filter_group_member_format: 'dn',
  group_filter_group_name: 'allowed-users',
};

test('complete Samba/AD group settings permit a membership lookup', () => {
  assert.deepStrictEqual(missingGroupLookupSettings(complete), []);
  assert.deepStrictEqual(missingLoginGroupFilterSettings(complete), []);
});

test('missing member attribute is named instead of silently omitting membership', () => {
  assert.deepStrictEqual(missingGroupLookupSettings({
    ...complete,
    group_filter_group_member_attribute: '',
  }), ['LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE']);
});

test('undefined, null, empty and whitespace-only lookup values fail closed', () => {
  const options = {
    ...complete,
    group_filter_group_id_attribute: undefined,
    group_filter_group_member_attribute: null,
    group_filter_group_member_format: '   ',
  };
  assert.deepStrictEqual(missingGroupLookupSettings(options), [
    'LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE',
    'LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE',
    'LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT',
  ]);
});

test('login filtering requires an allowed group name', () => {
  assert.deepStrictEqual(missingLoginGroupFilterSettings({
    ...complete,
    group_filter_group_name: '',
  }), ['LDAP_GROUP_FILTER_GROUP_NAME']);
});

test('configured admin groups are also valid allowed login groups', () => {
  assert.deepStrictEqual(missingLoginGroupFilterSettings({
    ...complete,
    group_filter_group_name: '',
  }, 'Domain Admins'), []);
});

test('#4036 admin-only users and every configured login group are admitted', () => {
  assert.deepStrictEqual(loginGroupNames({
    ...complete,
    group_filter_group_name: 'Users A, Users B',
  }, true, 'Domain Admins, Operators'), [
    'Users A',
    'Users B',
    'Domain Admins',
    'Operators',
  ]);
});

test('#4036 disabled admin sync does not broaden the login groups', () => {
  assert.deepStrictEqual(loginGroupNames(complete, false, 'Domain Admins'), [
    'allowed-users',
  ]);
});

test('group lists discard blanks and duplicate names case-insensitively', () => {
  assert.deepStrictEqual(splitGroupNames('Users, , users,Admins,'), [
    'Users',
    'Admins',
  ]);
  assert.deepStrictEqual(missingLoginGroupFilterSettings({
    ...complete,
    group_filter_group_name: ' , ',
  }, ',  ,'), ['LDAP_GROUP_FILTER_GROUP_NAME']);
});

test('source refuses before either LDAP group search when configuration is incomplete', () => {
  const source = fs.readFileSync(path.join(
    __dirname, '..', 'packages', 'wekan-ldap', 'server', 'ldap.js',
  ), 'utf8');
  const groups = source.slice(
    source.indexOf('async getUserGroups('),
    source.indexOf('async isUserInGroup('),
  );
  const login = source.slice(
    source.indexOf('async isUserInGroup('),
    source.indexOf('async auth(', source.indexOf('async isUserInGroup(')),
  );
  assert.ok(groups.indexOf('missingGroupLookupSettings') < groups.indexOf('searchAll('));
  assert.ok(login.indexOf('missingLoginGroupFilterSettings') < login.indexOf('getUserGroups('));
  assert.ok(login.indexOf('missingLoginGroupFilterSettings') < login.indexOf('searchAll('));
  assert.match(groups, /Answering with NO groups/);
  assert.match(login, /Refusing login/);
  assert.match(login, /loginGroupNames\(/);
  assert.match(login, /escapeLdapFilterValue\(name\)/);
});

// UCS (wekan/univention component/compose). Its settings, as the App Center
// renders them, decide whether anyone can log in after an upgrade.
function ucsOptions(env) {
  return {
    group_filter_group_id_attribute: env.LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE,
    group_filter_group_member_attribute: env.LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE,
    group_filter_group_member_format: env.LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT,
    group_filter_group_name: env.LDAP_GROUP_FILTER_GROUP_NAME,
  };
}
const UCS_609 = {
  LDAP_GROUP_FILTER_ENABLE: 'true',
  LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE: '',
  LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE: 'uniqueMember',
  LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT: 'dn',
  LDAP_GROUP_FILTER_GROUP_NAME: '',
};

// Negative: the settings UCS carried from 6.09 into the 12.32 upgrade. 6.09
// read them as "in any group"; this release refuses them, which is the
// "LDAP authentication failed" every UCS user got after upgrading. The refusal
// is right (#3700) - the fix is in the UCS compose, below.
test('the 6.09 UCS group settings are refused at login, and give no admin groups', () => {
  const options = ucsOptions(UCS_609);
  assert.deepStrictEqual(
    missingLoginGroupFilterSettings(options, 'Domain Admins'),
    ['LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE'],
  );
  assert.deepStrictEqual(missingGroupLookupSettings(options), ['LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE']);
});

// The fixed UCS settings: access by (wekanActivated=TRUE), no group filter, and
// a complete group lookup so Domain Admins still become WeKan admins.
test('the fixed UCS settings need no group filter and can still find admin groups', () => {
  const fixed = { ...UCS_609, LDAP_GROUP_FILTER_ENABLE: 'false', LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE: 'cn' };
  assert.strictEqual(fixed.LDAP_GROUP_FILTER_ENABLE, 'false', 'isUserInGroup returns true when the filter is off');
  assert.deepStrictEqual(missingGroupLookupSettings(ucsOptions(fixed)), [],
    'getUserGroups can answer, so LDAP_SYNC_ADMIN_GROUPS works');
  // And if somebody turns the filter back on without naming a group, it is
  // still refused rather than read as "anyone": the guard is unchanged.
  assert.deepStrictEqual(
    missingLoginGroupFilterSettings(ucsOptions({ ...fixed, LDAP_GROUP_FILTER_ENABLE: 'true' })),
    ['LDAP_GROUP_FILTER_GROUP_NAME'],
  );
});

console.log(`\n${passed} passed`);
