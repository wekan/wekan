'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the production subscriber; storage/delivery is exercised against
// MongoDB in integration/emailOutbox.test.cjs and SMTP in Playwright.
test('production subscriber persists rendered metadata with stable activity identity', async () => {
  let notify; const jobs = [];
  const source = fs.readFileSync(require.resolve('../server/notifications/email.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    Meteor: { startup: fn => fn() }, Notifications: { subscribe: (name, fn) => { notify = fn; } },
    ReactiveCache: { getCurrentSetting: async () => ({ notifyDefaultEmail: true }), getBoard: async () => ({}) },
    TAPi18n: { ensureLanguageLoaded: async () => {}, __: key => key },
    emailOutbox: { hasPending: async () => false, enqueue: async job => jobs.push(job) },
    formatActivityNotificationTitle: title => title, resolveNotificationSetting: () => true,
    require: id => require(`..${id}`), console,
  });
  await notify({ _id: 'watcher', getLanguage: () => 'fi' }, 'Title', 'Description',
    { activityId: 'activity', cardId: 'card', user: 'Author', url: 'https://example.test/card' });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].userId, 'watcher'); assert.equal(jobs[0].eventId, 'activity');
  assert.equal(jobs[0].language, 'fi'); assert.equal(jobs[0].cardId, 'card');
  assert.equal(jobs[0].subject, 'Title'); assert.match(jobs[0].html, /Description/);
});
test('outbox collections are server-only and the scan reschedules even after failure', () => {
  const queue = fs.readFileSync(require.resolve('../server/notifications/emailQueue.js'), 'utf8');
  assert.match(queue, /new Mongo.Collection\('notificationEmailJobs'\)/);
  assert.doesNotMatch(queue, /Meteor\.(publish|methods)\(/);
  assert.match(queue, /finally\s*\{\s*Meteor.setTimeout\(scan, 1000\)/);
  assert.match(queue, /await emailOutbox.drain\(\)/);
  assert.match(queue, /await scan\(\)/);
});
