'use strict';

// Regression test for #6481: LDAP `mail`->`email` fieldmap returned `undefined`
// after upgrading (works in 6.09). Everywhere else in wekan-ldap reads LDAP
// attributes case-INSENSITIVELY via getLDAPValue(), but getDataToSyncUserData's
// `email` branch used case-SENSITIVE `ldapUser.hasOwnProperty(ldapField)` /
// `ldapUser[ldapField]`. When the directory returns the attribute with a
// different case than the fieldmap key (common with AD, and exposed by the move
// from ldapjs — which lowercased keys — to ldapts, which preserves the server's
// case), the own-property lookup missed it and no email was synced. The fix
// reads the mapped attribute through getLDAPValue() like the rest of the code.
//
// Run: node tests/ldapEmailFieldmap.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  ldapTextValues,
  ldapEmailAddresses,
} = require('../packages/wekan-ldap/server/ldapTextValues');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Mirrors the getLDAPValue accessor wekan-ldap defines on Object.prototype:
// first case-insensitive key match wins.
function getLDAPValue(obj, prop) {
  for (const key in obj) {
    if (key.toLowerCase() === String(prop).toLowerCase()) return obj[key];
  }
  return undefined;
}

// Mirrors the FIXED `email` branch of getDataToSyncUserData(): read the mapped
// attribute case-insensitively, then push one or many addresses.
function emailsFromFieldmap(ldapUser, ldapField) {
  const emailList = [];
  const ldapValue = getLDAPValue(ldapUser, ldapField);
  if (ldapValue === undefined || ldapValue === null || ldapValue === '') return emailList;
  for (const address of ldapEmailAddresses(ldapValue)) {
    emailList.push({ address, verified: true });
  }
  return emailList;
}

console.log('ldapEmailFieldmap:');

test('mail attribute returned with different case is still mapped to email', () => {
  // directory returns "Mail" (AD-style), fieldmap key is "mail"
  const ldapUser = { cn: 'Xy Zebounisso', Mail: 'bxy1234@example.org' };
  const emails = emailsFromFieldmap(ldapUser, 'mail');
  assert.deepStrictEqual(emails, [{ address: 'bxy1234@example.org', verified: true }]);
});

test('exact-case mail still works', () => {
  const emails = emailsFromFieldmap({ mail: 'a@b.com' }, 'mail');
  assert.deepStrictEqual(emails, [{ address: 'a@b.com', verified: true }]);
});

test('multi-valued mail attribute produces one entry per address', () => {
  const emails = emailsFromFieldmap({ MAIL: ['a@b.com', 'c@d.com'] }, 'mail');
  assert.deepStrictEqual(emails, [
    { address: 'a@b.com', verified: true },
    { address: 'c@d.com', verified: true },
  ]);
});

test('a single Buffer produces one string address instead of numeric bytes', () => {
  const emails = emailsFromFieldmap({ mail: Buffer.from('first@example.org') }, 'mail');
  assert.deepStrictEqual(emails, [
    { address: 'first@example.org', verified: true },
  ]);
});

test('multi-valued Buffer mail preserves every alias as a string', () => {
  const emails = emailsFromFieldmap({
    mail: [Buffer.from('first@example.org'), Buffer.from('alias@example.org')],
  }, 'mail');
  assert.deepStrictEqual(emails, [
    { address: 'first@example.org', verified: true },
    { address: 'alias@example.org', verified: true },
  ]);
  assert.ok(emails.every(({ address }) => typeof address === 'string'));
});

test('serialized Buffers are decoded and empty values are ignored', () => {
  assert.deepStrictEqual(ldapTextValues([
    { type: 'Buffer', data: [...Buffer.from('alias@example.org')] },
    null,
    '',
  ]), ['alias@example.org']);
});

test('duplicate aliases are removed case-insensitively', () => {
  assert.deepStrictEqual(ldapEmailAddresses([
    'first@example.org',
    Buffer.from('FIRST@example.org'),
    'alias@example.org',
  ]), ['first@example.org', 'alias@example.org']);
});

test('NEGATIVE: a genuinely absent attribute yields no email (no crash)', () => {
  assert.deepStrictEqual(emailsFromFieldmap({ cn: 'x' }, 'mail'), []);
  assert.deepStrictEqual(emailsFromFieldmap({ mail: '' }, 'mail'), []);
});

// Source guard: the real branch must read via getLDAPValue, not the old
// case-sensitive own-property access.
test('source: getDataToSyncUserData email branch is case-insensitive (getLDAPValue)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'packages', 'wekan-ldap', 'server', 'sync.js'), 'utf8');
  // strip line comments so the "must be gone" checks see CODE only (the fix's
  // explanatory comment intentionally quotes the old tokens).
  const branch = src.slice(src.indexOf("case 'email'"), src.indexOf('default:'))
    .replace(/\/\/.*$/gm, '');
  assert.ok(/getLDAPValue\(ldapField\)/.test(branch),
    'email branch must read the mapped attribute via getLDAPValue');
  assert.ok(!/ldapUser\.hasOwnProperty\(ldapField\)/.test(branch),
    'the case-sensitive hasOwnProperty(ldapField) lookup must be gone');
  assert.ok(!/ldapUser\[ldapField\]/.test(branch),
    'the case-sensitive ldapUser[ldapField] index must be gone');
  assert.ok(/ldapEmailAddresses\(ldapValue\)/.test(branch),
    'mapped LDAP email values must be decoded to strings');
  assert.ok(!/Array\.from\(ldapValue\)/.test(branch),
    'a Buffer must not be expanded into numeric bytes');
});

console.log(`\n${passed} passed`);
