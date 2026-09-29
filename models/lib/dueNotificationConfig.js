'use strict';

// Pure parsers for the due-date reminder configuration (NOTIFY_DUE_* env vars),
// extracted from models/cards.js so they are unit-testable without Meteor.
// Related to #3192 (due-date reminder mail).

// Parse NOTIFY_DUE_DAYS_BEFORE_AND_AFTER: a comma-separated list of day offsets
// (positive = days before due, 0 = due today, negative = days past due). Each is
// validated to the -14..14 window; invalid/out-of-range entries are dropped.
// Returns an array of integers (possibly empty).
function parseNotifyDueDays(envValue) {
  if (!envValue || typeof envValue !== 'string') return [];
  return envValue
    .split(',')
    .map(value => {
      const iValue = parseInt(value, 10);
      if (Number.isNaN(iValue) || iValue < -14 || iValue > 14) return false;
      return iValue;
    })
    .filter(v => v !== false);
}

// Parse NOTIFY_DUE_AT_HOUR_OF_DAY: the hour of day (0..23) at which to send the
// reminders. Returns the parsed hour, or `defaultHour` when the value is missing,
// non-numeric, or out of range.
//
// #3192: the previous `parseInt(env, 10) || defaultHour` silently turned a valid
// hour of 0 (midnight) into the default (8), because 0 is falsy — so midnight
// reminders were impossible. It also accepted out-of-range hours (e.g. 25, -1).
// Number.isNaN + a 0..23 range check fixes both while keeping the "parse error ->
// default" behaviour.
function parseNotifyDueHour(envValue, defaultHour = 8) {
  const hour = parseInt(envValue, 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return defaultHour;
  return hour;
}

// #5323: a board may set its own reminder offsets (Board Settings ->
// Notifications), overriding NOTIFY_DUE_DAYS_BEFORE_AND_AFTER for that board.
// Same -14..14 window as the environment variable; duplicates removed, at most
// ten offsets, sorted. Returns null for anything that is not a usable list, so
// a malformed value can never silence or flood a board.
const MAX_BOARD_DUE_DAYS = 10;
function normalizeBoardDueDays(value) {
  if (!Array.isArray(value)) return null;
  const days = [];
  for (const entry of value) {
    if (typeof entry !== 'number' || !Number.isInteger(entry) || entry < -14 || entry > 14) return null;
    if (!days.includes(entry)) days.push(entry);
  }
  if (days.length > MAX_BOARD_DUE_DAYS) return null;
  return days.sort((a, b) => b - a);
}

// The text field in Board Settings -> Notifications: "3, 1, 0, -1". Empty text
// means "use the server default" (null); anything unusable returns undefined.
function parseDueReminderInput(text) {
  const trimmed = String(text == null ? '' : text).trim();
  if (!trimmed) return null;
  const parts = trimmed.split(',').map(part => part.trim());
  if (parts.some(part => !/^[+-]?\d+$/.test(part))) return undefined;
  return normalizeBoardDueDays(parts.map(Number)) || undefined;
}

// The offsets that apply to one board: its own list when it has one (an empty
// list turns reminders off for that board), otherwise the server default.
function effectiveDueDays(board, envDays) {
  const own = normalizeBoardDueDays(board && board.dueReminderDays);
  return own || (Array.isArray(envDays) ? envDays : []);
}

// Every offset the scan has to look at: the server default plus any board's.
function dueDaysToScan(envDays, boards) {
  const all = new Set(Array.isArray(envDays) ? envDays : []);
  for (const board of boards || []) {
    for (const day of normalizeBoardDueDays(board && board.dueReminderDays) || []) all.add(day);
  }
  return [...all].sort((a, b) => b - a);
}

// The activity types the reminder scan writes, and their webhook descriptions.
const DUE_REMINDER_ACTIVITIES = ['duenow', 'almostdue', 'pastdue'];
function isDueReminderDescription(description) {
  return DUE_REMINDER_ACTIVITIES.some(type => description === `act-${type}`);
}

export {
  parseNotifyDueDays,
  parseNotifyDueHour,
  normalizeBoardDueDays,
  parseDueReminderInput,
  effectiveDueDays,
  dueDaysToScan,
  isDueReminderDescription,
  DUE_REMINDER_ACTIVITIES,
  MAX_BOARD_DUE_DAYS,
};
