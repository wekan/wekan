'use strict';

// Guard: TrayBleed (2026-10-02). profile.notifications was client-writable through the
// Users allow rule ("profile.*"). An entry names an activity, and the
// notification publications send that activity with its card, comments,
// checklists and attachments - from any board. A client may now only mark an
// entry read/unread and remove entries, and an attempt to add or rewrite one
// is recorded in Admin Panel -> Problems.
// Run: node tests/notificationTrayWrite.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const src = read('models/users.js');
const start = src.indexOf('export function writesNotificationList(modifier) {');
const body = src.slice(start, src.indexOf('\n}\n', start) + 2).replace(/^export /, '');
// eslint-disable-next-line no-new-func
const writesNotificationList = new Function(`${body}\nreturn writesNotificationList;`)();

test('the reported shape: adding or rewriting a tray entry is refused', () => {
  for (const modifier of [
    { $push: { 'profile.notifications': { activity: 'foreign' } } },
    { $addToSet: { 'profile.notifications': { activity: 'foreign' } } },
    { $set: { 'profile.notifications': [{ activity: 'foreign' }] } },
    { $set: { 'profile.notifications.0.activity': 'foreign' } },
    { $set: { 'profile.notifications.0': { activity: 'foreign' } } },
    { $rename: { 'profile.notifications': 'x' } },
  ]) assert.equal(writesNotificationList(modifier), true, JSON.stringify(modifier));
});

test('what the client really does stays allowed (negative)', () => {
  for (const modifier of [
    { $set: { 'profile.notifications.3.read': new Date() } },
    { $set: { 'profile.notifications.0.read': null } },
    { $pull: { 'profile.notifications': { activity: 'a1' } } },
    { $set: { 'profile.showDesktopDragHandles': true } },
  ]) assert.equal(writesNotificationList(modifier), false, JSON.stringify(modifier));
  // Those are the only client writes of the tray.
  const client = ['client/components/notifications/notificationsDrawer.js', 'client/components/notifications/notification.js']
    .map(read).join('\n');
  const writes = [...client.matchAll(/update\[`profile\.notifications\.\$\{(\w|\.)+\}\.(\w+)`\]/g)].map(m => m[2]);
  assert.deepEqual([...new Set(writes)], ['read']);
});

test('the deny rule uses it and records the attempt', () => {
  assert.match(src, /return result \|\| writesNotificationList\(modifier\);/);
  const perms = read('server/permissions/users.js');
  assert.match(perms, /if \(writesNotificationList\(modifier\)\) \{[\s\S]{0,200}key: 'authz\.notification-tray', action: 'blocked', source: 'ddp:user-notifications', userId,/);
});
