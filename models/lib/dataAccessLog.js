'use strict';

// The data-access log (docs/Compliance/README.md WP-11, row 4.2; [HIPAA]
// § 164.312(b), [GDPR] Art. 32(1)(b) and 5(2), [CRA] Annex I Part I(2)(l)):
// who downloaded what - a board, every board, a person's data, an Admin Panel
// list. Admin Panel / People / Audit log / Data access shows it.
//
// One row per person, day, kind of export and target, with a count - never a
// row per download (CLAUDE.md: a summary, never a row per event), so a
// script pulling a board every minute is one row that says 1440, not 1440
// rows. Written by server/lib/dataAccessLog.js for every export route that
// answers 200, and kept as long as the audit log (ADMIN_AUDIT_RETENTION_DAYS).
//
// Pure: tests/dataAccessLog.test.cjs.

// The export routes, most specific first: [pattern, kind, which match is the target].
const ROUTES = Object.freeze([
  [/^\/api\/boards\/([^/]+)\/lists\/[^/]+\/cards\/([^/]+)\/exportPDF$/, 'card-pdf', 2],
  [/^\/api\/boards\/([^/]+)\/charts\/[^/]+\/exportExcel$/, 'chart-excel', 1],
  [/^\/api\/boards\/([^/]+)\/charts\/[^/]+\/exportPDF$/, 'chart-pdf', 1],
  [/^\/api\/boards\/([^/]+)\/export\/csv$/, 'board-csv', 1],
  [/^\/api\/boards\/([^/]+)\/exportExcel$/, 'board-excel', 1],
  [/^\/api\/boards\/([^/]+)\/exportPDF$/, 'board-pdf', 1],
  [/^\/api\/boards\/([^/]+)\/exportZip$/, 'board-zip', 1],
  [/^\/api\/boards\/([^/]+)\/export$/, 'board-json', 1],
  [/^\/api\/export-all-boards\/([^/]+)$/, 'all-boards', 1],
  [/^\/api\/admin\/export\/([^/]+)$/, 'admin-csv', 1],
  [/^\/api\/user\/export$/, 'personal-data', 0],
]);

const MAX_TARGET = 100;

const clean = value => String(value || '').replace(/[^\w.@:-]/g, '').slice(0, MAX_TARGET);

// Which export a request is, or null. The personal-data export's target is
// the account it was for: the one asked for, or the requester's own ('self').
function classifyExport(pathname, query = {}) {
  const path = String(pathname || '').replace(/\/+$/, '');
  for (const [re, kind, group] of ROUTES) {
    const m = re.exec(path);
    if (!m) continue;
    const target = group ? m[group] : (typeof query.userId === 'string' && query.userId ? query.userId : 'self');
    return { kind, target: clean(decodeURIComponentSafe(target)) };
  }
  return null;
}

function decodeURIComponentSafe(value) {
  try { return decodeURIComponent(value); } catch (e) { return value; }
}

function dayOf(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// The one row this download is counted in: its id names the person, the day,
// the kind and the target, so the same download on the same day adds to it.
function foldUpdate({ userId, username, ip, kind, target, at = new Date() }) {
  const day = dayOf(at);
  const who = clean(userId) || '-';
  return {
    selector: { _id: `${day}:${who}:${kind}:${target || '-'}` },
    modifier: {
      $inc: { count: 1 },
      $set: { at, username: String(username || '').slice(0, 200), ip: String(ip || '').slice(0, 100) },
      $setOnInsert: { day, userId: userId || null, kind, target: target || '', firstAt: at },
    },
  };
}

module.exports = { ROUTES, classifyExport, foldUpdate, dayOf };
