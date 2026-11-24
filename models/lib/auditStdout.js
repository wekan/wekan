'use strict';

// AUDIT_LOG_STDOUT=json (docs/Compliance/README.md WP-11, row 4.3 b; [NIS2]
// Art. 21(2)(b), 23(4), [HIPAA] § 164.308(a)(1)(ii)(D)): every audit row,
// every security problem and every data access is also written to standard
// output as one JSON line, so Docker, journald or Fluent Bit ship it to a
// SIEM without anything new in WeKan.
//
//   {"wekan":"audit","at":"…","actor":"…","method":"…","args":"…","ok":true,"ip":"…"}
//   {"wekan":"security","at":"…","bleed":"…","action":"blocked",…}
//   {"wekan":"data-access","at":"…","username":"…","kind":"board-json",…}
//
// Only the fields listed here, so a line carries what the Admin Panel shows -
// the audit arguments as stored, already redacted (models/lib/adminAudit.js
// auditArgs) - and never anything else of the document.
//
// Pure: tests/dataAccessLog.test.cjs.

const FIELDS = Object.freeze({
  audit: ['at', 'actorId', 'actorUsername', 'method', 'args', 'ok', 'error', 'ip', 'seq', 'hash'],
  security: ['at', 'severity', 'category', 'bleed', 'action', 'source', 'cwe', 'username', 'ip', 'detail', 'count'],
  'data-access': ['at', 'userId', 'username', 'ip', 'kind', 'target'],
});

function stdoutEnabled(env = { AUDIT_LOG_STDOUT: process.env.AUDIT_LOG_STDOUT }) {
  return String((env && env.AUDIT_LOG_STDOUT) || '').trim().toLowerCase() === 'json';
}

// The line for one record, or null for a kind there is none for.
function stdoutLine(type, doc) {
  const fields = FIELDS[type];
  if (!fields || !doc) return null;
  const out = { wekan: type };
  for (const f of fields) {
    const v = doc[f];
    if (v === undefined || v === null || v === '') continue;
    out[f] = v instanceof Date ? v.toISOString() : v;
  }
  return JSON.stringify(out);
}

// Writes the line when AUDIT_LOG_STDOUT=json; never throws - the record it
// mirrors matters more than the copy of it.
function writeStdout(type, doc, env = { AUDIT_LOG_STDOUT: process.env.AUDIT_LOG_STDOUT }, write = line => process.stdout.write(`${line}\n`)) {
  try {
    if (!stdoutEnabled(env)) return false;
    const line = stdoutLine(type, doc);
    if (!line) return false;
    write(line);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { FIELDS, stdoutEnabled, stdoutLine, writeStdout };
