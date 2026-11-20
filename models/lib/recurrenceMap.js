'use strict';

// The repeat rules of other tools, as WeKan's card recurrence
// (models/lib/cardRecurrenceSchedule.js: daily, weekly or monthly). A rule
// that is exactly one of those three becomes it; anything else - every two
// weeks, yearly, weekdays only, a count or an end date - returns null, and the
// importer keeps reporting it in the import loss report, because a card that
// repeats on the wrong schedule is worse than one that is imported once.
//
// Pure functions, no Meteor, so every format's mapping is tested in plain Node
// (tests/recurrenceMap.test.cjs).

export const RECURRENCES = ['daily', 'weekly', 'monthly'];

const WORDS = {
  day: 'daily', daily: 'daily', days: 'daily', d: 'daily',
  week: 'weekly', weekly: 'weekly', weeks: 'weekly', w: 'weekly',
  month: 'monthly', monthly: 'monthly', months: 'monthly', m: 'monthly',
};

// iCalendar RRULE (RFC 5545), also TickTick's repeatFlag ("RRULE:FREQ=...").
export function recurrenceFromRRule(rule) {
  if (typeof rule !== 'string' || !rule.trim()) return null;
  const parts = {};
  for (const piece of rule.trim().replace(/^RRULE:/i, '').split(';')) {
    const [key, value] = piece.split('=');
    if (key && value !== undefined) parts[key.trim().toUpperCase()] = value.trim().toUpperCase();
  }
  const freq = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly' }[parts.FREQ];
  if (!freq) return null;
  if (parts.INTERVAL !== undefined && parts.INTERVAL !== '1') return null;
  // A count, an end, or a narrowing to some days is a rule WeKan cannot keep.
  const known = new Set(['FREQ', 'INTERVAL', 'WKST', 'BYDAY', 'BYMONTHDAY']);
  if (Object.keys(parts).some(key => !known.has(key))) return null;
  // One weekday for a weekly rule and one day of the month for a monthly one
  // are what the plain rule already means; more than one is not.
  if (parts.BYDAY !== undefined && (freq !== 'weekly' || parts.BYDAY.includes(','))) return null;
  if (parts.BYMONTHDAY !== undefined && (freq !== 'monthly' || parts.BYMONTHDAY.includes(','))) return null;
  return freq;
}

// Taskwarrior's recur ("daily", "weekly", "monthly", "1w", "P1M" ...), Org
// mode's repeater ("+1w", "++1d", ".+1m"), Obsidian Tasks' and Todoist's
// "every day" / "every week" / "every month", and Microsoft To Do's
// pattern.type with interval 1.
export function recurrenceFromText(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (WORDS[text] && text.length > 1) return WORDS[text];
  let match = /^(?:\.\+|\+\+|\+)1([dwm])$/.exec(text);
  if (match) return WORDS[match[1]];
  match = /^1\s*(d|w|m|day|days|week|weeks|month|months)$/.exec(text) || /^p1([dwm])$/.exec(text);
  if (match) return WORDS[match[1]];
  match = /^every\s+(?:1\s+)?(day|week|month)(?:\s+when\s+done)?$/.exec(text);
  if (match) return WORDS[match[1]];
  return null;
}

export function recurrenceFromMsTodo(recurrence) {
  if (!recurrence || typeof recurrence !== 'object') return null;
  const pattern = recurrence.pattern && typeof recurrence.pattern === 'object' ? recurrence.pattern : {};
  const interval = pattern.interval === undefined ? 1 : Number(pattern.interval);
  if (interval !== 1) return null;
  const range = recurrence.range && typeof recurrence.range === 'object' ? recurrence.range : {};
  if (range.type && range.type !== 'noEnd') return null;
  if (pattern.type === 'daily') return 'daily';
  if (pattern.type === 'weekly') return Array.isArray(pattern.daysOfWeek) && pattern.daysOfWeek.length > 1 ? null : 'weekly';
  if (pattern.type === 'absoluteMonthly') return 'monthly';
  return null;
}

// What a card's recurrence is written as, for the exporters.
export function rruleOf(recurrence) {
  return RECURRENCES.includes(recurrence) ? `FREQ=${recurrence.toUpperCase()}` : null;
}
export function orgRepeaterOf(recurrence) {
  return { daily: '+1d', weekly: '+1w', monthly: '+1m' }[recurrence] || null;
}
export function everyOf(recurrence) {
  return { daily: 'every day', weekly: 'every week', monthly: 'every month' }[recurrence] || null;
}
