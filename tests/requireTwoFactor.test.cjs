'use strict';

// REQUIRE_2FA: compulsory two-factor authentication
// (models/lib/twoFactorRequirement.js, server/requireTwoFactor.js,
// server/lib/activeUser.js, client/components/users/twoFactorRequired.*).
//
//  - test: an account the requirement covers, without 2FA, is refused every
//    method and publication but signing in and enrolling, gets no REST token,
//    is not accepted by HTTP routes, and cannot switch 2FA off once required;
//  - negative: with REQUIRE_2FA off nothing changes; an account WITH 2FA, an
//    account outside the requirement (admins only) and an LDAP/OAuth/Sandstorm
//    account are never refused; server-internal calls are never refused; the
//    allow-list holds nothing that reads or writes data;
//  - the browser shows the set-up over everything and reloads once it is done.
//
// Run: node tests/requireTwoFactor.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const req2fa = require('../models/lib/twoFactorRequirement');
const { requireTwoFactorMode, twoFactorApplies, missingTwoFactor, ALLOWED_METHODS, ALLOWED_PUBLICATIONS } = req2fa;

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(async () => { await fn(); passed += 1; console.log('  ok -', name); });
}
const env = values => name => values[name];

const PASSWORD = { bcrypt: 'x' };
const OTP = { secret: 's', type: 'otp' };
const users = {
  alice: { _id: 'alice', isAdmin: false, services: { password: PASSWORD } },
  admin: { _id: 'admin', isAdmin: true, services: { password: PASSWORD } },
  adminWith2fa: { _id: 'adminWith2fa', isAdmin: true, services: { password: PASSWORD, twoFactorAuthentication: OTP } },
  enrolling: { _id: 'enrolling', services: { password: PASSWORD, twoFactorAuthentication: { secret: 's' } } },
  ldap: { _id: 'ldap', authenticationMethod: 'ldap', services: { password: PASSWORD, ldap: true } },
  oauth: { _id: 'oauth', authenticationMethod: 'oauth2', services: { oidc: {} } },
  sandstorm: { _id: 'sandstorm', services: { sandstorm: { id: 'x' } } },
};

test('who must have 2FA, per mode', () => {
  assert.strictEqual(requireTwoFactorMode(env({})), 'off');
  assert.strictEqual(requireTwoFactorMode(env({ REQUIRE_2FA: 'ALL' })), 'all');
  assert.strictEqual(requireTwoFactorMode(env({ REQUIRE_2FA: 'everyone' })), 'off', 'an unknown value is off, not on');
  assert.strictEqual(missingTwoFactor(users.alice, 'all'), true);
  assert.strictEqual(missingTwoFactor(users.alice, 'admins'), false);
  assert.strictEqual(missingTwoFactor(users.admin, 'admins'), true);
  assert.strictEqual(missingTwoFactor(users.adminWith2fa, 'all'), false);
  assert.strictEqual(missingTwoFactor(users.enrolling, 'all'), true, 'a secret without a confirmed code is not 2FA yet');
});

test('negative: a directory, OAuth or Sandstorm account is never required to enrol', () => {
  for (const u of [users.ldap, users.oauth, users.sandstorm]) {
    assert.strictEqual(twoFactorApplies(u, 'all'), false, u._id);
  }
  assert.strictEqual(twoFactorApplies(null, 'all'), false);
});

function loadServer(mode, storedUsers) {
  const handlers = {};
  const publications = {};
  const Meteor = {
    Error: class extends Error { constructor(error, reason) { super(reason); this.error = error; this.reason = reason; } },
    methods(defs) { Object.assign(handlers, defs); },
    startup(fn) { fn(); },
    defer(fn) { fn(); },
    server: { method_handlers: handlers, publish_handlers: publications },
    users: { findOneAsync: async id => storedUsers[id] || null },
  };
  const context = {
    Meteor, Symbol, Date, Object,
    authEnv: name => (name === 'REQUIRE_2FA' ? mode : undefined),
    // server/lib/argumentChecks.js; the audit itself is tests/wrappedHandlerArgumentChecks.test.cjs.
    deferArgumentAudit() {}, applyAudited: (handler, self, args) => handler.apply(self, args),
    require: p => (p === '/models/lib/twoFactorRequirement' ? req2fa : require(p)),
    module: { exports: {} },
  };
  const src = read('server/requireTwoFactor.js')
    .replace(/^import .*;\n/gm, '')
    .replace(/^export \{[^}]*\};?\n?/m, 'module.exports = { mustEnrol, wrapAll };\n');
  // Data methods and publications defined BEFORE startup wraps them.
  handlers.updateCard = async function updateCard() { return 'updated'; };
  handlers.login = async function login() { return 'logged-in'; };
  handlers.enableUser2fa = async function enableUser2fa() { return 'enabled'; };
  handlers.disableUser2fa = async function disableUser2fa() { return 'disabled'; };
  publications.board = function board() { return 'cursor'; };
  publications.setting = function setting() { return 'settings'; };
  vm.runInNewContext(src, context);
  return { handlers, publications, Meteor, exports: context.module.exports };
}

function invocation(userId) {
  return { userId, connection: {}, ready() { this.wasReady = true; } };
}

test('an account that must enrol may only sign in and enrol', async () => {
  const { handlers, publications } = loadServer('all', users);
  const inv = invocation('alice');
  await assert.rejects(() => handlers.updateCard.call(inv), e => e.error === 'two-factor-required');
  assert.strictEqual(await handlers.login.call(inv), 'logged-in');
  assert.strictEqual(await handlers.enableUser2fa.call(inv), 'enabled');
  assert.strictEqual(await handlers.getTwoFactorRequirement.call(inv).then(r => r.required && !r.enabled), true);
  const sub = invocation('alice');
  assert.strictEqual(await publications.board.call(sub), undefined, 'an empty publication');
  assert.strictEqual(sub.wasReady, true);
  assert.strictEqual(await publications.setting.call(invocation('alice')), 'settings', 'the sign-in page still loads');
});

