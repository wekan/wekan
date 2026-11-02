'use strict';

const { nativeCalendarParts } = require('./calendarSystems');

function shiftedDay(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(12, 0, 0, 0);
  return result;
}

// Find real month boundaries by calendar fields, including leap months and
// short thirteenth months. Never approximate a lunar month as a Gregorian one.
function calendarMonthRange(date, calendar, getParts = value => nativeCalendarParts(value, calendar)) {
  const key = value => {
    const parts = getParts(value);
    if (!parts) throw new Error('Unsupported calendar');
    return `${parts.era || ''}|${parts.year}|${parts.month}`;
  };
  const anchor = shiftedDay(date, 0);
  const monthKey = key(anchor);
  let start = anchor;
  let end = shiftedDay(anchor, 1);
  for (let count = 0; count < 40; count += 1) {
    const previous = shiftedDay(start, -1);
    if (key(previous) !== monthKey) break;
    start = previous;
  }
  for (let count = 0; count < 40 && key(end) === monthKey; count += 1) end = shiftedDay(end, 1);
  // FullCalendar expects exclusive midnight boundaries, not the noon used to
  // avoid DST changes while discovering the calendar day.
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

function calendarMonthDays(date, calendar, firstDay = 1, getParts) {
  const range = calendarMonthRange(date, calendar, getParts);
  const days = Array.from({ length: (range.start.getDay() - firstDay + 7) % 7 }, () => null);
  for (let day = shiftedDay(range.start, 0); day < range.end; day = shiftedDay(day, 1)) days.push(day);
  while (days.length % 7) days.push(null);
  return { ...range, days };
}

function shiftCalendarMonth(date, direction, calendar) {
  const range = calendarMonthRange(date, calendar);
  const next = calendarMonthRange(direction < 0 ? shiftedDay(range.start, -1) : range.end, calendar);
  const wantedDay = Number(nativeCalendarParts(date, calendar).day);
  const candidate = shiftedDay(next.start, wantedDay - 1);
  return candidate < next.end ? candidate : shiftedDay(next.end, -1);
}

function calendarYearKey(date, calendar) {
  const parts = nativeCalendarParts(date, calendar);
  return `${parts.era || ''}|${parts.year}`;
}

// The first day (noon) and the day after the last of the calendar year that
// holds `date`.
function calendarYearRange(date, calendar) {
  const key = calendarYearKey(date, calendar);
  let start = shiftedDay(date, 0);
  let end = shiftedDay(date, 1);
  for (let count = 0; count < 400 && calendarYearKey(shiftedDay(start, -1), calendar) === key; count += 1) start = shiftedDay(start, -1);
  for (let count = 0; count < 400 && calendarYearKey(end, calendar) === key; count += 1) end = shiftedDay(end, 1);
  return { start, end };
}

// The same day of the year in the year that holds `target`, or that year's
// last day when it is shorter.
function sameDayInYear(date, target, calendar) {
  const current = calendarYearRange(date, calendar);
  const next = calendarYearRange(target, calendar);
  const offset = Math.round((shiftedDay(date, 0) - current.start) / 86400000);
  const candidate = shiftedDay(next.start, offset);
  return candidate < next.end ? candidate : shiftedDay(next.end, -1);
}

function shiftCalendarYear(date, direction, calendar) {
  const current = calendarYearRange(date, calendar);
  const next = calendarYearRange(direction < 0 ? shiftedDay(current.start, -1) : current.end, calendar);
  return sameDayInYear(date, next.start, calendar);
}

// #6853: the year as a person counts it in this calendar, as a whole number
// that may be zero or negative: 2026, then 1 for the first year of the era,
// then 0 for the year before it (1 BC), -1 for 2 BC - so that any year, ancient
// or far ahead, is one number to type or to step to. null when the calendar or
// the date is unsupported.
const BEFORE_ERA = /^(BC|BCE|BH|ERA0|Before)/i;
function calendarSignedYear(date, calendar) {
  const parts = nativeCalendarParts(date, calendar);
  const year = parts && Number(parts.year);
  if (!Number.isFinite(year)) return null;
  return BEFORE_ERA.test(parts.era || '') ? 1 - year : year;
}

// A day in the year `target` (a signed year, see above) of the calendar, the
// same day of the year as `date` has in its own year, or null when no such day
// can be represented (a JavaScript date reaches about 275,000 years either
// side of 1970). The year is not walked to: each step moves by the number of
// years still missing times the mean year, which closes in within a handful of
// steps even for a lunar calendar, whose year is 11 days shorter. That keeps a
// jump of several thousand years as cheap as a jump of one.
const MEAN_YEAR_DAYS = 365.2425;
function dateInCalendarYear(date, target, calendar) {
  if (!Number.isInteger(target)) return null;
  try {
    let guess = shiftedDay(date, 0);
    for (let step = 0; step < 40; step += 1) {
      const year = calendarSignedYear(guess, calendar);
      if (year === null) return null;
      if (year === target) return sameDayInYear(date, guess, calendar);
      const next = shiftedDay(guess, Math.round((target - year) * MEAN_YEAR_DAYS) || (target > year ? 1 : -1));
      if (Number.isNaN(next.getTime())) return null;
      guess = next;
    }
  } catch (error) { /* out of the range a Date can hold */ }
  return null;
}

// The months of the calendar year that holds `date`, each with its first day
// (noon) - leap months and a short thirteenth month included.
function calendarYearMonths(date, calendar) {
  const year = calendarYearRange(date, calendar);
  const current = calendarMonthRange(date, calendar).start.getTime();
  const months = [];
  for (let start = year.start; start < year.end && months.length < 20;) {
    const range = calendarMonthRange(start, calendar);
    months.push({ date: shiftedDay(range.start, 0), selected: range.start.getTime() === current });
    start = shiftedDay(range.end, 0);
  }
  return months;
}

// The day of `date` in the month that starts at `monthStart`, or that month's
// last day when it is shorter.
function sameDayInMonth(date, monthStart, calendar) {
  const next = calendarMonthRange(monthStart, calendar);
  const candidate = shiftedDay(next.start, Number(nativeCalendarParts(date, calendar).day) - 1);
  return candidate < next.end ? candidate : shiftedDay(next.end, -1);
}

module.exports = {
  calendarMonthRange, calendarMonthDays, shiftedDay, shiftCalendarMonth, shiftCalendarYear,
  calendarYearRange, calendarSignedYear, dateInCalendarYear, calendarYearMonths, sameDayInYear, sameDayInMonth,
};
