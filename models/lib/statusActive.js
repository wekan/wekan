'use strict';

// Pure decision: is a persisted migration / board-repair status doc STILL
// running, or is its `running:true` stale? (#6520)
//
// The Admin Panel → Problems "Status" page and `snap run wekan.problems` list
// every migration/repair whose status doc has `running:true`. That flag can be
// left set even when nothing is running:
//   * a completion write ("running:false, completed") can race with a late,
//     fire-and-forget progress write ("running:true, 146/146 boards") and lose,
//     pinning the doc at "running 146/146" — the exact "Board data-repair —
//     146/146 boards" that never clears in #6520;
//   * a process killed mid-repair leaves `running:true` with no completion write
//     at all.
// Either way the page showed the migration/repair "in progress" forever (and,
// via the login-problem check, a matching "Migration or repair" warning).
//
// A doc counts as active only when ALL of these hold:
//   * `running` is truthy,
//   * it is not in a terminal phase (completed / error / done),
//   * if it reports a total, it has NOT already reached it (done >= total is
//     finished, e.g. 146/146),
//   * it was updated recently — a running flag with no recent progress write is a
//     crashed run, not live work.
//
// Pure and side-effect free so it is unit-testable and identical on the server
// and in `snap run wekan.problems`.

const DEFAULT_STALE_MS = 10 * 60 * 1000; // 10 minutes

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// doc: the status document. opts.now (ms) and opts.staleMs override the clock and
// the staleness window (for tests / env tuning).
function isStatusActive(doc, opts) {
  const o = opts || {};
  const now = Number.isFinite(o.now) ? o.now : Date.now();
  const staleMs = Number.isFinite(o.staleMs) && o.staleMs > 0 ? o.staleMs : DEFAULT_STALE_MS;

  if (!doc || !doc.running) return false;

  const phase = doc.phase;
  if (phase === 'completed' || phase === 'error' || phase === 'done') return false;

  // Finished by count. Use the boards pair, or the collections pair when the
  // boards total is not set (the text migration reports collections while
  // 'migrating' and boards while 'repairing').
  let total = num(doc.boardsTotal);
  let done = num(doc.boardsDone);
  if (total === 0 && num(doc.collectionsTotal) > 0) {
    total = num(doc.collectionsTotal);
    done = num(doc.collectionsDone);
  }
  if (total > 0 && done >= total) return false;

  // Stale: a running flag with no recent update is a crashed / killed run.
  const updated = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  if (updated && now - updated > staleMs) return false;

  return true;
}

module.exports = { isStatusActive, DEFAULT_STALE_MS };
