'use strict';

// Plain-Node guard for LDAP admin-group sync (#6540).
// Run: node tests/ldapAdminGroups.test.cjs
//
// The report: with `ldap-sync-admin-groups` set to one group, EVERY user that
// logged in became a WeKan administrator. Two independent causes, and this pins
// both of the answers.
//
//  1. The group query. Its member clause - the one that says WHOSE groups these
//     are - was left out whenever the user entry had no value for the configured
//     member format, and the search then ran as `(&(objectclass=group))`, which
//     answers with EVERY group in the directory. So every user "was in" the admin
//     group, and a login restricted by group let everyone in too.
//
//  2. The comparison. `LDAP_SYNC_ADMIN_GROUPS.split(',')` compared names exactly:
//     "ti, admins" produced " admins" and matched nothing, an unset value
//     produced [''] which matched a group whose name was missing, and Active
//     Directory's case-insensitive names did not match at all.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// The helper is an ES module in a Meteor package; load it without a bundler.
const src = read('packages/wekan-ldap/server/adminGroups.js');
const lib = {};
// eslint-disable-next-line no-new-func
new Function('exports', src.replace(/export \{[^}]*\};?/, '') +
  '\nexports.isAdminByGroups = isAdminByGroups;' +
  '\nexports.adminGroupNames = adminGroupNames;' +
  '\nexports.userGroupNames = userGroupNames;')(lib);

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('ldapAdminGroups:');

test('a member of a configured group is an admin', () => {
  assert.strictEqual(lib.isAdminByGroups(['ti'], 'ti'), true);
  assert.strictEqual(lib.isAdminByGroups(['users', 'ti'], 'ti,admins'), true);
});

test('and a member of no configured group is not', () => {
  assert.strictEqual(lib.isAdminByGroups(['users'], 'ti'), false);
  assert.strictEqual(lib.isAdminByGroups([], 'ti'), false);
});

test('NO configured group can never make anyone an admin', () => {
  // `''.split(',')` is [''], and an empty string compared equal to a group whose
  // name the directory did not return. This is the report.
  for (const setting of ['', '   ', ',', ',,', null, undefined]) {
    assert.strictEqual(lib.isAdminByGroups(['ti'], setting), false,
      `setting ${JSON.stringify(setting)} must grant nothing`);
    assert.strictEqual(lib.isAdminByGroups([undefined, null, ''], setting), false);
  }
});

test('spaces around a name do not silently stop matching', () => {
  assert.strictEqual(lib.isAdminByGroups(['admins'], 'ti, admins'), true);
  assert.strictEqual(lib.isAdminByGroups([' admins '], 'admins'), true);
});

test('directory group names are case-insensitive', () => {
  assert.strictEqual(lib.isAdminByGroups(['TI'], 'ti'), true);
  assert.strictEqual(lib.isAdminByGroups(['ti'], 'TI'), true);
  assert.strictEqual(lib.isAdminByGroups(['Domain Admins'], 'domain admins'), true);
});

test('a multi-valued or missing group name is handled, not compared raw', () => {
  assert.strictEqual(lib.isAdminByGroups([['ti', 'users']], 'ti'), true);
  assert.strictEqual(lib.isAdminByGroups([undefined, null, 42, ''], 'ti'), false);
  assert.deepStrictEqual(lib.userGroupNames(['A', ['B'], null, 7]), ['a', 'b']);
});

test('the query answers with NO groups when it cannot identify the user', () => {
  // Not with every group in the directory, which is what made everyone an admin.
  const ldap = read('packages/wekan-ldap/server/ldap.js');
  const at = ldap.indexOf('async getUserGroups(');
  assert.notStrictEqual(at, -1, 'getUserGroups must exist');
  const fn = ldap.slice(at, ldap.indexOf('\n  async isUserInGroup', at));

  assert.ok(/if \(!format_value\) \{[\s\S]*?return \[\];/.test(fn),
    'a user with no value for the member format gets an empty group list');
  assert.ok(/Log\.error\(/.test(fn), 'and the misconfiguration is named in the log');
  assert.ok(/ldapUser\.dn \|\| ldapUser\.objectName \|\|/.test(fn),
    'after trying the usual spellings of the same value');
  // The member clause must be pushed unconditionally once the value is known.
  const clause = fn.indexOf('filter.push(`(${this.options.group_filter_group_member_attribute}');
  assert.ok(clause > fn.indexOf('return [];'),
    'the clause is added after the guard, so it can never be skipped silently');
});

test('login and background sync use the same rule', () => {
  for (const file of ['packages/wekan-ldap/server/loginHandler.js',
    'packages/wekan-ldap/server/sync.js']) {
    const s = read(file);
    assert.ok(/isAdminByGroups\(/.test(s), `${file} must use the shared rule`);
    assert.ok(!/LDAP_SYNC_ADMIN_GROUPS'\)\.split\(','\)/.test(s),
      `${file} must not compare the raw split list any more`);
  }
});

console.log(`\n${passed} tests passed`);
