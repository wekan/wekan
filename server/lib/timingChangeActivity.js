// The card date a Cards.before.update records as its a-<field> activity:
// the update's first changed field, when it is one of the four dates.
//
// A date SET carries timeValue; a date CLEARED (unsetDue/unsetStart/unsetEnd/
// unsetReceived send only a $unset, or a null value) carries timeOldValue
// alone - the same record a rule's removeDate writes
// (server/lib/syncRuleCardCommand.js), and the one models/lib/boardTimeline.js
// rewinds a card's dates through. The hook used to read modifier.$set[field]
// whatever the update was, so a $unset alone threw a TypeError inside it and,
// with a $set beside it, wrote timeValue: undefined.
//
// A cleared date is not "a card's date is set or changed" (#2474,
// server/triggersDef.js): isTimingClear() lets the rules skip it.
export const TIMING_FIELDS = ['receivedAt', 'dueAt', 'startAt', 'endAt'];

const has = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

// { field, set: true, value } for a date set, { field, set: false } for a
// date cleared, or null when the update is not a change of a date.
export function timingChange(fieldNames, modifier) {
  const fields = (Array.isArray(fieldNames) ? fieldNames : []).filter(name => name !== 'dateLastActivity');
  const field = fields[0];
  if (!TIMING_FIELDS.includes(field) || !modifier) return null;
  const set = modifier.$set;
  if (has(set, field)) {
    const value = set[field];
    if (value === null || value === undefined || value === '') return { field, set: false };
    return { field, set: true, value };
  }
  if (has(modifier.$unset, field)) return { field, set: false };
  return null;
}

// Is this activity a card date cleared - an a-<date> without a timeValue?
export function isTimingClear(activity) {
  if (!activity || typeof activity.activityType !== 'string') return false;
  const field = activity.activityType.replace(/^a-/, '');
  return activity.activityType.startsWith('a-') && TIMING_FIELDS.includes(field) &&
    (activity.timeValue === undefined || activity.timeValue === null || activity.timeValue === '');
}
