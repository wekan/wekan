'use strict';

// ============================================================================
// Canary tokens — the pure half
// (design: docs/Security/Remediation/WeKan.md §12)
// ----------------------------------------------------------------------------
// A CANARY is a tripwire placed at a point where somebody could TRY to override
// permissions. Ordinary users never reach it: the code path only runs when a
// request asks for something the rules forbid. So a canary trip is not noise -
// it is somebody probing, and it is worth an admin's attention with WHO and
// FROM WHERE attached.
//
// Three properties, and they are the whole point:
//
//   1. SILENT. Tripping a canary changes nothing the caller can observe. The
//      trip function returns `false` so a guard can `return tripCanary(...)` in
//      place of `return false`, and the attacker gets the same refusal, with the
//      same timing and the same message, as before the canary existed. Nothing
//      is ever returned, thrown, delayed or logged back to them.
//   2. BOUNDED. A canary sits on a path an attacker controls and can hit in a
//      loop. Writing one database row per attempt is a denial-of-service the
//      attacker gets for free - CPU on every insert, and a table that grows
//      until the disk is full. So the FIRST trip in a window is recorded and the
//      rest are COUNTED, then flushed as a single summary event when the window
//      closes. The counter map itself is capped, so memory is bounded too.
//   3. ATTRIBUTED. Every trip carries the actor - userId, username and client IP
//      address - so Admin Panel → Problems → Security answers "who tried this,
//      and from where", not just "something happened".
//
// This file is pure and dependency-free (no Meteor, no database, no clock of its
// own), so it is unit tested with plain Node: tests/canaryTokens.test.cjs. The
// runtime half - resolving the actor, applying this limiter, writing the event -
// is server/lib/canary.js.
// ============================================================================

// ---------------------------------------------------------------- the catalog
//
// One entry per tripwire. `key` is the existing securityCategories key, so a
// canary's category, *Bleed name, severity and CWE come from the SAME catalog
// the other guards use and cannot drift from it (models/lib/securityCategories.js).
//
// `what` is the sentence an admin reads. It says what was ATTEMPTED, in the
// terms of the feature, because "authz.board blocked" is not something anyone
// can act on.
const CANARIES = {
  'card.cross-board-move': {
    key: 'authz.board',
    what: 'tried to move a card into a board they cannot write to',
  },
  'card.invisible-parent': {
    key: 'authz.board',
    what: 'tried to set a card parent on a board they cannot see',
  },
  'list.cross-board-move': {
    key: 'authz.board',
    what: 'tried to move a list into a board they cannot write to',
  },
  'swimlane.cross-board-move': {
    key: 'authz.board',
    what: 'tried to move a swimlane into a board they cannot write to',
  },
  'checklist.cross-board-move': {
    key: 'authz.checklist',
    what: 'tried to move a checklist into a board they cannot write to',
  },
  'checklist-item.cross-board-move': {
    key: 'authz.checklist',
    what: 'tried to move a checklist item into a board they cannot write to',
  },
  'attachment.version-path': {
    key: 'authz.file-path',
    what: 'tried to write the on-disk path of an attachment',
  },
  'avatar.version-path': {
    key: 'authz.file-path',
    what: 'tried to write the on-disk path of an avatar',
  },
  'attachment.restricted-field': {
    key: 'authz.file-path',
    what: 'tried to write a restricted attachment field',
  },
  'avatar.restricted-field': {
    key: 'authz.file-path',
    what: 'tried to write a restricted avatar field',
  },
  'avatar.not-owner': {
    key: 'authz.file-path',
    what: "tried to change another user's avatar",
  },
  'comment.foreign-delete': {
    key: 'authz.comment',
    what: "tried to delete another user's comment over the REST API",
  },
  'calendar.import-without-write': {
    key: 'authz.calendar',
    what: 'tried to import iCalendar events as cards without board write access',
  },
  'board.write-without-capability': {
    key: 'authz.assigned',
    what: 'tried to mutate board content without the board write capability',
  },
  'tenant.mutate-without-admin': {
    key: 'authz.tenant',
    what: 'tried to mutate Organization or Team configuration without site-admin access',
  },
  'reaction.foreign': {
    key: 'authz.comment',
    what: "tried to add or remove another user's comment reaction",
  },
  'export.path-outside-storage': {
    key: 'authz.file-path',
    what: 'a stored file path pointed outside the storage root and was not read',
  },
  'card.vote-field': {
    key: 'authz.board',
    what: 'tried to write a vote field directly instead of through the method',
  },
  'card.poker-field': {
    key: 'authz.board',
    what: 'tried to write a poker field directly instead of through the method',
  },
  'user.miniprofile-without-login': {
    key: 'authn.miniprofile',
    what: 'tried to enumerate user mini-profiles without logging in',
  },
  'history.cross-board': {
    key: 'authz.position-history',
    what: 'tried to use position history across a board membership boundary',
  },
  'cas.account-conflict': {
    key: 'authn.cas-link',
    what: 'tried to link a CAS identity to an existing non-CAS account without consent',
  },
  'database.canary': {
    key: 'authz.database',
    what: 'the database refused an operation that WeKan never issues',
  },

  // --- Injection ------------------------------------------------------------
  // WeKan builds no SQL, so a SQL canary can only come from the database's own
  // last-look guard (docs/Security/Remediation/FerretDB.md §3b). NoSQL is the
  // one WeKan can see for itself: a selector that carries an execution
  // operator, or an operator object where the value a user typed belongs.
  'injection.nosql-selector': {
    key: 'injection.nosql',
    what: 'sent a query carrying a database-side execution operator',
  },
  'injection.nosql-operator': {
    key: 'injection.nosql',
    what: 'sent a query operator where a plain value was expected',
  },
  'injection.sql-statement': {
    key: 'injection.sql',
    what: 'the database refused a statement that looked like injected SQL',
  },

  // --- Sanitization ---------------------------------------------------------
  // Sanitizing is routine - a filename gets trimmed, a document gets its
  // formatting normalised - and routine is not worth an admin's attention. What
  // IS worth it is sanitization that removed something DANGEROUS: markup that
  // would have executed, a path that would have escaped its directory, a type
  // that lied about itself. Only those trip.
  'sanitize.dangerous-filename': {
    key: 'file.name',
    what: 'uploaded a filename carrying an exploit pattern',
  },
  'sanitize.path-traversal': {
    key: 'file.name',
    what: 'used a file path that tried to escape its directory',
  },
  'sanitize.dangerous-content': {
    key: 'file.content',
    what: 'uploaded a file whose content had to have active markup removed',
  },
  'sanitize.dangerous-text': {
    key: 'xss.input',
    what: 'submitted text that had to have active markup removed',
  },

  // --- Other common attacks -------------------------------------------------
  'spoof.forwarded-header': {
    key: 'spoofing.xff',
    what: 'sent a forwarded-for header that is not trusted here',
  },
  'brute.login-lockout': {
    key: 'brute.login',
    what: 'was locked out after repeated failed logins',
  },
};

