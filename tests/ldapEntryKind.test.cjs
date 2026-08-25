'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  objectClasses,
  isKnownLdapGroup,
} = require('../packages/wekan-ldap/server/entryKind');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#4875 rejects Active Directory groups returned by a broad user search', () => {
  assert.strictEqual(
    isKnownLdapGroup({
      objectClass: ['top', 'group'],
      sAMAccountName: 'Board Editors',
    }),
    true,
  );
});

test('rejects common OpenLDAP and POSIX group schemas', () => {
  for (const objectClass of [
    'groupOfNames',
    'groupOfUniqueNames',
    'posixGroup',
  ]) {
    assert.strictEqual(isKnownLdapGroup({ objectClass }), true, objectClass);
  }
});

test('objectClass lookup is case-insensitive and accepts Buffer values', () => {
  const entry = { ObjectClass: [Buffer.from('top'), Buffer.from('GROUP')] };
  assert.deepStrictEqual(objectClasses(entry), ['top', 'group']);
  assert.strictEqual(isKnownLdapGroup(entry), true);
});

test('negative: standard user schemas remain importable', () => {
  for (const objectClass of [
    ['top', 'person', 'organizationalPerson', 'user'],
    ['top', 'person', 'inetOrgPerson'],
    ['top', 'posixAccount'],
  ]) {
    assert.strictEqual(isKnownLdapGroup({ objectClass }), false);
  }
});

test('negative: absent or custom object classes preserve compatibility', () => {
  assert.strictEqual(isKnownLdapGroup({ uid: 'alice' }), false);
  assert.strictEqual(isKnownLdapGroup({ objectClass: 'customHuman' }), false);
  assert.strictEqual(isKnownLdapGroup(null), false);
});

test('bulk import skips groups and account creation independently rejects them', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'packages', 'wekan-ldap', 'server', 'sync.js'),
    'utf8',
  );
  const addStart = source.indexOf('export async function addLdapUser');
  const importStart = source.indexOf('export async function importNewUsers');
  assert.ok(addStart >= 0 && importStart > addStart);
  assert.match(
    source.slice(addStart, importStart),
    /if \(isKnownLdapGroup\(ldapUser\)\)[\s\S]*LDAP entry is a group/,
  );
  assert.match(
    source.slice(importStart),
    /if \(isKnownLdapGroup\(ldapUser\)\)[\s\S]*continue;/,
  );
});

console.log(`\nldapEntryKind: all ${passed} tests passed`);
