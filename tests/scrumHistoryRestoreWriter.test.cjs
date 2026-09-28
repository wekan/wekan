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

test('positive insert replies require the exact readable and valid persisted event', async () => {
  for (const corrupt of [null, row => { row.newContent = {}; }, row => { row.integrityHash = 'bad'; },
    row => { row._id = 'another-event'; }]) {
    const db = store();
    db.insertAsync = async row => {
      db.inserts++;
      if (corrupt) { const saved = structuredClone(row); corrupt(saved); db.rows.set(row._id, saved); }
      return row._id;
    };
    await assert.rejects(recordScrumRestoreOnce(db, options), corrupt ? /Conflicting/ : /Unconfirmed/);
    assert.equal(db.inserts, 1);
  }
});
test('failed post-insert reads remain pending and later retries reuse the persisted event', async () => {
  const db = store(); const find = db.findOneAsync.bind(db);
  db.findOneAsync = async query => {
    if (typeof query === 'string' && db.inserts) throw new Error('read unavailable');
    return find(query);
  };
  await assert.rejects(recordScrumRestoreOnce(db, options), /read unavailable/);
  assert.equal(db.rows.size, 1); const saved = structuredClone([...db.rows.values()][0]);
  db.findOneAsync = find;
  assert.equal(await recordScrumRestoreOnce(db, options), saved._id);
  assert.equal(db.inserts, 1); assert.deepEqual(db.rows.get(saved._id), saved);
});
test('an unavailable confirmation read preserves the original write failure', async () => {
  const db = store(); const find = db.findOneAsync.bind(db);
  const failure = new Error('insert unavailable');
  db.insertAsync = async () => { throw failure; };
  db.findOneAsync = async query => {
    if (typeof query === 'string') throw new Error('read unavailable');
    return find(query);
  };
  await assert.rejects(recordScrumRestoreOnce(db, options), error => error === failure);
  assert.equal(db.rows.size, 0);
});
test('restoration uses writer admission, preserves its stable ID and never falls back on rejection', async () => {
  const db = store(); let captured, calls = 0;
  db.withHistoryWriter = async ({ boardId, row, write, legacy }) => {
    calls++; captured = structuredClone(row);
    assert.equal(boardId, options.boardId);
    assert.equal(Object.hasOwn(row, 'previousHash'), false);
    return write(legacy);
  };
  const id = await recordScrumRestoreOnce(db, options);
  assert.equal(captured._id, id); assert.equal(calls, 1);
  await recordScrumRestoreOnce(db, options); assert.equal(calls, 1);
  db.withHistoryWriter = async () => { throw Error('migration busy'); };
  await assert.rejects(recordScrumRestoreOnce(db, { ...options, batchId: 'new' }), /migration busy/);
  assert.equal(db.inserts, 1);
});
test('lost legacy acknowledgements are verified within admission before releasing ownership', async () => {
  const db = store(); db.fail = 'after'; let confirmed = false;
  db.withHistoryWriter = async ({ write, legacy }) => {
    const result = await write(legacy);
    assert.ok(db.rows.has(result)); confirmed = true; return result;
  };
  await recordScrumRestoreOnce(db, options); assert.equal(confirmed, true);
  db.fail = 'before'; confirmed = false;
  await assert.rejects(recordScrumRestoreOnce(db, { ...options, batchId: 'missing' }), /unavailable/);
  assert.equal(confirmed, false);
});
