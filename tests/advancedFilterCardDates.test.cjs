'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../imports/lib/advancedFilter.js');
test('built-in fields share date boundaries, operators and missing-date guards', async () => {
  const m = await load(), resolvers = m.buildAdvancedFilterResolversFromCustomFields([]);
  const range = m.parseAdvancedFilterDate('2026-09-01');
  for (const field of ['createdAt', 'receivedAt', 'startAt', 'dueAt', 'endAt', 'listEnteredAt']) {
    for (const op of ['=', '==', '===', '!=', '!==', '>', 'gt', '>=', 'gte', '<', 'lt', '<=', 'lte']) {
      assert.deepEqual(m.advancedFilterStringToSelector(`@${field} ${op} '2026-09-01'`, resolvers),
        { $or: [{ [field]: { ...m.buildDateValueSelector(op, range), $type: 9, $ne: null, $exists: true } }] });
    }
    assert.deepEqual(m.advancedFilterStringToSelector(`@${field} = none`, resolvers), { $or: [{ [field]: null }] });
    assert.deepEqual(m.advancedFilterStringToSelector(`@${field} != none`, resolvers), { $or: [{ [field]: { $type: 9, $ne: null, $exists: true } }] });
  }
});
test('date expressions compose with custom fields, groups and negation without shadowing quoted names', async () => {
  const m = await load(), r = m.buildAdvancedFilterResolversFromCustomFields([{ _id: 'text', name: '@endAt', type: 'text' }]);
  const selector = m.advancedFilterStringToSelector("(@endAt >= '2026-09-01' or @endAt = none) and '@endAt' = done", r);
  assert.ok(selector.$or[0].$and[0].$or[0].endAt);
  assert.equal(selector.$or[0].$and[1].customFields.$elemMatch._id, 'text');
  assert.ok(m.advancedFilterStringToSelector("not @endAt < '2026-09-01'", r).$or[0].$nor);
});
test('unknown properties, malformed comparisons, impossible dates and regex values are rejected', async () => {
  const m = await load(), r = m.buildAdvancedFilterResolversFromCustomFields([]);
  for (const input of ["@password = none", "@__proto__ = none", "@endAt > none", "@endAt = /2026/", "@endAt = '2026-02-30'", "@endAt = 3", "@endAt =", "@endAt '==' none", "@endAt = none garbage"]) {
    assert.throws(() => m.advancedFilterStringToSelector(input, r), undefined, input);
  }
});
test('regional day-first settings apply to native dates as they do to custom-field dates', async () => {
  const m = await load(), r = m.buildAdvancedFilterResolversFromCustomFields([], { dayFirst: true });
  const query = m.advancedFilterStringToSelector("@ENDAT = '06/04/2026'", r);
  assert.equal(query.$or[0].endAt.$gte.getMonth(), 3);
  assert.equal(query.$or[0].endAt.$gte.getDate(), 6);
});
