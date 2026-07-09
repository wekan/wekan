'use strict';

// Plain-Node unit test (no Meteor) for the start-day-of-week math.
// Run: node tests/weekStart.test.cjs
//
// Regression guard for:
//  - #4881 ("duedate filter & week number"): the "Due this week" / "Due next
//    week" filter selected the WRONG week. The old filter derived its window
//    from startOf(date, 'week'), but the native dateUtils.startOf() has no
//    `case 'week'`, so it returned the date unchanged and the window began at
//    "today + startDayOfWeek" — next week's cards showed for "this week". It
//    also ignored the configured start weekday.
//  - #4946 ("Is week numbers respecting defined start day of week?"): week
//    numbers were computed Sunday-anchored regardless of the setting.

const assert = require('assert');
const {
  normalizeFirstDay,
  startOfWeek,
  weekRange,
  weekNumberByFirstDay,
} = require('../models/lib/weekStart');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Wednesday 2023-06-07.
const WED = new Date(2023, 5, 7, 15, 30, 0);

// --- normalizeFirstDay -------------------------------------------------------
test('normalizeFirstDay defaults to Monday (1) for junk', () => {
  assert.strictEqual(normalizeFirstDay(undefined), 1);
  assert.strictEqual(normalizeFirstDay(null), 1);
  assert.strictEqual(normalizeFirstDay('nonsense'), 1);
});

test('normalizeFirstDay accepts 0..6 and wraps out-of-range', () => {
  assert.strictEqual(normalizeFirstDay(0), 0);
  assert.strictEqual(normalizeFirstDay('6'), 6);
  assert.strictEqual(normalizeFirstDay(7), 0);
  assert.strictEqual(normalizeFirstDay(-1), 6);
});

// --- startOfWeek: POSITIVE ---------------------------------------------------
test('Monday-start: week of Wed 2023-06-07 begins Mon 2023-06-05', () => {
  assert.strictEqual(ymd(startOfWeek(WED, 1)), '2023-06-05');
});

test('Sunday-start: same Wednesday begins Sun 2023-06-04', () => {
  assert.strictEqual(ymd(startOfWeek(WED, 0)), '2023-06-04');
});

test('Saturday-start: same Wednesday begins Sat 2023-06-03', () => {
  assert.strictEqual(ymd(startOfWeek(WED, 6)), '2023-06-03');
});

test('startOfWeek is set to local midnight', () => {
  const s = startOfWeek(WED, 1);
  assert.strictEqual(s.getHours(), 0);
  assert.strictEqual(s.getMinutes(), 0);
  assert.strictEqual(s.getSeconds(), 0);
});

// --- weekRange: POSITIVE + the #4881 core regression -------------------------
test('this week (Monday-start) around Wed = Mon..Sun containing the day', () => {
  const { start, end } = weekRange(WED, 1, 0);
  assert.strictEqual(ymd(start), '2023-06-05');
  assert.strictEqual(ymd(end), '2023-06-11');
});

test('next week (Monday-start) = the following Mon..Sun', () => {
  const { start, end } = weekRange(WED, 1, 1);
  assert.strictEqual(ymd(start), '2023-06-12');
  assert.strictEqual(ymd(end), '2023-06-18');
});

test('week end is the last day at 23:59:59.999', () => {
  const { end } = weekRange(WED, 1, 0);
  assert.strictEqual(end.getHours(), 23);
  assert.strictEqual(end.getMinutes(), 59);
  assert.strictEqual(end.getSeconds(), 59);
});

test('NEGATIVE: "this week" must CONTAIN today, not start after it (#4881)', () => {
  // The broken code produced a window that began at today+startDay (next week).
  // Guard: today must fall within [start, end] of the "this week" range.
  const { start, end } = weekRange(WED, 1, 0);
  assert.ok(start <= WED && WED <= end, '"this week" must include today');
});

test('NEGATIVE: this-week and next-week windows do not overlap and are adjacent', () => {
  const thisW = weekRange(WED, 1, 0);
  const nextW = weekRange(WED, 1, 1);
  assert.ok(thisW.end < nextW.start, 'this week ends before next week starts');
  // exactly one day (the boundary) between end-of-this 23:59 and start-of-next 00:00
  const gapMs = nextW.start - thisW.end;
  assert.ok(gapMs > 0 && gapMs < 2 * 3600 * 1000, 'windows are adjacent');
});

test('NEGATIVE: a day ON the week-start boundary belongs to that week, not the previous one', () => {
  // Sunday 2023-06-11 with Sunday-start must begin its OWN week (06-11), not 06-04.
  const sunday = new Date(2023, 5, 11, 9, 0, 0);
  assert.strictEqual(ymd(startOfWeek(sunday, 0)), '2023-06-11');
});

// --- weekNumberByFirstDay: #4946 ---------------------------------------------
test('week number respects the start day (Jan 1 2023 is a Sunday)', () => {
  // Sunday-start: Jan 1 2023 (Sunday) is week 1; Jan 8 is week 2.
  assert.strictEqual(weekNumberByFirstDay(new Date(2023, 0, 1), 0), 1);
  assert.strictEqual(weekNumberByFirstDay(new Date(2023, 0, 8), 0), 2);
});

test('NEGATIVE: start day changes the number for Saturday 2023-01-07 (#4946)', () => {
  // Jan 1 2023 is a Sunday. For Saturday 2023-01-07:
  //   Sunday-start  -> same week as Jan 1 -> week 1
  //   Monday-start  -> week began Dec 26 2022 -> week 2
  // The number MUST track the configured start day; a Sunday-anchored constant
  // (the #4946 bug) would report the same value for both.
  const satJan7 = new Date(2023, 0, 7, 12, 0, 0);
  assert.strictEqual(weekNumberByFirstDay(satJan7, 0), 1);
  assert.strictEqual(weekNumberByFirstDay(satJan7, 1), 2);
});

console.log(`\n${passed} tests passed`);
