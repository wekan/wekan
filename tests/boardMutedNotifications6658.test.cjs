'use strict';

const assert = require('node:assert/strict');
const {
  boardNotificationRecipients,
} = require('../models/lib/boardNotificationRecipients');

const members = [
  { userId: 'watching', isActive: true },
  { userId: 'tracking', isActive: true },
  { userId: 'muted', isActive: true },
  { userId: 'default-muted', isActive: true },
  { userId: 'inactive', isActive: false },
];
const boardWatchers = [
  { userId: 'watching', level: 'watching' },
  { userId: 'tracking', level: 'tracking' },
  { userId: 'muted', level: 'muted' },
  { userId: 'inactive', level: 'watching' },
];

assert.deepEqual(
  boardNotificationRecipients(
    ['watching', 'tracking', 'watching'],
    members,
    boardWatchers,
  ),
  ['watching', 'tracking'],
  'Watching and Tracking active members are notified once',
);

assert.deepEqual(
  boardNotificationRecipients(
    ['muted', 'default-muted', 'inactive', 'not-a-member'],
    members,
    boardWatchers,
  ),
  [],
  'Muted/default-muted, inactive and non-member candidates stay silent',
);

assert.deepEqual(
  boardNotificationRecipients(
    ['muted', 'default-muted', 'inactive', 'not-a-member', 'tracking'],
    members,
    boardWatchers,
    ['muted', 'default-muted', 'inactive', 'not-a-member'],
  ),
  ['muted', 'default-muted', 'tracking'],
  'Explicit list/card subscriptions survive board mute but never bypass membership',
);

assert.deepEqual(
  boardNotificationRecipients(['muted'], members, boardWatchers, ['default-muted']),
  [],
  'An unrelated subscription does not nominate a recipient or unmute assignments',
);

assert.deepEqual(
  boardNotificationRecipients(undefined, undefined, undefined),
  [],
  'missing board data cannot accidentally notify anyone',
);

console.log('boardMutedNotifications6658: muted board boundary passed');
