'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  missingGroupLookupSettings,
  missingLoginGroupFilterSettings,
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
});

console.log(`\n${passed} passed`);
