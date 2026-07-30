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

// Record one database error. Never throws: this is called from error paths, and
// an error handler that fails is worse than the error it was handling.
export function recordDatabaseProblem(error, options = {}) {
  try {
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

      // Only what looks like it came from the database - everything else is
      // somebody else's error and belongs in their log, not in this stream.
      if (/mongo|sqlite|postgres|mysql|maria|hdb|SQLSTATE|Error \d+ \(\d{5}\)|SQL guard/i.test(text)) {
        recordDatabaseProblem(text, { source: 'Meteor._debug' });
      }
    } catch (e) { /* never let the watcher break the logger */ }

    return original.apply(this, args);
  };
});
