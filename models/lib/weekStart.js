'use strict';

// Shared week-start / week-number math that respects the user's configured
// "start day of week" (0 = Sunday .. 6 = Saturday, matching JS Date.getDay()
// and the Users.getStartDayOfWeek() setting). Meteor-free so it can be unit
// tested with plain Node.
//
// Used by:
//  - #4881 ("duedate filter & week number"): the "Due this week" / "Due next
//    week" date filter in client/lib/filter.js. The old code computed the
//    window from `startOf(date, 'week')`, but the native dateUtils.startOf()
//    has NO `case 'week'`, so it returned the date unchanged and the window
//    started at "today + startDayOfWeek" — i.e. it selected NEXT week's cards
//    for "this week". It also ignored which weekday the user starts on.
//  - #4946 ("Is week numbers respecting defined start day of week?"): the
//    calendar-view week-number column, which used FullCalendar's locale default
//    and numbered weeks from Sunday regardless of the configured start day.

// Local midnight of `date`, as a new Date (does not mutate the input).
function atMidnight(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

// A UTC-based day index for `date`'s calendar day. Used for day counting so the
// arithmetic is immune to daylight-saving-time hour shifts.
function utcDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
}

// Normalize a start-day-of-week setting to an integer 0..6 (default Monday = 1).
// null / undefined / '' fall back to the default rather than coercing to 0
// (Number(null) === 0 would otherwise silently mean Sunday).
function normalizeFirstDay(firstDay) {
  if (firstDay === null || firstDay === undefined || firstDay === '') return 1;
  const n = Number(firstDay);
  if (!Number.isFinite(n)) return 1;
  return ((Math.trunc(n) % 7) + 7) % 7;
}

// The most recent `firstDay` weekday at 00:00 on or before `date` — the first
// day of the week that contains `date`, for an arbitrary week start.
function startOfWeek(date, firstDay) {
  const fd = normalizeFirstDay(firstDay);
  const d = atMidnight(date);
  const delta = (d.getDay() - fd + 7) % 7;
  d.setDate(d.getDate() - delta);
  return d;
}

// { start, end } Date pair for the week `weekOffset` weeks from the week that
// contains `date` (0 = this week, 1 = next week). `start` is 00:00 of the
// week's first day; `end` is 23:59:59.999 of its last day.
function weekRange(date, firstDay, weekOffset = 0) {
  const start = startOfWeek(date, firstDay);
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Week number aligned to `firstDay`: week 1 is the week (starting on firstDay)
// that contains January 1st, and the number increments on each firstDay. This
// generalizes the already-correct Sunday-start behavior to any start day, so
// the number shown matches the way the week grid is laid out.
function weekNumberByFirstDay(date, firstDay) {
  const d = atMidnight(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const firstWeekStart = startOfWeek(jan1, firstDay);
  const diffDays = utcDayNumber(d) - utcDayNumber(firstWeekStart);
  return Math.floor(diffDays / 7) + 1;
}

module.exports = {
  normalizeFirstDay,
  startOfWeek,
  weekRange,
  weekNumberByFirstDay,
};
