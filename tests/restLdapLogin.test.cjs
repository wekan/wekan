'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  useLdapForRestLogin,
  ldapRestLoginRequest,
} = require('../server/lib/restAuthenticationMethod');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('an existing LDAP account uses the LDAP login handler', () => {
  assert.strictEqual(
    useLdapForRestLogin({
      user: { authenticationMethod: 'ldap' },
      ldapEnabled: true,
      usernameProvided: true,
    }),
    true,
  );
});

test('a first LDAP login can create its local account through the REST API', () => {
  assert.strictEqual(
    useLdapForRestLogin({
      user: undefined,
      ldapEnabled: true,
      usernameProvided: true,
    }),
    true,
  );
});

test('local-password and external OAuth accounts never get redirected to LDAP', () => {
  for (const authenticationMethod of ['password', 'oidc', 'oauth2', 'cas']) {
    assert.strictEqual(
      useLdapForRestLogin({
        user: { authenticationMethod },
        ldapEnabled: true,
        usernameProvided: true,
      }),
      false,
    );
  }
});

test('email-only and disabled-LDAP requests do not invoke an LDAP username search', () => {
  assert.strictEqual(
    useLdapForRestLogin({
      user: undefined,
      ldapEnabled: true,
      usernameProvided: false,
    }),
    false,
  );
  assert.strictEqual(
    useLdapForRestLogin({
      user: { authenticationMethod: 'ldap' },
      ldapEnabled: false,
      usernameProvided: true,
    }),
    false,
  );
});

test('#4419 email-form login cannot route an LDAP account to its stale local password', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'apiAuthRoutes.js'),
    'utf8',
  );
  assert.match(
    source,
    /shouldRejectPasswordLogin\(\{[\s\S]*serviceName: 'password',[\s\S]*user,[\s\S]*env: process\.env/,
  );
  assert.match(
    source,
    /shouldRejectPasswordLogin\([\s\S]*equalizeMissingUserTiming\(Accounts\._checkPasswordAsync\)[\s\S]*throw uniformLoginError\(\)/,
  );
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
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'apiAuthRoutes.js'),
    'utf8',
  );
  assert.match(source, /Accounts\._runLoginHandlers\(/);
  assert.match(
    source,
    /ldapRestLoginRequest\(options\.username, options\.password\)/,
  );
  assert.match(source, /Accounts\._generateStampedLoginToken\(\)/);
  // The token is still inserted for the user the login handlers returned, but
  // through insertActiveLoginToken (server/lib/activeUser.js) rather than
  // Accounts._insertLoginToken: c3caf87a1 made issuance re-check loginDisabled
  // in the same update that pushes the token, so a disable racing a login
  // cannot leave a usable token behind.
  assert.match(
    source,
    /require\('\/server\/lib\/activeUser'\)\.insertActiveLoginToken\(result\.userId, stampedLoginToken\)/,
  );
});

test('no REST path mints a token that skips the disabled-account check (negative)', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'apiAuthRoutes.js'),
    'utf8',
  );
  assert.doesNotMatch(source, /Accounts\._insertLoginToken\(/,
    'a raw _insertLoginToken would issue a token to a disabled account');
});

test('negative LDAP results share the throttled uniform REST failure', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'apiAuthRoutes.js'),
    'utf8',
  );
  assert.match(
    source,
    // The last clause was `!user`; c3caf87a1 widened it to allowActiveUser,
    // which is also false for a missing user AND refuses a disabled one with
    // the same uniform error, so the failure stays indistinguishable.
    /!result \|\| result\.error \|\| !result\.userId \|\| !require\('\/server\/lib\/activeUser'\)\.allowActiveUser\(user, 'rest-login', req\)/,
  );
  assert.match(source, /restLoginThrottle\.recordFailure\(clientKey, now\)/);
  assert.match(source, /throw uniformLoginError\(\)/);
});

console.log(`\n${passed} passed`);
