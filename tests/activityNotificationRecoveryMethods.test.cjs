'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
function fixture(scenario, failure) {
  let methods, reads = 0, writes = 0, checks = 0;
  const rules = [], collection = { rawCollection: () => ({}) };
  const context = {
    Meteor: { methods: value => { methods = value; }, users: {
      findOneAsync: async () => ({ isAdmin: scenario === 'admin' || scenario === 'disabled' || scenario === 'revoked' && ++checks === 1,
        loginDisabled: scenario === 'disabled' }),
    }, Error: class extends Error { constructor(code) { super(code); this.error = code; } } },
    check() {}, DDPRateLimiter: { addRule: (...args) => rules.push(args) },
    Activities: collection, ActivityNotificationIntents: collection, ActivityNotificationPlans: collection, ActivityNotificationLeases: collection, ActivityNotificationControls: collection,
    require: () => ({ cancelActivityNotification: async options => { await options.assertAdmin(); if (failure) throw failure; writes++; return { revision: 1, paused: true, cancelled: true }; }, controlActivityNotification: async options => { await options.assertAdmin(); if (failure) throw failure; writes++; return { revision: 1, paused: true }; }, activityNotificationReport: async () => { reads++; if (failure) throw failure; return { rows: [], total: 0 }; } }),
    cleanupCancelledActivityNotifications: async (id, guard) => { await guard(); },
    resumeActivityNotifications: async (id, options) => { await options.assertAllowed(); if (failure) throw failure; writes++; return 'completed'; },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../server/methods/activityNotificationRecovery.js'), 'utf8').replace(/^import .*;\n/gm, ''), context);
  return { methods, rules, count: () => ({ reads, writes }) };
}
test('activity report requires an enabled administrator before and after reading', async () => {
  for (const scenario of ['admin', 'ordinary', 'anonymous', 'disabled', 'revoked']) {
    const f = fixture(scenario), ctx = { userId: scenario === 'anonymous' ? null : 'user' };
    const call = () => f.methods.activityNotificationRecoveryReport.call(ctx, { search: '', page: 1 });
    if (scenario === 'admin') assert.equal((await call()).total, 0);
    else await assert.rejects(call(), /not-authorized/);
    assert.equal(f.count().reads, ['admin', 'revoked'].includes(scenario) ? 1 : 0);
  }
});
test('manual retry rechecks administrator access inside its reservation', async () => {
  for (const scenario of ['admin', 'ordinary', 'anonymous', 'disabled', 'revoked']) {
    const f = fixture(scenario), ctx = { userId: scenario === 'anonymous' ? null : 'user' };
    const call = () => f.methods.retryActivityNotification.call(ctx, { intentId: 'a'.repeat(64) });
    if (scenario === 'admin') assert.equal((await call()).status, 'completed');
    else await assert.rejects(call(), /not-authorized/);
    assert.equal(f.count().writes, scenario === 'admin' ? 1 : 0);
    assert.deepEqual(f.rules.map(rule => rule[0].name), ['activityNotificationRecoveryReport', 'retryActivityNotification', 'controlActivityNotificationRecovery', 'cancelActivityNotificationRecovery']);
    for (const rule of f.rules) assert.deepEqual(rule.slice(1), [30, 10000]);
  }
});
test('invalid identities never enter delivery and private errors never reach clients', async () => {
  const f = fixture('admin'), ctx = { userId: 'admin' };
  for (const intentId of ['', 'a'.repeat(63), 'A'.repeat(64), 'a'.repeat(65)]) {
    await assert.rejects(f.methods.retryActivityNotification.call(ctx, { intentId }), /invalid-request/);
  }
  assert.equal(f.count().writes, 0);
  for (const [failure, expected] of [
    [Object.assign(new Error('PRIVATE'), { code: 'sync-busy' }), 'busy'],
    [Object.assign(new Error('PRIVATE'), { code: 'sync-lease-lost' }), 'busy'],
    [new Error('activity-notification-recipient-denied'), 'denied'],
    [new Error('activity-notification-preference-changed'), 'denied'],
    [new Error('activity-notification-activity-unconfirmed'), 'source-unavailable'],
    [new Error('activity-notifications-disabled'), 'disabled'],
    [new Error('PRIVATE MAILBOX AND CONTENT'), 'failed'],
  ]) {
    const broken = fixture('admin', failure);
    await assert.rejects(broken.methods.retryActivityNotification.call(ctx, { intentId: 'a'.repeat(64) }),
      error => error.error === `activity-recovery-${expected}` && !error.message.includes('PRIVATE'));
    await assert.rejects(broken.methods.activityNotificationRecoveryReport.call(ctx, { search: '', page: 1 }),
      error => error.error === 'activity-recovery-unavailable');
  }
});
test('the server entry graph registers both recovery methods', () => {
  assert.match(fs.readFileSync(require.resolve('../server/imports.js'), 'utf8'), /import '\/server\/methods\/activityNotificationRecovery';/);
});

test('pause/resume requires current enabled admin access and hides internal errors', async () => {
  const request = { intentId: 'a'.repeat(64), paused: true, expectedRevision: 0, requestId: 'a'.repeat(32) };
  for (const scenario of ['admin', 'ordinary', 'anonymous', 'disabled', 'revoked']) {
    const f = fixture(scenario);
    const call = () => f.methods.controlActivityNotificationRecovery.call({ userId: scenario === 'anonymous' ? null : 'admin' }, request);
    if (scenario === 'admin') assert.equal((await call()).paused, true);
    else await assert.rejects(call(), /not-authorized/);
    assert.equal(f.count().writes, scenario === 'admin' ? 1 : 0);
  }
  for (const [message, expected] of [['activity-notification-control-conflict', 'conflict'],
    ['activity-notification-control-not-pending', 'conflict'], ['PRIVATE DATA', 'failed']]) {
    const f = fixture('admin', new Error(message));
    await assert.rejects(f.methods.controlActivityNotificationRecovery.call({ userId: 'admin' }, request),
      error => error.error === `activity-recovery-control-${expected}`);
  }
});

test('cancellation requires current admin access and returns only safe failures', async () => {
  const request = { intentId: 'a'.repeat(64), expectedRevision: 0, requestId: 'a'.repeat(32) };
  for (const scenario of ['admin', 'ordinary', 'anonymous', 'disabled', 'revoked']) {
    const f = fixture(scenario);
    const call = () => f.methods.cancelActivityNotificationRecovery.call({ userId: scenario === 'anonymous' ? null : 'admin' }, request);
    if (scenario === 'admin') assert.equal((await call()).cancelled, true);
    else await assert.rejects(call(), /not-authorized/);
    assert.equal(f.count().writes, scenario === 'admin' ? 1 : 0);
  }
  for (const [message, expected] of [['activity-notification-control-conflict', 'conflict'],
    ['activity-notification-cancelled', 'conflict'], ['PRIVATE BODY', 'failed']]) {
    const f = fixture('admin', new Error(message));
    await assert.rejects(f.methods.cancelActivityNotificationRecovery.call({ userId: 'admin' }, request),
      error => error.error === `activity-recovery-control-${expected}`);
  }
});
