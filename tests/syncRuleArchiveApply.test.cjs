'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const { ensureRuleArchiveCommand } = require('../server/lib/syncRuleArchiveCommand');
const { archiveUnits, applyRuleArchiveCommand: apply } = require('../server/lib/syncRuleArchiveApply');
const { canonical } = require('../models/lib/changeHistoryIntegrity');
async function fixture(archived = false, satisfied = false) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'root', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {}, assertCard: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: archived ? 'unarchive' : 'archive' }) });
  f.live = ['root', 'child'].map(_id => ({ _id, boardId: 'board', listId: 'list', swimlaneId: 'lane',
    title: _id, archived, archivedAt: null, ...(_id === 'child' ? { parentId: 'root' } : {}) }));
  if (satisfied) f.live[0].archived = !archived;
  let saved;
  f.command = await ensureRuleArchiveCommand({ ...f, commands: { findOne: async () => saved,
    insertOne: async row => { saved = row; } }, readCard: async () => f.live[0],
    readChildren: async id => f.live.filter(card => card.parentId === id), now: () => new Date(1000) });
  const matches = (card, selector) => Object.entries(selector).every(([key, value]) => {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('$exists' in value && Object.hasOwn(card, key) !== value.$exists) return false;
      return !('$eq' in value) || canonical(card[key]) === canonical(value.$eq);
    }
    return canonical(card[key]) === canonical(value);
  });
  f.writes = []; f.deliveries = []; f.stored = new Map();
  f.cards = { findOne: async selector => f.live.find(card => matches(card, selector)),
    updateOne: async (selector, modifier) => {
      const card = f.live.find(card => matches(card, selector));
      if (card) { Object.assign(card, modifier.$set); f.writes.push(card._id); }
    } };
  f.receipts = { findOne: async ({ _id }) => f.stored.get(_id),
    insertOne: async row => { f.stored.set(row._id, structuredClone(row)); } };
  f.preflightEffects = async () => {};
  f.completeEffects = async ({ unit }) => { f.deliveries.push(unit.cardId); return unit.effectId; };
  return f;
}
test('archive/restore mutate descendants first and replay exact invocation receipts without writes', async () => {
  for (const archived of [false, true]) {
    const f = await fixture(archived);
    assert.equal(await apply(f), f.command.invocationId);
    assert.deepEqual(f.writes, ['child', 'root']); assert.deepEqual(f.deliveries, ['child', 'root']);
    assert.ok(f.live.every(card => card.archived === !archived));
    assert.ok(f.live.every(card => archived ? card.archivedAt === null : card.archivedAt.getTime() === 1000));
    await apply(f); assert.equal(f.writes.length, 2); assert.equal(f.deliveries.length, 2);
  }
});
test('interrupted effects resume without rewriting the child or skipping its delivery', async () => {
  const f = await fixture(), deliver = f.completeEffects; let interrupted = true;
  f.completeEffects = async options => { if (interrupted) throw Error('delivery stopped'); return deliver(options); };
  await assert.rejects(apply(f), /delivery stopped/);
  assert.deepEqual(f.writes, ['child']); assert.equal(f.stored.size, 0);
  interrupted = false; await apply(f);
  assert.deepEqual(f.writes, ['child', 'root']); assert.deepEqual(f.deliveries, ['child', 'root']);
});
test('later changed state, denied access and failed effect preflight refuse before any mutation', async () => {
  for (const patch of [
    f => { f.live[0].title = 'changed'; },
    f => { f.live[0].parentId = null; },
    f => { f.assertCard = async card => { if (card._id === 'root') throw Error('denied'); }; },
    f => { f.preflightEffects = async () => { throw Error('invalid effects'); }; },
  ]) {
    const f = await fixture(); patch(f); await assert.rejects(apply(f));
    assert.equal(f.writes.length, 0); assert.equal(f.deliveries.length, 0);
  }
});
test('lost write/receipt acknowledgements reconcile through state reads', async () => {
  const f = await fixture(), update = f.cards.updateOne, insert = f.receipts.insertOne;
  f.cards.updateOne = async (...args) => { await update(...args); throw Error('lost write'); };
  f.receipts.insertOne = async row => { await insert(row); throw Error('lost receipt'); };
  await apply(f); assert.deepEqual(f.writes, ['child', 'root']); assert.equal(f.stored.size, 3);
});
test('false writes and false effects never create completion evidence', async () => {
  const f = await fixture(); f.cards.updateOne = async () => {};
  await assert.rejects(apply(f), /write-unconfirmed/); assert.equal(f.stored.size, 0);
  const g = await fixture(); g.completeEffects = async () => 'wrong';
  await assert.rejects(apply(g), /effects-unconfirmed/); assert.equal(g.stored.size, 0);
});
test('corrupt receipts and non-prefix completion are rejected before new writes', async () => {
  const f = await fixture(); await apply(f);
  const units = archiveUnits(f.command, f);
  f.stored.delete(units[0].effectId);
  await assert.rejects(apply(f), /receipt-incomplete/); assert.equal(f.writes.length, 2);
  f.stored.get(units[1].effectId).checksum = 'wrong';
  await assert.rejects(apply(f), /receipt-invalid/);
});
test('ownership loss after a write stops delivery and remains resumable', async () => {
  const f = await fixture(), update = f.cards.updateOne; let current = true;
  f.assertCurrent = async () => { if (!current) throw Error('lease lost'); };
  f.cards.updateOne = async (...args) => { await update(...args); current = false; };
  await assert.rejects(apply(f), /lease lost/); assert.equal(f.deliveries.length, 0);
  current = true; f.cards.updateOne = update; await apply(f);
  assert.deepEqual(f.writes, ['child', 'root']);
});

test('satisfied root completes a no-op without changing children or delivering effects', async () => {
  for (const archived of [false, true]) {
    const f = await fixture(archived, true);
    assert.equal(await apply(f), f.command.invocationId);
    assert.equal(f.live[1].archived, archived);
    assert.equal(f.writes.length, 0); assert.equal(f.deliveries.length, 0);
    assert.equal(f.stored.size, 1);
  }
});
