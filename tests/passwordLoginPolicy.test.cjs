'use strict';

// PASSWORD_LOGIN_ENABLED=false and DISABLE_FORGOT_PASSWORD are refused on the
// SERVER, not only hidden on the sign-in page
// (models/lib/passwordLoginPolicy.js,
// docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
// Run: node tests/passwordLoginPolicy.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const policy = require('../models/lib/passwordLoginPolicy');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const OFF = { PASSWORD_LOGIN_ENABLED: 'false' };

test('password login is on unless exactly false', () => {
  assert.strictEqual(policy.passwordLoginEnabled({}), true);
  assert.strictEqual(policy.passwordLoginEnabled(undefined), true);
  assert.strictEqual(policy.passwordLoginEnabled({ PASSWORD_LOGIN_ENABLED: 'true' }), true);
  assert.strictEqual(policy.passwordLoginEnabled({ PASSWORD_LOGIN_ENABLED: 'no' }), true);
  assert.strictEqual(policy.passwordLoginEnabled(OFF), false);
  assert.strictEqual(policy.passwordLoginEnabled({ PASSWORD_LOGIN_ENABLED: false }), false);
});

test('a DDP password sign-in is refused while password login is off', () => {
  for (const loginRequest of [{ user: { username: 'a' }, password: {} }, undefined, null, 'x']) {
    assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest, env: OFF }), 'password-login-disabled');
  }
});

test('and allowed while it is on (negative)', () => {
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest: {}, env: {} }), null);
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', env: { PASSWORD_LOGIN_ENABLED: 'true' } }), null);
});

test('other login services are never touched (negative)', () => {
  for (const type of ['resume', 'ldap', 'oidc', 'cas', 'saml', 'passwordless', 'passkey', 'sqrl', undefined]) {
    assert.strictEqual(policy.passwordLoginRefusal({ type, env: OFF }), null, String(type));
  }
});

test('the LDAP handler fallback works while LDAP and LDAP_LOGIN_FALLBACK are on', () => {
  const env = { ...OFF, LDAP_ENABLE: 'true', LDAP_LOGIN_FALLBACK: 'true' };
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest: { ldap: true }, env }), null);
});

test('but not without LDAP, without the fallback, or without ldap:true (negative)', () => {
  const ldapOnly = { ldap: true };
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest: ldapOnly,
    env: { ...OFF, LDAP_LOGIN_FALLBACK: 'true' } }), 'password-login-disabled');
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest: ldapOnly,
    env: { ...OFF, LDAP_ENABLE: 'true' } }), 'password-login-disabled');
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest: { ldap: 'true' },
    env: { ...OFF, LDAP_ENABLE: 'true', LDAP_LOGIN_FALLBACK: 'true' } }), 'password-login-disabled');
  assert.strictEqual(policy.passwordLoginRefusal({ type: 'password', loginRequest: { user: {}, password: {} },
    env: { ...OFF, LDAP_ENABLE: 'true', LDAP_LOGIN_FALLBACK: 'true' } }), 'password-login-disabled');
});

test('the login method refuses a { user, password } request before any lookup, LDAP never', () => {
  assert.strictEqual(policy.loginRequestRefusal({ user: { username: 'a' }, password: 'x' }, OFF), 'password-login-disabled');
  assert.strictEqual(policy.loginRequestRefusal({ user: { email: 'a@b' }, password: { digest: 'd', algorithm: 'sha-256' }, code: '1' }, OFF),
    'password-login-disabled');
  // negative
  assert.strictEqual(policy.loginRequestRefusal({ user: { username: 'a' }, password: 'x' }, {}), null);
  assert.strictEqual(policy.loginRequestRefusal({ ldap: true, username: 'a', ldapPass: 'x', ldapOptions: {} }, OFF), null);
  assert.strictEqual(policy.loginRequestRefusal({ resume: 'token' }, OFF), null);
  for (const junk of [null, undefined, 'x', 3]) assert.strictEqual(policy.loginRequestRefusal(junk, OFF), null);
});

test('REST login: refused, or sent to LDAP only, while password login is off', () => {
  assert.strictEqual(policy.restPasswordLoginRoute({ env: {}, usernameProvided: true }), null);
  assert.strictEqual(policy.restPasswordLoginRoute({ env: OFF, usernameProvided: true }), 'refuse');
  assert.strictEqual(policy.restPasswordLoginRoute({ env: OFF, usernameProvided: false }), 'refuse');
  assert.strictEqual(policy.restPasswordLoginRoute({ env: { ...OFF, LDAP_ENABLE: 'true' }, usernameProvided: true }), 'ldap');
  // LDAP authenticates its username field: an email form cannot be LDAP.
  assert.strictEqual(policy.restPasswordLoginRoute({ env: { ...OFF, LDAP_ENABLE: 'true' }, usernameProvided: false }), 'refuse');
});

test('forgot password: refused when disabled, or when password login is off', () => {
  assert.strictEqual(policy.forgotPasswordRefusal({ setting: {}, env: {} }), null);
  assert.strictEqual(policy.forgotPasswordRefusal({ setting: null, env: {} }), null);
  assert.strictEqual(policy.forgotPasswordRefusal({ setting: { disableForgotPassword: false }, env: {} }), null);
  assert.strictEqual(policy.forgotPasswordRefusal({ setting: { disableForgotPassword: true }, env: {} }), 'forgot-password-disabled');
  assert.strictEqual(policy.forgotPasswordRefusal({ setting: {}, env: OFF }), 'password-login-disabled');
  assert.strictEqual(policy.forgotPasswordRefusal({ setting: { disableForgotPassword: 'true' }, env: {} }), null,
    'only a stored true disables it');
});

