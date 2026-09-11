'use strict';

// Admin Panel LDAP override (models/lib/configResolver.js,
// packages/wekan-ldap/server/testConnection.js): source checks that pin the
// two security guarantees the maintainer's task rests on.
//
//   1. "do not load passwords to browserside" - Settings.ldap.bindPassword
//      (the LDAP bind password) must never appear in a client-visible
//      publication field list, ANYWHERE in the tree, not only at the one
//      call site this feature added it at.
//   2. the LDAP "Test Connection" Meteor method must require isAdmin and
//      must never put the bind password into its result.
//
// Run: node tests/ldapAdminOverrideSecurity.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(dir, filter, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name === '_build' || entry.name === '.build' || entry.name === 'node_modules'
      || entry.name === '.tools' || entry.name === '.meteor') continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, filter, out);
    else if (filter(entry.name)) out.push(rel);
  }
  return out;
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('ldapAdminOverrideSecurity:');

test('server/publications/settings.js never publishes ldap.bindPassword', () => {
  const pub = read('server/publications/settings.js');
  assert.ok(!/['"]ldap\.bindPassword['"]\s*:\s*1/.test(pub),
    'ldap.bindPassword must never be in a published field list');
  assert.ok(/['"]ldap\.bindPasswordSet['"]\s*:\s*1/.test(pub),
    'only the boolean ldap.bindPasswordSet may be published');
});

// NEGATIVE, whole-tree: the same shape (a *Password/*Secret sub-field of a
// Settings.publish field list literally named `1`) must not exist anywhere
// else either - not only at the LDAP call site this feature touched. Mirrors
// the existing mailServer.password / mailServer.passwords exclusion.
test('no server publication anywhere sends a raw *password*/*secret* field '
  + '(negative, whole tree)', () => {
  const offenders = [];
  for (const file of walk('server', name => name.endsWith('.js'))) {
    const src = read(file);
    for (const m of src.matchAll(/Meteor\.publish\(/g)) {
      const block = src.slice(m.index, src.indexOf('\n});', m.index) + 4);
      // `-` is part of the path class so a hyphenated sub-document key
      // ('oauthProviders.meteor-developer.secret') cannot slip past the sweep.
      const leaks = [...block.matchAll(/['"]([\w.-]*(?:[Pp]assword|[Ss]ecret)[\w.-]*)['"]\s*:\s*1/g)]
        .map(x => x[1])
        // ...Set: 1 / ...Configured: 1 style booleans are the safe pattern
        // (mailServer.passwordSet, ldap.bindPasswordSet) - only a bare
        // password/secret FIELD publishing its actual value is the fault.
        .filter(name => !/(?:Set|Configured|Present|Exists)$/i.test(name));
      if (leaks.length) offenders.push(`${file}: ${leaks.join(', ')}`);
    }
  }
  assert.deepStrictEqual(offenders, [],
    'a publication that sends a raw password/secret field leaks it to every subscriber');
});

// The OAuth login providers (Admin Panel override of OAUTH_<PROVIDER>_SECRET,
// models/lib/oauthProviders.js) store their secret the same way LDAP stores
// its bind password, so the same guarantee applies: the publication carries
// 'oauthProviders.<key>.secretSet' (a boolean) and never
// 'oauthProviders.<key>.secret'. Pinned here explicitly as well as by the
// whole-tree sweep above, so a future `oauthProviders: 1` shortcut (which
// would carry every secret) fails by name.
test('server/publications/settings.js never publishes an OAuth provider secret', () => {
  const pub = read('server/publications/settings.js');
  assert.ok(!/['"]oauthProviders\.[\w-]+\.secret['"]\s*:\s*1/.test(pub),
    'oauthProviders.<key>.secret must never be in a published field list');
  assert.ok(!/^\s*oauthProviders\s*:\s*1/m.test(pub),
    'a bare oauthProviders: 1 would publish every secret');
  const setFields = [...pub.matchAll(/['"]oauthProviders\.([\w-]+)\.secretSet['"]\s*:\s*1/g)]
    .map(m => m[1]);
  for (const key of ['google', 'github', 'facebook', 'twitter', 'meteor-developer', 'weibo', 'meetup']) {
    assert.ok(setFields.includes(key), `only the boolean oauthProviders.${key}.secretSet may be published`);
  }
});

test('the whole-tree sweep would catch a published OAuth secret (negative)', () => {
  const sample = "Meteor.publish('x', function() {\n  return { 'oauthProviders.google.secret': 1, 'oauthProviders.google.secretSet': 1 };\n});";
  const leaks = [...sample.matchAll(/['"]([\w.-]*(?:[Pp]assword|[Ss]ecret)[\w.]*)['"]\s*:\s*1/g)]
    .map(x => x[1])
    .filter(name => !/(?:Set|Configured|Present|Exists)$/i.test(name));
  assert.deepStrictEqual(leaks, ['oauthProviders.google.secret']);
});

test('models/settings.js keeps ldap.bindPassword optional and unset by default '
  + '(no install is forced to fill it in)', () => {
  const src = read('models/settings.js');
  const at = src.indexOf("'ldap.bindPassword'");
  assert.ok(at !== -1, 'the schema field must exist');
  const block = src.slice(at, src.indexOf('}', at) + 1);
  assert.ok(/optional:\s*true/.test(block), 'ldap.bindPassword must be optional');
});

test('ldap_test_connection requires isAdmin and rejects a non-admin caller', () => {
  const src = read('packages/wekan-ldap/server/testConnection.js');
  const methodStart = src.indexOf('async ldap_test_connection');
  assert.ok(methodStart !== -1, 'the method must exist');
  const body = src.slice(methodStart);
  assert.ok(/if\s*\(\s*!user\.isAdmin\s*\)/.test(body),
    'the method body must check user.isAdmin before doing anything with LDAP');
  assert.ok(/throw new Meteor\.Error\(\s*['"]error-notAuthorized['"]/.test(body),
    'and must throw when the caller is not an admin');
  // The isAdmin check must come BEFORE the LDAP connection is attempted, or a
  // non-admin could still trigger a bind attempt before being refused.
  const adminCheckAt = body.indexOf('!user.isAdmin');
  const connectAt = body.indexOf('ldap.connect()');
  assert.ok(adminCheckAt !== -1 && connectAt !== -1 && adminCheckAt < connectAt,
    'the admin check must run before any LDAP connection attempt');
});

test('ldap_test_connection never includes the bind password in its response '
  + '(negative)', () => {
  const src = read('packages/wekan-ldap/server/testConnection.js');
  assert.ok(!/Authentication_Password/.test(src),
    'the test-connection method must not read/return the bind password field');
  assert.ok(!/bindPassword/.test(src),
    'and must not reference the admin-panel bind password field directly');
});

console.log(`\n${passed} tests passed`);
