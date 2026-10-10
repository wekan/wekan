'use strict';
// #3194: Calendar Mode, Trello's calendar. Each card is shown on the day it is
// due - the date only, no time - with its labels and its whole title, and the
// cards of a day are in the board's own order: by their list's place, then by
// their place in the list. A month or a week, starting on the user's first
// day of the week.
//
// Dates are local calendar days. Pure: tests/calendarMode.test.cjs.

const RANGES = ['month', 'week'];

const pad = n => String(n).padStart(2, '0');
// The local calendar day of a date, as YYYY-MM-DD.
function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const atMidnight = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// The first day of the week holding `date`, the week starting on `firstDay`
// (0 = Sunday ... 6 = Saturday).
function startOfWeek(date, firstDay = 1) {
  const day = atMidnight(date);
  const back = (day.getDay() - (Number.isInteger(firstDay) ? ((firstDay % 7) + 7) % 7 : 1) + 7) % 7;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - back);
}

// The days shown: whole weeks covering the anchor's month, or the anchor's
// week. Returns { start, end (exclusive), weeks: [[day]] } where a day is
// { key, date, dayOfMonth, inRange, isToday }.
function calendarModeDays({ anchor = new Date(), range = 'month', firstDay = 1, today = new Date() } = {}) {
  const view = RANGES.includes(range) ? range : 'month';
  const base = atMidnight(anchor);
  const first = view === 'month' ? new Date(base.getFullYear(), base.getMonth(), 1) : base;
  const start = startOfWeek(first, firstDay);
  const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const todayKey = dayKey(today);
  const weeks = [];
  let cursor = start;
  do {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i);
      week.push({
        key: dayKey(date),
        date,
        dayOfMonth: date.getDate(),
        inRange: view === 'week' || date.getMonth() === base.getMonth(),
        isToday: dayKey(date) === todayKey,
      });
    }
    weeks.push(week);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  } while (view === 'month' && cursor < monthEnd && weeks.length < 6);
  return { start, end: cursor, weeks };
}

// The next or previous month or week from `anchor`.
function shiftAnchor(anchor, range, step) {
  const base = atMidnight(anchor);
  if (range === 'week') return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7 * step);
  return new Date(base.getFullYear(), base.getMonth() + step, 1);
}

// Cards by the local day they are due, each day in the board's order: the
// list's sort, then the card's sort, then its title. `listSort`: listId -> the
// list's sort; a card whose list is unknown comes last.
function cardsByDueDay(cards, listSort = {}) {
  const days = new Map();
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!card || !card.dueAt) continue;
    const key = dayKey(card.dueAt);
    if (!key) continue;
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(card);
  }
  const num = value => (Number.isFinite(value) ? value : Number.POSITIVE_INFINITY);
  for (const list of days.values()) {
    list.sort((a, b) => num(listSort[a.listId]) - num(listSort[b.listId])
      || num(a.sort) - num(b.sort)
      || String(a.title || '').localeCompare(String(b.title || '')));
  }
  return days;
}

module.exports = { RANGES, dayKey, startOfWeek, calendarModeDays, shiftAnchor, cardsByDueDay };
