'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const { ensureRuleArchiveCommand } = require('../server/lib/syncRuleArchiveCommand');
const { createRuleArchiveCards } = require('../server/lib/syncRuleArchiveCards');
const { exactFieldSelector } = require('../models/lib/exactFieldSelector');
const { deferSyncRecording } = require('../server/lib/syncRecordingScope');
test('bound archive writer preserves actor, limits predicates/modifiers and scopes hook suppression', async () => {
  const card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Card', archived: false };
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {}, assertCard: async () => {} };
  f.plan = await prepareRulePlan({ ...f, selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'archive' }) });
  let saved, actor, calls = 0, failWrite = false;
  f.command = await ensureRuleArchiveCommand({ ...f, commands: { findOne: async () => saved, insertOne: async row => { saved = row; } },
    readCard: async () => card, readChildren: async () => [], now: () => new Date(1000) });
  const selector = exactFieldSelector(card, ['_id', 'boardId', 'listId', 'swimlaneId', 'parentId', 'title', 'archived', 'archivedAt']);
  const modifier = { $set: { archived: true, archivedAt: new Date(1000) } };
  const writer = createRuleArchiveCards({ ...f, withActor: async (id, work) => {
    actor = id; try { return await work(); } finally { actor = undefined; }
  }, cards: { findOneAsync: async (q, options) => { assert.deepEqual(q, selector); assert.equal(options.transform, null); return card; },
    updateAsync: async (q, change, options) => {
      calls++; assert.equal(actor, 'actor'); assert.deepEqual(q, selector); assert.deepEqual(change, modifier);
      assert.deepEqual(options, { removeEmptyStrings: false, trimStrings: false });
      assert.equal(deferSyncRecording('archive', { ...card, _id: 'other' }), false);
      assert.equal(deferSyncRecording('archive', card), true);
      assert.equal(deferSyncRecording('history', card, ['archived']), true);
      assert.equal(deferSyncRecording('title', card), false);
      change.$set.archived = false;
      if (failWrite) throw Error('schema failure');
      return 1;
    } } });
  assert.equal((await writer.findOne(selector))._id, card._id);
  assert.deepEqual(await writer.updateOne(selector, modifier), { matchedCount: 1 });
  assert.equal(modifier.$set.archived, true); assert.equal(actor, undefined);
  assert.equal(deferSyncRecording('archive', card), false);
  for (const [query, change] of [[{ _id: 'card' }, modifier], [selector, { $set: { archived: false } }],
    [selector, { $set: { ...modifier.$set, title: 'outside command' } }]]) {
    await assert.rejects(writer.updateOne(query, change), /cards-invalid/);
  }
  await assert.rejects(writer.findOne({ _id: 'card' }), /cards-invalid/);
  assert.equal(calls, 1);
  failWrite = true; await assert.rejects(writer.updateOne(selector, modifier), /schema failure/);
  assert.equal(actor, undefined); assert.equal(deferSyncRecording('archive', card), false);
});
