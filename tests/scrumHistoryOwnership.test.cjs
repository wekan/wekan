'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { canonical } = require('../models/lib/changeHistoryIntegrity');
const { ensureScrumHistoryOperation: ensure, assertScrumHistoryOperation: owned } = require('../server/lib/scrumHistoryOwnership');
function fixture() {
  const original = { _id: 'board', rowId: 'row', userId: 'actor', direction: 'undo',
    content: { records: [{ type: 'card', id: 'card', document: { date: new Date(100) } }] },
    before: { records: [{ type: 'card', id: 'card', document: {} }] }, revisions: [1] };
  const state = { row: structuredClone(original), updates: 0 };
  const matches = selector => state.row && Object.entries(selector).every(([key, value]) =>
    value?.$exists === false ? !Object.hasOwn(state.row, key) : canonical(state.row[key]) === canonical(value?.$eq ?? value));
  const pending = { findOneAsync: async selector => matches(selector) ? structuredClone(state.row) : null,
    updateAsync: async (selector, modifier) => {
      if (!matches(selector)) return 0;
      state.updates++; Object.assign(state.row, structuredClone(modifier.$set)); return 1;
    } };
  return { original, state, pending };
}
test('concurrent legacy upgrades adopt one persisted ID and preserve the captured plan', async () => {
  const f = fixture();
  const [a, b] = await Promise.all([ensure(f.pending, f.original, () => 'first'), ensure(f.pending, f.original, () => 'second')]);
  assert.equal(a.operationId, 'first'); assert.equal(b.operationId, a.operationId);
  assert.equal(f.state.updates, 1); assert.equal(f.original.operationId, undefined);
  const { operationId, ...plan } = a; assert.deepEqual(plan, f.original);
  await owned(f.pending, a); assert.deepEqual(await ensure(f.pending, a), a);
});
test('lost upgrade replies reconcile only an intact saved plan', async () => {
  const f = fixture(), update = f.pending.updateAsync;
  f.pending.updateAsync = async (...args) => { await update(...args); throw Error('lost reply'); };
  assert.equal((await ensure(f.pending, f.original, () => 'saved')).operationId, 'saved');
  const g = fixture(); g.pending.updateAsync = async () => { throw Error('unavailable'); };
  await assert.rejects(ensure(g.pending, g.original), /unavailable/);
  assert.equal(g.state.row.operationId, undefined);
});
test('replaced plans never receive or borrow another checkpoint identity', async () => {
  for (const replace of [row => { row.rowId = 'different'; }, row => { row.before.records[0].document = { other: true }; },
    row => { row.content.records[0].document = {}; }, row => { row.revisions = [2]; }]) {
    const f = fixture(); replace(f.state.row);
    await assert.rejects(ensure(f.pending, f.original), /unconfirmed/);
    assert.equal(f.state.updates, 0);
    const g = fixture(); const saved = await ensure(g.pending, g.original); replace(g.state.row);
    await assert.rejects(owned(g.pending, saved), /conflict/);
  }
});
test('false acknowledgements, malformed plans and failed confirmation retain the checkpoint', async () => {
  const f = fixture(); f.pending.updateAsync = async () => 1;
  await assert.rejects(ensure(f.pending, f.original), /unconfirmed/);
  const g = fixture(); g.pending.findOneAsync = async () => { throw Error('read failed'); };
  await assert.rejects(ensure(g.pending, g.original), /read failed/);
  assert.ok(g.state.row.operationId);
  for (const patch of [{ operationId: '' }, { revisions: [] }, { direction: 'unknown' }]) {
    const h = fixture(); await assert.rejects(ensure(h.pending, { ...h.original, ...patch }), /conflict/);
    assert.equal(h.state.updates, 0);
  }
});

// Same-operation worker serialization: two server processes resuming ONE
// operation used to interleave its writes. The newest claim wins; a displaced
// worker is refused at its next guard.
const { claimScrumHistoryWorker: claim, assertScrumHistoryWorker: worker, scrumHistorySelector } =
  require('../server/lib/scrumHistoryOwnership');
test('the newest worker claim wins and the displaced worker stops at its next guard', async () => {
  const f = fixture();
  const journal = await ensure(f.pending, f.original, () => 'op');
  const first = await claim(f.pending, journal, 'worker-1');
  await worker(f.pending, journal, first);
  const second = await claim(f.pending, journal, 'worker-2');
  await worker(f.pending, journal, second);
  await assert.rejects(worker(f.pending, journal, first), /conflict/, 'the first worker is displaced');
  await owned(f.pending, journal);
});
test('a claim never attaches to a replaced plan, and a lost reply reconciles by readback', async () => {
  const f = fixture();
  const journal = await ensure(f.pending, f.original, () => 'op');
  f.state.row.revisions = [9];
  await assert.rejects(claim(f.pending, journal, 'w'), /conflict/);
  assert.equal(f.state.row.worker, undefined);
  const g = fixture(), saved = await ensure(g.pending, g.original, () => 'op'), update = g.pending.updateAsync;
  g.pending.updateAsync = async (...args) => { await update(...args); throw Error('lost reply'); };
  assert.equal(await claim(g.pending, saved, 'w'), 'w');
  await assert.rejects(claim(g.pending, { ...g.original }, 'w'), /conflict/, 'a legacy plan without an id is not claimed');
});
test('who resumed a plan is not part of the plan (completion hash unchanged)', async () => {
  const f = fixture();
  const journal = await ensure(f.pending, f.original, () => 'op');
  const before = JSON.stringify(scrumHistorySelector(journal));
  await claim(f.pending, journal, 'w');
  assert.equal(JSON.stringify(scrumHistorySelector({ ...journal, worker: 'w' })), before);
});
