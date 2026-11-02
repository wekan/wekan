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

// #6853: every year a year drop-down offers, `span` years either side of
// `date`, found in the calendar itself. A step of 300 days is shorter than any
// year of any calendar (the shortest, the Islamic one, has 354 days), so no
// year is skipped, and nothing is computed from an assumed year length.
// `era` is set only when the list holds more than one (Japanese, ROC), since a
// lone "AD" or "AP" would only be noise.
function calendarYearOptions(date, calendar, span = 100) {
  const found = new Map();
  const last = shiftedDay(date, Math.round(span * 366));
  for (let day = shiftedDay(date, -Math.round(span * 366)); day <= last; day = shiftedDay(day, 300)) {
    const parts = nativeCalendarParts(day, calendar);
    const key = `${parts.era || ''}|${parts.year}`;
    if (!found.has(key)) found.set(key, { key, year: parts.year, era: parts.era || '', date: day });
  }
  const options = [...found.values()];
  const showEra = new Set(options.map(option => option.era)).size > 1;
  const current = calendarYearKey(date, calendar);
  return options.map(option => ({
    ...option,
    label: showEra && option.era ? `${option.year} ${option.era}` : String(option.year),
    selected: option.key === current,
  }));
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
  calendarYearRange, calendarYearOptions, calendarYearMonths, sameDayInYear, sameDayInMonth,
};
