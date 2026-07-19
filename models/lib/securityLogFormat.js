'use strict';

// Detail sanitizer for the event log (design: docs/Security/Remediation/WeKan.md §4).
// Events are stored as documents in the existing WeKan database (models/eventLog.js)
// via normal Meteor JavaScript queries, so there are no file/path/schema helpers
// here — only the pure, unit-testable text sanitizer. CommonJS so tests/*.test.cjs
// can load it.

const MAX_DETAIL = 500;

// Collapse to one line, strip ASCII control chars (incl. newlines/tabs/DEL), and
// cap length — a hostile/huge detail can never bloat a row, and since it is stored
// via a Meteor collection insert it is a bound value, never concatenated into a query.
function sanitizeDetail(s) {
  if (s == null) return '';
  let out = String(s).replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (out.length > MAX_DETAIL) out = out.slice(0, MAX_DETAIL - 1) + '…';
  return out;
}

module.exports = { MAX_DETAIL, sanitizeDetail };
