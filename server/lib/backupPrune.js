'use strict';
// BACKUP_KEEP_DAYS on disk. models/lib/backupRuns.js decides WHICH backups go
// (same scope, older than N days, never the newest); this removes them, and
// only ever a directory inside the backup root that holds a backup.zip.
// Plain CommonJS so tests/backupRuns.test.cjs runs it against a real directory.
const fs = require('fs');
const path = require('path');
const { backupsToPrune } = require('../../models/lib/backupRuns');

function pruneLocalBackups({ backups, backupRoot, keepDays, orgId = null, now = new Date(), log = console }) {
  const doomed = backupsToPrune({ backups, keepDays, orgId, now });
  if (!doomed.length) return 0;
  let root;
  try { root = fs.realpathSync(backupRoot); } catch (_) { return 0; }
  let removed = 0;
  for (const b of doomed) {
    try {
      const dir = fs.realpathSync(path.dirname(b.path));
      if (!dir.startsWith(root + path.sep) || !fs.existsSync(path.join(dir, 'backup.zip'))) continue;
      fs.rmSync(dir, { recursive: true, force: true });
      removed += 1;
      // Tidy the now-empty date directories above it, never the root itself.
      let parent = path.dirname(dir);
      while (parent.startsWith(root + path.sep) && fs.readdirSync(parent).length === 0) {
        fs.rmdirSync(parent);
        parent = path.dirname(parent);
      }
    } catch (e) {
      log.error('[backup] could not delete old backup', b.path, e && e.message);
    }
  }
  if (removed) log.log(`[backup] BACKUP_KEEP_DAYS=${keepDays}: deleted ${removed} old backup(s)`);
  return removed;
}

module.exports = { pruneLocalBackups };
