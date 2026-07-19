// ============================================================================
// WeKan speed / performance event logger  (docs/Security/Remediation/WeKan.md §9)
// ----------------------------------------------------------------------------
// Records performance problems that are NOT auto-remediated (a slow method/
// request, an oversized publication, a big board, repeated full scans, …) to
//   <filesRoot>/speed/YYYY-MM/DD/HH_MM_SS/wekan-speed-log.txt
//   <filesRoot>/speed/YYYY-MM/DD/HH_MM_SS/wekan-speed-summary.txt
// It reuses the security logger's pure helpers (same line format, disk-space
// guard, dated run dir, tally/summary) and is likewise best-effort/non-throwing.
// This file lives under server/ so it is server-only.
// ============================================================================

import fs from 'fs';
import path from 'path';
const {
  MIN_WRITE_BYTES, runDirFor, formatLine, tallyAdd, renderSummary, hasEnoughDiskSpace,
} = require('/models/lib/securityLogFormat');

const RUN_DATE = new Date();
const RUN_STARTED_ISO = RUN_DATE.toISOString();
let runDir;
const tally = { total: 0, dropped: 0, byCategory: {}, bySeverity: {}, byAction: {} };

function ensureRunDir() {
  if (runDir !== undefined) return runDir;
  const dir = runDirFor('speed', RUN_DATE);
  try {
    if (!hasEnoughDiskSpace(dir, MIN_WRITE_BYTES)) { runDir = null; return null; }
    fs.mkdirSync(dir, { recursive: true });
    runDir = dir;
  } catch (e) {
    runDir = null;
    if (process.env.DEBUG === 'true') console.warn('speedLog: cannot create run dir:', e && e.message);
  }
  return runDir;
}

// Record one performance event. Never throws.
//   { category:'slow-method', severity:'medium', action:'detected',
//     source:'ddp.method:cardsLoad', detail:'2.4s > 2s threshold' }
export function record(evt = {}) {
  try {
    const meta = {
      category: evt.category || 'performance',
      bleed: evt.bleed || 'SlowBleed',
      severity: evt.severity || 'low',
      action: evt.action || 'detected',
      source: evt.source || '',
      cwe: evt.cwe || '',
      userId: evt.userId,
      detail: evt.detail,
    };
    const dir = ensureRunDir();
    if (!dir) { tally.dropped += 1; return; }
    const line = formatLine({ ...meta, at: new Date().toISOString() }) + '\n';
    if (!hasEnoughDiskSpace(dir, Buffer.byteLength(line) + MIN_WRITE_BYTES)) { tally.dropped += 1; return; }
    fs.appendFileSync(path.join(dir, 'wekan-speed-log.txt'), line);
    tallyAdd(tally, meta);
    fs.writeFileSync(
      path.join(dir, 'wekan-speed-summary.txt'),
      renderSummary(tally, { title: 'WeKan speed summary', startedAt: RUN_STARTED_ISO, updatedAt: new Date().toISOString() }),
    );
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('speedLog.record failed:', e && e.message);
  }
}

export function currentRunDir() { return ensureRunDir(); }
export function currentTally() { return tally; }

export default { record, currentRunDir, currentTally };
