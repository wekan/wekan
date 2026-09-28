'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareWebhookPlan, validateWebhookPlan, deliverWebhookPlan } = require('../server/lib/syncWebhookPlan');
const activity = { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor' };
const integration = { _id: 'hook', boardId: 'board', enabled: true, url: 'https://example.test/hook' };
const request = () => ({ url: integration.url, headers: { 'Content-Type': 'application/json' },
  body: '{"value":0}', is2way: false, language: 'fi' });
const build = (extra = {}) => prepareWebhookPlan({ activity, integrations: [integration], prepare: async () => request(), ...extra });
test('captures all integrations before awaits and freezes request content after preparation', async () => {
  const integrations = [structuredClone(integration), { ...integration, _id: 'two', boardId: '_global' }];
  const data = request(), original = structuredClone(activity);
  const plan = await build({ activity: original, integrations, prepare: async selected => {
    integrations[1].url = 'https://changed.test'; original.cardId = 'wrong';
    assert.equal(selected.url, integration.url); return data;
  } });
  data.body = '{}'; assert.equal(plan.targets[0].request.body, '{"value":0}');
  assert.equal(plan.cardId, 'card'); assert.equal(plan.targets[1].integrationBoardId, '_global');
  assert.equal(validateWebhookPlan(plan, activity), true);
});
test('rejects foreign/duplicate/disabled or oversized selections, malformed wire data and changed source', async () => {
  for (const integrations of [[integration, integration], [{ ...integration, boardId: 'foreign' }],
    [{ ...integration, enabled: false }], Array(10001).fill(integration)]) {
    await assert.rejects(build({ integrations, prepare: async () => assert.fail('must reject before preparation') }), /plan-invalid/);
  }
  for (const altered of [{ ...request(), url: 'https://foreign.test' },
    { ...request(), is2way: true }, { ...request(), headers: { 'Content-Type': 'application/json', 'X-Wekan-Token': 'wrong' } }]) {
    await assert.rejects(build({ prepare: async () => altered }), /plan-invalid/);
  }
  const plan = await build();
  for (const change of [p => p.targets.push(p.targets[0]), p => { p.targets[0].integrationHash = 'bad'; },
    p => { p.targets[0].request.headers.extra = 'value'; }, p => { p.targets[0].request.headers['X-Wekan-Token'] = 'bad\r\nvalue'; },
    p => { p.targets[0].request.body = 'not JSON'; }, p => { p.targets[0].request.url = 'file:///local'; },
    p => { p.targets[0].request.body = JSON.stringify({ huge: 'x'.repeat(16 * 1024 * 1024) }); }]) {
    const bad = structuredClone(plan); change(bad); assert.throws(() => validateWebhookPlan(bad, activity), /plan-invalid/);
  }
  assert.throws(() => validateWebhookPlan(plan, { ...activity, cardId: 'changed' }), /plan-invalid/);
});
test('suppressed targets are retained without delivery; denied targets and wrong acknowledgements cannot record receipts', async () => {
  const rows = new Map(), receipts = { findOne: async ({ _id }) => rows.get(_id), insertOne: async row => rows.set(row._id, row) };
  const common = { activity, receipts, assertCurrent: async () => {}, assertTarget: async () => true };
  const suppressed = await build({ prepare: async () => null });
  await deliverWebhookPlan({ ...common, plan: suppressed, deliver: async () => assert.fail('suppressed') });
  assert.equal(rows.size, 0);
  const plan = await build();
  await assert.rejects(deliverWebhookPlan({ ...common, plan, assertTarget: async () => false,
    deliver: async () => assert.fail('denied') }), /target-denied/);
  await assert.rejects(deliverWebhookPlan({ ...common, plan, deliver: async () => 'wrong' }), /delivery-unconfirmed/);
  assert.equal(rows.size, 0);
});
