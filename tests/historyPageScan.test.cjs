'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { scanHistoryPage } = require('../server/lib/historyPageScan');
// Exercise the actual shared paginator rather than a test copy of its rules.
const pageInfo = new Function(`${fs.readFileSync(require.resolve('../models/lib/tablePage.js'), 'utf8').replace(/export /g, '')}; return pageInfo;`)();
function fixture(count, page = 1) {
  let closed = 0, maxBatch = 0;
  const cursor = {
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < count; i++) yield { _id: String(i), userId: i % 2 ? 'odd' : 'even', index: i };
    },
    async close() { closed++; },
  };
  return { cursor, get closed() { return closed; }, get maxBatch() { return maxBatch; },
    args: { cursor, readable: async rows => { maxBatch = Math.max(maxBatch, rows.length); return rows; },
      matches: () => true, paginate: total => pageInfo(total, page, 10) } };
}
test('large scopes retain page semantics, exact totals and bounded permission batches', async () => {
  for (const page of [1, 12, 101, 999999, 0, Infinity]) {
    const f = fixture(1003, page); const result = await scanHistoryPage(f.args);
    const info = pageInfo(1003, page, 10);
    assert.equal(result.page, info.page); assert.equal(result.total, 1003);
    assert.deepEqual(result.rows.map(r => r.index), Array.from({ length: Math.min(10, 1003 - info.skip) }, (_, i) => info.skip + i));
    assert.deepEqual(result.contributors, [{ userId: 'even', count: 502 }, { userId: 'odd', count: 501 }]);
    assert.equal(f.maxBatch, 100); assert.equal(f.closed, 1);
  }
});
test('permissions precede search, contributors and pagination across batch boundaries', async () => {
  const f = fixture(403, 9); const seen = [];
  const result = await scanHistoryPage({ ...f.args,
    readable: async rows => rows.filter(r => r.index % 2 === 0),
    matches: row => { assert.equal(row.index % 2, 0); seen.push(row.index); return row.index % 4 === 0; },
  });
  assert.equal(result.total, 101); assert.equal(seen.length, 202);
  assert.deepEqual(result.contributors, [{ userId: 'even', count: 101 }]);
  assert.deepEqual(result.rows.map(r => r.index), Array.from({ length: 10 }, (_, i) => (80 + i) * 4));
});
test('empty scopes and exact final-page boundaries remain valid', async () => {
  for (const count of [0, 10, 20]) {
    const f = fixture(count, 999);
    const result = await scanHistoryPage(f.args);
    assert.equal(result.rows.length, count ? 10 : 0);
    assert.equal(result.page, count === 20 ? 2 : 1); assert.equal(f.closed, 1);
  }
});
test('cursor and permission failures close the cursor without returning partial results', async () => {
  for (const phase of ['cursor', 'permission', 'search']) {
    const f = fixture(210);
    if (phase === 'cursor') f.cursor[Symbol.asyncIterator] = async function* () { yield { index: 0 }; throw new Error('cursor failed'); };
    if (phase === 'permission') f.args.readable = async () => { throw new Error('permission failed'); };
    if (phase === 'search') f.args.matches = () => { throw new Error('search failed'); };
    await assert.rejects(scanHistoryPage(f.args), /failed/); assert.equal(f.closed, 1);
  }
});