test('a method defined after the first pass is wrapped by the deferred one', async () => {
  const { handlers, exports } = loadServer('all', users);
  handlers.lateMethod = async () => 'late';
  exports.wrapAll();
  await assert.rejects(() => handlers.lateMethod.call(invocation('alice')), e => e.error === 'two-factor-required');
  const once = handlers.lateMethod;
  exports.wrapAll();
  assert.strictEqual(handlers.lateMethod, once, 'wrapping twice does not wrap twice');
});

test('once required, 2FA cannot be switched off', async () => {
  const { handlers } = loadServer('all', users);
  await assert.rejects(() => handlers.disableUser2fa.call(invocation('adminWith2fa')), e => e.error === 'two-factor-required');
  const off = loadServer('admins', users);
  const stored = { ...users, aliceWith2fa: { ...users.alice, _id: 'aliceWith2fa', services: { password: PASSWORD, twoFactorAuthentication: OTP } } };
  const admins = loadServer('admins', stored);
  assert.strictEqual(await admins.handlers.disableUser2fa.call(invocation('aliceWith2fa')), 'disabled', 'not required for her');
  assert.ok(off);
});

test('negative: nothing is refused when it is off, enrolled, outside the requirement or server-internal', async () => {
  const off = loadServer('off', users);
  assert.strictEqual(await off.handlers.updateCard.call(invocation('alice')), 'updated');
  const on = loadServer('all', users);
  assert.strictEqual(await on.handlers.updateCard.call(invocation('adminWith2fa')), 'updated');
  assert.strictEqual(await on.handlers.updateCard.call(invocation('ldap')), 'updated');
  assert.strictEqual(await on.handlers.updateCard.call(invocation('sandstorm')), 'updated');
  assert.strictEqual(await on.handlers.updateCard.call({ userId: 'alice', connection: null }), 'updated', 'server-internal');
  assert.strictEqual(await on.handlers.updateCard.call(invocation(null)), 'updated', 'not signed in: the method decides');
  const admins = loadServer('admins', users);
  assert.strictEqual(await admins.handlers.updateCard.call(invocation('alice')), 'updated');
});

test('negative: an account that has just enrolled is not kept waiting by a cached refusal', async () => {
  const stored = { ...users, bob: { _id: 'bob', services: { password: PASSWORD } } };
  const { handlers } = loadServer('all', stored);
  const inv = invocation('bob');
  await assert.rejects(() => handlers.updateCard.call(inv));
  stored.bob = { ...stored.bob, services: { password: PASSWORD, twoFactorAuthentication: OTP } };
  assert.strictEqual(await handlers.updateCard.call(inv), 'updated');
});

test('negative: the allow-list holds sign-in, enrolment and sign-in page questions only', () => {
  for (const name of ALLOWED_METHODS) {
    assert.match(name, /^(login|logout|logoutOtherClients|getNewToken|removeOtherTokens|generate2faActivationQrCode|enableUser2fa|has2faEnabled|getTwoFactorRequirement|getPasswordPolicy|passwordPwnedRange|is[A-Z]\w*Enabled|isDisable\w+|get(Oauth\w+Url|DefaultAuthenticationMethod|AuthenticationsEnabled))$/, name);
  }
  assert.ok(!ALLOWED_METHODS.has('disableUser2fa'));
  assert.deepStrictEqual([...ALLOWED_PUBLICATIONS].sort(), ['setting', 'user-authenticationMethod']);
});

test('HTTP routes and the REST API do not accept an account that must enrol', () => {
  const active = read('server/lib/activeUser.js');
  assert.strictEqual((active.match(/&& !missingRequiredTwoFactor\(user\)/g) || []).length, 2, 'by id and by token');
  const rest = read('server/apiAuthRoutes.js');
  const at = rest.indexOf("missingRequiredTwoFactor(user)");
  assert.ok(at > -1 && at < rest.indexOf('Accounts._generateStampedLoginToken()'), 'refused before a token is made');
  assert.doesNotMatch(active.slice(active.indexOf('export function missingRequiredTwoFactor')), /securityLog/,
    'enrolling is ordinary use, not an attack to record');
});

test('the browser shows the set-up over everything and reloads when it is done', () => {
  const jade = read('client/components/users/twoFactorRequired.jade');
  assert.match(jade, /\+twoFactorAuthPopup/);
  assert.match(jade, /js-two-factor-required-logout/);
  const js = read('client/components/users/twoFactorRequired.js');
  assert.match(js, /Meteor\.call\('getTwoFactorRequirement'/);
  assert.match(js, /window\.location\.reload\(\)/);
  assert.match(read('client/features/users.js'), /twoFactorRequired\.js/);
  assert.match(read('server/imports.js'), /import '\/server\/requireTwoFactor';/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['two-factor-required-title'] && en['two-factor-required-text']);
  const { AUTH_CONFIG_SECTIONS } = require('../models/lib/authConfigCatalog');
  const field = AUTH_CONFIG_SECTIONS.login.fields.find(f => f.envVar === 'REQUIRE_2FA');
  assert.deepStrictEqual([field.choices, field.defaultValue], [['off', 'admins', 'all'], 'off']);
});

(async () => {
  for (const run of pending) await run();
  console.log(`requireTwoFactor: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
