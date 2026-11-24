'use strict';

// P3 (docs/Compliance/README.md, row 1.9): REGISTRATION_MINIMUM_AGE - a
// password sign-up confirms the minimum age, or is refused.
// Run: node --test tests/registrationAge.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const A = require('../models/lib/registrationAge');

const password = { services: { password: { bcrypt: 'x' } } };

test('the setting: a whole number of years, off otherwise', () => {
  assert.equal(A.minimumAge({}), 0);
  assert.equal(A.minimumAge({ REGISTRATION_MINIMUM_AGE: '16' }), 16);
  for (const bad of ['0', '-1', '13.5', 'abc', '99']) assert.equal(A.minimumAge({ REGISTRATION_MINIMUM_AGE: bad }), 0, bad);
});

test('a password sign-up without the confirmation is refused; with it, accepted', () => {
  assert.equal(A.ageRefusal({ age: 16, user: password, adminCreated: false, confirmed: undefined }), 'error-minimum-age');
  assert.equal(A.ageRefusal({ age: 16, user: password, adminCreated: false, confirmed: 'true' }), 'error-minimum-age', 'only a real true');
  assert.equal(A.ageRefusal({ age: 16, user: password, adminCreated: false, confirmed: true }), null);
  assert.equal(A.ageRefusal({ age: 0, user: password, adminCreated: false }), null, 'off');
});

test('negative: an account an administrator creates, or an identity provider brings, is not asked', () => {
  assert.equal(A.ageRefusal({ age: 16, user: password, adminCreated: true }), null);
  assert.equal(A.ageRefusal({ age: 16, user: { services: { oidc: {} } }, adminCreated: false }), null);
  assert.equal(A.ageRefusal({ age: 16, user: { authenticationMethod: 'ldap' }, adminCreated: false }), null);
});

test('the server refuses before the account exists, and keeps nothing of the box', () => {
  const users = read('server/models/users.js');
  assert.match(users, /const refusal = ageRefusal\(\{ age, user, adminCreated: !!creation, confirmed: options && options\.profile && options\.profile\.confirmAge \}\);/);
  assert.match(users, /if \(user\.profile\) delete user\.profile\.confirmAge;/);
  assert.match(read('config/accounts.js'), /_id: 'confirmAge',\s*type: 'checkbox',/);
  assert.match(read('client/components/legal/legalAcceptance.jade'), /input#at-field-confirmAge\(type="checkbox" name="at-field-confirmAge" required\)/);
  assert.ok(require('../models/lib/legalAcceptance').ALLOWED_METHODS.has('getRegistrationMinimumAge'));
});
