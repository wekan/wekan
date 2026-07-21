'use strict';

// #6492 parser for the recovery-events JSON-lines log that the startup scripts write
// (one JSON object per line) and the WeKan server imports into the recoveryEvents
// collection. Meteor-free so it can be unit tested (see tests/recoveryEventsJsonl.test.cjs).
//
// It is deliberately forgiving: blank lines and malformed/oversized lines are skipped
// (never thrown), and every returned event has a non-empty string `type` with a
// normalized severity.

function parseRecoveryEventsJsonl(text) {
  const out = [];

  if (typeof text !== 'string' || text.length === 0) {
    return out;
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.length > 8192) {
      continue;
    }

    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      continue;
    }

    if (!obj || typeof obj !== 'object' || typeof obj.type !== 'string' || obj.type === '') {
      continue;
    }

    const sev = obj.severity;
    out.push({
      type: obj.type,
      db: typeof obj.db === 'string' ? obj.db : undefined,
      detail: typeof obj.detail === 'string' ? obj.detail : undefined,
      severity: sev === 'warning' || sev === 'error' ? sev : 'info',
      source: typeof obj.source === 'string' ? obj.source : 'startup',
      ts: typeof obj.ts === 'string' ? obj.ts : undefined,
    });
  }

  return out;
}

module.exports = { parseRecoveryEventsJsonl };
