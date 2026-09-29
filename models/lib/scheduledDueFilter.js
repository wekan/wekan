'use strict';

// Which cards a scheduled "due" rule trigger acts on (server/scheduledRules.js).
// `trigger.dateField` chooses the date: 'dueAt' (default, and every trigger
// saved before #4278) or 'startAt' - "starts within N days" / "should have
// started N days ago". `dueCondition`:
//   set      the date is set
//   soon     the date is ahead, within `days` days
//   overdue  the date passed at least `days` days ago
const DAY_MS = 24 * 60 * 60 * 1000;

function scheduledDateField(trigger) {
  return trigger && trigger.dateField === 'startAt' ? 'startAt' : 'dueAt';
}

function matchesScheduledDate(card, trigger, now = Date.now()) {
  const value = card && card[scheduledDateField(trigger)];
  if (!value) return false;
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return false;
  const window = (Number(trigger && trigger.days) || 0) * DAY_MS;
  switch (trigger && trigger.dueCondition) {
    case 'set': return true;
    case 'soon': return at >= now && at - now <= window;
    case 'overdue': return now - at >= window;
    default: return false;
  }
}

module.exports = { matchesScheduledDate, scheduledDateField };
