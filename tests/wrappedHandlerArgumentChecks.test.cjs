'use strict';

// A wrapper of Meteor's method and publication handlers must not break
// audit-argument-checks (server/lib/argumentChecks.js). The REQUIRE_2FA
// wrapper awaited before it called the handler, so the audit - which asks
// synchronously, the moment the handler returns - ran before the handler's own
// check(): sign-up answered "Internal server error" (and created the account
// anyway), and starredPublicBoards and translation failed for everybody.
//
//  - test: through server/requireTwoFactor.js and server/adminAudit.js, a
//    handler that checks its arguments passes the audit, with REQUIRE_2FA off
//    and on, for methods and publications, and a refusal is still a refusal;
//  - negative: a handler that does NOT check its arguments still fails the
//    audit through every wrapper path - the hand-over does not switch it off;
//  - negative: no wrapper anywhere in server/ awaits before it has checked or
//    handed the audit over.
//
// The audit is modelled on the check package's match.js: an ArgumentChecker
// per call, held in async-local storage as Meteor 3 does, asked synchronously
// as soon as the handler returns.
// Run: node --test tests/wrappedHandlerArgumentChecks.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { AsyncLocalStorage } = require('node:async_hooks');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// --- the check package, as far as the audit goes -------------------------
const current = new AsyncLocalStorage();
class ArgumentChecker {
  constructor(args, description) { this.args = [...args].reverse(); this.description = description; }
  checking(value) {
    const i = this.args.findIndex(a => a === value);
    if (i > -1) this.args.splice(i, 1);
  }
  throwUnlessAllArgumentsHaveBeenChecked() {
    if (this.args.length > 0) throw new Error(`Did not check() all arguments during ${this.description}`);
  }
}
const Match = {
  Any: ['__any__'],
  _failIfArgumentsAreNotAllChecked(f, context, args, description) {
    const checker = new ArgumentChecker(args, description);
    const result = current.run(checker, () => f.apply(context, args));
    checker.throwUnlessAllArgumentsHaveBeenChecked();
    return result;
  },
};
function check(value) {
  const checker = current.getStore();
  if (checker) checker.checking(value);
}
// What ddp-server's maybeAuditArgumentChecks does with audit-argument-checks.
const ddpCall = (handler, context, args, description) =>
  Match._failIfArgumentsAreNotAllChecked(handler, context, args, description);
// A sync throw and a rejection reach the client alike.
const outcome = fn => { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } };

const Package = { 'audit-argument-checks': {} };
const argumentChecks = (() => {
  const ctx = { check, Match, Package, module: { exports: {} } };
  vm.runInNewContext(read('server/lib/argumentChecks.js').replace(/^import .*;\n/gm, '')
    .replace(/^export function /gm, 'function ')
    + '\nmodule.exports = { deferArgumentAudit, applyAudited };\n', ctx);
  return ctx.module.exports;
})();

const MeteorError = class extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; }
};

// Handlers like the real ones: useraccounts' ATCreateUserServer checks first
// and then awaits; a careless handler forgets.
const careful = async function ATCreateUserServer(options) { check(options); await null; return 'created'; };
const careless = async function careless() { await null; return 'unchecked'; };
const carefulPub = function translation(lang) { check(lang); return 'cursor'; };

const req2fa = require('../models/lib/twoFactorRequirement');
const PASSWORD = { bcrypt: 'x' };
const OTP = { secret: 's', type: 'otp' };
const users = {
  alice: { _id: 'alice', services: { password: PASSWORD } },
  bob: { _id: 'bob', services: { password: PASSWORD, twoFactorAuthentication: OTP } },
  admin: { _id: 'admin', username: 'root', isAdmin: true },
};

function load2fa(mode) {
  const methods = { ATCreateUserServer: careful, careless, disableUser2fa: careful };
  const publications = { translation: carefulPub };
  const Meteor = {
    Error: MeteorError, methods(defs) { Object.assign(methods, defs); },
    startup(fn) { fn(); }, defer(fn) { fn(); },
    server: { method_handlers: methods, publish_handlers: publications },
    users: { findOneAsync: async id => users[id] || null },
  };
  const ctx = {
    Meteor, Symbol, Date, Object,
    authEnv: name => (name === 'REQUIRE_2FA' ? mode : undefined),
    ...argumentChecks,
    require: p => (p === '/models/lib/twoFactorRequirement' ? req2fa : require(p)),
    module: { exports: {} },
  };
  vm.runInNewContext(read('server/requireTwoFactor.js').replace(/^import .*;\n/gm, '')
    .replace(/^export \{[^}]*\};?\n?/m, ''), ctx);
  return { methods, publications };
}

