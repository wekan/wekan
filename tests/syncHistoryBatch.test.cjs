'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareSyncFieldHistory, persistSyncFieldHistory } = require('../server/lib/syncHistoryBatch');
const { hashHistoryRow, rowHashIsValid } = require('../models/lib/changeHistoryIntegrity');
const { valueFromContent } = require('../models/lib/changeHistoryGroups');
const step = { kind: 'update', cardId: 'card', before: { _id: 'card', boardId: 'board', listId: 'list', title: 'Before', spentTime: 0 },
  after: { _id: 'card', boardId: 'board', listId: 'list', title: 'After', spentTime: 2 } };
const options = { step, effectId: 'a'.repeat(64), userId: 'author', createdAt: new Date(1000) };
function redoRow() {
  const row = { _id: 'old', boardId: 'board', userId: 'author', entityId: 'card', entityType: 'card',
    group: 'title', changeType: 'edited', previousContent: { field: 'title', value: 'Old' },
    newContent: { field: 'title', value: 'Before' }, createdAt: new Date(0), undone: true,
    undoneAt: new Date(10), superseded: false };
  row.integrityHash = hashHistoryRow(row); return row;
}
function fixture() {
  const redo = redoRow(), records = new Map([[redo._id, redo]]);
  const plan = prepareSyncFieldHistory({ ...options, previousHash: redo.integrityHash, redoRows: [redo] });
  let inserts = 0;
  return { plan, records, get inserts() { return inserts; }, assertCurrent: async () => {}, history: {
    // Sync History writes only as a writer the board's History gate admits.
    admitHistoryWriter: ({ work }) => work({ assertCurrent: async () => {} }),
    findOneAsync: async query => typeof query === 'string' ? records.get(query)
      : [...records.values()].find(row => row.boardId === query.boardId && row.integrityHash === query.integrityHash),
    updateAsync: async target => { const row = records.get(target._id); if (row && row.undoneAt.getTime() === target.undoneAt.getTime()) row.superseded = true; },
    insertAsync: async row => { inserts++; records.set(row._id, structuredClone(row)); return row._id; },
  } };
}
test('field History uses stable row IDs, a fixed chain and one batch', async () => {
  const f = fixture(); const snapshot = structuredClone(f.plan);
  assert.equal(await persistSyncFieldHistory(f), options.effectId);
  assert.equal(await persistSyncFieldHistory(f), options.effectId);
  assert.equal(f.inserts, 2); assert.deepEqual(f.plan, snapshot);
  assert.ok(f.records.get('old').superseded);
  assert.equal(f.plan.rows[1].previousHash, f.plan.rows[0].integrityHash);
  assert.ok(f.plan.rows.every(row => rowHashIsValid(row) && row.batchId === `sync-${options.effectId}`));
});
test('lost inserts and false success replies require exact persisted evidence', async () => {
  const f = fixture(); const insert = f.history.insertAsync;
  f.history.insertAsync = async row => { await insert(row); throw new Error('lost reply'); };
  await persistSyncFieldHistory(f); assert.equal(f.inserts, 2);
  for (const mode of ['missing', 'changed']) {
    const g = fixture();
    g.history.insertAsync = async row => { if (mode === 'changed') g.records.set(row._id, { ...row, newContent: {} }); return row._id; };
    await assert.rejects(persistSyncFieldHistory(g), /event-unconfirmed/);
  }
});
test('retry invalidates only the saved redo candidates and preserves newly undone rows', async () => {
  const f = fixture(); const insert = f.history.insertAsync;
  f.history.insertAsync = async () => { throw new Error('interrupted'); };
  await assert.rejects(persistSyncFieldHistory(f), /interrupted/);
  const later = { ...redoRow(), _id: 'later', undoneAt: new Date(20) };
  f.records.set('later', later);
  f.history.insertAsync = insert; await persistSyncFieldHistory(f);
  assert.equal(f.records.get('later').superseded, false);
  const g = fixture(); g.records.get('old').undoneAt = new Date(999);
  await assert.rejects(persistSyncFieldHistory(g), /redo-unconfirmed/); assert.equal(g.inserts, 0);
});
test('invalid plans and changed ownership stop before acknowledgement', async () => {
  const f = fixture(); f.plan.rows[1].newContent = {};
  await assert.rejects(persistSyncFieldHistory(f), /plan-invalid/); assert.equal(f.inserts, 0);
  assert.equal(f.records.get('old').superseded, false);
  const g = fixture(); g.assertCurrent = async () => { throw new Error('lease lost'); };
  await assert.rejects(persistSyncFieldHistory(g), /lease lost/); assert.equal(g.inserts, 0);
  assert.throws(() => prepareSyncFieldHistory({ ...options, redoRows: [{ ...redoRow(), undone: false }] }), /plan-invalid/);
  assert.throws(() => prepareSyncFieldHistory({ ...options, userId: '' }), /plan-invalid/);
  const creation = prepareSyncFieldHistory({ ...options, step: { ...step, kind: 'create', before: null }, redoRows: [redoRow()] });
  assert.deepEqual(creation.rows, []); assert.deepEqual(creation.redo, []);
});
test('mapped estimate History preserves typed unrelated values; baseline-only updates emit no history', () => {
  const mapping = JSON.stringify(['estimate', 'customfield_100', 'points']);
  const before = { ...step.before, customFields: [{ _id: 'date', value: new Date(0) }, { _id: 'estimate', value: 1 }],
    syncLastSource: { estimate: 1, estimateMapping: mapping } };
  const after = { ...before, customFields: [{ _id: 'date', value: new Date(0) }, { _id: 'estimate', value: 2 }],
    syncLastSource: { estimate: 2, estimateMapping: mapping } };
  const plan = prepareSyncFieldHistory({ ...options, step: { ...step, before, after } });
  assert.equal(plan.rows.length, 1);
  assert.deepEqual(valueFromContent(JSON.parse(JSON.stringify(plan.rows[0].newContent))), after.customFields);
  const noOp = prepareSyncFieldHistory({ ...options, step: { ...step, before: step.before,
    after: { ...step.before, syncLastSource: { title: 'Before' } } }, redoRows: [redoRow()] });
  assert.deepEqual(noOp.rows, []); assert.deepEqual(noOp.redo, []);
});
test('redo invalidation confirms the stored flag after missing and lost replies', async () => {
  const f = fixture(); f.history.updateAsync = async () => 1;
  await assert.rejects(persistSyncFieldHistory(f), /redo-unconfirmed/); assert.equal(f.inserts, 0);
  const g = fixture(); const update = g.history.updateAsync;
  g.history.updateAsync = async target => { await update(target); throw new Error('lost redo reply'); };
  await persistSyncFieldHistory(g); assert.equal(g.inserts, 2);
  const saved = g.records.get(g.plan.rows[0]._id); saved.undone = true; saved.undoneAt = new Date(9999);
  await persistSyncFieldHistory(g);
  assert.equal(saved.undone, true); assert.equal(saved.undoneAt.getTime(), 9999); assert.equal(g.inserts, 2);
});
test('damaged redo snapshots and unexpected row fields fail before writes', async () => {
  for (const damage of [plan => plan.redo.push({ ...plan.redo[0] }),
    plan => plan.redo[0].boardId = 'other', plan => plan.rows[0].extra = 'unexpected']) {
    const f = fixture(); damage(f.plan);
    await assert.rejects(persistSyncFieldHistory(f), /plan-invalid/);
    assert.equal(f.records.get('old').superseded, false); assert.equal(f.inserts, 0);
  }
});
test('a missing or damaged predecessor prevents partial timeline publication', async () => {
  for (const damage of [f => f.records.delete('old'), f => f.records.get('old').entityId = 'tampered']) {
    const f = fixture(); damage(f);
    await assert.rejects(persistSyncFieldHistory(f), /predecessor-unconfirmed/);
    assert.equal(f.inserts, 0);
  }
});
test('cross-scope steps, explicit undefined snapshots and oversized redo plans are refused', () => {
  assert.throws(() => prepareSyncFieldHistory({ ...options, step: { ...step,
    before: { ...step.before, boardId: 'other' } } }), /outside-scope/);
  assert.throws(() => prepareSyncFieldHistory({ ...options, step: { ...step,
    after: { ...step.after, description: undefined } } }), /undefined-snapshot/);
  assert.throws(() => prepareSyncFieldHistory({ ...options, redoRows: Array(10001).fill(redoRow()) }), /plan-invalid/);
});
test('persisted field History is bound to the exact card step and operation effect ID', () => {
  const { validateSyncFieldHistory } = require('../server/lib/syncHistoryBatch');
  const plan = prepareSyncFieldHistory(options);
  assert.equal(validateSyncFieldHistory(plan, step, options.effectId), true);
  assert.throws(() => validateSyncFieldHistory(plan, step, 'b'.repeat(64)), /plan-invalid/);
  assert.throws(() => validateSyncFieldHistory(plan, { ...step, after: { ...step.after, title: 'Different' } }, options.effectId), /plan-invalid/);
  assert.throws(() => validateSyncFieldHistory({ ...plan, rows: [] }, step, options.effectId), /plan-invalid/);
});

