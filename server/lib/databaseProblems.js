// Record what the database said, in a form an admin can act on.
//
// WeKan runs on MongoDB or on FerretDB v1 over SQLite, PostgreSQL, MySQL,
// MariaDB or SAP HANA, and each answers a broken query, a full disk or a refused
// login in its own words. Those words reach WeKan as an opaque string, so an
// admin sees "Error 1064 (42000): You have an error in your SQL syntax" with no
// way to know which database said it, that it is FerretDB's bug rather than their
// data, and that upgrading FerretDB is the fix.
//
// classifyDatabaseError does the reading (models/lib/databaseErrors.js, pure and
// unit-tested); this writes the result into the `database` event stream, which
// Admin Panel / Problems shows.

import EventLog from '/models/eventLog';
import { classifyDatabaseError, configuredDatabase } from '/models/lib/databaseErrors';
const { sanitizeDetail } = require('/models/lib/securityLogFormat');

// The same problem can arrive hundreds of times a second - a database that is
// down answers every query. One event per (id, database) per minute is enough to
// see it; more would only make the page unreadable and the collection large.
const RECENT = new Map();
const QUIET_MS = 60 * 1000;

function tooRecent(key) {
  const now = Date.now();
  const last = RECENT.get(key);

  if (last && now - last < QUIET_MS) return true;

  RECENT.set(key, now);

  // The map is bounded by the number of distinct problems, which is small, but
  // an entry nobody has seen for an hour is not worth keeping either.
  if (RECENT.size > 200) {
    for (const [k, t] of RECENT) {
      if (now - t > 60 * QUIET_MS) RECENT.delete(k);
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Database canaries (docs/Security/Remediation/FerretDB.md).
//
// FerretDB writes nothing itself: it refuses the operation and puts a stable
// marker in the error text, and WeKan - which owns the database and the Admin
// Panel - decides what to record. That keeps the whole feature working
// identically on MongoDB, where there is no FerretDB to mark anything and the
// same operations simply never appear.
//
// The id inside `canary:<id>` is FerretDB's, and it is NOT trusted as a
// category: it is matched against a known list, and anything else is recorded
// generically. An error string is attacker-influenced, and a marker parsed out
// of one must never be able to choose which security category it lands in.
const FERRETDB_CANARY_MARKER = 'canary:';
const KNOWN_DB_CANARIES = {
  'db.javascript': 'tried to run server-side JavaScript',
  'db.result-to-collection': 'tried to write a query result into a collection',
  'db.drop-database': 'tried to drop a database',
  'db.server-admin': 'tried to run a server administration command',
  // The database's own last-look iSQL guard|JavaScript heap out of memory|ENOMEM|EMFILE|ENFILE|read-only file system|EROFS|database disk image is malformed|BSONObjectTooLarge refused a statement that carried
  // what only injection produces. WeKan builds no SQL, so this is either a bug
  // in a statement builder or an attack that reached one - both worth an
  // operator's attention (docs/Security/Remediation/FerretDB.md §3b).
  'db.sql-injection': 'the database refused a statement that looked like injected SQL',
};

// Extract the id, the same way FerretDB's own IDOf does, so the two cannot drift.
export function databaseCanaryId(error) {
  const text = (error && (error.message || error.reason)) || (typeof error === 'string' ? error : '');
  if (!text) return '';
  const at = text.indexOf(FERRETDB_CANARY_MARKER);
  if (at < 0) return '';
  let rest = text.slice(at + FERRETDB_CANARY_MARKER.length);
  const end = rest.search(/[\s)]/);
  if (end >= 0) rest = rest.slice(0, end);
  // A marker is an identifier, never a sentence: anything else is not one of
  // ours and is treated as absent.
  return /^[a-z][a-z0-9.-]{0,60}$/.test(rest) ? rest : '';
}

// True when this error WAS a canary and has been recorded as one.
function recordDatabaseCanary(error, options = {}) {
  const id = databaseCanaryId(error);
  if (!id) return false;

  try {
    // Through the ordinary canary path, so a database canary is rate-limited,
    // aggregated and attributed exactly like every other one - and, like every
    // other one, tells the caller nothing.
    const { tripCanary } = require('/server/lib/canary');
    const known = Object.prototype.hasOwnProperty.call(KNOWN_DB_CANARIES, id);
    // SQL injection gets its own canary id: it is a different thing from "an
    // operation the client never issues", and an admin reading the report
    // should not have to open the detail to tell them apart.
    const canaryId = id === 'db.sql-injection' ? 'injection.sql-statement' : 'database.canary';
    tripCanary(canaryId, {
      detail: known ? KNOWN_DB_CANARIES[id] : `unrecognised database canary (${id.slice(0, 30)})`,
      userId: options.userId,
    });
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('database canary reporting failed:', e && e.message);
    }
  }

  return true;
}

// Record one database error. Never throws: this is called from error paths, and
// an error handler that fails is worse than the error it was handling.
export function recordDatabaseProblem(error, options = {}) {
  try {
    // A DATABASE CANARY first: the database refuses operations WeKan never
    // issues - server-side JavaScript, an aggregation writing into a collection,
    // dropping a database, a server-admin command - and marks the refusal
    // `canary:<id>` (.tools/FerretDB internal/util/canary). One of those arriving
    // means something spoke to the database socket that was not WeKan, so it is
    // a SECURITY event with an actor, not a database problem to be triaged. It
    // goes to the security stream and does not fall through to this one, which
    // would file it under "the database said something".
    if (recordDatabaseCanary(error, options)) return null;

    const classified = classifyDatabaseError(error, {
      configured: configuredDatabase(process.env),
      operation: options.operation || '',
    });

    if (tooRecent(`${classified.id}:${classified.database}`)) return classified;

    // Fire-and-forget, like every other event logger here: an error handler
    // that awaits the database is an error handler that hangs when the database
    // is the problem.
    const p = EventLog.insertAsync({
      stream: 'database',
      at: new Date(),
      severity: classified.severity,
      type: classified.id,
      // The three things the page is for: WHICH database, what it means, and
      // what to do about it.
      db: classified.database,
      kind: classified.kind,
      detail: `${classified.means} ${classified.whatToDo}`,
      source: classified.operation || options.source || 'database',
      // One line, control characters out, capped - like every other stream's
      // detail. A database can answer with a whole SQL statement and a stack.
      message: sanitizeDetail(classified.message),
    });

    if (p && typeof p.catch === 'function') p.catch(() => {});

    return classified;
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.error('recordDatabaseProblem failed:', e && e.message);
    }

    return null;
  }
}

// Watch the errors WeKan already surfaces. Meteor routes every uncaught error in
// a method or a publication through Meteor._debug, which is where a database
// error becomes visible without wrapping every call site in the app.
Meteor.startup(() => {
  const original = Meteor._debug;

  Meteor._debug = function wekanDatabaseProblemWatch(...args) {
    try {
      const text = args
        .map(a => (a && a.message) || (typeof a === 'string' ? a : ''))
        .filter(Boolean)
        .join(' ');

      // Database and process-resource failures belong here; unrelated application errors are
      // left to their existing logger.
      if (/mongo|sqlite|postgres|mysql|maria|hdb|SQLSTATE|Error \d+ \(\d{5}\)|SQL guard|JavaScript heap out of memory|ENOMEM|EMFILE|ENFILE|read-only file system|EROFS|database disk image is malformed|BSONObjectTooLarge/i.test(text)) {
        recordDatabaseProblem(text, { source: 'Meteor._debug' });
      }
    } catch (e) { /* never let the watcher break the logger */ }

    return original.apply(this, args);
  };
});
