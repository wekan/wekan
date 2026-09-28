'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('movement bounds preserve exact wire instants and reject invalid or empty ranges', async () => {
  const { cardMovementRange: range } = await import('../models/lib/cardMovementRange.js');
  assert.deepEqual(range(0, 1000), { $type: 9, $gte: new Date(0), $lt: new Date(1000) });
  assert.deepEqual(range(null, 1000), { $type: 9, $lt: new Date(1000) });
  assert.deepEqual(range(0, null), { $type: 9, $gte: new Date(0) });
  for (const [start, end] of [[null, null], [1, 1], [2, 1], [NaN, 1], [Infinity, null], ['0', 1], [0.5, 1], [8640000000000001, null]]) {
    assert.equal(range(start, end), null);
  }
});
test('movement filtering combines with text, preserves valid bounds, survives board changes and clears', async () => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  Filter.reset();
  const range = { field: 'createdAt', from: '2026-09-01', to: '2026-09-02', includeMissing: false };
  assert.equal(Filter.movementDate.set(range), true);
  assert.equal(Filter.movementDate.set({ ...range, to: '2026-08-01' }), false);
  assert.equal(Filter.isActive(), true);
  assert.deepEqual(Filter._getMongoSelector(), { _id: { $in: ['2026-09-01'] } });
  Filter.text.set('term'); assert.equal(Filter._getMongoSelector().$and.length, 2);
  Filter.resetBoardScoped(); assert.deepEqual(Filter.movementDate.value(), range);
  Filter.reset(); assert.equal(Filter.isActive(), false);
});
