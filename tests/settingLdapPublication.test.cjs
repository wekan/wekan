'use strict';

// Guard: DirectoryInfoBleed (2026-10-02). The 'setting' publication, which every visitor
// subscribes to before signing in, carried Admin Panel -> LDAP's host, port,
// base DN, bind account DN, search filter and encryption mode. Only a site
// admin is published those now.
// Run: node tests/settingLdapPublication.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/publications/settings.js'), 'utf8');
const block = name => src.slice(src.indexOf(`const ${name} = {`), src.indexOf('\n};', src.indexOf(`const ${name} = {`)));

test('the directory server details are admin-only', () => {
  const publicFields = block('SETTING_FIELDS');
  const adminFields = block('ADMIN_SETTING_FIELDS');
  for (const field of ['host', 'port', 'baseDN', 'authentificationUserDN', 'bindPasswordSet', 'userSearchFilter', 'userSearchField', 'encryption']) {
    assert.ok(!publicFields.includes(`'ldap.${field}': 1`), `ldap.${field} is not public`);
    assert.ok(adminFields.includes(`'ldap.${field}': 1`), `ldap.${field} is published to admins`);
  }
  // The login page still learns whether LDAP is on (negative).
  assert.ok(publicFields.includes("'ldap.enabled': 1"));
  assert.ok(!/'ldap\.bindPassword':/.test(src), 'the password itself is published to nobody');
});

test('both publishing paths use the per-viewer field set', () => {
  assert.match(src, /viewer && viewer\.isAdmin === true && viewer\.loginDisabled !== true\n\s*\? \{ \.\.\.SETTING_FIELDS, \.\.\.ADMIN_SETTING_FIELDS \}\n\s*: SETTING_FIELDS;/);
  assert.equal((src.match(/Settings\.find\(\{\}, \{ fields \}\)/g) || []).length, 2);
  assert.doesNotMatch(src, /Settings\.find\(\{\}, \{ fields: SETTING_FIELDS \}\)/);
});