// The id used when a caller passes something not in the catalog. A canary with
// an unknown id must still be RECORDED - losing the event would be the worst
// possible failure mode for a tripwire - it is simply recorded generically.
const UNKNOWN_CANARY = {
  key: 'authz.canary',
  what: 'tripped a canary',
};

/**
 * Look up a canary. Never throws and never returns undefined.
 * @param {string} id
 * @return {{key: string, what: string, id: string, known: boolean}}
 */
function canaryFor(id) {
  const entry = (typeof id === 'string' && CANARIES[id]) || null;
  return {
    id: typeof id === 'string' && id ? id : 'unknown',
    key: (entry || UNKNOWN_CANARY).key,
    what: (entry || UNKNOWN_CANARY).what,
    known: !!entry,
  };
}

/** Every catalogued canary id, for the tests and the docs. */
function canaryIds() {
  return Object.keys(CANARIES).sort();
}

// ------------------------------------------------------------- the rate limit

const DEFAULTS = {
  // How long one (canary, actor) pair is aggregated for. The first trip in a
  // window is recorded immediately - an admin should see a probe promptly - and
  // everything else in the window is counted.
  windowMs: 60 * 1000,
  // How many (canary, actor) pairs are tracked at once. An attacker can vary the
  // actor (a fresh IP per request over a botnet), so this map is the thing that
  // would grow without a cap. At the cap the OLDEST entry is dropped: losing the
  // count of an old, already-reported probe is much cheaper than unbounded
  // memory, and the first trip of every pair was recorded regardless.
  maxTracked: 5000,
  // A hard ceiling on how many events one pair can produce, however long the
  // attack runs: after this many summaries the pair keeps counting but stops
  // writing until it goes quiet for a window. Prevents a slow-but-endless probe
  // from writing one row a minute forever.
  maxEventsPerPair: 60,
};

