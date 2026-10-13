'use strict';

// A REQUESTED restore, done before FerretDB opens the database: the same step
// as in releases/ferretdb/start-wekan.sh (#6492), in JavaScript because a
// single file has no shell to run that script in.
//
// The request is WEKAN_FORCE_RESTORE, or a RESTORE_REQUESTED file in the
// database directory naming the source: `backup`, `prev`, `continuous` or
// `remigrate`. A known-good copy is copied INTO the live database and its
// stale WAL side-files dropped. Backups are never deleted, and the live
// wekan.sqlite is only ever overwritten, never removed. Every outcome is a
// line in recovery-events.jsonl, which Admin Panel -> Problems -> Recovery
// reads.

const fs = require('node:fs');
const path = require('node:path');

function event(dbDir, type, severity, detail, fsImpl) {
  const line = JSON.stringify({ type, db: 'wekan', severity, source: 'startup', detail, ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z') });
  try {
    fsImpl.appendFileSync(path.join(dbDir, 'recovery-events.jsonl'), `${line}\n`);
  } catch (e) {
    // the event log is a record, not a precondition
  }
}

function sqliteFiles(dir, fsImpl) {
  try {
    return fsImpl.readdirSync(dir).filter(f => /^wekan\.sqlite/.test(f) && fsImpl.statSync(path.join(dir, f)).isFile());
  } catch (e) {
    return [];
  }
}

function copyAll(from, to, fsImpl) {
  const files = sqliteFiles(from, fsImpl);
  fsImpl.mkdirSync(to, { recursive: true });
  for (const f of files) fsImpl.copyFileSync(path.join(from, f), path.join(to, f));
  return files.length;
}

/**
 * @return {{mode: string, result: string}|null} null when nothing was requested
 */
function requestedRestore({ dbDir, env = process.env, fsImpl = fs, log = () => {} }) {
  let mode = env.WEKAN_FORCE_RESTORE || '';
  const marker = path.join(dbDir, 'RESTORE_REQUESTED');
  if (!mode && fsImpl.existsSync(marker)) {
    mode = fsImpl.readFileSync(marker, 'utf8').split(/\r?\n/)[0].replace(/[^a-z]/g, '');
  }
  if (!mode) return null;
  const backup = path.join(dbDir, 'backup');
  const sources = {
    backup,
    prev: path.join(backup, 'prev'),
    continuous: path.join(dbDir, 'continuous-restore'),
  };
  let source = sources[mode] && fsImpl.existsSync(path.join(sources[mode], 'wekan.sqlite')) ? sources[mode] : '';
  try {
    fsImpl.writeFileSync(path.join(dbDir, 'RECOVERY_IN_PROGRESS'), `recovery ${mode}\n`);
  } catch (e) {
    // shown as a recovery page only; the restore itself goes ahead
  }
  // A continuous-backup restore replaces the database the administrator chose
  // to roll back: that one is kept first, beside the staged copy.
  if (mode === 'continuous' && source && fsImpl.existsSync(path.join(dbDir, 'wekan.sqlite'))) {
    try {
      copyAll(dbDir, path.join(dbDir, 'continuous-restore', 'replaced'), fsImpl);
    } catch (e) {
      source = '';
    }
  }
  if (source) {
    try {
      copyAll(source, dbDir, fsImpl);
      // As start-wekan.sh: backups are taken at rest, so their side-files
      // carry nothing, and the live ones would belong to the replaced data.
      for (const side of ['wekan.sqlite-wal', 'wekan.sqlite-shm']) {
        fsImpl.rmSync(path.join(dbDir, side), { force: true });
      }
      event(dbDir, `restore-${mode}`, 'warning', 'Restored wekan.sqlite from a backup copy', fsImpl);
      log(`Recovery: restored text-data database from ${source}.`);
      fsImpl.rmSync(marker, { force: true });
      return { mode, result: 'restored' };
    } catch (e) {
      event(dbDir, 'restore-failed', 'error', 'Could not copy the requested backup; request retained for retry', fsImpl);
      log('Recovery: restore copy failed; request retained for retry.');
      return { mode, result: 'failed' };
    }
  }
  if (mode === 'remigrate') {
    event(dbDir, 'remigrate', 'warning', 'Re-migration of text data from MongoDB requested', fsImpl);
    log('Recovery: re-migration from MongoDB requested.');
    fsImpl.rmSync(marker, { force: true });
    return { mode, result: 'remigrate' };
  }
  event(dbDir, 'manual-required', 'error', 'Requested recovery source is invalid or missing; request retained for retry', fsImpl);
  log('Recovery: requested source is invalid or missing; request retained.');
  return { mode, result: 'missing' };
}

module.exports = { requestedRestore };
