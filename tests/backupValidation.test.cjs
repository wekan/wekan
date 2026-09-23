'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateBackupOptions, validateBackupSchedule } = require('../models/lib/backupPaths');
const full = { attachments: true, avatars: true, data: true, storage: 'filesystem',
  enabled: true, frequency: 'daily', time: '04:00', dayOfWeek: 'Monday', dayOfMonth: 1 };
test('daily, weekly and monthly full backups are valid', () => {
  for (const frequency of ['daily', 'weekly', 'monthly']) {
    assert.doesNotThrow(() => validateBackupSchedule({ ...full, frequency }));
  }
});
test('invalid schedules and empty enabled backups are refused before saving', () => {
  for (const override of [{ time: '24:00' }, { time: '04:99' }, { dayOfWeek: 'Moonday' },
    { dayOfMonth: 29 }, { frequency: 'hourly' }, { storage: 'unknown' },
    { data: 'true' }, { attachments: false, avatars: false, data: false }, { enabled: false }]) {
    assert.throws(() => validateBackupSchedule({ ...full, ...override }));
  }
  assert.throws(() => validateBackupOptions({}, 'filesystem'));
});
test('turning scheduling off is allowed even when nothing is selected', () => {
  assert.doesNotThrow(() => validateBackupSchedule({ ...full, enabled: false, frequency: 'off',
    attachments: false, avatars: false, data: false }));
});
