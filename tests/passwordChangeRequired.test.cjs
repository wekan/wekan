'use strict';

// PASSWORD_MIN_LENGTH for passwords set before it (server/passwordChangeRequired.js,
// client/components/users/passwordChangeRequired.*, config/accounts.js), and
// "changing one's own password signs every session out".
//
//  - test: a sign-in with a password shorter than the minimum is reported; with
//    PASSWORD_MIN_LENGTH_ENFORCE the account must also change it; changing it
//    (changePassword, resetPassword, the admin's setPassword) ends that and
//    marks the report fixed, and an own change empties the account's login
//    tokens - every session, the changing one too;
//  - negative: without enforcement nobody is asked to change; an LDAP/OAuth/SAML
//    account is neither reported nor asked; a failed change (wrong current
//    password) signs nobody out; the original method is called at once, so
//    audit-argument-checks still sees its check(); the browser sends no
//    password length to the server.
// Run: node tests/passwordChangeRequired.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const policy = require('../models/lib/passwordPolicy');
const req2fa = require('../models/lib/twoFactorRequirement');

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(async () => { await fn(); passed += 1; console.log('  ok -', name); });
}

const PASSWORD = { bcrypt: 'x' };
function load(enforce, { changeFails = false, minLength = 12 } = {}) {
  const reports = [];
  const fixed = [];
  const users = {
    alice: { _id: 'alice', services: { password: PASSWORD, resume: { loginTokens: [{}, {}] } } },
    ldap: { _id: 'ldap', authenticationMethod: 'ldap', services: { password: PASSWORD, resume: { loginTokens: [{}] } } },
  };
  const calls = [];
  const handlers = {
    changePassword: async function changePassword() {
      calls.push('changePassword');
      if (changeFails) throw new Error('Incorrect password');
      return undefined;
    },
    resetPassword: async function resetPassword() { calls.push('resetPassword'); return { id: 'alice', token: 't' }; },
  };
  const update = (id, modifier) => {
    const user = users[id];
    if (!user) return;
    for (const [k] of Object.entries(modifier.$unset || {})) delete user[k];
    for (const [k, v] of Object.entries(modifier.$set || {})) {
      if (k === 'services.resume.loginTokens') user.services.resume.loginTokens = v;
      else user[k] = v;
    }
  };
  const Meteor = {
    Error: class extends Error { constructor(e) { super(e); this.error = e; } },
    methods(defs) { Object.assign(handlers, defs); },
    server: { method_handlers: handlers },
    users: { findOneAsync: async id => users[id] || null, updateAsync: async (id, m) => update(id, m) },
  };
  const ctx = {
    Meteor, Object, Promise,
    currentPasswordPolicy: () => ({ minLength, enforce, checkPwned: false }),
    recordShortPasswordLogin: async user => { reports.push(user._id); },
    markShortPasswordFixed: async id => { fixed.push(id); },
    require: p => (p === '/models/lib/twoFactorRequirement' ? req2fa : require(p)),
    module: { exports: {} },
  };
  vm.runInNewContext(read('server/passwordChangeRequired.js').replace(/^import .*;\n/gm, '')
    .replace(/^export async function /m, 'async function ')
    + '\nmodule.exports = { endPasswordChangeRequirement };\n', ctx);
  return { handlers, users, calls, reports, fixed, exports: ctx.module.exports };
}
const as = userId => ({ userId, connection: {} });
// Objects made inside the vm have another realm's prototypes.
const plain = v => JSON.parse(JSON.stringify(v));

test('enforced, a short password is reported and must be changed; changing it signs every session out', async () => {
  const s = load(true);
  assert.strictEqual(await s.handlers.reportShortPasswordLogin.call(as('alice')), true);
  assert.deepStrictEqual(plain(await s.handlers.getPasswordChangeRequirement.call(as('alice'))), { required: true, minLength: 12 });
  await s.handlers.changePassword.call(as('alice'), {}, {});
  assert.deepStrictEqual(plain(await s.handlers.getPasswordChangeRequirement.call(as('alice'))), { required: false, minLength: 12 });
  assert.deepStrictEqual(plain(s.users.alice.services.resume.loginTokens), [], 'this session and every other');
  assert.deepStrictEqual(plain(s.reports), ['alice']);
  assert.deepStrictEqual(plain(s.fixed), ['alice'], 'the report is fixed');
});

test('not enforced (the default), a short password is reported but nobody is asked to change', async () => {
  const s = load(false);
  assert.strictEqual(await s.handlers.reportShortPasswordLogin.call(as('alice')), false);
  assert.deepStrictEqual(plain(s.reports), ['alice'], 'still listed for the administrator');
  assert.strictEqual(s.users.alice.passwordChangeRequired, undefined);
  assert.strictEqual((await s.handlers.getPasswordChangeRequirement.call(as('alice'))).required, false);
});

