'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  useLdapForRestLogin,
  ldapRestLoginRequest,
} = require('../server/lib/restAuthenticationMethod');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('an existing LDAP account uses the LDAP login handler', () => {
  assert.strictEqual(useLdapForRestLogin({
    user: { authenticationMethod: 'ldap' },
    ldapEnabled: true,
    usernameProvided: true,
  }), true);
});

test('a first LDAP login can create its local account through the REST API', () => {
  assert.strictEqual(useLdapForRestLogin({
    user: undefined,
    ldapEnabled: true,
    usernameProvided: true,
  }), true);
});

test('local-password and external OAuth accounts never get redirected to LDAP', () => {
  for (const authenticationMethod of ['password', 'oidc', 'oauth2', 'cas']) {
    assert.strictEqual(useLdapForRestLogin({
      user: { authenticationMethod },
      ldapEnabled: true,
      usernameProvided: true,
    }), false);
  }
});

test('email-only and disabled-LDAP requests do not invoke an LDAP username search', () => {
  assert.strictEqual(useLdapForRestLogin({
    user: undefined,
    ldapEnabled: true,
    usernameProvided: false,
  }), false);
  assert.strictEqual(useLdapForRestLogin({
    user: { authenticationMethod: 'ldap' },
    ldapEnabled: false,
    usernameProvided: true,
  }), false);
});

test('LDAP request has the same shape as the browser login helper', () => {
  assert.deepStrictEqual(ldapRestLoginRequest('alice', 'secret'), {
    ldap: true,
    username: 'alice',
    ldapPass: 'secret',
    ldapOptions: {},
  });
});

test('route wires LDAP through Meteor handlers and keeps REST token creation', () => {
  const source = fs.readFileSync(path.join(
    __dirname, '..', 'server', 'apiAuthRoutes.js',
  ), 'utf8');
  assert.match(source, /Accounts\._runLoginHandlers\(/);
  assert.match(source, /ldapRestLoginRequest\(options\.username, options\.password\)/);
  assert.match(source, /Accounts\._generateStampedLoginToken\(\)/);
  assert.match(source, /Accounts\._insertLoginToken\(result\.userId/);
});

test('negative LDAP results share the throttled uniform REST failure', () => {
  const source = fs.readFileSync(path.join(
    __dirname, '..', 'server', 'apiAuthRoutes.js',
  ), 'utf8');
  assert.match(source, /!result \|\| result\.error \|\| !result\.userId \|\| !user/);
  assert.match(source, /restLoginThrottle\.recordFailure\(clientKey, now\)/);
  assert.match(source, /throw uniformLoginError\(\)/);
});

console.log(`\n${passed} passed`);
