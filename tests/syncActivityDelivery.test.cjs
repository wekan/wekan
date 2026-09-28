'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deliverSyncActivity: deliver } = require('../server/lib/syncActivityDelivery');
const { planId: notificationId } = require('../server/lib/syncNotificationPlan');
const { planId: webhookId } = require('../server/lib/syncWebhookPlan');
function fixture() {
  const calls = [], policy = { activities: true, notifications: true };
  const activity = { _id: 'event', boardId: 'board', cardId: 'card', listId: 'list', userId: 'actor', createdAt: new Date(1) };
  const input = { effectId: 'a'.repeat(64), activity, policy, assertCurrent: async () => {}, readPolicy: async () => policy,
    rules: async context => { calls.push('rules'); return context.effectId; },
    notifications: async context => { calls.push('notifications'); return notificationId(context.activity._id); },
    webhooks: async context => { calls.push('webhooks'); return webhookId(context.activity._id); } };
  return { input, calls, policy };
}
test('delivery acknowledges all ordered stages and isolates captured inputs from adapters', async () => {
  const f = fixture(), original = structuredClone(f.input.activity);
  f.input.rules = async context => {
    f.calls.push('rules'); context.activity._id = 'changed'; context.policy.notifications = false;
    return context.effectId;
  };
  assert.equal(await deliver(f.input), f.input.effectId);
  assert.deepEqual(f.calls, ['rules', 'notifications', 'webhooks']);
  assert.deepEqual(f.input.activity, original);
  assert.equal(f.policy.notifications, true);
});
test('missing adapters and invalid identities are refused before any effect', async () => {
  const incomplete = fixture(); delete incomplete.input.activity.listId;
  await assert.rejects(deliver(incomplete.input), /delivery-invalid/);
  assert.deepEqual(incomplete.calls, []);
  for (const missing of ['rules', 'notifications', 'webhooks', 'assertCurrent', 'readPolicy']) {
    const f = fixture(); delete f.input[missing];
    await assert.rejects(deliver(f.input)); assert.deepEqual(f.calls, []);
  }
  for (const invalid of [{ effectId: 'wrong' }, { activity: {} }, { policy: { activities: false, notifications: true } }]) {
    const f = fixture(); await assert.rejects(deliver({ ...f.input, ...invalid })); assert.deepEqual(f.calls, []);
  }
});
test('each missing or wrong receipt prevents later stages and overall completion', async () => {
  const stages = ['rules', 'notifications', 'webhooks'];
  for (let index = 0; index < stages.length; index++) for (const result of [undefined, true, 'other']) {
    const f = fixture(); f.input[stages[index]] = async () => { f.calls.push(stages[index]); return result; };
    await assert.rejects(deliver(f.input), /delivery-unconfirmed/);
    assert.deepEqual(f.calls, stages.slice(0, index + 1));
  }
});
test('policy changes and lost ownership between effects stop the next stage', async () => {
  const f = fixture();
  f.input.rules = async context => { f.calls.push('rules'); f.policy.notifications = false; return context.effectId; };
  await assert.rejects(deliver(f.input), /policy-changed/);
  assert.deepEqual(f.calls, ['rules']);
  const g = fixture(); let revoked = false;
  g.input.assertCurrent = async () => { if (revoked) throw new Error('lease lost'); };
  g.input.notifications = async context => { g.calls.push('notifications'); revoked = true; return notificationId(context.activity._id); };
  await assert.rejects(deliver(g.input), /lease lost/);
  assert.deepEqual(g.calls, ['rules', 'notifications']);
});
test('disabled notifications still require rules and never call outbound adapters', async () => {
  const f = fixture(); f.policy.notifications = false;
  delete f.input.notifications; delete f.input.webhooks;
  assert.equal(await deliver(f.input), f.input.effectId);
  assert.deepEqual(f.calls, ['rules']);
  delete f.input.rules;
  await assert.rejects(deliver(f.input), /adapter-required/);
});
test('an interrupted later stage replays through durable adapters instead of assuming earlier completion', async () => {
  const f = fixture(), receipts = new Set(); let writes = 0, attempts = 0;
  f.input.rules = async ({ effectId }) => { if (!receipts.has(effectId)) { receipts.add(effectId); writes++; } return effectId; };
  f.input.webhooks = async ({ activity }) => { if (++attempts === 1) throw new Error('interrupted'); return webhookId(activity._id); };
  await assert.rejects(deliver(f.input), /interrupted/);
  assert.equal(await deliver(f.input), f.input.effectId);
  assert.equal(writes, 1);
  assert.equal(attempts, 2);
  assert.deepEqual(f.calls, ['notifications', 'notifications']);
});
test('production binding supplies stored notification/webhook adapters and live flags, never ordinary rules', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  let args;
  const notifications = () => {}, webhooks = () => {}, rules = () => {}, storedRules = () => {};
  const context = { getFeatureFlags: () => ({ disableActivities: false, disableNotifications: true }),
    runStoredSyncNotifications: notifications, runStoredSyncWebhooks: webhooks, runStoredSyncRules: storedRules,
    require: id => id.endsWith('syncActivityDelivery') ? { deliverSyncActivity: input => { args = input; return 'receipt'; } } : require('../server/lib/syncEffectPolicy') };
  vm.runInNewContext(fs.readFileSync(require.resolve('../server/notifications/storedActivityDelivery'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function ', 'function '), context);
  assert.equal(context.runStoredSyncActivityDelivery({ effectId: 'id', activity: {}, policy: {}, assertCurrent() {}, rules }), 'receipt');
  assert.equal(args.rules, rules); assert.equal(args.notifications, notifications); assert.equal(args.webhooks, webhooks);
  assert.deepEqual(await args.readPolicy(), { activities: true, notifications: false });
  context.runStoredSyncActivityDelivery({ effectId: 'id', activity: {}, policy: {}, assertCurrent() {} });
  assert.equal(args.rules, storedRules, 'default delivery uses durable stored rules');
});