test('every refusal code has a message', () => {
  for (const code of ['password-login-disabled', 'forgot-password-disabled']) {
    assert.ok(policy.REFUSAL_MESSAGES[code], code);
  }
});

// ---------------------------------------------------------------------------
// The server paths call the policy.
// ---------------------------------------------------------------------------
const authentication = read('server/authentication.js');
const apiAuthRoutes = read('server/apiAuthRoutes.js');

test('DDP: a validateLoginAttempt hook asks passwordLoginRefusal with the login request', () => {
  assert.match(authentication, /Accounts\.validateLoginAttempt\(function\(options\) \{\s*const \{ passwordLoginRefusal, REFUSAL_MESSAGES \} = require\('\/models\/lib\/passwordLoginPolicy'\);/);
  assert.match(authentication, /loginRequest: Array\.isArray\(options\.methodArguments\) \? options\.methodArguments\[0\] : undefined,/);
  assert.match(authentication, /key: 'authn\.password-login-disabled', action: 'blocked'/);
});

test('DDP: the login method is wrapped, deciding synchronously before the original runs', () => {
  const wrap = authentication.slice(authentication.indexOf('loginHandlers.login = function guardedLogin(...args) {'));
  assert.ok(wrap.length > 0);
  const body = wrap.slice(0, wrap.indexOf('\n    };'));
  assert.match(body, /loginRequestRefusal\(args\[0\], authEnvObject\)/);
  assert.doesNotMatch(body, /await /, 'no await before the original method, so its check() still counts');
  assert.ok(body.indexOf('throw new Meteor.Error(refusal') < body.indexOf('return originalLogin.apply(this, args);'));
});

test('DDP: Meteor\'s forgotPassword method is wrapped by forgotPasswordRefusal', () => {
  assert.match(authentication, /handlers\.forgotPassword = async function guardedForgotPassword/);
  assert.match(authentication, /forgotPasswordRefusal\(\{ setting: await ReactiveCache\.getCurrentSetting\(\), env: authEnvObject \}\)/);
  assert.match(authentication, /key: 'authn\.forgot-password-disabled', action: 'blocked'/);
});

test('REST: POST /users/login decides before it looks anybody up', () => {
  const route = apiAuthRoutes.slice(apiAuthRoutes.indexOf("WebApp.handlers.post('/users/login'"),
    apiAuthRoutes.indexOf("WebApp.handlers.options('/users/logout'"));
  const decide = route.indexOf('restPasswordLoginRoute(');
  assert.ok(decide > 0, 'the route asks restPasswordLoginRoute');
  const firstLookup = route.indexOf('Meteor.users.findOneAsync(');
  assert.ok(firstLookup > decide, 'no user is read before the decision, so a refusal names no account');
  assert.match(route, /if \(passwordRoute === 'refuse'\) \{/);
  assert.match(route, /const useLdap = passwordRoute === 'ldap' \|\| useLdapForRestLogin\(/);
  assert.match(route, /key: 'authn\.password-login-disabled', action: 'blocked', source: 'POST \/users\/login'/);
});

test('every local password check in the server is on a guarded path (negative, tree-wide)', () => {
  // A new route that checks a WeKan password itself would sign in past the
  // setting. Every Accounts._checkPasswordAsync call must be in a file that
  // asks the policy, or listed here with the reason it is not a sign-in.
  const NOT_A_SIGN_IN = {
    // equalizes the timing of a refused login with one dummy comparison
    'server/loginTimingNormalization.js': 'timing only',
    // the Cloud Panel's own customer login, against another WeKan's database
    'server/cloudPanel.js': 'not a password of this WeKan',
  };
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'tests' || entry.name === 'node_modules') continue;
        walk(rel);
      } else if (entry.name.endsWith('.js')) {
        const src = read(rel);
        if (!/_checkPasswordAsync\s*\(|_checkPassword\s*\(/.test(src.replace(/\/\/.*$/gm, ''))) continue;
        if (NOT_A_SIGN_IN[rel]) continue;
        if (!/passwordLoginPolicy/.test(src)) offenders.push(rel);
      }
    }
  };
  ['server', 'models', 'config', 'packages'].forEach(walk);
  assert.deepStrictEqual(offenders, [],
    'these check a local password without asking models/lib/passwordLoginPolicy.js');
});

test('the catalog keys exist and never disable the account', () => {
  const catalog = read('models/lib/securityCategories.js');
  for (const key of ['authn.password-login-disabled', 'authn.forgot-password-disabled']) {
    const line = catalog.split('\n').find(l => l.includes(`'${key}':`));
    assert.ok(line, `${key} is in the catalog`);
    assert.match(line, /blocksAccount: false/, `${key}: a page left open is no attacker`);
  }
});

test('the docs no longer call it a display setting', () => {
  const doc = read('docs/Features/Login-Page/Disable-Password-Login.md');
  assert.doesNotMatch(doc, /It is a display setting/);
  assert.match(doc, /Settings-Enforced-On-Server\.md/);
});

console.log(`\npasswordLoginPolicy: ${passed} passed`);
