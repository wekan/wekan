'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('text join scans beyond one batch, matches all sources literally and restricts every child to authorized cards', { skip: !uri }, async t => {
  const { boardTextSearch } = await import('../../server/lib/boardTextSearch.js');
  const client = await new MongoClient(uri).connect();
  const db = client.db(`text_filter_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards');
  const children = ['comments', 'checklists', 'items'].map(name => ({ collection: db.collection(name), field: name === 'comments' ? 'text' : 'title' }));
  const term = '[Needle].*';
  await cards.insertMany(Array.from({ length: 501 }, (_, i) => ({ _id: String(i).padStart(4, '0'), boardId: 'board', archived: false,
    assignees: i === 7 ? [] : ['reader'], title: i === 500 ? term.toUpperCase() : 'Plain', description: i === 2 ? term : '' })));
  await cards.insertMany([{ _id: 'foreign', boardId: 'foreign', archived: false, title: term, assignees: ['reader'] },
    { _id: 'archived', boardId: 'board', archived: true, title: term, assignees: ['reader'] }]);
  for (const [i, { collection, field }] of children.entries()) await collection.insertMany([
    { cardId: `000${i + 3}`, boardId: 'board', [field]: term },
    { cardId: '0007', boardId: 'board', [field]: term },
    { cardId: 'foreign', boardId: 'board', [field]: term },
    { cardId: '0008', boardId: 'foreign', [field]: term },
    { cardId: '0009', boardId: 'board', [field]: 'Nxxdle anything' },
  ]);
  const args = { cards, children, term, scope: { boardId: 'board', archived: false, assignees: { $in: ['reader'] } } };
  assert.deepEqual((await boardTextSearch(args)).sort(), ['0002', '0003', '0004', '0005', '0500']);
  await children[0].collection.deleteMany({ cardId: '0003' });
  assert.ok(!(await boardTextSearch(args)).includes('0003'));
  assert.deepEqual(await boardTextSearch({ ...args, stopped: () => true }), []);
});
