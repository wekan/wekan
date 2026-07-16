'use strict';

// Plain-Node unit test for LDAP group allowlist parsing/matching.
// Run: node tests/ldapGroupAllowlist.test.cjs

const assert = require('assert');
const {
  parseGroupAllowlist,
  normalizeGroupName,
  groupNameMatchesAllowPattern,
  filterGroupsByAllowlist,
} = require('../packages/wekan-ldap/server/groupAllowlist');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('parse: trims and removes empty entries', () => {
  assert.deepStrictEqual(
    parseGroupAllowlist(' team-a , , team-b ,,  team-c  '),
    ['team-a', 'team-b', 'team-c'],
  );
});

test('parse: unset/empty means no restriction', () => {
  assert.deepStrictEqual(parseGroupAllowlist(undefined), []);
  assert.deepStrictEqual(parseGroupAllowlist(''), []);
  assert.deepStrictEqual(parseGroupAllowlist('   '), []);
});

test('normalize: trims strings and returns first non-empty array entry', () => {
  assert.strictEqual(normalizeGroupName('  Engineering Platform Admins  '), 'Engineering Platform Admins');
  assert.strictEqual(normalizeGroupName(['', '  ', 'Engineering Platform Team A']), 'Engineering Platform Team A');
  assert.strictEqual(normalizeGroupName(['', null, undefined]), null);
});

test('match: exact behavior is preserved', () => {
  assert.strictEqual(groupNameMatchesAllowPattern('Engineering Platform Admins', 'Engineering Platform Admins'), true);
  assert.strictEqual(groupNameMatchesAllowPattern('Engineering Platform Team A', 'Engineering Platform*'), true);
  assert.strictEqual(groupNameMatchesAllowPattern('Support Team', 'Engineering Platform*'), false);
});

test('match: wildcard ? matches exactly one character', () => {
  assert.strictEqual(groupNameMatchesAllowPattern('TEAM-A1', 'TEAM-A?'), true);
  assert.strictEqual(groupNameMatchesAllowPattern('TEAM-A12', 'TEAM-A?'), false);
});

test('match: regex-special characters are treated as literals', () => {
  assert.strictEqual(groupNameMatchesAllowPattern('Engineering.Platform.4.3', 'Engineering.Platform.4.3'), true);
  assert.strictEqual(groupNameMatchesAllowPattern('EngineeringxPlatformx4x3', 'Engineering.Platform.4.3'), false);
});

test('match: DNs with spaces and escaped comma/backslash are supported', () => {
  const dn = 'CN=Team\\, Alpha,OU=Identity Groups,DC=example,DC=int';
  assert.strictEqual(groupNameMatchesAllowPattern(dn, dn), true);
  assert.strictEqual(groupNameMatchesAllowPattern(dn, 'CN=Team\\, *'), true);
  assert.strictEqual(groupNameMatchesAllowPattern(dn, 'CN=Other\\, *'), false);
});

test('filter: empty allowlist returns all groups', () => {
  const groups = ['A', 'B', 'C'];
  assert.deepStrictEqual(filterGroupsByAllowlist(groups, []), groups);
});

test('filter: mixed exact and wildcard patterns', () => {
  const groups = [
    'Engineering Platform Team A',
    'Engineering Platform Admins',
    'Identity Service Admins',
    'Something Else',
  ];
  const allow = parseGroupAllowlist('Engineering Platform*,Identity Service Admins');
  assert.deepStrictEqual(filterGroupsByAllowlist(groups, allow), [
    'Engineering Platform Team A',
    'Engineering Platform Admins',
    'Identity Service Admins',
  ]);
});

test('filter: handles LDAP groups provided as arrays/non-strings', () => {
  const groups = [
    ['Engineering Platform Team A'],
    ['Engineering Platform Admins'],
    123,
    null,
  ];
  const allow = parseGroupAllowlist('Engineering Platform*');
  assert.deepStrictEqual(filterGroupsByAllowlist(groups, allow), [
    'Engineering Platform Team A',
    'Engineering Platform Admins',
  ]);
});

test('filter: no matches returns empty list', () => {
  const groups = ['A', 'B'];
  const allow = parseGroupAllowlist('X*,Y*');
  assert.deepStrictEqual(filterGroupsByAllowlist(groups, allow), []);
});

console.log(`\n${passed} tests passed`);
