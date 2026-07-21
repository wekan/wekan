'use strict';

// #6492 automatic recovery/remediation plan for the SQLite text-data database.
//
// When the text-data database (wekan.sqlite) is checked at startup and found corrupt,
// this pure function decides — from what is available — HOW to recover. It is
// Meteor-free so it can be unit tested in plain Node (see tests/recoveryPlan.test.cjs)
// and is shared by the server recovery module and the startup scripts' helper.
//
// It never decides anything destructive on its own: a healthy or unknown database
// yields action "none". Recovery is only chosen when the database is KNOWN corrupt,
// and then it prefers the least-invasive source that is itself known-good.
//
// Inputs (object; missing fields are treated conservatively):
//   integrity     : 'ok' | 'corrupt' | 'unknown'  (result of the integrity check)
//   hasBackup     : boolean  - a latest backup copy exists (db/backup/wekan.sqlite)
//   backupHealthy : boolean  - that latest backup passed its own integrity check
//                              (default true: assume good unless proven bad)
//   hasPrevBackup : boolean  - a previous-generation backup exists (db/backup/prev)
//   prevHealthy   : boolean  - the previous backup passed its integrity check (default true)
//   hasMongo      : boolean  - a MongoDB source is available to re-migrate text from
//
// Output: { action, reason }, action one of:
//   'none'           - healthy (or unknown): do nothing automatically
//   'restore-backup' - restore from the latest backup copy
//   'restore-prev'   - latest backup missing/bad: restore the previous generation
//   'remigrate'      - no usable backup: re-migrate text data from MongoDB
//                      (filesystem attachments/avatars are untouched)
//   'manual'         - corrupt with no usable backup and no MongoDB: manual recovery
function decideRecovery(opts) {
  const o = opts || {};
  const integrity = o.integrity || 'unknown';

  if (integrity === 'ok') {
    return { action: 'none', reason: 'database integrity check passed' };
  }

  if (integrity !== 'corrupt') {
    // Unknown/unchecked: never take a destructive action on a guess.
    return { action: 'none', reason: 'integrity unknown; no automatic action taken' };
  }

  // Database is KNOWN corrupt. Prefer the latest known-good backup, then the previous
  // generation, then a re-migration from MongoDB, else require manual recovery.
  const backupHealthy = o.backupHealthy !== false; // default true
  const prevHealthy = o.prevHealthy !== false; // default true

  if (o.hasBackup && backupHealthy) {
    return { action: 'restore-backup', reason: 'database corrupt; restoring the latest good backup' };
  }

  if (o.hasPrevBackup && prevHealthy) {
    return {
      action: 'restore-prev',
      reason: 'database corrupt and the latest backup is missing/unusable; restoring the previous backup',
    };
  }

  if (o.hasMongo) {
    return {
      action: 'remigrate',
      reason: 'database corrupt and no usable backup; re-migrating text data from MongoDB',
    };
  }

  return {
    action: 'manual',
    reason: 'database corrupt with no usable backup and no MongoDB source; manual recovery required',
  };
}

// isDestructive reports whether an action rewrites the live database (so callers can
// gate it behind extra confirmation / make a safety copy first). "none" and "manual"
// change nothing automatically.
function isDestructive(action) {
  return action === 'restore-backup' || action === 'restore-prev' || action === 'remigrate';
}

module.exports = { decideRecovery, isDestructive };
