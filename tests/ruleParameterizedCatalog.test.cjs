'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  PARAMETERIZED_ACTIONS,
  PARAMETERIZED_TRIGGERS,
  buildParameterizedAction,
  buildParameterizedTrigger,
} = require('../models/lib/ruleParameterizedCatalog');

const fields = {
  sourceBoardId: 'board-a', actionBoardId: 'board-a',
  triggerCardTitle: 'Card', triggerListName: 'Inbox', triggerSwimlaneName: 'Lane',
  triggerUserId: 'user-a', triggerUsername: 'alice', triggerLabelId: 'label-a',
  triggerChecklistName: 'Steps', triggerChecklistItemName: 'One',
  triggerScheduleType: 'weekly', triggerTime: '14:30', triggerWeekday: '5',
  triggerDayOfMonth: '12', triggerDate: '2026-09-07', triggerDueCondition: 'soon',
  triggerDays: '3', triggerButtonLabel: 'Run it',
  actionCardName: 'Created', actionListName: 'Done', actionFromListName: 'Inbox',
  actionSwimlaneName: 'Lane', actionLabelId: 'label-a', actionUsername: 'alice',
  actionSortField: 'created', actionDateField: 'dueAt', actionAmount: '-2',
  actionUnit: 'weeks', actionColor: 'green', actionChecklistName: 'Steps',
  actionChecklistItemName: 'One', actionChecklistItems: 'One,Two',
  actionEmailTo: 'alice@example.invalid', actionEmailSubject: 'Subject',
  actionEmailMessage: 'Message',
};

test('every advertised parameterized trigger produces one bounded known document', () => {
  assert.equal(new Set(PARAMETERIZED_TRIGGERS.map(entry => entry.value)).size,
    PARAMETERIZED_TRIGGERS.length);
  for (const entry of PARAMETERIZED_TRIGGERS) {
    const document = buildParameterizedTrigger(entry.value, fields);
    assert.equal(typeof document.activityType, 'string', entry.value);
    assert.equal(typeof document.desc, 'string', entry.value);
    assert.ok(!('_id' in document) && !('boardId' in document), entry.value);
  }
});

test('every advertised parameterized action produces one bounded known document', () => {
  assert.equal(new Set(PARAMETERIZED_ACTIONS.map(entry => entry.value)).size,
    PARAMETERIZED_ACTIONS.length);
  for (const entry of PARAMETERIZED_ACTIONS) {
    const document = buildParameterizedAction(entry.value, fields);
    assert.equal(typeof document.actionType, 'string', entry.value);
    assert.equal(typeof document.desc, 'string', entry.value);
    assert.ok(!('_id' in document), entry.value);
  }
});

test('parameters are canonicalized and invalid kinds or giant text are refused', () => {
  const schedule = buildParameterizedTrigger('scheduled-calendar', {
    triggerScheduleType: 'invented', triggerTime: '99:99', triggerWeekday: '100',
  });
  assert.equal(schedule.scheduleType, 'daily');
  assert.equal(schedule.atTime, '09:00');
  assert.equal(schedule.weekday, 1);
  const relative = buildParameterizedAction('set-date-relative', {
    sourceBoardId: 'b', actionDateField: 'other', actionUnit: 'centuries',
    actionAmount: 'Infinity',
  });
  assert.equal(relative.dateField, 'dueAt');
  assert.equal(relative.unit, 'days');
  assert.equal(relative.days, 0);
  assert.throws(() => buildParameterizedTrigger('other'), /Unknown rule trigger/);
  assert.throws(() => buildParameterizedAction('other'), /Unknown rule action/);
  assert.throws(() => buildParameterizedTrigger('card-created', {
    triggerCardTitle: 'x'.repeat(501),
  }), /too long/);
});