test('ANY change of one\'s own password signs every session out, with or without a minimum', async () => {
  for (const min of [false, true]) {
    const s = load(min);
    await s.handlers.changePassword.call(as('alice'), {}, {});
    assert.deepStrictEqual(plain(s.users.alice.services.resume.loginTokens), [], `changePassword, min ${min}`);
    const r = load(min);
    const result = await r.handlers.resetPassword.call(as(null), 'token', {});
    assert.deepStrictEqual(plain(result), { id: 'alice', token: 't' }, 'the answer is unchanged');
    assert.deepStrictEqual(plain(r.users.alice.services.resume.loginTokens), [], `resetPassword, min ${min}`);
  }
});

test('an administrator\'s Set password ends the requirement too', async () => {
  const s = load(true);
  await s.handlers.reportShortPasswordLogin.call(as('alice'));
  await s.exports.endPasswordChangeRequirement('alice', { signOut: false });
  assert.strictEqual(s.users.alice.passwordChangeRequired, undefined);
  assert.deepStrictEqual(plain(s.fixed), ['alice']);
  // A short password from the administrator does not fix a short password.
  const short = load(true);
  await short.exports.endPasswordChangeRequirement('alice', { signOut: false, fixed: false });
  assert.deepStrictEqual(plain(short.fixed), []);
  const users = read('server/models/users.js');
  const setPassword = users.slice(users.indexOf('async setPassword(newPassword, userId)'));
  assert.match(setPassword.slice(0, 2800), /await endPasswordChangeRequirement\(userId, \{\n\s+signOut: false, fixed: !isTooShort\(newPassword, currentPasswordPolicy\(\)\),/);
});

test('negative: a provider\'s account is never reported nor asked; nobody signed in is refused', async () => {
  const off = load(false);
  const on = load(true);
  assert.strictEqual(await on.handlers.reportShortPasswordLogin.call(as('ldap')), false, 'LDAP');
  assert.strictEqual(on.users.ldap.passwordChangeRequired, undefined);
  assert.deepStrictEqual(plain(on.reports), [], 'its password is the directory\'s');
  await assert.rejects(() => on.handlers.reportShortPasswordLogin.call(as(null)), e => e.error === 'not-authorized');
  // A flag left from when a minimum was on asks nothing once it is off.
  off.users.alice.passwordChangeRequired = true;
  assert.strictEqual((await off.handlers.getPasswordChangeRequirement.call(as('alice'))).required, false);
});

test('negative: a failed change signs nobody out and ends nothing', async () => {
  const s = load(true, { changeFails: true });
  await s.handlers.reportShortPasswordLogin.call(as('alice'));
  await assert.rejects(() => s.handlers.changePassword.call(as('alice'), {}, {}), /Incorrect password/);
  assert.strictEqual(s.users.alice.services.resume.loginTokens.length, 2);
  assert.strictEqual(s.users.alice.passwordChangeRequired, true);
  assert.deepStrictEqual(plain(s.fixed), []);
});

test('negative: the original method runs at once, before anything is awaited (audit-argument-checks)', () => {
  const s = load(true);
  const returned = s.handlers.changePassword.call(as('alice'), {}, {});
  assert.deepStrictEqual(s.calls, ['changePassword'], 'called synchronously');
  return returned;
});

test('the browser notes only the length, sends none, and admin Set password skips provider accounts', () => {
  const accounts = read('config/accounts.js');
  assert.match(accounts, /signInPasswordLength = \[\.\.\.field\.value\]\.length/);
  assert.match(accounts, /Meteor\.call\('reportShortPasswordLogin', \(\) =>/, 'no argument: no length leaves the browser');
  assert.match(accounts, /if \(!passwordPolicy\.enforce\) return;/, 'the fields keep their own 6 unless enforced');
  assert.match(accounts, /state === 'changePwd'\) \{\n[^]*?Meteor\.logout\(\(\) => FlowRouter\.go\('atSignIn'\)\)/);
  const users = read('server/models/users.js');
  assert.match(users, /if \(\(target\?\.authenticationMethod \|\| 'password'\) === 'password'\) \{\n\s+await assertNewPassword/);
  assert.match(read('server/imports.js'), /import '\/server\/passwordChangeRequired';/);
  assert.match(read('client/features/users.js'), /passwordChangeRequired\.js/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.match(en['password-change-required-text'], /__min__/);
  assert.match(read('client/components/users/passwordChangeRequired.jade'), /\{\{_ 'password-change-required-text' min=min\}\}/);
  assert.strictEqual(policy.DEFAULT_MIN_LENGTH, 8);
});

(async () => {
  for (const run of pending) await run();
  console.log(`passwordChangeRequired: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
