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
  const years = months.calendarYearOptions(date, calendar);
  assert.ok(years.length >= 190, `${calendar}: about 100 years each side`);
  assert.equal(new Set(years.map(y => y.key)).size, years.length, `${calendar}: no year twice`);
  assert.equal(years.filter(y => y.selected).length, 1, `${calendar}: the shown year is selected`);
  const at = years.findIndex(y => y.selected);
  assert.ok(at > 80 && at < years.length - 80, `${calendar}: past and future years both offered`);
  for (let i = 1; i < years.length; i += 1) assert.ok(years[i].date > years[i - 1].date, `${calendar}: ascending`);
  // A pick lands in the year it names, on the same day of the year.
  for (const option of [years[0], years[at - 1], years[at + 1], years[years.length - 1]]) {
    const target = months.sameDayInYear(date, option.date, calendar);
    const parts = nativeCalendarParts(target, calendar);
    assert.equal(`${parts.era || ''}|${parts.year}`, option.key, `${calendar}: ${option.label}`);
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
  const leap = noon(2028, 1, 29);
  const common = months.calendarYearOptions(leap, 'gregory').find(y => y.year === '2027');
  assert.equal(months.sameDayInYear(leap, common.date, 'gregory').getMonth(), 2);
  assert.equal(months.sameDayInYear(leap, common.date, 'gregory').getDate(), 1);
}

// Negative: the heading carries no YYYY-MM-DD, the year is never left out, and
// the drop-downs sit under the calendar and are wired to their own events.
{
  const jade = read('client/components/forms/calendarDateInput.jade');
  const js = read('client/components/forms/calendarDateInput.js');
  assert.doesNotMatch(jade, /selected-calendar-date|headingDateText/);
  assert.doesNotMatch(js, /headingDateText|inline \? \{\} : \{ year/);
  for (const name of ['js-calendar-year', 'js-calendar-month', 'js-calendar-day-select']) {
    assert.match(jade, new RegExp(`select\\.${name}\\(aria-label`), `${name} is a select`);
    assert.match(js, new RegExp(`'change \\.${name}'`), `${name} has a handler`);
  }
  assert.doesNotMatch(read('client/components/forms/calendarDateInput.css'), /selected-calendar-date/);
}

console.log('calendarDropdowns: year, month and day lists for ten calendar systems, picks that stay in the named year and month, and no date text in the heading');
