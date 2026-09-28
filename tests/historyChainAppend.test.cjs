'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { appendHistoryChain: append } = require('../server/lib/historyChainAppend');
const { canonical, rowHashIsValid } = require('../models/lib/changeHistoryIntegrity');
function fixture() {
  const headRows = new Map(), rows = new Map();
  const storage = map => ({ findOne: async ({ _id }) => structuredClone(map.get(_id)),
    insertOne: async row => { if (map.has(row._id)) throw Error('duplicate'); map.set(row._id, structuredClone(row)); },
    replaceOne: async (query, row) => {
      const current = map.get(query._id);
      if (!current || !Object.entries(query).every(([key, value]) =>
        canonical(current[key]) === canonical(value && typeof value === 'object' && '$eq' in value ? value.$eq : value))) return { matchedCount: 0 };
      map.set(row._id, structuredClone(row)); return { matchedCount: 1 };
    } });
  const row = id => ({ _id: id, boardId: 'board', entityType: 'card', entityId: 'card', userId: 'actor',
    group: 'title', changeType: 'edited', previousContent: { field: 'title', value: 'before' },
    newContent: { field: 'title', value: id }, createdAt: new Date(1000), isCheckpoint: false });
  return { headRows, rows, row, options: { heads: storage(headRows), history: storage(rows), initialHash: null, assertCurrent: async () => {} } };
}
test('concurrent appenders form one chain despite identical timestamps and replay by ID', async () => {
  const f = fixture();
  await Promise.all(Array.from({ length: 12 }, (_, i) => append({ ...f.options, row: f.row(`row-${i}`) })));
  assert.equal(f.rows.size, 12);
  const successor = new Map();
  for (const row of f.rows.values()) { assert.ok(rowHashIsValid(row)); assert.ok(!successor.has(row.previousHash)); successor.set(row.previousHash, row.integrityHash); }
  let head = null, count = 0; while (successor.has(head)) { head = successor.get(head); count++; }
  assert.equal(count, 12); assert.equal([...f.headRows.values()][0].hash, head);
  assert.equal(await append({ ...f.options, row: f.row('row-0') }), 'row-0'); assert.equal(f.rows.size, 12);
});
test('another writer finishes a crash after pending reservation before appending its own row', async () => {
  const f = fixture(), insert = f.options.history.insertOne;
  f.options.history.insertOne = async () => { throw Error('storage offline'); };
  await assert.rejects(append({ ...f.options, row: f.row('first') }), /storage offline/);
  assert.equal([...f.headRows.values()][0].pending._id, 'first'); assert.equal(f.rows.size, 0);
  f.options.history.insertOne = insert;
  await append({ ...f.options, row: f.row('second') });
  assert.equal(f.rows.get('second').previousHash, f.rows.get('first').integrityHash);
});
test('lost head and row acknowledgements reconcile; false writes retain pending evidence', async () => {
  const f = fixture(), replace = f.options.heads.replaceOne, insert = f.options.history.insertOne;
  f.options.heads.replaceOne = async (...args) => { await replace(...args); throw Error('lost head reply'); };
  f.options.history.insertOne = async row => { await insert(row); throw Error('lost row reply'); };
  await append({ ...f.options, row: f.row('first') }); assert.equal(f.rows.size, 1);
  const g = fixture(); g.options.history.insertOne = async () => {};
  await assert.rejects(append({ ...g.options, row: g.row('first') }), /row-unconfirmed/);
  assert.equal([...g.headRows.values()][0].pending._id, 'first');
});
test('changed replay payload and corrupt pending evidence cannot advance the head', async () => {
  const f = fixture(); await append({ ...f.options, row: f.row('first') });
  await assert.rejects(append({ ...f.options, row: { ...f.row('first'), userId: 'other' } }), /row-conflict/);
  const head = [...f.headRows.values()][0]; head.pending = { ...f.rows.get('first'), previousHash: head.hash };
  await assert.rejects(append({ ...f.options, row: f.row('second') }), /(?:head|row)-invalid/);
  assert.equal(f.rows.size, 1);
});
test('ownership loss after reservation prevents row insertion but permits later recovery', async () => {
  const f = fixture(), replace = f.options.heads.replaceOne; let current = true;
  f.options.assertCurrent = async () => { if (!current) throw Error('ownership lost'); };
  f.options.heads.replaceOne = async (...args) => { const result = await replace(...args); current = false; return result; };
  await assert.rejects(append({ ...f.options, row: f.row('first') }), /ownership lost/); assert.equal(f.rows.size, 0);
  current = true; f.options.heads.replaceOne = replace;
  await append({ ...f.options, row: f.row('first') }); assert.equal(f.rows.size, 1);
});
