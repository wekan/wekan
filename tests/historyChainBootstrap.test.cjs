'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashHistoryRow } = require('../models/lib/changeHistoryIntegrity');
const { inspectHistoryChain: inspect, initializeHistoryChain: initialize } = require('../server/lib/historyChainBootstrap');
function event(id, previousHash = null, time = 1000) {
  const row = { _id: id, boardId: 'board', entityType: 'card', entityId: 'card', userId: 'actor',
    newContent: { field: 'title', value: id }, previousHash, createdAt: new Date(time) };
  row.integrityHash = hashHistoryRow(row); return row;
}
function fixture(rows) {
  let closed = 0, head;
  return { get closed() { return closed; }, get head() { return head; },
    options: { boardId: 'board', assertExclusive: async () => {},
      history: { find: selector => { assert.deepEqual(selector, { boardId: 'board' }); return {
        batchSize(n) { assert.equal(n, 250); return this; },
        async *[Symbol.asyncIterator]() { for (const row of rows) yield structuredClone(row); },
        async close() { closed++; },
      }; } },
      heads: { findOne: async () => structuredClone(head), insertOne: async row => { head = structuredClone(row); } } } };
}
test('bootstrap follows hash ancestry rather than reversed timestamps or cursor order', async () => {
  const a = event('a', null, 2000), b = event('b', a.integrityHash, 1000);
  const f = fixture([b, { _id: 'legacy', boardId: 'board' }, a]);
  assert.deepEqual(await inspect(f.options), { hash: b.integrityHash, rowCount: 2, legacyCount: 1 });
  assert.equal(f.closed, 1);
  const head = await initialize(f.options); assert.equal(head.hash, b.integrityHash);
  assert.equal(head.pending, null); assert.equal(head.pendingHash, null);
  assert.deepEqual(await initialize({ ...f.options, history: { find: () => assert.fail('must not reset existing head') } }), head);
});
test('empty and purely legacy boards start at null without rewriting legacy rows', async () => {
  for (const rows of [[], [{ _id: 'old', boardId: 'board', integrityHash: '' }]]) {
    const f = fixture(rows); assert.equal((await initialize(f.options)).hash, null);
    assert.ok(rows.every(row => !Object.hasOwn(row, 'previousHash')));
  }
});
test('forks, orphan predecessors, duplicate hashes and changed payloads prevent initialization', async () => {
  const a = event('a'), b = event('b', a.integrityHash), c = event('c', a.integrityHash);
  for (const rows of [[a, b, c], [b], [a, event('other-root')], [a, { ...a, _id: 'duplicate' }],
    [{ ...a, userId: 'tampered' }], [{ _id: 'legacy', boardId: 'board', previousHash: a.integrityHash }]]) {
    const f = fixture(rows); await assert.rejects(initialize(f.options));
    assert.equal(f.head, undefined); assert.equal(f.closed, 1);
  }
});
test('row/byte limits and ownership loss close the cursor without installing a head', async () => {
  const a = event('a'), b = event('b', a.integrityHash);
  for (const limits of [{ maxRows: 1 }, { maxBytes: 1 }]) {
    const f = fixture([a, b]); await assert.rejects(initialize({ ...f.options, ...limits }), /bootstrap-limit/);
    assert.equal(f.closed, 1); assert.equal(f.head, undefined);
  }
  const f = fixture([a]); let calls = 0;
  await assert.rejects(initialize({ ...f.options, assertExclusive: async () => { if (++calls === 4) throw Error('ownership lost'); } }), /ownership lost/);
  assert.equal(f.closed, 1); assert.equal(f.head, undefined);
});
test('lost insertion replies reconcile and false acknowledgement cannot install an imaginary head', async () => {
  const f = fixture([event('a')]), insert = f.options.heads.insertOne;
  f.options.heads.insertOne = async row => { await insert(row); throw Error('lost reply'); };
  assert.equal((await initialize(f.options)).hash, event('a').integrityHash);
  const g = fixture([]); g.options.heads.insertOne = async () => {};
  await assert.rejects(initialize(g.options), /bootstrap-unconfirmed/);
});
