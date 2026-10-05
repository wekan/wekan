'use strict';
// #6744: "Regression since v12.08: LDAP login group filter ignores nested Active
// Directory groups (users locked out)".
//
// v12.08 (DirectoryGroupBleed) made LDAP_USER_AUTHENTICATION=true logins check
// LDAP_GROUP_FILTER_ENABLE at all - before it, every directory user got in. The
// check matches `(member=<user DN>)`, which is DIRECT membership only, so in an
// Active Directory that grants access through a team group nested in the access
// group, legitimate users were refused.
//
// LDAP_GROUP_FILTER_NESTED=true makes both group searches use AD's
// LDAP_MATCHING_RULE_IN_CHAIN, `(member:1.2.840.113556.1.4.1941:=<user DN>)`.
// These tests drive the real isUserInGroup/getUserGroups and capture the filter
// sent to the directory: nested membership when asked, the old direct clause when
// not, and never a filter that stops naming the user - that would answer with
// every group and let everyone in, the fault DirectoryGroupBleed closed.
//
// Run: node --test tests/ldapNestedGroups.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const harness = require('./helpers/ldapAuthHarness.cjs');
const {groupMemberClause, AD_IN_CHAIN_RULE} = require('../packages/wekan-ldap/server/groupFilterConfig');

const USER_DN = 'CN=Alice Example,OU=Users,DC=corp,DC=example';
const IN_CHAIN = `(member:1.2.840.113556.1.4.1941:=${USER_DN})`;

function directory(options = {}, settings = {}) {
  const h = harness(settings);
  const ldap = new h.LDAP();
  Object.assign(ldap.options, {
    group_filter_enabled: true,
    group_filter_object_class: 'group',
    group_filter_group_id_attribute: 'cn',
    group_filter_group_member_attribute: 'member',
    group_filter_group_member_format: 'dn',
    group_filter_group_name: 'WekanAccess',
    group_filter_nested: false,
    ...options,
  });
  const filters = [];
  ldap.searchAll = async (base, search) => { filters.push(search.filter); return [{cn: 'WekanAccess'}]; };
  return {ldap, filters, isUserInGroup: (...args) => h.groupMethod.call(ldap, ...args)};
}

test('the in-chain rule is Active Directory LDAP_MATCHING_RULE_IN_CHAIN', () => {
  assert.equal(AD_IN_CHAIN_RULE, '1.2.840.113556.1.4.1941');
});

test('LDAP_GROUP_FILTER_NESTED=true builds a nested-membership clause', () => {
  assert.equal(groupMemberClause({group_filter_group_member_attribute: 'member', group_filter_nested: true}, USER_DN), IN_CHAIN);
  // Surrounding whitespace in a setting must not end up inside the filter.
  assert.equal(groupMemberClause({group_filter_group_member_attribute: ' member ', group_filter_nested: true}, USER_DN), IN_CHAIN);
});

test('without the setting the clause is direct membership, exactly as before', () => {
  for (const group_filter_nested of [false, undefined, 'true', 1, 'yes']) {
    assert.equal(groupMemberClause({group_filter_group_member_attribute: 'member', group_filter_nested}, USER_DN),
      `(member=${USER_DN})`, `group_filter_nested=${JSON.stringify(group_filter_nested)} must not enable nesting`);
  }
});

test('an attribute already written as the in-chain rule is used as written, never doubled', () => {
  for (const group_filter_nested of [true, false]) {
    assert.equal(groupMemberClause({
      group_filter_group_member_attribute: 'member:1.2.840.113556.1.4.1941:', group_filter_nested,
    }, USER_DN), IN_CHAIN);
  }
});

test('login: a nested member of the allowed group is admitted with the in-chain filter', async () => {
  const d = directory({group_filter_nested: true});
  d.ldap.getUserGroups = async () => [];
  assert.equal(await d.isUserInGroup('alice', {dn: USER_DN}), true);
  assert.equal(d.filters.length, 1);
  assert.equal(d.filters[0], `(&(objectclass=group)${IN_CHAIN}(cn=WekanAccess))`);
});

test('group sync: getUserGroups lists nested groups for admin, role and org/team sync', async () => {
  const d = directory({group_filter_nested: true});
  d.ldap.searchAll = async (base, search) => { d.filters.push(search.filter); return [{cn: 'Team A'}, {cn: 'WekanAccess'}]; };
  assert.deepEqual([...await d.ldap.getUserGroups('alice', {dn: USER_DN})], ['Team A', 'WekanAccess']);
  assert.equal(d.filters[0], `(&(objectclass=group)${IN_CHAIN})`);
});

