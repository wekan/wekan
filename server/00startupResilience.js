// ============================================================================
// A busy database must not cost WeKan its boot (#6533).
//
// Meteor runs every `Meteor.startup` callback from boot.js, and a callback that
// throws - or returns a promise that rejects - makes boot.js print
// "error on boot.js" and EXIT the process. Under systemd that is a restart, and
// a restart re-runs every startup callback, on a database that is busy because
// the previous boot was doing exactly the same work. The reporter's server was
// at restart number 72, each restart re-scanning 130,947 cards, and the error
// that started it was one write losing a race:
//
//   error on boot.js Error [ValidationError]: Failed validation
//   [msg_update.go:133 ...] [collection.go:191 sqlite.(*collection).UpdateAll]
//   database is locked (5) (SQLITE_BUSY)
//
// SQLITE_BUSY is transient by definition: it means another writer had the lock,
// not that anything is wrong with the data or the configuration. The right
// answer to it at startup is to log it and carry on serving - the work that
// failed is idempotent and runs again on the next start - rather than to exit
// and make the contention worse.
//
// So every startup callback registered AFTER this file is wrapped: a TRANSIENT
// DATABASE error is logged (and recorded for Admin Panel / Problems, where the
// database stream shows which database said what) and swallowed; anything else
// is rethrown unchanged, so a real misconfiguration still stops WeKan the way it
// always has. This file is named 00* so it loads before the files that register
// those callbacks - Meteor loads a directory's files in alphabetical order.
// ============================================================================
import { Meteor } from 'meteor/meteor';
import { classifyDatabaseError } from '/models/lib/databaseErrors';

// The classifier's ids for "the database was busy / momentarily unreachable".
// Everything else - a syntax error, a permission problem, a full disk - is a
// fault that will not fix itself, and must still be fatal at startup.
const TRANSIENT = new Set([
  'deadlock', // includes SQLite's "database is locked (5) (SQLITE_BUSY)"
  'too-many-connections',
  'connection-lost',
  'timeout',
]);

export function isTransientDatabaseError(error) {
  if (!error) return false;

  const classified = classifyDatabaseError(error);
  return !!classified && TRANSIENT.has(classified.id);
}

const originalStartup = Meteor.startup.bind(Meteor);

Meteor.startup = function wekanGuardedStartup(callback) {
  return originalStartup(async () => {
    try {
      await callback();
    } catch (error) {
      if (!isTransientDatabaseError(error)) throw error;

      const message = (error && (error.reason || error.message)) || String(error);
      console.error(
        '[startup] a startup step could not finish because the database was busy; ' +
        'WeKan continues and the step runs again on the next start:',
        message,
      );

      // Same stream as every other database problem, so Admin Panel / Problems
      // shows it with the database that said it.
      try {
        const { recordDatabaseProblem } = require('/server/lib/databaseProblems');
        recordDatabaseProblem(error, { source: 'startup' });
      } catch (e) {
        /* the recorder is best-effort by design */
      }
    }
  });
};
