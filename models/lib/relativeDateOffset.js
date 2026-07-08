'use strict';

// Pure, Meteor-free helper for the Rules "set a date field to a relative /
// custom time" action (#5621). Given a base date, a numeric value and a unit,
// it returns a NEW Date offset by `value` units.
//
// Units: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'. Negative values
// move the date earlier ("... earlier"). When the unit is absent (old rules
// created before the unit selector existed) it defaults to DAYS, so existing
// `setDateRelative` action documents keep working unchanged.
//
// Months use a real calendar-month add (setMonth) rather than a fixed 30-day
// approximation, so "+1 month" lands on the same day-of-month next month.

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;

// Normalize the unit to one of the supported keys; unknown/absent => 'days'.
function normalizeUnit(unit) {
  switch (unit) {
    case 'minutes':
    case 'hours':
    case 'days':
    case 'weeks':
    case 'months':
      return unit;
    default:
      return 'days';
  }
}

function relativeDateOffset(baseDate, value, unit) {
  const base = baseDate instanceof Date ? new Date(baseDate.getTime()) : new Date(baseDate);
  const amount = parseInt(value, 10) || 0;
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === 'months') {
    // Calendar-month aware add. Note the JS Date overflow behaviour: e.g.
    // Jan 31 + 1 month has no Feb 31, so it rolls into early March.
    const result = new Date(base.getTime());
    result.setMonth(result.getMonth() + amount);
    return result;
  }

  let offsetMs;
  switch (normalizedUnit) {
    case 'minutes': offsetMs = amount * MS_PER_MINUTE; break;
    case 'hours': offsetMs = amount * MS_PER_HOUR; break;
    case 'weeks': offsetMs = amount * MS_PER_WEEK; break;
    case 'days':
    default: offsetMs = amount * MS_PER_DAY; break;
  }
  return new Date(base.getTime() + offsetMs);
}

module.exports = {
  relativeDateOffset,
  normalizeUnit,
};
