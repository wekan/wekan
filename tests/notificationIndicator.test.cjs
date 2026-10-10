'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../client/components/notifications/notifications.js'), 'utf8');
const start = source.indexOf('Template.notifications.helpers(');
const end = source.indexOf('Template.notifications.events(', start);
let helpers;
let user;
vm.runInNewContext(source.slice(start, end), {
  Template: { notifications: { helpers(value) { helpers = value; } } },
  ReactiveCache: { getCurrentUser: () => user },
  // #5171: client/lib/notificationTray.js - an entry scheduled for later
  // (showAt) is not counted until its time.
  trayEntryVisible: entry => !entry || typeof entry.showAt !== 'number' || entry.showAt <= Date.now(),
});

user = {
  profile: { notifications: [{ activity: 'not-yet-subscribed', read: null }] },
  notifications() { throw new Error('The closed drawer has no activity details'); },
};
assert.equal(helpers.unreadNotifications(), 1);
user.profile.notifications.push({ activity: 'already-read', read: new Date() });
assert.equal(helpers.unreadNotifications(), 1);
user.profile.notifications[0].read = new Date();
assert.equal(helpers.unreadNotifications(), 0);
user = { profile: { notifications: [{ activity: 'later', read: null, showAt: Date.now() + 3600000 }] } };
assert.equal(helpers.unreadNotifications(), 0, 'scheduled for later: not counted yet');
user.profile.notifications[0].showAt = Date.now() - 1000;
assert.equal(helpers.unreadNotifications(), 1, 'its time has come');
for (user of [null, {}, { profile: {} }, { profile: { notifications: [] } }]) {
  assert.equal(helpers.unreadNotifications(), 0);
}
console.log('  ok - the bell counts unread records without drawer data and ignores read or missing notifications');
