'use strict';

// Plain-Node unit test for issue #4654: LDAP background sync
// (LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED) only worked once for new
// users. getUserById() built its search filter from LDAP_UNIQUE_IDENTIFIER_FIELD
// alone: unset -> TypeError (undefined.split) aborting the whole sync run;
// empty -> invalid filter "(|(=value))" (seen in the issue logs), so existing
// users were never found again ("Can't sync user"). The stored id can also come
// from LDAP_USER_SEARCH_FIELD (getLdapUserUniqueID fallback), so the filter must
// consider both settings.
// Run: node tests/ldapUserIdFilter.test.cjs

const assert = require('assert');
const {
  splitFieldSetting,
  buildUserIdFilter,
} = require('../packages/wekan-ldap/server/userIdFilter');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ── splitFieldSetting ─────────────────────────────────────────────────────────

test('split: comma list with whitespace', () => {
  assert.deepStrictEqual(splitFieldSetting(' guid , sAMAccountName '), ['guid', 'sAMAccountName']);
});

test('split: unset/empty/non-string means no fields', () => {
  assert.deepStrictEqual(splitFieldSetting(undefined), []);
  assert.deepStrictEqual(splitFieldSetting(''), []);
  assert.deepStrictEqual(splitFieldSetting(null), []);
  assert.deepStrictEqual(splitFieldSetting(123), []);
});

test('split: drops empty entries so no "(=value)" clause can be built', () => {
  assert.deepStrictEqual(splitFieldSetting('a,,b,'), ['a', 'b']);
  assert.deepStrictEqual(splitFieldSetting(' , '), []);
});

// ── buildUserIdFilter: positive cases ─────────────────────────────────────────

test('stored idAttribute wins and is used directly', () => {
  assert.strictEqual(
    buildUserIdFilter('sAMAccountName', '\\6d\\2e', 'guid', 'uid'),
    '(sAMAccountName=\\6d\\2e)',
  );
});

test('single unique identifier field gives a plain equality filter', () => {
  assert.strictEqual(
    buildUserIdFilter(undefined, '\\01\\02', 'objectGUID', ''),
    '(objectGUID=\\01\\02)',
  );
});

test('multiple fields are OR-ed', () => {
  assert.strictEqual(
    buildUserIdFilter(undefined, 'v', 'guid,entryUUID', 'uid'),
    '(|(guid=v)(entryUUID=v)(uid=v))',
  );
});

test('#4654 config: unset LDAP_UNIQUE_IDENTIFIER_FIELD falls back to LDAP_USER_SEARCH_FIELD', () => {
  // The issue reporter had only LDAP_USER_SEARCH_FIELD=sAMAccountName set;
  // the old code crashed on settings_get(...).split(',') here.
  assert.strictEqual(
    buildUserIdFilter(undefined, '\\6d\\2e\\75\\73\\65\\72', undefined, 'sAMAccountName'),
    '(sAMAccountName=\\6d\\2e\\75\\73\\65\\72)',
  );
});

test('duplicate attribute across both settings is de-duplicated', () => {
  // The workaround from the issue comments: LDAP_UNIQUE_IDENTIFIER_FIELD set
  // to the same attribute as LDAP_USER_SEARCH_FIELD.
  assert.strictEqual(
    buildUserIdFilter(undefined, 'v', 'sAMAccountName', 'sAMAccountName'),
    '(sAMAccountName=v)',
  );
});

// ── buildUserIdFilter: negative cases ─────────────────────────────────────────

test('empty unique identifier field never yields the invalid "(|(=value))" filter', () => {
  // Old behavior: ''.split(',') -> [''] -> "(|(=m.user))" as in the issue log.
  const filter = buildUserIdFilter(undefined, 'm.user', '', 'sAMAccountName');
  assert.strictEqual(filter, '(sAMAccountName=m.user)');
  assert.ok(!filter.includes('(='), 'filter must not contain an empty attribute name');
});

test('no usable attribute anywhere returns null instead of throwing or "(|)"', () => {
  assert.strictEqual(buildUserIdFilter(undefined, 'v', undefined, undefined), null);
  assert.strictEqual(buildUserIdFilter(undefined, 'v', '', ''), null);
  assert.strictEqual(buildUserIdFilter(null, 'v', ' , ', ' '), null);
});

test('old implementation would have failed on the issue configuration', () => {
  // Documents the regression this test guards against: the pre-fix code path.
  const oldGetUserByIdFilter = (uniqueIdentifierSetting, escapedValue) => {
    const fields = uniqueIdentifierSetting.split(','); // throws when unset
    return `(|${fields.map((item) => `(${item}=${escapedValue})`).join('')})`;
  };
  assert.throws(() => oldGetUserByIdFilter(undefined, 'm.user'), TypeError);
  assert.strictEqual(oldGetUserByIdFilter('', 'm.user'), '(|(=m.user))'); // invalid filter
});

console.log(`\n${passed} tests passed`);
