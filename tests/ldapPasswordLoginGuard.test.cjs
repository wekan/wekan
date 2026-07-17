'use strict';

// Plain-Node unit test (no Meteor) for the #4419 LDAP password-login guard.
// Run: node tests/ldapPasswordLoginGuard.test.cjs
//
// Security issue #4419: after a user is migrated from local password login to
// LDAP (authenticationMethod: 'ldap'), the old local password hash stays in
// services.password and keeps working. The guard rejects password-service
// login attempts for such users — conservatively: only while LDAP is enabled,
// never for other login services, never when LDAP_LOGIN_FALLBACK routes LDAP
// logins through the password service on purpose, and with an operator
// opt-out (LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN=true) so no deployment can be
// hard-locked by the upgrade.

const assert = require('assert');
const {
  shouldRejectPasswordLogin,
  LDAP_PASSWORD_LOGIN_DISABLED_REASON,
} = require('../server/lib/ldapPasswordLoginGuard');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const ldapUser = { _id: 'u1', username: 'alice', authenticationMethod: 'ldap' };
const passwordUser = {
  _id: 'u2',
  username: 'bob',
  authenticationMethod: 'password',
};
const ldapEnabled = { LDAP_ENABLE: 'true' };

// --- Rejections (the fix) ---------------------------------------------------

test('reject: ldap user + password service + LDAP enabled', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: ldapUser,
      env: ldapEnabled,
    }),
    true,
  );
});

test('reject: same rule for admins (no admin exemption)', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: { ...ldapUser, isAdmin: true },
      env: ldapEnabled,
    }),
    true,
  );
});

test('reject: boolean true LDAP_ENABLE also counts as enabled', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: ldapUser,
      env: { LDAP_ENABLE: true },
    }),
    true,
  );
});

// --- Allowed cases (must never lock anyone out) ------------------------------

test('allow: ldap user + ldap service (the intended login path)', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'ldap',
      user: ldapUser,
      env: ldapEnabled,
    }),
    false,
  );
});

test('allow: other services are never rejected (resume/oidc/cas/saml)', () => {
  for (const serviceName of ['resume', 'oidc', 'cas', 'saml']) {
    assert.strictEqual(
      shouldRejectPasswordLogin({ serviceName, user: ldapUser, env: ldapEnabled }),
      false,
      `service ${serviceName} must not be rejected`,
    );
  }
});

test('allow: password user + password service', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: passwordUser,
      env: ldapEnabled,
    }),
    false,
  );
});

test('allow: ldap user + password service when LDAP is disabled (de-LDAPed instance, admins must not be locked out)', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: ldapUser,
      env: { LDAP_ENABLE: 'false' },
    }),
    false,
  );
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: ldapUser,
      env: {},
    }),
    false,
    'unset LDAP_ENABLE means LDAP disabled',
  );
});

test('allow: operator opt-out LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN=true keeps old behavior', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: ldapUser,
      env: {
        LDAP_ENABLE: 'true',
        LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN: 'true',
      },
    }),
    false,
  );
});

test('allow: LDAP_LOGIN_FALLBACK=true intentionally uses the password service (wekan-ldap loginHandler fallback)', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: ldapUser,
      env: { LDAP_ENABLE: 'true', LDAP_LOGIN_FALLBACK: 'true' },
    }),
    false,
  );
});

test('allow: user without authenticationMethod', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: { _id: 'u3', username: 'carol' },
      env: ldapEnabled,
    }),
    false,
  );
});

test('allow: missing user / missing env / missing args never throw and never reject', () => {
  assert.strictEqual(
    shouldRejectPasswordLogin({
      serviceName: 'password',
      user: undefined,
      env: ldapEnabled,
    }),
    false,
  );
  assert.strictEqual(
    shouldRejectPasswordLogin({ serviceName: 'password', user: ldapUser }),
    false,
    'missing env means LDAP not enabled',
  );
  assert.strictEqual(shouldRejectPasswordLogin(), false, 'no args at all');
});

test('reason: a clear user-facing message is exported for the hook', () => {
  assert.strictEqual(typeof LDAP_PASSWORD_LOGIN_DISABLED_REASON, 'string');
  assert.ok(/LDAP/.test(LDAP_PASSWORD_LOGIN_DISABLED_REASON));
  assert.ok(/password/i.test(LDAP_PASSWORD_LOGIN_DISABLED_REASON));
});

console.log(`\nldapPasswordLoginGuard: all ${passed} tests passed`);
