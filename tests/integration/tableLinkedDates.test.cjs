'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('linked table dates follow authorized sources and detect changes before publication', { skip: !uri }, async t => {
  const { prepareTableLinkedDates } = await import('../../server/lib/tableLinkedDates.js');
  const client = await new MongoClient(uri).connect(), db = client.db(`linked_dates_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards'), boards = db.collection('boards');
  const date = new Date('2026-09-01T12:30:00Z');
  const allDates = Object.fromEntries(['receivedAt', 'startAt', 'dueAt', 'endAt'].map(field => [field, date]));
  await boards.insertMany([{ _id: 'allowed', permission: 'private', members: [{ userId: 'reader', isActive: true }], ...allDates },
    { _id: 'private', permission: 'private', members: [], dueAt: date }]);
  await cards.insertMany([{ _id: 'source', boardId: 'allowed', ...allDates, archived: false, assignees: [] },
    { _id: 'secret', boardId: 'private', dueAt: date, archived: false },
    ...[['card', 'source', 'cardType-linkedCard'], ['denied', 'secret', 'cardType-linkedCard'],
      ['board', 'allowed', 'cardType-linkedBoard'], ['denied-board', 'private', 'cardType-linkedBoard'],
      ['missing', 'missing', 'cardType-linkedCard']].map(([_id, linkedId, type]) => ({ _id, linkedId, type, boardId: 'local', archived: false }))]);
  const watches = [];
  const model = collection => ({ rawCollection: () => collection,
    find: (selector, { fields }) => ({ selector, fields, fetchAsync: () => collection.find(selector, { projection: fields }).toArray() }) });
  const prepare = () => prepareTableLinkedDates({ Cards: model(cards), Boards: model(boards), scope: { boardId: 'local', archived: false },
    userId: 'reader', canReadBoard: (userId, board) => board.permission === 'public' || board.members.some(m => m.userId === userId && m.isActive),
    watch: async (name, key, cursor) => { watches.push({ name, key, selector: cursor.selector }); } });
  const rows = await cards.find({ boardId: 'local' }).toArray();
  const prepared = await prepare();
  for (const row of rows) {
    for (const field of Object.keys(allDates)) {
      assert.deepEqual(prepared.dates(row)[field], ['card', 'board'].includes(row._id) ? date : null, `${row._id}.${field}`);
    }
  }
  assert.deepEqual(prepared.dates({ type: 'cardType-card', dueAt: date }).dueAt, date);
  assert.equal(await prepared.isCurrent(), true);
  assert.ok(watches[0].selector._id.$in.includes('missing'), 'observe a missing target so later creation can refresh');
  await cards.updateOne({ _id: 'source' }, { $set: { dueAt: new Date('2026-10-01') } });
  assert.equal(await prepared.isCurrent(), false, 'catch a source edit even before observer delivery');
  const changed = await prepare();
  await boards.updateOne({ _id: 'allowed' }, { $set: { members: [] } });
  assert.equal(await changed.isCurrent(), false, 'catch revoked access even before observer delivery');
  const denied = await prepare();
  assert.equal(denied.dates(rows.find(row => row._id === 'card')).dueAt, null);
  await boards.updateOne({ _id: 'allowed' }, { $set: { members: [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }] } });
  assert.equal((await prepare()).dates(rows.find(row => row._id === 'card')).dueAt, null);
  await cards.updateOne({ _id: 'source' }, { $set: { assignees: ['reader'] } });
  assert.ok((await prepare()).dates(rows.find(row => row._id === 'card')).dueAt instanceof Date);
  const assigned = await prepare();
  await cards.updateOne({ _id: 'source' }, { $set: { boardId: 'private' } });
  assert.equal(await assigned.isCurrent(), false, 'moving a source invalidates its captured board policy');
  assert.equal((await prepare()).dates(rows.find(row => row._id === 'card')).dueAt, null);
  await cards.updateOne({ _id: 'source' }, { $set: { boardId: 'allowed', archived: true } });
  assert.equal((await prepare()).dates(rows.find(row => row._id === 'card')).dueAt, null);
});
