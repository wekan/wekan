// ============================================================================
// A rejected promise must not take the whole server down (#6533).
//
// The reporter's snap was still in a restart loop after the startup work was made
// resilient, and their log says exactly why:
//
//   SyncedCron: Fatal error encountered (unhandledRejection): ValidationError:
//     ... sqlite.(*collection).UpdateAll ... database is locked (5) (SQLITE_BUSY)
//   SyncedCron: Received UNHANDLED_REJECTION signal - cleaning up running jobs
//   systemd: Main process exited, code=exited, status=1/FAILURE
//
// `quave:synced-cron` installs a process-wide `unhandledRejection` handler and
// calls `process.exit(1)` from it. So ANY unhandled rejection anywhere in WeKan -
// including one write losing a race for the SQLite write lock, which is transient
// by definition - killed the server, systemd restarted it, and the restart made
// the database busier. The restart counter reached 73.
//
// This file takes that decision back, for two reasons:
//
//   * a WeKan server serves everybody using it; ending the process over one
//     failed write is a much larger failure than the one being reported, and it
//     is the loop itself that makes the database unreachable;
//   * SyncedCron's own handler is deliberately polite about it - it only cleans
//     up and exits `if (process.listenerCount('unhandledRejection') === 1)`, i.e.
//     when nothing else has an opinion. Having an opinion here is the documented
//     way to keep it from exiting.
//
// What is NOT changed: nothing is silenced. Every rejection is logged with its
// stack, and a transient database error is also recorded in the `database` event
// stream, so Admin Panel / Problems shows what the database said and how often.
//
// An uncaught EXCEPTION is different: it can leave a request half-done and the
// process in a state nobody reasoned about. A transient database error is still
// survivable there, but anything else keeps the old behaviour and exits, so a
// real fault is not papered over.
// ============================================================================
import { classifyDatabaseError } from '/models/lib/databaseErrors';

// The classifier's ids for "the database was busy / momentarily unreachable" -
// the same list the startup guard uses (server/00startupResilience.js). Everything
// else is a fault that will not fix itself.
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

function record(error, source) {
  try {
    const { recordDatabaseProblem } = require('/server/lib/databaseProblems');
    recordDatabaseProblem(error, { source });
  } catch (e) {
    /* the recorder is best-effort by design */
  }
}

function describe(error) {
  return (error && (error.stack || error.reason || error.message)) || String(error);
}

// Installed as early as server/imports.js can manage, and BEFORE SyncedCron
// starts - though the listener count SyncedCron checks is read when the error
// happens, not when the listener is added, so order only affects which log line
// comes first.
process.on('unhandledRejection', reason => {
  if (isTransientDatabaseError(reason)) {
    console.error(
      '[unhandledRejection] the database was busy; WeKan keeps running and the ' +
      'write is retried by whatever issued it:',
      (reason && (reason.reason || reason.message)) || String(reason),
    );
    record(reason, 'unhandledRejection');
    return;
  }

  // Not a database problem: a real unhandled rejection, worth the whole stack -
  // and still not worth ending everybody's session over.
  console.error('[unhandledRejection] WeKan keeps running:', describe(reason));
});

process.on('uncaughtException', error => {
  if (isTransientDatabaseError(error)) {
    console.error(
      '[uncaughtException] the database was busy; WeKan keeps running:',
      (error && error.message) || String(error),
    );
    record(error, 'uncaughtException');
    return;
  }

  // Anything else: say it plainly and stop, as before. A process that has thrown
  // out of a place nobody handled can be holding half-applied state, and a
  // restart is the honest answer to that.
  console.error('[uncaughtException] WeKan is stopping:', describe(error));
  process.exit(1);
});
