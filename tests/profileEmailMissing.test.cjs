'use strict';

// Regression coverage for #2445. Sandstorm and other SSO accounts may have no
// emails array, but the profile form must still compare and save a first email.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const client = read('client/components/users/userHeader.js');
const server = read('server/models/users.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('profile submission treats a missing emails array as an empty address', () => {
  assert.match(client, /Array\.isArray\(currentUser\.emails\)/);
  assert.match(client, /primaryEmail \? primaryEmail\.address\.toLowerCase\(\) : ''/);
  assert.doesNotMatch(client, /ReactiveCache\.getCurrentUser\(\)\.emails\[0\]/);
});

test('configured users may change only their own email', () => {
  const method = server.slice(
    server.indexOf('  async setEmail(email, userId)'),
    server.indexOf('  async setUsernameAndEmail(', server.indexOf('  async setEmail(email, userId)')),
  );
  assert.match(method, /this\.userId === userId/);
  assert.match(method, /accounts-allowEmailChange/);
  assert.match(method, /if \(!currentUser\?\.isAdmin && !allowSelfChange\)/);
  assert.match(method, /throw new Meteor\.Error\('not-authorized'\)/);
});

test('the first saved address remains unverified', () => {
  assert.match(server, /emails: \[\{ address: email, verified: false \}\]/);
});

console.log(`\nprofileEmailMissing: ${passed} tests passed`);
