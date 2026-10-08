'use strict';
// #5339: users who register through one OAuth2/OIDC provider (a Nextcloud)
// share no email domain, so the organization auto-add by domain could not
// group them. OAUTH2_DEFAULT_ORGANIZATION names an existing organization every
// account created by an OAuth2/OIDC login joins.
//
// Run: node tests/oauthDefaultOrganization.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const { authConfigField } = require('../models/lib/authConfigCatalog');
const users = read('server/models/users.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('oauthDefaultOrganization:');

const helper = users.slice(users.indexOf('const addDefaultOauthOrganization = async user => {'),
  users.indexOf('const autoAddOrgsByDomain = async user => {'));

test('a setting of the OAuth2 section, overridable in the Admin Panel', () => {
  const field = authConfigField('OAUTH2_DEFAULT_ORGANIZATION');
  assert.ok(field);
  assert.equal(field.section, 'oidc');
  assert.equal(field.type, 'text');
});

test('the new account joins the existing organization, found by short name, display name or id', () => {
  assert.match(helper, /authEnv\('OAUTH2_DEFAULT_ORGANIZATION'\)/);
  assert.match(helper, /\$or: \[\{ orgShortName: name \}, \{ orgDisplayName: name \}, \{ _id: name \}\]/);
  assert.match(helper, /user\.orgs = \(user\.orgs \|\| \[\]\)\.concat\(\{ orgId: org\._id, orgDisplayName:/);
});

test('negative: no organization is created, none is added twice, and an error never stops the login', () => {
  assert.doesNotMatch(helper, /Org\.insert|insertAsync/);
  assert.match(helper, /if \(\(user\.orgs \|\| \[\]\)\.some\(o => o && o\.orgId === org\._id\)\) return;/);
  assert.match(helper, /\} catch \(error\) \{\s*console\.error\('addDefaultOauthOrganization failed:'/);
});

test('only accounts that an OAuth2/OIDC login creates, beside the domain rule', () => {
  assert.match(users, /if \(!existingUser\) \{\s*await autoAddOrgsByDomain\(user\);\s*await addDefaultOauthOrganization\(user\);\s*return user;/);
  assert.equal((users.match(/await addDefaultOauthOrganization\(/g) || []).length, 1);
});

console.log(`\noauthDefaultOrganization: ${passed} tests passed`);
