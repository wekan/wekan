'use strict';

// #572: per-activity notification options (models/lib/notificationActivityGroups.js).
// Run: node tests/notificationActivityGroups.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { NOTIFICATION_ACTIVITY_GROUPS, GROUP_KEYS, notificationGroupOf, cleanMutedGroups, isActivityMuted } =
  require('../models/lib/notificationActivityGroups.js');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

assert.equal(notificationGroupOf('addedLabel'), 'labels');
assert.equal(notificationGroupOf('addComment'), 'comments');
assert.equal(notificationGroupOf('a-dueAt'), 'dates');
assert.ok(isActivityMuted('removedLabel', ['labels']));
assert.ok(!isActivityMuted('addComment', ['labels']), 'only the muted kind');
assert.ok(!isActivityMuted('addedLabel', []), 'nothing muted is the old behaviour');
assert.ok(!isActivityMuted('addedLabel', undefined));
// Negative: reminders and mentions are never muted here, whatever is stored.
for (const always of ['almostdue', 'pastdue', 'duenow', 'newDue', 'atUserComment']) {
  assert.equal(notificationGroupOf(always), null, always);
  assert.ok(!isActivityMuted(always, GROUP_KEYS), always);
}
assert.deepEqual(cleanMutedGroups(['comments', 'bogus', 'labels', 'labels', 5]), ['labels', 'comments'], 'known keys, once, in order');
assert.deepEqual(cleanMutedGroups('labels'), []);
// Each activity type belongs to one group at most.
const seen = new Map();
for (const [key, types] of Object.entries(NOTIFICATION_ACTIVITY_GROUPS)) {
  for (const type of types) {
    assert.ok(!seen.has(type), `${type} is in both ${seen.get(type)} and ${key}`);
    seen.set(type, key);
  }
}
console.log('  ok - a muted kind of activity is muted, and nothing else');

// Every activity type the app names (an act-* string) is either in a group or
// deliberately never muted, so a new kind of activity is a decision here.
const NEVER_MUTED = new Set(['almostdue', 'pastdue', 'duenow', 'newDue', 'atUserComment', 'activity-notify',
  // Board-level structure changes: not card activity a member follows.
  'removeBoard', 'removeList', 'removeSwimlane', 'addLabel', 'removeLabel', 'createBoard', 'createCustomField',
  'deleteCustomField', 'archivedBoard', 'importBoard']);
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const named = Object.keys(en).filter(key => key.startsWith('act-') && !key.startsWith('act-with')).map(key => key.slice(4));
const unclassified = named.filter(type => !seen.has(type) && !NEVER_MUTED.has(type));
assert.deepEqual(unclassified, [], 'a new activity type needs a group or a reason to stay unmutable');
for (const key of GROUP_KEYS) assert.ok(en[`notification-activity-${key}`], `label for ${key}`);
console.log('  ok - every named activity type is classified, and every group has a label');

// Enforcement where the bell and email are decided, both at plan and delivery.
const plans = read('server/notifications/activityPlans.js');
const access = plans.slice(plans.indexOf('async function assertAccess('), plans.indexOf('async function eligible('));
assert.match(access, /if \(isActivityMuted\(activity\.activityType, user\.profile\?\.notifyMutedActivities\)\) \{\s*throw new Error\('activity-notification-preference-changed'\);/);
assert.match(plans, /assertAccess: \(userId, service\) => assertAccess\(activity, userId, service\)/, 'delivery re-checks it');
const users = read('models/users.js');
assert.match(users, /'profile\.notifyMutedActivities\.\$': \{\s*type: String,\s*allowedValues: GROUP_KEYS,/);
assert.match(users, /async setNotifyMutedActivities\(groups\) \{\s*const muted = cleanMutedGroups\(groups\);/);
assert.match(read('client/components/settings/notificationSettingsPopup.jade'), /if isMemberScope[\s\S]*js-notify-activity\(data-group="\{\{key\}\}"/);
console.log('  ok - the setting is stored validated, shown to the member and enforced before delivery');
