'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { applySyncOperationStep } = require('../server/lib/syncOperationApply');
const step = { kind: 'create', cardId: 'card', before: null,
  after: { _id: 'card', boardId: 'board', listId: 'list', title: 'Imported' } };
function fixture() {
  const state = { row: null, writes: 0, effects: 0, guards: 0 };
  return { state, args: { step, operationId: randomUUID(), index: 0,
    assertCurrent: async () => { state.guards++; },
    completeEffects: async ({ effectId }) => { state.effects++; return effectId; },
    cards: {
      findOne: async query => state.row && Object.keys(query).every(key => state.row[key] === query[key]) ? state.row : null,
      insertOne: async row => { state.writes++; state.row = structuredClone(row); },
      updateOne: async () => assert.fail('unexpected update'),
    },
  } };
}
test('already persisted cards still require completion of the same stable effects', async () => {
  const { state, args } = fixture(); const ids = [];
  args.completeEffects = async ({ effectId }) => { ids.push(effectId); if (ids.length === 1) throw new Error('effect interrupted'); return effectId; };
  await assert.rejects(applySyncOperationStep(args), /effect interrupted/);
  assert.equal(await applySyncOperationStep(args), 'already-applied');
  assert.equal(state.writes, 1); assert.equal(ids[0], ids[1]);
  assert.match(ids[0], /^[a-f0-9]{64}$/);
});
test('false insert success and occupied targets never acknowledge effects', async () => {
  for (const occupied of [false, true]) {
    const { state, args } = fixture();
    if (occupied) state.row = { ...step.after, title: 'Local edit' };
    args.cards.insertOne = async () => { state.writes++; return { acknowledged: true }; };
    await assert.rejects(applySyncOperationStep(args), occupied ? /local-state-changed/ : /write-unconfirmed/);
    assert.equal(state.effects, 0); assert.equal(state.writes, occupied ? 0 : 1);
  }
});
test('lost write acknowledgement needs readable state and independently confirmed effects', async () => {
  const { state, args } = fixture(); const insert = args.cards.insertOne;
  args.cards.insertOne = async row => { await insert(row); throw new Error('lost reply'); };
  assert.equal(await applySyncOperationStep(args), 'applied');
  assert.equal(state.effects, 1);
  for (const reply of [undefined, true, 'another-effect']) {
    args.completeEffects = async () => reply;
    await assert.rejects(applySyncOperationStep(args), /effects-unconfirmed/);
  }
  assert.equal(state.writes, 1);
});
test('lost ownership after writing prevents effects and after effects prevents completion', async () => {
  for (const when of ['write', 'effects']) {
    const { state, args } = fixture();
    args.assertCurrent = async () => {
      if (when === 'write' ? state.writes > 0 : state.effects > 0) throw new Error('lease lost');
    };
    await assert.rejects(applySyncOperationStep(args), /lease lost/);
    assert.equal(state.effects, when === 'write' ? 0 : 1);
  }
});
test('invalid adapters and plans fail before writes or effects', async () => {
  for (const patch of [{ operationId: 'bad' }, { index: -1 }, { index: 10000 },
    { assertCurrent: null }, { completeEffects: null }, { step: { ...step, after: { ...step.after, secret: 'no' } } }]) {
    const { state, args } = fixture();
    await assert.rejects(applySyncOperationStep({ ...args, ...patch }), /invalid-sync/);
    assert.equal(state.writes, 0); assert.equal(state.effects, 0); assert.equal(state.guards, 0);
  }
});
test('failed confirmation reads retain the write error and do not acknowledge effects', async () => {
  const { state, args } = fixture(); const find = args.cards.findOne;
  const failure = new Error('original insert failure');
  args.cards.insertOne = async () => { state.writes++; throw failure; };
  args.cards.findOne = async query => {
    if (state.writes) throw new Error('confirmation unavailable');
    return find(query);
  };
  await assert.rejects(applySyncOperationStep(args), error => error === failure);
  assert.equal(state.effects, 0);
});
// A step's planned activities are stored only after its write is confirmed,
// and their rules may move or archive the card (durable rule moves and
// archive). A replay after an interruption there finds the card at neither
// state: it must finish the effects, not retry a write that can never be
// confirmed - which used to fail the operation on every replay.
test('a replay after the step\'s effects began finishes them even when a rule moved the card', async () => {
  const { state, args } = fixture();
  args.completeEffects = async ({ effectId }) => {
    state.effects++;
    state.row = { ...state.row, listId: 'moved-by-a-rule' };
    if (state.effects === 1) throw new Error('interrupted during the rule');
    return effectId;
  };
  let started = false;
  args.effectsStarted = async () => started;
  await assert.rejects(applySyncOperationStep(args), /interrupted during the rule/);
  // Negative: without evidence that the effects began, a card at neither
  // state is a conflict, never acknowledged.
  await assert.rejects(applySyncOperationStep(args), /local-state-changed/);
  assert.equal(state.effects, 1);
  started = true;
  assert.equal(await applySyncOperationStep(args), 'already-applied');
  assert.deepEqual([state.writes, state.effects], [1, 2], 'no second write; the effects finished');
  await assert.rejects(applySyncOperationStep({ ...args, effectsStarted: 'yes' }), /invalid-sync-operation-adapter/);
});
test('wiring: the effects step tells the journal whether its activities were stored', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../server/lib/syncEffects.js'), 'utf8');
  assert.match(src, /step\.kind === 'create' \? \[plan\.activities\.activity\._id\] : plan\.activities\.rows\.map\(row => row\.activity\._id\)/);
  assert.match(src, /completeEffects: \(\) => persistSyncEffects\(options\), effectsStarted \}\);/);
});
