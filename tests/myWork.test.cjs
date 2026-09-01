#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  normalizeChecklistWorkMetadata,
  myWorkDueBucket,
  matchesMyWorkFilter,
} = require('../models/lib/checklistItemWork');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('checklist metadata accepts a valid assignment, due date and earlier reminder', () => {
  const dueAt = new Date('2026-08-18T10:00:00.000Z');
  const remindAt = new Date('2026-08-18T09:00:00.000Z');
  assert.deepEqual(
    normalizeChecklistWorkMetadata({ assigneeId: 'user-1', dueAt, remindAt }),
    { value: { assigneeId: 'user-1', dueAt, remindAt } },
  );
});

test('negative: reminder cannot exist without due date or after it', () => {
  assert.equal(
    normalizeChecklistWorkMetadata({
      assigneeId: 'user-1',
      dueAt: null,
      remindAt: new Date('2026-08-18T09:00:00.000Z'),
    }).error,
    'reminder-requires-due-date',
  );
  assert.equal(
    normalizeChecklistWorkMetadata({
      assigneeId: 'user-1',
      dueAt: new Date('2026-08-18T09:00:00.000Z'),
      remindAt: new Date('2026-08-18T10:00:00.000Z'),
    }).error,
    'reminder-after-due-date',
  );
});

test('old checklist documents remain rollback-compatible when metadata is absent', () => {
  assert.deepEqual(
    normalizeChecklistWorkMetadata({ assigneeId: null, dueAt: null, remindAt: null }),
    { value: { assigneeId: null, dueAt: null, remindAt: null } },
  );
});

test('due buckets split overdue, today, upcoming and undated work', () => {
  const now = new Date(2026, 7, 17, 12, 0, 0);
  assert.equal(myWorkDueBucket(new Date(2026, 7, 16, 23, 59), now), 'overdue');
  assert.equal(myWorkDueBucket(new Date(2026, 7, 17, 23, 59), now), 'today');
  assert.equal(myWorkDueBucket(new Date(2026, 7, 18, 0, 0), now), 'upcoming');
  assert.equal(myWorkDueBucket(null, now), 'none');
});

test('assigned and watching filters use the current user only', () => {
  const entry = {
    assignees: ['owner'],
    watchers: ['watcher'],
  };
  assert.equal(matchesMyWorkFilter(entry, 'assigned', 'owner'), true);
  assert.equal(matchesMyWorkFilter(entry, 'assigned', 'stranger'), false);
  assert.equal(matchesMyWorkFilter(entry, 'watching', 'watcher'), true);
  assert.equal(matchesMyWorkFilter(entry, 'watching', 'stranger'), false);
});

test('schema, API, publication and UI keep work data permission-scoped', () => {
  const model = read('models/checklistItems.js');
  const server = read('server/models/checklistItems.js');
  const permissions = read('server/permissions/checklistItems.js');
  const publications = read('server/publications/cards.js');
  const client = read('client/components/main/myCards.js');
  const router = read('config/router.js');
  const activityServer = read('server/models/activities.js');
  const activityRenderer = read('client/components/activities/activities.jade');
  const notificationIcon = read('client/components/notifications/notificationIcon.jade');
  for (const field of ['assigneeId', 'dueAt', 'remindAt', 'reminderSentAt']) {
    assert.match(model, new RegExp(`${field}:`));
  }
  assert.match(server, /'checklistItems\.setWorkMetadata'/);
  assert.match(server, /allowIsBoardMemberWithWriteAccessByCard\(this\.userId, card\)/);
  assert.match(server, /member\.userId === assigneeId && member\.isActive === true/);
  assert.match(permissions, /protectedWorkFields/);
  assert.match(permissions, /'reminderSentAt'/);
  assert.match(publications, /Meteor\.publish\('myWork'/);
  assert.match(publications, /isAssignedOnlyMember\(board, userId\)/);
  assert.match(publications, /assigneeId: userId/);
  assert.match(client, /ChecklistItems\.find\(\{ assigneeId: userId, isFinished: false \}\)/);
  assert.match(router, /FlowRouter\.route\('\/my-work'/);
  assert.match(activityServer, /activity\.activityType !== 'checklistItemReminder'/);
  assert.match(activityRenderer, /activity\.activityType 'checklistItemAssigned'/);
  assert.match(activityRenderer, /activity\.activityType 'checklistItemReminder'/);
  assert.match(notificationIcon, /'checklistItemAssigned' 'checklistItemReminder'/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}

console.log(`\nmyWork: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
