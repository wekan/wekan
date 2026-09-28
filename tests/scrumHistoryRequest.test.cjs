'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareScrumHistoryRequest: prepare, requestIdentity } = require('../server/lib/scrumHistoryRequest');
const { hashHistoryRow } = require('../models/lib/changeHistoryIntegrity');

function fixture() {
  const context = { userId: 'user', boardId: 'board', direction: 'undo', requestId: 'stable-request-123' };
  const row = { _id: 'row', userId: 'user', boardId: 'board', entityType: 'scrum',
    newContent: {}, previousContent: {}, createdAt: new Date(0) };
  row.integrityHash = hashHistoryRow(row);
  const state = { saved: null, selections: 0, writes: 0, accesses: 0 };
  return { context, state, row, assertUnused: async () => {}, now: () => new Date(1234),
    assertAccess: async () => { state.accesses++; },
    select: async () => { state.selections++; return row; },
    requests: {
      findOneAsync: async () => structuredClone(state.saved),
      insertAsync: async document => { state.writes++; state.saved = structuredClone(document); },
    } };
}

test('caller identity is bounded, actor scoped and rejects board/direction reuse', async () => {
  const f = fixture(); const saved = await prepare(f);
  assert.equal(saved.selection.rowId, f.row._id);
  assert.notEqual(requestIdentity({ ...f.context, userId: 'other' })._id, saved._id);
  for (const update of [{ boardId: 'other' }, { direction: 'redo' }]) {
    await assert.rejects(prepare({ ...f, context: { ...f.context, ...update } }), /conflict/);
  }
  for (const requestId of ['', 'short', '$'.repeat(20), 'a'.repeat(129), null]) {
    assert.throws(() => requestIdentity({ ...f.context, requestId }), /conflict/);
  }
  assert.equal(f.state.selections, 1); assert.equal(f.state.writes, 1);
});

test('retries keep their selected row and timestamp without selecting the next stack entry', async () => {
  const f = fixture(); const first = await prepare(f);
  f.select = async () => { throw new Error('must not reselect'); };
  f.now = () => new Date(9999);
  assert.deepEqual(await prepare(f), first);
  assert.equal(f.state.writes, 1);
});

test('empty and unsupported selections remain explicit and immutable', async () => {
  for (const [row, kind] of [[null, 'empty'], [{ entityType: 'card' }, 'unsupported']]) {
    const f = fixture(); f.select = async () => row;
    const saved = await prepare(f); assert.deepEqual(saved.selection, { kind });
    f.select = async () => f.row;
    assert.deepEqual(await prepare(f), saved);
  }
});

test('only an exact persisted request can acknowledge a lost insert reply', async () => {
  const f = fixture(); const insert = f.requests.insertAsync;
  f.requests.insertAsync = async document => { await insert(document); throw new Error('lost reply'); };
  assert.deepEqual(await prepare(f), f.state.saved);
  const g = fixture(); g.requests.insertAsync = async () => 'false acknowledgement';
  await assert.rejects(prepare(g), /unconfirmed/);
  for (const field of ['selection', 'createdAt', 'checksum', 'extra']) {
    const h = fixture(); await prepare(h); h.state.saved[field] = 'damaged';
    await assert.rejects(prepare(h), /conflict/);
    assert.equal(h.state.selections, 1);
  }
});

test('revocation and missing original intent evidence stop before selection or writes', async () => {
  const f = fixture(); f.assertAccess = async () => { throw new Error('revoked'); };
  await assert.rejects(prepare(f), /revoked/); assert.equal(f.state.selections, 0);
  const g = fixture(); g.assertUnused = async () => { throw new Error('original intent missing'); };
  await assert.rejects(prepare(g), /original intent missing/); assert.equal(g.state.selections, 0);
  const h = fixture(); const access = h.assertAccess;
  h.assertAccess = async () => { await access(); if (h.state.accesses === 2) throw new Error('revoked'); };
  await assert.rejects(prepare(h), /revoked/); assert.equal(h.state.writes, 0);
});

test('corrupt, foreign and wrongly attributed Scrum sources never become requests', async () => {
  for (const change of [row => { row.integrityHash = 'bad'; }, row => { row.boardId = 'elsewhere'; },
    row => { row.userId = 'other'; }]) {
    const f = fixture(); change(f.row);
    await assert.rejects(prepare(f), /conflict/); assert.equal(f.state.writes, 0);
  }
});
