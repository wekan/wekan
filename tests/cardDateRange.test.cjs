'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('calendar range covers both selected days and only accepts known date fields', async () => {
  const { cardDateRangeSelector: select, CARD_DATE_RANGE_FIELDS } = await import('../models/lib/cardDateRange.js');
  for (const { id } of CARD_DATE_RANGE_FIELDS) {
    assert.deepEqual(select({ field: id, from: '2026-09-01', to: '2026-09-02' }), {
      [id]: { $type: 9, $gte: new Date(2026, 8, 1), $lt: new Date(2026, 8, 3) },
    });
  }
  assert.equal(select({ field: 'password', from: '2026-09-01' }), null);
  for (const [from, to] of [['2026-02-30', ''], ['2026-09-03', '2026-09-02'], ['tomorrow', ''], ['', 'invalid']]) {
    assert.equal(select({ field: 'endAt', from, to }), null);
  }
});
test('open bounds, missing dates and clearing have explicit selectors', async () => {
  const { cardDateRangeSelector: select } = await import('../models/lib/cardDateRange.js');
  assert.deepEqual(select({ field: 'endAt', from: '2026-09-01' }), { endAt: { $type: 9, $gte: new Date(2026, 8, 1) } });
  assert.deepEqual(select({ field: 'endAt', to: '2026-09-01', includeMissing: true }), {
    $or: [{ endAt: { $type: 9, $lt: new Date(2026, 8, 2) } }, { endAt: null }],
  });
  assert.deepEqual(select({ field: 'endAt', includeMissing: true }), {});
});
test('Filter retains valid input after rejection, combines constraints and preserves the date range across boards', async () => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  Filter.reset();
  const value = { field: 'createdAt', from: '2026-09-01', to: '2026-09-02', includeMissing: false };
  assert.equal(Filter.dateRange.set(value), true);
  assert.equal(Filter.isActive(), true);
  assert.equal(Filter.dateRange.set({ ...value, to: '2026-08-01' }), false);
  assert.deepEqual(Filter.dateRange.value(), value);
  Filter.title.set('text'); Filter.columnAge.set('done', 30);
  assert.equal(Filter._getMongoSelector().$and.length, 3);
  Filter.resetBoardScoped();
  assert.deepEqual(Filter.dateRange.value(), value);
  assert.equal(Filter.columnAge._isActive(), false);
  Filter.reset(); assert.equal(Filter.isActive(), false);
});
