'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scheduleText } = require('../../models/lib/backupPaths');
// Point at @breejs/later inside the Meteor bundle being verified. Using the
// real parser matters: the old string-only tests accepted "every day", which
// this parser rejects while returning a misleading first-of-month schedule.
const modulePath = process.env.WEKAN_BACKUP_TEST_LATER_MODULE;
test('backup expressions parse and select the correct next execution', { skip: !modulePath }, () => {
  const later = require(modulePath);
  later.date.UTC();
  const now = new Date('2026-09-23T10:00:00Z');
  for (const [options, expected] of [
    [{ frequency: 'daily', time: '10:01' }, '2026-09-23T10:01:00.000Z'],
    [{ frequency: 'weekly', time: '10:01', dayOfWeek: 'Monday' }, '2026-09-28T10:01:00.000Z'],
    [{ frequency: 'monthly', time: '10:01', dayOfMonth: 1 }, '2026-10-01T10:01:00.000Z'],
  ]) {
    const parsed = later.parse.text(scheduleText(options));
    assert.equal(parsed.error, -1);
    assert.equal(later.schedule(parsed).next(1, now).toISOString(), expected);
  }
  assert.notEqual(later.parse.text('every day at 10:01').error, -1);
});
