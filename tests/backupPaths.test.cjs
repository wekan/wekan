'use strict';

// Plain-Node unit test (no Meteor) for the Admin Panel / Attachments / Backup
// path + schedule helpers. Run: node tests/backupPaths.test.cjs

const assert = require('assert');
const { filesRootFrom, scheduleText } = require('../models/lib/backupPaths');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- filesRootFrom ----------------------------------------------------------
test('docker/dev base gets /files appended', () => {
  assert.strictEqual(filesRootFrom('/data'), '/data/files');
  assert.strictEqual(filesRootFrom('/srv/wekan'), '/srv/wekan/files');
});
test('snap base already ending in /files is left unchanged (no double suffix)', () => {
  assert.strictEqual(filesRootFrom('/var/snap/wekan/common/files'), '/var/snap/wekan/common/files');
});
test('Windows base ending in \\files is left unchanged', () => {
  assert.strictEqual(filesRootFrom('C:\\wekan\\files'), 'C:\\wekan\\files');
});
test('empty base does not crash', () => {
  assert.strictEqual(filesRootFrom(''), 'files');
  assert.strictEqual(filesRootFrom(undefined), 'files');
});

// --- scheduleText -----------------------------------------------------------
test('daily', () => {
  assert.strictEqual(scheduleText({ frequency: 'daily', time: '04:00' }), 'every day at 04:00');
});
test('weekly uses the given day', () => {
  assert.strictEqual(
    scheduleText({ frequency: 'weekly', dayOfWeek: 'Monday', time: '01:00' }),
    'on Monday at 01:00',
  );
});
test('weekly defaults to Sunday', () => {
  assert.strictEqual(scheduleText({ frequency: 'weekly', time: '02:30' }), 'on Sunday at 02:30');
});
test('monthly uses the given day-of-month', () => {
  assert.strictEqual(
    scheduleText({ frequency: 'monthly', dayOfMonth: 15, time: '03:00' }),
    'on the 15 day of the month at 03:00',
  );
});
test('monthly defaults to the 1st', () => {
  assert.strictEqual(
    scheduleText({ frequency: 'monthly', time: '03:00' }),
    'on the 1 day of the month at 03:00',
  );
});
test('time defaults to 04:00 when missing', () => {
  assert.strictEqual(scheduleText({ frequency: 'daily' }), 'every day at 04:00');
});

// --- NEGATIVE: unknown / absent frequency falls back to the daily form ------
test('unknown frequency falls back to daily', () => {
  assert.strictEqual(scheduleText({ frequency: 'off', time: '05:00' }), 'every day at 05:00');
  assert.strictEqual(scheduleText({ time: '06:00' }), 'every day at 06:00');
  assert.strictEqual(scheduleText({}), 'every day at 04:00');
});

console.log(`\nbackupPaths: ${passed} tests passed`);
