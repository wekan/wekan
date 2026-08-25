'use strict';

// SignupBleed — POST /users/register ignored "registration disabled".
// Run: node tests/restRegisterRespectsSetting.test.cjs
//
// Found while reviewing PR #6598 (AhmedLukman), which changed this guard to read
// WeKan's own setting. The PR was filed against #4774, a 403 nobody could
// reproduce; what it actually uncovered is the opposite fault, and a worse one.
//
// The guard asked `Accounts._options.forbidClientAccountCreation`, and NOTHING
// IN WEKAN EVER SETS THAT:
//
//   * the only `Accounts.config()` call, in server/accounts-common.js, sets
//     loginExpirationInDays and nothing else;
//   * `forbidClientAccountCreation: disableRegistration` in config/accounts.js
//     is passed to `AccountsTemplates.configure()` - the useraccounts package's
//     own options object, not Meteor's `Accounts`;
//   * and that `disableRegistration` is only assigned inside an async
//     `Meteor.call('isDisableRegistration', …)` callback which fires AFTER
//     configure() has run, as the file's own comment records.
//
// So the condition was always falsy and the endpoint never refused anybody.
// Turning registration off in the Admin Panel hid the sign-up form and left
// POST /users/register creating accounts for anyone who asked.
//
// These are source guards: they pin the shape of the fix. The behaviour needs a
// running server, and the two facts that make the bug possible - which object
// Accounts.config() writes to, and when the callback fires - are exactly what a
// regression would quietly restore.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const routes = read('server/apiAuthRoutes.js');
const accountsCommon = read('server/accounts-common.js');
const accountsConfig = read('config/accounts.js');
const categories = read('models/lib/securityCategories.js');

// The POST /users/register handler, from its route line to the next route.
const registerHandler = (() => {
  const start = routes.indexOf("WebApp.handlers.post('/users/register'");
  assert.ok(start !== -1, 'POST /users/register handler not found');
  const next = routes.indexOf('WebApp.handlers.', start + 10);
  return routes.slice(start, next === -1 ? routes.length : next);
})();

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the guard reads WeKan\'s own setting, not a Meteor option', () => {
  assert.ok(/ReactiveCache\.getCurrentSetting\(\)/.test(registerHandler),
    'it asks ReactiveCache for the current Settings document');
  assert.ok(/disableRegistration\s*===\s*true/.test(registerHandler),
    'and refuses on disableRegistration === true, as isDisableRegistration() does');
  assert.ok(/await\s+ReactiveCache\.getCurrentSetting/.test(registerHandler),
    'awaited - the server implementation is async and returns a promise');
});

test('the Meteor option it used to read is gone from this route (negative)', () => {
  // The CODE, not the comment above it that records why the old guard was dead.
  const code = registerHandler.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/forbidClientAccountCreation/.test(code),
    'Accounts._options.forbidClientAccountCreation is never consulted here again');
});

test('and that option really is never set, which is why the guard was dead', () => {
  // If a later change ever DOES set it through Accounts.config(), this test
  // fails and whoever made it can decide which source of truth wins - rather
  // than leaving two that disagree, which is what caused this.
  const configCall = /Accounts\.config\(\{([\s\S]*?)\}\)/.exec(accountsCommon);
  assert.ok(configCall, 'server/accounts-common.js calls Accounts.config()');
  assert.ok(!/forbidClientAccountCreation/.test(configCall[1]),
    'Accounts.config() does not set forbidClientAccountCreation');
  // config/accounts.js passes it to the useraccounts package instead.
  assert.ok(/AccountsTemplates\.configure\(/.test(accountsConfig),
    'config/accounts.js configures AccountsTemplates');
  assert.ok(/forbidClientAccountCreation:\s*disableRegistration/.test(accountsConfig),
    'and that is the only place the name appears - a different options object');
});

test('the setting is read from the same place the Meteor method reads it', () => {
  // server/models/settings.js: isDisableRegistration() is
  // `(await getCurrentSetting()).disableRegistration === true`. The route must
  // not invent a second interpretation of the same switch.
  const settings = read('server/models/settings.js');
  const method = /async isDisableRegistration\(\)\s*\{([\s\S]*?)\n  \}/.exec(settings);
  assert.ok(method, 'isDisableRegistration() exists');
  assert.ok(/getCurrentSetting\(\)/.test(method[1]) && /disableRegistration === true/.test(method[1]),
    'and reads the same field of the same document');
});

test('a refused registration is recorded, so it shows in Admin Panel / Problems', () => {
  assert.ok(/securityLog'\)\.record\(\{/.test(registerHandler),
    'the refusal is logged');
  assert.ok(/key: 'authz\.register'/.test(registerHandler),
    'under the catalog key for this guard');
  assert.ok(/action: 'blocked'/.test(registerHandler),
    'as a block, not a detection');
  assert.ok(/catch \(e\) \{\s*\/\* logging must never break the guard \*\/\s*\}/.test(registerHandler),
    'and logging can never break the refusal itself');
});

test('the catalog names it, so the log and the hall of fame cannot drift', () => {
  assert.ok(/'authz\.register':\s*\{[^}]*bleed: 'SignupBleed'/.test(categories),
    'authz.register resolves to SignupBleed');
  assert.ok(/'authz\.register':\s*\{[^}]*severity: 'critical'/.test(categories),
    'at critical severity - it created accounts on a closed instance');
  assert.ok(/'authz\.register':\s*\{[^}]*cwe: 'CWE-862'/.test(categories),
    'CWE-862, missing authorization');
});

test('the module is required once at the top, not per request (negative)', () => {
  const top = routes.slice(0, routes.indexOf('const NonEmptyString'));
  assert.ok(/const \{ ReactiveCache \} = require\('\/imports\/reactiveCache'\);/.test(top),
    'ReactiveCache is required with the rest of the module imports');
  assert.ok(!/require\('\/imports\/reactiveCache'\)/.test(registerHandler),
    'and not inside the handler, where every request would re-resolve it');
});

test('registration that is ENABLED still goes through (negative)', () => {
  // The refusal must be the only thing the guard adds: an enabled instance
  // still creates the user and answers with a login token.
  assert.ok(/Accounts\.createUserAsync\(userOptions\)/.test(registerHandler),
    'the user is still created when registration is on');
  assert.ok(/_generateStampedLoginToken|_insertLoginToken/.test(registerHandler),
    'and still answered with a login token');
  // Exactly one refusal path, so an enabled instance cannot fall into it.
  assert.strictEqual((registerHandler.match(/code: 403/g) || []).length, 1,
    'one 403, and it is the disabled-registration one');
});

test('a missing Settings document does not refuse everybody (negative)', () => {
  // A fresh instance with no Settings doc must not become unregisterable:
  // `setting?.disableRegistration === true` is false for undefined, which is
  // the same answer the sign-up form gets.
  assert.ok(/setting\?\.disableRegistration/.test(registerHandler),
    'optional chaining, so no Settings document means registration is allowed');
});

console.log(`\nrestRegisterRespectsSetting: ${passed} tests passed`);