test('legacy redo snapshots preserve missing/null/empty hashes and reject damaged hashed rows', async () => {
  for (const hash of [undefined, null, '']) {
    const legacy = redoRow(); delete legacy.integrityHash;
    if (hash !== undefined) legacy.integrityHash = hash;
    legacy.newContent = { field: 'customFields', value: [{ _id: 'date', value: new Date(0) }] };
    const plan = prepareSyncFieldHistory({ ...options, redoRows: [legacy] });
    assert.deepEqual(plan.redo[0].legacyRow.newContent, legacy.newContent);
    assert.equal(Object.hasOwn(plan.redo[0].legacyRow, 'integrityHash'), hash !== undefined);
    const damaged = structuredClone(plan); damaged.redo[0].legacyRow.newContent = null;
    await assert.rejects(persistSyncFieldHistory({ ...fixture(), plan: damaged }), /plan-invalid/);
  }
  for (const integrityHash of ['broken', 'a'.repeat(64), false, 0]) {
    assert.throws(() => prepareSyncFieldHistory({ ...options, redoRows: [{ ...redoRow(), integrityHash }] }), /plan-invalid/);
  }
  const legacy = redoRow(); delete legacy.integrityHash;
  for (const change of [{ boardId: 'other' }, { userId: 'other' }, { undoneAt: null }, { payload: undefined }]) {
    assert.throws(() => prepareSyncFieldHistory({ ...options, redoRows: [{ ...legacy, ...change }] }), /plan-invalid/);
  }
});

