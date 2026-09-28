'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const DAY = 86400000;
test('recency selectors define inclusive rolling windows and a strict older cutoff', async () => {
  const { cardRecencySelector: select } = await import('../models/lib/cardDateRange.js');
  const now = new Date('2026-03-30T12:00:00Z');
  for (const field of ['createdAt', 'modifiedAt']) {
    for (const [preset, days] of [['day', 1], ['week', 7], ['month', 30]]) {
      assert.deepEqual(select({ [field]: preset }, now), {
        [field]: { $type: 9, $gte: new Date(+now - days * DAY), $lte: now },
      });
    }
    assert.deepEqual(select({ [field]: 'older' }, now), {
      [field]: { $type: 9, $lt: new Date(+now - 30 * DAY) },
    });
  }
  assert.deepEqual(select({}, now), {});
  for (const value of [null, [], { dueAt: 'week' }, { createdAt: 'invalid' }, { modifiedAt: 7 }]) {
    assert.equal(select(value, now), null);
  }
  assert.equal(select({}, new Date('invalid')), null);
});
test('real Filter combines recency fields, refreshes its shared clock and releases subscriptions', async () => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  const { timers } = await import('meteor/meteor');
  Filter.reset();
  assert.equal(Filter.dateRecency.set({ createdAt: 'week', modifiedAt: 'day' }), true);
  assert.equal(timers.size, 1);
  assert.equal(Filter.isActive(), true);
  const before = Filter.dateRecency.selector();
  assert.equal(+before.createdAt.$gte, +before.modifiedAt.$lte - 7 * DAY);
  const RealDate = global.Date;
  try {
    const later = +before.modifiedAt.$lte + DAY;
    global.Date = class extends RealDate {
      constructor(...args) { super(...(args.length ? args : [later])); }
    };
    for (const tick of timers.values()) tick();
    assert.equal(+Filter.dateRecency.selector().modifiedAt.$lte, later);
  } finally { global.Date = RealDate; }
  assert.equal(Filter.dateRecency.set({ createdAt: 'broken' }), false);
  assert.equal(Filter.dateRecency.value().createdAt, 'week');
  Filter.title.set('matching');
  Filter.dateRange.set({ field: 'dueAt', from: '2026-09-01' });
  Filter.columnAge.set('list', 30);
  assert.equal(Filter._getMongoSelector().$and.length, 4);
  assert.equal(timers.size, 1, 'column age shares the same timer');
  Filter.resetBoardScoped();
  assert.equal(Filter.dateRecency.value().modifiedAt, 'day');
  assert.equal(timers.size, 1);
  Filter.dateRecency.set({});
  assert.equal(timers.size, 0);
  Filter.dateRecency.set({ modifiedAt: 'older' });
  Filter.reset();
  assert.equal(timers.size, 0);
  assert.equal(Filter.isActive(), false);
});
