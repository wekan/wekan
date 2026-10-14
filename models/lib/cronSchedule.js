'use strict';

// Five-field cron expressions for scheduled rules (scheduleKind 'cron'), the
// schedule GitHub Actions workflows use (`on: schedule: - cron: '30 5 * * 1-5'`)
// and the one WeKan's own calendar schedules could not express - so an
// imported workflow keeps its exact schedule.
//
//   minute hour day-of-month month day-of-week     (UTC, as GitHub runs them)
//   *  5  1,15  */2  1-5  MON-FRI  JAN-DEC  7=Sunday
//
// When both day fields are restricted, a day matches either one - the rule
// cron has always had. Pure: tests/cronSchedule.test.cjs; the scan is
// server/scheduledRules.js, once a minute.

const FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] },
  { name: 'day of week', min: 0, max: 7, names: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] },
];

class CronError extends Error {}

function value(text, field) {
  const upper = text.toUpperCase();
  if (field.names && field.names.includes(upper)) return field.names.indexOf(upper) + (field.name === 'month' ? 1 : 0);
  if (!/^\d+$/.test(text)) throw new CronError(`${field.name}: "${text}" is not a number`);
  const n = Number(text);
  if (n < field.min || n > field.max) throw new CronError(`${field.name}: ${n} is out of ${field.min}-${field.max}`);
  return n;
}

function parseField(text, field) {
  const set = new Set();
  for (const part of text.split(',')) {
    const m = /^(\*|[^/-]+(?:-[^/]+)?)(?:\/(\d+))?$/.exec(part);
    if (!m) throw new CronError(`${field.name}: "${part}" is not valid`);
    const step = m[2] ? Number(m[2]) : 1;
    if (step < 1) throw new CronError(`${field.name}: a step must be at least 1`);
    let from;
    let to;
    if (m[1] === '*') { from = field.min; to = field.name === 'day of week' ? 6 : field.max; }
    else if (m[1].includes('-')) { [from, to] = m[1].split('-').map(t => value(t, field)); }
    else { from = value(m[1], field); to = m[2] ? (field.name === 'day of week' ? 6 : field.max) : from; }
    if (from > to) throw new CronError(`${field.name}: ${from}-${to} runs backwards`);
    for (let n = from; n <= to; n += step) set.add(field.name === 'day of week' && n === 7 ? 0 : n);
  }
  return set;
}

/** A parsed expression, or throws CronError saying what is wrong. */
function parseCron(expression) {
  const parts = String(expression || '').trim().split(/\s+/);
  if (parts.length !== 5) throw new CronError('a cron schedule has five fields: minute hour day month weekday');
  const sets = parts.map((p, i) => parseField(p, FIELDS[i]));
  return {
    expression: parts.join(' '),
    minutes: sets[0], hours: sets[1], days: sets[2], months: sets[3], weekdays: sets[4],
    dayRestricted: parts[2] !== '*', weekdayRestricted: parts[4] !== '*',
  };
}

function isValidCron(expression) {
  try { parseCron(expression); return true; } catch (e) { return false; }
}

/** Whether the schedule fires in the minute of `date` (UTC). */
function cronMatches(expressionOrParsed, date) {
  const c = typeof expressionOrParsed === 'string' ? parseCron(expressionOrParsed) : expressionOrParsed;
  const d = new Date(date);
  if (!c.minutes.has(d.getUTCMinutes()) || !c.hours.has(d.getUTCHours()) || !c.months.has(d.getUTCMonth() + 1)) return false;
  const day = c.days.has(d.getUTCDate());
  const weekday = c.weekdays.has(d.getUTCDay());
  if (c.dayRestricted && c.weekdayRestricted) return day || weekday;
  return day && weekday;
}

/** The first minute at or after `from` the schedule fires, within a year, or null. */
function nextCronRun(expression, from = new Date()) {
  const c = parseCron(expression);
  const d = new Date(from);
  d.setUTCSeconds(0, 0);
  for (let i = 0; i < 366 * 24 * 60; i += 1) {
    if (cronMatches(c, d)) return new Date(d);
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  return null;
}

module.exports = { parseCron, isValidCron, cronMatches, nextCronRun, CronError };
