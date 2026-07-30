// ============================================================================
// A write that lost the race for the write lock is retried, not reported (#6533).
//
// The crash loop in #6533 is fixed - a transient database error no longer ends the
// boot (server/00startupResilience.js) or the process (server/00processErrors.js) -
// but the reporter's next log, on 10.49, is the same contention arriving somewhere
// else:
//
//   Exception while invoking method '/users/updateAsync' MongoServerError:
//     [msg_update.go:133 handler.(*Handler).updateDocument]
//     [collection.go:191 sqlite.(*collection).UpdateAll]
//     [db.go:151 fsql.(*DB).InTransaction] database is locked (5) (SQLITE_BUSY)
//
// That error goes to the CLIENT: the method throws, so the user's edit fails and
// they reload to find out what actually happened. And it was promised not to:
// models/lib/databaseErrors.js has classified a locked SQLite as
// `{ id: 'deadlock', act: 'retry' }` with "Retried automatically." since it was
// written, and server/00processErrors.js says "the write is retried by whatever
// issued it" - while NOTHING in WeKan retried anything. `act` had no reader.
//
// SQLITE_BUSY is the one database error a client is supposed to handle itself.
// SQLite has a single writer; a second writer that arrives while the lock is held
// is told to come back, and nothing has been applied - FerretDB takes the lock
// before the transaction (`_txlock=immediate`), so a BUSY answer means the write
// did not happen. Retrying it is the documented behaviour, and the write is the
// same write, so it stays idempotent: Meteor has already chosen the `_id`, and a
// retry that raced a duplicate would be refused by the unique index rather than
// inserted twice.
//
// So every collection write goes through a bounded retry: a few attempts with
// exponential backoff and jitter, capped in both attempts and total time. When it
// still fails the ORIGINAL error is thrown, unchanged, so a database that is
// genuinely stuck looks exactly as it did before and nothing is hidden. Anything
// that is not a transient database error is rethrown on the first attempt.
//
// Bounded on purpose: retrying for long would hold a method invocation - and its
// slot in the connection pool - while the contention it is waiting for gets worse.
// A few hundred milliseconds covers a lock handover; a database that needs more
// than that is a database the admin has to hear about.
//
// WRITES, not reads. Every error in the reports is a write (`UpdateAll`,
// `updateDocument`, `/users/updateAsync`), which is what contends for the one
// writer; SQLite in WAL mode does not block readers against a writer at all, and
// wrapping every read would put this on the hottest path in the server for no
// reported failure.
//
// The retries are counted and summarised at most once a minute, so a contended
// database is visible in the log without the log becoming the new problem, and a
// write that is finally given up on is recorded for Admin Panel / Problems like
// any other database error.
// ============================================================================
import { Mongo } from 'meteor/mongo';
import { isTransientDatabaseError } from '/server/00processErrors';

function intEnv(name, fallback) {
  const n = parseInt(process.env[name], 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Attempts INCLUDING the first, so 5 means one write and four retries.
const MAX_ATTEMPTS = Math.max(1, intEnv('WEKAN_DB_RETRY_ATTEMPTS', 5));
const BASE_DELAY_MS = intEnv('WEKAN_DB_RETRY_BASE_MS', 25);
const MAX_DELAY_MS = intEnv('WEKAN_DB_RETRY_MAX_MS', 400);
// The whole thing, first attempt included. Nothing waits longer than this.
const MAX_TOTAL_MS = intEnv('WEKAN_DB_RETRY_TOTAL_MS', 2000);
const SUMMARY_EVERY_MS = intEnv('WEKAN_DB_RETRY_LOG_MS', 60000);

// The write methods of a Meteor 3 collection. The sync ones are gone on the
// server, so these are all of them.
const WRITE_METHODS = ['insertAsync', 'updateAsync', 'upsertAsync', 'removeAsync'];

const stats = { retried: 0, recovered: 0, gaveUp: 0 };
let lastSummaryAt = 0;

export function busyRetryStats() {
  return { ...stats };
}

// Exponential backoff with full jitter in [0.5, 1.5) of the step, so that N
// writers released by the same lock handover do not all come back together.
function delayFor(attempt) {
  const step = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1));
  return Math.round(step * (0.5 + Math.random()));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function summarise() {
  const now = Date.now();
  if (now - lastSummaryAt < SUMMARY_EVERY_MS) return;
  lastSummaryAt = now;
  console.log(
    `[db-retry] the database was busy: ${stats.retried} write(s) retried, ` +
    `${stats.recovered} succeeded on a retry, ${stats.gaveUp} given up on. ` +
    'Constant contention on SQLite means its single writer is the limit - ' +
    'move the FerretDB backend to PostgreSQL for a busy instance.',
  );
}

// Reporting a problem is itself a write: recordDatabaseProblem inserts into the
// `eventlog` collection, and that insert comes straight back through the wrapper
// below. Its own failure must therefore NOT be reported, or a busy database
// reporting a busy database calls this from inside itself. The event-log write is
// still retried like every other write - it just never files a report about
// itself. (A synchronous flag would not do it: the insert is fire-and-forget, so
// it fails long after this function has returned.)
const NOT_REPORTED = new Set(['eventlog', 'eventlogAcks']);

function record(error, collectionName, method, attempts) {
  if (NOT_REPORTED.has(collectionName)) return;

  try {
    const { recordDatabaseProblem } = require('/server/lib/databaseProblems');
    recordDatabaseProblem(error, {
      source: 'write',
      operation: `${collectionName || 'collection'}.${method} (${attempts} attempts)`,
    });
  } catch (e) {
    /* the recorder is best-effort by design */
  }
}

function nameOf(collection) {
  try {
    return (collection && collection._name) || '';
  } catch (e) {
    return '';
  }
}

function wrap(proto, method) {
  const original = proto[method];
  if (typeof original !== 'function' || original.wekanRetriesBusyWrites) return false;

  // A normal function, not an arrow: `this` is the collection.
  async function wekanRetryingWrite(...args) {
    const startedAt = Date.now();

    for (let attempt = 1; ; attempt += 1) {
      try {
        const result = await original.apply(this, args);
        if (attempt > 1) {
          stats.recovered += 1;
          summarise();
        }
        return result;
      } catch (error) {
        // Not the database being busy: a real failure, and the caller's to see.
        if (!isTransientDatabaseError(error)) throw error;

        const delay = delayFor(attempt);
        const outOfAttempts = attempt >= MAX_ATTEMPTS;
        const outOfTime = Date.now() - startedAt + delay >= MAX_TOTAL_MS;

        if (outOfAttempts || outOfTime) {
          stats.gaveUp += 1;
          record(error, nameOf(this), method, attempt);
          summarise();
          throw error; // unchanged, so nothing is hidden from the caller
        }

        stats.retried += 1;
        await sleep(delay);
      }
    }
  }

  wekanRetryingWrite.wekanRetriesBusyWrites = true;
  proto[method] = wekanRetryingWrite;
  return true;
}

// Wrapped here, from server/imports.js, and therefore OUTSIDE the wrappers
// aldeed:collection2 and matb33:collection-hooks have already put on the same
// prototype. That is deliberate: the error in the report reaches WeKan as
// collection2's ValidationError with the database's message inside it, and only
// the outermost wrapper sees that.
WRITE_METHODS.forEach(method => wrap(Mongo.Collection.prototype, method));
