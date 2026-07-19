'use strict';

// Pure helpers for the WeKan security/speed loggers
// (design: docs/Security/Remediation/WeKan.md §§3-5).
//
// No process-global state and (except hasEnoughDiskSpace) no side effects, so
// they are unit-testable under plain node. CommonJS so tests/*.test.cjs can load
// them directly. server/lib/securityLog.js and speedLog.js consume these.

const fs = require('fs');
const path = require('path');

const SAFETY_MARGIN_BYTES = 16 * 1024 * 1024; // keep 16 MiB free headroom
const MIN_WRITE_BYTES = 64 * 1024;
const MAX_DETAIL = 500;

// The files root attachments/avatars use (server/initializeDirs.js): Snap already
// appends '/files' to WRITABLE_PATH, Docker/dev do not.
function filesRoot(base) {
  const b = base || process.env.WRITABLE_PATH || process.cwd();
  return (b.endsWith('/files') || b.endsWith('\\files')) ? b : path.join(b, 'files');
}

// <filesRoot>/<sub>/YYYY-MM/DD/HH_MM_SS using the given Date's UTC fields.
function runDirFor(sub, date, base) {
  const p = n => String(n).padStart(2, '0');
  const yyyymm = `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}`;
  const dd = p(date.getUTCDate());
  const hms = `${p(date.getUTCHours())}_${p(date.getUTCMinutes())}_${p(date.getUTCSeconds())}`;
  return path.join(filesRoot(base), sub, yyyymm, dd, hms);
}

// Collapse to one line, trim, cap length — a hostile/huge detail can never bloat
// the log or inject extra log lines.
function sanitizeDetail(s) {
  if (s == null) return '';
  let out = String(s).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (out.length > MAX_DETAIL) out = out.slice(0, MAX_DETAIL - 1) + '…';
  return out;
}

// One tab-separated log line (WeKan.md §4).
function formatLine(evt) {
  return [
    evt.at,
    evt.severity || 'info',
    evt.category || 'unknown',
    evt.bleed || 'Generic',
    evt.action || 'detected',
    evt.source || '',
    evt.cwe || '',
    evt.userId ? `user:${evt.userId}` : '-',
    sanitizeDetail(evt.detail),
  ].join('\t');
}

// Fold an event into a running tally (mutates and returns it).
function tallyAdd(tally, evt) {
  tally.total = (tally.total || 0) + 1;
  const c = evt.category || 'unknown';
  tally.byCategory = tally.byCategory || {};
  tally.byCategory[c] = tally.byCategory[c] || { total: 0, byBleed: {} };
  tally.byCategory[c].total += 1;
  const b = evt.bleed || 'Generic';
  tally.byCategory[c].byBleed[b] = (tally.byCategory[c].byBleed[b] || 0) + 1;
  tally.bySeverity = tally.bySeverity || {};
  tally.bySeverity[evt.severity || 'info'] = (tally.bySeverity[evt.severity || 'info'] || 0) + 1;
  tally.byAction = tally.byAction || {};
  tally.byAction[evt.action || 'detected'] = (tally.byAction[evt.action || 'detected'] || 0) + 1;
  return tally;
}

// Human-readable summary text (WeKan.md §5).
function renderSummary(tally, opts) {
  const o = opts || {};
  const title = o.title || 'WeKan security summary';
  const lines = [];
  lines.push(`${title} — run started ${o.startedAt} — updated ${o.updatedAt}`);
  const act = tally.byAction || {};
  const actStr = Object.keys(act).sort().map(a => `${a} ${act[a]}`).join(', ');
  lines.push(`Total events: ${tally.total || 0}   (${actStr})   dropped (low disk): ${tally.dropped || 0}`);
  lines.push('');
  lines.push('By category (general name → count):');
  const cats = Object.keys(tally.byCategory || {}).sort((a, b) => tally.byCategory[b].total - tally.byCategory[a].total);
  for (const c of cats) {
    const cc = tally.byCategory[c];
    const bleeds = Object.keys(cc.byBleed).sort((a, b) => cc.byBleed[b] - cc.byBleed[a])
      .map(b => `${b} ${cc.byBleed[b]}`).join(', ');
    lines.push(`  ${c} … ${cc.total}   [${bleeds}]`);
  }
  lines.push('');
  const sev = tally.bySeverity || {};
  lines.push('By severity: ' + ['critical', 'high', 'medium', 'low', 'info'].map(s => `${s} ${sev[s] || 0}`).join(', '));
  return lines.join('\n') + '\n';
}

// Parse a log line back into an event (for the Admin Report). Returns null on a
// malformed line so a corrupt line is skipped, never crashing the report.
function parseLine(line) {
  if (!line || !line.includes('\t')) return null;
  const c = line.split('\t');
  if (c.length < 9) return null;
  return {
    at: c[0], severity: c[1], category: c[2], bleed: c[3], action: c[4],
    source: c[5], cwe: c[6], user: c[7], detail: c.slice(8).join('\t'),
  };
}

// Enough free space on the fs holding `dir` (or its nearest existing ancestor)
// for `needBytes` + margin? Fail-open (true) if it cannot be measured.
function hasEnoughDiskSpace(dir, needBytes) {
  try {
    let probe = dir;
    while (probe && probe !== path.dirname(probe) && !fs.existsSync(probe)) probe = path.dirname(probe);
    if (typeof fs.statfsSync !== 'function') return true;
    const st = fs.statfsSync(probe);
    return Number(st.bavail) * Number(st.bsize) > needBytes + SAFETY_MARGIN_BYTES;
  } catch (e) {
    return true;
  }
}

module.exports = {
  SAFETY_MARGIN_BYTES, MIN_WRITE_BYTES, MAX_DETAIL,
  filesRoot, runDirFor, sanitizeDetail, formatLine, tallyAdd, renderSummary, parseLine, hasEnoughDiskSpace,
};
