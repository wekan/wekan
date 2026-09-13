'use strict';
const assert = require('node:assert/strict');
const { monthRangeProfile } = require('../packages/wekan-fullcalendar/monthRange');
class Base {
  buildRenderRange(range) { return range; }
}
const Profile = monthRangeProfile(Base, (date, weeks) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + 7 * weeks);
  return result;
});
for (const firstDay of [0, 1, 6]) {
  const profile = new Profile();
  profile.props = { dateEnv: { startOfWeek: date => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() - (result.getUTCDay() - firstDay + 7) % 7);
    return result;
  } } };
  for (const length of [29, 30, 31]) {
    const start = new Date('2026-04-21T00:00:00Z');
    const end = new Date(start.getTime() + length * 86400000);
    const range = { start, end };
    const result = profile.buildRenderRange(range, 'day', true);
    assert.equal(result.start.getUTCDay(), firstDay);
    assert.equal(result.end.getUTCDay(), firstDay);
    assert.ok(result.start <= start && result.end >= end);
    assert.ok(start - result.start < 7 * 86400000);
    assert.ok(result.end - end < 7 * 86400000);
    assert.equal(range.start.toISOString(), '2026-04-21T00:00:00.000Z');
    assert.equal(range.end.getTime(), start.getTime() + length * 86400000);
  }
}
const original = new Base();
const nativeRange = { start: new Date('2026-04-21'), end: new Date('2026-04-22') };
assert.equal(original.buildRenderRange(nativeRange), nativeRange,
  'ordinary day/week profiles must remain unchanged');
console.log('calendarMonthWeekAlignment: 29/30/31-day months align every supported week start without changing native ranges');
