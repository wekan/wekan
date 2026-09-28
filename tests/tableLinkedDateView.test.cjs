'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('table date views preserve identity without mutating cached cards or falling back to private dates', async () => {
  const { tableCardWithDates } = await import('../models/lib/tableViewFilter.js');
  const original = { _id: 'link', dueAt: new Date('2026-01-01'), getDue() { return this.dueAt; }, getRealId() { return this._id; } };
  const dueAt = new Date('2026-05-01');
  const view = tableCardWithDates(original, { dueAt });
  assert.equal(view.getRealId(), 'link'); assert.equal(view.getDue(), dueAt);
  assert.equal(original.getDue().toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(tableCardWithDates(original, { dueAt: null }).getDue(), null);
  assert.equal(tableCardWithDates(original).getDue(), original.dueAt);
});
test('partial linked-board metadata has no active members; full data still filters and deduplicates', () => {
  const source = fs.readFileSync('models/boards.js', 'utf8');
  const start = source.indexOf('  activeMembers(){') + '  activeMembers(){'.length;
  const body = source.slice(start, source.indexOf('\n  },', start));
  const active = new Function('Meteor', 'ReactiveCache', 'groupBy', body);
  const args = [{ isClient: true, users: { findOne() {} } },
    { getUser: id => ({ profile: { fullname: id } }) },
    rows => Object.groupBy(rows, row => row.userId)];
  assert.deepEqual(active.call({}, ...args), []);
  assert.deepEqual(active.call({ members: null }, ...args), []);
  const members = [{ userId: 'a', isActive: true }, { userId: 'a', isActive: true, isAdmin: true },
    { userId: 'b', isActive: false }, { userId: 'c', isActive: true }];
  assert.deepEqual(active.call({ members }, ...args), [members[1], members[3]]);
});
