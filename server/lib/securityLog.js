// ============================================================================
// WeKan security event logger  (design: docs/Security/Remediation/WeKan.md)
// ----------------------------------------------------------------------------
// Single choke point every runtime security guard funnels through when it
// BLOCKS, SANITIZES or otherwise REMEDIATES a request (SSRF rejection, XSS
// scheme drop, forged-XFF ignore, export-authz denial, invite rate-limit,
// attachment/avatar upload rejection or sanitization, …).
//
// Appends one line per event to
//   <filesRoot>/security/YYYY-MM/DD/HH_MM_SS/wekan-log.txt
// and keeps a running counts-per-category summary in
//   <filesRoot>/security/YYYY-MM/DD/HH_MM_SS/wekan-summary.txt
// (run directory stamped once at process start, UTC).
//
// BEST-EFFORT and MUST NEVER throw into the caller's request path: on low disk,
// an unwritable directory or any error, the event is dropped and a `dropped`
// counter is bumped (surfaced in the summary). Disk space is checked before
// every write; `detail` is truncated/newline-stripped and never contains
// secrets, tokens or raw attacker payloads. Server-only (lives under server/).
//
// The pure format/tally/path/disk helpers live in models/lib/securityLogFormat.js
// so they are unit-testable; this file holds only the stateful writer.
// ============================================================================

import fs from 'fs';
import path from 'path';
const {
  MIN_WRITE_BYTES, runDirFor, formatLine, tallyAdd, renderSummary, hasEnoughDiskSpace,
} = require('/models/lib/securityLogFormat');
const { categoryFor } = require('/models/lib/securityCategories');

const RUN_DATE = new Date();
const RUN_STARTED_ISO = RUN_DATE.toISOString();
let runDir; // undefined = unresolved; null = disabled (couldn't create)
const tally = { total: 0, dropped: 0, byCategory: {}, bySeverity: {}, byAction: {} };

function ensureRunDir() {
  if (runDir !== undefined) return runDir;
  const dir = runDirFor('security', RUN_DATE);
  try {
    if (!hasEnoughDiskSpace(dir, MIN_WRITE_BYTES)) { runDir = null; return null; }
    fs.mkdirSync(dir, { recursive: true });
    runDir = dir;
  } catch (e) {
    runDir = null;
    if (process.env.DEBUG === 'true') console.warn('securityLog: cannot create run dir:', e && e.message);
  }
  return runDir;
}

// Record one security event. Never throws. Pass a catalog `key` (see
// models/lib/securityCategories) and/or explicit fields; explicit wins.
export function record(evt = {}) {
  try {
    const base = evt.key ? categoryFor(evt.key) : {};
    const meta = { ...base, ...evt };
    const dir = ensureRunDir();
    if (!dir) { tally.dropped += 1; return; }
    const line = formatLine({ ...meta, at: new Date().toISOString() }) + '\n';
    if (!hasEnoughDiskSpace(dir, Buffer.byteLength(line) + MIN_WRITE_BYTES)) { tally.dropped += 1; return; }
    fs.appendFileSync(path.join(dir, 'wekan-log.txt'), line);
    tallyAdd(tally, meta);
    fs.writeFileSync(
      path.join(dir, 'wekan-summary.txt'),
      renderSummary(tally, { startedAt: RUN_STARTED_ISO, updatedAt: new Date().toISOString() }),
    );
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('securityLog.record failed:', e && e.message);
  }
}

// Used by the Admin Reports → Security publication/method.
export function currentRunDir() { return ensureRunDir(); }
export function currentTally() { return tally; }

export default { record, currentRunDir, currentTally };
