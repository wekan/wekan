'use strict';

// Time entries (docs/Features/Billing/README.md): the time spent on a card,
// each entry with its day and who logged it, so time can be reported and
// invoiced by period.
//
// A card's spentTime stays what it was - the card's total - because the
// timers, the REST API, the imports and every report read and write it. The
// entries are kept in step with it by reconcile() below, run on the server
// whenever a card's spentTime changes (server/timeEntries.js): whatever wrote
// the total, the difference becomes an entry of that day by that user. Time
// spent before entries existed has no day; it becomes one undated "legacy"
// entry, which a period invoice can include on request.
//
// Pure: tests/timeEntries.test.cjs.

const MAX_HOURS = 1000;
const EPSILON = 1e-9;

function fail(message) { throw new Error(message); }

function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) fail('Use a date written YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail('Invalid calendar date');
  return value;
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}

// What a person logs by hand: a day, hours and an optional note.
function normalizeTimeEntry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected an object');
  for (const key of Object.keys(value)) if (!['date', 'hours', 'note'].includes(key)) fail(`Unsupported field: ${key}`);
  const hours = value.hours;
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0 || hours > MAX_HOURS) {
    fail(`Hours must be more than 0 and at most ${MAX_HOURS}`);
  }
  let note = '';
  if (value.note !== undefined && value.note !== null) {
    if (typeof value.note !== 'string' || value.note.length > 500 || value.note.includes('\0')) fail('The note is too long');
    note = value.note.trim();
  }
  return { date: day(value.date), hours: round(hours), note };
}

function sumHours(entries) {
  return round((entries || []).reduce((s, e) => s + (Number.isFinite(e && e.hours) ? e.hours : 0), 0));
}

/**
 * The entries to add so a card's entries sum to its spentTime again.
 *
 * @param {number} previous  spentTime before the change
 * @param {number} now       spentTime after it
 * @param {Array}  entries   the card's entries now
 * @param {string} today     the day of the change
 * @returns {Array} [{ date|null, hours, source }]
 */
function reconcile(previous, now, entries, today) {
  const prev = Number.isFinite(previous) && previous > 0 ? previous : 0;
  const next = Number.isFinite(now) && now > 0 ? now : 0;
  let sum = sumHours(entries);
  const out = [];
  // Time spent before entries were kept: one undated entry for it.
  const unaccounted = round(prev - sum);
  if (unaccounted > EPSILON && !(entries || []).some(e => e.source === 'legacy')) {
    out.push({ date: null, hours: unaccounted, source: 'legacy' });
    sum = round(sum + unaccounted);
  }
  const diff = round(next - sum);
  if (Math.abs(diff) > EPSILON) out.push({ date: day(today), hours: diff, source: 'card' });
  return out;
}

// The entries of a period, both days inclusive; undated ones only when asked.
function entriesInPeriod(entries, { start = null, end = null, includeUndated = false } = {}) {
  return (entries || []).filter(e => {
    if (!e) return false;
    if (!e.date) return includeUndated;
    if (start && e.date < start) return false;
    if (end && e.date > end) return false;
    return true;
  });
}

module.exports = { MAX_HOURS, normalizeTimeEntry, sumHours, reconcile, entriesInPeriod };
