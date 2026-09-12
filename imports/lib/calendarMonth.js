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

function shiftCalendarYear(date, direction, calendar) {
  const yearKey = value => {
    const parts = nativeCalendarParts(value, calendar);
    return `${parts.era || ''}|${parts.year}`;
  };
  const range = anchor => {
    const key = yearKey(anchor);
    let start = shiftedDay(anchor, 0);
    let end = shiftedDay(anchor, 1);
    for (let count = 0; count < 400 && yearKey(shiftedDay(start, -1)) === key; count += 1) start = shiftedDay(start, -1);
    for (let count = 0; count < 400 && yearKey(end) === key; count += 1) end = shiftedDay(end, 1);
    return { start, end };
  };
  const current = range(date);
  const next = range(direction < 0 ? shiftedDay(current.start, -1) : current.end);
  let offset = 0;
  const anchor = shiftedDay(date, 0);
  for (let day = current.start; day < anchor && offset < 400; day = shiftedDay(day, 1)) offset += 1;
  const candidate = shiftedDay(next.start, offset);
  return candidate < next.end ? candidate : shiftedDay(next.end, -1);
}

module.exports = { calendarMonthRange, calendarMonthDays, shiftedDay, shiftCalendarMonth, shiftCalendarYear };
