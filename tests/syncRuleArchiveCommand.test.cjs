'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const { ensureRuleArchiveCommand: ensure, validateRuleArchiveCommand: validate } = require('../server/lib/syncRuleArchiveCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');
async function fixture(type = 'archive') {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'root', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {}, now: () => new Date(1000) };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: type }) });
  const card = (_id, parentId) => ({ _id, boardId: 'board', listId: 'list', swimlaneId: 'swimlane',
    title: _id, archived: type === 'unarchive', ...(parentId ? { parentId } : {}), privateField: 'omit' });
  f.live = [card('root'), card('b', 'root'), card('a', 'root'), card('grandchild', 'a')];
  f.readCard = async id => f.live.find(card => card._id === id);
  f.readChildren = async id => f.live.filter(card => card.parentId === id);
  f.checked = []; f.assertCard = async card => { f.checked.push(card._id); };
  f.rows = new Map();
  f.commands = { findOne: async ({ _id }) => structuredClone(f.rows.get(_id)),
    insertOne: async row => { if (f.rows.has(row._id)) throw Error('duplicate'); f.rows.set(row._id, structuredClone(row)); } };
  return f;
}
test('archive and restore freeze complete post-order cascades without retaining private fields', async () => {
  for (const type of ['archive', 'unarchive']) {
    const f = await fixture(type), row = await ensure(f);
    assert.deepEqual(row.cards.map(card => card._id), ['grandchild', 'a', 'b', 'root']);
    assert.equal(row.archived, type === 'archive'); assert.deepEqual(row.createdAt, new Date(1000));
    assert.equal(f.checked.length, 4); assert.ok(row.cards.every(card => !Object.hasOwn(card, 'privateField')));
    assert.equal(f.live[0].archived, type === 'unarchive', 'preparation never writes cards');
    f.live = []; row.cards[0].title = 'caller mutation';
    const replay = await ensure({ ...f, readCard: () => assert.fail('must not reselect') });
    assert.equal(replay.cards[0].title, 'grandchild');
  }
});
test('an already satisfied root does not archive or restore its children', async () => {
  for (const type of ['archive', 'unarchive']) {
    const f = await fixture(type); f.live[0].archived = type === 'archive';
    const row = await ensure({ ...f, readChildren: () => assert.fail('ordinary rule skips cascade') });
    assert.equal(row.cards.length, 1);
  }
});
test('wrong scope, cycles, duplicates, excessive breadth and denied children prevent storage', async () => {
  for (const mutate of [
    f => { f.live[1].boardId = 'other'; },
    f => { f.live[0].parentId = 'grandchild'; },
    f => { f.live.push({ ...f.live[1] }); },
    f => { f.readChildren = async () => Array(1001).fill(f.live[1]); },
    f => { f.assertCard = async card => { if (card._id === 'a') throw Error('denied'); }; },
  ]) {
    const f = await fixture(); mutate(f); await assert.rejects(ensure(f)); assert.equal(f.rows.size, 0);
  }
});
test('lost insert replies reconcile; false success and tampered evidence fail closed', async () => {
  const f = await fixture(), insert = f.commands.insertOne;
  f.commands.insertOne = async () => {}; await assert.rejects(ensure(f), /unconfirmed/);
  f.commands.insertOne = async row => { await insert(row); throw Error('lost reply'); };
  const row = await ensure(f); f.rows.get(row._id).cards[0].title = 'tampered';
  await assert.rejects(ensure(f), /command-invalid/);
});
test('validation rejects changed plan and malformed topology even with a recalculated checksum', async () => {
  const f = await fixture(), row = await ensure(f);
  for (const mutate of [r => r.cards.reverse(), r => { r.cards[0].parentId = 'missing'; },
    r => { r.cards.at(-1).parentId = 'grandchild'; }, r => { r.cards[0].extra = true; }]) {
    const changed = structuredClone(row); mutate(changed); delete changed.checksum;
    changed.checksum = sha256(canonical(changed));
    assert.throws(() => validate(changed, f), /command-invalid/);
  }
  f.plan.actions[0].action.actionType = 'unarchive';
  await assert.rejects(ensure(f), /command-invalid/);
});
test('ownership loss after child reads cannot persist a partial plan', async () => {
  const f = await fixture(); let current = true;
  f.assertCurrent = async () => { if (!current) throw Error('lease lost'); };
  f.readChildren = async () => { current = false; return []; };
  await assert.rejects(ensure(f), /lease lost/); assert.equal(f.rows.size, 0);
});