test('operation History planning chains cards across no-ops and consumes redo once', () => {
  const { createSyncHistoryPlanner } = require('../server/lib/syncHistoryBatch');
  const { randomUUID } = require('node:crypto');
  const operationId = randomUUID(), redo = redoRow();
  const input = { userId: 'author', createdAt: new Date(1000), previousHash: redo.integrityHash, redoRows: [redo] };
  const planner = createSyncHistoryPlanner(input);
  input.redoRows.length = 0; input.createdAt.setTime(9999);
  const unchanged = { ...step, after: step.before };
  const noOp = planner(unchanged, { operationId, index: 0 });
  assert.deepEqual(noOp.rows, []); assert.deepEqual(noOp.redo, []);
  const first = planner(step, { operationId, index: 1 });
  assert.equal(first.redo.length, 1); assert.equal(first.rows[0].createdAt.getTime(), 1000);
  assert.equal(first.rows[0].previousHash, redo.integrityHash);
  const creation = planner({ ...step, kind: 'create', before: null }, { operationId, index: 2 });
  assert.deepEqual(creation.rows, []); assert.deepEqual(creation.redo, []);
  const next = planner(step, { operationId, index: 3 });
  assert.equal(next.rows[0].previousHash, first.rows.at(-1).integrityHash);
  assert.deepEqual(next.redo, []);
  assert.notEqual(next.rows[0]._id, first.rows[0]._id);
  // Interrupted preparation may restart at zero; all identities stay stable.
  planner(unchanged, { operationId, index: 0 });
  assert.deepEqual(planner(step, { operationId, index: 1 }), first);
  for (const context of [{ operationId, index: 4 }, { operationId: randomUUID(), index: 2 }]) {
    assert.throws(() => planner(step, context), /plan-invalid/);
  }
  const foreign = { ...step, before: { ...step.before, boardId: 'other' }, after: { ...step.after, boardId: 'other' } };
  assert.throws(() => planner(foreign, { operationId, index: 2 }), /plan-invalid/);
  assert.deepEqual(planner(unchanged, { operationId, index: 2 }).rows, []);
});
