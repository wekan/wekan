'use strict';

// Time-default resolution for the card date pickers (due/start/end/received,
// vote and poker end, date custom fields). Meteor-free so it can be unit
// tested with plain Node (see tests/datePickerDefaultTime.test.cjs).
//
// Issue #1502 ("Add Feature: Set default time for time field"): each date
// popup configures an intended default time — 17:00 for due dates, the
// current time for received/start/end — via setupDatePicker({ defaultTime }).
// The old rendered logic only applied that default inside an
// `if (isValidDate(existing date))` guard, i.e. only when the card ALREADY
// had a date, in which case the input was already filled with that date's
// own time. For a card without a date (the only case a default is for) the
// time input stayed empty and submitting stored a hard-coded 12:00.
//
// These helpers make the behavior explicit:
//  - a card date that exists always shows (and keeps) its own time;
//  - a missing date pre-fills the input with the configured default;
//  - an empty time at submit falls back to the configured default, then 12:00.

// Whether `date` is a real, valid Date instance.
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

// Format a Date's local time as 'HH:mm' (24-hour, zero-padded) — the exact
// value format of a native <input type="time">, in every locale.
function formatTime(date) {
  if (!isValidDate(date)) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Parse a configured default-time string (e.g. '1970-01-01 17:00:00' or a
// full 'YYYY-MM-DD HH:mm' timestamp) into 'HH:mm', or '' when absent/invalid.
function defaultTimeValue(defaultTime) {
  if (!defaultTime) return '';
  const d = new Date(defaultTime);
  return formatTime(d);
}

// The 'HH:mm' value the picker's time input should initially show:
//  - `date` valid (card already has this date) -> that date's own time,
//    never the default;
//  - otherwise -> the configured default time;
//  - no (or unparseable) default -> '' (leave the input empty).
function initialTimeValue(date, defaultTime) {
  if (isValidDate(date)) return formatTime(date);
  return defaultTimeValue(defaultTime);
}

// The 'HH:mm' to store when the form is submitted with an empty time field:
// the configured default when one parses, else the legacy 12:00.
function fallbackSubmitTime(defaultTime) {
  return defaultTimeValue(defaultTime) || '12:00';
}

// Parse a user-typed time string into 'HH:mm', accepting looser formats than
// a bare 'HH:mm' (#2903). `<input type="time">` only ever reports a complete
// 'HH:mm' (or '' when incomplete), so it can never carry an hour-only value
// like '13' through to this code - the time field is a plain text input
// (client/components/forms/datepicker.jade) precisely so a partially typed
// time reaches here instead of being silently discarded by the browser.
// Accepted:
//  - '' / whitespace-only -> '00:00' (a blank time means midnight; the
//    popup's own configured-default behavior for a submitted-empty field
//    stays layered on top of this in fallbackSubmitTime, see #1502 above -
//    this function's empty-string contract is for callers that want the
//    plain "nothing typed" answer);
//  - an hour alone, 0-23, with or without am/pm ('13', '7', '1pm', '1 pm')
//    -> that hour at :00;
//  - 'H:mm' / 'HH:mm', with or without am/pm ('9:05', '13:45', '11:30pm').
// Anything else (letters, out-of-range hours/minutes, garbage) returns null
// so callers keep rejecting it exactly as before.
function parseTimeInput(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (trimmed === '') return '00:00';

  let match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i);
  let hourStr;
  let minuteStr;
  let meridiemStr;
  if (match) {
    [, hourStr, minuteStr, meridiemStr] = match;
  } else {
    match = trimmed.match(/^(\d{1,2})\s*([ap]\.?m\.?)?$/i);
    if (!match) return null;
    [, hourStr, meridiemStr] = match;
    minuteStr = '00';
  }

  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  if (isNaN(hours) || isNaN(minutes) || minutes > 59) return null;

  const meridiem = meridiemStr ? meridiemStr[0].toLowerCase() : null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = meridiem === 'a' ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export {
  isValidDate,
  formatTime,
  initialTimeValue,
  fallbackSubmitTime,
  parseTimeInput,
};