test('negative: without the setting, login still searches direct membership only', async () => {
  const d = directory();
  d.ldap.getUserGroups = async () => [];
  assert.equal(await d.isUserInGroup('alice', {dn: USER_DN}), true);
  assert.equal(d.filters[0], `(&(objectclass=group)(member=${USER_DN})(cn=WekanAccess))`);
  assert.ok(!d.filters[0].includes(AD_IN_CHAIN_RULE));
});

test('negative: a nested member is refused when the directory finds no allowed group', async () => {
  const d = directory({group_filter_nested: true});
  d.ldap.getUserGroups = async () => [];
  d.ldap.searchAll = async (base, search) => { d.filters.push(search.filter); return []; };
  assert.equal(await d.isUserInGroup('alice', {dn: USER_DN}), false);
  assert.ok(d.filters[0].includes(IN_CHAIN), 'the refusal came from the nested search');
});

test('negative: nesting never drops the clause that names the user', async () => {
  // A user entry without a DN cannot be named. Searching anyway would match
  // every allowed group - the DirectoryGroupBleed shape - so it must refuse
  // without searching, and getUserGroups must answer with no groups.
  for (const entry of [{}, {dn: ''}, {dn: 42}]) {
    const d = directory({group_filter_nested: true});
    d.ldap.getUserGroups = async () => [];
    assert.equal(await d.isUserInGroup('alice', entry), false);
    assert.equal(d.filters.length, 0);
  }
  const d = directory({group_filter_nested: true});
  assert.deepEqual([...await d.ldap.getUserGroups('alice', {})], []);
  assert.equal(d.filters.length, 0);
});

test('negative: a DN carrying filter syntax stays escaped inside the in-chain clause', async () => {
  const hostile = 'CN=x)(cn=*),DC=corp';
  const d = directory({group_filter_nested: true});
  d.ldap.getUserGroups = async () => [];
  await d.isUserInGroup('alice', {dn: hostile});
  assert.ok(d.filters[0].includes('(member:1.2.840.113556.1.4.1941:=CN=x\\29\\28cn=\\2a\\29,DC=corp)'), d.filters[0]);
  assert.ok(!d.filters[0].includes('(cn=*)'));
});

test('the setting is read as LDAP_GROUP_FILTER_NESTED and only exactly true enables it', () => {
  for (const [value, expected] of [[true, true], [false, false], [undefined, false], ['true', false], [1, false]]) {
    const {LDAP} = harness({LDAP_GROUP_FILTER_NESTED: value});
    assert.equal(new LDAP().options.group_filter_nested, expected, `LDAP_GROUP_FILTER_NESTED=${JSON.stringify(value)}`);
  }
});

test('source: every group-membership clause in ldap.js goes through groupMemberClause', () => {
  // Pins the shape, not one call site: a group search added later that builds
  // `(${member_attribute}=...)` by hand would ignore LDAP_GROUP_FILTER_NESTED.
  const source = fs.readFileSync(path.join(__dirname, '../packages/wekan-ldap/server/ldap.js'), 'utf8');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/group_filter_group_member_attribute\}\s*=/.test(code),
    'a member clause is built by hand instead of with groupMemberClause');
  const calls = code.match(/groupMemberClause\(this\.options, escapeLdapFilterValue\(format_value\)\)/g) || [];
  assert.equal(calls.length, 2, 'getUserGroups and isUserInGroup both use groupMemberClause with an escaped value');
});

test('the setting is documented and configurable wherever the other group settings are', () => {
  const root = path.join(__dirname, '..');
  const files = ['docs/Features/Login/LDAP.md', 'Dockerfile', 'snap-src/bin/config', 'start-wekan.sh', 'start-wekan.bat',
    ...fs.readdirSync(root).filter(f => /^docker-compose.*\.yml$/.test(f))];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    if (!text.includes('LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT')) continue;
    assert.ok(text.includes('LDAP_GROUP_FILTER_NESTED'), `${file} lists the group settings but not LDAP_GROUP_FILTER_NESTED`);
  }
  const snap = fs.readFileSync(path.join(root, 'snap-src/bin/config'), 'utf8');
  assert.match(snap, /^keys=".* LDAP_GROUP_FILTER_NESTED /m);
  assert.match(snap, /^KEY_LDAP_GROUP_FILTER_NESTED="ldap-group-filter-nested"$/m);
  assert.match(snap, /^DEFAULT_LDAP_GROUP_FILTER_NESTED="false"$/m);
});
