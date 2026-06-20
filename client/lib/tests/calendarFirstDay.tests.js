/* eslint-env mocha */
import { expect } from 'chai';
import { toFullCalendarFirstDay } from '/client/lib/calendarFirstDay';

/**
 * Unit tests for the Calendar View start-of-week mapping.
 *
 * Regression coverage for #5521 "Calendar View does not respect the setting of
 * day of week start": the FullCalendar `firstDay` option must be derived from
 * the user's stored `startDayOfWeek` setting (read via getStartDayOfWeek()),
 * which is a zero-based day index (0 = Sunday .. 6 = Saturday). FullCalendar's
 * `firstDay` uses the same convention, so the mapping is the identity for valid
 * inputs and falls back to Monday (1) for anything invalid.
 */
describe('toFullCalendarFirstDay (#5521 calendar start-of-week)', function() {
  it('maps Sunday (0) to firstDay 0', function() {
    expect(toFullCalendarFirstDay(0)).to.equal(0);
  });

  it('maps Monday (1) to firstDay 1', function() {
    expect(toFullCalendarFirstDay(1)).to.equal(1);
  });

  it('maps every valid 0..6 index to itself', function() {
    for (let i = 0; i <= 6; i++) {
      expect(toFullCalendarFirstDay(i)).to.equal(i);
    }
  });

  it('accepts numeric strings like "0" and "6"', function() {
    expect(toFullCalendarFirstDay('0')).to.equal(0);
    expect(toFullCalendarFirstDay('6')).to.equal(6);
  });

  it('tolerates day-name strings', function() {
    expect(toFullCalendarFirstDay('sunday')).to.equal(0);
    expect(toFullCalendarFirstDay('Monday')).to.equal(1);
    expect(toFullCalendarFirstDay('SATURDAY')).to.equal(6);
  });

  it('falls back to Monday (1) for undefined/null/empty', function() {
    expect(toFullCalendarFirstDay(undefined)).to.equal(1);
    expect(toFullCalendarFirstDay(null)).to.equal(1);
    expect(toFullCalendarFirstDay('')).to.equal(1);
  });

  it('falls back to Monday (1) for out-of-range or non-integer values', function() {
    expect(toFullCalendarFirstDay(7)).to.equal(1);
    expect(toFullCalendarFirstDay(-1)).to.equal(1);
    expect(toFullCalendarFirstDay(2.5)).to.equal(1);
    expect(toFullCalendarFirstDay('notaday')).to.equal(1);
    expect(toFullCalendarFirstDay({})).to.equal(1);
  });
});