/**
 * Decides, for each trip, whether to WRITE an event now and what count it
 * carries. Pure: the clock is passed in, so the tests drive time directly.
 *
 * The contract:
 *   - the first trip of a (canary, actor) pair writes immediately, count 1;
 *   - further trips inside the window write nothing and are counted;
 *   - the first trip AFTER the window closes writes a summary carrying the
 *     suppressed count, and opens a new window;
 *   - a pair that has already written `maxEventsPerPair` summaries stops
 *     writing until it goes quiet for a whole window;
 *   - the tracking map never exceeds `maxTracked` entries.
 */
class CanaryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || DEFAULTS.windowMs;
    this.maxTracked = options.maxTracked || DEFAULTS.maxTracked;
    this.maxEventsPerPair = options.maxEventsPerPair || DEFAULTS.maxEventsPerPair;
    // Insertion-ordered, which is what makes the oldest entry cheap to evict.
    this._pairs = new Map();
  }

  /**
   * @param {string} pairKey identifies (canary, actor)
   * @param {number} now epoch ms
   * @return {{write: boolean, count: number, suppressed: number}}
   *   `write` - record an event now. `count` - how many trips it stands for.
   *   `suppressed` - how many of those were not individually recorded.
   */
  consider(pairKey, now) {
    const key = typeof pairKey === 'string' && pairKey ? pairKey : 'unknown';
    const at = typeof now === 'number' && isFinite(now) ? now : 0;
    const existing = this._pairs.get(key);

    if (!existing) {
      this._evictIfFull();
      this._pairs.set(key, { windowStart: at, seen: 1, written: 1, lastSeen: at });
      return { write: true, count: 1, suppressed: 0 };
    }

    // Re-insert so the map stays ordered by RECENCY, not by first sighting;
    // otherwise a long-running attacker would be evicted before a one-off probe.
    this._pairs.delete(key);
    this._pairs.set(key, existing);
    existing.lastSeen = at;

    const windowOpen = at - existing.windowStart < this.windowMs;
    if (windowOpen) {
      existing.seen += 1;
      return { write: false, count: existing.seen, suppressed: existing.seen - 1 };
    }

    // The window closed. Flush what it accumulated, then start a new one.
    const suppressed = Math.max(0, existing.seen - 1);
    existing.windowStart = at;
    const total = existing.seen + 1;
    existing.seen = 1;

    if (existing.written >= this.maxEventsPerPair) {
      // Still counting, no longer writing: an endless probe must not be able to
      // write forever, and by now the admin has 60 events saying so.
      return { write: false, count: total, suppressed };
    }

    existing.written += 1;
    return { write: true, count: total, suppressed };
  }

  /** Drop pairs whose window closed long ago; called by the runtime's sweeper. */
  sweep(now, idleMs) {
    const cutoff = (typeof now === 'number' ? now : 0) - (idleMs || this.windowMs * 10);
    let dropped = 0;
    for (const [key, entry] of this._pairs) {
      if (entry.lastSeen < cutoff) {
        this._pairs.delete(key);
        dropped += 1;
      }
    }
    return dropped;
  }

  size() {
    return this._pairs.size;
  }

  _evictIfFull() {
    while (this._pairs.size >= this.maxTracked) {
      const oldest = this._pairs.keys().next();
      if (oldest.done) return;
      this._pairs.delete(oldest.value);
    }
  }
}

/**
 * The key one canary + one actor are aggregated under. An unauthenticated actor
 * is keyed by IP alone; a logged-in one by userId, so switching IP mid-attack
 * does not reset their counter.
 * @param {string} canaryId
 * @param {{userId?: string, ip?: string}} actor
 * @return {string}
 */
function canaryPairKey(canaryId, actor = {}) {
  const id = typeof canaryId === 'string' && canaryId ? canaryId : 'unknown';
  const userId = actor && typeof actor.userId === 'string' && actor.userId ? actor.userId : '';
  const ip = actor && typeof actor.ip === 'string' && actor.ip ? actor.ip : 'unknown-ip';
  return userId ? `${id} u:${userId}` : `${id} i:${ip}`;
}

/**
 * The `detail` line an event carries. Deliberately says what was attempted and
 * how many times - never the payload, which is attacker-controlled and would
 * turn the security log into an injection sink (the logger truncates and strips
 * control characters as a second line of defence).
 */
function canaryDetail(canary, count, extra) {
  const parts = [canary.what];
  if (typeof extra === 'string' && extra) parts.push(extra);
  if (count > 1) parts.push(`${count} attempts in this window`);
  return parts.join('; ');
}

module.exports = {
  CANARIES,
  UNKNOWN_CANARY,
  DEFAULTS,
  CanaryRateLimiter,
  canaryFor,
  canaryIds,
  canaryPairKey,
  canaryDetail,
};
