'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const decisions = require('../packages/wekan-accounts-lockout/src/loginFailureDecision');
const scope = require('../packages/wekan-accounts-lockout/src/lockoutScope');
const { decideKnownUserAttempt } = require('../packages/wekan-accounts-lockout/src/lockoutDecision');
const settings = { failuresBeforeLockout: 3, failureWindow: 60, lockoutPeriod: 60, loginDelayBase: 0 };
for (const kind of ['knownUser', 'unknownUser']) {
  function harness(failures) {
    const source = fs.readFileSync(path.join(__dirname, '../packages/wekan-accounts-lockout/src', `${kind}.js`), 'utf8');
    const start = source.indexOf('  async validateLoginAttempt(loginInfo) {');
    const body = source.slice(start, source.indexOf('\n  }', start) + 4).replace('async validateLoginAttempt', 'async function');
    let writes = 0;
    const reject = () => { throw Error('locked'); };
    const known = { incorrectPassword: () => { throw Error('wrong password'); }, tooManyAttempts: reject, tooSoon: reject, clearLockout: async () => {}, unlockAddress() {} };
    const unknown = { userNotFound: () => { throw Error('unknown user'); }, tooManyAttempts: reject };
    const fn = vm.runInNewContext(`(${body})`, { ...decisions, ...scope, decideKnownUserAttempt, process,
      KnownUser: known, UnknownUser: unknown, Meteor: { users: { updateAsync: async () => { writes++; } }, setTimeout() {} } });
    const receiver = { settings, failedAttempts: async () => failures, firstFailedAttempt: async () => Date.now(), unlockTime: async () => 0,
      resetAttempts: async () => { writes++; }, incrementAttempts: async () => { writes++; }, setNewUnlockTime: async () => { writes++; } };
    const address = '192.0.2.10';
    const user = kind === 'knownUser' ? { _id: 'alice', services: { 'accounts-lockout': { byAddress: { [scope.scopeKeyFor(address)]: { failedAttempts: failures, firstFailedAttempt: Date.now(), lastFailedAttempt: Date.now() } } } } } : undefined;
    return { run: error => fn.call(receiver, { type: 'password', user, error, allowed: false, connection: { clientAddress: address } }), writes: () => writes };
  }
  test(`${kind}: a wrong TOTP is counted and retains its retry error`, async () => {
    const h = harness(0), error = { error: 'invalid-2fa-code' };
    await assert.rejects(h.run(error), value => value === error);
    assert.equal(h.writes(), 1);
  });
  test(`${kind}: repeated wrong TOTPs still lock out`, async () => {
    const h = harness(2);
    await assert.rejects(h.run({ error: 'invalid-2fa-code' }), /locked/);
    assert.equal(h.writes(), 1);
  });
}
