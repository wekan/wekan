'use strict';

// Scheduled rule triggers on a card's due OR start date
// (models/lib/scheduledDueFilter.js). Run: node tests/scheduledDueFilter.test.cjs
//
// #4278 asks for rule reminders to assigned people when a card is due,
// overdue or starting. Due/overdue triggers existed; the trigger can now
// watch the start date, and {assignees} in the email recipient (see
// tests/ruleVariables.test.cjs) sends the reminder to the assignees.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { matchesScheduledDate, scheduledDateField } = require('../models/lib/scheduledDueFilter.js');

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 8, 29, 9, 0, 0);
const card = { dueAt: new Date(now + 10 * DAY), startAt: new Date(now + 1 * DAY) };

// Existing triggers (no dateField) keep watching the due date.
assert.equal(scheduledDateField({}), 'dueAt');
assert.equal(scheduledDateField({ dateField: 'bogus' }), 'dueAt');
assert.equal(matchesScheduledDate(card, { dueCondition: 'soon', days: 2 }, now), false, 'due in 10 days is not within 2');
assert.equal(matchesScheduledDate(card, { dueCondition: 'soon', days: 10 }, now), true);

// Start date: "starts within N days", "should have started", "is set".
const start = { dateField: 'startAt' };
assert.equal(matchesScheduledDate(card, { ...start, dueCondition: 'soon', days: 2 }, now), true);
assert.equal(matchesScheduledDate(card, { ...start, dueCondition: 'soon', days: 0 }, now), false);
const late = { startAt: new Date(now - 3 * DAY) };
assert.equal(matchesScheduledDate(late, { ...start, dueCondition: 'overdue', days: 2 }, now), true);
assert.equal(matchesScheduledDate(late, { ...start, dueCondition: 'overdue', days: 5 }, now), false);
assert.equal(matchesScheduledDate(late, { ...start, dueCondition: 'set' }, now), true);

// Negative: no date, a bad date or an unknown condition never matches.
for (const c of [{}, { startAt: null }, { startAt: 'not a date' }]) {
  assert.equal(matchesScheduledDate(c, { ...start, dueCondition: 'set' }, now), false);
}
assert.equal(matchesScheduledDate(card, { ...start, dueCondition: 'whenever' }, now), false);
assert.equal(matchesScheduledDate(null, start, now), false);

// The scheduler and the trigger form use it.
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
assert.match(read('server/scheduledRules.js'), /cards = cards\.filter\(c => matchesScheduledDate\(c, trigger, now\)\);/);
assert.match(read('client/components/rules/triggers/scheduledTriggers.js'), /dateField,/);
assert.match(read('client/components/rules/triggers/scheduledTriggers.jade'), /option\(value="startAt"\) \{\{_'card-start'\}\}/);

console.log('  ok - scheduled triggers watch the due date or the start date');
