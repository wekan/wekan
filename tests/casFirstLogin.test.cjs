'use strict';

// Regression coverage for #3204. A first CAS login constructs a valid user
// without services. The shared onCreateUser hook must not assume OIDC data.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const users = read('server/models/users.js');
const cas = read('packages/wekan-accounts-cas/cas_server.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the shared account hook tolerates missing service data', () => {
  assert.match(users, /if \(user\.services\?\.oidc\)/);
  assert.doesNotMatch(users, /if \(user\.services\.oidc\)/);
  const casUser = { authenticationMethod: 'cas' };
  assert.strictEqual(casUser.services?.oidc, undefined);
});

test('CAS supplies the complete top-level identity needed for insertion', () => {
  const options = cas.slice(
    cas.indexOf('  options = {'),
    cas.indexOf('  if (attrs.debug)', cas.indexOf('  options = {')),
  );
  for (const field of [
    'username:',
    'emails:',
    'profile:',
    "authenticationMethod: 'cas'",
  ]) {
    assert.ok(options.includes(field), `CAS user must contain ${field}`);
  }
  assert.doesNotMatch(options, /services\s*:/,
    'CAS does not need a fabricated OAuth services object');
  assert.match(cas, /Accounts\.insertUserDoc\(\{\}, options\)/);
});

test('CAS still refuses silent takeover of a non-CAS username', () => {
  assert.match(cas, /const isCasAccount = user\.authenticationMethod === 'cas'/);
  assert.match(cas, /const mergeAllowed = process\.env\.CAS_MERGE_EXISTING_USERS === 'true'/);
  assert.match(cas, /throw new Meteor\.Error\(\s*'cas-account-conflict'/);
});

console.log(`\ncasFirstLogin: ${passed} tests passed`);
