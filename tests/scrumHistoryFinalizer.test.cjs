const { test } = require('node:test');
const assert = require('node:assert/strict');
const { finishScrumHistory } = require('../server/lib/scrumHistoryFinalizer');
const { hashHistoryRow, canonical } = require('../models/lib/changeHistoryIntegrity');
function fixture(direction = 'undo') {
  const row = { _id: 'row', boardId: 'board', userId: 'author', entityType: 'scrum',
    entityId: 'card', changeType: 'edited', previousContent: {}, newContent: {},
    createdAt: new Date(0), undone: direction === 'redo', undoneAt: null, superseded: false };
  row.integrityHash = hashHistoryRow(row);
  const journal = { _id: 'board', rowId: 'row', userId: 'author', operationId: 'operation', direction, content: { records: [] }, before: { records: [] }, revisions: [] };
  const state = { current: structuredClone(row), checkpoint: structuredClone(journal), updates: 0,
    deletes: 0, zero: false, lostAck: false, replaceCheckpoint: false };
  const history = {
    async findOneAsync() { return structuredClone(state.current); },
    async updateAsync(selector, modifier) {
      state.updates++;
      assert.equal(selector.integrityHash, row.integrityHash);
      assert.equal(selector.undone, state.current.undone);
      if (state.zero) return 0;
      Object.assign(state.current, modifier.$set);
      if (state.replaceCheckpoint) state.checkpoint.operationId = 'new-operation';
      if (state.lostAck) throw new Error('lost acknowledgement');
      return 1;
    },
  };
  const pending = {
    async findOneAsync(query) {
      return state.checkpoint && Object.keys(query).every(key => canonical(state.checkpoint[key]) === canonical(query[key]?.$eq ?? query[key]))
        ? structuredClone(state.checkpoint) : null;
    },
    async removeAsync(query) {
      state.deletes++;
      assert.equal(query.operationId, journal.operationId);
      assert.deepEqual(query.content.$eq, journal.content);
      assert.deepEqual(query.before.$eq, journal.before);
      assert.deepEqual(query.revisions.$eq, journal.revisions);
      state.checkpoint = null;
      return 1;
    },
  };
  return { history, pending, row, journal, state, now: () => new Date(1234) };
}
test('undo and redo verify the persisted state before exact checkpoint cleanup', async () => {
  for (const direction of ['undo', 'redo', 'restore']) {
    const f = fixture(direction);
    await finishScrumHistory(f);
    assert.equal(f.state.checkpoint, null);
    assert.equal(f.state.updates, direction === 'restore' ? 0 : 1);
    if (direction !== 'restore') {
      assert.equal(f.state.current.undone, direction === 'undo');
      assert.deepEqual(f.state.current.undoneAt, direction === 'undo' ? new Date(1234) : null);
    }
  }
});
test('lost undo acknowledgement retains recovery evidence and retry preserves timestamp', async () => {
  const f = fixture(); f.state.lostAck = true;
  await assert.rejects(finishScrumHistory(f), /lost acknowledgement/);
  assert.ok(f.state.checkpoint); assert.equal(f.state.deletes, 0);
  f.state.lostAck = false; f.now = () => new Date(9999);
  await finishScrumHistory(f);
  assert.deepEqual(f.state.current.undoneAt, new Date(1234));
  assert.equal(f.state.updates, 1);
});
test('missing, damaged, superseded and unmatched source rows retain the journal', async () => {
  for (const change of [f => f.state.current = null,
    f => f.state.current.newContent = { changed: true },
    f => f.state.current.superseded = true, f => f.state.zero = true]) {
    const f = fixture(); change(f);
    await assert.rejects(finishScrumHistory(f), /conflict/);
    assert.ok(f.state.checkpoint); assert.equal(f.state.deletes, 0);
  }
});
test('a replacement checkpoint cannot be cleared by an old worker', async () => {
  const f = fixture(); f.state.replaceCheckpoint = true;
  await assert.rejects(finishScrumHistory(f), /conflict/);
  assert.equal(f.state.checkpoint.operationId, 'new-operation');
  assert.equal(f.state.deletes, 0);
});
test('invalid persisted final states never acknowledge cleanup', async () => {
  for (const stamp of [null, new Date(NaN), '2026-01-01']) {
    const f = fixture(); f.state.current.undone = true; f.state.current.undoneAt = stamp;
    await assert.rejects(finishScrumHistory(f), /conflict/);
    assert.equal(f.state.deletes, 0);
  }
});
test('failed cleanup and a changed readback do not report successful completion', async () => {
  const f = fixture();
  f.pending.removeAsync = async () => { throw new Error('cleanup unavailable'); };
  await assert.rejects(finishScrumHistory(f), /cleanup unavailable/);
  assert.ok(f.state.checkpoint);
  const g = fixture();
  g.history.updateAsync = async () => 1; // acknowledgement without intended state
  await assert.rejects(finishScrumHistory(g), /conflict/);
  assert.equal(g.state.deletes, 0);
  const h = fixture(); h.pending.removeAsync = async () => 0;
  await assert.rejects(finishScrumHistory(h), /conflict/);
  assert.ok(h.state.checkpoint);
});
test('reloaded superseded redo sources never finalize or clear their pending journal', async () => {
  const f = fixture('redo');
  f.row.superseded = true; f.state.current.superseded = true;
  await assert.rejects(finishScrumHistory(f), /conflict/);
  assert.equal(f.state.updates, 0); assert.equal(f.state.deletes, 0);
  assert.ok(f.state.checkpoint);
});
test('source validation rejects invalidation before mutations while allowing completed redo retry', () => {
  const { verifyScrumHistorySource: verify } = require('../server/lib/scrumHistoryFinalizer');
  const f = fixture('redo');
  f.state.current.undone = false; // finalization reply was lost
  assert.doesNotThrow(() => verify(f.state.current, f.row, 'redo'));
  for (const mutate of [row => { row._id = 'other'; }, row => { row.superseded = true; },
    row => { row.newContent = { damaged: true }; }]) {
    const current = structuredClone(f.state.current); mutate(current);
    assert.throws(() => verify(current, f.row, 'redo'), /conflict/);
  }
});
test('same-ID checkpoint replacement cannot authorize finalization or cleanup', async () => {
  for (const field of ['content', 'before', 'revisions']) {
    const f = fixture();
    f.state.checkpoint[field] = field === 'revisions' ? [1] : { records: [{ changed: true }] };
    await assert.rejects(finishScrumHistory(f), /conflict/);
    assert.equal(f.state.updates, 0); assert.equal(f.state.deletes, 0);
  }
});
