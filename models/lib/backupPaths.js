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

// ZipBleed: resolve a path for ONE entry of a restored backup archive, and refuse
// any that escapes the directory it is supposed to land in.
//
// A zip entry carries its own path, chosen by whoever made the archive, and
// `path.join()` RESOLVES `..` segments rather than rejecting them. So an entry named
//
//   2026-07-25_12-00-00/attachments/../../../../etc/cron.d/x
//
// passed the "is this under attachments/" check - its first segment really is
// `attachments` - and then joined its way clean out of the files directory, writing
// wherever the WeKan process could write. That is the classic zip-slip
// (CWE-22 path traversal), and restoring a backup is exactly when you are least
// inclined to inspect the file you were handed.
//
// The rule is the only one that holds: resolve the candidate to an absolute path and
// require it to be the base directory itself or something beneath it. Comparing
// against `base + sep` matters - a plain `startsWith(base)` also accepts a sibling
// directory whose name merely begins with the same letters (`/data/files-evil`).
//
// Returns the absolute destination, or null when the entry must be skipped.
function safeEntryPath(baseDir, segments) {
  if (!baseDir) return null;
  const parts = (Array.isArray(segments) ? segments : []).filter(
    s => typeof s === 'string' && s !== '');
  if (!parts.length) return null;
  const base = path.resolve(baseDir);
  // path.resolve also swallows an ABSOLUTE segment ('/etc/passwd' would discard the
  // base entirely), which the containment check below catches as well.
  const dest = path.resolve(base, ...parts);
  if (dest === base) return null;
  return dest.startsWith(base + path.sep) ? dest : null;
}

// The same problem for the data half of an archive: the entry names the Mongo
// collection to restore into. Anything but a plain name is refused - `system.*`
// collections are internal to the database and are excluded from backups in the
// first place, and a name with a separator or a `$` in it is not a collection
// WeKan ever writes.
function safeCollectionName(name) {
  return typeof name === 'string'
    && /^[A-Za-z0-9_-]+$/.test(name)
    && !name.startsWith('system')
    ? name
    : null;
}

module.exports = { filesRootFrom, scheduleText, safeEntryPath, safeCollectionName };
