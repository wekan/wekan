'use strict';

// How the Workload page draws one week of one person (client/components/main/
// workload.js): the colour, the bar and the text, from the numbers the server
// computed (models/lib/workload.js). Pure, so tests/workload.test.cjs checks
// that an overloaded week is red whatever the unit shown.

function round(n, digits = 1) {
  const f = 10 ** digits;
  return Math.round((Number(n) || 0) * f) / f;
}

function hoursLabel(hours, hoursWord = 'h') {
  return `${round(hours)} ${hoursWord}`;
}

// The ISO week number of a 'YYYY-MM-DD' Monday.
function isoWeekNumber(day) {
  const date = new Date(`${day}T00:00:00Z`);
  const thursday = new Date(date.getTime() + (4 - (date.getUTCDay() || 7)) * 86400000);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / 86400000 + 1) / 7);
}

/**
 * @param {Object} week   one entry of report.people[].weeks
 * @param {string} unit   'hours' or 'points'
 * @param {Object} words  { hours: 'h', points: 'pt' }
 */
function workloadCell(week, unit = 'hours', words = {}) {
  const hoursWord = words.hours || 'h';
  const pointsWord = words.points || 'pt';
  const state = week.overloaded ? 'is-over' : (week.underloaded ? 'is-under' : 'is-ok');
  let barWidth = 0;
  if (week.capacityHours > 0) barWidth = Math.min(100, Math.round(week.loadHours / week.capacityHours * 100));
  else if (week.loadHours > 0) barWidth = 100;
  const value = unit === 'points'
    ? `${round(week.loadPoints)} ${pointsWord}`
    : `${round(week.loadHours)} / ${round(week.capacityHours)} ${hoursWord}`;
  let percentLabel = '';
  if (unit !== 'points') {
    if (week.utilization === null) percentLabel = '∞ %';
    else if (week.capacityHours > 0 || week.loadHours > 0) percentLabel = `${week.utilization} %`;
  }
  return {
    state,
    barWidth,
    value,
    percentLabel,
    allocationPercent: week.allocationPercent || 0,
    absentDays: week.absentDays || 0,
    holidayDays: week.holidayDays || 0,
  };
}

module.exports = { workloadCell, hoursLabel, isoWeekNumber, round };
