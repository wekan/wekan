const { test } = require('node:test');
const assert = require('node:assert/strict');
const { recordScrumRestoreOnce } = require('../server/lib/scrumHistoryRestoreWriter');
const { hashHistoryRow, rowHashIsValid } = require('../models/lib/changeHistoryIntegrity');
const options = { boardId: 'board', batchId: 'operation', userId: 'author',
  entityType: 'scrum', entityId: 'card', changeType: 'restored',
  restoredFromId: 'original', restoredByUserId: 'editor', isCheckpoint: true,
  previousContent: { records: [] }, newContent: { records: [{ date: new Date(0) }] } };
function store() {
  const rows = new Map();
  return { rows, inserts: 0, fail: null,
    async findOneAsync(query) {
      if (typeof query === 'string') return rows.get(query);
      if (query.batchId) return [...rows.values()].find(row =>
        ['boardId', 'batchId', 'userId'].every(key => query[key] === row[key]));
      return [...rows.values()].at(-1);
    },
    async insertAsync(row) {
      this.inserts++;
      if (this.fail === 'before') throw new Error('unavailable');
      if (rows.has(row._id)) throw new Error('duplicate');
      rows.set(row._id, structuredClone(row));
      if (this.fail === 'after') throw new Error('acknowledgement lost');
      return row._id;
    },
  };
}
test('restore retries retain the original row, timestamp and integrity chain', async () => {
  const db = store();
  const id = await recordScrumRestoreOnce(db, options);
  const snapshot = structuredClone(db.rows.get(id));
  db.rows.get(id).undone = true; // mutable undo flags do not change event identity
  assert.equal(await recordScrumRestoreOnce(db, options), id);
  assert.equal(db.inserts, 1);
  assert.deepEqual(db.rows.get(id).createdAt, snapshot.createdAt);
  assert.equal(db.rows.get(id).integrityHash, snapshot.integrityHash);
  assert.ok(rowHashIsValid(db.rows.get(id)));
});
test('lost acknowledgements and concurrent inserts produce one event', async () => {
  const db = store(); db.fail = 'after';
  const ids = await Promise.all([recordScrumRestoreOnce(db, options), recordScrumRestoreOnce(db, options)]);
  assert.equal(ids[0], ids[1]); assert.equal(db.rows.size, 1);
});
test('uncommitted errors propagate so callers retain recovery evidence', async () => {
  const db = store(); db.fail = 'before';
  await assert.rejects(recordScrumRestoreOnce(db, options), /unavailable/);
  assert.equal(db.rows.size, 0);
});
test('legacy random IDs are accepted only with exact intact event contents', async () => {
  const db = store(); const id = await recordScrumRestoreOnce(db, options);
  const row = db.rows.get(id); db.rows.delete(id); row._id = 'legacy'; db.rows.set('legacy', row);
  assert.equal(await recordScrumRestoreOnce(db, options), 'legacy');
  await assert.rejects(recordScrumRestoreOnce(db, { ...options, newContent: {} }), /Conflicting/);
  row.newContent = {}; // even matching altered data must pass its original hash
  await assert.rejects(recordScrumRestoreOnce(db, { ...options, newContent: {} }), /Conflicting/);
  row.integrityHash = hashHistoryRow(row);
  await assert.rejects(recordScrumRestoreOnce(db, options), /Conflicting/);
  assert.equal(db.inserts, 1);
});
test('authors and operations have independent identities; malformed identities fail before writes', async () => {
  const db = store();
  const first = await recordScrumRestoreOnce(db, options);
  const second = await recordScrumRestoreOnce(db, { ...options, userId: 'editor' });
  const third = await recordScrumRestoreOnce(db, { ...options, batchId: 'next' });
  assert.equal(new Set([first, second, third]).size, 3);
  assert.equal(db.rows.get(second).previousHash, db.rows.get(first).integrityHash);
  for (const patch of [{ batchId: { $ne: null } }, { userId: '' }, { changeType: 'edited' }]) {
    await assert.rejects(recordScrumRestoreOnce(db, { ...options, ...patch }), /Invalid/);
  }
  assert.equal(db.inserts, 3);
});
