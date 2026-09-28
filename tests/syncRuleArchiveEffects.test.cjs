'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const { ensureRuleArchiveCommand } = require('../server/lib/syncRuleArchiveCommand');
const { prepareRuleArchiveEffects: prepare, validateRuleArchiveEffects: validate,
  ensureRuleArchiveEffects: ensure, applyRuleArchiveEffects: apply } = require('../server/lib/syncRuleArchiveEffects');
const { canonical, sha256, hashHistoryRow } = require('../models/lib/changeHistoryIntegrity');
async function fixture() {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'root', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {}, assertCard: async () => {},
    username: 'Original name', lists: [{ _id: 'list', boardId: 'board', title: 'Original list' }],
    policy: { activities: true, notifications: false } };
  f.plan = await prepareRulePlan({ ...f, selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'archive' }) });
  f.cards = ['root', 'a', 'b'].map(_id => ({ _id, boardId: 'board', listId: 'list', swimlaneId: 'lane',
    title: _id, archived: _id === 'a', ...(_id !== 'root' ? { parentId: 'root' } : {}) }));
  let command;
  f.command = await ensureRuleArchiveCommand({ ...f, commands: { findOne: async () => command, insertOne: async row => { command = row; } },
    readCard: async () => f.cards[0], readChildren: async id => f.cards.filter(card => card.parentId === id), now: () => new Date(1000) });
  f.effects = prepare(f);
  return f;
}
function rehash(saved) { delete saved.checksum; saved.checksum = sha256(canonical(saved)); }
test('archive effects retain captured metadata and chain through unchanged children', async () => {
  const f = await fixture(), rows = f.effects.rows;
  assert.equal(rows[0].history.rows.length, 0); assert.equal(rows[0].activities.rows.length, 0);
  assert.equal(rows[1].history.rows[0].previousHash, null);
  assert.equal(rows[2].history.rows[0].previousHash, rows[1].history.rows[0].integrityHash);
  assert.equal(rows[1].activities.rows[0].activity.listName, 'Original list');
  assert.equal(rows[2].activities.rows[0].activity.cardTitle, 'root');
  assert.equal(rows[2].activities.context.createdAt.getTime(), 1000);
  f.lists[0].title = 'changed'; assert.equal(validate(f.effects, f.command, f).rows[1].activities.rows[0].activity.listName, 'Original list');
});
test('disabled activities preserve History while omitting activity delivery plans', async () => {
  const f = await fixture(); f.policy = { activities: false, notifications: false }; f.lists = [];
  const result = prepare(f);
  assert.ok(result.rows.every(row => row.activities === null));
  assert.equal(result.rows.flatMap(row => row.history.rows).length, 2);
});
test('identity, actor, timestamp, policy and cross-card History-chain corruption are refused', async () => {
  const f = await fixture();
  for (const change of [s => { s.commandHash = 'b'.repeat(64); }, s => s.rows.reverse(),
    s => { s.rows[1].history.userId = 'other'; }, s => { s.rows[1].activities.context.createdAt = new Date(2000); },
    s => { s.rows[1].policy.notifications = true; }, s => {
      const row = s.rows[2].history.rows[0]; row.previousHash = null; row.integrityHash = hashHistoryRow(row);
    }]) {
    const saved = structuredClone(f.effects); change(saved); rehash(saved);
    assert.throws(() => validate(saved, f.command, f));
  }
});
test('first persisted effects survive changed metadata and lost insert replies', async () => {
  const f = await fixture(); let row;
  const effects = { findOne: async () => structuredClone(row), insertOne: async value => { row = structuredClone(value); throw Error('lost reply'); } };
  const saved = await ensure({ ...f, effects, build: async () => f.effects });
  f.lists[0].title = 'changed';
  assert.deepEqual(await ensure({ ...f, effects, build: () => assert.fail('no rebuild') }), saved);
  row.rows[1].activities.rows[0].activity.cardTitle = 'corrupt';
  await assert.rejects(ensure({ ...f, effects, build: () => assert.fail() }));
});
test('missing lists and false persistence fail before execution', async () => {
  const f = await fixture(); assert.throws(() => prepare({ ...f, lists: [] }));
  await assert.rejects(ensure({ ...f, effects: { findOne: async () => null, insertOne: async () => {} },
    build: async () => f.effects }), /unconfirmed/);
});
test('changed live policy or missing delivery adapters cannot reach card writes', async () => {
  const f = await fixture();
  const cards = { findOne: async () => assert.fail('no card reads'), updateOne: async () => assert.fail('no writes') };
  const history = { findOneAsync() {}, insertAsync() {}, updateAsync() {} };
  const activities = { findOneAsync() {}, insertAsync() {} };
  const receipts = { findOne: async () => null, insertOne: async () => assert.fail() };
  await assert.rejects(apply({ ...f, cards, history, activities, receipts,
    readPolicy: async () => ({ activities: false, notifications: false }), completeDelivery: async () => {} }), /policy/);
  await assert.rejects(apply({ ...f, cards, history, activities, receipts, readPolicy: async () => f.policy }), /effects-invalid/);
});
test('cascade activity adapter restricts IDs and payloads while preserving scoped delivery deferral', async () => {
  const { createRuleArchiveActivities } = require('../server/lib/syncRuleArchiveActivities');
  const { deferSyncActivity } = require('../server/lib/syncActivityScope');
  const f = await fixture(); let actor, inserts = 0;
  const adapter = createRuleArchiveActivities({ ...f, withActor: async (id, work) => {
    actor = id; try { return await work(); } finally { actor = undefined; }
  }, activities: { findOneAsync: async (id, options) => { assert.equal(options.transform, null); return { _id: id }; },
    insertAsync: async event => {
      inserts++; assert.equal(actor, 'actor');
      for (const kind of ['timestamps', 'notificationIntent', 'rules', 'notifications']) assert.equal(deferSyncActivity(kind, event), true);
      return event._id;
    } } });
  const event = f.effects.rows[1].activities.rows[0].activity;
  assert.equal(await adapter.insertAsync(event), event._id);
  assert.equal(actor, undefined); assert.equal(deferSyncActivity('rules', event), false);
  assert.equal((await adapter.findOneAsync(event._id))._id, event._id);
  assert.throws(() => adapter.findOneAsync('unrelated'), /activities-invalid/);
  assert.throws(() => adapter.insertAsync({ ...event, _id: 'unrelated' }), /activities-invalid/);
  await assert.rejects(adapter.insertAsync({ ...event, cardTitle: 'changed' }), /adapter-invalid/);
  assert.equal(inserts, 1);
});
