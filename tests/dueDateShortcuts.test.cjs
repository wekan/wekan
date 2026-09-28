'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('previous-week boundaries honor every week start and next month avoids end-of-month rollover', async () => {
  const { dueDateShortcut: select } = await import('../models/lib/dueDateShortcuts.js');
  const at = new Date(2026, 8, 28, 14);
  for (let first = 0; first < 7; first++) {
    const range = select('previousweek', at, first);
    assert.equal(range.$gte.getDay(), first);
    assert.equal(range.$gte.getHours(), 0);
    assert.equal(range.$lte.getHours(), 23);
    const current = new Date(range.$gte); current.setDate(current.getDate() + 7);
    assert.ok(+current <= +at);
    const next = new Date(current); next.setDate(next.getDate() + 7);
    assert.ok(+next > +at);
  }
  for (const [year, month, expectedYear, expectedMonth] of [[2026, 0, 2026, 1], [2028, 0, 2028, 1], [2026, 11, 2027, 0]]) {
    const result = select('nextmonth', new Date(year, month, 31, 23, 59));
    assert.deepEqual(result, { $type: 9, $gte: new Date(expectedYear, expectedMonth, 1), $lt: new Date(expectedYear, expectedMonth + 1, 1) });
  }
  assert.equal(select('unknown', at), null);
  assert.equal(select('nextmonth', new Date('invalid')), null);
});
test('actual DateFilter switches and toggles presets, refreshes at rollover and releases its shared clock', async t => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  const { ReactiveCache } = await import('/imports/reactiveCache');
  const { timers } = await import('meteor/meteor');
  let first = 1;
  ReactiveCache.getCurrentUser = () => ({ getStartDayOfWeek: () => first });
  const originalRequire = global.require;
  global.require = id => {
    assert.equal(id, '/client/features/sidebar/service');
    return { getSidebarInstance: () => ({ setView() {} }) };
  };
  t.after(() => { global.require = originalRequire; });
  Filter.reset(); Filter.dueAt.previousWeek();
  assert.equal(Filter.dueAt.isSelected('previousweek'), true);
  assert.equal(Filter.dueAt._getMongoSelector().$gte.getDay(), 1);
  first = 0; assert.equal(Filter.dueAt._getMongoSelector().$gte.getDay(), 0);
  Filter.dueAt.nextMonth(); assert.equal(timers.size, 1);
  const RealDate = Date;
  try {
    const instant = new RealDate(2026, 11, 31, 23, 59);
    global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [instant])); } };
    for (const tick of timers.values()) tick();
    assert.equal(Filter.dueAt._getMongoSelector().$gte.getFullYear(), 2027);
    instant.setDate(32);
    for (const tick of timers.values()) tick();
    assert.equal(Filter.dueAt._getMongoSelector().$gte.getMonth(), 1);
  } finally { global.Date = RealDate; }
  Filter.dueAt.nextMonth(); assert.equal(Filter.dueAt._isActive(), false); assert.equal(timers.size, 0);
  Filter.dueAt.previousWeek(); Filter.dueAt.noDate(); assert.equal(timers.size, 0);
  assert.equal(Filter.dueAt._getMongoSelector(), null);
  Filter.dueAt.nextMonth(); Filter.reset(); assert.equal(timers.size, 0);
});
