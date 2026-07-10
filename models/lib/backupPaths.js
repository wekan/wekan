'use strict';

// Pure, Meteor-free helpers for the Admin Panel / Attachments / Backup feature.
// Unit-tested in tests/backupPaths.test.cjs. Used by server/methods/backup.js.

const path = require('path');

// Resolve the files root from a writable-path base. WeKan's WRITABLE_PATH is
// either the parent of "files" (docker/dev: /data -> /data/files) or already
// ends in "files" (snap: $SNAP_COMMON/files -> unchanged). Handles both the '/'
// and '\\' separator so a Windows path is not double-suffixed.
function filesRootFrom(base) {
  const b = base || '';
  return b.endsWith('/files') || b.endsWith('\\files') ? b : path.join(b, 'files');
}

// Build the synced-cron schedule text for a saved backup schedule.
//   daily   -> "every day at HH:MM"
//   weekly  -> "on <Day> at HH:MM"          (default Sunday)
//   monthly -> "on the <N> day of the month at HH:MM"   (default 1)
// Any other/absent frequency falls back to the daily form.
function scheduleText(s) {
  const settings = s || {};
  const [hh, mm] = (settings.time || '04:00').split(':');
  const at = `at ${hh}:${mm}`;
  if (settings.frequency === 'weekly') return `on ${settings.dayOfWeek || 'Sunday'} ${at}`;
  if (settings.frequency === 'monthly') return `on the ${settings.dayOfMonth || 1} day of the month ${at}`;
  return `every day ${at}`;
}

module.exports = { filesRootFrom, scheduleText };
