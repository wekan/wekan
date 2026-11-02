'use strict';

// #6853: the date popup has year, month and day drop-downs under the calendar,
// and month + year (never YYYY-MM-DD) above it. The lists come from the
// calendar itself, so they hold for every system WeKan offers.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const months = require('../imports/lib/calendarMonth');
const { nativeCalendarParts } = require('../imports/lib/calendarSystems');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const noon = (y, m, d) => new Date(y, m, d, 12);
const day = (date, calendar) => Number(nativeCalendarParts(date, calendar).day);

for (const calendar of ['gregory', 'persian', 'hebrew', 'islamic', 'japanese', 'chinese', 'roc', 'buddhist', 'coptic', 'ethiopic']) {
  const date = noon(2026, 10, 2);
  // Any year, near or far, past or future, by its number: it lands in that
  // year, on the same day of the year.
  assert.notEqual(months.calendarSignedYear(date, calendar), null, calendar);
  for (const year of [1, 0, -3000, 1500, 3000, 5000, 12000, ...(calendar === "gregory" ? [100000, 270000] : [])]) {
    const target = months.dateInCalendarYear(date, year, calendar);
    // Some calendars have no year before their era that a number can name (ROC,
    // Coptic, Ethiopic switch eras there; Japanese eras restart their count):
    // for them the year is refused, never guessed.
    const eraBound = ['roc', 'coptic', 'ethiopic', 'ethioaa'].includes(calendar) && year <= 1;
    if (eraBound || (calendar === 'japanese' && year >= 0 && year < 10)) {
      if (target) assert.equal(months.calendarSignedYear(target, calendar), year);
      continue;
    }
    assert.ok(target, `${calendar}: year ${year}`);
    assert.equal(months.calendarSignedYear(target, calendar), year, `${calendar}: year ${year}`);
  }
  // Beyond what a date holds, or not a whole number: refused, not wrong.
  for (const bad of [300000, -300000, 1.5, NaN, Infinity]) {
    assert.equal(months.dateInCalendarYear(date, bad, calendar), null, `${calendar}: ${bad}`);
  }
  // The months of the year: one selected, each a different month, in order,
  // and a pick keeps the day or falls to the month's last day.
  const list = months.calendarYearMonths(date, calendar);
  assert.ok(list.length >= 12 && list.length <= 13, `${calendar}: ${list.length} months`);
  assert.equal(list.filter(m => m.selected).length, 1);
  for (let i = 1; i < list.length; i += 1) assert.ok(list[i].date > list[i - 1].date);
  for (const month of list) {
    const target = months.sameDayInMonth(date, month.date, calendar);
    const range = months.calendarMonthRange(month.date, calendar);
    assert.ok(target >= range.start && target < range.end, `${calendar}: stays in the month it was picked from`);
    assert.equal(day(target, calendar), Math.min(day(date, calendar), Math.round((range.end - range.start) / 86400000)));
  }
}

// Gregorian: every month of 2027 is reachable, 31 January into February ends on
// its last day, and a leap day moved into a common year keeps its day of the year, as the year
// arrows do: 1 March.
{
  const list = months.calendarYearMonths(noon(2027, 0, 31), 'gregory');
  assert.equal(list.length, 12);
  assert.equal(months.sameDayInMonth(noon(2027, 0, 31), list[1].date, 'gregory').getDate(), 28);
  const common = months.dateInCalendarYear(noon(2028, 1, 29), 2027, 'gregory');
  assert.equal(common.getMonth(), 2);
  assert.equal(common.getDate(), 1);
  // 3000 BC is year -2999 here: 1 BC is 0.
  assert.equal(months.calendarSignedYear(months.dateInCalendarYear(noon(2026, 10, 2), -2999, 'gregory'), 'gregory'), -2999);
}

// Negative: the heading carries no YYYY-MM-DD, the year is never left out, and
// the drop-downs sit under the calendar and are wired to their own events.
{
  const jade = read('client/components/forms/calendarDateInput.jade');
  const js = read('client/components/forms/calendarDateInput.js');
  assert.doesNotMatch(jade, /selected-calendar-date|headingDateText/);
  assert.doesNotMatch(js, /headingDateText|inline \? \{\} : \{ year/);
  assert.match(jade, /input\.js-calendar-year\(type="number" step="1"/, 'the year is a number field, not a list that ends');
  assert.doesNotMatch(jade, /select\.js-calendar-year/);
  for (const name of ['js-calendar-year', 'js-calendar-month', 'js-calendar-day-select']) {
    if (name !== 'js-calendar-year') assert.match(jade, new RegExp(`select\\.${name}\\(aria-label`), `${name} is a select`);
    assert.match(js, new RegExp(`'change \\.${name}'`), `${name} has a handler`);
  }
  assert.doesNotMatch(read('client/components/forms/calendarDateInput.css'), /selected-calendar-date/);
}

console.log('calendarDropdowns: a year by number (thousands of years either way), month and day lists for ten calendar systems, picks that stay in the named year and month, and no date text in the heading');
