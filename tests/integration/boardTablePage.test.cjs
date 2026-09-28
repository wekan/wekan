'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('table paging searches and sorts the complete scoped set without publishing all cards', { skip: !uri }, async t => {
  const { boardTablePage, validTablePageOptions } = await import('../../server/lib/boardTablePage.js');
  const client = await new MongoClient(uri).connect(), db = client.db(`table_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards'), lists = db.collection('lists'), swimlanes = db.collection('swimlanes');
  await lists.insertMany([{ _id: 'list', boardId: 'board', title: 'Target list', archived: false },
    { _id: 'hidden', boardId: 'board', archived: true }]);
  await swimlanes.insertOne({ _id: 'lane', boardId: 'board', title: 'Lane', sort: 0, archived: false });
  await cards.insertMany(Array.from({ length: 5003 }, (_, i) => ({ _id: `c${i}`, title: `Card ${i}`,
    boardId: i === 5002 ? 'foreign' : 'board', listId: i === 5001 ? 'hidden' : 'list', swimlaneId: 'lane',
    archived: false, assignees: i % 2 ? ['reader'] : [], labelIds: i === 5000 ? ['urgent'] : [],
    dueAt: new Date(1700000000000 + i * 1000) })));
  const options = { query: '', page: 2, sortField: 'title', direction: 'asc', group: false };
  const base = { cards, lists, swimlanes, board: { _id: 'board', labels: [{ _id: 'urgent', name: 'Needle' }] },
    scope: { boardId: 'board', archived: false }, selector: {}, options };
  const result = await boardTablePage(base);
  assert.equal(result.total, 5001); assert.equal(result.cards.length, 25);
  assert.equal(result.ids[0], 'c25'); assert.equal(result.ids.at(-1), 'c49');
  assert.equal((await boardTablePage({ ...base, options: { ...options, page: 999 } })).page, 201);
  const named = await boardTablePage({ ...base, options: { ...options, query: 'Needle' } });
  assert.deepEqual(named.ids, ['c5000']); assert.equal(named.page, 1);
  const date = await boardTablePage({ ...base, options: { ...options, page: 1, sortField: 'dueAt', direction: 'desc' } });
  assert.equal(date.ids[0], 'c5000');
  const assigned = await boardTablePage({ ...base, scope: { ...base.scope, assignees: { $in: ['reader'] } } });
  assert.equal(assigned.total, 2500); assert.ok(assigned.cards.every(card => card.assignees.includes('reader')));
  const denied = await boardTablePage({ ...base, selector: { boardId: 'foreign' } });
  assert.equal(denied.total, 0); assert.deepEqual(denied.cards, []);
  assert.equal(validTablePageOptions(options), true);
  for (const bad of [{ page: 0 }, { page: Infinity }, { sortField: '$where' }, { query: 'x'.repeat(513) }, { extra: 1 }]) {
    assert.equal(validTablePageOptions({ ...options, ...bad }), false);
  }
});