function loadAdminAudit(setPassword = careful) {
  const methods = { setPassword };
  const Meteor = {
    Error: MeteorError, methods(defs) { Object.assign(methods, defs); },
    startup() {}, defer() {}, setInterval() {},
    server: { method_handlers: methods },
    users: { findOneAsync: async id => users[id] || null },
  };
  const ctx = {
    Meteor, Symbol, Object, Date, console: { error() {} }, process: { env: {} },
    Mongo: { Collection: function Collection() { return { insertAsync: async () => {} }; } },
    check, Match, ensureIndex: async () => {}, ...argumentChecks,
    require: p => {
      if (p === '/models/lib/adminAudit') return require('../models/lib/adminAudit');
      if (p === '/server/lib/loginAttemptThrottle') return { resolveClientKey: () => 'ip' };
      return require(p);
    },
    module: { exports: {} },
  };
  vm.runInNewContext(read('server/adminAudit.js').replace(/^import .*;\n/gm, '')
    .replace(/^export const /gm, 'const ').replace(/^export function /gm, 'function ')
    + '\nmodule.exports = { wrapAuditedMethods };\n', ctx);
  ctx.module.exports.wrapAuditedMethods();
  return { methods };
}

const conn = userId => ({ userId, connection: {}, ready() { this.wasReady = true; } });

test('sign-up passes the audit through the 2FA wrapper, off and on', async () => {
  for (const mode of ['off', 'all']) {
    const { methods } = load2fa(mode);
    const result = await outcome(() =>
      ddpCall(methods.ATCreateUserServer, conn(null), [{ username: 'u' }], "call to 'ATCreateUserServer'"));
    assert.equal(result, 'created', mode);
  }
});

test('a signed-in call that needs the lookup passes the audit, and a refusal stays a refusal', async () => {
  const { methods, publications } = load2fa('all');
  assert.equal(await outcome(() => ddpCall(methods.ATCreateUserServer, conn('bob'), [{}], "call to 'x'")), 'created');
  await assert.rejects(outcome(() => ddpCall(methods.ATCreateUserServer, conn('alice'), [{}], "call to 'x'")),
    e => e.error === 'two-factor-required');
  assert.equal(await outcome(() => ddpCall(publications.translation, conn('bob'), ['fi'], "publisher 'translation'")), 'cursor');
  const sub = conn('alice');
  assert.equal(await outcome(() => ddpCall(publications.translation, sub, ['fi'], "publisher 'translation'")), undefined);
  assert.equal(sub.wasReady, true);
  await assert.rejects(outcome(() => ddpCall(methods.disableUser2fa, conn('bob'), [{}], "call to 'disableUser2fa'")),
    e => e.error === 'two-factor-required');
});

test('an administrator\'s audited method passes the audit', async () => {
  const { methods } = loadAdminAudit();
  assert.equal(await outcome(() => ddpCall(methods.setPassword, conn('admin'), [{}], "call to 'setPassword'")), 'created');
  assert.equal(await outcome(() => ddpCall(methods.setPassword, conn(null), [{}], "call to 'setPassword'")), 'created');
});

test('negative: a handler that does not check its arguments still fails the audit, on every path', async () => {
  const unchecked = e => /Did not check\(\) all arguments during call to 'careless'/.test(e.message);
  for (const [mode, who] of [['off', 'bob'], ['all', 'bob'], ['all', null]]) {
    const { methods } = load2fa(mode);
    await assert.rejects(outcome(() => ddpCall(methods.careless, conn(who), [{}], "call to 'careless'")), unchecked, `${mode} ${who}`);
  }
  // setPassword is an audited method, so this goes through the adminAudit wrapper.
  const { methods } = loadAdminAudit(careless);
  assert.notEqual(methods.setPassword, careless, 'wrapped');
  await assert.rejects(outcome(() => ddpCall(methods.setPassword, conn('admin'), [{}], "call to 'setPassword'")),
    e => /Did not check\(\) all arguments during call to 'setPassword'/.test(e.message));
});

test('negative: no handler wrapper in server/ awaits before it checks or hands the audit over', () => {
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'tests') walk(full); } else if (e.name.endsWith('.js')) files.push(full);
    }
  })(path.join(root, 'server'));
  // An async function stored into a handler registry: methods[name] = async ...,
  // handlers.requestLoginTokenForUser = async ..., publications[name] = async ...
  const wrapper = /\b(?:methods|publications|handlers|registry|method_handlers|publish_handlers)(?:\[[^\]]+\]|\.\w+)\s*=\s*async\b/g;
  const offenders = [];
  let seen = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(wrapper)) {
      seen++;
      const body = src.slice(m.index);
      const firstAwait = body.search(/\bawait\b/);
      const before = firstAwait === -1 ? body : body.slice(0, firstAwait);
      if (firstAwait !== -1 && !/\bcheck\(|deferArgumentAudit\(/.test(before)) {
        offenders.push(`${path.relative(root, file)}:${src.slice(0, m.index).split('\n').length}`);
      }
    }
  }
  assert.ok(seen >= 1, 'the scan found no async wrappers at all; it is not looking');
  assert.deepEqual(offenders, []);
});
